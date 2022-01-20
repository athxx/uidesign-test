import { DriverMap } from './types'
import { getTestFile } from '../utils/resources'
import { TestDriver } from '../drivers/index'

async function runTestWheelZoom({
  driver,
  url,
  testName,
}: {
  driver: TestDriver
  url: string
  testName: string
}) {
  try {
    await driver.testWheelZoom(url)
    console.log(`${testName}.testWheelZoom done!`)
  } catch (e: any) {
    console.log(`${testName}.testWheelZoom error:`, e.message)
  }
}

export async function testWheelZoom(
  filename: string,
  { soulma, mastergo, xiaopiu, figma, pixso, local }: DriverMap
) {
  const file = getTestFile(filename)

  if (soulma) {
    await runTestWheelZoom({
      driver: soulma,
      url: file.soulma,
      testName: 'soulma',
    })
  }

  if (mastergo) {
    await runTestWheelZoom({
      driver: mastergo,
      url: file.mastergo,
      testName: 'mastergo',
    })
  }

  if (xiaopiu) {
    await runTestWheelZoom({
      driver: xiaopiu,
      url: file.xiaopiu,
      testName: 'xiaopiu',
    })
  }

  if (figma) {
    await runTestWheelZoom({
      driver: figma,
      url: file.figma,
      testName: 'figma',
    })
  }

  if (pixso) {
    await runTestWheelZoom({
      driver: pixso,
      url: file.pixso,
      testName: 'pixso',
    })
  }

  if (local) {
    await runTestWheelZoom({
      driver: local,
      url: file.local,
      testName: 'local',
    })
  }
}
