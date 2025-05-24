import accessibleAutocomplete from 'accessible-autocomplete'

export const AutocompleteComponent = class extends HTMLElement {
  connectedCallback() {
    this.$selectElement = this.querySelector('select')
    this.name = this.$selectElement.name
    this.value = this.$selectElement.value
    this.params = this.$selectElement.dataset

    this.enhanceSelectElement()
  }

  /**
   * Enhance select element
   */
  enhanceSelectElement() {
    const selectOptions = Array.from(this.$selectElement.options)
    const options = selectOptions.map((option) => this.enhanceOption(option))

    accessibleAutocomplete.enhanceSelectElement({
      selectElement: this.$selectElement,
      autoselect: this.params.autoselect === 'true',
      name: this.name,
      cssNamespace: 'app-autocomplete',
      displayMenu: this.params.displayMenu === 'true',
      inputClasses: 'nhsuk-input',
      minLength: this.params.minLength ? parseInt(this.params.minLength) : 0,
      showAllValues: false,
      showNoOptionsFound: true,
      templates: {
        suggestion: (value) => this.suggestion(value, options)
      },
      onConfirm: (value) => {
        const selectedOption = [].filter.call(
          selectOptions,
          (option) => option.value === value
        )[0]

        if (selectedOption) {
          selectedOption.selected = true
        }
      }
    })
  }

  enhanceOption(option) {
    return {
      name: option.label,
      value: option.value,
      append: option.getAttribute('data-append'),
      hint: option.getAttribute('data-hint')
    }
  }

  suggestion(value, options) {
    const option = options.find(({ name }) => name === value)
    if (option) {
      const html = option.append ? `${value} – ${option.append}` : value
      return option.hint
        ? `${html}<br><span class="app-autocomplete__option-hint">${option.hint}</span>`
        : html
    }
    return 'No results found'
  }
}
