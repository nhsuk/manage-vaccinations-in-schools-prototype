import { wizard } from 'nhsuk-prototype-rig'
import { GillickCompetent } from '../models/gillick.js'
import { Patient } from '../models/patient.js'
import {
  Reply,
  ReplyDecision,
  ReplyMethod,
  ReplyRefusal
} from '../models/reply.js'
import { Vaccination, VaccinationOutcome } from '../models/vaccination.js'

export const replyController = {
  read(request, response, next) {
    const { uuid } = request.params
    const { patient, session } = response.locals

    const reply = patient.replies[uuid] || session.consents[uuid]

    request.app.locals.reply = new Reply(reply)

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
    delete data.wizard?.reply
    delete data.wizard?.triage

    const isSelfConsent =
      patient.gillick?.competent?.value === GillickCompetent.True

    const reply = new Reply({
      child: patient.record,
      patient_nhsn: patient.nhsn,
      session_id: session.id,
      ...(!isSelfConsent && { method: ReplyMethod.Phone })
    })

    data.wizard = { reply }

    request.app.locals.isSelfConsent = isSelfConsent

    response.redirect(`/sessions/${id}/${nhsn}/replies/${reply.uuid}/new/uuid`)
  },

  update(request, response) {
    const { activity, invalidUuid, reply, triage, vaccination } =
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

    // Record vaccination that has already been given
    if (vaccination) {
      patient.capture = new Vaccination(vaccination)
      delete request.app.locals.vaccination
    }

    // Add new reply
    patient.respond = new Reply({
      ...reply, // Previous values
      ...data.wizard?.reply, // Wizard values
      ...request.body.reply, // New value
      parent: {
        ...reply?.parent, // Previous parent values
        ...request.body.reply?.parent // New parent value
      },
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    if (triage.outcome) {
      patient.triage = {
        ...triage,
        ...data.wizard?.triage, // Wizard values
        ...(data.token && { created_user_uid: data.token?.uid })
      }
    }

    delete data.reply
    delete data.triage
    delete data.wizard?.reply
    delete data.wizard?.triage

    delete request.app.locals.reply
    delete request.app.locals.triage

    const action = form === 'edit' ? 'update' : 'create'
    request.flash('success', __(`reply.success.${action}`, { reply, patient }))

    const next =
      form === 'edit' ? reply.uri : `/sessions/${id}/${activity || 'consent'}`

    response.redirect(next)
  },

  readForm(request, response, next) {
    const { isSelfConsent, reply, triage } = request.app.locals
    const { form, uuid, nhsn } = request.params
    const { referrer } = request.query
    const { data } = request.session

    const patient = new Patient(data.patients[nhsn])

    request.app.locals.reply = new Reply({
      ...(form === 'edit' && reply), // Previous values
      ...data.wizard?.reply // Wizard values
    })

    request.app.locals.triage = {
      ...(form === 'edit' && triage), // Previous values
      ...data.wizard?.triage // Wizard values
    }

    const replyNeedsTriage = (reply) => {
      return reply?.healthAnswers
        ? Object.values(reply.healthAnswers).find((answer) => answer !== '')
        : false
    }

    const journey = {
      [`/`]: {},
      [`/${uuid}/${form}/uuid`]: {},
      ...(!isSelfConsent && {
        [`/${uuid}/${form}/parent`]: {}
      }),
      [`/${uuid}/${form}/decision`]: {
        [`/${uuid}/${form}/${isSelfConsent ? 'notify-parent' : 'health-answers'}`]:
          {
            data: 'reply.decision',
            value: ReplyDecision.Given
          },
        [`/${uuid}/${form}/refusal-reason`]: {
          data: 'reply.decision',
          value: ReplyDecision.Refused
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
      [`/${uuid}`]: {}
    }

    response.locals.paths = {
      ...wizard(journey, request),
      ...(form === 'edit' && {
        back: `${patient.uri}/replies/${uuid}/edit`,
        next: `${patient.uri}/replies/${uuid}/edit`
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
      const { parent } = patient.record
      response.locals.uuidItems = [
        {
          text: `${parent.fullName} (${parent.relationship})`,
          hint: { text: parent.tel },
          value: 'record'
        }
      ]
    }

    if (isSelfConsent) {
      response.locals.uuidItems.unshift({
        text: request.app.locals.reply.relationship,
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
        case 'record': // Consent response is from CHIS record
          reply.parent = patient.record.parent
          break
        case 'self':
          reply.parent = false
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
        patient_nhsn: patient.nhsn,
        session_id: session.id,
        ...(data.reply?.notes && { notes }),
        ...(data.token && { created_user_uid: data.token?.uid })
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
      paths.next || `${patient.uri}/replies/${uuid}/new/check-answers`
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
        child: patient.record,
        parent: patient.replies[reply.uuid].parent,
        patient_nhsn: patient.nhsn,
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
    const { patient } = response.locals
    const { __ } = response.locals

    patient.respond = new Reply({
      ...reply,
      ...(data.reply?.notes && { notes: data.reply.notes }),
      ...(data.token && { created_user_uid: data.token?.uid }),
      invalid: true
    })

    delete data.reply

    request.flash('success', __(`reply.success.invalidate`, { reply }))
    response.redirect(patient.uri)
  },

  showWithdraw(request, response) {
    response.render('reply/withdraw')
  },

  updateWithdraw(request, response) {
    const { reply } = request.app.locals
    const { data } = request.session
    const { campaign, patient, session } = response.locals
    const { __ } = response.locals

    const { refusalReason, refusalReasonOther, notes } = data.reply

    // Invalidate existing reply
    patient.replies[reply.uuid].invalid = true

    // Create a new reply
    patient.respond = new Reply({
      ...reply,
      uuid: false,
      created: new Date().toISOString(),
      decision: ReplyDecision.Refused,
      refusalReason,
      ...(refusalReason === ReplyRefusal.Other && { refusalReasonOther }),
      ...(data.reply?.notes && { notes }),
      ...(data.token && { created_user_uid: data.token?.uid })
    })

    if (request.body.reply?.refusalReason === ReplyRefusal.AlreadyGiven) {
      patient.capture = new Vaccination({
        outcome: VaccinationOutcome.AlreadyVaccinated,
        patient_nhsn: patient.nhsn,
        campaign_uid: campaign.uid,
        session_id: session.id,
        ...(data.reply?.notes && { notes }),
        ...(data.token && { created_user_uid: data.token?.uid })
      })
    }

    delete data.reply

    request.flash('success', __(`reply.success.withdraw`, { reply }))
    response.redirect(patient.uri)
  }
}
