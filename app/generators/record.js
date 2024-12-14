import { fakerEN_GB as faker } from '@faker-js/faker'

import schools from '../datasets/schools.js'
import { Record } from '../models/record.js'

import { generateChild } from './child.js'
import { generateParent } from './parent.js'

/**
 * Generate fake record
 *
 * @returns {Record} - Record
 */
export function generateRecord() {
  const child = generateChild()

  // Parents
  const parent1 = generateParent(child.lastName, true)

  let parent2
  const addSecondParent = faker.datatype.boolean(0.5)
  if (addSecondParent) {
    parent2 = generateParent(child.lastName)
  }

  // CHIS records provide only a subset of parent data
  delete parent1.email
  delete parent1.sms
  delete parent1.contactPreference
  delete parent1.contactPreferenceOther

  // Pending changes
  const pendingChanges = {}
  const hasPendingChanges = faker.datatype.boolean(0.1)
  if (hasPendingChanges) {
    // Adjust date of birth
    const newDob = new Date(child.dob)
    newDob.setFullYear(newDob.getFullYear() - 2)
    pendingChanges.dob = newDob

    // Move school
    const primarySchools = Object.values(schools).filter(
      (school) => school.phase === 'Primary'
    )
    const secondarySchools = Object.values(schools).filter(
      (school) => school.phase === 'Secondary'
    )
    const newUrn =
      schools[child.school_urn]?.phase === 'Primary'
        ? faker.helpers.arrayElement(primarySchools).urn
        : faker.helpers.arrayElement(secondarySchools).urn
    pendingChanges.school_urn = newUrn
  }

  return new Record({
    ...child,
    parent1,
    parent2,
    pendingChanges
  })
}