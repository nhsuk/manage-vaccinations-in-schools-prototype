import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const generateDataFile = async (outputPath, dataMap) => {
  try {
    const fileDir = path.join(
      import.meta.url,
      '../..',
      path.dirname(outputPath)
    )
    await fs.mkdir(fileURLToPath(fileDir), { recursive: true })
    const data = Object.fromEntries(dataMap)
    dataMap.clear()
    const fileData = JSON.stringify(data, null, 2)
    await fs.writeFile(outputPath, fileData)
    console.info(`✓ Generated ${outputPath}`)
  } catch (error) {
    console.error(error)
  }
}
