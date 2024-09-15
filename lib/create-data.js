import process from 'node:process'
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
import { User, UserRole } from '../app/models/user.js'
import { Vaccination } from '../app/models/vaccination.js'
import { generateDataFile, range } from './generate-data-file.js'

// Settings
const totalUsers = process.env.ORGANISATIONS || 20
const totalOrganisations = process.env.ORGANISATIONS || 5
const totalBatches = process.env.BATCHES || 20
const totalRecords = process.env.RECORDS || 4000

// Users
const users = new Map()
for (const _index in [...range(0, totalUsers)]) {
  const user = User.generate()
  users.set(user.uid, user)
}

// Pre-defined users
for (const user of exampleUsers) {
  users.set(user.uid, new User(user))
}

// Nurse users
const nurses = Array.from(users.values()).filter(
  (user) => user.role === UserRole.ClinicalAdmin
)
const nurse = nurses[0]

// Organisations
const organisations = new Map()
for (const _index in [...range(0, totalOrganisations)]) {
  const organisation = Organisation.generate()
  organisations.set(organisation.code, organisation)
}

// Batches
const batches = new Map()
for (const _index in [...range(0, totalBatches)]) {
  const batch = Batch.generate()
  batches.set(batch.id, batch)
}

// Records
const records = new Map()
for (const _index in [...range(0, totalRecords)]) {
  const record = Record.generate()
  records.set(record.nhsn, record)
}

// Programmes
const programmes = new Map()
for (const type of Object.keys(programmeTypes)) {
  const programme = Programme.generate(type)

  programmes.set(programme.pid, programme)
}

// Cohorts
const cohorts = new Map()
for (const programme of programmes.values()) {
  for (const yearGroup of programme.yearGroups) {
    const cohort = Cohort.generate(programme, records, yearGroup, nurse)

    programme.cohorts.push(cohort.uid)
    cohorts.set(cohort.uid, cohort)
  }
}

// Patients
const patients = new Map()
for (const cohort of cohorts.values()) {
  for (const nhsn of cohort.records) {
    let patient = patients
      .values()
      .find((patient) => patient.record.nhsn === nhsn)

    // Patient not added to system yet
    if (!patient) {
      const record = records.values().find((record) => record.nhsn === nhsn)
      patient = Patient.generate(record)
    }

    // 1️⃣ SELECT patient for programme cohort
    patient.select = cohort
    patients.set(patient.uuid, patient)
  }
}

// Sessions
const sessions = new Map()
for (const programme of programmes.values()) {
  // Build list of school URNs at which cohorts attend
  let urns = []
  for (const uid of programme.cohorts) {
    const cohort = cohorts.values().find((cohort) => cohort.uid === uid)

    for (const nhsn of cohort.records) {
      const record = records.values().find((record) => record.nhsn === nhsn)

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

    const session = Session.generate(urn, programme, nurse, {
      isToday: urn === 108912 || urn === 135300
    })

    sessions.set(session.id, session)
  }
}

// Invite, consent and capture
const vaccinations = new Map()
for (const patient of patients.values()) {
  const session = sessions
    .values()
    .find((session) => session.urn === patient.record.urn)

  // Session may not take place at child’s school (i.e. HPV at a primary school)
  if (!session) {
    continue
  }

  const sessionCompleted = session.status === SessionStatus.Completed
  const sessionPlanned = session.status === SessionStatus.Planned

  // TODO: Support sessions with multiple programmes
  const programme = programmes
    .values()
    .find((programme) => programme.pid === session.programmes[0])

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
      nurses
    )

    if (process.env.FEATURE_UPLOADS) {
      // Mark vaccination as pending; requires upload to see on CHIS
      vaccination._pending = true
    }

    // 4️⃣ CAPTURE vaccination outcome
    patient.capture = vaccination
    vaccinations.set(vaccination.uuid, vaccination)

    if (!process.env.FEATURE_UPLOADS) {
      // 5️⃣ FLOW vaccination to CHIS record (if full/partially vaccinated)
      if (vaccination.given) {
        const record = records
          .values()
          .find((record) => record.nhsn === patient.nhsn)
        record.vaccinations.push(vaccination.uuid)
      }
    }
  }
}

// Generate date files
generateDataFile('.data/batches.json', Object.fromEntries(batches))
generateDataFile('.data/cohorts.json', Object.fromEntries(cohorts))
generateDataFile('.data/organisations.json', Object.fromEntries(organisations))
generateDataFile('.data/patients.json', Object.fromEntries(patients))
generateDataFile('.data/programmes.json', Object.fromEntries(programmes))
generateDataFile('.data/records.json', Object.fromEntries(records))
generateDataFile('.data/sessions.json', Object.fromEntries(sessions))
generateDataFile('.data/users.json', Object.fromEntries(users))
generateDataFile('.data/vaccinations.json', Object.fromEntries(vaccinations))
