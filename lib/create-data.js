import process from 'node:process'

import { faker } from '@faker-js/faker'
import { isSameDay } from 'date-fns'
import 'dotenv/config'

import clinicsData from '../app/datasets/clinics.js'
import organisationsData from '../app/datasets/organisations.js'
import schoolsData from '../app/datasets/schools.js'
import usersData from '../app/datasets/users.js'
import { generateBatch } from '../app/generators/batch.js'
import { generateCohort } from '../app/generators/cohort.js'
import { generateConsent } from '../app/generators/consent.js'
import { generateNotice } from '../app/generators/notice.js'
import { generateOrganisation } from '../app/generators/organisation.js'
import { generateProgramme } from '../app/generators/programme.js'
import { generateRecord } from '../app/generators/record.js'
import { generateSchool } from '../app/generators/school.js'
import { generateSession } from '../app/generators/session.js'
import { generateUpload } from '../app/generators/upload.js'
import { generateUser } from '../app/generators/user.js'
import { generateVaccination } from '../app/generators/vaccination.js'
import { Clinic } from '../app/models/clinic.js'
import { Cohort } from '../app/models/cohort.js'
import { Move, MoveSource } from '../app/models/move.js'
import { NoticeType } from '../app/models/notice.js'
import { Organisation } from '../app/models/organisation.js'
import {
  ConsentOutcome,
  PatientOutcome,
  PatientSession,
  RegistrationOutcome,
  ScreenOutcome
} from '../app/models/patient-session.js'
import { programmeTypes } from '../app/models/programme.js'
import { SchoolPhase, schoolTerms } from '../app/models/school.js'
import {
  ConsentWindow,
  Session,
  SessionStatus,
  SessionType
} from '../app/models/session.js'
import { UploadType } from '../app/models/upload.js'
import { User, UserRole } from '../app/models/user.js'
import { Vaccination } from '../app/models/vaccination.js'
import { getDateValueDifference, formatDate, today } from '../app/utils/date.js'
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

  if (programme.active) {
    programmes.set(programme.pid, programme)
  }
}

// Cohorts
const cohorts = new Map()
const patients = new Map()
for (const programme of programmes.values()) {
  for (const yearGroup of programme.yearGroups) {
    let cohort = generateCohort(programme, yearGroup, nurse)
    cohort = new Cohort(cohort, {
      programmes: Object.fromEntries(programmes),
      records: Object.fromEntries(records)
    })
    cohorts.set(cohort.uid, cohort)

    // Update programme with cohort
    programme.cohort_uids.push(cohort.uid)

    // 1️⃣ SELECT patients for programme cohort
    cohort.select({ patients, records })
  }
}

// Uploads
const uploads = new Map()

// Add cohort upload
const record_nhsns = [...records.values()].map((record) => record.nhsn)
const cohortUpload = generateUpload(record_nhsns, nurse)
uploads.set(cohortUpload.id, cohortUpload)

// Add invalid cohort upload (invalid file)
const invalidCohortUpload = generateUpload(false, nurse)
uploads.set(invalidCohortUpload.id, invalidCohortUpload)

// Add devoid cohort upload (no new records)
const devoidCohortUpload = generateUpload(undefined, nurse)
uploads.set(devoidCohortUpload.id, devoidCohortUpload)

// Add class list uploads
for (const school of schools.values()) {
  const record_nhsns = [...records.values()]
    .filter((record) => record.school_urn === school.urn)
    .map((record) => record.nhsn)

  const schoolUpload = generateUpload(
    record_nhsns,
    nurse,
    UploadType.School,
    school
  )
  uploads.set(schoolUpload.id, schoolUpload)
}

// Sessions
const sessions = new Map()
const programmesGroupedByTerm = Object.groupBy(
  programmes.values(),
  ({ term }) => term
)
for (const [term, termProgrammes] of Object.entries(programmesGroupedByTerm)) {
  const pids = [...termProgrammes.values()]
    .filter((programme) => programme.term === term)
    .map((programme) => programme.pid)

  const isSeasonal = [...termProgrammes.values()].some(
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
      programmes: Object.fromEntries(programmes),
      schools: Object.fromEntries(schools)
    })
    sessions.set(schoolSession.id, schoolSession)
  }

  // Schedule clinic sessions
  // TODO: Get clinics from team (linked to patient’s school)
  let clinicSession
  for (const clinic_id of ['X99999']) {
    clinicSession = generateSession(pids, schoolTerms[term], nurse, {
      clinic_id
    })
    clinicSession = new Session(clinicSession, {
      clinics: Object.fromEntries(clinics),
      programmes: Object.fromEntries(programmes)
    })
    sessions.set(clinicSession.id, clinicSession)
  }
}

// Ensure at least one school session is scheduled for today
const earliestPlannedSchoolSession = [...sessions.values()]
  .map((session) => new Session(session))
  .sort((a, b) => getDateValueDifference(a.openAt, b.openAt))
  .find((session) => session.status === SessionStatus.Planned)

const hasSessionToday = earliestPlannedSchoolSession.dates.find((date) =>
  isSameDay(date, today())
)

if (!hasSessionToday) {
  earliestPlannedSchoolSession.dates.shift()
  earliestPlannedSchoolSession.dates.unshift(today())
  sessions.set(earliestPlannedSchoolSession.id, earliestPlannedSchoolSession)
}

// Invite
// TODO: Don’t invite patients who’ve already had a programme’s vaccination
const patientSessions = new Map()
for (const session of sessions.values()) {
  if (session.type === SessionType.School) {
    const patientsInsideSchool = [...patients.values()].filter(
      ({ school_urn }) => school_urn === session.school_urn
    )

    for (const patient of patientsInsideSchool) {
      for (const programme_pid of session.programme_pids) {
        const patientSession = new PatientSession(
          {
            patient_uuid: patient.uuid,
            programme_pid,
            session_id: session.id
          },
          {
            patients: Object.fromEntries(patients),
            patientSessions: Object.fromEntries(patientSessions),
            programmes: Object.fromEntries(programmes),
            schools: Object.fromEntries(schools),
            sessions: Object.fromEntries(sessions)
          }
        )

        // 2️⃣🅰️ INVITE patient to school session
        patient.inviteToSession(patientSession)
        patientSessions.set(patientSession.uuid, patientSession)
      }
    }
  }

  if (session.type === SessionType.Clinic) {
    const patientsOutsideSchool = [...patients.values()].filter(
      ({ school_urn }) => [888888, 999999].includes(school_urn)
    )

    for (const patient of patientsOutsideSchool) {
      for (const programme_pid of session.programme_pids) {
        const patientSession = new PatientSession(
          {
            patient_uuid: patient.uuid,
            programme_pid,
            session_id: session.id
          },
          {
            clinics: Object.fromEntries(clinics),
            patients: Object.fromEntries(patients),
            patientSessions: Object.fromEntries(patientSessions),
            programmes: Object.fromEntries(programmes),
            sessions: Object.fromEntries(sessions)
          }
        )

        // 2️⃣🅱️ INVITE home-schooled/school unknown patient to clinic session
        patient.inviteToSession(patientSession)
        patientSessions.set(patientSession.uuid, patientSession)
      }
    }
  }
}

// Consent
let programme
const replies = new Map()
for (const patientSession of patientSessions.values()) {
  const { patient, session } = patientSession

  // Session may not have a schedule assigned to it yet
  const sessionUnplanned = session.status === SessionStatus.Unplanned
  if (sessionUnplanned) {
    continue
  }

  let getConsentForPatient
  switch (session.consentWindow) {
    case ConsentWindow.Opening:
      getConsentForPatient = false
      break
    case ConsentWindow.Closed:
      getConsentForPatient = faker.datatype.boolean(0.95)
      break
    default:
      getConsentForPatient = faker.datatype.boolean(0.75)
  }

  if (getConsentForPatient) {
    const maxReplies = faker.helpers.weightedArrayElement([
      { value: 0, weight: 0.7 },
      { value: 1, weight: 0.3 }
    ])
    Array.from([...range(0, maxReplies)]).forEach((_, index) => {
      let lastConsentCreatedAt
      for (programme of session.programmes) {
        const consent = generateConsent(
          programme,
          session,
          patientSession,
          index,
          lastConsentCreatedAt
        )

        lastConsentCreatedAt = consent.createdAt

        const matchReplyWithPatient = faker.datatype.boolean(0.95)
        const sessionPlanned = session.status === SessionStatus.Planned
        if (!matchReplyWithPatient && sessionPlanned) {
          // Set the date of birth to have the incorrect year
          const dob = new Date(consent.child.dob)
          dob.setFullYear(dob.getFullYear() - 2)
          consent.child.dob = dob
        } else {
          // 3️⃣ GET CONSENT and link reply with patient record
          consent.linkToPatient(patient, {
            patients: Object.fromEntries(patients),
            replies: Object.fromEntries(replies)
          })
        }
        replies.set(consent.uuid, consent)
      }
    })
  }
}

// Screen and record
const vaccinations = new Map()
for (const patientSession of patientSessions.values()) {
  // Update patient session to include replies in context
  const patientSessionWithReplyContext = new PatientSession(patientSession, {
    patients: Object.fromEntries(patients),
    replies: Object.fromEntries(replies),
    sessions: Object.fromEntries(sessions)
  })

  // Screen answers to health questions
  if (patientSessionWithReplyContext.screen === ScreenOutcome.NeedsTriage) {
    // Get triage notes
    for (let note of patientSessionWithReplyContext.consentTriageNotes) {
      const triaged = faker.datatype.boolean(0.3)
      if (triaged) {
        const outcome = faker.helpers.weightedArrayElement([
          { value: ScreenOutcome.NeedsTriage, weight: 1 },
          { value: ScreenOutcome.DelayVaccination, weight: 2 },
          { value: ScreenOutcome.DoNotVaccinate, weight: 1 },
          { value: ScreenOutcome.Vaccinate, weight: 7 }
        ])

        switch (outcome) {
          case ScreenOutcome.NeedsTriage:
            note = 'Keep in triage until can contact GP.'
            break
          case ScreenOutcome.DelayVaccination:
            note = 'Delay vaccination until later session.'
            break
          case ScreenOutcome.DoNotVaccinate:
            note = 'Decided to not vaccinate at this time.'
            break
        }

        // 4️⃣ SCREEN with triage outcome
        patientSession.recordTriage({
          outcome,
          name: `Triaged decision: ${outcome}`,
          note,
          createdBy_uid: nurse.uid
        })
      }
    }
  }

  const patient = patients.get(patientSessionWithReplyContext.patient_uuid)
  const session = sessions.get(patientSessionWithReplyContext.session_id)

  // Vaccination outcome
  const sessionCompleted = session.status === SessionStatus.Completed
  if (sessionCompleted) {
    for (const programme of session.programmes) {
      const batch = [...batches.values()]
        .filter(({ vaccine_gtin }) => vaccine_gtin === programme.vaccine.gtin)
        .find(({ archivedAt }) => archivedAt)

      let vaccination = generateVaccination(
        patientSessionWithReplyContext,
        programme,
        session,
        batch,
        nurses
      )
      vaccination = new Vaccination(vaccination, {
        patients: Object.fromEntries(patients)
      })
      vaccinations.set(vaccination.uuid, vaccination)

      const vaccinatedInSchool = faker.datatype.boolean(0.8)
      if (vaccinatedInSchool) {
        // REGISTER attendance
        patientSession.registerAttendance(
          {
            createdAt: vaccination.createdAt,
            createdBy_uid: nurse.uid
          },
          RegistrationOutcome.Present
        )

        // 5️⃣ RECORD vaccination outcome
        patient.recordVaccination(vaccination)

        // 6️⃣ REPORT vaccination outcome
        const record = records.get(patient.nhsn)
        record.reportVaccination(vaccination)
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
        .filter(({ outcome }) => outcome !== PatientOutcome.Vaccinated)
        .filter(({ screen }) => screen !== ScreenOutcome.DoNotVaccinate)
        .filter(({ consent }) => consent !== ConsentOutcome.Refused)
        .filter(({ consent }) => consent !== ConsentOutcome.FinalRefusal)

      for (const patient of sessionPatients) {
        // 2️⃣ INVITE patient to community clinic
        // TODO: Invite to all available clinics
        // TODO: Requires support for multiple patient sessions
        patient.inviteToSession(programmeClinicSession)
      }
    }
  })
}

// Add vaccination upload for vaccinations administered in each programme
for (const programme of programmes.values()) {
  const programmeVaccinations = [...vaccinations.values()].filter(
    ({ programme_pid }) => programme_pid === programme.pid
  )
  const record_nhsns = programmeVaccinations.map(({ patient }) => patient.nhsn)
  const vaccinationUpload = generateUpload(
    record_nhsns,
    nurse,
    UploadType.Report
  )
  uploads.set(vaccinationUpload.id, vaccinationUpload)
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
  const cohort = cohorts.get(uid)

  deceasedPatient.rejectFromCohort(cohort, {
    patients: Object.fromEntries(patients)
  })
}

// Remove patient from any sessions
for (const uuid of deceasedPatient.patientSession_uuids) {
  const hasPatientSession = patientSessions.has(uuid)

  if (hasPatientSession) {
    const patientSession = patientSessions.get(uuid)

    patientSession.removeFromSession({
      createdBy_uid: nurse.uid
    })
  }
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
  (patient) => patient.vaccination_uuids.length > 0
)
if (vaccinatedPatient) {
  const hiddenNotice = generateNotice(vaccinatedPatient, NoticeType.Hidden)
  notices.set(hiddenNotice.uuid, hiddenNotice)
  vaccinatedPatient.addNotice(hiddenNotice)
}

// Delete context from models
cohorts.forEach((cohort) => {
  delete cohort.context
})
patientSessions.forEach((patientSession) => {
  delete patientSession.context
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
generateDataFile('.data/moves.json', Object.fromEntries(moves))
generateDataFile('.data/notices.json', Object.fromEntries(notices))
generateDataFile('.data/organisations.json', Object.fromEntries(organisations))
generateDataFile('.data/patients.json', Object.fromEntries(patients))
generateDataFile(
  '.data/patient-sessions.json',
  Object.fromEntries(patientSessions)
)
generateDataFile('.data/programmes.json', Object.fromEntries(programmes))
generateDataFile('.data/records.json', Object.fromEntries(records))
generateDataFile('.data/replies.json', Object.fromEntries(replies))
generateDataFile('.data/schools.json', Object.fromEntries(schools))
generateDataFile('.data/sessions.json', Object.fromEntries(sessions))
generateDataFile('.data/uploads.json', Object.fromEntries(uploads))
generateDataFile('.data/users.json', Object.fromEntries(users))
generateDataFile('.data/vaccinations.json', Object.fromEntries(vaccinations))

// Show information about generated data
console.info(
  `Data generated for today, ${formatDate(today(), { dateStyle: 'long' })}`
)
