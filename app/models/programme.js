import { isAfter } from 'date-fns'

import vaccines from '../datasets/vaccines.js'
import { isBetweenDates, today } from '../utils/date.js'
import { formatLink, formatTag } from '../utils/string.js'

import { Cohort } from './cohort.js'
import { PatientSession } from './patient-session.js'
import { SchoolTerm, SchoolYear } from './school.js'
import { Session } from './session.js'
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
      startPage:
        'The vaccination helps to protect children against flu. It also protects others who are vulnerable to flu, such as babies and older people.',
      description:
        'The vaccine protects against flu, which can cause serious health problems.\n\nBy preventing the spread of flu, the vaccine also protects others who are vulnerable, such as babies and older people. The vaccination is a quick and painless spray up the nose. Even if your child had the vaccine last year, the type of flu can vary each winter, so it is recommended to have it again this year.',
      url: 'https://www.nhs.uk/vaccinations/child-flu-vaccine/'
    },
    term: SchoolTerm.Autumn,
    seasonal: true,
    yearGroups: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    vaccine_smomeds: ['43208811000001106', '40085011000001101']
  },
  [ProgrammeType.HPV]: {
    pid: 'hpv',
    name: 'HPV',
    active: true,
    information: {
      title: 'Human papillomavirus (HPV)',
      startPage:
        'The HPV vaccine helps to prevent HPV related cancers from developing in boys and girls.\n\nThe number of doses you need depends on your age and how well your immune system works. Young people usually only need 1 dose.',
      description:
        'The HPV vaccine helps protect boys and girls against cancers caused by HPV, including:\n- cervical cancer\n- some mouth and throat (head and neck) cancers\n- some cancers of the anal and genital areas\n\nThe HPV vaccine has been given to girls since 2008. Following its success at helping prevent cervical cancers, it was introduced to boys in 2019 to help prevent HPV-related cancers that affect them.\n\nYoung people usually only need 1 dose.',
      url: 'https://www.nhs.uk/conditions/vaccinations/hpv-human-papillomavirus-vaccine/'
    },
    leaflet: {
      html: 'https://www.gov.uk/government/publications/hpv-vaccine-vaccination-guide-leaflet/information-on-the-hpv-vaccination-from-september-2023',
      pdf: 'https://assets.publishing.service.gov.uk/media/64919b26103ca6000c03a212/HPV_Vaccination_For_All_-_English_Leaflet_from_September_2023.pdf'
    },
    term: SchoolTerm.Spring,
    sequence: ['1P', '2P', '3P'],
    sequenceDefault: '1P',
    yearGroups: [8, 9, 10, 11],
    vaccine_smomeds: ['33493111000001108']
  },
  [ProgrammeType.TdIPV]: {
    pid: 'td-ipv',
    name: 'Td/IPV',
    active: true,
    information: {
      title: 'Td/IPV (3-in-1 teenage booster)',
      startPage:
        'The Td/IPV vaccine (also called the 3-in-1 teenage booster) helps protect against tetanus, diphtheria and polio.\n\nIt boosts the protection provided by the [6-in-1 vaccine](https://www.nhs.uk/vaccinations/6-in-1-vaccine/) and [4-in-1 pre-school booster vaccine](https://www.nhs.uk/vaccinations/4-in-1-preschool-booster-vaccine/).',
      description:
        'The Td/IPV vaccine (also called the 3-in-1 teenage booster) helps protect against tetanus, diphtheria and polio.\n\nIt’s offered at around 13 or 14 years old (school year 9 or 10). It boosts the protection provided by the [6-in-1 vaccine](https://www.nhs.uk/vaccinations/6-in-1-vaccine/) and [4-in-1 pre-school booster vaccine](https://www.nhs.uk/vaccinations/4-in-1-preschool-booster-vaccine/).',
      url: 'https://www.nhs.uk/vaccinations/td-ipv-vaccine-3-in-1-teenage-booster/'
    },
    leaflet: {
      html: 'https://www.gov.uk/government/publications/a-guide-to-the-3-in-1-teenage-booster-tdipv/a-guide-to-the-3-in-1-teenage-booster-tdipv-vaccine',
      pdf: 'https://assets.publishing.service.gov.uk/media/64d125a5e5491a00134b596b/UKHSA_12658_Teenage_3-in-1_booster_guide___TdIPV_05_WEB.pdf'
    },
    term: SchoolTerm.Summer,
    sequence: ['1P', '2P', '3P', '1B', '2B'],
    sequenceDefault: '2B',
    yearGroups: [9, 10, 11],
    vaccine_smomeds: ['7374311000001101']
  },
  [ProgrammeType.MenACWY]: {
    pid: 'menacwy',
    name: 'MenACWY',
    active: true,
    information: {
      title: 'MenACWY',
      startPage:
        'The MenACWY vaccine helps protect against meningitis and sepsis. It is recommended for all teenagers. Most people only need one dose of the vaccine.',
      description:
        'The MenACWY vaccine helps protect against life-threatening illnesses including meningitis, sepsis and septicaemia (blood poisoning).\n\nIt is recommended for all teenagers. Most people only need 1 dose of the vaccine.',
      url: 'https://www.nhs.uk/vaccinations/menacwy-vaccine/'
    },
    leaflet: {
      html: 'https://www.gov.uk/government/publications/menacwy-vaccine-information-for-young-people/a-guide-to-the-menacwy-vaccine',
      pdf: 'https://assets.publishing.service.gov.uk/media/667308097d0f95cd08d0db6a/UKHSA_12972_MenACWY_vaccine_leaflet_July2024__WEB.pdf'
    },
    term: SchoolTerm.Summer,
    yearGroups: [9, 10, 11],
    vaccine_smomeds: ['39779611000001104']
  }
}

/**
 * @class Programme
 * @param {object} options - Options
 * @param {object} [context] - Context
 * @property {object} [context] - Context
 * @property {string} name - Name
 * @property {object} information - NHS.UK programme information
 * @property {object} leaflet - UKHSA programme information leaflets
 * @property {boolean} active - Active programme
 * @property {boolean} seasonal - Seasonal programme
 * @property {ProgrammeStatus} status - Status
 * @property {SchoolTerm} term - School term administered in
 * @property {ProgrammeType} type - Programme type
 * @property {Array<string>} sequence - Vaccine dose sequence
 * @property {string} sequenceDefault - Default vaccine dose sequence
 * @property {Array<number>} yearGroups - Year groups available to
 * @property {Array<string>} cohort_uids - Cohort UIDs
 * @property {Array<string>} vaccine_smomeds - Vaccines administered
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
    this.leaflet = options?.type && programmeTypes[options.type]?.leaflet
    this.active = options?.type && programmeTypes[options.type]?.active
    this.seasonal = options?.type && programmeTypes[options.type]?.seasonal
    this.year = options?.year || SchoolYear.Y2024
    this.term = options?.type && programmeTypes[options.type]?.term
    this.type = options?.type
    this.sequence = options?.type && programmeTypes[options.type]?.sequence
    this.sequenceDefault =
      options?.type && programmeTypes[options.type]?.sequenceDefault
    this.yearGroups = options?.type && programmeTypes[options.type]?.yearGroups
    this.cohort_uids = options?.cohort_uids || []
    this.vaccine_smomeds =
      options?.type && programmeTypes[options.type]?.vaccine_smomeds
  }

  /**
   * Get programme name shown within tag component
   *
   * @returns {string} - Tag component HTML
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
    return new Vaccine(vaccines[this.vaccine_smomeds[0]])
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
   * Get consent form PDF
   *
   * @returns {string} - Consent form PDF
   */
  get consentPdf() {
    return `/public/downloads/${this.pid}-consent-form.pdf`
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
          `Download the ${this.name} consent form (PDF, 26KB)`,
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
