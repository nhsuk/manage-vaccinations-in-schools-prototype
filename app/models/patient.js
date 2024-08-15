import { fakerEN_GB as faker } from '@faker-js/faker'
import { Event, EventType } from './event.js'
import { Gillick } from './gillick.js'
import { Record } from './record.js'
import {
  getConsentHealthAnswers,
  getConsentOutcome,
  getConsentRefusalReasons,
  getPreferredNames
} from '../utils/reply.js'
import {
  getCaptureOutcome,
  getRegistrationOutcome,
  getPatientOutcome
} from '../utils/capture.js'
import { formatLink, stringToBoolean } from '../utils/string.js'
import { getScreenOutcome, getTriageOutcome } from '../utils/triage.js'
import { Vaccination } from './vaccination.js'

export class ConsentOutcome {
  static NoResponse = 'No response'
  static Inconsistent = 'Conflicts'
  static Given = 'Given'
  static Refused = 'Refused'
  static FinalRefusal = 'Refusal confirmed'
}

export class ScreenOutcome {
  static NeedsTriage = 'Needs triage'
  static DelayVaccination = 'Delay vaccination to a later date'
  static DoNotVaccinate = 'Do not vaccinate in campaign'
  static Vaccinate = 'Safe to vaccinate'
}

export class TriageOutcome {
  static Needed = 'Triage needed'
  static Completed = 'Triage completed'
  static NotNeeded = 'No triage needed'
}

export class CaptureOutcome {
  static Register = 'Register attendance'
  static GetConsent = 'Get consent'
  static CheckRefusal = 'Check refusal'
  static NeedsTriage = 'Triage'
  static DoNotVaccinate = 'Do not vaccinate'
  static Vaccinate = 'Vaccinate'
}

export class PatientOutcome {
  static NoOutcomeYet = 'No outcome yet'
  static Vaccinated = 'Vaccinated'
  static CouldNotVaccinate = 'Could not vaccinate'
}

/**
 * @class Patient in-session record
 * @property {string} uuid - UUID
 * @property {Array<import('./event.js').Event>} events - Logged events
 * @property {object} replies - Consent replies
 * @property {import('./record.js').Record} record - CHIS record
 * @property {boolean} [registered] - Checked in?
 * @property {Gillick} [gillick] - Gillick assessment
 * @property {Array<string>} [vaccinations] - Vaccination UUIDs
 * @property {string} [campaign_uid] - Campaign UID
 * @property {string} [session_id] - Session ID
 * @function consent - Consent outcome
 * @function screen - Screening outcome
 * @function registration - Registration status
 * @function capture - Capture outcome
 * @function outcome - Overall outcome
 * @function preferredNames - Preferred name(s)
 * @function ns - Namespace
 * @function uri - URL
 */
export class Patient {
  constructor(options) {
    this.uuid = options?.uuid || faker.string.uuid()
    this.events = options?.events || []
    this.replies = options?.replies || {}
    this.record = options?.record && new Record(options.record)
    this.registered = stringToBoolean(options?.registered)
    this.gillick = options?.gillick && new Gillick(options.gillick)
    this.vaccinations = options?.vaccinations || {}
    this.campaign_uid = options.campaign_uid
    this.session_id = options.session_id
  }

  static generate(record) {
    return new Patient({
      nhsn: record.nhsn,
      record
    })
  }

  get nhsn() {
    return this.record.nhsn
  }

  get firstName() {
    return this.record.firstName
  }

  get fullName() {
    return [this.record.firstName, this.record.lastName].join(' ')
  }

  get link() {
    let fullName = `${formatLink(this.uri, this.fullName)}`
    if (this.preferredNames) {
      fullName += `<br><span class="nhsuk-u-secondary-text-color nhsuk-u-font-size-16">Known as: ${this.preferredNames}</span>`
    }

    return { fullName }
  }

  get groupedEvents() {
    const events = this.events.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )

    return Object.groupBy(events, (event) => {
      return new Event(event).formatted.date
    })
  }

  get consentHealthAnswers() {
    return getConsentHealthAnswers(this.replies)
  }

  get consentRefusalReasons() {
    return getConsentRefusalReasons(this.replies)
  }

  get screen() {
    return getScreenOutcome(this)
  }

  get triage() {
    return getTriageOutcome(this)
  }

  get triageNotes() {
    return this.events
      .map((event) => new Event(event))
      .filter((event) => event.type === EventType.Screen)
  }

  get registration() {
    return getRegistrationOutcome(this)
  }

  get capture() {
    return getCaptureOutcome(this)
  }

  get outcome() {
    return getPatientOutcome(this)
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

  set log(event) {
    this.events.push(new Event(event))
  }

  set select(campaign) {
    this.campaign_uid = campaign.uid
    this.log = {
      type: EventType.Select,
      name: `Selected for ${campaign.name} vaccination programme cohort`,
      date: campaign.created,
      user_uid: campaign.created_user_uid
    }
  }

  set invite(session) {
    this.session_id = session.id
    this.log = {
      type: EventType.Invite,
      name: `Invited to session at ${session.location.name}`,
      date: session.created,
      user_uid: session.created_user_uid
    }
  }

  set assess(gillick) {
    const created = this.gillick && !Object.entries(this.gillick).length

    this.gillick = gillick
    this.log = {
      type: EventType.Consent,
      name: `${created ? 'Completed' : 'Updated'} Gillick assessment`,
      note: gillick.notes,
      date: created ? gillick.created : new Date().toISOString(),
      user_uid: gillick.created_user_uid
    }
  }

  set respond(reply) {
    if (!reply) {
      return
    }

    const { decision, fullName, invalid, relationship, uuid } = reply
    const created = !this.replies[uuid]

    let name = `${decision} by ${fullName} (${relationship})`
    if (invalid) {
      name = `${decision} by ${fullName} (${relationship}) marked as invalid`
    } else if (created) {
      name = `${decision} in updated response from ${fullName} (${relationship})`
    }

    this.replies[uuid] = reply
    this.log = {
      type: EventType.Consent,
      name,
      date: created ? reply.created : new Date().toISOString(),
      user_uid: reply.created_user_uid
    }
  }

  set triage(triage) {
    const outcome =
      triage.outcome === ScreenOutcome.NeedsTriage
        ? 'Keep in triage'
        : triage.outcome

    this.log = {
      type: EventType.Screen,
      name: `Triaged decision: ${outcome}`,
      note: triage.notes,
      date: new Date().toISOString(),
      user_uid: triage.created_user_uid,
      info_: triage
    }
  }

  set register(registration) {
    this.registered = registration.registered
    this.log = {
      type: EventType.Capture,
      name: registration.name,
      date: new Date().toISOString(),
      user_uid: registration.created_user_uid
    }
  }

  set preScreen(interview) {
    this.log = {
      type: EventType.Screen,
      name: 'Completed pre-screening checks',
      note: interview.notes,
      date: new Date().toISOString(),
      user_uid: interview.user_uid
    }
  }

  set capture(vaccination) {
    vaccination = new Vaccination(vaccination)

    let name
    if (vaccination.given) {
      name = vaccination.updated
        ? `Vaccination record for ${vaccination.formatted.vaccine_gtin} updated`
        : `Vaccinated with ${vaccination.formatted.vaccine_gtin}`
    } else {
      name = `Unable to vaccinate: ${vaccination.outcome}`
    }

    // Providing a boolean for vaccination enables patient outcome calculation
    this.vaccinations[vaccination.uuid] = vaccination.given

    this.log = {
      type: EventType.Capture,
      name,
      note: vaccination.notes,
      date: vaccination.updated || vaccination.created,
      user_uid: vaccination.user_uid
    }
  }
}
