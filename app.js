// External dependencies
import express from 'express'
import nunjucks from 'nunjucks'

import { join } from 'node:path'

import NHSPrototypeKit from 'nhsuk-prototype-kit'


// Local dependencies
import routes from './app/routes.js'
import filters from './app/filters.js'
import sessionDataDefaults from './app/data.js'

// Set configuration variables
const port = parseInt(process.env.PORT, 10) || 2000

// Initialise applications
const app = express()

// Nunjucks configuration for application
const appViews = [
  join(import.meta.dirname, 'app/views/'),
  join(import.meta.dirname, 'node_modules/nhsuk-frontend/dist/nhsuk/components'),
  join(import.meta.dirname, 'node_modules/nhsuk-frontend/dist/nhsuk/macros'),
  join(import.meta.dirname, 'node_modules/nhsuk-frontend/dist/nhsuk'),
  join(import.meta.dirname, 'node_modules/nhsuk-frontend/dist'),
  join(import.meta.dirname, 'node_modules/nhsuk-decorated-components')
]

const nunjucksConfig = {
  autoescape: true,
  noCache: true
}

nunjucksConfig.express = app

let nunjucksAppEnv = nunjucks.configure(appViews, nunjucksConfig)

const prototype = NHSPrototypeKit.init({
  serviceName: 'Manage vaccinations in schools',
  express: app,
  nunjucks: nunjucksAppEnv,
  routes: routes
})

prototype.start()
