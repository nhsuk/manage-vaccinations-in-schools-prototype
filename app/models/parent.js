import { fakerEN_GB as faker } from '@faker-js/faker'

export const CONTACT_PREFERENCE = ['NONE', 'TEXT', 'CALL', 'OTHER']

/**
 * @class Parent
 * @property {string} uuid - UUID
 * @property {string} fullName - Full name
 * @property {string} relationship - Relationship to child
 * @property {string} email - Email address
 * @property {string} tel - Phone number
 * @property {boolean} sms - Update via SMS
 * @property {string} [contactPreference] - Preferred contact method
 * @property {string} [contactPreferenceOther] - Other contact method
 * @function ns - Namespace
 * @function uri - URL
 */
export class Parent {
  constructor(options) {
    this.uuid = options?.uuid || faker.string.uuid()
    this.fullName = options.fullName
    this.relationship = options.relationship
    this.email = options.email
    this.tel = options.tel || ''
    this.sms = options.sms || false
    this.contactPreference = options?.contactPreference
    this.contactPreferenceOther = options?.contactPreferenceOther
  }

  static generate(lastName) {
    const relationship = faker.helpers.weightedArrayElement([
      { value: 'MUM', weight: 8 },
      { value: 'DAD', weight: 8 },
      { value: 'STEP_PARENT', weight: 3 },
      { value: 'GRANDPARENT', weight: 2 },
      { value: 'GUARDIAN', weight: 1 },
      { value: 'CARER', weight: 1 },
      { value: 'OTHER', weight: 1 }
    ])
    const phoneNumber = '07### ######'.replace(/#+/g, (m) =>
      faker.string.numeric(m.length)
    )
    const tel = faker.helpers.maybe(() => phoneNumber, { probability: 0.7 })

    const contactPreference = faker.helpers.arrayElement(CONTACT_PREFERENCE)

    let firstName
    switch (relationship) {
      case 'MUM':
        firstName = faker.person.fullName('female')
        break
      case 'DAD':
        firstName = faker.person.fullName('male')
        break
      default:
        firstName = faker.person.fullName()
    }

    lastName = lastName || faker.person.lastName()

    return new Parent({
      fullName: `${firstName} ${lastName}`,
      relationship,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      ...(tel && {
        tel,
        sms: faker.datatype.boolean(0.5),
        contactPreference,
        ...(contactPreference === 'OTHER' && {
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
