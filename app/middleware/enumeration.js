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
  response.locals.ConsentWindow = ConsentWindow
  response.locals.HealthQuestion = HealthQuestion
  response.locals.PreScreenQuestion = PreScreenQuestion
  response.locals.Registrar = Registrar
  response.locals.SessionFormat = SessionFormat
  response.locals.SessionTime = SessionTime
  response.locals.SessionStatus = SessionStatus
  response.locals.VaccineMethod = VaccineMethod

  next()
}
