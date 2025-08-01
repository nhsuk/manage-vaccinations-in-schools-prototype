import wizard from '@x-govuk/govuk-prototype-wizard'

import {
  GillickCompetent,
  ReplyDecision,
  ReplyMethod,
  ReplyRefusal,
  VaccinationOutcome
} from '../enums.js'
import { Parent } from '../models/parent.js'
import { PatientSession } from '../models/patient-session.js'
import { Programme } from '../models/programme.js'
import { Reply } from '../models/reply.js'
import { Vaccination } from '../models/vaccination.js'
import { today } from '../utils/date.js'
import { hasAnswersNeedingTriage } from '../utils/reply.js'
import { formatParent } from '../utils/string.js'
import {
  getScreenOutcomesForConsentMethod,
  getScreenVaccinationMethod
} from '../utils/triage.js'

export const replyController = {
  read(request, response, next, reply_uuid) {
    const { nhsn, programme_id } = request.params

    response.locals.reply = Reply.read(reply_uuid, request.session.data)
    response.locals.patientSession = PatientSession.readAll(
      request.session.data
    )
      .filter(({ programme }) => programme.id === programme_id)
      .find(({ patient }) => patient.nhsn === nhsn)

    next()
  },

  redirect(request, response) {
    const { nhsn, programme_id } = request.params

    response.redirect(`/programmes/${programme_id}/patients/${nhsn}`)
  },

  show(request, response) {
    response.render('reply/show')
  },

  new(request, response) {
    const { programme_id, nhsn } = request.params
    const { data } = request.session

    const patientSession = PatientSession.readAll(request.session.data)
      .filter(({ programme }) => programme.id === programme_id)
      .find(({ patient }) => patient.nhsn === nhsn)

    const reply = new Reply(
      {
        child: patientSession.patient,
        patient_uuid: patientSession.patient.uuid,
        programme_id: patientSession.programme.id,
        session_id: patientSession.session.id,
        ...(data.token && { createdBy_uid: data.token?.uid })
      },
      data
    )

    reply.create(reply, data.wizard)

    response.redirect(`${reply.uri}/new/respondent`)
  },

  update(type) {
    return (request, response) => {
      const { reply_uuid } = request.params
      const { data } = request.session
      const { __, activity, patientSession, triage } = response.locals
      const { invalidUuid } = request.app.locals

      let reply
      let next
      if (type === 'edit') {
        reply = Reply.read(reply_uuid, data)
        next = reply.uri

        reply.update(request.body.reply, data)
      } else {
        reply = new Reply(Reply.read(reply_uuid, data.wizard), data)
        next = `${patientSession.uri}?activity=${activity || 'consent'}`

        // Remove any parent details in reply if self consent
        if (reply.selfConsent) {
          delete reply.parent
        }

        if (triage?.outcome) {
          patientSession.recordTriage({
            ...triage,
            ...data?.wizard?.triage, // Wizard values
            ...(data.token && { createdBy_uid: data.token?.uid }),
            createdAt: today()
          })
        }

        // Invalidate any replaced response
        if (invalidUuid) {
          const invalidReply = Reply.read(invalidUuid, data)
          invalidReply.update({ invalid: true }, data)

          delete request.app.locals.invalidUuid
        }

        patientSession.patient.addReply(reply)

        // Update session data
        reply.update(reply, data)
      }

      // Clean up session data
      delete data.reply
      delete data.triage

      request.flash(
        'success',
        __(`reply.${type}.success`, { reply, patientSession })
      )

      response.redirect(next)
    }
  },

  readForm(type) {
    return (request, response, next) => {
      const { reply_uuid } = request.params
      const { data, referrer } = request.session
      const { patientSession, triage } = response.locals

      let reply
      if (type === 'edit') {
        reply = Reply.read(reply_uuid, data)
      } else {
        reply = new Reply(Reply.read(reply_uuid, data.wizard), data)
      }

      response.locals.reply = reply
      response.locals.patient = patientSession.patient

      // Child can self consent if assessed as Gillick competent
      const canSelfConsent =
        patientSession.gillick?.competent === GillickCompetent.True

      // Only ask for programme if more than 1 administered in a session
      const isMultiProgrammeSession =
        patientSession.session.primaryProgrammes.length > 1
      response.locals.isMultiProgrammeSession = isMultiProgrammeSession

      const programme = isMultiProgrammeSession
        ? reply.programme_id && Programme.read(reply.programme_id, data)
        : patientSession.session.primaryProgrammes[0]
      response.locals.programme = programme

      response.locals.triage = {
        ...(type === 'edit' && triage), // Previous values
        ...data?.wizard?.triage // Wizard values
      }

      const journey = {
        [`/`]: {},
        [`/${reply_uuid}/${type}/respondent`]: {},
        ...(data.respondent !== 'self' &&
          !reply.selfConsent && {
            [`/${reply_uuid}/${type}/parent`]: {}
          }),
        ...(isMultiProgrammeSession && {
          [`/${reply_uuid}/${type}/programme`]: {}
        }),
        [`/${reply_uuid}/${type}/decision`]: {
          [`/${reply_uuid}/${type}/${reply?.selfConsent ? 'notify-parent' : 'health-answers'}`]:
            {
              data: 'reply.decision',
              value: ReplyDecision.Given
            },
          [`/${reply_uuid}/${type}/refusal-reason`]: {
            data: 'reply.decision',
            value: ReplyDecision.Refused
          },
          [`/${reply_uuid}/${type}/note`]: {
            data: 'reply.decision',
            value: ReplyDecision.NoResponse
          }
        },
        [`/${reply_uuid}/${type}/notify-parent`]: {},
        [`/${reply_uuid}/${type}/health-answers`]: {
          [`/${reply_uuid}/${type}/${hasAnswersNeedingTriage(request.session.data.reply?.healthAnswers) ? 'triage' : 'check-answers'}`]: true
        },
        [`/${reply_uuid}/${type}/refusal-reason`]: {
          [`/${reply_uuid}/${type}/refusal-reason-details`]: {
            data: 'reply.refusalReason',
            values: [
              ReplyRefusal.AlreadyGiven,
              ReplyRefusal.GettingElsewhere,
              ReplyRefusal.Medical
            ]
          },
          [`/${reply_uuid}/${type}/refusal-notification`]: {
            data: 'reply.refusalReason',
            value: ReplyRefusal.Personal
          },
          [`/${reply_uuid}/${type}/check-answers`]: true
        },
        [`/${reply_uuid}/${type}/refusal-reason-details`]: {
          [`/${reply_uuid}/${type}/check-answers`]: true
        },
        [`/${reply_uuid}/${type}/triage`]: {
          [`/${reply_uuid}/${type}/check-answers`]: true
        },
        [`/${reply_uuid}/${type}/note`]: {
          [`/${reply_uuid}/${type}/check-answers`]: true
        },
        [`/${reply_uuid}`]: {}
      }

      response.locals.paths = {
        ...wizard(journey, request),
        ...(type === 'edit' && {
          back: `${patientSession.uri}/replies/${reply_uuid}/edit`,
          next: `${patientSession.uri}/replies/${reply_uuid}/edit`
        }),
        ...(referrer && { back: referrer })
      }

      const consentRefusals = Object.values(patientSession.replies).filter(
        (reply) => reply.decision === ReplyDecision.Refused
      )

      if (Object.values(consentRefusals).length > 0) {
        response.locals.respondentItems = consentRefusals.map(
          ({ parent, uuid }) => ({
            text: `${parent.fullName} (${parent.relationship})`,
            hint: { text: parent.tel },
            value: uuid
          })
        )
      } else {
        response.locals.respondentItems = patientSession.patient.parents.map(
          (parent, index) => ({
            text: formatParent(parent, false),
            hint: { text: parent.tel },
            value: `parent-${index + 1}`
          })
        )
      }

      if (canSelfConsent) {
        response.locals.respondentItems.unshift({
          text: 'Child (Gillick competent)',
          value: 'self'
        })
      }

      if (isMultiProgrammeSession) {
        response.locals.programmeItems = patientSession.session.programmes.map(
          (programme) => ({
            text: programme.name,
            value: programme.id
          })
        )
      }

      response.locals.screenOutcomesForConsentMethod =
        getScreenOutcomesForConsentMethod(programme, [reply])

      response.locals.screenVaccinationMethod = getScreenVaccinationMethod(
        programme,
        [reply]
      )

      next()
    }
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`reply/form/${view}`)
  },

  updateForm(request, response) {
    const { respondent } = request.body
    const { reply_uuid } = request.params
    const { data } = request.session
    const { paths, patientSession, reply, triage } = response.locals

    reply.update(request.body.reply, data.wizard)

    // Create parent based on choice of respondent
    if (respondent) {
      switch (respondent) {
        case 'new': // Consent response is from a new contact
          reply.method = ReplyMethod.Phone
          reply.parent = new Parent({})
          reply.selfConsent = false
          break
        case 'self':
          reply.method = ReplyMethod.InPerson
          reply.parent = false
          reply.selfConsent = true
          break
        case 'parent-1': // Consent response is from CHIS record
          reply.method = ReplyMethod.Phone
          reply.parent = patientSession.patient.parents[0]
          reply.selfConsent = false
          break
        case 'parent-2': // Consent response is from CHIS record
          reply.method = ReplyMethod.Phone
          reply.parent = patientSession.patient.parents[1]
          reply.selfConsent = false
          break
        default: // Consent response is an existing respondent
          reply.method = ReplyMethod.Phone
          reply.parent = Reply.read(respondent, data).parent
          reply.selfConsent = false

          // Store reply that needs marked as invalid
          // We only want to do this when submitting replacement reply
          request.app.locals.invalidUuid = request.body.uuid
      }
    }

    // Store vaccination if refusal reason is vaccination already given
    if (request.body.reply?.refusalReason === ReplyRefusal.AlreadyGiven) {
      response.locals.vaccination = {
        outcome: VaccinationOutcome.AlreadyVaccinated,
        patient_uuid: patientSession.patient.uuid,
        session_id: patientSession.session.id,
        ...(data.reply?.note && { note: data.reply.note }),
        ...(data.token && { createdBy_uid: data.token?.uid })
      }
    }

    delete data.healthAnswers
    delete data.respondent

    reply.update(reply, data.wizard)

    data.wizard.triage = {
      ...triage, // Previous values
      ...request.body?.triage // New value
    }

    response.redirect(
      paths.next ||
        `${patientSession.uri}/replies/${reply_uuid}/new/check-answers`
    )
  },

  followUp(request, response) {
    const { decision } = request.body
    const { data } = request.session
    const { patientSession, reply } = response.locals

    if (decision === 'true') {
      response.redirect(`${reply.uri}/edit/outcome`)
    } else {
      // Store reply that needs marked as invalid
      // We only want to do this when submitting replacement reply
      request.app.locals.invalidUuid = reply.uuid

      const newReply = new Reply(
        {
          child: patientSession.patient,
          parent: reply.parent,
          patient_uuid: patientSession.patient.uuid,
          session_id: patientSession.session.id,
          programme_id: patientSession.programme.id,
          method: ReplyMethod.Phone
        },
        data
      )

      newReply.create(newReply, data.wizard)

      // Clean up session data
      delete data.decision

      response.redirect(`${newReply.uri}/new/decision?referrer=${reply.uri}`)
    }
  },

  invalidate(request, response) {
    const { note } = request.body.reply
    const { data } = request.session
    const { __, activity, patientSession, reply } = response.locals

    reply.update({ invalid: true, note }, data)

    // Clean up session data
    delete data.reply

    request.flash('success', __(`reply.invalidate.success`, { reply }))

    response.redirect(`${patientSession.uri}?activity=${activity || 'consent'}`)
  },

  withdraw(request, response) {
    const { refusalReason, refusalReasonOther, note } = request.body.reply
    const { data } = request.session
    const { __, activity, patientSession, reply } = response.locals

    // Create a new reply
    const newReply = new Reply({
      ...reply,
      uuid: false,
      createdAt: today(),
      decision: ReplyDecision.Refused,
      refusalReason,
      ...(refusalReason === ReplyRefusal.Other && { refusalReasonOther }),
      ...(data.reply?.note && { note }),
      ...(data.token && { createdBy_uid: data.token?.uid })
    })

    patientSession.patient.addReply(newReply)
    newReply.create(newReply, data)

    // Add vaccination if refusal reason is already given
    if (refusalReason === ReplyRefusal.AlreadyGiven) {
      const vaccination = new Vaccination({
        outcome: VaccinationOutcome.AlreadyVaccinated,
        patient_uuid: patientSession.patient.uuid,
        programme_id: patientSession.programme.id,
        session_id: patientSession.session.id,
        ...(data.reply?.note && { note }),
        ...(data.token && { createdBy_uid: data.token?.uid })
      })
      patientSession.patient.recordVaccination(vaccination)
      vaccination.update(vaccination, data)
    }

    // Invalidate existing reply
    reply.update({ invalid: true }, data)

    // Clean up session data
    delete data.reply

    request.flash('success', __(`reply.withdraw.success`, { reply }))

    response.redirect(`${patientSession.uri}?activity=${activity || 'consent'}`)
  }
}
