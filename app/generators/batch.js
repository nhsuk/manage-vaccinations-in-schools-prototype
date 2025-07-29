import { fakerEN_GB as faker } from '@faker-js/faker'

import vaccines from '../datasets/vaccines.js'
import { Batch } from '../models/batch.js'
import { addDays } from '../utils/date.js'

/**
 * Generate fake batch
 *
 * @returns {Batch} Batch
 */
export function generateBatch() {
  const createdAt = faker.date.recent({ days: 30 })
  const expiry = addDays(createdAt, 120)
  const vaccine_snomed = faker.helpers.arrayElement(Object.keys(vaccines))

  let archivedAt
  const isArchived = faker.datatype.boolean(0.5)
  if (isArchived) {
    archivedAt = addDays(createdAt, 60)
  }

  return new Batch({
    createdAt,
    ...(isArchived && { archivedAt }),
    expiry,
    vaccine_snomed
  })
}
