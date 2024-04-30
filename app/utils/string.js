export function stringToBoolean(value) {
  return typeof value === 'string' ? value === 'true' : value
}
