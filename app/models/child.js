/**
 * @class Child
 * @property {string} nhsn - NHS number
 * @property {string} firstName - First name
 * @property {string} lastName - Last name
 * @property {string} [preferredFirstName] - Preferred first name
 * @property {string} [preferredLastName] - Preferred last name
 * @property {string} dob - Date of birth
 * @property {string} gpSurgery - GP surgery
 * @property {string} urn - School
 * @function fullName - Get full name
 * @function ns - Namespace
 * @function uri - URL
 */
export class Child {
  constructor(options) {
    this.nhsn = options.nhsn
    this.firstName = options.firstName
    this.lastName = options.lastName
    this.preferredFirstName = options?.preferredFirstName
    this.preferredLastName = options?.preferredLastName
    this.dob = options.dob
    this.gpSurgery = options.gpSurgery
    this.urn = options?.urn
  }

  static generate(patient) {
    return new Child({
      nhsn: patient.record.nhsn,
      firstName: patient.record.firstName,
      lastName: patient.record.lastName,
      dob: patient.record.dob,
      gpSurgery: patient.record.gpSurgery,
      urn: patient.record.urn
    })
  }

  get formattedDob() {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'long'
    }).format(new Date(this.dob))
  }

  get fullName() {
    return [this.firstName, this.lastName].join(' ')
  }

  get preferredName() {
    const firstName = this.preferredFirstName || this.firstName
    const lastName = this.preferredLastName || this.lastName

    if (this.preferredFirstName || this.preferredLastName) {
      return [firstName, lastName].join(' ')
    }
  }

  get ns() {
    return 'child'
  }

  get uri() {
    return `/children/${this.uuid}`
  }
}
