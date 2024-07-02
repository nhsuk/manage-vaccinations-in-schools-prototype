import { fakerEN_GB as faker } from '@faker-js/faker'
import { stringToBoolean } from '../utils/string.js'

export class ContactPreference {
  static None = 'No preference'
  static Text = 'Text message'
  static Call = 'Voice call'
  static Other = 'Other'
}

export class ParentalRelationship {
  static Mum = 'Mum'
  static Dad = 'Dad'
  static StepParent = 'Step-parent'
  static Grandparent = 'Grandparent'
  static Guardian = 'Guardian'
  static Carer = 'Carer'
  static Other = 'Other'
}

/**
 * @class Parent
 * @property {string} uuid - UUID
 * @property {string} fullName - Full name
 * @property {ParentalRelationship} relationship - Relationship to child
 * @property {boolean} hasParentalResponsibility - Has parental responsibility
 * @property {string} relationshipOther - Other relationship to child
 * @property {boolean} notify - Notify about consent and vaccination events
 * @property {string} email - Email address
 * @property {string} tel - Phone number
 * @property {boolean} sms - Update via SMS
 * @property {ContactPreference} [contactPreference] - Preferred contact method
 * @property {string} [contactPreferenceOther] - Other contact method
 * @function nameAndRelationship - Parent name and relationship
 * @function ns - Namespace
 * @function uri - URL
 */
export class Parent {
  constructor(options) {
    this.uuid = options?.uuid || faker.string.uuid()
    this.fullName = options.fullName
    this.relationship = options.relationship
    this.relationshipOther = options.relationshipOther
    this.hasParentalResponsibility = stringToBoolean(
      options.hasParentalResponsibility
    )
    this.notify = stringToBoolean(options?.notify)
    this.email = options.email
    this.tel = options.tel || ''
    this.sms = stringToBoolean(options.sms) || false
    this.contactPreference = options?.contactPreference
    this.contactPreferenceOther = options?.contactPreferenceOther
  }

  static generate(childLastName, parentsOnly) {
    const relationship = parentsOnly
      ? faker.helpers.weightedArrayElement([
          { value: ParentalRelationship.Mum, weight: 5 },
          { value: ParentalRelationship.Dad, weight: 2 }
        ])
      : faker.helpers.weightedArrayElement([
          { value: ParentalRelationship.StepParent, weight: 3 },
          { value: ParentalRelationship.Grandparent, weight: 2 },
          { value: ParentalRelationship.Guardian, weight: 1 },
          { value: ParentalRelationship.Carer, weight: 1 },
          { value: ParentalRelationship.Other, weight: 1 }
        ])
    const phoneNumber = '07### ######'.replace(/#+/g, (m) =>
      faker.string.numeric(m.length)
    )
    const tel = faker.helpers.maybe(() => phoneNumber, { probability: 0.7 })

    const contactPreference = faker.helpers.arrayElement(
      Object.values(ContactPreference)
    )

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

    return new Parent({
      fullName: `${firstName} ${lastName}`,
      relationship,
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

  get nameAndRelationship() {
    const relationship = this.relationshipOther
      ? `${this.relationship} – ${this.relationshipOther}`
      : this.relationship

    return `${this.fullName} (${relationship})`
  }

  get ns() {
    return 'parent'
  }

  get uri() {
    return `/parents/${this.uuid}`
  }
}
