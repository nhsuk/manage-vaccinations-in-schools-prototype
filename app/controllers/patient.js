import { Campaign, CampaignType } from '../models/campaign.js'
import {
  CaptureOutcome,
  ConsentOutcome,
  Patient,
  PatientOutcome,
  TriageOutcome
} from '../models/patient.js'
import { Record } from '../models/record.js'
import { Reply } from '../models/reply.js'
import { Session, SessionStatus } from '../models/session.js'
import { Vaccination } from '../models/vaccination.js'

export const patientController = {
  read(request, response, next) {
    const { id, nhsn, uid } = request.params
    const { data } = request.session

    const campaign_uid = uid || id.split('-')[0]
    const campaign = data.campaigns[campaign_uid]
    const patient = Object.values(data.patients).find(
      (patient) => new Patient(patient).nhsn === nhsn
    )
    const replies = Object.values(patient.replies)
    const vaccinations = Object.keys(patient.vaccinations)

    response.locals.campaign = new Campaign(campaign)
    response.locals.patient = new Patient(patient)
    response.locals.replies = replies.map((reply) => new Reply(reply))
    response.locals.vaccinations = vaccinations.map(
      (uuid) => new Vaccination(data.vaccinations[uuid])
    )

    // Patient in session
    if (id) {
      response.locals.session = new Session(data.sessions[id])
    }

    next()
  },

  show(request, response) {
    const { activity } = request.app.locals
    const { campaign, patient, session, preScreenQuestions } = response.locals

    const options = {
      editGillick:
        patient.consent?.value !== ConsentOutcome.Given &&
        patient.outcome?.value !== PatientOutcome.Vaccinated,
      showGillick:
        campaign.type !== CampaignType.FLU &&
        session?.status === SessionStatus.Active &&
        patient.consent?.value !== ConsentOutcome.Given,
      editReplies:
        patient.consent?.value !== ConsentOutcome.Given &&
        patient.outcome?.value !== PatientOutcome.Vaccinated,
      editTriage:
        patient.triage?.value === TriageOutcome.Completed &&
        patient.outcome?.value !== PatientOutcome.Vaccinated,
      showTriage:
        patient.consentHealthAnswers &&
        patient.triage?.value === TriageOutcome.Needed &&
        patient.outcome?.value === PatientOutcome.NoOutcomeYet,
      editRegistration:
        patient.consent?.value === ConsentOutcome.Given &&
        patient.triage?.value !== TriageOutcome.Needed &&
        patient.outcome?.value !== PatientOutcome.Vaccinated,
      showPreScreen:
        patient.capture?.value === CaptureOutcome.Vaccinate &&
        patient.outcome?.value !== PatientOutcome.Vaccinated &&
        patient.outcome?.value !== PatientOutcome.CouldNotVaccinate
    }

    response.render('patient/show', {
      activity:
        activity || session?.status !== SessionStatus.Active
          ? 'consent'
          : 'capture',
      options,
      preScreenQuestions
    })
  },

  events(request, response) {
    const { activity } = request.app.locals
    const { session } = response.locals

    response.render('patient/events', {
      activity:
        activity || session?.status !== SessionStatus.Active
          ? 'consent'
          : 'capture'
    })
  },

  readForm(request, response, next) {
    const { patient } = response.locals

    response.locals.paths = {
      back: patient.uri,
      next: patient.uri
    }

    next()
  },

  showForm(request, response) {
    const { form, view } = request.params

    response.render(`patient/form/${view}`, { form })
  },

  updateForm(request, response) {
    const { data } = request.session
    const { uid, uuid } = request.params
    const { __, patient } = response.locals

    const updatedRecord = new Record(
      Object.assign(
        patient.record, // Previous record values
        request.body.patient.record // New record values
      )
    )

    const updatedPatient = new Patient(
      Object.assign(patient, { record: updatedRecord })
    )

    data.patients[updatedPatient.uuid] = updatedPatient

    request.flash('success', __('patient.success.update'))

    let redirect
    if (uid && uuid) {
      // Return to campaign vaccinations list
      redirect = `/campaigns/${uid}/vaccinations/${uuid}`
    } else {
      redirect = updatedPatient.uri
    }

    response.redirect(redirect)
  }
}
