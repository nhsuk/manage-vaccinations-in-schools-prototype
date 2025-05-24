import { initAll as GOVUKFrontend } from 'govuk-frontend'
import '@colinaut/action-table'

import Autocomplete from './autocomplete.js'
import { AddAnotherComponent } from './custom-elements/add-another.js'
import { AutoSubmitComponent } from './custom-elements/auto-submit.js'
import { IsStickyComponent } from './custom-elements/is-sticky.js'

// Register custom elements
customElements.define('auto-submit', AutoSubmitComponent)
customElements.define('add-another', AddAnotherComponent)
customElements.define('is-sticky', IsStickyComponent)

// Initiate autocompletes
const $autocompletes = document.querySelectorAll('[data-module="autocomplete"]')
$autocompletes.forEach(($autocomplete) => {
  new Autocomplete($autocomplete).init()
})

// Initiate scripts on page load
document.addEventListener('DOMContentLoaded', () => {
  GOVUKFrontend()
})
