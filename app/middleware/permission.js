import { UserRole } from '../models/user.js'
import { VaccineMethod } from '../models/vaccine.js'

export const permission = (request, response, next) => {
  const { data } = request.session
  const permissions = {}

  if (data?.token?.role === UserRole.Nurse) {
    permissions.vaccineMethods = [VaccineMethod.Injection, VaccineMethod.Nasal]
  } else if (data?.token?.role === UserRole.HCA) {
    permissions.vaccineMethods = [VaccineMethod.Nasal]
  }

  request.app.locals.permissions = permissions

  next()
}
