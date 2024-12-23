import i18n from 'i18n'

import { en } from '../locales/en.js'

export const internationalisation = async (request, response, next) => {
  i18n.configure({
    cookie: 'locale',
    defaultLocale: 'en',
    objectNotation: true,
    // @ts-ignore
    staticCatalog: { en }
  })

  i18n.init(request, response)

  next()
}
