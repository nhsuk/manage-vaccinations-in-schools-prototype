// External dependencies
import express from 'express'
import nunjucks from 'nunjucks'
import sessionInDatabase from 'connect-pg-simple'
import session from 'express-session'
import { Pool } from 'pg'

import { join } from 'node:path'

import NHSPrototypeKit from 'nhsuk-prototype-kit'

const serviceName = 'Manage vaccinations in schools'

// Local dependencies
import routes from './app/routes.js'
import filters from './app/filters.js'
import sessionDataDefaults from './app/data.js'

// Set configuration variables
const port = parseInt(process.env.PORT, 10) || 2000

// Initialise applications
const app = express()


const sessionName = `manage-vaccinations-in-schools-prototype`
const sessionOptions = {
  secret: sessionName,
  cookie: {
    maxAge: 1000 * 60 * 60 * 4, // 4 hours
    secure: process.env.NODE_ENV === 'production'
  }
}

const PgSession = sessionInDatabase(session)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false
        }
      : false
})

app.use(
  session(
    Object.assign(sessionOptions, {
      store: new PgSession({ pool }),
      resave: false,
      saveUninitialized: false
    })
  )
)

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

// Use public folder for static assets
app.use(express.static(join(import.meta.dirname, 'public')))

// Use assets from NHS frontend
app.use(
  '/nhsuk-frontend',
  express.static(join(import.meta.dirname, 'node_modules/nhsuk-frontend/dist/nhsuk'))
)

const prototype = NHSPrototypeKit.init({
  serviceName: serviceName,
  express: app,
  nunjucks: nunjucksAppEnv,
  routes: routes,
  buildOptions: {
    entryPoints: ['app/assets/stylesheets/application.scss', 'app/assets/stylesheets/prototype.scss', 'app/assets/stylesheets/public.scss']
  }
})

prototype.start()
