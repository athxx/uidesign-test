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
  { mastergo, jsDesigner, figma, pixso }: DriverMap
) {
  const file = getTestFile(filename)

  if (mastergo) {
    await runTestWheelZoom({
      driver: mastergo,
      url: file.mastergo,
      testName: 'mastergo',
    })
  }

  if (jsDesigner) {
    await runTestWheelZoom({
      driver: jsDesigner,
      url: file.jsDesigner,
      testName: 'jsDesigner',
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
}
