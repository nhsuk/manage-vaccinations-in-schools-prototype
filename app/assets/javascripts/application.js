import { Edge } from '@x-govuk/govuk-prototype-components'
import { initAll as GOVUKFrontend } from 'govuk-frontend'
import '@colinaut/action-table'

import Autocomplete from './autocomplete.js'
import { AddAnotherComponent } from './custom-elements/add-another.js'

// Register custom elements
customElements.define('add-another', AddAnotherComponent)

// Initiate edge detection
const $edges = document.querySelectorAll('[data-module="edge"]')
$edges.forEach(($edge) => {
  new Edge($edge).init()
})

// Initiate autocompletes
const $autocompletes = document.querySelectorAll('[data-module="autocomplete"]')
$autocompletes.forEach(($autocomplete) => {
  new Autocomplete($autocomplete).init()
})

// Initiate scripts on page load
document.addEventListener('DOMContentLoaded', () => {
  GOVUKFrontend()
})
