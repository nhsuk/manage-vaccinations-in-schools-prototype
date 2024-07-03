import { AcademicYear } from '../models/campaign.js'
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
import { GPRegistered } from '../models/record.js'
import { RegistrationOutcome } from '../models/registration.js'
import { ReplyDecision, ReplyMethod, ReplyRefusal } from '../models/reply.js'
import {
  ConsentWindow,
  SessionFormat,
  SessionTime,
  SessionStatus
} from '../models/session.js'
import {
  VaccinationMethod,
  VaccinationOutcome,
  VaccinationProtocol,
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
  response.locals.TriageOutcome = TriageOutcome
  response.locals.VaccinationMethod = VaccinationMethod
  response.locals.VaccinationOutcome = VaccinationOutcome
  response.locals.VaccinationProtocol = VaccinationProtocol
  response.locals.VaccinationSite = VaccinationSite
  response.locals.VaccineMethod = VaccineMethod

  next()
}
