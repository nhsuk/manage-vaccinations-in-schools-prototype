import { Component } from 'nhsuk-frontend'

/**
 * Sticky component
 */
export class Sticky extends Component {
  /**
   * @param {HTMLElement | null} $root - HTML element to use for component
   */
  constructor($root) {
    super($root)

    this.stickyElement = $root
    this.stickyElementStyle = null
    this.stickyElementTop = 0

    this.detailsElement = $root.closest('details')

    this.determineStickyState = this.determineStickyState.bind(this)
    this.throttledStickyState = this.throttle(this.determineStickyState, 100)

    this.stickyElementStyle = window.getComputedStyle($root)
    this.stickyElementTop = parseInt(this.stickyElementStyle.top, 10)

    window.addEventListener('scroll', this.throttledStickyState)

    this.determineStickyState()

    if (this.detailsElement) {
      this.detailsElement.addEventListener(
        'toggle',
        this.handleDetailsToggle.bind(this)
      )
    }
  }

  /**
   * Name for the component used when initialising using data-module attributes
   */
  static moduleName = 'app-sticky'

  /**
   * Determine sticky state
   */
  determineStickyState() {
    const currentTop = this.stickyElement.getBoundingClientRect().top

    this.stickyElement.dataset.stuck = String(
      currentTop <= this.stickyElementTop
    )
  }

  /**
   * Handle scroll position for expandable details elements
   */
  handleDetailsToggle() {
    if (this.detailsElement.open) {
      // Details is open - store current state
      this.scrollPositionBeforeClose = window.scrollY
      this.contentHeightBeforeClose = this.detailsElement.scrollHeight
    } else {
      // Details is closed - calculate and apply scroll adjustment
      const currentScrollY = window.scrollY
      const newContentHeight = this.detailsElement.scrollHeight
      const heightDifference = this.contentHeightBeforeClose - newContentHeight

      const elementTop =
        this.stickyElement.getBoundingClientRect().top + window.scrollY

      // If we’re scrolled past where the content used to be, adjust scroll
      if (currentScrollY > elementTop && heightDifference > 0) {
        const newScrollPosition = Math.max(
          elementTop - this.stickyElementTop,
          currentScrollY - heightDifference
        )

        window.scrollTo({
          top: newScrollPosition,
          behavior: 'smooth'
        })
      }
    }
  }

  throttle(callback, limit) {
    let inThrottle
    return function () {
      const args = arguments
      const context = this
      if (!inThrottle) {
        callback.apply(context, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }
}
