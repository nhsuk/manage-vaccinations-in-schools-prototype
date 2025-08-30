import {
  initButtons,
  initCheckboxes,
  initErrorSummary,
  initRadios,
  initSkipLinks
} from 'nhsuk-frontend'

import { AutocompleteComponent } from './custom-elements/autocomplete.js'

// Register custom elements
customElements.define('app-autocomplete', AutocompleteComponent)

// Initialise components
document.addEventListener('DOMContentLoaded', () => {
  initButtons()
  initCheckboxes()
  initErrorSummary()
  initRadios()
  initSkipLinks()
})
