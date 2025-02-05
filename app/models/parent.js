import { fakerEN_GB as faker } from '@faker-js/faker'

import { formatOther, formatParent, stringToBoolean } from '../utils/string.js'

/**
 * @readonly
 * @enum {string}
 */
export const ParentalRelationship = {
  Mum: 'Mum',
  Dad: 'Dad',
  Guardian: 'Guardian',
  Other: 'Other',
  Unknown: 'Unknown'
}

/**
 * @readonly
 * @enum {string}
 */
export const EmailStatus = {
  Delivered: 'Delivered',
  Permanent: 'Email address does not exist',
  Temporary: 'Inbox not accepting messages right now',
  Technical: 'Technical failure'
}

/**
 * @readonly
 * @enum {string}
 */
export const SmsStatus = {
  Delivered: 'Delivered',
  Permanent: 'Not delivered',
  Temporary: 'Phone not accepting messages right now',
  Technical: 'Technical failure'
}

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
 * @property {boolean} [contactPreference] - Preferred contact method
 * @property {string} [contactPreferenceDetails] - Contact method details
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
    this.contactPreference =
      stringToBoolean(options?.contactPreference) || false

    if (this.contactPreference) {
      this.contactPreferenceDetails = options?.contactPreferenceDetails
    }
  }

  /**
   * Get formatted values
   *
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      contactPreference:
        this.contactPreferenceDetails || this.contactPreference,
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
