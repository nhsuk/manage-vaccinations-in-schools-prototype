import { fakerEN_GB as faker } from '@faker-js/faker'

import {
  EmailStatus,
  Parent,
  ParentalRelationship,
  SmsStatus
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

  // Contact details
  const phoneNumber = '07### ######'.replace(/#+/g, (m) =>
    faker.string.numeric(m.length)
  )
  const tel = faker.helpers.maybe(() => phoneNumber, { probability: 0.9 })

  const sms = faker.datatype.boolean(0.5)
  const smsStatus = faker.helpers.weightedArrayElement([
    { value: SmsStatus.Delivered, weight: 100 },
    { value: SmsStatus.Permanent, weight: 10 },
    { value: SmsStatus.Temporary, weight: 5 },
    { value: SmsStatus.Technical, weight: 1 }
  ])

  const email = faker.internet.email({ firstName, lastName }).toLowerCase()
  const emailStatus = faker.helpers.weightedArrayElement([
    { value: EmailStatus.Delivered, weight: 100 },
    { value: EmailStatus.Permanent, weight: 10 },
    { value: EmailStatus.Temporary, weight: 5 },
    { value: EmailStatus.Technical, weight: 1 }
  ])

  const contactPreference = faker.datatype.boolean(0.2)

  return new Parent({
    fullName: `${firstName} ${lastName}`,
    relationship,
    ...(relationship === ParentalRelationship.Other && {
      relationshipOther: 'Foster parent'
    }),
    email,
    emailStatus,
    ...(tel && {
      tel,
      sms,
      ...(sms && { smsStatus }),
      contactPreference,
      ...(contactPreference && {
        contactPreferenceDetails:
          'I sometimes have difficulty hearing phone calls, so it’s best to send me a text message.'
      })
    })
  })
}
