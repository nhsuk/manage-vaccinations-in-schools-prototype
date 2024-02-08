import { Registrar } from '../models/user.js'
import {
  HealthQuestion,
  PreScreenQuestion,
  VaccineMethod
} from '../models/vaccine.js'

export const enumeration = (request, response, next) => {
  response.locals.HealthQuestion = HealthQuestion
  response.locals.PreScreenQuestion = PreScreenQuestion
  response.locals.Registrar = Registrar
  response.locals.VaccineMethod = VaccineMethod

  next()
}
