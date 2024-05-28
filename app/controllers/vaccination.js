import { wizard } from 'nhsuk-prototype-rig'
import { Batch } from '../models/batch.js'
import { Patient } from '../models/patient.js'
import { User } from '../models/user.js'
import {
  Vaccination,
  VaccinationMethod,
  VaccinationOutcome,
  VaccinationSite
} from '../models/vaccination.js'

export const vaccinationController = {
  read(request, response, next) {
    const { uuid } = request.params
    const { patient } = response.locals

    request.app.locals.vaccination = new Vaccination(patient.vaccinations[uuid])

    next()
  },

  redirect(request, response) {
    const { id, nhsn } = request.params

    response.redirect(`/sessions/${id}/${nhsn}`)
  },

  edit(request, response) {
    const { vaccination } = request.app.locals
    const { data } = request.session

    request.app.locals.vaccination = new Vaccination({
      ...vaccination, // Previous values
      ...data.wizard // Wizard values,
    })

    response.render('vaccination/edit')
  },

  new(request, response) {
    const { data } = request.session
    const { patient, session } = response.locals

    request.app.locals.start = data.preScreen.outcome

    delete data.preScreen
    delete data.wizard
    delete data.vaccination

    const vaccination = new Vaccination({
      location: session.location.name,
      patient_nhsn: patient.nhsn,
      session_id: session.id,
      ...(data.token && { created_user_uuid: data.token.uuid })
    })

    data.wizard = vaccination

    response.redirect(`${vaccination.uri}/new/${request.app.locals.start}`)
  },

  update(request, response) {
    const { vaccination } = request.app.locals
    const { form, id, nhsn } = request.params
    const { data } = request.session
    const { __, campaign, patient } = response.locals

    data.patients[nhsn] = new Patient(patient)

    // Capture vaccination
    data.patients[nhsn].capture = new Vaccination({
      ...vaccination, // Previous values
      ...data.wizard, // Wizard values (new flow)
      ...request.body.vaccination, // New values (edit flow)
      ...(vaccination.batch_id && { vaccine_gtin: campaign.vaccine.gtin }),
      created_user_uuid: data.vaccination.created_user_uuid || data.token?.uuid
    })

    delete data.wizard

    const action = form === 'edit' ? 'update' : 'create'
    request.flash('success', __(`vaccination.success.${action}`))

    response.redirect(`/sessions/${id}/${nhsn}`)
  },

  readForm(request, response, next) {
    const { start, campaign, vaccination } = request.app.locals
    const { form, id, uuid } = request.params
    const { data } = request.session
    const { __ } = response.locals

    request.app.locals.vaccination = new Vaccination({
      ...(form === 'edit' && vaccination), // Previous values
      ...data.wizard // Wizard values,
    })

    const journey = {
      [`/`]: {},
      ...(start === 'administer'
        ? {
            [`/${uuid}/${form}/administer`]: {
              [`/${uuid}/${form}/check-answers`]: () => {
                return data.token?.batch?.[id]
              }
            },
            [`/${uuid}/${form}/batch-id`]: () => {
              return !data.token?.batch?.[id]
            },
            [`/${uuid}/${form}/check-answers`]: {}
          }
        : {
            [`/${uuid}/${form}/decline`]: {},
            [`/${uuid}/${form}/check-answers`]: {}
          }),
      [`/${uuid}`]: {}
    }

    response.locals.paths = {
      ...wizard(journey, request),
      ...(form === 'edit' && {
        back: `${vaccination.uri}/edit`,
        next: `${vaccination.uri}/edit`
      })
    }

    response.locals.batchItems = Object.values(data.batches)
      .map((batch) => new Batch(batch))
      .filter((batch) => batch.vaccine.type === campaign.type)

    response.locals.methodItems = Object.entries(VaccinationMethod)
      .filter(([, value]) => value !== VaccinationMethod.Nasal)
      .map(([key, value]) => ({
        text: VaccinationMethod[key],
        value
      }))

    response.locals.siteItems = Object.entries(VaccinationSite)
      .filter(([, value]) => value !== VaccinationSite.Nose)
      .map(([key, value]) => ({
        text: VaccinationSite[key],
        value
      }))

    response.locals.userItems = Object.entries(data.users)
      .map(([key, value]) => {
        const user = new User(value)

        return {
          text: user.fullNameWithRegistration,
          value: key
        }
      })
      .sort((a, b) => {
        const textA = a.text.toUpperCase()
        const textB = b.text.toUpperCase()
        if (textA < textB) return -1
        if (textA > textB) return 1
        return 0
      })

    response.locals.declineItems = Object.entries(VaccinationOutcome)
      .filter(
        ([, value]) =>
          value === VaccinationOutcome.Contraindications ||
          value === VaccinationOutcome.Refused ||
          value === VaccinationOutcome.Unwell
      )
      .map(([key, value]) => ({
        text: __(`vaccination.outcome.${key}`),
        value
      }))

    next()
  },

  showForm(request, response) {
    const { form, view } = request.params

    response.render(`vaccination/form/${view}`, { form })
  },

  updateForm(request, response) {
    const { vaccination } = request.app.locals
    const { id } = request.params
    const { data } = request.session
    const { campaign, paths } = response.locals

    // Add dose amount and vaccination outcome based on dosage answer
    if (request.body.vaccination.dosage) {
      vaccination.dose =
        request.body.vaccination.dosage === 'half'
          ? campaign.vaccine.dose / 2
          : campaign.vaccine.dose
      vaccination.outcome =
        request.body.vaccination.dosage === 'half'
          ? VaccinationOutcome.PartVaccinated
          : VaccinationOutcome.Vaccinated
    }

    // Use default batch, if set
    if (data.token?.batch?.[id]) {
      vaccination.batch_id = data.token.batch[id][0]
    }

    data.wizard = new Vaccination({
      ...vaccination, // Previous values
      ...request.body.vaccination // New value
    })

    response.redirect(paths.next || `${vaccination.uri}/new/check-answers`)
  }
}
