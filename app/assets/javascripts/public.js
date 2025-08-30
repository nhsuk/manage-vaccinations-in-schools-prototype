import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Radios,
  SkipLink
} from 'nhsuk-frontend'

import { AutocompleteComponent } from './custom-elements/autocomplete.js'

// Register custom elements
customElements.define('app-autocomplete', AutocompleteComponent)

// Initiate NHS.UK frontend components on page load
document.addEventListener('DOMContentLoaded', () => {
  createAll(Button, { preventDoubleClick: true })
  createAll(Checkboxes)
  createAll(ErrorSummary)
  createAll(Radios)
  createAll(SkipLink)
})
