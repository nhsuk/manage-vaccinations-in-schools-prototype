import vaccines from '../datasets/vaccines.js'
import { Vaccine } from './vaccine.js'
import { formatLink } from '../utils/string.js'

export const programmeTypes = {
  Flu: {
    name: 'Flu',
    seasonal: true,
    slug: 'flu',
    minAge: 4,
    maxAge: 16,
    yearGroups: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    vaccines: ['05000456078276', '5000123114115']
  },
  HPV: {
    name: 'HPV',
    slug: 'hpv',
    minAge: 12,
    maxAge: 16,
    yearGroups: [8, 9, 10, 11],
    vaccines: ['00191778001693']
  },
  TdIPV: {
    name: 'Td/IPV (3-in-1 teenage booster)',
    slug: 'td-ipv',
    minAge: 13,
    maxAge: 16,
    yearGroups: [9, 10, 11],
    vaccines: ['3664798042948']
  },
  MenACWY: {
    name: 'MenACWY',
    slug: 'menacwy',
    minAge: 13,
    maxAge: 16,
    yearGroups: [9, 10, 11],
    vaccines: ['5415062370568']
  }
}

export class ProgrammeType {
  static Flu = 'Flu'
  static HPV = 'HPV'
  static TdIPV = 'Td/IPV (3-in-1 teenage booster)'
  static MenACWY = 'MenACWY'
}

export class ProgrammeYear {
  static Y2020 = '2020/21'
  static Y2021 = '2021/22'
  static Y2022 = '2022/23'
  static Y2023 = '2023/24'
  static Y2024 = '2024/25'
}

/**
 * @class Programme
 * @property {ProgrammeType} type - Programme type
 * @property {ProgrammeYear} year - Programme year
 * @property {string} name - Name
 * @property {Array[number]} yearGroups - Year groups available to
 * @property {Array[string]} vaccines - Vaccines administered
 * @property {string} pid - Programme ID
 * @property {string} ns - Namespace
 * @property {string} uri - URL
 */
export class Programme {
  constructor(options) {
    this.type = options?.type
    this.year = options?.year || ProgrammeYear.Y2024
    this.name = programmeTypes[this.type].name
    this.yearGroups = programmeTypes[this.type].yearGroups || []
    this.vaccines = programmeTypes[this.type].vaccines || []
  }

  static generate(type) {
    return new Programme({ type })
  }

  get start() {
    const year = this.year.split('/')[0]
    return `${year}-09-01`
  }

  get pid() {
    const { slug } = programmeTypes[this.type]
    const year = this.year.split('/')[0]

    return `${slug}-${year}`
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
