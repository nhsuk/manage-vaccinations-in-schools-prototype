import process from 'node:process'

import { faker } from '@faker-js/faker'
import 'dotenv/config'

import clinicsData from '../app/datasets/clinics.js'
import organisationsData from '../app/datasets/organisations.js'
import schoolsData from '../app/datasets/schools.js'
import usersData from '../app/datasets/users.js'
import { generateBatch } from '../app/generators/batch.js'
import { generateCohort } from '../app/generators/cohort.js'
import { generateImport } from '../app/generators/import.js'
import { generateNotice } from '../app/generators/notice.js'
import { generateOrganisation } from '../app/generators/organisation.js'
import { generateProgramme } from '../app/generators/programme.js'
import { generateRecord } from '../app/generators/record.js'
import { generateReply } from '../app/generators/reply.js'
import { generateSchool } from '../app/generators/school.js'
import { generateSession } from '../app/generators/session.js'
import { generateUser } from '../app/generators/user.js'
import { generateVaccination } from '../app/generators/vaccination.js'
import { Clinic } from '../app/models/clinic.js'
import { Cohort } from '../app/models/cohort.js'
import { ImportType } from '../app/models/import.js'
import { Move, MoveSource } from '../app/models/move.js'
import { NoticeType } from '../app/models/notice.js'
import { Organisation } from '../app/models/organisation.js'
import {
  ConsentOutcome,
  Patient,
  PatientOutcome,
  ScreenOutcome
} from '../app/models/patient.js'
import { programmeTypes } from '../app/models/programme.js'
import { SchoolPhase, schoolTerms } from '../app/models/school.js'
import {
  ConsentWindow,
  Session,
  SessionStatus,
  SessionType
} from '../app/models/session.js'
import { User, UserRole } from '../app/models/user.js'
import { Vaccination } from '../app/models/vaccination.js'
import { getToday, formatDate } from '../app/utils/date.js'
import { range } from '../app/utils/number.js'

import { generateDataFile } from './generate-data-file.js'

// Settings
const totalUsers = Number(process.env.USERS) || 20
const totalOrganisations = Number(process.env.ORGANISATIONS) || 5
const totalBatches = Number(process.env.BATCHES) || 100
const totalRecords = Number(process.env.RECORDS) || 4000

// Users
const users = new Map()
Array.from([...range(0, totalUsers)]).forEach(() => {
  const user = generateUser()
  users.set(user.uid, user)
})

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
Array.from([...range(0, totalOrganisations)]).forEach(() => {
  const organisation = generateOrganisation()
  organisations.set(organisation.code, organisation)
})

// Pre-defined organisations
for (const organisation of organisationsData) {
  organisations.set(organisation.code, new Organisation(organisation))
}

// Clinics
const clinics = new Map()
for (const clinic of Object.values(clinicsData)) {
  clinics.set(clinic.id, new Clinic(clinic))
}

// Schools
const schools = new Map()
for (const school of Object.values(schoolsData)) {
  schools.set(school.urn, generateSchool(school.urn))
}

// Batches
const batches = new Map()
Array.from([...range(0, totalBatches)]).forEach(() => {
  const batch = generateBatch()
  batches.set(batch.id, batch)
})

// Records
const records = new Map()
Array.from([...range(0, totalRecords)]).forEach(() => {
  const record = generateRecord()
  records.set(record.nhsn, record)
})

// Programmes
const programmes = new Map()
for (const type of Object.keys(programmeTypes)) {
  const programme = generateProgramme(type)

  programmes.set(programme.pid, programme)
}

// Cohorts
const cohorts = new Map()
for (const programme of programmes.values()) {
  for (const yearGroup of programme.yearGroups) {
    let cohort = generateCohort(programme, records, yearGroup, nurse)
    cohort = new Cohort(cohort, {
      programmes: Object.fromEntries(programmes),
      records: Object.fromEntries(records)
    })

    programme.cohort_uids.push(cohort.uid)
    cohorts.set(cohort.uid, cohort)
  }
}

// Imports
const imports = new Map()
let programme
for (const cohort of cohorts.values()) {
  programme = programmes.get(cohort.programme_pid)

  const cohortImport = generateImport(programme, cohort.record_nhsns, nurse)
  imports.set(cohortImport.id, cohortImport)
  const schoolImport = generateImport(
    programme,
    cohort.record_nhsns.slice(0, 30),
    nurse,
    ImportType.School
  )
  imports.set(schoolImport.id, schoolImport)
}

// Add invalid cohort import (invalid file)
const invalidImport = generateImport(programme, false, nurse)
imports.set(invalidImport.id, invalidImport)

// Add devoid cohort import (no new records)
const devoidImport = generateImport(programme, undefined, nurse)
imports.set(devoidImport.id, devoidImport)

// Patients
const patients = new Map()
for (const cohort of cohorts.values()) {
  for (const nhsn of cohort.record_nhsns) {
    let patient = [...patients.values()].find(
      (patient) => patient.nhsn === nhsn
    )

    // Patient not added to system yet
    if (!patient) {
      const record = [...records.values()].find(
        (record) => record.nhsn === nhsn
      )
      patient = new Patient(record)
    }

    if (patient) {
      // 1️⃣ SELECT imported patient for programme cohort
      patient.addToCohort(cohort)
      patients.set(patient.uuid, patient)
    }
  }
}

// Sessions
const sessions = new Map()
const programmesGroupedByTerm = Object.groupBy(
  Object.values(programmeTypes),
  ({ term }) => term
)
for (const [term, programmes] of Object.entries(programmesGroupedByTerm)) {
  const pids = [...programmes.values()]
    .filter((programme) => programme.term === term)
    .map((programme) => programme.pid)

  const isSeasonal = [...programmes.values()].some(
    ({ seasonal }) => seasonal === true
  )

  const urns = [...schools.values()]
    .filter(({ phase }) =>
      // Non-seasonal programmes are only held at secondary schools
      !isSeasonal ? phase === SchoolPhase.Secondary : phase
    )
    .map(({ urn }) => urn)

  // Schedule school sessions
  for (const school_urn of urns) {
    let schoolSession = generateSession(pids, schoolTerms[term], nurse, {
      school_urn
    })
    schoolSession = new Session(schoolSession, {
      schools: Object.fromEntries(schools)
    })
    sessions.set(schoolSession.id, schoolSession)

    // Get all patients at this school
    // TODO: Remove any who have already had vaccination
    const schoolPatients = [...patients.values()].filter(
      (patient) => patient.school_urn === school_urn
    )

    for (const patient of schoolPatients) {
      // 2️⃣ INVITE patient to school session
      patient.inviteToSession(schoolSession)
    }
  }

  // Schedule clinic sessions
  // TODO: Get clinics from team (linked to patient’s school)
  let clinicSession
  for (const clinic_id of ['X99999']) {
    clinicSession = generateSession(pids, schoolTerms[term], nurse, {
      clinic_id
    })
    clinicSession = new Session(clinicSession, {
      clinics: Object.fromEntries(clinics)
    })
    sessions.set(clinicSession.id, clinicSession)
  }

  const clinicPatients = [...patients.values()].filter((patient) =>
    [888888, 999999].includes(patient.school_urn)
  )

  for (const patient of clinicPatients) {
    // 2️⃣ INVITE home-schooled/school unknown patient to clinic session
    patient.inviteToSession(clinicSession)
  }
}

// Consent and capture
const consents = new Map()
const vaccinations = new Map()
for (const patient of patients.values()) {
  const patientSessions = [...sessions.values()].filter(({ id }) =>
    patient.session_ids.includes(id)
  )

  for (const session of patientSessions) {
    const sessionProgrammes = [...programmes.values()].filter(({ pid }) =>
      session.programme_pids.includes(pid)
    )

    for (const programme of sessionProgrammes) {
      const sessionCompleted = session.status === SessionStatus.Completed
      const sessionPlanned = session.status === SessionStatus.Planned
      const sessionUnplanned = session.status === SessionStatus.Unplanned

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

      if (addRepliesToPatient) {
        const maxReplies = faker.helpers.weightedArrayElement([
          { value: 0, weight: 0.7 },
          { value: 1, weight: 0.2 },
          { value: 2, weight: 0.1 }
        ])
        Array.from([...range(0, maxReplies)]).forEach(() => {
          // 3️⃣ GET CONSENT for vaccination
          const reply = generateReply(programme, session, patient)
          patient.addReply(reply)
        })
      }

      // Unmatch a reply
      const replies = Object.values(patient.replies)
      if (sessionPlanned && replies.length > 2) {
        const replyToUnmatch = replies[2]

        // Set the date of birth to have the incorrect year
        const dob = new Date(replyToUnmatch.child.dob)
        dob.setFullYear(dob.getFullYear() - 2)
        replyToUnmatch.child.dob = dob

        // Add reply to unmatched replies
        consents.set(replyToUnmatch.uuid, replyToUnmatch)

        // Remove reply from patient record
        delete patient.replies[replyToUnmatch.uuid]
      }

      // Vaccination outcome
      if (sessionCompleted) {
        const batch = [...batches.values()]
          .filter(({ vaccine_gtin }) => vaccine_gtin === programme.vaccine.gtin)
          .find(({ archived }) => archived)

        let vaccination = generateVaccination(
          patient,
          programme,
          session,
          batch,
          nurses
        )
        vaccination = new Vaccination(vaccination, {
          patients: Object.fromEntries(patients)
        })

        const vaccinatedInSchool = faker.datatype.boolean(0.8)

        if (vaccinatedInSchool) {
          // 4️⃣ CAPTURE vaccination outcome
          patient.captureVaccination(vaccination)
          vaccinations.set(vaccination.uuid, vaccination)

          // 5️⃣ FLOW vaccination to CHIS record (if full/partially vaccinated)
          if (vaccination.given) {
            const record = [...records.values()].find(
              (record) => record.nhsn === patient.nhsn
            )
            record.vaccination_uuids.push(vaccination.uuid)
          }
        }
      }
    }
  }
}

// Invite remaining unvaccinated patients to clinics
for (const programme of programmes.values()) {
  const programmeSchoolSessions = [...sessions.values()].filter(
    ({ programme_pids }) => programme_pids.includes(programme.pid)
  )

  const programmeClinicSession = [...sessions.values()]
    .filter(({ programme_pids }) => programme_pids.includes(programme.pid))
    .filter(({ type }) => type === SessionType.Clinic)

  // Move patients without outcome in a completed school session to a clinic
  programmeSchoolSessions.forEach((session) => {
    if (session.status === SessionStatus.Completed) {
      // TODO: Patients have no context, so won’t have outcomes to filter on
      const sessionPatients = session.patients
        .filter(({ outcome }) => outcome.value !== PatientOutcome.Vaccinated)
        .filter(({ screen }) => screen.value !== ScreenOutcome.DoNotVaccinate)
        .filter(({ consent }) => consent.value !== ConsentOutcome.Refused)
        .filter(({ consent }) => consent.value !== ConsentOutcome.FinalRefusal)

      for (const patient of sessionPatients) {
        // 2️⃣ INVITE patient to community clinic
        // TODO: Invite to all available clinics
        // TODO: Requires support for multiple patient sessions
        patient.inviteToSession(programmeClinicSession)
      }
    }
  })
}

// Add vaccination import for all vaccinations in programme
for (const programme of programmes.values()) {
  const programmeVaccinations = [...vaccinations.values()].filter(
    ({ programme_pid }) => programme_pid === programme.pid
  )

  const record_nhsns = programmeVaccinations.map(({ patient }) => patient.nhsn)
  const vaccinationImport = generateImport(
    programme,
    record_nhsns,
    nurse,
    ImportType.Report
  )
  imports.set(vaccinationImport.id, vaccinationImport)
}

// Add moves
const moves = new Map()
for (const patient of patients.values()) {
  if (patient?.pendingChanges?.school_urn) {
    const move = new Move({
      from: patient.school_urn,
      to: patient?.pendingChanges?.school_urn,
      source: MoveSource.Cohort,
      patient_uuid: patient.uuid
    })
    moves.set(move.uuid, move)
  }
}

// Add notices
const notices = new Map()

// Flag patient as having died
const deceasedPatient = [...patients.values()][0]
const deceasedNotice = generateNotice(deceasedPatient, NoticeType.Deceased)
notices.set(deceasedNotice.uuid, deceasedNotice)
deceasedPatient.addNotice(deceasedNotice)

// Remove patient from all cohorts
for (const uid of deceasedPatient.cohort_uids) {
  const cohort = new Cohort({
    ...cohorts.get(uid),
    ...{ created: getToday(1) },
    ...{ created_user_uid: false }
  })

  deceasedPatient.unselect = cohort
}

// Remove patient from any sessions
for (const id of deceasedPatient.session_ids) {
  const session = new Session({
    ...sessions.get(id),
    ...{ created: getToday(2) },
    ...{ created_user_uid: false }
  })

  deceasedPatient.removeFromSession(session)
}

// Flag patient record as invalid
const invalidPatient = [...patients.values()][1]
const invalidNotice = generateNotice(invalidPatient, NoticeType.Invalid)
notices.set(invalidNotice.uuid, invalidNotice)
invalidPatient.addNotice(invalidNotice)

// Flag patient record as sensitive
const sensitivePatient = [...patients.values()][2]
const sensitiveNotice = generateNotice(sensitivePatient, NoticeType.Sensitive)
notices.set(sensitiveNotice.uuid, sensitiveNotice)
sensitivePatient.addNotice(sensitiveNotice)

// Flag patient record as not wanting vaccination to be shared with GP
const vaccinatedPatient = [...patients.values()].find(
  (patient) => patient.outcome.value === PatientOutcome.Vaccinated
)
const hiddenNotice = generateNotice(vaccinatedPatient, NoticeType.Hidden)
notices.set(hiddenNotice.uuid, hiddenNotice)
vaccinatedPatient.addNotice(hiddenNotice)

// Delete context from models
cohorts.forEach((cohort) => {
  delete cohort.context
})
sessions.forEach((session) => {
  delete session.context
})
vaccinations.forEach((vaccination) => {
  delete vaccination.context
})

// Generate date files
generateDataFile('.data/batches.json', Object.fromEntries(batches))
generateDataFile('.data/clinics.json', Object.fromEntries(clinics))
generateDataFile('.data/cohorts.json', Object.fromEntries(cohorts))
generateDataFile('.data/consents.json', Object.fromEntries(consents))
generateDataFile('.data/imports.json', Object.fromEntries(imports))
generateDataFile('.data/moves.json', Object.fromEntries(moves))
generateDataFile('.data/notices.json', Object.fromEntries(notices))
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
