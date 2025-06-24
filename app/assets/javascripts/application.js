import { PasswordInput, createAll } from 'govuk-frontend'
import {
  initButtons,
  initCheckboxes,
  initDetails,
  initErrorSummary,
  initHeader,
  initRadios,
  initSkipLinks
} from 'nhsuk-frontend'

import { AddAnotherComponent } from './custom-elements/add-another.js'
import { AutoSubmitComponent } from './custom-elements/auto-submit.js'
import { AutocompleteComponent } from './custom-elements/autocomplete.js'
import { IsStickyComponent } from './custom-elements/is-sticky.js'

// Create GOV.UK Frontend component instances
createAll(PasswordInput)

// Register custom elements
customElements.define('add-another', AddAnotherComponent)
customElements.define('auto-complete', AutocompleteComponent)
customElements.define('auto-submit', AutoSubmitComponent)
customElements.define('is-sticky', IsStickyComponent)

// Initiate scripts on page load
document.addEventListener('DOMContentLoaded', () => {
  initButtons()
  initCheckboxes()
  initDetails()
  initErrorSummary()
  initHeader()
  initRadios()
  initSkipLinks()
})
