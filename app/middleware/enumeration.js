import { EventType } from '../models/event.js'
import {
  ConsentOutcome,
  PatientOutcome,
  ScreenOutcome
} from '../models/patient.js'
import {
  ConsentWindow,
  SessionFormat,
  SessionTime,
  SessionStatus
} from '../models/session.js'
import { Registrar } from '../models/user.js'
import {
  HealthQuestion,
  PreScreenQuestion,
  VaccineMethod
} from '../models/vaccine.js'

export const enumeration = (request, response, next) => {
  response.locals.ConsentOutcome = ConsentOutcome
  response.locals.ConsentWindow = ConsentWindow
  response.locals.EventType = EventType
  response.locals.HealthQuestion = HealthQuestion
  response.locals.PatientOutcome = PatientOutcome
  response.locals.PreScreenQuestion = PreScreenQuestion
  response.locals.Registrar = Registrar
  response.locals.ScreenOutcome = ScreenOutcome
  response.locals.SessionFormat = SessionFormat
  response.locals.SessionTime = SessionTime
  response.locals.SessionStatus = SessionStatus
  response.locals.VaccineMethod = VaccineMethod

  next()
}
