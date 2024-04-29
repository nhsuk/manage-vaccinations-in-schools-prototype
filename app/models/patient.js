import { fakerEN_GB as faker } from '@faker-js/faker'
import { Event, EventType } from './event.js'
import { Record } from './record.js'
import {
  getConsentHealthAnswers,
  getConsentOutcome,
  getConsentRefusalReasons,
  getPreferredNames
} from '../utils/reply.js'

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

export class CaptureOutcome {
  static Vaccinated = 'Vaccinated'
  static PartVaccinated = 'Partially vaccinated'
  static AlreadyVaccinated = 'Already had the vaccine'
  static Contraindications = 'Had contraindications'
  static Refused = 'Refused vaccine'
  static AbsentSchool = 'Absent from school'
  static AbsentSession = 'Absent from the session'
  static Unwell = 'Unwell'
  static NoConsent = 'Unable to contact parent'
  static LateConsent = 'Consent received too late'
}

export class PatientOutcome {
  static NoOutcomeYet = 'No outcome yet'
  static Vaccinated = 'Vaccinated'
  static CouldNotVaccinate = 'Could not vaccinate'
}

/**
 * @class Patient in-session record
 * @property {string} nhsn - NHS number
 * @property {Array} log - Audit log
 * @property {Array} replies - Consent replies
 * @property {ScreenOutcome} screen - Screening outcome
 * @property {CaptureOutcome} capture - Vaccination outcome
 * @property {PatientOutcome} outcome - Overall outcome
 * @property {Record} record - Original CHIS record
 * @property {import('./gillick.js').Gillick} [gillick] - Gillick assessment
 * @property {string} [campaign_uuid] - Campaign UUID
 * @property {string} [session_id] - Session ID
 * @function consent - Consent outcome
 * @function preferredNames - Preferred name(s)
 * @function ns - Namespace
 * @function uri - URL
 */
export class Patient {
  constructor(options) {
    this.nhsn = options?.nhsn || this.#nhsn
    this.log = options?.log || []
    this.replies = options?.replies || {}
    this.screen = options?.screen || false
    this.capture = options?.capture || false
    this.outcome = options?.outcome || PatientOutcome.NoOutcomeYet
    this.record = new Record(options.record)
    this.gillick = options?.gillick || {}
    this.campaign_uuid = options.campaign_uuid
    this.session_id = options.session_id
  }

  static generate(record) {
    return new Patient({
      nhsn: record.nhsn,
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

  get consentHealthAnswers() {
    return getConsentHealthAnswers(this.replies)
  }

  get consentRefusalReasons() {
    return getConsentRefusalReasons(this.replies)
  }

  get preferredNames() {
    return getPreferredNames(this.replies)
  }

  get consent() {
    return getConsentOutcome(this)
  }

  get ns() {
    return 'patient'
  }

  get uri() {
    return `/sessions/${this.session_id}/${this.nhsn}`
  }

  set event(event) {
    this.log.push(new Event(event))
  }

  set campaign(campaign) {
    this.campaign_uuid = campaign.uuid
    this.event = {
      type: EventType.Select,
      name: `Added to ${campaign.name} campaign cohort`,
      date: campaign.created,
      user_uuid: campaign.created_user_uuid
    }
  }

  set session(session) {
    this.session_id = session.id
    this.event = {
      type: EventType.Select,
      name: `Added to session at ${session.location.name}`,
      date: session.created,
      user_uuid: session.created_user_uuid
    }
  }

  set assessment(assessment) {
    const created = !Object.entries(this.gillick).length

    this.gillick = assessment
    this.event = {
      type: EventType.Consent,
      name: `${created ? 'Completed' : 'Updated'} Gillick assessment`,
      date: created ? assessment.created : new Date().toISOString(),
      user_uuid: assessment.created_user_uuid
    }
  }

  set reply(reply) {
    if (!reply) {
      return
    }

    const created = !this.replies[reply.uuid]

    this.replies[reply.uuid] = reply
    this.event = {
      type: EventType.Consent,
      name: created
        ? `${reply.decision} by ${reply.fullName} (${reply.relationship})`
        : `${reply.decision} in updated response from ${reply.fullName} (${reply.relationship})`,
      date: created ? reply.created : new Date().toISOString(),
      user_uuid: reply.created_user_uuid
    }
  }
}
