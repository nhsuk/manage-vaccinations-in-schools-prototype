import vaccines from '../datasets/vaccines.js'
import { Vaccine } from './vaccine.js'
import { formatLink } from '../utils/string.js'

export class ProgrammeCycle {
  static Y2020 = '2020/21'
  static Y2021 = '2021/22'
  static Y2022 = '2022/23'
  static Y2023 = '2023/24'
  static Y2024 = '2024/25'
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
    deadline: '2024-12-13',
    minAge: 4,
    maxAge: 16,
    seasonal: true,
    slug: 'flu',
    yearGroups: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    vaccines: ['05000456078276', '5000123114115']
  },
  [ProgrammeType.HPV]: {
    name: 'HPV',
    deadline: '2025-06-22',
    minAge: 12,
    maxAge: 16,
    slug: 'hpv',
    yearGroups: [8, 9, 10, 11],
    vaccines: ['00191778001693']
  },
  [ProgrammeType.TdIPV]: {
    name: 'Td/IPV (3-in-1 teenage booster)',
    deadline: '2025-06-22',
    minAge: 13,
    maxAge: 16,
    slug: 'td-ipv',
    yearGroups: [9, 10, 11],
    vaccines: ['3664798042948']
  },
  [ProgrammeType.MenACWY]: {
    name: 'MenACWY',
    deadline: '2025-06-22',
    minAge: 13,
    maxAge: 16,
    slug: 'menacwy',
    yearGroups: [9, 10, 11],
    vaccines: ['5415062370568']
  }
}

export const programmeSchedule = {
  [ProgrammeCycle.Y2024]: {
    [ProgrammeType.Flu]: { from: '2024-10-01', to: '2024-12-13' },
    [ProgrammeType.HPV]: { from: '2025-01-27', to: '2025-03-25' },
    [ProgrammeType.TdIPV]: { from: '2025-04-07', to: '2025-06-20' },
    [ProgrammeType.MenACWY]: { from: '2025-04-07', to: '2025-06-20' }
  }
}

/**
 * @class Programme
 * @property {Array[string]} cohorts - Programme cohorts
 * @property {ProgrammeCycle} cycle - Programme cycle
 * @property {string} name - Name
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
    this.cycle = options?.cycle || ProgrammeCycle.Y2024
    this.name = options?.type && programmeTypes[options.type]?.name
    this.type = options?.type
    this.yearGroups = options?.type && programmeTypes[options.type]?.yearGroups
    this.vaccines = options?.type && programmeTypes[options.type]?.vaccines
  }

  static generate(type) {
    return new Programme({ type })
  }

  get start() {
    return `${this.year}-09-01`
  }

  get year() {
    return this.cycle.split('/')[0]
  }

  get pid() {
    const { slug } = programmeTypes[this.type]

    return `${slug}-${this.year}`
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
      summary: `<span class="nhsuk-u-secondary-text-color">
        ${formatLink(this.uri, this.name)}</br>
        ${this.year}
      </span>`
    }
  }

  get ns() {
    return 'programme'
  }

  get uri() {
    return `/programmes/${this.pid}`
  }
}
