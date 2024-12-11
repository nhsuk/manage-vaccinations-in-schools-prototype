export const referrer = (request, response, next) => {
  if (request.session && request.query.referrer) {
    request.session.referrer = request.query.referrer
  }

  next()
}
