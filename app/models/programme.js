import { isAfter } from 'date-fns'
import vaccines from '../datasets/vaccines.js'
import { Vaccine } from './vaccine.js'
import { isBetweenDates, getToday } from '../utils/date.js'
import { formatLink } from '../utils/string.js'

export class ProgrammeStatus {
  static Planned = 'Planned'
  static Current = 'Current'
  static Completed = 'Completed'
}

export class ProgrammeType {
  static Flu = 'Flu'
  static HPV = 'HPV'
  static TdIPV = 'Td/IPV (3-in-1 teenage booster)'
  static MenACWY = 'MenACWY'
}

export const programmeTypes = {
  [ProgrammeType.Flu]: {
    name: 'Flu',
    pid: 'flu',
    schedule: { from: '2024-09-03', to: '2024-12-13' }, // Autumn 2024
    seasonal: true,
    yearGroups: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    vaccines: ['05000456078276', '5000123114115']
  },
  [ProgrammeType.HPV]: {
    name: 'HPV',
    pid: 'hpv',
    schedule: { from: '2025-01-06', to: '2025-04-11' }, // Spring 2025
    yearGroups: [8, 9, 10, 11],
    vaccines: ['00191778001693']
  },
  [ProgrammeType.TdIPV]: {
    name: 'Td/IPV (3-in-1 teenage booster)',
    pid: 'td-ipv',
    schedule: { from: '2025-04-28', to: '2025-07-21' }, // Summer 2025
    yearGroups: [9, 10, 11],
    vaccines: ['3664798042948']
  },
  [ProgrammeType.MenACWY]: {
    name: 'MenACWY',
    pid: 'menacwy',
    schedule: { from: '2025-04-28', to: '2025-07-21' }, // Summer 2025
    yearGroups: [9, 10, 11],
    vaccines: ['5415062370568']
  }
}

/**
 * @class Programme
 * @property {Array[string]} cohorts - Programme cohorts
 * @property {string} name - Name
 * @property {boolean} seasonal - Seasonal programme
 * @property {ProgrammeStatus} status - Status
 * @property {ProgrammeType} type - Programme type
 * @property {Array[number]} yearGroups - Year groups available to
 * @property {Array[string]} vaccines - Vaccines administered
 * @property {string} pid - Programme ID
 * @property {string} ns - Namespace
 * @property {string} uri - URL
 */
export class Programme {
  constructor(options) {
    this.cohorts = options?.cohorts || []
    this.name = options?.type && programmeTypes[options.type]?.name
    this.seasonal = options?.type && programmeTypes[options.type]?.seasonal
    this.type = options?.type
    this.yearGroups = options?.type && programmeTypes[options.type]?.yearGroups
    this.vaccines = options?.type && programmeTypes[options.type]?.vaccines
  }

  static generate(type) {
    return new Programme({ type })
  }

  get status() {
    const { from, to } = programmeTypes[this.type].schedule

    if (isBetweenDates(getToday(), from, to)) {
      return ProgrammeStatus.Current
    } else if (isAfter(getToday(), to)) {
      return ProgrammeStatus.Completed
    } else {
      return ProgrammeStatus.Planned
    }
  }

  get start() {
    return `${this.year}-09-01`
  }

  get pid() {
    return programmeTypes[this.type].pid
  }

  /**
   * @todo A programme can use multiple vaccines, and one used for a patient
   * will depend on answers to screening questions in consent flow. For now,
   * however we’ll assume each programme administers one vaccine.
   * @returns {import('./vaccine.js').Vaccine} Vaccine
   */
  get vaccine() {
    return new Vaccine(vaccines[this.vaccines[0]])
  }

  get formatted() {
    const vaccineList = Array.isArray(this.vaccines)
      ? this.vaccines.map((gtin) => new Vaccine(vaccines[gtin]).brand)
      : []

    return {
      vaccines: vaccineList.join('<br>')
    }
  }

  get link() {
    return {
      name: formatLink(this.uri, this.name)
    }
  }

  get ns() {
    return 'programme'
  }

  get uri() {
    return `/programmes/${this.pid}`
  }
}
