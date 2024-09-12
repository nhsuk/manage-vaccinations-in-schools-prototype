import { wizard } from 'nhsuk-prototype-rig'
import { Child } from '../models/child.js'
import { Consent } from '../models/consent.js'
import { Parent } from '../models/parent.js'
import { Programme } from '../models/programme.js'
import { Record } from '../models/record.js'
import { ReplyDecision, ReplyRefusal } from '../models/reply.js'
import { ConsentWindow, Session } from '../models/session.js'
import {
  getHealthQuestionKey,
  getHealthQuestionPaths
} from '../utils/consent.js'

export const consentController = {
  edit(request, response) {
    response.render('consent/edit')
  },

  new(request, response) {
    const { session } = request.app.locals
    const { data } = request.session

    // Delete previous data
    delete data.consent
    delete data?.wizard?.consent

    const consent = new Consent({
      session_id: session.id
    })

    data.wizard = { consent }

    response.redirect(`${consent.uri}/new/child`)
  },

  show(request, response) {
    const { session } = request.app.locals
    const { view } = request.params

    // Service homepage should show closed message if deadline has passed
    if (!view) {
      return response.render(
        session.consentWindow.value === ConsentWindow.Closed
          ? `consent/closed`
          : `consent/start`
      )
    }

    // Text and email messages
    if (view === 'emails' || view === 'texts') {
      const child = Child.generate({ record: Record.generate() })
      const parent = Parent.generate(child.lastName)

      response.locals.consent = new Consent({
        child,
        parent,
        session_id: session.id
      })
    }

    response.render(`consent/${view}`)
  },

  read(request, response, next) {
    const { data } = request.session
    const { id } = request.params

    const session = new Session(data.sessions[id])
    const programme = new Programme(data.programmes[session.programmes[0]])

    request.app.locals.programme = programme
    request.app.locals.session = session

    // Transactional service details
    response.locals.transactionalService = {
      name: 'Give or refuse consent for vaccinations',
      href: `/consents/${id}`
    }
    response.locals.public = true

    next()
  },

  update(request, response) {
    const { consent } = request.app.locals
    const { id, uuid } = request.params
    const { data } = request.session

    data.sessions[id].consents[uuid] = new Consent({
      ...consent,
      ...request.body.consent
    })

    response.redirect(`/consents/${id}/confirmation`)
  },

  readForm(request, response, next) {
    const { programme, consent } = request.app.locals
    const { form, id, uuid, view } = request.params
    const { data } = request.session

    request.app.locals.consent = new Consent({
      ...(form === 'edit' && consent), // Previous values
      ...data?.wizard?.consent // Wizard values,
    })

    const journey = {
      [`/${id}`]: {},
      [`/${id}/${uuid}/${form}/child`]: {},
      [`/${id}/${uuid}/${form}/dob`]: {},
      [`/${id}/${uuid}/${form}/school`]: {
        [`/${id}/unavailable`]: {
          data: 'consent.child.school',
          value: 'no'
        }
      },
      [`/${id}/${uuid}/${form}/parent`]: {},
      ...(data.consent?.parent?.tel !== ''
        ? {
            [`/${id}/${uuid}/${form}/contact-preference`]: {}
          }
        : {}),
      [`/${id}/${uuid}/${form}/decision`]: {
        [`${id}/${uuid}/${form}/refusal-reason`]: {
          data: 'consent.decision',
          value: ReplyDecision.Refused
        }
      },
      [`/${id}/${uuid}/${form}/address`]: {},
      [`/${id}/${uuid}/${form}/gp-registered`]: {},
      ...getHealthQuestionPaths(`/${id}/${uuid}/${form}/`, programme.vaccine),
      [`/${id}/${uuid}/${form}/check-answers`]: {},
      [`/${id}/${uuid}/new/confirmation`]: {},
      [`/${id}/${uuid}/${form}/refusal-reason`]: {
        [`/${id}/${uuid}/${form}/refusal-reason-details`]: {
          data: 'consent.refusalReason',
          values: [
            ReplyRefusal.AlreadyGiven,
            ReplyRefusal.GettingElsewhere,
            ReplyRefusal.Medical
          ]
        },
        [`/${id}/${uuid}/${form}/check-answers`]: true
      },
      [`/${id}/${uuid}/${form}/refusal-reason-details`]: {
        [`/${id}/${uuid}/${form}/check-answers`]: true
      },
      [`/${id}/${uuid}/${form}/check-answers`]: {}
    }

    response.locals.paths = {
      ...wizard(journey, request),
      ...(form === 'edit' &&
        view !== 'check-answers' && {
          back: `/consents/${id}/${uuid}/${form}/check-answers`,
          next: `/consents/${id}/${uuid}/${form}/check-answers`
        })
    }

    next()
  },

  showForm(request, response) {
    let { form, view } = request.params
    const key = getHealthQuestionKey(view)
    view = view.startsWith('health-question-') ? 'health-question' : view

    response.render(`consent/form/${view}`, { form, key })
  },

  updateForm(request, response) {
    const { consent } = request.app.locals
    const { data } = request.session
    const { paths } = response.locals

    delete data.healthAnswers

    data.wizard.consent = new Consent({
      ...consent, // Previous values
      ...request.body.consent, // New value
      child: {
        ...consent?.child,
        ...request.body.consent?.child
      },
      parent: {
        ...consent?.parent,
        ...request.body.consent?.parent
      },
      healthAnswers: {
        ...consent?.healthAnswers,
        ...request.body.consent?.healthAnswers
      }
    })

    response.redirect(paths.next)
  }
}
