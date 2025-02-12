/**
 * Generate results page
 *
 * @param {Array} items - Items to paginate
 * @param {object} query - Query parameters
 * @param {number} [limit] - Limit
 * @returns {object} Results
 */
export function getResults(items, query, limit = 50) {
  const page = parseInt(query.page) || 1
  limit = parseInt(query.limit) || limit

  const count = items.length
  const skip = (page - 1) * limit
  const resultsFrom = (page - 1) * limit + 1
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
 *
 * @param {Array} items - Items to paginate
 * @param {object} query - Query parameters
 * @param {number} [limit] - Limit
 * @returns {object} Pagination
 */
export function getPagination(items, query, limit = 50) {
  const page = parseInt(query.page) || 1
  limit = parseInt(query.limit) || limit

  const count = items.length
  const totalPages = Math.ceil(count / limit)
  const nextPage = page < totalPages ? page + 1 : false
  const prevPage = page > 0 ? page - 1 : false

  const pageItems = [...Array(totalPages).keys()].map((item) => ({
    current: item + 1 === page,
    href: `?${new URLSearchParams({ ...query, page: item + 1, limit })}`,
    number: item + 1
  }))

  return {
    items: pageItems.length > 1 ? pageItems : false,
    current: page,
    next: nextPage && {
      href: `?${new URLSearchParams({ ...query, page: nextPage, limit })}`
    },
    previous: prevPage && {
      href: `?${new URLSearchParams({ ...query, page: prevPage, limit })}`
    }
  }
}
