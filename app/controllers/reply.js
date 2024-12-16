import wizard from '@x-govuk/govuk-prototype-wizard'

import { GillickCompetent } from '../models/gillick.js'
import { Patient } from '../models/patient.js'
import {
  Reply,
  ReplyDecision,
  ReplyMethod,
  ReplyRefusal
} from '../models/reply.js'
import { Vaccination, VaccinationOutcome } from '../models/vaccination.js'
import { getToday } from '../utils/date.js'
import { getSessionPatientPath } from '../utils/session.js'
import { formatParent } from '../utils/string.js'

export const replyController = {
  read(request, response, next) {
    const { uuid } = request.params
    const { data } = request.session
    const { patient, session } = response.locals

    const reply = data.replies[uuid] || data.consents[uuid]

    request.app.locals.reply = new Reply(reply, data)

    response.locals.paths = {
      back: getSessionPatientPath(session, patient),
      next: getSessionPatientPath(session, patient)
    }

    next()
  },

  redirect(request, response) {
    const { id, nhsn } = request.params

    response.redirect(`/sessions/${id}/${nhsn}`)
  },

  show(request, response) {
    response.render('reply/show')
  },

  new(request, response) {
    const { id, nhsn } = request.params
    const { data } = request.session
    const { patient, session } = response.locals

    delete data.reply
    delete data.triage
    delete data?.wizard?.reply
    delete data?.wizard?.triage

    const selfConsent =
      patient.gillick?.competent?.value === GillickCompetent.True

    const reply = new Reply({
      child: patient,
      patient_uuid: patient.uuid,
      session_id: session.id,
      selfConsent,
      ...(!selfConsent && { method: ReplyMethod.Phone }),
      ...(data.token && { createdBy_uid: data.token?.uid })
    })

    data.wizard = { reply }

    response.redirect(`/sessions/${id}/${nhsn}/replies/${reply.uuid}/new/uuid`)
  },

  update(request, response) {
    const { activity, invalidUuid, reply, session, triage, vaccination } =
      request.app.locals
    const { form, id } = request.params
    const { data } = request.session
    const { __ } = response.locals
    const patient = new Patient(response.locals.patient)

    // Mark previous reply as invalid when following up on a refusal
    if (invalidUuid) {
      patient.replies[invalidUuid].invalid = true
      delete request.app.locals.invalidUuid
    }

    // Capture and flow vaccination that has already been given
    if (vaccination) {
      vaccination.captureAndFlow(data)
      delete request.app.locals.vaccination
    }

    // Add new reply
    const updatedReply = new Reply({
      ...reply, // Previous values
      ...data?.wizard?.reply, // Wizard values
      ...request.body.reply // New value
    })

    // Remove any parent details in reply if self consent
    if (updatedReply.selfConsent) {
      delete updatedReply.parent
    }

    patient.addReply(updatedReply)

    if (triage.outcome) {
      patient.recordTriage({
        ...triage,
        ...data?.wizard?.triage, // Wizard values
        ...(data.token && { createdBy_uid: data.token?.uid })
      })
    }

    // Clean up
    delete data.reply
    delete data.triage
    delete data?.wizard?.reply
    delete data?.wizard?.triage
    delete request.app.locals.reply
    delete request.app.locals.triage

    request.flash(
      'success',
      __(`reply.${form}.success`, { reply: updatedReply, patient, session })
    )

    const next =
      form === 'edit'
        ? updatedReply.uri
        : `/sessions/${id}/${activity || 'consent'}`

    response.redirect(next)
  },

  readForm(request, response, next) {
    let { reply, session, triage } = request.app.locals
    const { form, uuid, nhsn } = request.params
    const { data, referrer } = request.session

    let patient = Object.values(data.patients).find(
      (patient) => patient.nhsn === nhsn
    )

    patient = new Patient(patient)

    reply = new Reply(
      {
        ...(form === 'edit' && reply), // Previous values
        ...data?.wizard?.reply // Wizard values
      },
      data
    )

    triage = {
      ...(form === 'edit' && triage), // Previous values
      ...data?.wizard?.triage // Wizard values
    }

    request.app.locals.reply = reply
    request.app.locals.triage = triage

    const replyNeedsTriage = (reply) => {
      return reply?.healthAnswers
        ? Object.values(reply.healthAnswers).find((answer) => answer !== '')
        : false
    }

    const journey = {
      [`/`]: {},
      [`/${uuid}/${form}/uuid`]: {},
      ...(!reply.selfConsent && {
        [`/${uuid}/${form}/parent`]: {}
      }),
      [`/${uuid}/${form}/decision`]: {
        [`/${uuid}/${form}/${reply.selfConsent ? 'notify-parent' : 'health-answers'}`]:
          {
            data: 'reply.decision',
            value: ReplyDecision.Given
          },
        [`/${uuid}/${form}/refusal-reason`]: {
          data: 'reply.decision',
          value: ReplyDecision.Refused
        },
        [`/${uuid}/${form}/note`]: {
          data: 'reply.decision',
          value: ReplyDecision.NoResponse
        }
      },
      [`/${uuid}/${form}/notify-parent`]: {},
      [`/${uuid}/${form}/health-answers`]: {
        [`/${uuid}/${form}/${replyNeedsTriage(request.session.data.reply) ? 'triage' : 'check-answers'}`]: true
      },
      [`/${uuid}/${form}/refusal-reason`]: {
        [`/${uuid}/${form}/refusal-reason-details`]: {
          data: 'reply.refusalReason',
          values: [
            ReplyRefusal.AlreadyGiven,
            ReplyRefusal.GettingElsewhere,
            ReplyRefusal.Medical
          ]
        },
        [`/${uuid}/${form}/check-answers`]: true
      },
      [`/${uuid}/${form}/refusal-reason-details`]: {
        [`/${uuid}/${form}/check-answers`]: true
      },
      [`/${uuid}/${form}/triage`]: {
        [`/${uuid}/${form}/check-answers`]: true
      },
      [`/${uuid}/${form}/note`]: {
        [`/${uuid}/${form}/check-answers`]: true
      },
      [`/${uuid}`]: {}
    }

    response.locals.paths = {
      ...wizard(journey, request),
      ...(form === 'edit' && {
        back: getSessionPatientPath(session, patient, `replies/${uuid}/edit`),
        next: getSessionPatientPath(session, patient, `replies/${uuid}/edit`)
      }),
      ...(referrer && { back: referrer })
    }

    const consentRefusals = Object.values(patient.replies).filter(
      (reply) => reply.decision === ReplyDecision.Refused
    )

    if (Object.values(consentRefusals).length > 0) {
      response.locals.uuidItems = consentRefusals.map(({ parent, uuid }) => ({
        text: `${parent.fullName} (${parent.relationship})`,
        hint: { text: parent.tel },
        value: uuid
      }))
    } else {
      response.locals.uuidItems = patient.parents.map((parent, index) => ({
        text: formatParent(parent, false),
        hint: { text: parent.tel },
        value: `parent-${index + 1}`
      }))
    }

    if (reply.selfConsent) {
      response.locals.uuidItems.unshift({
        text: reply.relationship,
        value: 'self'
      })
    }

    next()
  },

  showForm(request, response) {
    const { view } = request.params

    response.render(`reply/form/${view}`)
  },

  updateForm(request, response) {
    const { reply, triage } = request.app.locals
    const { uuid } = request.params
    const { data } = request.session
    const { paths, patient, session } = response.locals

    // Create parent based on choice of respondent
    if (request.body.uuid) {
      switch (data.uuid) {
        case 'new': // Consent response is from a new contact
          reply.parent = {}
          break
        case 'self':
          reply.parent = false
          break
        case 'parent-1': // Consent response is from CHIS record
          reply.parent = patient.parents[0]
          break
        case 'parent-2': // Consent response is from CHIS record
          reply.parent = patient.parents[1]
          break
        default: // Consent response is an existing respondent
          // Store reply that needs marked as invalid
          // We only want to do this when submitting replacement reply
          request.app.locals.invalidUuid = data.uuid

          reply.parent = patient.replies[data.uuid].parent
      }
    }

    // Store vaccination if refusal reason is vaccination already given
    if (request.body.reply?.refusalReason === ReplyRefusal.AlreadyGiven) {
      request.app.locals.vaccination = {
        outcome: VaccinationOutcome.AlreadyVaccinated,
        patient_uuid: patient.uuid,
        session_id: session.id,
        ...(data.reply?.note && { note: data.reply.note }),
        ...(data.token && { createdBy_uid: data.token?.uid })
      }
    }

    delete data.healthAnswers
    delete data.uuid

    data.wizard.reply = new Reply({
      ...reply, // Previous values
      ...request.body?.reply, // New value
      child: {
        ...reply?.child,
        ...request.body.reply?.child
      },
      parent: {
        ...reply?.parent,
        ...request.body?.reply?.parent
      }
    })

    data.wizard.triage = {
      ...triage, // Previous values
      ...request.body?.triage // New value
    }

    response.redirect(
      paths.next ||
        getSessionPatientPath(
          session,
          patient,
          `replies/${uuid}/new/check-answers`
        )
    )
  },

  showFollowUp(request, response) {
    response.render('reply/follow-up')
  },

  updateFollowUp(request, response) {
    const { reply } = request.app.locals
    const { data } = request.session
    const { patient, session } = response.locals

    if (request.body.decision === 'true') {
      response.locals.paths = { back: `${reply.uri}/follow-up` }
      response.redirect(`${reply.uri}/edit/outcome`)
    } else {
      // Store reply that needs marked as invalid
      // We only want to do this when submitting replacement reply
      request.app.locals.invalidUuid = reply.uuid

      const newReply = new Reply({
        child: patient,
        parent: patient.replies[reply.uuid].parent,
        patient_uuid: patient.uuid,
        session_id: session.id,
        method: ReplyMethod.Phone
      })

      data.wizard = { reply: newReply }

      response.redirect(`${newReply.uri}/new/decision?referrer=${reply.uri}`)
    }
  },

  showInvalidate(request, response) {
    response.render('reply/invalidate')
  },

  updateInvalidate(request, response) {
    const { reply } = request.app.locals
    const { data } = request.session
    const { patient, session } = response.locals
    const { __ } = response.locals

    patient.addReply({
      ...reply,
      ...(data.reply?.note && { note: data.reply.note }),
      ...(data.token && { createdBy_uid: data.token?.uid }),
      invalid: true
    })

    delete data.reply

    request.flash('success', __(`reply.invalidate.success`, { reply }))
    response.redirect(getSessionPatientPath(session, patient))
  },

  showWithdraw(request, response) {
    response.render('reply/withdraw')
  },

  updateWithdraw(request, response) {
    const { reply } = request.app.locals
    const { data } = request.session
    const { programme, patient, session } = response.locals
    const { __ } = response.locals

    const { refusalReason, refusalReasonOther, note } = data.reply

    // Invalidate existing reply
    patient.replies[reply.uuid].invalid = true

    // Create a new reply
    patient.addReply({
      ...reply,
      uuid: false,
      createdAt: getToday(),
      decision: ReplyDecision.Refused,
      refusalReason,
      ...(refusalReason === ReplyRefusal.Other && { refusalReasonOther }),
      ...(data.reply?.note && { note }),
      ...(data.token && { createdBy_uid: data.token?.uid })
    })

    if (request.body.reply?.refusalReason === ReplyRefusal.AlreadyGiven) {
      const vaccination = new Vaccination({
        outcome: VaccinationOutcome.AlreadyVaccinated,
        patient_uuid: patient.uuid,
        programme_pid: programme.pid,
        session_id: session.id,
        ...(data.reply?.note && { note }),
        ...(data.token && { createdBy_uid: data.token?.uid })
      })
      vaccination.captureAndFlow(data)
    }

    delete data.reply

    request.flash('success', __(`reply.withdraw.success`, { reply }))
    response.redirect(getSessionPatientPath(session, patient))
  }
}
