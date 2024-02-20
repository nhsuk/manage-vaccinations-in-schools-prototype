import { fakerEN_GB as faker } from '@faker-js/faker'
import { Event, EventType } from './event.js'
import { Record } from './record.js'
import { getPreferredNames } from '../utils/reply.js'

export class ConsentOutcome {
  static NoResponse = 'No response'
  static Inconsistent = 'Conflicts'
  static Given = 'Given'
  static Refused = 'Refused'
  // static FinalRefusal = 'Refusal confirmed'
}

export class ScreenOutcome {
  static NeedsTriage = 'Needs triage'
  static DelayVaccination = 'Delay vaccination to a later date'
  static DoNotVaccinate = 'Do not vaccinate in campaign'
  static Vaccinate = 'Safe to vaccinate'
}

export class PatientOutcome {
  static NoOutcomeYet = 'No outcome yet'
  static Vaccinated = 'Vaccinated'
  static CouldNotVaccinate = 'Could not vaccinate'
}

/**
 * @class Patient in-session record
 * @property {string} nhsn - NHS number
 * @property {Array<import('./event.js').Event>} events - Logged events
 * @property {object} replies - Consent replies
 * @property {ConsentOutcome} consent - Consent outcome
 * @property {ScreenOutcome} screen - Screening outcome
 * @property {PatientOutcome} outcome - Overall outcome
 * @property {import('./record.js').Record} record - CHIS record
 * @property {string} [campaign_uuid] - Campaign UUID
 * @property {string} [session_id] - Session ID
 * @function preferredNames - Preferred name(s)
 * @function ns - Namespace
 * @function uri - URL
 */
export class Patient {
  constructor(options) {
    this.nhsn = options?.nhsn || this.#nhsn
    this.events = options?.events || []
    this.replies = options?.replies || {}
    this.consent = options?.consent || false
    this.screen = options?.screen || false
    this.outcome = options?.outcome || PatientOutcome.NoOutcomeYet
    this.record = new Record(options.record)
    this.campaign_uuid = options.campaign_uuid
    this.session_id = options.session_id
  }

  static generate(record) {
    return new Patient({
      nhsn: record.nhsn,
      consent: faker.helpers.arrayElement(Object.keys(ConsentOutcome)),
      record
    })
  }

  #nhsn = '999#######'.replace(/#+/g, (m) => faker.string.numeric(m.length))

  get formattedNhsNumber() {
    const numberArray = this.nhsn.split('')
    numberArray.splice(3, 0, ' ')
    numberArray.splice(8, 0, ' ')
    return numberArray.join('')
  }

  get firstName() {
    return this.record.firstName
  }

  get fullName() {
    return [this.record.firstName, this.record.lastName].join(' ')
  }

  get preferredNames() {
    return getPreferredNames(this.replies)
  }

  get ns() {
    return 'patient'
  }

  get uri() {
    return `/sessions/${this.session_id}/${this.nhsn}`
  }

  set log(event) {
    this.events.push(new Event(event))
  }

  set select(campaign) {
    this.campaign_uuid = campaign.uuid
    this.log = {
      type: EventType.Select,
      name: `Selected for ${campaign.name} campaign cohort`,
      date: campaign.created,
      user_uuid: campaign.created_user_uuid
    }
  }

  set invite(session) {
    this.session_id = session.id
    this.log = {
      type: EventType.Invite,
      name: `Invited to session at ${session.location.name}`,
      date: session.created,
      user_uuid: session.created_user_uuid
    }
  }

  set respond(reply) {
    if (!reply) {
      return
    }

    const created = !this.replies[reply.uuid]

    this.replies[reply.uuid] = reply
    this.log = {
      type: EventType.Consent,
      name: created
        ? `${reply.decision} by ${reply.fullName}`
        : `${reply.decision} in updated response from ${reply.fullName}`,
      date: created ? reply.created : new Date().toISOString(),
      user_uuid: reply.created_user_uuid
    }
  }
}
