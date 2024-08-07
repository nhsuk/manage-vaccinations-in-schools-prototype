import { AcademicYear, CampaignType } from '../models/campaign.js'
import { DownloadFormat } from '../models/download.js'
import { EventType } from '../models/event.js'
import { GillickCompetent } from '../models/gillick.js'
import { ContactPreference, ParentalRelationship } from '../models/parent.js'
import {
  CaptureOutcome,
  ConsentOutcome,
  PatientOutcome,
  ScreenOutcome,
  TriageOutcome
} from '../models/patient.js'
import { GPRegistered, Sex } from '../models/record.js'
import { RegistrationOutcome } from '../models/registration.js'
import { ReplyDecision, ReplyMethod, ReplyRefusal } from '../models/reply.js'
import {
  ConsentWindow,
  SessionFormat,
  SessionTime,
  SessionStatus
} from '../models/session.js'
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
  response.locals.CampaignType = CampaignType
  response.locals.CaptureOutcome = CaptureOutcome
  response.locals.ConsentOutcome = ConsentOutcome
  response.locals.ConsentWindow = ConsentWindow
  response.locals.ContactPreference = ContactPreference
  response.locals.DownloadFormat = DownloadFormat
  response.locals.EventType = EventType
  response.locals.GillickCompetent = GillickCompetent
  response.locals.GPRegistered = GPRegistered
  response.locals.HealthQuestion = HealthQuestion
  response.locals.ParentalRelationship = ParentalRelationship
  response.locals.PatientOutcome = PatientOutcome
  response.locals.PreScreenQuestion = PreScreenQuestion
  response.locals.RegistrationOutcome = RegistrationOutcome
  response.locals.ReplyDecision = ReplyDecision
  response.locals.ReplyMethod = ReplyMethod
  response.locals.ReplyRefusal = ReplyRefusal
  response.locals.ScreenOutcome = ScreenOutcome
  response.locals.SessionFormat = SessionFormat
  response.locals.SessionTime = SessionTime
  response.locals.SessionStatus = SessionStatus
  response.locals.Sex = Sex
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
