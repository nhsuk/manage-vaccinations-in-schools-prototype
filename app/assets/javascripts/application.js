// Sass entry point for rollup.js
import '../stylesheets/application.scss'

// Import GOV.UK Frontend
import { initAll as GOVUKFrontend } from 'govuk-frontend'

// Import edge detection from GOV.UK Prototype Rig
import { Edge } from '@x-govuk/govuk-prototype-components'

// Initiate edge detection
const $edges = document.querySelectorAll('[data-module="edge"]')
$edges.forEach(($edge) => {
  new Edge($edge).init()
})

// Initiate autocompletes
import Autocomplete from './autocomplete.js'
const $autocompletes = document.querySelectorAll('[data-module="autocomplete"]')
$autocompletes.forEach(($autocomplete) => {
  new Autocomplete($autocomplete).init()
})

// Import action-table custom element
import '@colinaut/action-table'

// Initiate scripts on page load
document.addEventListener('DOMContentLoaded', () => {
  GOVUKFrontend()
})
