import sessionInDatabase from 'connect-pg-simple'
import express from 'express'
import session from 'express-session'
import NHSPrototypeKit from 'nhsuk-prototype-kit'
import { Pool } from 'pg'

import sessionDataDefaults from './app/data.js'
import filters from './app/filters.js'
import globals from './app/globals.js'
import routes from './app/routes.js'

const { DATABASE_URL, NODE_ENV } = process.env

const app = express()

app.use(
  session({
    cookie: {
      maxAge: 1000 * 60 * 60 * 4, // 4 hours
      secure: process.env.NODE_ENV === 'production'
    },
    resave: false,
    saveUninitialized: false,
    secret: 'manage-vaccinations-in-schools-prototype',
    store: new (sessionInDatabase(session))({
      pool: new Pool({
        connectionString: DATABASE_URL,
        ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      })
    })
  })
)

const prototype = await NHSPrototypeKit.init({
  serviceName: 'Manage vaccinations in schools',
  app,
  buildOptions: {
    entryPoints: [
      'app/assets/stylesheets/*.scss',
      'app/assets/javascripts/*.js'
    ]
  },
  viewsPath: ['app/views', 'node_modules/nhsuk-decorated-components'],
  routes,
  filters,
  sessionDataDefaults
})

for (const [key, value] of Object.entries(globals())) {
  prototype.nunjucks?.addGlobal(key, value)
}

prototype.start(2000)
