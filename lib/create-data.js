import _ from 'lodash'
import { faker } from '@faker-js/faker'
import exampleUsers from '../app/datasets/users.js'
import { Batch } from '../app/models/batch.js'
import { User } from '../app/models/user.js'
import { generateDataFile } from './generate-data-file.js'

// Example admin user
const exampleUser = new User(exampleUsers[0])

// Batch
const batches = faker.helpers.multiple(Batch.generate, { count: 20 })

// Users
let users = faker.helpers.multiple(User.generate, { count: 20 })
users = [exampleUser, ...users]

// Generate date files
generateDataFile('.data/batches.json', _.keyBy(batches, 'id'))
generateDataFile('.data/users.json', _.keyBy(users, 'uuid'))
