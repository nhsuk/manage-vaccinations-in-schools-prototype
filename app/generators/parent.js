import { fakerEN_GB as faker } from '@faker-js/faker'

import {
  ContactPreference,
  Parent,
  ParentalRelationship
} from '../models/parent.js'

/**
 * Generate fake parent
 *
 * @param {string} childLastName - Child’s last name
 * @param {boolean} [isMum] - Parent is child’s mother
 * @returns {Parent} - Parent
 */
export function generateParent(childLastName, isMum) {
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
