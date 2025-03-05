export const AutoSubmitComponent = class extends HTMLElement {
  constructor() {
    super()
    this.timeout = 300
    this.submitTimeout = null
    this.boundUpdateResults = this.updateResults.bind(this)
  }

  connectedCallback() {
    this.form = this.closest('form')

    const submitButtons = this.querySelectorAll(`[type="submit"]`)
    this.lastSubmitButton = submitButtons.length
      ? [...submitButtons].at(-1)
      : null

    if (this.lastSubmitButton) {
      this.lastSubmitButton.setAttribute('hidden', '')
    }

    this.addEventListener('change', this.boundUpdateResults)
  }

  disconnectedCallback() {
    if (this.submitTimeout) {
      clearTimeout(this.submitTimeout)
    }

    if (this.lastSubmitButton) {
      this.lastSubmitButton.removeAttribute('hidden')
    }

    this.removeEventListener('change', this.boundUpdateResults)
  }

  updateResults(event) {
    if (event.target.type === 'radio' || event.target.type === 'checkbox') {
      if (this.submitTimeout) {
        clearTimeout(this.submitTimeout)
      }

      this.submitTimeout = setTimeout(() => {
        const customEvent = new CustomEvent('filters-changed', {
          bubbles: true,
          detail: {
            changedElement: event.target,
            formData: new FormData(this.form)
          }
        })
        this.dispatchEvent(customEvent)

        this.form.submit()
      }, this.timeout)
    }
  }
}
