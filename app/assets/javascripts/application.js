import { PasswordInput, createAll } from 'govuk-frontend'
import initButton from 'nhsuk-frontend/packages/components/button/button.js'
import initCheckboxes from 'nhsuk-frontend/packages/components/checkboxes/checkboxes.js'
import initDetails from 'nhsuk-frontend/packages/components/details/details.js'
import initErrorSummary from 'nhsuk-frontend/packages/components/error-summary/error-summary.js'
import initHeader from 'nhsuk-frontend/packages/components/header/header.js'
import initRadios from 'nhsuk-frontend/packages/components/radios/radios.js'
import initSkipLink from 'nhsuk-frontend/packages/components/skip-link/skip-link.js'

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
  initButton()
  initCheckboxes()
  initDetails()
  initErrorSummary()
  initHeader()
  initRadios()
  initSkipLink()
})
