import { DriverMap } from './types'
import { getTestFile } from '../utils/resources'

export async function testWheelZoom(
  filename: string,
  { soulma, mastergo, xiaopiu, figma, pixso, local }: DriverMap
) {
  const file = getTestFile(filename)

  if (soulma) {
    await soulma.testWheelZoom(file.soulma)
    console.log('soulma.testWheelZoom done!')
  }

  if (mastergo) {
    await mastergo.testWheelZoom(file.mastergo)
    console.log('mastergo.testWheelZoom done!')
  }

  if (xiaopiu) {
    await xiaopiu.testWheelZoom(file.xiaopiu)
    console.log('xiaopiu.testWheelZoom done!')
  }

  if (figma) {
    try {
      await figma.testWheelZoom(file.figma)
      console.log('figma.testWheelZoom done!')
    } catch (e: any) {
      console.log(`figma.testWheelZoom with error: ${e.message}`)
    }
  }

  if (pixso) {
    await pixso.testWheelZoom(file.pixso)
    console.log('pixso.testWheelZoom done!')
  }

  if (local) {
    await local.testWheelZoom(file.local)
    console.log('local.testWheelZoom done!')
  }
}
