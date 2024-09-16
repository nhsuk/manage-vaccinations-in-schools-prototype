/**
 * Generate results page
 * @param {Array} items - Items to paginate
 * @param {number} currentPage - Current page
 * @param {number} limit - Limit of items per page
 * @returns {object} Results
 */
export function getResults(items, currentPage, limit) {
  const count = items.length
  const skip = (currentPage - 1) * limit
  const resultsFrom = (currentPage - 1) * limit + 1
  let resultsTo = resultsFrom - 1 + limit
  resultsTo = resultsTo > count ? count : resultsTo

  return {
    page: items.slice(skip, skip + limit),
    to: resultsTo,
    from: resultsFrom,
    count
  }
}

/**
 * Generate pagination items
 * @param {Array} items - Items to paginate
 * @param {number} currentPage - Current page
 * @param {number} limit - Limit of items per page
 * @returns {object} Pagination
 */
export function getPagination(items, currentPage, limit) {
  const count = items.length
  const totalPages = Math.ceil(count / limit)
  const nextPage = currentPage < totalPages ? currentPage + 1 : false
  const previousPage = currentPage > 0 ? currentPage - 1 : false
  const pageItems = [...Array(totalPages).keys()].map((item) => ({
    current: item + 1 === currentPage,
    href: `?${new URLSearchParams({ page: item + 1, limit })}`,
    number: item + 1
  }))

  return {
    items: pageItems.length > 1 ? pageItems : false,
    current: currentPage,
    next: nextPage
      ? {
          href: `?${new URLSearchParams({ page: nextPage, limit })}`
        }
      : false,
    previous: previousPage
      ? {
          href: `?${new URLSearchParams({ page: previousPage, limit })}`
        }
      : false
  }
}
