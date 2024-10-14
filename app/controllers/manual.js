import fs from 'node:fs'
import path from 'node:path'
import nunjucks from 'nunjucks'

export const manualController = {
  read(request, response, next) {
    const view = request.params.view || 'index'
    const { __ } = response.locals

    const filePath = path.join(
      import.meta.dirname,
      '../views/manual',
      `${view}.md`
    )

    let content
    try {
      // Read markdown file
      content = fs.readFileSync(filePath, 'utf8')

      // Parse any Nunjucks templating
      response.locals.content = nunjucks.renderString(content, {
        ...response.locals,
        ...request.app.locals
      })

      response.locals.navigationItems = [
        {
          text: __('manual.index.label'),
          href: '/manual',
          current: view === 'index'
        },
        {
          text: __('manual.accounts.label'),
          href: '/manual/accounts',
          current: view.includes('accounts')
        },
        {
          text: __('manual.consent.label'),
          href: '/manual/consent',
          current: view.includes('consent')
        },
        {
          text: __('manual.capture.label'),
          href: '/manual/capture',
          current: view.includes('capture')
        }
      ]

      response.locals.view = view

      next()
    } catch (error) {
      response.status(404).render('404')
    }
  },

  show(request, response) {
    response.render(`manual/show`)
  }
}
