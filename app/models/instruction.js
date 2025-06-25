import { fakerEN_GB as faker } from '@faker-js/faker'

import { ProgrammeType, VaccinationMethod, VaccinationSite } from '../enums.js'
import {
  convertIsoDateToObject,
  convertObjectToIsoDate,
  formatDate,
  today
} from '../utils/date.js'
import { formatLink, formatMillilitres } from '../utils/string.js'

import { PatientSession } from './patient-session.js'
import { Programme } from './programme.js'
import { User } from './user.js'

/**
 * @class Instruction
 * @param {object} options - Options
 * @param {object} [context] - Global context
 * @property {object} [context] - Global context
 * @property {string} uuid - UUID
 * @property {Date} [createdAt] - Created date
 * @property {object} [createdAt_] - Created date (from `dateInput`)
 * @property {string} [createdBy_uid] - User who performed instruction
 * @property {Date} [updatedAt] - Updated date
 * @property {import('../enums.js').InstructionOutcome} [outcome] - Outcome
 * @property {string} [patientSession_uuid] - Patient session UUID
 * @property {string} [programme_id] - Programme ID
 */
export class Instruction {
  constructor(options, context) {
    this.context = context
    this.uuid = options?.uuid || faker.string.uuid()
    this.createdAt = options?.createdAt ? new Date(options.createdAt) : today()
    this.createdAt_ = options?.createdAt_
    this.createdBy_uid = options?.createdBy_uid
    this.updatedAt = options?.updatedAt && new Date(options.updatedAt)
    this.patientSession_uuid = options?.patientSession_uuid
    this.programme_id = options?.programme_id
  }

  /**
   * Get created date for `dateInput`
   *
   * @returns {object|undefined} - `dateInput` object
   */
  get createdAt_() {
    return convertIsoDateToObject(this.createdAt)
  }

  /**
   * Set created date from `dateInput`
   *
   * @param {object} object - dateInput object
   */
  set createdAt_(object) {
    if (object) {
      this.createdAt = convertObjectToIsoDate(object)
    }
  }

  /**
   * Get vaccine
   *
   * @returns {import('./vaccine.js').Vaccine} - Vaccine
   */
  get vaccine() {
    return this.programme.vaccines.find(
      (vaccine) => vaccine.method === this.injectionMethod
    )
  }

  /**
   * Get dosage (ml)
   *
   * @returns {number} - Dosage
   */
  get dose() {
    return this.vaccine.dose
  }

  /**
   * Get injection method
   *
   * @returns {VaccinationMethod} - Injection method
   */
  get injectionMethod() {
    return this.programme.type === ProgrammeType.Flu
      ? VaccinationSite.Nose
      : VaccinationSite.ArmLeftLower
  }

  /**
   * Get anatomical site
   *
   * @returns {VaccinationSite} - Anatomical site
   */
  get injectionSite() {
    return this.programme.type === ProgrammeType.Flu
      ? VaccinationMethod.Nasal
      : VaccinationMethod.Intramuscular
  }

  /**
   * Get patient session
   *
   * @returns {PatientSession} - Patient session
   */
  get patientSession() {
    try {
      return PatientSession.read(this.patientSession_uuid, this.context)
    } catch (error) {
      console.error('Instruction.patientSession', error.message)
    }
  }

  /**
   * Get user who performed instruction
   *
   * @returns {User} - User
   */
  get createdBy() {
    try {
      if (this.createdBy_uid) {
        return User.read(this.createdBy_uid, this.context)
      }
    } catch (error) {
      console.error('Instruction.createdBy', error.message)
    }
  }

  /**
   * Get programme
   *
   * @returns {Programme} - Programme
   */
  get programme() {
    try {
      return Programme.read(this.programme_id, this.context)
    } catch (error) {
      console.error('Instruction.programme', error.message)
    }
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      createdAt: formatDate(this.createdAt, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      createdAt_date: formatDate(this.createdAt, {
        dateStyle: 'long'
      }),
      createdBy: this.createdBy?.fullName || '',
      updatedAt: formatDate(this.updatedAt, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      dose: formatMillilitres(this.dose),
      vaccine_snomed: this.vaccine?.brand,
      programme: this.programme && this.programme.nameTag
    }
  }

  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      createdAt_date: formatLink(this.uri, this.formatted.createdAt_date)
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'instruction'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/programmes/${this.programme_id}/instructions/${this.uuid}`
  }

  /**
   * Read all
   *
   * @param {object} context - Context
   * @returns {Array<Instruction>|undefined} Instructions
   * @static
   */
  static readAll(context) {
    return Object.values(context.instructions).map(
      (instruction) => new Instruction(instruction, context)
    )
  }

  /**
   * Read
   *
   * @param {string} uuid - Instruction UUID
   * @param {object} context - Context
   * @returns {Instruction|undefined} Instruction
   * @static
   */
  static read(uuid, context) {
    if (context?.instructions?.[uuid]) {
      return new Instruction(context.instructions[uuid], context)
    }
  }

  /**
   * Create
   *
   * @param {Instruction} instruction - Instruction
   * @param {object} context - Context
   */
  create(instruction, context) {
    instruction = new Instruction(instruction)

    // Update context
    context.instructions = context.instructions || {}
    context.instructions[instruction.uuid] = instruction
  }

  /**
   * Update
   *
   * @param {object} updates - Updates
   * @param {object} context - Context
   */
  update(updates, context) {
    this.updatedAt = new Date()

    // Remove patient context
    delete this.context

    // Delete original patient (with previous UUID)
    delete context.instructions[this.uuid]

    // Update context
    const updatedInstruction = Object.assign(this, updates)

    context.instructions[updatedInstruction.uuid] = updatedInstruction
  }
}
