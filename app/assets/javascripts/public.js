import {
  initButtons,
  initCheckboxes,
  initErrorSummary,
  initRadios,
  initSkipLinks
} from 'nhsuk-frontend'

import { AutocompleteComponent } from './custom-elements/autocomplete.js'

// Register custom elements
customElements.define('auto-complete', AutocompleteComponent)

// Initialise components
document.addEventListener('DOMContentLoaded', () => {
  initButtons()
  initCheckboxes()
  initErrorSummary()
  initRadios()
  initSkipLinks()
})
