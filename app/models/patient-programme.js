import { PatientConsentStatus, PatientStatus, ProgrammeType } from '../enums.js'
import { getCurrentAcademicYear } from '../utils/date.js'
import { getReportOutcome } from '../utils/patient-session.js'
import { getPatientStatus } from '../utils/status.js'
import { formatProgrammeStatus, formatTag } from '../utils/string.js'

import { Patient } from './patient.js'
import { Programme } from './programme.js'

/**
 * @class Patient Programme
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} patient_uuid - Patient UUID
 * @property {string} programme_id - Programme ID
 */
export class PatientProgramme {
  constructor(options, context) {
    this.context = context
    this.patient_uuid = options?.patient_uuid
    this.programme_id = options?.programme_id
  }

  /**
   * Get patient
   *
   * @returns {Patient|undefined} Patient
   */
  get patient() {
    try {
      if (this.patient_uuid) {
        return Patient.findOne(this.patient_uuid, this.context)
      }
    } catch (error) {
      console.error('PatientProgramme.patient', error.message)
    }
  }

  /**
   * Get programme
   *
   * @returns {Programme|undefined} Programme
   */
  get programme() {
    try {
      return Programme.findOne(this.programme_id, this.context)
    } catch (error) {
      console.error('PatientProgramme.programme', error.message)
    }
  }

  /**
   * Year patient is eligible for programme
   *
   * @returns {number} Year patient becomes eligible for programme
   */
  get year() {
    if (!this.programme) {
      return
    }

    if (this.programme.type === ProgrammeType.Flu) {
      return getCurrentAcademicYear()
    }

    const yearsUntilEligible =
      this.programme.targetYearGroup - this.patient.yearGroup

    return getCurrentAcademicYear() + yearsUntilEligible
  }

  /**
   * Get audit events for this patient programme
   *
   * @returns {Array<import('./audit-event.js').AuditEvent>} Audit events
   */
  get auditEvents() {
    return this.patient.auditEvents.filter(({ programme_ids }) =>
      programme_ids?.some((id) => this.programme_id === id)
    )
  }

  /**
   * Get patient sessions for this patient programme
   *
   * @returns {Array<import('./patient-session.js').PatientSession>} Patient sessions
   */
  get patientSessions() {
    return this.patient?.patientSessions.filter(
      ({ programme_id }) => programme_id === this.programme_id
    )
  }

  /**
   * Get most recent patient session
   *
   * @returns {import('./patient-session.js').PatientSession} Patient session
   */
  get lastPatientSession() {
    if (this.patientSessions?.length > 0) {
      return this.patientSessions.at(-1)
    }
  }

  /**
   * Eligible for vaccination
   *
   * @returns {boolean} Eligible for vaccination
   */
  get inviteToSession() {
    return (
      this.status !== PatientStatus.Ineligible &&
      this.status !== PatientStatus.Vaccinated
    )
  }

  /**
   * Get vaccinations for patient session
   *
   * @returns {Array<import('./vaccination.js').Vaccination>|undefined} Vaccinations
   */
  get vaccinations() {
    return this.patient?.vaccinations.filter(
      ({ programme }) => programme.id === this.programme_id
    )
  }

  /**
   * Get last recorded vaccination
   *
   * @returns {import('./vaccination.js').Vaccination} Vaccination
   */
  get lastRecordedVaccination() {
    if (this.vaccinations?.length > 0) {
      return this.vaccinations.at(-1)
    }
  }

  /**
   * Get vaccinations given for patient session
   *
   * @returns {Array<import('./vaccination.js').Vaccination>|undefined} Vaccinations
   */
  get vaccinationsGiven() {
    return this.vaccinations.filter((vaccination) => vaccination.given)
  }

  /**
   * Get vaccinations doses remaining
   *
   * @returns {number|undefined} Doses remaining
   */
  get vaccinationsRemaining() {
    if (this.vaccinations?.length > 0) {
      return this.programme?.type === ProgrammeType.MMR
        ? 2 - this.vaccinationsGiven.length
        : 1 - this.vaccinationsGiven.length
    }
  }

  /**
   * Get vaccination due
   *
   * @returns {string} Vaccination due
   */
  get vaccinationDue() {
    switch (true) {
      case this.vaccinationsRemaining === 2:
        return 'Due 1st dose'
      case this.vaccinationsRemaining === 1:
        return this.programme.type === ProgrammeType.MMR
          ? 'Due 2nd dose'
          : PatientStatus.Due
      default:
        return PatientStatus.Due
    }
  }

  /**
   * Get status
   *
   * @returns {PatientStatus} Status properties
   */
  get status() {
    // Not eligible for programme yet
    if (getCurrentAcademicYear() < this.year) {
      return PatientStatus.Ineligible
    }

    // Is fully vaccinated
    if (this.vaccinationsRemaining === 0) {
      return PatientStatus.Vaccinated
    }

    // Has been invited to a session
    if (this.lastPatientSession) {
      return getReportOutcome(this.lastPatientSession)
    }

    // Needs to be invited to a session
    return PatientStatus.Consent
  }

  /**
   * Get explanatory notes
   *
   * @returns {string} Explanatory notes
   */
  get statusNotes() {
    switch (this.status) {
      case PatientStatus.Ineligible:
        return `Eligible from 1 September ${this.year}`
      case PatientStatus.Vaccinated:
        return `${this.lastPatientSession.patientVaccinated} on ${this.lastRecordedVaccination.formatted.createdAt_dateShort}`
      case PatientStatus.Due:
        return this.lastPatientSession.vaccineCriteria
      case PatientStatus.Deferred:
        return this.lastRecordedVaccination
          ? `${this.lastPatientSession.patientDeferred} on ${this.lastRecordedVaccination.formatted.createdAt_dateShort}`
          : this.lastPatientSession.patientDeferred
      case PatientStatus.Refused:
        return this.lastPatientSession.patientRefused
      case PatientStatus.Consent:
        return this.lastPatientSession
          ? this.lastPatientSession.patientConsent
          : PatientConsentStatus.NotScheduled
    }
  }

  /**
   * Get vaccine to administer (or was administered) in this patient session
   *
   * @returns {import('../enums.js').RecordVaccineCriteria} Vaccine criteria
   */
  get vaccineCriteria() {
    return this.lastPatientSession.vaccineCriteria
  }

  /**
   * Get formatted values
   *
   * @returns {object} Formatted values
   */
  get formatted() {
    return {
      status: formatTag(getPatientStatus(this.status)),
      programmeStatus: formatProgrammeStatus(
        this.programme,
        getPatientStatus(this.status),
        this.statusNotes
      )
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} Namespace
   */
  get ns() {
    return 'patientProgramme'
  }

  /**
   * Get URI
   *
   * @returns {string} URI
   */
  get uri() {
    return `/patients/${this.patient_uuid}/programmes/${this.programme_id}`
  }
}
