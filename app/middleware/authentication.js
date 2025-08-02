import { UserRole, VaccineMethod } from '../enums.js'
import { User } from '../models/user.js'

export const authentication = (request, response, next) => {
  const { data } = request.session

  const user = data.token ? new User(data.token) : {}

  // Vaccine method(s)
  if ([UserRole.Nurse, UserRole.NursePrescriber].includes(user.role)) {
    user.vaccineMethods = [VaccineMethod.Injection, VaccineMethod.Nasal]
  } else if (data?.token?.role === UserRole.HCA) {
    user.vaccineMethods = [VaccineMethod.Nasal]
  } else {
    user.vaccineMethods = []
  }

  // Instructions
  if ([UserRole.NursePrescriber, UserRole.Pharmacist].includes(user.role)) {
    user.canPrescribe = true
  }

  request.app.locals.account = user

  next()
}
