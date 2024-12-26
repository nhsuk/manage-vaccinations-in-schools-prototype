import { fakerEN_GB as faker } from '@faker-js/faker'

import { formatOther, formatParent, stringToBoolean } from '../utils/string.js'

/**
 * @readonly
 * @enum {string}
 */
export const ContactPreference = Object.freeze({
  None: 'No preference',
  Text: 'Text message',
  Call: 'Voice call',
  Other: 'Other'
})

/**
 * @readonly
 * @enum {string}
 */
export const ParentalRelationship = Object.freeze({
  Mum: 'Mum',
  Dad: 'Dad',
  Guardian: 'Guardian',
  Other: 'Other',
  Unknown: 'Unknown'
})

/**
 * @readonly
 * @enum {string}
 */
export const EmailStatus = Object.freeze({
  Delivered: 'Delivered',
  Permanent: 'Email address does not exist',
  Temporary: 'Inbox not accepting messages right now',
  Technical: 'Technical failure'
})

/**
 * @readonly
 * @enum {string}
 */
export const SmsStatus = Object.freeze({
  Delivered: 'Delivered',
  Permanent: 'Not delivered',
  Temporary: 'Phone not accepting messages right now',
  Technical: 'Technical failure'
})

/**
 * @class Parent
 * @property {string} uuid - UUID
 * @property {string} [fullName] - Full name
 * @property {ParentalRelationship} [relationship] - Relationship to child
 * @property {string} [relationshipOther] - Other relationship to child
 * @property {boolean} [hasParentalResponsibility] - Has parental responsibility
 * @property {boolean} notify - Notify about consent and vaccination events
 * @property {string} tel - Phone number
 * @property {string} email - Email address
 * @property {EmailStatus} emailStatus - Email status
 * @property {boolean} sms - Update via SMS
 * @property {SmsStatus} smsStatus - SMS status
 * @property {ContactPreference} [contactPreference] - Preferred contact method
 * @property {string} [contactPreferenceOther] - Other contact method
 */
export class Parent {
  constructor(options) {
    this.uuid = options?.uuid || faker.string.uuid()
    this.fullName = options.fullName || ''
    this.relationship = options.relationship || ParentalRelationship.Unknown
    this.relationshipOther =
      this?.relationship === ParentalRelationship.Other
        ? options?.relationshipOther
        : undefined
    this.hasParentalResponsibility =
      this.relationship === ParentalRelationship.Other
        ? stringToBoolean(options.hasParentalResponsibility)
        : undefined
    this.notify = stringToBoolean(options?.notify)
    this.tel = options.tel || ''
    this.email = options.email
    this.emailStatus = this?.email && options?.emailStatus
    this.sms = stringToBoolean(options.sms) || false
    this.smsStatus = this?.sms && options?.smsStatus
    this.contactPreference = options?.contactPreference
    this.contactPreferenceOther =
      this.contactPreference === ContactPreference.Other
        ? options?.contactPreferenceOther
        : undefined
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      contactPreference: formatOther(
        this.contactPreferenceOther,
        this.contactPreference
      ),
      fullName: this.fullName || 'Name unknown',
      fullNameAndRelationship: formatParent(this, false),
      relationship: formatOther(this.relationshipOther, this.relationship)
    }
  }

  /**
   * Get namespace
   *
   * @returns {string} - Namespace
   */
  get ns() {
    return 'parent'
  }
}
