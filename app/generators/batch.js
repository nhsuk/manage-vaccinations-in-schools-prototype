import { fakerEN_GB as faker } from '@faker-js/faker'

import vaccines from '../datasets/vaccines.js'
import { Batch } from '../models/batch.js'
import { addDays } from '../utils/date.js'

/**
 * Generate fake batch
 *
 * @param {string} [vaccine_gtin] - Vaccine GTIN
 * @param {string} [id] - Batch ID
 * @returns {Batch} - Batch
 */
export function generateBatch(vaccine_gtin, id) {
  const createdAt = faker.date.recent({ days: 30 })
  const expiry = addDays(createdAt, 120)
  vaccine_gtin =
    vaccine_gtin || faker.helpers.arrayElement(Object.keys(vaccines))

  let archived
  const isArchived = faker.datatype.boolean(0.5)
  if (isArchived) {
    archived = addDays(createdAt, 60)
  }

  return new Batch({
    id,
    createdAt,
    ...(isArchived && { archived }),
    expiry,
    vaccine_gtin
  })
}
