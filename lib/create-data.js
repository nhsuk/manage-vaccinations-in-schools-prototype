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
  ArchiveRecordReason,
  ConsentOutcome,
  ConsentWindow,
  ProgrammeOutcome,
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
  TriageOutcome,
  ReplyDecision,
  ReplyMethod
} from '../app/enums.js'
import { generateBatch } from '../app/generators/batch.js'
import { generateCohort } from '../app/generators/cohort.js'
import { generateConsent } from '../app/generators/consent.js'
import { generateInstruction } from '../app/generators/instruction.js'
import { generateNotice } from '../app/generators/notice.js'
import { generateOrganisation } from '../app/generators/organisation.js'
import { generatePatient } from '../app/generators/patient.js'
import { generateProgramme } from '../app/generators/programme.js'
import { generateSchool } from '../app/generators/school.js'
import { generateSession } from '../app/generators/session.js'
import { generateUpload } from '../app/generators/upload.js'
import { generateUser } from '../app/generators/user.js'
import { generateVaccination } from '../app/generators/vaccination.js'
import { Clinic } from '../app/models/clinic.js'
import { Gillick } from '../app/models/gillick.js'
import { Instruction } from '../app/models/instruction.js'
import { Move } from '../app/models/move.js'
import { Organisation } from '../app/models/organisation.js'
import { PatientSession } from '../app/models/patient-session.js'
import { Patient } from '../app/models/patient.js'
import { Session } from '../app/models/session.js'
import { User } from '../app/models/user.js'
import { Vaccination } from '../app/models/vaccination.js'
import {
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
const totalPatients = Number(process.env.RECORDS) || 4000

// Context
const context = {}

// Users
context.users = {}
Array.from([...range(0, totalUsers)]).forEach(() => {
  const user = generateUser()
  context.users[user.uid] = user
})

// Pre-defined users
for (const user of usersData) {
  context.users[user.uid] = new User(user)
}

// Nurse users
const nurses = Object.values(context.users).filter(
  (user) => user.role === UserRole.Nurse
)
const nurse = nurses[0]

// Organisations
context.organisations = {}
Array.from([...range(0, totalOrganisations)]).forEach(() => {
  const organisation = generateOrganisation()
  context.organisations[organisation.code] = organisation
})

// Pre-defined organisations
for (const organisation of organisationsData) {
  context.organisations[organisation.code] = new Organisation(organisation)
}

// Clinics
context.clinics = {}
for (const clinic of Object.values(clinicsData)) {
  context.clinics[clinic.id] = new Clinic(clinic)
}

// Schools
context.schools = {}
for (const school of Object.values(schoolsData)) {
  context.schools[school.urn] = generateSchool(school.urn)
}

// Vaccines
context.vaccines = vaccinesData

// Batches
context.batches = {}
Array.from([...range(0, totalBatches)]).forEach(() => {
  const batch = generateBatch()
  context.batches[batch.id] = batch
})

// Patients
context.patients = {}
Array.from([...range(0, totalPatients)]).forEach(() => {
  const patient = generatePatient()
  context.patients[patient.uuid] = patient
})

// Programmes
context.programmes = {}
for (const type of Object.values(ProgrammeType)) {
  for (const year of Object.values(AcademicYear)) {
    const programme = generateProgramme(type, year)
    context.programmes[programme.id] = programme
  }
}

// Cohorts
context.cohorts = {}
for (const programme of Object.values(context.programmes)) {
  for (const yearGroup of programme.yearGroups) {
    const cohort = generateCohort(programme, yearGroup, nurse)
    cohort.context = context
    context.cohorts[cohort.uid] = cohort

    // Update programme with cohort
    programme.cohort_uids.push(cohort.uid)

    // 1️⃣ SELECT patients for programme cohort
    cohort.select(context)
  }
}

// Uploads
context.uploads = {}

// Add cohort upload
const patient_uuids = Object.values(context.patients).flatMap(
  ({ uuid }) => uuid
)
const cohortUpload = generateUpload(patient_uuids, nurse, UploadType.Cohort)
context.uploads[cohortUpload.id] = cohortUpload

// Add class list uploads
for (const school of Object.values(context.schools)) {
  const patient_uuids = Object.values(context.patients)
    .filter(({ school_urn }) => school_urn === school.urn)
    .flatMap(({ uuid }) => uuid)

  const schoolUpload = generateUpload(
    patient_uuids,
    nurse,
    UploadType.School,
    school
  )
  context.uploads[schoolUpload.id] = schoolUpload
}

// Sessions
context.sessions = {}
for (const [programmePreset, preset] of Object.entries(ProgrammePreset)) {
  const urns = Object.values(context.schools)
    .filter(({ phase }) =>
      // Adolescent programmes are only held at secondary schools
      preset.adolescent ? phase === SchoolPhase.Secondary : phase
    )
    .flatMap(({ urn }) => urn)

  // Schedule school sessions
  for (const year of Object.values(AcademicYear)) {
    for (const school_urn of urns) {
      const schoolSession = generateSession(programmePreset, year, nurse, {
        school_urn
      })
      if (schoolSession) {
        context.sessions[schoolSession.id] = new Session(schoolSession, context)
      }
    }
  }

  // Schedule clinic sessions
  // TODO: Get clinics from team (linked to patient’s school)
  for (const year of Object.values(AcademicYear)) {
    for (const clinic_id of ['X99999']) {
      const clinicSession = generateSession(programmePreset, year, nurse, {
        clinic_id
      })
      if (clinicSession) {
        context.sessions[clinicSession.id] = new Session(clinicSession, context)
      }
    }
  }
}

// Ensure at least one school session is scheduled for today
const earliestPlannedSchoolSession = Object.values(context.sessions)
  .map((session) => new Session(session))
  .sort((a, b) => getDateValueDifference(a.openAt, b.openAt))
  .find((session) => session.isPlanned)

const hasSessionToday = earliestPlannedSchoolSession?.dates.find((date) =>
  isSameDay(date, today())
)

if (!hasSessionToday) {
  earliestPlannedSchoolSession.dates.shift()
  earliestPlannedSchoolSession.dates.unshift(today())
  context.sessions[earliestPlannedSchoolSession.id] =
    earliestPlannedSchoolSession
}

// Invite
// TODO: Don’t invite patients who’ve already had a programme’s vaccination
context.patientSessions = {}
for (let session of Object.values(context.sessions)) {
  session = new Session(session, context)

  if (session.type === SessionType.School) {
    const patientsInsideSchool = Object.values(context.patients).filter(
      ({ school_urn }) => school_urn === session.school_urn
    )

    for (let patient of patientsInsideSchool) {
      patient = new Patient(patient, context)

      for (const programme_id of session.programme_ids) {
        const inviteToSession = patient.programme_ids.some((id) =>
          session.programme_ids.includes(id)
        )

        if (inviteToSession) {
          const patientSession = new PatientSession(
            {
              createdAt: session.openAt,
              patient_uuid: patient.uuid,
              programme_id,
              session_id: session.id
            },
            context
          )

          // Add patient to session
          patient.addToSession(patientSession)

          // 2️⃣🅰️ INVITE parent to give consent
          patient.inviteToSession(session)
          context.patientSessions[patientSession.uuid] = patientSession
        }
      }
    }
  }

  if (session.type === SessionType.Clinic) {
    const patientsOutsideSchool = Object.values(context.patients).filter(
      ({ school_urn }) => ['888888', '999999'].includes(school_urn)
    )

    for (const patient of patientsOutsideSchool) {
      for (const programme_id of session.programme_ids) {
        const inviteToSession = patient.programme_ids.some((id) =>
          session.programme_ids.includes(id)
        )

        if (inviteToSession) {
          const patientSession = new PatientSession(
            {
              patient_uuid: patient.uuid,
              programme_id,
              session_id: session.id
            },
            context
          )

          // Add patient to session
          patient.addToSession(patientSession)

          // 2️⃣🅱️ INVITE home-schooled/school unknown patient to clinic session
          patient.inviteToSession(session)
          context.patientSessions[patientSession.uuid] = patientSession
        }
      }
    }
  }
}

// Consent
let programme
context.replies = {}
for (const patientSession of Object.values(context.patientSessions)) {
  const { patient, session } = patientSession

  let getConsentForPatient
  switch (true) {
    // Session may not have a schedule assigned to it yet
    case session.isUnplanned:
      getConsentForPatient = false
      break
    // Session’s consent window is not open yet, so no requests have been sent
    case session.consentWindow === ConsentWindow.Opening:
      getConsentForPatient = false
      break
    // Session’s consent window has closed, so greater likelihood of a response
    case session.consentWindow === ConsentWindow.Closed:
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
        if (!matchReplyWithPatient && session.isPlanned) {
          // Set the date of birth to have the incorrect year
          const dob = new Date(consent.child.dob)
          dob.setFullYear(dob.getFullYear() - 2)
          consent.child.dob = dob
        } else {
          // 3️⃣ GET CONSENT and link reply with patient record
          consent.linkToPatient(patient)
        }
        context.replies[consent.uuid] = consent
      }
    })
  }
}

// Screen and record
context.instructions = {}
context.vaccinations = {}
for (const patientSession of Object.values(context.patientSessions)) {
  // Screen answers to health questions
  if (patientSession.screen === ScreenOutcome.NeedsTriage) {
    // Get triage notes
    for (const response of patientSession.responsesWithTriageNotes) {
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
          if (patientSession.programme.alternativeVaccine) {
            outcome = patientSession.hasConsentForInjectionOnly
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
          createdAt: response.createdAt,
          createdBy_uid: nurse.uid
        })
      }
    }
  }

  const { patient, session } = patientSession

  // Add instruction outcome to completed sessions
  if (session.isCompleted) {
    // Don’t add a PSD if patient needs triage
    const canInstruct = patientSession.triage !== TriageOutcome.Needed

    if (session.psdProtocol && canInstruct) {
      let instruction = generateInstruction(
        patientSession,
        programme,
        session,
        nurses
      )
      instruction = new Instruction(instruction, context)
      context.instructions[instruction.uuid] = instruction

      // GIVE INSTRUCTION for PSD
      patientSession.giveInstruction(instruction)
    }
  }

  // Add vaccination outcome
  if (session.isCompleted) {
    // Ensure any outstanding triage has been completed
    if (patientSession.screen === ScreenOutcome.NeedsTriage) {
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
      if (patientSession.vaccine) {
        const batch = Object.values(context.batches)
          .filter(
            ({ vaccine_snomed }) =>
              vaccine_snomed === patientSession.vaccine.snomed
          )
          .find(({ archivedAt }) => archivedAt)

        let vaccination = generateVaccination(
          patientSession,
          programme,
          batch,
          nurses
        )
        vaccination = new Vaccination(vaccination, context)
        context.vaccinations[vaccination.uuid] = vaccination

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
        }
      }
    }
  }
}

// Invite remaining unvaccinated patients to clinics
for (const programme of Object.values(context.programmes)) {
  const programmeSchoolSessions = Object.values(context.sessions).filter(
    ({ programme_ids }) => programme_ids.includes(programme.id)
  )

  const programmeClinicSession = Object.values(context.sessions)
    .filter(({ programme_ids }) => programme_ids.includes(programme.id))
    .filter(({ type }) => type === SessionType.Clinic)

  // Move patients without outcome in a completed school session to a clinic
  for (const session of programmeSchoolSessions) {
    if (session.isCompleted) {
      // TODO: Patients have no context, so won’t have outcomes to filter on
      const sessionPatients = session.patients
        .filter(({ report }) => report !== ProgrammeOutcome.Vaccinated)
        .filter(({ screen }) => screen !== ScreenOutcome.DoNotVaccinate)
        .filter(({ consent }) => consent !== ConsentOutcome.Refused)
        .filter(({ consent }) => consent !== ConsentOutcome.FinalRefusal)

      for (let patient of sessionPatients) {
        patient = new Patient(patient, context)

        // Add patient to session
        patient.addToSession(programmeClinicSession)

        // 2️⃣ INVITE patient to community clinic
        // TODO: Requires support for multiple patient sessions
        patient.inviteToSession(programmeClinicSession)
      }
    }
  }
}

// Add vaccination upload for vaccinations administered in each programme
for (const programme of Object.values(context.programmes)) {
  const programmeVaccinations = Object.values(context.vaccinations).filter(
    ({ programme_id }) => programme_id === programme.id
  )

  const patient_uuids = []
  programmeVaccinations.forEach(({ patientSession_uuid }) => {
    const hasPatientSession = context.patientSessions[patientSession_uuid]
    if (hasPatientSession) {
      const patientSession = context.patientSessions[patientSession_uuid]
      patient_uuids.push(patientSession.patient_uuid)
    }
  })
  if (patient_uuids.length > 0) {
    const vaccinationUpload = generateUpload(
      patient_uuids,
      nurse,
      UploadType.Report
    )
    context.uploads[vaccinationUpload.id] = vaccinationUpload
  }
}

// Add moves
context.moves = {}
for (const patient of Object.values(context.patients)) {
  if (patient?.pendingChanges?.school_urn) {
    const move = new Move({
      source: MoveSource.Cohort,
      from_urn: patient.school_urn,
      to_urn: patient?.pendingChanges?.school_urn,
      patient_uuid: patient.uuid
    })
    context.moves[move.uuid] = move
  }
}

// Add notices
context.notices = {}

// Flag patient as having died
const deceasedPatient = Object.values(context.patients)[0]
const deceasedNotice = generateNotice(deceasedPatient, NoticeType.Deceased)
context.notices[deceasedNotice.uuid] = deceasedNotice
deceasedPatient.addNotice(deceasedNotice)

// Archive deceased patient
Patient.archive(
  deceasedPatient.uuid,
  {
    archiveReason: ArchiveRecordReason.Deceased,
    createdBy_uid: nurse.uid
  },
  context
)

// Remove patient from any sessions
for (const uuid of deceasedPatient.patientSession_uuids) {
  const hasPatientSession = context.patientSessions[uuid]

  if (hasPatientSession) {
    const patientSession = context.patientSessions[uuid]

    patientSession.removeFromSession({
      createdBy_uid: nurse.uid
    })
  }
}

// Flag patient record as invalid
const invalidPatient = Object.values(context.patients)[1]
if (invalidPatient) {
  const invalidNotice = generateNotice(invalidPatient, NoticeType.Invalid)
  context.notices[invalidNotice.uuid] = invalidNotice
  invalidPatient.addNotice(invalidNotice)
}

// Flag patient record as sensitive
const sensitivePatient = Object.values(context.patients)[2]
if (sensitivePatient) {
  const sensitiveNotice = generateNotice(sensitivePatient, NoticeType.Sensitive)
  context.notices[sensitiveNotice.uuid] = sensitiveNotice
  sensitivePatient.addNotice(sensitiveNotice)
}

// Flag patient record as not wanting vaccination to be shared with GP
let vaccinatedPatient = Object.values(context.patients).find(
  (patient) => patient.vaccination_uuids.length > 0
)
if (vaccinatedPatient) {
  vaccinatedPatient = new Patient(vaccinatedPatient, context)

  for (let patientSession of vaccinatedPatient.patientSessions) {
    patientSession = new PatientSession(patientSession, context)

    // Check for a given consent response
    const givenConsentReply = patientSession.responses.find(
      (reply) => reply.decision === ReplyDecision.Given
    )

    if (givenConsentReply) {
      // Add Gillick assessment
      patientSession.gillick = new Gillick({
        q1: true,
        q2: true,
        q3: true,
        q4: true,
        q5: true
      })

      // Update patient session
      context.patientSessions[patientSession.uuid] = patientSession

      // Update existing consent response to be self-consent from the child
      givenConsentReply.method = ReplyMethod.InPerson
      givenConsentReply.parent = false
      givenConsentReply.selfConsent = true

      // Update consent response
      context.replies[givenConsentReply.uuid] = givenConsentReply

      // Generate notice and add to patient record
      const hiddenNotice = generateNotice(
        vaccinatedPatient,
        NoticeType.NoNotify
      )
      context.notices[hiddenNotice.uuid] = hiddenNotice
      vaccinatedPatient.addNotice(hiddenNotice)
    }
  }
}

// Generate date files
generateDataFile('.data/batches.json', context.batches)
generateDataFile('.data/clinics.json', context.clinics)
generateDataFile('.data/cohorts.json', context.cohorts)
generateDataFile('.data/instructions.json', context.instructions)
generateDataFile('.data/moves.json', context.moves)
generateDataFile('.data/notices.json', context.notices)
generateDataFile('.data/organisations.json', context.organisations)
generateDataFile('.data/patients.json', context.patients)
generateDataFile('.data/patient-sessions.json', context.patientSessions)
generateDataFile('.data/programmes.json', context.programmes)
generateDataFile('.data/replies.json', context.replies)
generateDataFile('.data/schools.json', context.schools)
generateDataFile('.data/sessions.json', context.sessions)
generateDataFile('.data/uploads.json', context.uploads)
generateDataFile('.data/users.json', context.users)
generateDataFile('.data/vaccinations.json', context.vaccinations)

// Show information about generated data
console.info(
  `Data generated for today, ${formatDate(today(), { dateStyle: 'long' })}`
)
