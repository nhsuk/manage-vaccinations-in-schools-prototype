import { fakerEN_GB as faker } from '@faker-js/faker'

import clinics from '../datasets/clinics.js'
import firstNames from '../datasets/first-names.js'
import { Gender } from '../enums.js'
import { Child } from '../models.js'
import { getCurrentAcademicYear } from '../utils/date.js'

/**
 * Generate fake child
 *
 * @returns {Child} Child
 */
export function generateChild() {
  // Gender
  const gender = faker.helpers.weightedArrayElement([
    { value: Gender.Male, weight: 50 },
    { value: Gender.Female, weight: 50 },
    { value: Gender.NotKnown, weight: 1 },
    { value: Gender.NotSpecified, weight: 1 }
  ])

  // Name
  const firstName = faker.helpers.arrayElement(firstNames[gender])
  const lastName = faker.person.lastName().replace(`'`, '’')

  let preferredFirstName
  if (firstName.startsWith('Al')) {
    preferredFirstName = 'Ali'
  }
  if (firstName.startsWith('Em')) {
    preferredFirstName = 'Em'
  }
  if (firstName.startsWith('Isa')) {
    preferredFirstName = 'Izzy'
  }

  // Date of birth
  const ageOnCutOff = faker.number.int({ min: 0, max: 4 })

  // Calculate birth year
  const birthYear = getCurrentAcademicYear() - ageOnCutOff

  // Born between 1 September (previous year) and 31 August
  const dob = faker.date.between({
    from: new Date(birthYear - 1, 8, 1), // 1 September previous year
    to: new Date(birthYear, 7, 31) // 31 August birth year
  })

  // GP surgery
  const clinic_id = faker.helpers.arrayElement(Object.values(clinics)).id

  return new Child({
    firstName,
    preferredFirstName,
    lastName,
    dob,
    gender,
    immunocompromised: faker.datatype.boolean(0.1),
    address: {
      addressLine1: faker.location.streetAddress(),
      addressLevel1: faker.location.city(),
      postalCode: faker.location.zipCode({ format: 'CV## #??' })
    },
    clinic_id,
    school_id: '999999'
  })
}
