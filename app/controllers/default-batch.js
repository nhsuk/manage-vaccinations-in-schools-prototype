import { Batch } from '../models/batch.js'
import { DefaultBatch } from '../models/default-batch.js'
import { Session } from '../models/session.js'
import { VaccinePresenter } from '../presenters/vaccine.js'

export const defaultBatchController = {
  read(request, response, next) {
    const { data } = request.session
    const { session_id, vaccine_snomed } = request.params

    response.locals.batchItems = Batch.findAll(data)
      .filter((batch) => batch.vaccine_snomed === vaccine_snomed)
      .filter((batch) => !batch.archivedAt)

    response.locals.defaultBatch = DefaultBatch.findAll(data)
      .filter((batch) => batch.vaccine_snomed === vaccine_snomed)
      .find((batch) => batch.session_id === session_id)

    response.locals.session = Session.findOne(session_id, data)

    response.locals.vaccine = VaccinePresenter.forOne(vaccine_snomed, data)

    response.locals.paths = {
      back: `/sessions/${session_id}/record`,
      next: `/sessions/${session_id}/record`
    }

    next()
  },

  show(request, response) {
    response.render('default-batch/edit')
  },

  update(request, response) {
    const { data } = request.session
    const { __, defaultBatch, session, paths } = response.locals

    if (defaultBatch) {
      DefaultBatch.delete(defaultBatch.id, data)
    }

    // Add default batch to session
    DefaultBatch.addToSession(request.body.defaultBatch.id, session.id, data)

    request.flash('success', __(`defaultBatch.edit.success`))

    response.redirect(paths.next)
  }
}
