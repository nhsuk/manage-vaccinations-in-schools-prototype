/**
 * @class AddressPresenter
 * @property {string} [addressLine1] - Address line 1
 * @property {string} [addressLine2] - Address line 2
 * @property {string} [addressLevel1] - Address level 1
 * @property {string} [postalCode] - Postcode
 */
export class AddressPresenter {
  constructor(options) {
    this.addressLine1 = options?.addressLine1
    this.addressLine2 = options?.addressLine2
    this.addressLevel1 = options?.addressLevel1
    this.postalCode = options?.postalCode
  }

  /**
   * Break address parts using a line break
   *
   * @returns {string} Address split by line breaks
   */
  get multiline() {
    return Object.values(this)
      .filter((string) => string)
      .join('<br>')
  }

  /**
   * Break address parts using a comma
   *
   * @returns {string} Address split by commas
   */
  get singleline() {
    return Object.values(this)
      .filter((string) => string)
      .join(', ')
  }
}
