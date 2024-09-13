import process from 'node:process'
import _ from 'lodash'
import { faker } from '@faker-js/faker'
import exampleUsers from '../app/datasets/users.js'
import schools from '../app/datasets/schools.js'
import { Batch } from '../app/models/batch.js'
import { Campaign } from '../app/models/campaign.js'
import { Organisation } from '../app/models/organisation.js'
import { Patient } from '../app/models/patient.js'
import { Programme, programmeTypes } from '../app/models/programme.js'
import { Record } from '../app/models/record.js'
import { Reply } from '../app/models/reply.js'
import { ConsentWindow, Session, SessionStatus } from '../app/models/session.js'
import { User } from '../app/models/user.js'
import { Vaccination } from '../app/models/vaccination.js'
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
const records = faker.helpers.multiple(Record.generate, {
  count: Number(recordCount)
})

// Programmes
let programmes = []
for (const type of Object.keys(programmeTypes)) {
  const programme = Programme.generate(type)

  programmes.push(programme)
}

// Campaigns
let campaigns = []
for (const programme of programmes) {
  const campaign = Campaign.generate(programme, records, exampleUser)

  campaigns.push(campaign)
}

// Patients
// Create patient records and attach them with a campaign
let patients = []
for (const campaign of campaigns) {
  for (const nhsn of campaign.records) {
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

  for (const programme of programmes) {
    // Create session
    session = Session.generate(urn, programme, exampleUser, {
      isToday: urn === '108912' || urn === '135300'
    })

    const sessionActive = session.status === SessionStatus.Active
    const sessionCompleted = session.status === SessionStatus.Completed
    const sessionPlanned = session.status === SessionStatus.Planned

    // Update patients
    for (const patient of patients) {
      const invitePatientToSession = faker.helpers.maybe(() => true, {
        probability: 0.5
      })

      // Invite patient to session
      // Only invite 50% of relevant cohort if session still being planned
      if (invitePatientToSession || sessionActive || sessionCompleted) {
        patient.invite = session
        sessions.push(session)
      }

      const patientInvitedToSession = patient.session_id

      // Add replies to patient
      let addRepliesToPatient
      switch (session.consentWindow.value) {
        case ConsentWindow.Opening:
          addRepliesToPatient = false
        case ConsentWindow.Closed:
          addRepliesToPatient = faker.datatype.boolean(0.95)
          break
        default:
          addRepliesToPatient = faker.datatype.boolean(0.75)
      }

      if (patientInvitedToSession && addRepliesToPatient) {
        const maxReplies = faker.helpers.weightedArrayElement([
          { value: 0, weight: 0.7 },
          { value: 1, weight: 0.2 },
          { value: 2, weight: 0.1 }
        ])
        for (const _index in [...range(0, maxReplies)]) {
          // Respond with reply
          patient.respond = Reply.generate(programme, session, patient)
        }
      }

      // Unmatch a reply
      const replies = Object.values(patient.replies)
      if (sessionPlanned && patientInvitedToSession && replies.length > 2) {
        const replyToUnmatch = replies[2]

        // Set the date of birth to have the incorrect year
        const dob = new Date(replyToUnmatch.child.dob)
        dob.setFullYear(dob.getFullYear() - 2)
        replyToUnmatch.child.dob = dob

        // Add reply to unmatched replies
        session.consents[replyToUnmatch.uuid] = replyToUnmatch

        // Remove reply from patient record
        delete patient.replies[replyToUnmatch.uuid]
      }

      // Record vaccination and add to patient record and upload
      if (sessionCompleted && patientInvitedToSession) {
        const location = schools[patient.record.urn].name

        // Create vaccination outcome
        const vaccination = Vaccination.generate(
          patient,
          programme,
          session,
          location,
          users
        )

        if (process.env.FEATURE_UPLOADS) {
          // Mark vaccination as pending; requires upload to see on CHIS
          vaccination._pending = true
        }

        // Add vaccination outcome to patient
        patient.capture = vaccination

        // Add vaccination
        vaccinations.push(vaccination)

        if (!process.env.FEATURE_UPLOADS) {
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
generateDataFile('.data/programmes.json', _.keyBy(programmes, 'pid'))
generateDataFile('.data/records.json', _.keyBy(records, 'nhsn'))
generateDataFile('.data/sessions.json', _.keyBy(sessions, 'id'))
generateDataFile('.data/users.json', _.keyBy(users, 'uid'))
generateDataFile('.data/vaccinations.json', _.keyBy(vaccinations, 'uuid'))
