import { UserRole, VaccineMethod } from '../enums.js'

export const permission = (request, response, next) => {
  const { data } = request.session
  const permissions = {}

  if ([UserRole.Nurse, UserRole.NursePrescriber].includes(data?.token?.role)) {
    permissions.vaccineMethods = [VaccineMethod.Injection, VaccineMethod.Nasal]
  } else if (data?.token?.role === UserRole.HCA) {
    permissions.vaccineMethods = [VaccineMethod.Nasal]
  } else {
    permissions.vaccineMethods = []
  }
  if (
    [UserRole.NursePrescriber, UserRole.Pharmacist].includes(data?.token?.role)
  ) {
    permissions.canPrescribe = true
  }

  request.app.locals.permissions = permissions

  next()
}
