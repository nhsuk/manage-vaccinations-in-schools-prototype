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
import { stringToBoolean } from '../utils/string.js'
import { getScreenOutcome, getTriageOutcome } from '../utils/triage.js'
import { Vaccination, VaccinationOutcome } from './vaccination.js'

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
 * @property {string} nhsn - NHS number
 * @property {Array<import('./event.js').Event>} events - Logged events
 * @property {object} replies - Consent replies
 * @property {import('./record.js').Record} record - CHIS record
 * @property {boolean} [registered] - Checked in?
 * @property {import('./gillick.js').Gillick} [gillick] - Gillick assessment
 * @property {Array<import('./vaccination.js').Vaccination>} [vaccinations] - Vaccinations
 * @property {string} [campaign_uuid] - Campaign UUID
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
    this.nhsn = options?.nhsn || this.#nhsn
    this.events = options?.events || []
    this.replies = options?.replies || {}
    this.record = new Record(options.record)
    this.registered = stringToBoolean(options?.registered)
    this.gillick = new Gillick(options.gillick)
    this.vaccinations = options?.vaccinations || {}
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
    this.campaign_uuid = campaign.uuid
    this.log = {
      type: EventType.Select,
      name: `Selected for ${campaign.name} vaccination programme cohort`,
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

  set assess(gillick) {
    const created = !Object.entries(this.gillick).length

    this.gillick = gillick
    this.log = {
      type: EventType.Consent,
      name: `${created ? 'Completed' : 'Updated'} Gillick assessment`,
      note: gillick.notes,
      date: created ? gillick.created : new Date().toISOString(),
      user_uuid: gillick.created_user_uuid
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
        ? `${reply.decision} by ${reply.fullName} (${reply.relationship})`
        : `${reply.decision} in updated response from ${reply.fullName} (${reply.relationship})`,
      date: created ? reply.created : new Date().toISOString(),
      user_uuid: reply.created_user_uuid
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
      user_uuid: triage.created_user_uuid,
      info_: triage
    }
  }

  set register(registration) {
    this.registered = registration.registered
    this.log = {
      type: EventType.Capture,
      name: registration.name,
      date: new Date().toISOString(),
      user_uuid: registration.created_user_uuid
    }
  }

  set preScreen(interview) {
    this.log = {
      type: EventType.Screen,
      name: 'Completed pre-screening checks',
      note: interview.notes,
      date: new Date().toISOString(),
      user_uuid: interview.user_uuid
    }
  }

  set capture(vaccination) {
    const created = !this.vaccinations[vaccination.uuid]
    vaccination = new Vaccination(vaccination)

    let name
    if (
      vaccination.outcome === VaccinationOutcome.Vaccinated ||
      vaccination.outcome === VaccinationOutcome.PartVaccinated
    ) {
      name = created
        ? `Vaccinated with ${vaccination.formattedName}`
        : `Vaccination record for ${vaccination.formattedName} updated`
    } else {
      name = `Unable to vaccinate: ${vaccination.outcome}`
    }

    this.vaccinations[vaccination.uuid] = vaccination
    this.log = {
      type: EventType.Capture,
      name,
      note: vaccination.notes,
      date: created ? vaccination.created : new Date().toISOString(),
      user_uuid: vaccination.user_uuid
    }
  }
}
