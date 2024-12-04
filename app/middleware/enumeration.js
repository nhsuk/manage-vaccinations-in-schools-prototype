import { AcademicYear } from '../models/cohort.js'
import { DownloadFormat } from '../models/download.js'
import { EventType } from '../models/event.js'
import { GillickCompetent } from '../models/gillick.js'
import { ImportStatus, ImportType } from '../models/import.js'
import { MoveSource } from '../models/move.js'
import { NoticeType } from '../models/notice.js'
import { ContactPreference, ParentalRelationship } from '../models/parent.js'
import {
  CaptureOutcome,
  ConsentOutcome,
  PatientOutcome,
  ScreenOutcome,
  TriageOutcome
} from '../models/patient.js'
import { ProgrammeType } from '../models/programme.js'
import { Gender } from '../models/record.js'
import { RegistrationOutcome } from '../models/registration.js'
import { ReplyDecision, ReplyMethod, ReplyRefusal } from '../models/reply.js'
import { SchoolPhase } from '../models/school.js'
import { ConsentWindow, SessionStatus, SessionType } from '../models/session.js'
import { UserRole } from '../models/user.js'
import {
  VaccinationMethod,
  VaccinationOutcome,
  VaccinationProtocol,
  VaccinationSequence,
  VaccinationSite
} from '../models/vaccination.js'
import {
  HealthQuestion,
  PreScreenQuestion,
  VaccineMethod
} from '../models/vaccine.js'

export const enumeration = (request, response, next) => {
  response.locals.AcademicYear = AcademicYear
  response.locals.CaptureOutcome = CaptureOutcome
  response.locals.ConsentOutcome = ConsentOutcome
  response.locals.ConsentWindow = ConsentWindow
  response.locals.ContactPreference = ContactPreference
  response.locals.DownloadFormat = DownloadFormat
  response.locals.EventType = EventType
  response.locals.Gender = Gender
  response.locals.GillickCompetent = GillickCompetent
  response.locals.HealthQuestion = HealthQuestion
  response.locals.ImportStatus = ImportStatus
  response.locals.ImportType = ImportType
  response.locals.MoveSource = MoveSource
  response.locals.NoticeType = NoticeType
  response.locals.ParentalRelationship = ParentalRelationship
  response.locals.PatientOutcome = PatientOutcome
  response.locals.PreScreenQuestion = PreScreenQuestion
  response.locals.ProgrammeType = ProgrammeType
  response.locals.RegistrationOutcome = RegistrationOutcome
  response.locals.ReplyDecision = ReplyDecision
  response.locals.ReplyMethod = ReplyMethod
  response.locals.ReplyRefusal = ReplyRefusal
  response.locals.SchoolPhase = SchoolPhase
  response.locals.ScreenOutcome = ScreenOutcome
  response.locals.SessionStatus = SessionStatus
  response.locals.SessionType = SessionType
  response.locals.TriageOutcome = TriageOutcome
  response.locals.UserRole = UserRole
  response.locals.VaccinationMethod = VaccinationMethod
  response.locals.VaccinationOutcome = VaccinationOutcome
  response.locals.VaccinationProtocol = VaccinationProtocol
  response.locals.VaccinationSequence = VaccinationSequence
  response.locals.VaccinationSite = VaccinationSite
  response.locals.VaccineMethod = VaccineMethod

  next()
}
