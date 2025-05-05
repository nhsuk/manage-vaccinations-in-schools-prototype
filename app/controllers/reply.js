import wizard from '@x-govuk/govuk-prototype-wizard'

import { GillickCompetent } from '../models/gillick.js'
import { Parent } from '../models/parent.js'
import { PatientSession } from '../models/patient-session.js'
import { Programme } from '../models/programme.js'
import {
  Reply,
  ReplyDecision,
  ReplyMethod,
  ReplyRefusal
} from '../models/reply.js'
import { Vaccination, VaccinationOutcome } from '../models/vaccination.js'
import { today } from '../utils/date.js'
import { formatParent } from '../utils/string.js'

export const replyController = {
  read(request, response, next, reply_uuid) {
    const { nhsn, pid } = request.params

    response.locals.reply = Reply.read(reply_uuid, request.session.data)
    response.locals.patientSession = PatientSession.readAll(
      request.session.data
    )
      .filter(({ programme }) => programme.pid === pid)
      .find(({ patient }) => patient.nhsn === nhsn)

    next()
  },

  redirect(request, response) {
    const { nhsn, pid } = request.params

    response.redirect(`/programmes/${pid}/patients/${nhsn}`)
  },

  show(request, response) {
    response.render('reply/show')
  },

  new(request, response) {
    const { data } = request.session
    const { patient, programme, session } = response.locals

    const reply = new Reply(
      {
        child: patient,
        patient_uuid: patient.uuid,
        programme_pid: programme.pid,
        session_id: session.id,
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

      // Child can self consent if assessed as Gillick competent
      const canSelfConsent =
        patientSession.gillick?.competent === GillickCompetent.True

      // Only ask for programme if more than 1 administered in a session
      const isMultiProgrammeSession =
        patientSession.session.programmes.length > 1
      response.locals.isMultiProgrammeSession = isMultiProgrammeSession

      response.locals.programme = isMultiProgrammeSession
        ? reply.programme_pid && Programme.read(reply.programme_pid, data)
        : patientSession.session.programmes[0]

      response.locals.triage = {
        ...(type === 'edit' && triage), // Previous values
        ...data?.wizard?.triage // Wizard values
      }

      const replyNeedsTriage = (reply) => {
        return reply?.healthAnswers
          ? Object.values(reply.healthAnswers).find((answer) => answer !== '')
          : false
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
          [`/${reply_uuid}/${type}/${replyNeedsTriage(request.session.data.reply) ? 'triage' : 'check-answers'}`]: true
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
            value: programme.pid
          })
        )
      }

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
    const { paths, patient, patientSession, reply, session, triage } =
      response.locals

    const newReply = request.body?.reply || {}

    // Create parent based on choice of respondent
    if (respondent) {
      switch (respondent) {
        case 'new': // Consent response is from a new contact
          newReply.method = ReplyMethod.Phone
          newReply.parent = new Parent({})
          newReply.selfConsent = false
          break
        case 'self':
          newReply.method = ReplyMethod.InPerson
          newReply.parent = false
          newReply.selfConsent = true
          break
        case 'parent-1': // Consent response is from CHIS record
          newReply.method = ReplyMethod.Phone
          newReply.parent = patient.parents[0]
          newReply.selfConsent = false
          break
        case 'parent-2': // Consent response is from CHIS record
          newReply.method = ReplyMethod.Phone
          newReply.parent = patient.parents[1]
          newReply.selfConsent = false
          break
        default: // Consent response is an existing respondent
          newReply.method = ReplyMethod.Phone
          newReply.parent = Reply.read(respondent, data).parent
          newReply.selfConsent = false

          // Store reply that needs marked as invalid
          // We only want to do this when submitting replacement reply
          response.locals.invalidUuid = request.body.uuid
      }
    }

    // Store vaccination if refusal reason is vaccination already given
    if (request.body.reply?.refusalReason === ReplyRefusal.AlreadyGiven) {
      response.locals.vaccination = {
        outcome: VaccinationOutcome.AlreadyVaccinated,
        patient_uuid: patient.uuid,
        session_id: session.id,
        ...(data.reply?.note && { note: data.reply.note }),
        ...(data.token && { createdBy_uid: data.token?.uid })
      }
    }

    delete data.healthAnswers
    delete data.respondent

    reply.update(newReply, data.wizard)

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
    const { patient, reply, session } = response.locals

    if (decision === 'true') {
      response.redirect(`${reply.uri}/edit/outcome`)
    } else {
      // Store reply that needs marked as invalid
      // We only want to do this when submitting replacement reply
      response.locals.invalidUuid = reply.uuid

      const newReply = new Reply(
        {
          child: patient,
          parent: reply.parent,
          patient_uuid: patient.uuid,
          session_id: session.id,
          method: ReplyMethod.Phone
        },
        data
      )

      patient.addReply(newReply)
      newReply.create(newReply, data.wizard)

      // Clean up session data
      delete data.decision
      delete data.wizard

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
    const { __, activity, programme, patient, patientSession, reply, session } =
      response.locals

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

    patient.addReply(newReply)
    newReply.create(newReply, data)

    // Add vaccination if refusal reason is already given
    if (refusalReason === ReplyRefusal.AlreadyGiven) {
      const vaccination = new Vaccination({
        outcome: VaccinationOutcome.AlreadyVaccinated,
        patient_uuid: patient.uuid,
        programme_pid: programme.pid,
        session_id: session.id,
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
