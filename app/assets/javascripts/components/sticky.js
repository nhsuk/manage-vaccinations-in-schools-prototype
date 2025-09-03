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

    this.determineStickyState = this.determineStickyState.bind(this)
    this.throttledStickyState = this.throttle(this.determineStickyState, 100)

    this.stickyElementStyle = window.getComputedStyle($root)
    this.stickyElementTop = parseInt(this.stickyElementStyle.top, 10)

    window.addEventListener('scroll', this.throttledStickyState)

    this.determineStickyState()
  }

  /**
   * Name for the component used when initialising using data-module attributes
   */
  static moduleName = 'app-sticky'

  determineStickyState() {
    const currentTop = this.stickyElement.getBoundingClientRect().top

    this.stickyElement.dataset.stuck = String(
      currentTop <= this.stickyElementTop
    )
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
