import { fakerEN_GB as faker } from '@faker-js/faker'

import clinics from '../datasets/clinics.js'
import firstNames from '../datasets/first-names.js'
import { Adjustment, Gender, Impairment } from '../enums.js'
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

  // Impairments
  let impairments
  if (faker.datatype.boolean(0.2)) {
    impairments = [
      faker.helpers.weightedArrayElement([
        { value: Impairment.Vision, weight: 1 },
        { value: Impairment.Hearing, weight: 2 },
        { value: Impairment.Mobility, weight: 1 },
        { value: Impairment.Memory, weight: 1 },
        { value: Impairment.MentalHealth, weight: 3 },
        { value: Impairment.Communicative, weight: 4 }
      ])
    ]
  }

  let impairmentsOther
  if (impairments?.includes(Impairment.Other)) {
    impairmentsOther =
      'My child has a chronic illness and requires ongoing medical treatment.'
  }

  // Adjustments
  let adjustments
  if (faker.datatype.boolean(0.2)) {
    adjustments = [
      faker.helpers.weightedArrayElement([
        { value: Adjustment.Distraction, weight: 2 },
        { value: Adjustment.ExtendedAppointment, weight: 1 },
        { value: Adjustment.FirstAppointment, weight: 3 },
        { value: Adjustment.LastAppointment, weight: 3 },
        { value: Adjustment.Privacy, weight: 3 },
        { value: Adjustment.HomeVisit, weight: 2 }
      ])
    ]
  }

  if (impairments?.includes(Impairment.Vision)) {
    adjustments = [Adjustment.GuideDog]
  }

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
    adjustments,
    impairments,
    impairmentsOther,
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
