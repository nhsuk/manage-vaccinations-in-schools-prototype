const { join } = require('node:path')
const { format: urlFormat } = require('node:url')

// External dependencies
const express = require('express')
const nunjucks = require('nunjucks')

// Local dependencies
const routes = require('./app/routes')
const filters = require('./app/filters')
const sessionDataDefaults = require('./app/data')

const NHSPrototypeKit = require('nhsuk-prototype-kit')

// Set configuration variables
const port = parseInt(process.env.PORT, 10) || 2000

// Initialise applications
const app = express()

// Nunjucks configuration for application
const appViews = [
  join(__dirname, 'app/views/'),
  join(__dirname, 'node_modules/nhsuk-frontend/dist/nhsuk/components'),
  join(__dirname, 'node_modules/nhsuk-frontend/dist/nhsuk/macros'),
  join(__dirname, 'node_modules/nhsuk-frontend/dist/nhsuk'),
  join(__dirname, 'node_modules/nhsuk-frontend/dist')
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
