import _ from 'lodash'
import { faker } from '@faker-js/faker'
import exampleUsers from '../app/datasets/users.js'
import { Batch } from '../app/models/batch.js'
import { Record } from '../app/models/record.js'
import { User } from '../app/models/user.js'
import { generateDataFile } from './generate-data-file.js'

// Example admin user
const exampleUser = new User(exampleUsers[0])

// Batch
const batches = faker.helpers.multiple(Batch.generate, { count: 20 })

// Records
const records = faker.helpers.multiple(Record.generate, { count: 4000 })

// Users
let users = faker.helpers.multiple(User.generate, { count: 20 })
users = [exampleUser, ...users]

// Generate date files
generateDataFile('.data/batches.json', _.keyBy(batches, 'id'))
generateDataFile('.data/records.json', _.keyBy(records, 'nhsn'))
generateDataFile('.data/users.json', _.keyBy(users, 'uuid'))
