import { fakerEN_GB as faker } from '@faker-js/faker'

export class Registrar {
  static GMC = 'General Medical Council'
  static GPhC = 'General Pharmaceutical Council'
  static HCPC = 'Health and Care Professions Council'
  static NMC = 'Nursing and Midwifery Council'
}

const registrationFormats = {
  'General Medical Council': '#######', // https://www.gmc-uk.org/registration-and-licensing/the-medical-register
  'General Pharmaceutical Council': '#######', // https://www.pharmacyregulation.org/registers
  'Health and Care Professions Council': 'SW######', // https://www.hcpc-uk.org/public/be-sure-check-the-register/
  'Nursing and Midwifery Council': '##?####?' // https://www.nmc.org.uk/globalassets/sitedocuments/registration/application-for-transferring-from-the-temporary-register-to-the-permanen....pdf
}

/**
 * @class User
 * @property {string} uuid - UUID
 * @property {string} firstName - First/given name
 * @property {string} lastName - Last/family name
 * @property {string} email - Email address
 * @property {boolean} admin - Has admin user role
 * @property {Registrar} [registrar] - Regulator who registered user
 * @property {string} [registration] - Registration number
 * @function fullName - Get full name
 * @function fullNameWithRegistration - Get full name with registration number
 * @function registrationWithRegistrar - Get registration number with registrar
 * @function ns - Namespace
 * @function uri - URL
 */
export class User {
  constructor(options) {
    this.uuid = options?.uuid || faker.string.uuid()
    this.firstName = options.firstName
    this.lastName = options.lastName
    this.email = options.email
    this.admin = options?.admin
    this.registrar = options?.registrar
    this.registration = options?.registration
  }

  static generate() {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const registrar = faker.helpers.weightedArrayElement([
      { value: Registrar.GMC, weight: 3 },
      { value: Registrar.GPhC, weight: 1 },
      { value: Registrar.NMC, weight: 5 },
      { value: Registrar.HCPC, weight: 1 }
    ])

    return new User({
      firstName,
      lastName,
      email: faker.internet
        .email({
          firstName,
          lastName,
          provider: 'example.nhs.net'
        })
        .toLowerCase(),
      registrar,
      registration: faker.helpers.replaceSymbols(registrationFormats[registrar])
    })
  }

  get fullName() {
    return [this.firstName, this.lastName].join(' ')
  }

  get fullNameWithRegistration() {
    return this.registration
      ? `${this.fullName} (${this.registration})`
      : this.fullName
  }

  get registrationWithRegistrar() {
    if (this.registration && this.registrar) {
      return `${this.registration} (${this.registrar})`
    }
  }

  get ns() {
    return 'user'
  }

  get uri() {
    return `/users/${this.uuid}`
  }
}
