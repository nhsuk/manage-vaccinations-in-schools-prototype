import { initAll as GOVUKFrontend } from 'govuk-frontend'
import '@colinaut/action-table'

import { AddAnotherComponent } from './custom-elements/add-another.js'
import { AutoSubmitComponent } from './custom-elements/auto-submit.js'
import { AutocompleteComponent } from './custom-elements/autocomplete.js'
import { IsStickyComponent } from './custom-elements/is-sticky.js'

// Register custom elements
customElements.define('add-another', AddAnotherComponent)
customElements.define('auto-complete', AutocompleteComponent)
customElements.define('auto-submit', AutoSubmitComponent)
customElements.define('is-sticky', IsStickyComponent)

// Initiate scripts on page load
document.addEventListener('DOMContentLoaded', () => {
  GOVUKFrontend()
})
