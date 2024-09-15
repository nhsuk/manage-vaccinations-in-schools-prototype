import process from 'node:process'
import _ from 'lodash'
import { faker } from '@faker-js/faker'
import exampleUsers from '../app/datasets/users.js'
import schools from '../app/datasets/schools.js'
import { Batch } from '../app/models/batch.js'
import { Cohort } from '../app/models/cohort.js'
import { Organisation } from '../app/models/organisation.js'
import { Patient } from '../app/models/patient.js'
import {
  Programme,
  ProgrammeType,
  programmeTypes
} from '../app/models/programme.js'
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

// Batches
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

// Cohorts
let cohorts = []
for (const programme of programmes) {
  for (const yearGroup of programme.yearGroups) {
    const cohort = Cohort.generate(programme, records, yearGroup, exampleUser)

    programme.cohorts.push(cohort.uid)
    cohorts.push(cohort)
  }
}

// Patients
let patients = []
for (const cohort of cohorts) {
  for (const nhsn of cohort.records) {
    let patient = patients.find((patient) => patient.record.nhsn === nhsn)

    // Patient not added to system yet
    if (!patient) {
      const record = records.find((record) => record.nhsn === nhsn)
      patient = Patient.generate(record)
    }

    // 1️⃣ SELECT patient for programme cohort
    patient.select = cohort
    patients.push(patient)
  }
}

// Sessions
let sessions = []
for (const programme of programmes) {
  // Build list of school URNs at which cohorts attend
  let urns = []
  for (const uid of programme.cohorts) {
    const cohort = cohorts.find((cohort) => cohort.uid === uid)

    for (const nhsn of cohort.records) {
      const record = records.find((record) => record.nhsn === nhsn)

      urns.push(record.urn)
    }

    // Ensure list of URNs remains unique
    urns = [...new Set(urns)]
  }

  // Schedule sessions
  for (const urn of urns) {
    const { phase } = schools[urn]

    // Only flu programmes are held in primary schools
    if (phase === 'Primary' && programme.type !== ProgrammeType.Flu) {
      continue
    }

    const session = Session.generate(urn, programme, exampleUser, {
      isToday: urn === 108912 || urn === 135300
    })

    sessions.push(session)
  }
}

// Invite, consent and capture
let vaccinations = []
for (const patient of patients) {
  const session = sessions.find((session) => session.urn === patient.record.urn)
  const sessionCompleted = session.status === SessionStatus.Completed
  const sessionPlanned = session.status === SessionStatus.Planned

  // TODO: Support sessions with multiple programmes
  const programme = programmes.find(
    (programme) => programme.pid === session.programmes[0]
  )

  // 2️⃣ INVITE patient to session
  patient.invite = session

  // TODO: Support patient in multiple sessions
  const patientInSession = patient.session_id

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

  if (patientInSession && addRepliesToPatient) {
    const maxReplies = faker.helpers.weightedArrayElement([
      { value: 0, weight: 0.7 },
      { value: 1, weight: 0.2 },
      { value: 2, weight: 0.1 }
    ])
    for (const _index in [...range(0, maxReplies)]) {
      // 3️⃣ GET CONSENT for vaccination
      patient.respond = Reply.generate(programme, session, patient)
    }
  }

  // Unmatch a reply
  const replies = Object.values(patient.replies)
  if (sessionPlanned && patientInSession && replies.length > 2) {
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

  // Vaccination outcome
  if (patientInSession && sessionCompleted) {
    const location = schools[patient.record.urn].name

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

    // 4️⃣ CAPTURE vaccination outcome
    patient.capture = vaccination
    vaccinations.push(vaccination)

    if (!process.env.FEATURE_UPLOADS) {
      // 5️⃣ FLOW vaccination to CHIS record (if full/partially vaccinated)
      if (vaccination.given) {
        const record = records.find((record) => record.nhsn === patient.nhsn)
        record.vaccinations.push(vaccination.uuid)
      }
    }
  }
}

// Generate date files
generateDataFile('.data/batches.json', _.keyBy(batches, 'id'))
generateDataFile('.data/cohorts.json', _.keyBy(cohorts, 'uid'))
generateDataFile('.data/organisations.json', _.keyBy(organisations, 'code'))
generateDataFile('.data/patients.json', _.keyBy(patients, 'uuid'))
generateDataFile('.data/programmes.json', _.keyBy(programmes, 'pid'))
generateDataFile('.data/records.json', _.keyBy(records, 'nhsn'))
generateDataFile('.data/sessions.json', _.keyBy(sessions, 'id'))
generateDataFile('.data/users.json', _.keyBy(users, 'uid'))
generateDataFile('.data/vaccinations.json', _.keyBy(vaccinations, 'uuid'))
