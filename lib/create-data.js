import process from 'node:process'

import { faker } from '@faker-js/faker'
import { isSameDay } from 'date-fns'
import 'dotenv/config'

import clinicsData from '../app/datasets/clinics.js'
import organisationsData from '../app/datasets/organisations.js'
import schoolsData from '../app/datasets/schools.js'
import usersData from '../app/datasets/users.js'
import vaccinesData from '../app/datasets/vaccines.js'
import {
  AcademicYear,
  ConsentOutcome,
  ConsentWindow,
  PatientOutcome,
  ProgrammePreset,
  ProgrammeType,
  NoticeType,
  MoveSource,
  RegistrationOutcome,
  SchoolPhase,
  ScreenOutcome,
  SessionType,
  UploadType,
  UserRole,
  TriageOutcome
} from '../app/enums.js'
import { generateBatch } from '../app/generators/batch.js'
import { generateCohort } from '../app/generators/cohort.js'
import { generateConsent } from '../app/generators/consent.js'
import { generateInstruction } from '../app/generators/instruction.js'
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
import { Instruction } from '../app/models/instruction.js'
import { Move } from '../app/models/move.js'
import { Organisation } from '../app/models/organisation.js'
import { PatientSession } from '../app/models/patient-session.js'
import { programmeTypes } from '../app/models/programme.js'
import { Session } from '../app/models/session.js'
import { User } from '../app/models/user.js'
import { Vaccination } from '../app/models/vaccination.js'
import {
  addDays,
  getDateValueDifference,
  formatDate,
  removeDays,
  today
} from '../app/utils/date.js'
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
  (user) => user.role === UserRole.Nurse
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
  programmes.set(programme.id, programme)
}

// Cohorts
const cohorts = new Map()
const patients = new Map()
for (const programme of programmes.values()) {
  for (const yearGroup of programme.yearGroups) {
    let cohort = generateCohort(programme, yearGroup, nurse)

    // Flu programme runs in the next academic year
    if (programme.type === ProgrammeType.Flu) {
      cohort.year = AcademicYear.Y2025
    }

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
for (const [programmePreset, preset] of Object.entries(ProgrammePreset)) {
  const urns = [...schools.values()]
    .filter(({ phase }) =>
      // Adolescent programmes are only held at secondary schools
      preset.adolescent ? phase === SchoolPhase.Secondary : phase
    )
    .map(({ urn }) => urn)

  // Schedule school sessions
  for (const school_urn of urns) {
    let schoolSession = generateSession(programmePreset, nurse, { school_urn })
    if (schoolSession) {
      schoolSession = new Session(schoolSession, {
        programmes: Object.fromEntries(programmes),
        schools: Object.fromEntries(schools)
      })
      sessions.set(schoolSession.id, schoolSession)
    }
  }

  // Schedule clinic sessions
  // TODO: Get clinics from team (linked to patient’s school)
  let clinicSession
  for (const clinic_id of ['X99999']) {
    clinicSession = generateSession(programmePreset, nurse, { clinic_id })
    if (clinicSession) {
      clinicSession = new Session(clinicSession, {
        clinics: Object.fromEntries(clinics),
        programmes
      })
      sessions.set(clinicSession.id, clinicSession)
    }
  }
}

// Ensure at least one school session is scheduled for today
const earliestPlannedSchoolSession = [...sessions.values()]
  .map((session) => new Session(session))
  .sort((a, b) => getDateValueDifference(a.openAt, b.openAt))
  .find((session) => session.isPlanned)

const hasSessionToday = earliestPlannedSchoolSession?.dates.find((date) =>
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
      for (const programme_id of session.programme_ids) {
        const patientSession = new PatientSession(
          {
            createdAt: session.openAt,
            patient_uuid: patient.uuid,
            programme_id,
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

        // Add patient to session
        patient.addToSession(patientSession)

        // 2️⃣🅰️ INVITE parent to give consent
        patient.inviteToSession(patientSession)
        patientSessions.set(patientSession.uuid, patientSession)
      }
    }
  }

  if (session.type === SessionType.Clinic) {
    const patientsOutsideSchool = [...patients.values()].filter(
      ({ school_urn }) => ['888888', '999999'].includes(school_urn)
    )

    for (const patient of patientsOutsideSchool) {
      for (const programme_id of session.programme_ids) {
        const patientSession = new PatientSession(
          {
            patient_uuid: patient.uuid,
            programme_id,
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

        // Add patient to session
        patient.addToSession(session.id)

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
  const patientSessionWithContext = new PatientSession(patientSession, {
    patients: Object.fromEntries(patients),
    sessions: Object.fromEntries(sessions),
    programmes: Object.fromEntries(programmes),
    vaccines: vaccinesData
  })

  const { patient, session } = patientSessionWithContext

  // Session may not have a schedule assigned to it yet
  if (session.isUnplanned) {
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
          patientSessionWithContext,
          index,
          lastConsentCreatedAt
        )

        lastConsentCreatedAt = consent.createdAt

        const matchReplyWithPatient = faker.datatype.boolean(0.95)
        if (!matchReplyWithPatient && session.isPlanned) {
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
const instructions = new Map()
const vaccinations = new Map()
for (const patientSession of patientSessions.values()) {
  // Update patient session to include replies in context
  const patientSessionWithContext = new PatientSession(patientSession, {
    clinics: Object.fromEntries(clinics),
    patients: Object.fromEntries(patients),
    replies: Object.fromEntries(replies),
    schools: Object.fromEntries(schools),
    sessions: Object.fromEntries(sessions),
    programmes: Object.fromEntries(programmes),
    vaccines: vaccinesData
  })

  // Screen answers to health questions
  if (patientSessionWithContext.screen === ScreenOutcome.NeedsTriage) {
    // Get triage notes
    for (const response of patientSessionWithContext.responsesWithTriageNotes) {
      const triaged = faker.datatype.boolean(0.3)
      if (triaged) {
        let outcome = faker.helpers.weightedArrayElement([
          { value: ScreenOutcome.NeedsTriage, weight: 2 },
          { value: ScreenOutcome.DelayVaccination, weight: 2 },
          { value: ScreenOutcome.DoNotVaccinate, weight: 1 },
          { value: ScreenOutcome.Vaccinate, weight: 7 }
        ])

        // For programmes that offer alternative vaccine methods, we use
        // screening outcomes specific to each vaccine method
        if (outcome === ScreenOutcome.Vaccinate) {
          if (patientSessionWithContext.programme.alternativeVaccine) {
            outcome = patientSessionWithContext.hasConsentForInjectionOnly
              ? ScreenOutcome.VaccinateInjection
              : ScreenOutcome.VaccinateNasal
          }
        }

        let note = response.triageNote

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

        // 4️⃣ SCREEN with triage outcome (initial)
        patientSession.recordTriage({
          outcome,
          name: `Triaged decision: ${outcome}`,
          note,
          createdAt: addDays(response.createdAt, 2),
          createdBy_uid: nurse.uid
        })
      }
    }
  }

  const { patient, session } = patientSessionWithContext

  // Add instruction outcome
  if (session.isActive || session.isCompleted) {
    // Don’t add a PSD if patient needs triage
    const canInstruct =
      patientSessionWithContext.triage !== TriageOutcome.Needed

    if (session.psdProtocol && canInstruct) {
      let instruction = generateInstruction(
        patientSessionWithContext,
        programme,
        session,
        nurses
      )
      instruction = new Instruction(instruction, {
        patients: Object.fromEntries(patients),
        programmes: Object.fromEntries(programmes)
      })
      instructions.set(instruction.uuid, instruction)

      // GIVE INSTRUCTION for PSD
      patientSession.giveInstruction(instruction)
    }
  }

  // Add vaccination outcome
  if (session.isCompleted) {
    // Ensure any outstanding triage has been completed
    if (patientSessionWithContext.screen === ScreenOutcome.NeedsTriage) {
      const outcome = ScreenOutcome.Vaccinate
      const note = 'Spoke to GP, safe to vaccinate.'

      // 4️⃣ SCREEN with triage outcome (final)
      patientSession.recordTriage({
        outcome,
        name: `Triaged decision: ${outcome}`,
        note,
        createdAt: removeDays(session.firstDate, 2),
        createdBy_uid: nurse.uid
      })
    }

    for (const programme of session.programmes) {
      if (patientSessionWithContext.vaccine) {
        const batch = [...batches.values()]
          .filter(
            ({ vaccine_snomed }) =>
              vaccine_snomed === patientSessionWithContext.vaccine.snomed
          )
          .find(({ archivedAt }) => archivedAt)

        let vaccination = generateVaccination(
          patientSessionWithContext,
          programme,
          batch,
          nurses
        )
        vaccination = new Vaccination(vaccination, {
          patients: Object.fromEntries(patients),
          programmes: Object.fromEntries(programmes)
        })
        vaccinations.set(vaccination.uuid, vaccination)

        const vaccinatedInSchool = faker.datatype.boolean(0.8)
        if (vaccinatedInSchool) {
          // REGISTER attendance (15 minutes before vaccination)
          patientSession.registerAttendance(
            {
              createdAt: new Date(vaccination.createdAt.getTime() - 15 * 60000),
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
}

// Invite remaining unvaccinated patients to clinics
for (const programme of programmes.values()) {
  const programmeSchoolSessions = [...sessions.values()].filter(
    ({ programme_ids }) => programme_ids.includes(programme.id)
  )

  const programmeClinicSession = [...sessions.values()]
    .filter(({ programme_ids }) => programme_ids.includes(programme.id))
    .filter(({ type }) => type === SessionType.Clinic)

  // Move patients without outcome in a completed school session to a clinic
  programmeSchoolSessions.forEach((session) => {
    if (session.isCompleted) {
      // TODO: Patients have no context, so won’t have outcomes to filter on
      const sessionPatients = session.patients
        .filter(({ report }) => report !== PatientOutcome.Vaccinated)
        .filter(({ screen }) => screen !== ScreenOutcome.DoNotVaccinate)
        .filter(({ consent }) => consent !== ConsentOutcome.Refused)
        .filter(({ consent }) => consent !== ConsentOutcome.FinalRefusal)

      for (const patient of sessionPatients) {
        // Add patient to session
        patient.addToSession(session.id)

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
    ({ programme_id }) => programme_id === programme.id
  )

  const record_nhsns = []
  programmeVaccinations.forEach(({ patientSession_uuid }) => {
    const hasPatientSession = patientSessions.has(patientSession_uuid)
    if (hasPatientSession) {
      const patientSession = patientSessions.get(patientSession_uuid)
      record_nhsns.push(patientSession.patient.nhsn)
    }
  })
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

// Unselect patient from all cohorts
for (const uid of deceasedPatient.cohort_uids) {
  const cohort = cohorts.get(uid)

  deceasedPatient.unselectFromCohort(cohort, {
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

// Generate date files
generateDataFile('.data/batches.json', batches)
generateDataFile('.data/clinics.json', clinics)
generateDataFile('.data/cohorts.json', cohorts)
generateDataFile('.data/instructions.json', instructions)
generateDataFile('.data/moves.json', moves)
generateDataFile('.data/notices.json', notices)
generateDataFile('.data/organisations.json', organisations)
generateDataFile('.data/patients.json', patients)
generateDataFile('.data/patient-sessions.json', patientSessions)
generateDataFile('.data/programmes.json', programmes)
generateDataFile('.data/records.json', records)
generateDataFile('.data/replies.json', replies)
generateDataFile('.data/schools.json', schools)
generateDataFile('.data/sessions.json', sessions)
generateDataFile('.data/uploads.json', uploads)
generateDataFile('.data/users.json', users)
generateDataFile('.data/vaccinations.json', vaccinations)

// Show information about generated data
console.info(
  `Data generated for today, ${formatDate(today(), { dateStyle: 'long' })}`
)
