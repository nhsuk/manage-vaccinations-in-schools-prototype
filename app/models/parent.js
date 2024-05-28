import { fakerEN_GB as faker } from '@faker-js/faker'

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
 * @property {string} relationshipOther - Other relationship to child
 * @property {string} email - Email address
 * @property {string} tel - Phone number
 * @property {boolean} sms - Update via SMS
 * @property {ContactPreference} [contactPreference] - Preferred contact method
 * @property {string} [contactPreferenceOther] - Other contact method
 * @function ns - Namespace
 * @function uri - URL
 */
export class Parent {
  constructor(options) {
    this.uuid = options?.uuid || faker.string.uuid()
    this.fullName = options.fullName
    this.relationship = options.relationship
    this.relationshipOther = options.relationshipOther
    this.email = options.email
    this.tel = options.tel || ''
    this.sms = options.sms || false
    this.contactPreference = options?.contactPreference
    this.contactPreferenceOther = options?.contactPreferenceOther
  }

  static generate(lastName) {
    const relationship = faker.helpers.weightedArrayElement([
      { value: ParentalRelationship.Mum, weight: 8 },
      { value: ParentalRelationship.Dad, weight: 8 },
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
    switch (relationship) {
      case ParentalRelationship.Mum:
        firstName = faker.person.fullName('female')
        break
      case ParentalRelationship.Dad:
        firstName = faker.person.fullName('male')
        break
      default:
        firstName = faker.person.fullName()
    }

    lastName = lastName || faker.person.lastName().replace(`'`, '’')

    return new Parent({
      fullName: `${firstName} ${lastName}`,
      relationship,
      ...(relationship === ParentalRelationship.Other && {
        relationshipOther: 'Foster parent.'
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

  get ns() {
    return 'parent'
  }

  get uri() {
    return `/parents/${this.uuid}`
  }
}
