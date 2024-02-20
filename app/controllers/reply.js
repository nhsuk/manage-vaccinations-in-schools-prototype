import { Reply } from '../models/reply.js'

export const replyController = {
  read(request, response, next) {
    const { uuid } = request.params
    const { patient } = response.locals

    request.app.locals.reply = new Reply(patient.replies[uuid])

    next()
  },

  redirect(request, response) {
    response.redirect(`/patients/${request.params.nhsn}`)
  },

  show(request, response) {
    response.render('reply/show')
  }
}
