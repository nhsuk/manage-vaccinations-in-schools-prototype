import { fakerEN_GB as faker } from '@faker-js/faker'
import { formatOther, stringToBoolean } from '../utils/string.js'

export class ContactPreference {
  static None = 'No preference'
  static Text = 'Text message'
  static Call = 'Voice call'
  static Other = 'Other'
}

export class ParentalRelationship {
  static Mum = 'Mum'
  static Dad = 'Dad'
  static Guardian = 'Guardian'
  static Other = 'Other'
}

/**
 * @class Parent
 * @property {string} uuid - UUID
 * @property {string} [fullName] - Full name
 * @property {ParentalRelationship} [relationship] - Relationship to child
 * @property {string} [relationshipOther] - Other relationship to child
 * @property {boolean} [hasParentalResponsibility] - Has parental responsibility
 * @property {boolean} notify - Notify about consent and vaccination events
 * @property {string} email - Email address
 * @property {string} tel - Phone number
 * @property {boolean} sms - Update via SMS
 * @property {ContactPreference} [contactPreference] - Preferred contact method
 * @property {string} [contactPreferenceOther] - Other contact method
 */
export class Parent {
  constructor(options) {
    this.uuid = options?.uuid || faker.string.uuid()
    this.fullName = options.fullName
    this.relationship = options.relationship
    this.relationshipOther =
      this?.relationship === ParentalRelationship.Other
        ? options?.relationshipOther
        : undefined
    this.hasParentalResponsibility =
      this.relationship === ParentalRelationship.Other
        ? stringToBoolean(options.hasParentalResponsibility)
        : undefined
    this.notify = stringToBoolean(options?.notify)
    this.email = options.email
    this.tel = options.tel || ''
    this.sms = stringToBoolean(options.sms) || false
    this.contactPreference = options?.contactPreference
    this.contactPreferenceOther =
      this.contactPreference === ContactPreference.Other
        ? options?.contactPreferenceOther
        : undefined
  }

  /**
   * Generate fake parent
   * @param {string} childLastName - Child’s last name
   * @param {boolean} [isMum] - Parent is child’s mother
   * @returns {Parent} - Parent
   * @static
   */
  static generate(childLastName, isMum) {
    // Relationship
    const relationship = isMum
      ? ParentalRelationship.Mum
      : faker.helpers.weightedArrayElement([
          { value: ParentalRelationship.Dad, weight: 3 },
          { value: ParentalRelationship.Guardian, weight: 1 },
          { value: ParentalRelationship.Other, weight: 1 }
        ])

    // Contact details
    const phoneNumber = '07### ######'.replace(/#+/g, (m) =>
      faker.string.numeric(m.length)
    )
    const tel = faker.helpers.maybe(() => phoneNumber, { probability: 0.7 })

    const contactPreference = faker.helpers.arrayElement(
      Object.values(ContactPreference)
    )

    // Name
    let firstName
    let lastName
    switch (relationship) {
      case ParentalRelationship.Mum:
        firstName = faker.person.firstName('female').replace(`'`, '’')
        lastName = childLastName
        break
      case ParentalRelationship.Dad:
        firstName = faker.person.firstName('male').replace(`'`, '’')
        lastName = childLastName
        break
      default:
        firstName = faker.person.firstName().replace(`'`, '’')
        lastName = faker.person.lastName().replace(`'`, '’')
    }

    // Name and relationship may not be provided
    const hasName = faker.datatype.boolean(0.9)
    const hasRelationship = faker.datatype.boolean(0.7)

    return new Parent({
      ...(hasName && { fullName: `${firstName} ${lastName}` }),
      ...(hasRelationship && { relationship }),
      ...(relationship === ParentalRelationship.Other && {
        relationshipOther: 'Foster parent'
      }),
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      ...(tel && {
        tel,
        sms: faker.datatype.boolean(0.5),
        contactPreference,
        ...(contactPreference === ContactPreference.Other && {
          contactPreferenceOther:
            'Please call 01234 567890 ext 8910 between 9am and 5pm.'
        })
      })
    })
  }

  /**
   * Get name and relationship
   * @returns {string} - Name and relationship
   */
  get nameAndRelationship() {
    const relationship = this.relationshipOther
      ? `${this.relationship} – ${this.relationshipOther}`
      : this.relationship

    return `${this.fullName} (${relationship})`
  }

  /**
   * Get formatted values
   * @returns {object} - Formatted values
   */
  get formatted() {
    return {
      contactPreference: formatOther(
        this.contactPreferenceOther,
        this.contactPreference
      ),
      relationship: formatOther(this.relationshipOther, this.relationship)
    }
  }

  /**
   * Get namespace
   * @returns {string} - Namespace
   */
  get ns() {
    return 'parent'
  }
}
