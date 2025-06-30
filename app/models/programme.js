import { isAfter } from 'date-fns'

import vaccines from '../datasets/vaccines.js'
import {
  SchoolYear,
  ProgrammeStatus,
  ProgrammeType,
  VaccineMethod
} from '../enums.js'
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

export const programmeTypes = {
  [ProgrammeType.Flu]: {
    id: 'flu',
    name: 'Flu',
    title: 'Children’s flu',
    vaccineName: 'Children’s flu vaccine',
    information: {
      startPage:
        'Use this service to give or refuse consent for your child to have a flu vaccination.\n\nThis vaccination is recommended for school age children every year.\n\n## About the children’s flu vaccine\n\nThe children’s flu vaccine helps protect children against flu. Vaccinating children also protects others who are vulnerable to flu, such as babies and older people.\n\nThe vaccine is given as a nasal spray. This gives the most effective protection.\n\nSome children can have an injection instead, for example if they:\n\n- have had a serious allergic reaction to a previous dose of the nasal spray vaccine\n- have a severe egg allergy\n- have asthma that’s being treated with long-term steroid tablets',
      description:
        'The vaccine protects against flu, which can cause serious health problems such as bronchitis and pneumonia. It is recommended for children from Reception to Year 11 every year.',
      url: 'https://www.nhs.uk/vaccinations/child-flu-vaccine/'
    },
    guidance: {
      url: 'https://www.gov.uk/government/publications/flu-vaccination-leaflets-and-posters',
      hint: 'with information available in different languages and alternative formats, including BSL and Braille'
    },
    yearGroups: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    vaccine_smomeds: ['43208811000001106', '40085011000001101']
  },
  [ProgrammeType.HPV]: {
    id: 'hpv',
    name: 'HPV',
    title: 'Human papillomavirus (HPV)',
    vaccineName: 'HPV vaccine',
    information: {
      startPage:
        'The HPV vaccine helps to prevent HPV related cancers from developing in boys and girls.\n\nThe number of doses you need depends on your age and how well your immune system works. Young people usually only need 1 dose.',
      description:
        'The HPV vaccine helps protect boys and girls against cancers caused by HPV, including:\n- cervical cancer\n- some mouth and throat (head and neck) cancers\n- some cancers of the anal and genital areas\n\nThe HPV vaccine has been given to girls since 2008. Following its success at helping prevent cervical cancers, it was introduced to boys in 2019 to help prevent HPV-related cancers that affect them.\n\nYoung people usually only need 1 dose.',
      url: 'https://www.nhs.uk/conditions/vaccinations/hpv-human-papillomavirus-vaccine/'
    },
    guidance: {
      url: 'https://www.gov.uk/government/publications/hpv-vaccine-vaccination-guide-leaflet',
      hint: 'with information available in different languages and alternative formats, including BSL and Braille'
    },
    sequence: ['1P', '2P', '3P'],
    sequenceDefault: '1P',
    yearGroups: [8, 9, 10, 11],
    vaccine_smomeds: ['33493111000001108']
  },
  [ProgrammeType.TdIPV]: {
    id: 'td-ipv',
    name: 'Td/IPV',
    title: 'Td/IPV (3-in-1 teenage booster)',
    vaccineName: 'Td/IPV vaccine',
    information: {
      startPage:
        'The Td/IPV vaccine (also called the 3-in-1 teenage booster) helps protect against tetanus, diphtheria and polio.\n\nIt boosts the protection provided by the [6-in-1 vaccine](https://www.nhs.uk/vaccinations/6-in-1-vaccine/) and [4-in-1 pre-school booster vaccine](https://www.nhs.uk/vaccinations/4-in-1-preschool-booster-vaccine/).',
      description:
        'The Td/IPV vaccine (also called the 3-in-1 teenage booster) helps protect against tetanus, diphtheria and polio.\n\nIt’s offered at around 13 or 14 years old (school year 9 or 10). It boosts the protection provided by the [6-in-1 vaccine](https://www.nhs.uk/vaccinations/6-in-1-vaccine/) and [4-in-1 pre-school booster vaccine](https://www.nhs.uk/vaccinations/4-in-1-preschool-booster-vaccine/).',
      url: 'https://www.nhs.uk/vaccinations/td-ipv-vaccine-3-in-1-teenage-booster/'
    },
    guidance: {
      url: 'https://www.gov.uk/government/publications/a-guide-to-the-3-in-1-teenage-booster-tdipv',
      hint: 'with links to information in other languages'
    },
    sequence: ['1P', '2P', '3P', '1B', '2B'],
    sequenceDefault: '2B',
    yearGroups: [9, 10, 11],
    vaccine_smomeds: ['7374311000001101']
  },
  [ProgrammeType.MenACWY]: {
    id: 'menacwy',
    name: 'MenACWY',
    title: 'MenACWY',
    vaccineName: 'MenACWY vaccine',
    information: {
      startPage:
        'The MenACWY vaccine helps protect against meningitis and sepsis. It is recommended for all teenagers. Most people only need one dose of the vaccine.',
      description:
        'The MenACWY vaccine helps protect against life-threatening illnesses including meningitis, sepsis and septicaemia (blood poisoning).\n\nIt is recommended for all teenagers. Most people only need 1 dose of the vaccine.',
      url: 'https://www.nhs.uk/vaccinations/menacwy-vaccine/'
    },
    guidance: {
      url: 'https://www.gov.uk/government/publications/menacwy-vaccine-information-for-young-people',
      hint: 'with links to information in other languages'
    },
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
 * @property {string} title - Title
 * @property {object} information - NHS.UK programme information
 * @property {object} guidance - GOV.UK guidance
 * @property {ProgrammeStatus} status - Status
 * @property {ProgrammeType} type - Programme type
 * @property {Array<string>} sequence - Vaccine dose sequence
 * @property {string} sequenceDefault - Default vaccine dose sequence
 * @property {Array<number>} yearGroups - Year groups available to
 * @property {Array<string>} cohort_uids - Cohort UIDs
 * @property {Array<string>} vaccine_smomeds - Vaccines administered
 * @property {string} id - Programme ID
 * @property {string} ns - Namespace
 * @property {string} uri - URL
 */
export class Programme {
  constructor(options, context) {
    this.context = context
    this.name = options?.type && programmeTypes[options.type]?.name
    this.title = options?.type && programmeTypes[options.type]?.title
    this.information =
      options?.type && programmeTypes[options.type]?.information
    this.guidance = options?.type && programmeTypes[options.type]?.guidance
    this.year = options?.year || SchoolYear.Y2024
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
  get id() {
    return programmeTypes[this.type].id
  }

  /**
   * Get vaccine(s) used by this programme
   *
   * @returns {Array<import('./vaccine.js').Vaccine>} Vaccine
   */
  get vaccines() {
    return this.vaccine_smomeds.map((smomed) =>
      Vaccine.read(smomed, this.context)
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
        ({ method }) => method === VaccineMethod.Injection
      )
    }
  }

  /**
   * Get vaccine name
   *
   * @returns {object} - Vaccine name
   * @example Children’s flu vaccine
   * @example Td/IPV vaccine (3-in-1 teenage booster)
   */
  get vaccineName() {
    const vaccineName = programmeTypes[this.type].vaccineName

    return {
      sentenceCase: sentenceCaseProgrammeName(vaccineName),
      titleCase: vaccineName
    }
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
    return `/public/downloads/${this.id}-consent-form.pdf`
  }

  /**
   * Get patient sessions
   *
   * @returns {Array<PatientSession>} - Patient sessions
   */
  get patientSessions() {
    return PatientSession.readAll(this.context).filter(({ session }) =>
      session.programme_ids.includes(this.id)
    )
  }

  /**
   * Get sessions
   *
   * @returns {Array<Session>} - Sessions
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
   * @returns {Array<Vaccination>} - Vaccinations
   */
  get vaccinations() {
    return Vaccination.readAll(this.context)
      .filter(({ programme_id }) => programme_id === this.id)
      .sort((a, b) => a.patient?.lastName.localeCompare(b.patient?.lastName))
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
