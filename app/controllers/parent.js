import wizard from '@x-govuk/govuk-prototype-wizard'

import { generateChild } from '../generators/child.js'
import { generateParent } from '../generators/parent.js'
import { Consent } from '../models/consent.js'
import { ProgrammeType } from '../models/programme.js'
import { ReplyDecision, ReplyRefusal } from '../models/reply.js'
import { School } from '../models/school.js'
import { ConsentWindow, Session, SessionType } from '../models/session.js'
import {
  getHealthQuestionKey,
  getHealthQuestionPaths
} from '../utils/consent.js'

export const parentController = {
  read(request, response, next) {
    const { id } = request.params
    const { data } = request.session

    const session = Session.read(id, data)

    response.locals.transactionalService = {
      name: 'Give or refuse consent for vaccinations',
      href: session.consentUrl
    }
    response.locals.public = true
    response.locals.session = session

    next()
  },

  redirect(request, response) {
    const { session } = response.locals

    response.redirect(
      session.consentWindow === ConsentWindow.Closed
        ? `${session.consentUrl}/closed`
        : `${session.consentUrl}/start`
    )
  },

  show(request, response) {
    const view = request.params.view || 'show'
    const { data } = request.session
    const { session } = response.locals

    // Text and email messages
    if (view === 'emails' || view === 'texts') {
      const child = generateChild()
      const parent = generateParent(child.lastName)

      response.locals.consent = new Consent(
        {
          child,
          parent,
          session_id: session.id
        },
        data
      )
    }

    response.render(`parent/${view}`)
  },

  new(request, response) {
    const { data } = request.session
    const { session } = response.locals

    const consent = new Consent(
      {
        session_id: session.id
      },
      data
    )

    consent.create(consent, data.wizard)

    response.redirect(`${consent.parentUri}/new/child`)
  },

  update(request, response) {
    const { data } = request.session
    const { consent, paths } = response.locals

    consent.update(request.body.consent, data)

    response.redirect(paths.next)
  },

  readForm(request, response, next) {
    const { form, id, uuid, view } = request.params
    const { data } = request.session

    const consent = new Consent(Consent.read(uuid, data?.wizard), data)
    response.locals.consent = consent

    const journey = {
      [`/${id}`]: {},
      [`/${id}/${uuid}/${form}/child`]: {},
      [`/${id}/${uuid}/${form}/dob`]: {},
      ...(consent.session.type === SessionType.School
        ? { [`/${id}/${uuid}/${form}/confirm-school`]: {} }
        : {}),
      ...(consent.session.type === SessionType.School &&
      data.confirmSchool !== 'yes'
        ? {
            [`/${id}/${uuid}/${form}/school`]: {}
          }
        : {}),
      [`/${id}/${uuid}/${form}/parent`]: {
        [`/${id}/${uuid}/${form}/contact-preference`]: () => {
          return request.session.data.consent?.parent?.tel
        }
      },
      [`/${id}/${uuid}/${form}/decision`]: {
        [`${id}/${uuid}/${form}/refusal-reason`]: {
          data: 'consent.decision',
          value: ReplyDecision.Refused
        }
      },
      [`/${id}/${uuid}/${form}/address`]: {},
      ...getHealthQuestionPaths(`/${id}/${uuid}/${form}/`, consent.session),
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
      [`/${id}/${uuid}/${form}/check-answers`]: {},
      [`/${id}/${uuid}/${form}/confirmation`]: {}
    }

    response.locals.paths = {
      ...wizard(journey, request),
      ...(form === 'edit' &&
        view !== 'check-answers' && {
          back: `${consent.parentUri}/${form}/check-answers`,
          next: `${consent.parentUri}/${form}/check-answers`
        })
    }

    response.locals.programmeIsFlu = consent.session.programmes
      .map(({ type }) => type)
      .includes(ProgrammeType.Flu)

    response.locals.programmeItems = consent.session.programmes.map(
      (programme) => ({
        text: programme.name,
        value: programme.pid
      })
    )

    response.locals.urnItems = Object.values(data.schools)
      .map((school) => new School(school))
      .map((school) => ({
        text: school.name,
        value: school.urn,
        ...(school.address && {
          attributes: {
            'data-hint': school.address.formatted.singleline
          }
        })
      }))

    next()
  },

  showForm(request, response) {
    let { form, view } = request.params
    const key = getHealthQuestionKey(view)
    view = view.startsWith('health-question-') ? 'health-question' : view

    response.render(`parent/form/${view}`, { form, key })
  },

  updateForm(request, response) {
    const { data } = request.session
    const { paths, consent } = response.locals

    consent.update(request.body.consent, data.wizard)

    response.redirect(paths.next)
  }
}
