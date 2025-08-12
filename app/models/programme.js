import { isAfter } from 'date-fns'

import programmes from '../datasets/programmes.js'
import vaccines from '../datasets/vaccines.js'
import { ProgrammeStatus, VaccineMethod } from '../enums.js'
import { isBetweenDates, today } from '../utils/date.js'
import {
  formatLink,
  formatTag,
  sentenceCaseProgrammeName
} from '../utils/string.js'

import { Cohort } from './cohort.js'
import { PatientSession } from './patient-session.js'
import { Session } from './session.js'
import { Vaccination } from './vaccination.js'
import { Vaccine } from './vaccine.js'

/**
 * @class Programme
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} id - ID
 * @property {string} name - Name
 * @property {string} title - Title
 * @property {object} information - NHS.UK programme information
 * @property {object} guidance - GOV.UK guidance
 * @property {ProgrammeStatus} status - Status
 * @property {ProgrammeType} type - Programme type
 * @property {AcademicYear} year - Academic year
 * @property {Array<string>} sequence - Vaccine dose sequence
 * @property {string} sequenceDefault - Default vaccine dose sequence
 * @property {Array<number>} yearGroups - Year groups available to
 * @property {boolean} nhseSyncable- Vaccination records can be synced
 * @property {Array<string>} cohort_uids - Cohort UIDs
 * @property {Array<string>} vaccine_smomeds - Vaccines administered
 */
export class Programme {
  constructor(options, context) {
    this.context = context
    this.id = options?.id
    this.title = options?.title
    this.information = options?.information
    this.guidance = options?.guidance
    this.year = options?.year
    this.type = options?.type
    this.sequence = options?.sequence
    this.sequenceDefault = options?.sequenceDefault
    this.yearGroups = options?.yearGroups
    this.nhseSyncable = options?.nhseSyncable
    this.cohort_uids = options?.cohort_uids || []
    this.vaccine_smomeds = options?.vaccine_smomeds
  }

  /**
   * Get programme name
   *
   * @returns {string} Programme name
   */
  get name() {
    return this.type
  }

  /**
   * Get programme name for use within a sentence
   *
   * @returns {string} Programme name
   */
  get nameSentenceCase() {
    return sentenceCaseProgrammeName(this.type)
  }

  /**
   * Get programme name shown within tag component
   *
   * @returns {string} Tag component HTML
   */
  get nameTag() {
    return formatTag({
      text: this.name,
      colour: 'transparent'
    })
  }

  /**
   * Get status
   *
   * @returns {string} Status
   */
  get status() {
    const { from, to } = programmes[this.type].schedule

    if (isBetweenDates(today(), from, to)) {
      return ProgrammeStatus.Current
    } else if (isAfter(today(), to)) {
      return ProgrammeStatus.Completed
    }
    return ProgrammeStatus.Planned
  }

  /**
   * Get start date
   *
   * @returns {string} Start date
   */
  get start() {
    const thisYear = new Date().getFullYear()

    return `${thisYear}-09-01`
  }

  /**
   * Get vaccine(s) used by this programme
   *
   * @returns {Array<import('./vaccine.js').Vaccine>} Vaccine
   */
  get vaccines() {
    return this.vaccine_smomeds.map((smomed) =>
      Vaccine.find(smomed, this.context)
    )
  }

  /**
   * Alternative vaccine for a programme
   * For example, flu programme offers nasal spray with injection as alternative
   *
   * @returns {Vaccine|undefined} Alternative vaccine
   */
  get alternativeVaccine() {
    if (this.vaccines.length > 1) {
      return this.vaccines.find(
        (vaccine) => vaccine && vaccine.method === VaccineMethod.Injection
      )
    }
  }

  /**
   * Get vaccine name
   *
   * @returns {object} Vaccine name
   * @example Children’s flu vaccine
   * @example Td/IPV vaccine (3-in-1 teenage booster)
   */
  get vaccineName() {
    const vaccineName = programmes[this.type].vaccineName

    return {
      sentenceCase: sentenceCaseProgrammeName(vaccineName),
      titleCase: vaccineName
    }
  }

  /**
   * Get cohorts
   *
   * @returns {Array<Cohort>} Cohorts
   */
  get cohorts() {
    return this.cohort_uids.map((uid) => Cohort.read(uid, this.context))
  }

  /**
   * Get consent form PDF
   *
   * @returns {string} Consent form PDF
   */
  get consentPdf() {
    return `/public/downloads/${this.id}-consent-form.pdf`
  }

  /**
   * Get patient sessions
   *
   * @returns {Array<PatientSession>} Patient sessions
   */
  get patientSessions() {
    return PatientSession.readAll(this.context).filter(
      ({ programme_id }) => programme_id === this.id
    )
  }

  /**
   * Get sessions
   *
   * @returns {Array<Session>} Sessions
   */
  get sessions() {
    return Session.readAll(this.context)
      .filter(({ programme_ids }) => programme_ids.includes(this.id))
      .filter(({ patients }) => patients.length > 0)
      .sort((a, b) => a.location?.name.localeCompare(b.location?.name))
  }

  /**
   * Get vaccinations
   *
   * @returns {Array<Vaccination>} Vaccinations
   */
  get vaccinations() {
    return Vaccination.readAll(this.context)
      .filter(({ programme_id }) => programme_id === this.id)
      .sort((a, b) => a.patient?.lastName.localeCompare(b.patient?.lastName))
  }

  /**
   * Get patient (programme) outcomes
   *
   * @param {import('../enums.js').PatientOutcome} patientOutcome - Patient outcome
   * @returns {Array<PatientSession>} Patient sessions
   */
  report(patientOutcome) {
    return this.patientSessions.filter(
      ({ report }) => report === patientOutcome
    )
  }

  /**
   * Get formatted values
   *
   * @returns {object} Formatted values
   */
  get formatted() {
    const vaccineList = Array.isArray(this.vaccine_smomeds)
      ? this.vaccine_smomeds.map(
          (snomed) => new Vaccine(vaccines[snomed]).brand
        )
      : []

    return {
      consentPdf:
        this.consentPdf &&
        formatLink(
          this.consentPdf,
          `Download the ${this.name} consent form (PDF)`,
          {
            download: 'true'
          }
        ),
      vaccines: vaccineList.join('<br>')
    }
  }

  /**
   * Get formatted links
   *
   * @returns {object} Formatted links
   */
  get link() {
    return {
      name: formatLink(this.uri, this.name)
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} Namespace
   */
  get ns() {
    return 'programme'
  }

  /**
   * Get URI
   *
   * @returns {string} URI
   */
  get uri() {
    return `/programmes/${this.id}`
  }

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<Programme>|undefined} Programmes
   * @static
   */
  static readAll(context) {
    return Object.values(context.programmes).map(
      (programme) => new Programme(programme, context)
    )
  }

  /**
   * Read
   *
   * @param {string} id - Programme ID
   * @param {object} context - Context
   * @returns {Programme|undefined} Programme
   * @static
   */
  static read(id, context) {
    if (context?.programmes?.[id]) {
      return new Programme(context.programmes[id], context)
    }
  }
}
