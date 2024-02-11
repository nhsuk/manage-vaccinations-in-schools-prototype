import _ from 'lodash'
import { faker } from '@faker-js/faker'
import exampleUsers from '../app/datasets/users.js'
import { Batch } from '../app/models/batch.js'
import { Campaign } from '../app/models/campaign.js'
import { Record } from '../app/models/record.js'
import { Session } from '../app/models/session.js'
import { User } from '../app/models/user.js'
import { createCohort } from '../app/utils/cohort.js'
import { generateDataFile } from './generate-data-file.js'

// Example admin user
const exampleUser = new User(exampleUsers[0])

// Batch
const batches = faker.helpers.multiple(Batch.generate, { count: 20 })

// Records
const records = faker.helpers.multiple(Record.generate, { count: 4000 })

// Campaigns
const enabledCampaigns = process.env.CAMPAIGNS || 'flu,hpv,3-in-1-men-acwy'
let campaigns = []
for (const type of enabledCampaigns.split(',')) {
  campaigns.push(
    Campaign.generate(type, createCohort(type, records), exampleUser)
  )
}

// Sessions
let sessions = []
for (const campaign of Object.values(campaigns)) {
  const session = () => ({
    ...Session.generate(108912, campaign, exampleUser)
  })
  sessions = [...sessions, ...faker.helpers.multiple(session, { count: 20 })]
}

// Users
let users = faker.helpers.multiple(User.generate, { count: 20 })
users = [exampleUser, ...users]

// Generate date files
generateDataFile('.data/batches.json', _.keyBy(batches, 'id'))
generateDataFile('.data/campaigns.json', _.keyBy(campaigns, 'uuid'))
generateDataFile('.data/records.json', _.keyBy(records, 'nhsn'))
generateDataFile('.data/sessions.json', _.keyBy(sessions, 'id'))
generateDataFile('.data/users.json', _.keyBy(users, 'uuid'))
