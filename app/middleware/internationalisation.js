import path from 'node:path'
import { fileURLToPath } from 'node:url'

import i18n from 'i18n'

export const internationalisation = (request, response, next) => {
  i18n.configure({
    cookie: 'locale',
    defaultLocale: 'en',
    indent: '  ',
    objectNotation: true,
    directory: fileURLToPath(path.join(import.meta.url, '../../locales'))
  })

  i18n.init(request, response)

  next()
}
