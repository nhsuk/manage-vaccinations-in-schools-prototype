export function kebabToPascalCase(string) {
  return string.replace(/(^\w|-\w)/g, (string) =>
    string.replace(/-/, '').toUpperCase()
  )
}

export function pascalToKebabCase(string) {
  return string.replace(/([a-z0–9])([A-Z])/g, '$1-$2').toLowerCase()
}

export function stringToBoolean(value) {
  return typeof value === 'string' ? value === 'true' : value
}
