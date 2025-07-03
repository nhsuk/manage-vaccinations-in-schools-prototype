import process from 'node:process'
import { styleText } from 'node:util'

import responseTime from 'response-time'

const formatTime = (timeMs) => {
  if (timeMs >= 10000) {
    // 10+ seconds
    return styleText('red', `${(timeMs / 1000).toFixed(2)}s`)
  } else if (timeMs >= 1000) {
    // 1+ seconds
    return styleText('yellow', `${(timeMs / 1000).toFixed(2)}s`)
  } else if (timeMs >= 500) {
    // 0.5+ seconds
    return styleText('magenta', `${timeMs.toFixed(2)}ms`)
  }

  return styleText('green', `${timeMs.toFixed(2)}ms`)
}

export const performance = responseTime((request, response, time) => {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  // @ts-ignore
  const { method, originalUrl } = request
  const { statusCode } = response
  const timeMs = formatTime(time)

  console.log(`${method} ${originalUrl} - ${statusCode} - ${timeMs}`)
})
