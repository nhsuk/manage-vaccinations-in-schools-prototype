import { getEnumKeyAndValue } from '../utils/enum.js'
import { stringToBoolean } from '../utils/string.js'

export class GillickCompetent {
  static True = 'Child assessed as Gillick competent'
  static False = 'Child assessed as not Gillick competent'
}

/**
 * @class Gillick assessment
 * @property {string} uuid - UUID
 * @property {string} created - Created date
 * @property {string} [created_user_uid] - User who created session
 * @property {boolean} [q1] - Question 1
 * @property {boolean} [q2] - Question 2
 * @property {boolean} [q3] - Question 3
 * @property {boolean} [q4] - Question 4
 * @property {boolean} [q5] - Question 5
 * @property {string} [details] - Assessment details
 * @function ns - Namespace
 */
export class Gillick {
  constructor(options) {
    this.created = options?.created || new Date().toISOString()
    this.created_user_uid = options?.created_user_uid
    this.q1 = stringToBoolean(options?.q1)
    this.q2 = stringToBoolean(options?.q2)
    this.q3 = stringToBoolean(options?.q3)
    this.q4 = stringToBoolean(options?.q4)
    this.q5 = stringToBoolean(options?.q5)
    this.notes = options?.notes
  }

  get competent() {
    const questions = [this.q1, this.q2, this.q3, this.q4, this.q5]
    if (questions.includes(false)) {
      return getEnumKeyAndValue(GillickCompetent, GillickCompetent.False)
    } else if (questions.every((answer) => answer === true)) {
      return getEnumKeyAndValue(GillickCompetent, GillickCompetent.True)
    }
  }

  get ns() {
    return 'gillick'
  }
}
