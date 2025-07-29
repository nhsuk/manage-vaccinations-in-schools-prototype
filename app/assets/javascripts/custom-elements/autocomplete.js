import accessibleAutocomplete from 'accessible-autocomplete'

export const AutocompleteComponent = class extends HTMLElement {
  connectedCallback() {
    this.$selectElement = this.querySelector('select')
    this.name = this.$selectElement.name
    this.options = Array.from(this.$selectElement.options)
    this.value = this.$selectElement.value

    this.enhanceSelectElement()
  }

  /**
   * Enhance select element
   */
  enhanceSelectElement() {
    accessibleAutocomplete.enhanceSelectElement({
      selectElement: this.$selectElement,
      cssNamespace: 'app-autocomplete',
      defaultValue: this.value || '',
      inputClasses: 'nhsuk-input',
      showNoOptionsFound: true,
      templates: {
        suggestion: (value) => this.suggestion(value, this.enhancedOptions)
      },
      onConfirm: (value) => {
        const selectedOption = this.selectedOption(value, this.options)

        if (selectedOption) {
          selectedOption.selected = true
        }
      }
    })
  }

  /**
   * Get enhanced information about each option
   *
   * @returns {object} Enhanced options
   */
  get enhancedOptions() {
    return this.options.map((option) => ({
      name: option.label,
      value: option.value,
      append: option.getAttribute('data-append'),
      hint: option.getAttribute('data-hint')
    }))
  }

  /**
   * Selected option
   *
   * @param {*} value - Current value
   * @param {Array} options - Available options
   * @returns {HTMLOptionElement} Selected option
   */
  selectedOption(value, options) {
    return [].filter.call(
      options,
      (option) => (option.textContent || option.innerText) === value
    )[0]
  }

  /**
   * HTML for suggestion
   *
   * @param {*} value - Current value
   * @param {Array} options - Available options
   * @returns {string} HTML for suggestion
   */
  suggestion(value, options) {
    const option = options.find(({ name }) => name === value)
    if (option) {
      const label = option.append ? `${value} – ${option.append}` : value
      return option.hint
        ? `${label}<br><span class="app-autocomplete__option-hint">${option.hint}</span>`
        : label
    }
    return 'No results found'
  }
}
