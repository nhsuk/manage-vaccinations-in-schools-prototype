import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Header,
  NotificationBanner,
  Radios,
  SkipLink
} from 'nhsuk-frontend'

import { AddAnotherComponent } from './custom-elements/add-another.js'
import { AutoSubmitComponent } from './custom-elements/auto-submit.js'
import { AutocompleteComponent } from './custom-elements/autocomplete.js'
import { StickyComponent } from './custom-elements/sticky.js'

// Register custom elements
customElements.define('app-add-another', AddAnotherComponent)
customElements.define('app-autocomplete', AutocompleteComponent)
customElements.define('app-auto-submit', AutoSubmitComponent)
customElements.define('app-sticky', StickyComponent)

// Initiate NHS.UK frontend components on page load
document.addEventListener('DOMContentLoaded', () => {
  createAll(Button, { preventDoubleClick: true })
  createAll(Checkboxes)
  createAll(ErrorSummary)
  createAll(Header)
  createAll(Radios)
  createAll(NotificationBanner)
  createAll(SkipLink)
})
