import { fakerEN_GB as faker } from '@faker-js/faker'

import gpSurgeries from '../datasets/clinics.js'
import firstNames from '../datasets/first-names.js'
import schools from '../datasets/schools.js'
import { Gender } from '../enums.js'
import { generateAddress } from '../generators/address.js'
import { Child } from '../models/child.js'
import { getYearGroup } from '../utils/date.js'

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

  // Date of birth and school
  const primarySchools = Object.values(schools).filter(
    ({ phase }) => phase === 'Primary'
  )
  const secondarySchools = Object.values(schools).filter(
    ({ phase }) => phase === 'Secondary'
  )
  const phase = faker.helpers.arrayElement(['Primary', 'Secondary'])
  let dob, school_urn
  if (phase === 'Primary') {
    dob = faker.date.birthdate({ min: 4, max: 11, mode: 'age' })
    school_urn = faker.helpers.arrayElement(primarySchools).urn
  } else {
    // Children generally receive adolescent vaccinations when younger
    // Note: This means flu cohorts will skew more towards younger children
    const max = faker.helpers.weightedArrayElement([
      { value: 12, weight: 12 },
      { value: 13, weight: 8 },
      { value: 14, weight: 4 },
      { value: 15, weight: 2 },
      { value: 16, weight: 1 }
    ])
    dob = faker.date.birthdate({ min: 11, max, mode: 'age' })
    school_urn = faker.helpers.arrayElement(secondarySchools).urn
  }

  // Add examples of children who are home-schooled or at an unknown school
  if (faker.datatype.boolean(0.01)) {
    school_urn = faker.helpers.arrayElement(['888888', '999999'])
  }

  // Add examples of children who have aged out (over 16)
  if (faker.datatype.boolean(0.05)) {
    dob = faker.date.birthdate({ min: 17, max: 18, mode: 'age' })
    school_urn = ''
  }

  // GP surgery
  let gpSurgery
  if (faker.datatype.boolean(0.8)) {
    const gpSurgeryNames = Object.values(gpSurgeries).map(
      (surgery) => surgery.name
    )
    gpSurgery = faker.helpers.arrayElement(gpSurgeryNames)
  }

  // Registration group
  let registrationGroup
  const hasRegistrationGroup = String(school_urn).startsWith('13')
  if (hasRegistrationGroup) {
    const yearGroup = getYearGroup(dob)
    const registration = faker.string.alpha({
      length: 2,
      casing: 'upper',
      exclude: ['A', 'E', 'I', 'O', 'U']
    })

    registrationGroup = `${yearGroup}${registration}`
  }

  return new Child({
    firstName,
    preferredFirstName,
    lastName,
    dob,
    gender,
    address: generateAddress(),
    gpSurgery,
    registrationGroup,
    school_urn
  })
}
