import _ from 'lodash'
import { faker } from '@faker-js/faker'
import exampleUsers from '../app/datasets/users.js'
import { Batch } from '../app/models/batch.js'
import { Campaign } from '../app/models/campaign.js'
import { Patient } from '../app/models/patient.js'
import { Record } from '../app/models/record.js'
import { Reply } from '../app/models/reply.js'
import { ConsentWindow, Session } from '../app/models/session.js'
import { User } from '../app/models/user.js'
import { createCohort } from '../app/utils/cohort.js'
import { generateDataFile, range } from './generate-data-file.js'

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

// Patients
// Create patient records and attach them with a campaign
let patients = []
for (const campaign of campaigns) {
  for (const nhsn of campaign.cohort) {
    const record = records.find((record) => record.nhsn === nhsn)
    const patient = Patient.generate(record)
    // Select for campaign
    patient.select = campaign
    patients.push(patient)
  }
}

// Sessions
let sessions = []
const schools = Object.groupBy(patients, ({ record }) => record.urn)
for (const [urn, patients] of Object.entries(schools)) {
  let session

  for (const campaign of campaigns) {
    // Create session
    session = Session.generate(urn, campaign, exampleUser, {
      isToday: urn === '108912' || urn === '135300'
    })

    const patientsInCampaign = Object.values(patients).filter(
      (patient) => patient.campaign_uuid === campaign.uuid
    )

    // Update patients in campaign
    for (const patient of patientsInCampaign) {
      // Invite to session
      patient.invite = session
      sessions.push(session)

      // Add replies to patient
      let patientHasReplies
      switch (session.consentWindow.value) {
        case ConsentWindow.Opening:
          patientHasReplies = false
        case ConsentWindow.Closed:
          patientHasReplies = faker.datatype.boolean(0.95)
          break
        default:
          patientHasReplies = faker.datatype.boolean(0.75)
      }

      if (patientHasReplies) {
        const replyCount = faker.helpers.weightedArrayElement([
          { value: 0, weight: 0.7 },
          { value: 1, weight: 0.2 },
          { value: 2, weight: 0.1 }
        ])
        for (const _index in [...range(0, replyCount)]) {
          // Respond with reply
          patient.respond = Reply.generate(campaign, session, patient)
        }
      }
    }
  }
}

// Users
let users = faker.helpers.multiple(User.generate, { count: 20 })
users = [exampleUser, ...users]

// Generate date files
generateDataFile('.data/batches.json', _.keyBy(batches, 'id'))
generateDataFile('.data/campaigns.json', _.keyBy(campaigns, 'uuid'))
generateDataFile('.data/patients.json', _.keyBy(patients, 'nhsn'))
generateDataFile('.data/records.json', _.keyBy(records, 'nhsn'))
generateDataFile('.data/sessions.json', _.keyBy(sessions, 'id'))
generateDataFile('.data/users.json', _.keyBy(users, 'uuid'))
