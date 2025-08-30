import { PasswordInput, createAll } from 'govuk-frontend'
import {
  initButtons,
  initCheckboxes,
  initErrorSummary,
  initHeader,
  initRadios,
  initSkipLinks
} from 'nhsuk-frontend'

import { AddAnotherComponent } from './custom-elements/add-another.js'
import { AutoSubmitComponent } from './custom-elements/auto-submit.js'
import { AutocompleteComponent } from './custom-elements/autocomplete.js'
import { StickyComponent } from './custom-elements/sticky.js'

// Create GOV.UK Frontend component instances
createAll(PasswordInput)

// Register custom elements
customElements.define('app-add-another', AddAnotherComponent)
customElements.define('app-autocomplete', AutocompleteComponent)
customElements.define('app-auto-submit', AutoSubmitComponent)
customElements.define('app-sticky', StickyComponent)

// Initiate scripts on page load
document.addEventListener('DOMContentLoaded', () => {
  initButtons()
  initCheckboxes()
  initErrorSummary()
  initHeader()
  initRadios()
  initSkipLinks()
})
