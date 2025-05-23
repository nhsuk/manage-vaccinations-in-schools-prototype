import initButton from 'nhsuk-frontend/packages/components/button/button.js'
import initCheckboxes from 'nhsuk-frontend/packages/components/checkboxes/checkboxes.js'
import initErrorSummary from 'nhsuk-frontend/packages/components/error-summary/error-summary.js'
import initRadios from 'nhsuk-frontend/packages/components/radios/radios.js'
import initSkipLink from 'nhsuk-frontend/packages/components/skip-link/skip-link.js'

import { AutocompleteComponent } from './custom-elements/autocomplete.js'

// Register custom elements
customElements.define('auto-complete', AutocompleteComponent)

// Initialise components
document.addEventListener('DOMContentLoaded', () => {
  initButton()
  initCheckboxes()
  initErrorSummary()
  initRadios()
  initSkipLink()
})
