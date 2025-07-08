import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { sanitise } from '../app/utils/object.js'

export const generateDataFile = async (outputPath, dataMap) => {
  try {
    const fileDir = path.join(
      import.meta.url,
      '../..',
      path.dirname(outputPath)
    )
    await fs.mkdir(fileURLToPath(fileDir), { recursive: true })

    // Delete context data
    dataMap.forEach((data) => {
      delete data.context
    })

    // Clean-up data
    let data = Object.fromEntries(dataMap)
    data = sanitise(data)
    dataMap.clear()

    // Create data file
    const fileData = JSON.stringify(data, null, 2)
    await fs.writeFile(outputPath, fileData)

    console.info(`✓ Generated ${outputPath}`)
  } catch (error) {
    console.error(error)
  }
}
