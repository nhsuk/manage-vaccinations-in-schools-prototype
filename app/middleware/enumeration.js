import { EventType } from '../models/audit-event.js'
import { Gender } from '../models/child.js'
import { AcademicYear } from '../models/cohort.js'
import { DownloadFormat } from '../models/download.js'
import { GillickCompetent } from '../models/gillick.js'
import { MoveSource } from '../models/move.js'
import { NoticeType } from '../models/notice.js'
import {
  EmailStatus,
  ParentalRelationship,
  SmsStatus
} from '../models/parent.js'
import {
  ConsentOutcome,
  Activity,
  PatientOutcome,
  ScreenOutcome,
  TriageOutcome
} from '../models/patient-session.js'
import { ProgrammeType, ProgrammePreset } from '../models/programme.js'
import { ReplyDecision, ReplyMethod, ReplyRefusal } from '../models/reply.js'
import { SchoolPhase } from '../models/school.js'
import {
  ConsentWindow,
  RegistrationOutcome,
  SessionStatus,
  SessionType
} from '../models/session.js'
import { UploadStatus, UploadType } from '../models/upload.js'
import { UserRole } from '../models/user.js'
import {
  VaccinationMethod,
  VaccinationOutcome,
  VaccinationProtocol,
  VaccinationSite
} from '../models/vaccination.js'
import { VaccineMethod } from '../models/vaccine.js'

export const enumeration = (request, response, next) => {
  response.locals.AcademicYear = AcademicYear
  response.locals.ConsentOutcome = ConsentOutcome
  response.locals.ConsentWindow = ConsentWindow
  response.locals.DownloadFormat = DownloadFormat
  response.locals.EmailStatus = EmailStatus
  response.locals.EventType = EventType
  response.locals.Gender = Gender
  response.locals.GillickCompetent = GillickCompetent
  response.locals.MoveSource = MoveSource
  response.locals.Activity = Activity
  response.locals.NoticeType = NoticeType
  response.locals.ParentalRelationship = ParentalRelationship
  response.locals.PatientOutcome = PatientOutcome
  response.locals.ProgrammeType = ProgrammeType
  response.locals.ProgrammePreset = ProgrammePreset
  response.locals.RegistrationOutcome = RegistrationOutcome
  response.locals.ReplyDecision = ReplyDecision
  response.locals.ReplyMethod = ReplyMethod
  response.locals.ReplyRefusal = ReplyRefusal
  response.locals.SchoolPhase = SchoolPhase
  response.locals.ScreenOutcome = ScreenOutcome
  response.locals.SessionStatus = SessionStatus
  response.locals.SessionType = SessionType
  response.locals.SmsStatus = SmsStatus
  response.locals.TriageOutcome = TriageOutcome
  response.locals.UploadStatus = UploadStatus
  response.locals.UploadType = UploadType
  response.locals.UserRole = UserRole
  response.locals.VaccinationMethod = VaccinationMethod
  response.locals.VaccinationOutcome = VaccinationOutcome
  response.locals.VaccinationProtocol = VaccinationProtocol
  response.locals.VaccinationSite = VaccinationSite
  response.locals.VaccineMethod = VaccineMethod

  next()
}
