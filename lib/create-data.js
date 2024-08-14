import process from 'node:process'
import _ from 'lodash'
import { faker } from '@faker-js/faker'
import exampleUsers from '../app/datasets/users.js'
import schools from '../app/datasets/schools.js'
import { Batch } from '../app/models/batch.js'
import { AcademicYear, Campaign, CampaignType } from '../app/models/campaign.js'
import { Organisation } from '../app/models/organisation.js'
import { Patient } from '../app/models/patient.js'
import { Record } from '../app/models/record.js'
import { Reply } from '../app/models/reply.js'
import { ConsentWindow, Session, SessionStatus } from '../app/models/session.js'
import { User } from '../app/models/user.js'
import { Vaccination } from '../app/models/vaccination.js'
import { createCohort } from '../app/utils/cohort.js'
import { generateDataFile, range } from './generate-data-file.js'

// Example admin user
const exampleUser = new User(exampleUsers[0])

// Users
let users = faker.helpers.multiple(User.generate, { count: 20 })
users = [exampleUser, ...users]

// Organisations
const organisations = faker.helpers.multiple(Organisation.generate, {
  count: 5
})

// Batch
const batches = faker.helpers.multiple(Batch.generate, { count: 20 })

// Records
const recordCount = process.env.RECORDS || 4000
process.env.CAMPAIGNS || Object.values(CampaignType).join(',')
const records = faker.helpers.multiple(Record.generate, {
  count: Number(recordCount)
})

// Campaigns
const enabledCampaigns =
  process.env.CAMPAIGNS || Object.values(CampaignType).join(',')
let campaigns = []
for (const type of enabledCampaigns.split(',')) {
  const campaign = Campaign.generate(
    type,
    createCohort(type, records),
    exampleUser
  )

  campaigns.push(campaign)
}

// Add an empty campaign
campaigns.push(
  new Campaign({
    type: CampaignType.FLU,
    created_user_uid: exampleUser.uid,
    name: 'Example Flu Winter 23/24',
    year: AcademicYear.Y2023,
    start: new Date('2024-01-01'),
    end: new Date('2024-04-01')
  })
)

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
let vaccinations = []
const children = Object.groupBy(patients, ({ record }) => record.urn)
for (const [urn, patients] of Object.entries(children)) {
  let session

  for (const campaign of campaigns) {
    // Create session
    session = Session.generate(urn, campaign, exampleUser, {
      isToday: urn === '108912' || urn === '135300'
    })

    const sessionCompleted = session.status === SessionStatus.Completed

    const patientsInCampaign = Object.values(patients).filter(
      (patient) => patient.campaign_uid === campaign.uid
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

        // Unmatch a reply
        if (replyCount > 1 && session.status === SessionStatus.Planned) {
          const replyToUnmatch = Object.values(patient.replies)[2]

          // Set the date of birth to have the incorrect year
          const dob = new Date(replyToUnmatch.child.dob)
          dob.setFullYear(dob.getFullYear() - 2)
          replyToUnmatch.child.dob = dob

          // Add reply to unmatched replies
          session.consents[replyToUnmatch.uuid] = replyToUnmatch

          // Remove reply from patient record
          delete patient.replies[replyToUnmatch.uuid]
        }
      }

      // Record vaccination and add to patient record and upload
      if (sessionCompleted) {
        const location = schools[patient.record.urn].name

        // Create vaccination outcome
        const vaccination = Vaccination.generate(
          patient,
          campaign,
          session,
          location,
          users
        )

        // Add vaccination outcome to patient
        patient.capture = vaccination

        // Add vaccination
        vaccinations.push(vaccination)

        if (process.env.FEATURE_UPLOADS) {
          // Add to pending vaccinations; requires upload to see on CHIS
          campaign.pendingVaccinations.push(vaccination.uuid)
        } else {
          // Add vaccination to CHIS record (if full/partially vaccinated)
          if (vaccination.given) {
            const record = records.find(
              (record) => record.nhsn === patient.nhsn
            )
            record.vaccinations.push(vaccination.uuid)
          }
        }
      }
    }
  }
}

// Generate date files
generateDataFile('.data/batches.json', _.keyBy(batches, 'id'))
generateDataFile('.data/campaigns.json', _.keyBy(campaigns, 'uid'))
generateDataFile('.data/organisations.json', _.keyBy(organisations, 'code'))
generateDataFile('.data/patients.json', _.keyBy(patients, 'uuid'))
generateDataFile('.data/records.json', _.keyBy(records, 'nhsn'))
generateDataFile('.data/sessions.json', _.keyBy(sessions, 'id'))
generateDataFile('.data/users.json', _.keyBy(users, 'uid'))
generateDataFile('.data/vaccinations.json', _.keyBy(vaccinations, 'uuid'))
