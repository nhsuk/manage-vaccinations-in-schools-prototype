import {
  Activity,
  AuditEventType,
  ConsentOutcome,
  ConsentWindow,
  InstructionOutcome,
  PreScreenQuestion,
  ProgrammeOutcome,
  ProgrammeType,
  RegistrationOutcome,
  ScreenOutcome,
  TriageOutcome,
  UserRole,
  VaccinationOutcome,
  VaccinationSite,
  VaccineMethod
} from '../enums.js'
import { Gillick } from '../models/gillick.js'
import { Instruction } from '../models/instruction.js'
import { PatientSession } from '../models/patient-session.js'
import { Programme } from '../models/programme.js'
import { Vaccination } from '../models/vaccination.js'
import { today } from '../utils/date.js'
import { stringToBoolean } from '../utils/string.js'

export const patientSessionController = {
  read(request, response, next, nhsn) {
    const { account } = request.app.locals
    const { programme_id } = request.params
    const { activity } = request.query
    const { __ } = response.locals

    const patientSession = PatientSession.findAll(request.session.data)
      .filter(({ programme }) => programme.id === programme_id)
      .find(({ patient }) => patient.nhsn === nhsn)

    const {
      consent,
      consentGiven,
      patient,
      programme,
      record,
      report,
      session,
      triage,
      triageNotes,
      vaccine
    } = patientSession

    const vaccinated = patientSession.siblingPatientSessions.filter(
      ({ outcome }) => outcome !== ProgrammeOutcome.Vaccinated
    )

    const due = patientSession.siblingPatientSessions.filter(
      ({ outcome }) => outcome === ProgrammeOutcome.Due
    )

    // National protocol
    // Nurses can record all vaccines
    // HCAs can record injected flu vaccine, with supplier
    if (session.nationalProtocol) {
      // Upgrade permissions for HCAs
      account.vaccineMethods.push(VaccineMethod.Injection)
    }

    // PSD protocol
    // Nurses can record all vaccines
    // HCAs can record nasal sprays for children with a PSD
    const userIsHCA = account.role === UserRole.HCA
    const patientHasPsd = patientSession.instruct === InstructionOutcome.Given
    if (session.psdProtocol && userIsHCA && patientHasPsd === false) {
      // Downgrade permissions for HCAs as patient doesn’t have a PSD
      account.vaccineMethods = account.vaccineMethods.filter(
        (method) => method !== VaccineMethod.Intranasal
      )
    }

    const userHasSupplier =
      // Injected vaccine using national protocol
      (vaccine?.method === VaccineMethod.Injection &&
        session.nationalProtocol) ||
      // Nasal spray using PGD
      (vaccine?.method === VaccineMethod.Intranasal && !session.psdProtocol)

    response.locals.options = {
      // Show outstanding vaccinations
      showOutstandingVaccinations: vaccinated.length > 0 && due.length > 0,
      // Invite to session
      canInvite: consent === ConsentOutcome.NoRequest,
      // Send a reminder to give consent
      canRemind:
        session.consentWindow === ConsentWindow.Open &&
        !session.isActive &&
        consent === ConsentOutcome.NoResponse,
      // Get verbal consent
      canRespond: !consentGiven,
      // Perform Gillick assessment
      canGillick:
        programme.type !== ProgrammeType.Flu &&
        session.isActive &&
        !consentGiven,
      // Patient can be triaged
      canTriage: consentGiven,
      // Patient needs triage
      needsTriage: triage === TriageOutcome.Needed,
      // Patient already triaged
      hasTriage: triageNotes.length > 0,
      hasSupplier: userIsHCA && userHasSupplier,
      canRecord:
        account.vaccineMethods?.includes(patientSession.vaccine?.method) &&
        record === Activity.Record,
      canReport:
        report === ProgrammeOutcome.Vaccinated &&
        patientSession.lastRecordedVaccination
    }

    response.locals.vaccinationSiteItems = Object.entries(VaccinationSite)
      .filter(([, value]) =>
        [
          VaccinationSite.ArmLeftUpper,
          VaccinationSite.ArmRightUpper,
          VaccinationSite.Other
        ].includes(value)
      )
      .map(([key, value]) => ({
        text: VaccinationSite[key],
        value
      }))

    // Vaccinator has permission to record using the alternative vaccine
    // and patient has consent to vaccinate using the alternative vaccine
    response.locals.canRecordAlternativeVaccine =
      account.vaccineMethods?.includes(programme.alternativeVaccine?.method) &&
      patientSession.canRecordAlternativeVaccine

    const view = request.path.split('/').at(-1)
    response.locals.navigationItems = [
      ...patientSession.siblingPatientSessions.map((patientSession) => ({
        ...(patientSession.report === ProgrammeOutcome.Vaccinated && {
          icon: 'tick'
        }),
        text: patientSession.programme.name,
        href: activity
          ? `${patientSession.uri}?activity=${activity}`
          : patientSession.uri,
        current:
          view !== 'events' && patientSession.programme_id === programme_id
      })),
      ...[
        {
          text: __('patientSession.events.title'),
          href: activity
            ? `${patientSession.uri}/events?activity=${activity}`
            : `${patientSession.uri}/events`,
          current: view === 'events'
        }
      ]
    ]

    response.locals.activity = activity
    response.locals.referrer = activity
      ? `${patientSession.uri}?activity=${activity}`
      : patientSession.uri
    response.locals.patientSession = patientSession
    response.locals.patient = patient
    response.locals.programme = programme
    response.locals.session = session

    // Use different values for pre-screening questions
    // `IsWell` and `IsPregnant` should persist per patient
    response.locals.preScreenQuestionItems =
      vaccine &&
      Object.entries(vaccine.preScreenQuestions).map(([key, text]) => {
        let value = `${programme.id}-${key}`
        if (text === PreScreenQuestion.IsWell) {
          value = `${nhsn}-is-well`
        } else if (text === PreScreenQuestion.IsPregnant) {
          value = `${nhsn}-is-pregnant`
        }

        return { text, value }
      })

    next()
  },

  show(request, response) {
    const view = request.params.view || 'show'

    response.render(`patient-session/${view}`)
  },

  readForm(request, response, next) {
    const { referrer } = request.session
    const { patientSession } = response.locals

    // Show back link to referring page, else patient session page
    response.locals.back = referrer || patientSession.uri

    next()
  },

  showForm(type) {
    return (request, response) => {
      const { view } = request.params

      response.render(`patient-session/form/${view}`, { type })
    }
  },

  register(request, response) {
    const { account } = request.app.locals
    const { register } = request.body.patientSession
    const { data } = request.session
    const { __, patientSession, session, back } = response.locals

    patientSession.registerAttendance(
      {
        createdBy_uid: account.uid
      },
      register
    )

    if (
      register === RegistrationOutcome.Absent &&
      patientSession.report !== ProgrammeOutcome.Eligible
    ) {
      // Record vaccination outcome as absent if safe to vaccinate
      const programme = Programme.findOne(session.programme_ids[0], data)
      const vaccination = Vaccination.create(
        {
          location: session.location.name,
          school_urn: session.school_urn,
          outcome: VaccinationOutcome.Absent,
          patientSession_uuid: patientSession.uuid,
          programme_id: programme.id,
          session_id: session.id,
          vaccine_snomed: patientSession.vaccine.snomed,
          createdAt: today(10),
          createdBy_uid: account.uid
        },
        data
      )

      patientSession.patient.recordVaccination(vaccination)
    }

    // Clean up session data
    delete data.patientSession?.register

    request.flash(
      'message',
      __(`patientSession.registration.success.${patientSession.register}`, {
        patientSession
      })
    )

    response.redirect(back)
  },

  gillick(type) {
    return (request, response) => {
      const { account } = request.app.locals
      const { gillick } = request.body.patientSession
      const { data } = request.session
      const { __, back, patientSession } = response.locals

      if (type === 'edit') {
        gillick.updatedAt = today()
      }

      const name = __(`patientSession.gillick.${type}.success`)
      request.flash('success', name)

      patientSession.assessGillick(
        {
          name,
          createdBy_uid: account.uid
        },
        new Gillick(gillick)
      )

      // Clean up session data
      delete data.patientSession?.gillick

      response.redirect(back)
    }
  },

  preScreen(request, response) {
    const { account } = request.app.locals
    const { preScreen } = request.body.patientSession
    const { data } = request.session
    const { patientSession, programme } = response.locals

    // Pre-screen interview
    patientSession.preScreen({
      note: preScreen.note,
      createdBy_uid: account.uid
    })

    // Pre-screening outcome is to vaccinate with the alternative vaccine
    patientSession.alternative = preScreen.ready === 'alternative'

    // Update patient session
    PatientSession.update(patientSession.uuid, patientSession, data)

    response.redirect(
      `${programme.uri}/vaccinations/new?patientSession_uuid=${patientSession.uuid}`
    )
  },

  vaccination(request, response) {
    const { account } = request.app.locals
    const { data } = request.session
    const { patientSession, session, programme } = response.locals

    // Vaccination
    const vaccination = Vaccination.create(
      {
        outcome: VaccinationOutcome.AlreadyVaccinated,
        patientSession_uuid: patientSession.uuid,
        programme_id: programme.id,
        session_id: session.id,
        createdAt: today(),
        createdBy_uid: account.uid
      },
      data.wizard
    )

    patientSession.patient.recordVaccination(vaccination)

    response.redirect(
      `${programme.uri}/vaccinations/${vaccination.uuid}/new/check-answers?referrer=${patientSession.uri}`
    )
  },

  invite(request, response) {
    const { account } = request.app.locals
    const { __, back, patient, patientSession } = response.locals

    patient.inviteToSession({
      session: patientSession.session,
      createdBy_uid: account.uid
    })

    request.flash(
      'success',
      __('patientSession.invite.success', { parent: patient.parent1 })
    )

    response.redirect(back)
  },

  remind(request, response) {
    const { account } = request.app.locals
    const { back, patient, patientSession } = response.locals

    patientSession.sendReminder(
      {
        createdBy_uid: account.uid
      },
      patient.parent1
    )

    response.redirect(back)
  },

  triage(request, response) {
    const { account } = request.app.locals
    const { triage } = request.body
    const { data } = request.session
    const { __, back, patientSession } = response.locals

    if (triage.psd) {
      const instruction = Instruction.create(
        {
          createdBy_uid: account.uid,
          programme_id: patientSession.programme.id,
          patientSession_uuid: patientSession.uuid
        },
        data
      )

      patientSession.giveInstruction(instruction)
    }

    patientSession.recordTriage({
      outcome: triage.outcome,
      name:
        triage.outcome === ScreenOutcome.NeedsTriage
          ? 'Triaged decision: Keep in triage'
          : `Triaged decision: ${triage.outcome}`,
      note: triage.note,
      createdBy_uid: account.uid
    })

    // Update patient session
    PatientSession.update(patientSession.uuid, patientSession, data)

    // Clean up session data
    delete data.triage

    request.flash('success', __(`triage.edit.success`, { patientSession }))

    response.redirect(back)
  },

  note(request, response) {
    const { account } = request.app.locals
    let { note, pinned } = request.body
    const { data } = request.session
    const { __, back, patientSession } = response.locals

    pinned = stringToBoolean(pinned)

    patientSession.saveNote({
      name: pinned ? AuditEventType.Pinned : AuditEventType.Note,
      note,
      createdBy_uid: account.uid
    })

    // Clean up session data
    delete data.note

    request.flash(
      'success',
      __(`patientSession.notes.new.success`, { patientSession })
    )

    response.redirect(back)
  }
}
