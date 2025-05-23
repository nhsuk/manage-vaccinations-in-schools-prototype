import { PasswordInput, createAll } from 'govuk-frontend'
import initButton from 'nhsuk-frontend/packages/components/button/button.js'
import initCheckboxes from 'nhsuk-frontend/packages/components/checkboxes/checkboxes.js'
import initErrorSummary from 'nhsuk-frontend/packages/components/error-summary/error-summary.js'
import initRadios from 'nhsuk-frontend/packages/components/radios/radios.js'
import initSkipLink from 'nhsuk-frontend/packages/components/skip-link/skip-link.js'

// Autocomplete
import { initAll as initAutocomplete } from './autocomplete/autocomplete.js'

// Create all instances of a password input component
createAll(PasswordInput)

// Initialise components
document.addEventListener('DOMContentLoaded', () => {
  initAutocomplete()
  initButton()
  initCheckboxes()
  initErrorSummary()
  initRadios()
  initSkipLink()
})
