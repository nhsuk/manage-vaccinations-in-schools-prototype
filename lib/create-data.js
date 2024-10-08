import process from 'node:process'
import { faker } from '@faker-js/faker'
import clinicsData from '../app/datasets/clinics.js'
import organisationsData from '../app/datasets/organisations.js'
import usersData from '../app/datasets/users.js'
import schoolsData from '../app/datasets/schools.js'
import { Batch } from '../app/models/batch.js'
import { Clinic } from '../app/models/clinic.js'
import { Cohort } from '../app/models/cohort.js'
import { Import, ImportType } from '../app/models/import.js'
import { Organisation } from '../app/models/organisation.js'
import {
  ConsentOutcome,
  Patient,
  PatientOutcome,
  ScreenOutcome
} from '../app/models/patient.js'
import {
  Programme,
  ProgrammeType,
  programmeTypes
} from '../app/models/programme.js'
import { Record } from '../app/models/record.js'
import { Reply } from '../app/models/reply.js'
import { School, SchoolPhase } from '../app/models/school.js'
import {
  ConsentWindow,
  Session,
  SessionStatus,
  SessionType
} from '../app/models/session.js'
import { User, UserRole } from '../app/models/user.js'
import { Vaccination } from '../app/models/vaccination.js'
import { generateDataFile } from './generate-data-file.js'
import { addDays, getToday, formatDate } from '../app/utils/date.js'
import { range } from '../app/utils/number.js'

// Settings
const totalUsers = Number(process.env.USERS) || 20
const totalOrganisations = Number(process.env.ORGANISATIONS) || 5
const totalBatches = Number(process.env.BATCHES) || 20
const totalRecords = Number(process.env.RECORDS) || 4000
const activeProgrammes = process.env.PROGRAMMES
  ? process.env.PROGRAMMES.split(',')
  : Object.keys(programmeTypes)

// Users
const users = new Map()
for (const _index in [...range(0, totalUsers)]) {
  const user = User.generate()
  users.set(user.uid, user)
}

// Pre-defined users
for (const user of usersData) {
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

// Pre-defined organisations
for (const organisation of organisationsData) {
  organisations.set(organisation.code, new Organisation(organisation))
}

// Clinics
const clinics = new Map()
for (const clinic of Object.values(clinicsData)) {
  clinics.set(clinic.id, new Clinic(clinic))
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
for (const type of activeProgrammes) {
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

// Imports
const imports = new Map()
let programme
for (const cohort of cohorts.values()) {
  const importedRecords = cohort.records.map((nhsn) => records.get(nhsn))

  programme = programmes.get(cohort.programme_pid)

  const _import = Import.generate(programme, importedRecords, nurse)
  imports.set(_import.id, _import)
}

// Add invalid cohort import (invalid file)
const invalidImport = Import.generate(programme, false, nurse)
imports.set(invalidImport.id, invalidImport)

// Add devoid cohort import (no new records)
const devoidImport = Import.generate(programme, undefined, nurse)
imports.set(devoidImport.id, devoidImport)

// Patients
const patients = new Map()
for (const cohort of cohorts.values()) {
  for (const nhsn of cohort.records) {
    let patient = [...patients.values()].find(
      (patient) => patient.record.nhsn === nhsn
    )

    // Patient not added to system yet
    if (!patient) {
      const record = [...records.values()].find(
        (record) => record.nhsn === nhsn
      )
      patient = Patient.generate(record)
    }

    // 1️⃣ SELECT imported patient for programme cohort
    if (patient) {
      patient.select = cohort
      patients.set(patient.uuid, patient)
    }
  }
}

// Schools
const schools = new Map()
for (const patient of patients.values()) {
  const school = new School(schoolsData[patient.record.urn])

  schools.set(school.urn, school)
}

// Sessions
const sessions = new Map()
for (const programme of programmes.values()) {
  // Build list of school URNs at which cohorts attend
  let urns = []
  for (const uid of programme.cohorts) {
    const cohort = [...cohorts.values()].find((cohort) => cohort.uid === uid)

    for (const nhsn of cohort.records) {
      const record = [...records.values()].find(
        (record) => record.nhsn === nhsn
      )

      urns.push(record.urn)
    }

    // Ensure list of URNs remains unique
    urns = [...new Set(urns)]
  }

  // Schedule school sessions
  for (const urn of urns) {
    const school = schools.get(urn)

    // Only flu programmes are held in primary schools
    if (
      school &&
      school.phase === SchoolPhase.Primary &&
      programme.type !== ProgrammeType.Flu
    ) {
      continue
    }

    const session = Session.generate(urn, programme, nurse, {
      isToday: urn === 139383 || urn === 135335 // Primary and secondary school
    })

    sessions.set(session.id, session)
  }

  // Schedule community clinics
  // TODO: Get clinics from team (linked to patient’s school)
  for (const id of ['M86005', 'M86012', 'Y00996']) {
    const firstDate = addDays(getToday(), 30)
    const secondDate = addDays(getToday(), 60)

    const session = new Session({
      clinic_id: id,
      created_user_uid: nurse,
      dates: [firstDate, secondDate],
      open: programme.start,
      programmes: [programme.pid]
    })

    sessions.set(session.id, session)
  }
}

// Invite, consent and capture
const vaccinations = new Map()
for (const patient of patients.values()) {
  const session = [...sessions.values()].find(
    (session) => session.school_urn === patient.record.urn
  )

  // Session may not take place at child’s school (i.e. HPV at a primary school)
  if (!session) {
    continue
  }

  const sessionCompleted = session.status === SessionStatus.Completed
  const sessionPlanned = session.status === SessionStatus.Planned
  const sessionUnplanned = session.status === SessionStatus.Unplanned

  // TODO: Support sessions with multiple programmes
  const programme = [...programmes.values()].find(
    (programme) => programme.pid === session.programmes[0]
  )

  // 2️⃣ INVITE patient to session
  patient.invite = session

  // TODO: Support patient in multiple sessions
  const patientInSession = patient.session_id

  // Session may not have a schedule assigned to it yet
  if (sessionUnplanned) {
    continue
  }

  let addRepliesToPatient
  switch (session.consentWindow.value) {
    case ConsentWindow.Opening:
      addRepliesToPatient = false
      break
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
    const school = schools.get(patient.record.urn)
    const location = school.name

    const vaccination = Vaccination.generate(
      patient,
      programme,
      session,
      location,
      nurses
    )

    const vaccinatedInSchool = faker.datatype.boolean(0.8)

    if (vaccinatedInSchool) {
      // 4️⃣ CAPTURE vaccination outcome
      patient.capture = vaccination
      vaccinations.set(vaccination.uuid, vaccination)

      // 5️⃣ FLOW vaccination to CHIS record (if full/partially vaccinated)
      if (vaccination.given) {
        const record = [...records.values()].find(
          (record) => record.nhsn === patient.nhsn
        )
        record.vaccinations.push(vaccination.uuid)
      }
    }
  }
}

// Invite patients to clinics
for (const programme of programmes.values()) {
  const programmeSessions = [...sessions.values()].filter((session) =>
    session.programmes.includes(programme.pid)
  )

  // Move patients without outcome in a completed school session to a clinic
  programmeSessions.forEach((session) => {
    if (session.status === SessionStatus.Completed) {
      const sessionPatients = [...patients.values()]
        .filter((patient) => patient.session_id === session.id)
        .filter(({ outcome }) => outcome.value !== PatientOutcome.Vaccinated)
        .filter(({ screen }) => screen.value !== ScreenOutcome.DoNotVaccinate)
        .filter(({ consent }) => consent.value !== ConsentOutcome.Refused)
        .filter(({ consent }) => consent.value !== ConsentOutcome.FinalRefusal)

      // 2️⃣ INVITE patient to community clinic
      for (const patient of sessionPatients) {
        // TODO: Invite to all available clinics
        // TODO: Requires support for multiple patient sessions
        const clinicSessions = [...sessions.values()].filter(
          (session) => session.type === SessionType.Clinic
        )
        patient.invite = clinicSessions[0]
      }
    }
  })
}

// Add a vaccination import
const vaccinationRecords = []

vaccinations.forEach((vaccination) => {
  const patient = patients.get(vaccination.patient_uuid)
  vaccinationRecords.push(new Record(patient.record))
})

const vaccinationImport = Import.generate(
  programme,
  vaccinationRecords,
  nurse,
  ImportType.Report
)
imports.set(vaccinationImport.id, vaccinationImport)

// Generate date files
generateDataFile('.data/batches.json', Object.fromEntries(batches))
generateDataFile('.data/clinics.json', Object.fromEntries(clinics))
generateDataFile('.data/cohorts.json', Object.fromEntries(cohorts))
generateDataFile('.data/imports.json', Object.fromEntries(imports))
generateDataFile('.data/organisations.json', Object.fromEntries(organisations))
generateDataFile('.data/patients.json', Object.fromEntries(patients))
generateDataFile('.data/programmes.json', Object.fromEntries(programmes))
generateDataFile('.data/records.json', Object.fromEntries(records))
generateDataFile('.data/schools.json', Object.fromEntries(schools))
generateDataFile('.data/sessions.json', Object.fromEntries(sessions))
generateDataFile('.data/users.json', Object.fromEntries(users))
generateDataFile('.data/vaccinations.json', Object.fromEntries(vaccinations))

// Show information about generated data
console.info(
  `Data generated for today, ${formatDate(getToday(), { dateStyle: 'long' })}`
)
