import { isAfter } from 'date-fns'

import vaccines from '../datasets/vaccines.js'
import { isBetweenDates, today } from '../utils/date.js'
import { formatLink } from '../utils/string.js'

import { Cohort } from './cohort.js'
import { PatientSession } from './patient-session.js'
import { Record } from './record.js'
import { SchoolTerm } from './school.js'
import { Session } from './session.js'
import { Upload } from './upload.js'
import { Vaccination } from './vaccination.js'
import { Vaccine } from './vaccine.js'

/**
 * @readonly
 * @enum {string}
 */
export const ProgrammeStatus = {
  Planned: 'Planned',
  Current: 'Current',
  Completed: 'Completed'
}

/**
 * @readonly
 * @enum {string}
 */
export const ProgrammeType = {
  Flu: 'Flu',
  HPV: 'HPV',
  TdIPV: 'TdIPV',
  MenACWY: 'MenACWY'
}

export const programmeTypes = {
  [ProgrammeType.Flu]: {
    pid: 'flu',
    name: 'Flu',
    active: false,
    information: {
      title: 'Flu',
      description: `The vaccine protects against flu, which can cause serious health problems.`,
      audience:
        'By preventing the spread of flu, the vaccine also protects others who are vulnerable, such as babies and older people. The vaccination is a quick and painless spray up the nose. Even if your child had the vaccine last year, the type of flu can vary each winter, so it is recommended to have it again this year.',
      url: 'https://www.nhs.uk/vaccinations/child-flu-vaccine/'
    },
    term: SchoolTerm.Autumn,
    seasonal: true,
    yearGroups: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    vaccines: ['05000456078276', '5000123114115']
  },
  [ProgrammeType.HPV]: {
    pid: 'hpv',
    name: 'HPV',
    active: true,
    information: {
      title: 'Human papillomavirus (HPV)',
      description: `The HPV vaccine helps protect boys and girls against cancers caused by HPV, including:\n- cervical cancer\n- some mouth and throat (head and neck) cancers\n- some cancers of the anal and genital areas`,
      audience:
        'The HPV vaccine has been given to girls since 2008. Following its success at helping prevent cervical cancers, it was introduced to boys in 2019 to help prevent HPV-related cancers that affect them.\n\nYoung people usually only need 1 dose.',
      url: 'https://www.nhs.uk/conditions/vaccinations/hpv-human-papillomavirus-vaccine/',
      leaflet: 'https://www.medicines.org.uk/emc/files/pil.7330.pdf'
    },
    term: SchoolTerm.Spring,
    yearGroups: [8, 9, 10, 11],
    vaccines: ['00191778001693']
  },
  [ProgrammeType.TdIPV]: {
    pid: 'td-ipv',
    name: 'Td/IPV',
    active: true,
    information: {
      title: 'Td/IPV (3-in-1 teenage booster)',
      description:
        'The Td/IPV vaccine helps protect against:\n- tetanus\n - diptheria\n- polio',
      audience:
        'The Td/IPV vaccine (3-in-1 teenage booster) is offered at around 13 or 14 years old (school year 9 or 10). It boosts the protection provided by the [6-in-1 vaccine](https://www.nhs.uk/vaccinations/6-in-1-vaccine/) and [4-in-1 pre-school booster vaccine](https://www.nhs.uk/vaccinations/4-in-1-preschool-booster-vaccine/).',
      url: 'https://www.nhs.uk/vaccinations/td-ipv-vaccine-3-in-1-teenage-booster/'
    },
    term: SchoolTerm.Summer,
    yearGroups: [9, 10, 11],
    vaccines: ['3664798042948']
  },
  [ProgrammeType.MenACWY]: {
    pid: 'menacwy',
    name: 'MenACWY',
    active: true,
    information: {
      title: 'MenACWY',
      description:
        'The MenACWY vaccine helps protect against life-threatening illnesses including:\n - meningitis\n- sepsis\n- septicaemia (blood poisoning)',
      audience:
        'The MenACWY vaccine is recommended for all teenagers. Most people only need 1 dose of the vaccine.',
      url: 'https://www.nhs.uk/vaccinations/menacwy-vaccine/'
    },
    term: SchoolTerm.Summer,
    yearGroups: [9, 10, 11],
    vaccines: ['5415062370568']
  }
}

/**
 * @class Programme
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} name - Name
 * @property {boolean} active - Active programme
 * @property {boolean} seasonal - Seasonal programme
 * @property {ProgrammeStatus} status - Status
 * @property {SchoolTerm} term - School term administered in
 * @property {ProgrammeType} type - Programme type
 * @property {Array[string]} cohort_uids - Cohort UIDs
 * @property {Array[number]} yearGroups - Year groups available to
 * @property {Array[string]} vaccines - Vaccines administered
 * @property {string} pid - Programme ID
 * @property {string} ns - Namespace
 * @property {string} uri - URL
 */
export class Programme {
  constructor(options, context) {
    this.context = context
    this.name = options?.type && programmeTypes[options.type]?.name
    this.information =
      options?.type && programmeTypes[options.type]?.information
    this.active = options?.type && programmeTypes[options.type]?.active
    this.seasonal = options?.type && programmeTypes[options.type]?.seasonal
    this.term = options?.type && programmeTypes[options.type]?.term
    this.type = options?.type
    this.cohort_uids = options?.cohort_uids || []
    this.yearGroups = options?.type && programmeTypes[options.type]?.yearGroups
    this.vaccines = options?.type && programmeTypes[options.type]?.vaccines
  }

  /**
   * Get status
   *
   * @returns {string} - Status
   */
  get status() {
    const { from, to } = programmeTypes[this.type].schedule

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
   * @returns {string} - Start date
   */
  get start() {
    const thisYear = new Date().getFullYear()

    return `${thisYear}-09-01`
  }

  /**
   * Get programme ID
   *
   * @returns {string} - Programme ID
   */
  get pid() {
    return programmeTypes[this.type].pid
  }

  /**
   * Get vaccine used by this programme
   *
   * @todo A programme can use multiple vaccines, and one used for a patient
   * will depend on answers to screening questions in consent flow. For now,
   * however we’ll assume each programme administers one vaccine.
   * @returns {import('./vaccine.js').Vaccine} Vaccine
   */
  get vaccine() {
    return new Vaccine(vaccines[this.vaccines[0]])
  }

  /**
   * Get cohorts
   *
   * @returns {Array<Cohort>} - Cohorts
   */
  get cohorts() {
    return this.cohort_uids.map((uid) => Cohort.read(uid, this.context))
  }

  /**
   * Get uploads
   *
   * @returns {Array<Upload>} - Uploads
   */
  get uploads() {
    return Upload.readAll(this.context).filter(
      ({ programme_pid }) => programme_pid === this.pid
    )
  }

  /**
   * Get patient sessions
   *
   * @returns {Array<PatientSession>} - Patient sessions
   */
  get patientSessions() {
    return PatientSession.readAll(this.context).filter(({ session }) =>
      session.programme_pids.includes(this.pid)
    )
  }

  /**
   * Get sessions
   *
   * @returns {Array<Session>} - Sessions
   */
  get sessions() {
    return Session.readAll(this.context)
      .filter(({ programme_pids }) => programme_pids.includes(this.pid))
      .filter(({ patients }) => patients.length > 0)
  }

  /**
   * Get upload reviews
   *
   * @returns {Array<Session>} - Sessions
   */
  get reviews() {
    // Only mock issues with uploaded records if there are uploads
    if (this.context?.sessions && this.uploads.length) {
      return this.uploads[0].record_nhsns
        .slice(0, 3)
        .map((record) => new Record(record))
    }

    return []
  }

  /**
   * Get vaccinations
   *
   * @returns {Array<Vaccination>} - Vaccinations
   */
  get vaccinations() {
    return Vaccination.readAll(this.context).filter(
      ({ programme_pid }) => programme_pid === this.pid
    )
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    const vaccineList = Array.isArray(this.vaccines)
      ? this.vaccines.map((gtin) => new Vaccine(vaccines[gtin]).brand)
      : []

    return {
      vaccines: vaccineList.join('<br>')
    }
  }

  /**
   * Get formatted links
   *
   * @returns {object} - Formatted links
   */
  get link() {
    return {
      name: formatLink(this.uri, this.name)
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'programme'
  }

  /**
   * Get URI
   *
   * @returns {string} - URI
   */
  get uri() {
    return `/programmes/${this.pid}`
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
   * @param {string} pid - Programme PID
   * @param {object} context - Context
   * @returns {Programme|undefined} Programme
   * @static
   */
  static read(pid, context) {
    if (context?.programmes) {
      return new Programme(context.programmes[pid], context)
    }
  }
}
