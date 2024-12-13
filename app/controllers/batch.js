import { Batch } from '../models/batch.js'

export const batchController = {
  show(request, response) {
    const { form } = request.params

    response.render('batch/form', { form })
  },

  create(request, response) {
    const { gtin } = request.params
    const { data } = request.session
    const { __ } = response.locals

    const batch = new Batch({
      ...request.body.batch,
      vaccine_gtin: gtin
    })

    request.flash('success', __(`batch.success.create`, { batch }))

    batch.create(batch, data)

    response.redirect('/vaccines')
  },

  read(request, response, next) {
    const { id } = request.params
    const { data } = request.session

    response.locals.batch = Batch.read(id, data)
    response.locals.paths = {
      back: `/vaccines`,
      next: `/vaccines`
    }

    next()
  },

  update(request, response) {
    const { data } = request.session
    const { __, batch, paths } = response.locals

    request.flash('success', __(`batch.success.update`, { batch }))

    batch.update(request.body.batch, data)

    // Clean up session data
    delete data.batch

    response.redirect(paths.next)
  },

  action(type) {
    return (request, response) => {
      response.render('batch/action', { type })
    }
  },

  archive(request, response) {
    const { id } = request.params
    const { data } = request.session
    const { __, batch } = response.locals

    request.flash('success', __(`batch.success.archive`, { batch }))

    batch.archive(data)

    // Remove from default batches
    if (data.token?.batch) {
      for (const [session_id, gtins] of Object.entries(data.token.batch)) {
        for (const [gtin, batches] of Object.entries(gtins)) {
          if (batches.includes(batch.id)) {
            data.token.batch[session_id][gtin] = data.token.batch[session_id][
              gtin
            ].filter((batch) => batch !== id)
          }
        }
      }
    }

    response.redirect('/vaccines')
  }
}
