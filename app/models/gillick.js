import { getToday } from '../utils/date.js'
import { getEnumKeyAndValue } from '../utils/enum.js'
import { stringToBoolean } from '../utils/string.js'

export class GillickCompetent {
  static True = 'Child assessed as Gillick competent'
  static False = 'Child assessed as not Gillick competent'
}

/**
 * @class Gillick assessment
 * @property {string} created - Created date
 * @property {string} [createdBy_uid] - User who created session
 * @property {boolean} [q1] - Question 1
 * @property {boolean} [q2] - Question 2
 * @property {boolean} [q3] - Question 3
 * @property {boolean} [q4] - Question 4
 * @property {boolean} [q5] - Question 5
 * @property {string} [note] - Assessment note
 */
export class Gillick {
  constructor(options) {
    this.created = options?.created ? new Date(options.created) : getToday()
    this.createdBy_uid = options?.createdBy_uid
    this.q1 = stringToBoolean(options?.q1)
    this.q2 = stringToBoolean(options?.q2)
    this.q3 = stringToBoolean(options?.q3)
    this.q4 = stringToBoolean(options?.q4)
    this.q5 = stringToBoolean(options?.q5)
    this.note = options?.note
  }

  /**
   * Get Gillick competency outcome
   *
   * @returns {object|undefined} - Gillick competency outcome
   */
  get competent() {
    const questions = [this.q1, this.q2, this.q3, this.q4, this.q5]
    if (questions.includes(false)) {
      return getEnumKeyAndValue(GillickCompetent, GillickCompetent.False)
    } else if (questions.every((answer) => answer === true)) {
      return getEnumKeyAndValue(GillickCompetent, GillickCompetent.True)
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'gillick'
  }
}
