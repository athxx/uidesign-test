import { DriverMap } from './types'
import { MoveSelectAllOptions, TestDriver } from '../drivers'
import { getTestFile } from '../utils/resources'

async function runMoveSelectAll({
  driver,
  url,
  testName,
  options,
}: {
  driver: TestDriver
  url: string
  testName: string
  options: MoveSelectAllOptions
}) {
  try {
    await driver.testMoveSelectAll(url, options)
    console.log(`${testName}.testMoveSelectAll done!`)
  } catch (e: any) {
    console.log(`${testName}.testMoveSelectAll error:`, e.message)
  }
}

async function runMoveForSelectShapes({
  driver,
  url,
  testName,
  options,
}: {
  driver: TestDriver
  url: string
  testName: string
  options: MoveSelectAllOptions
}) {
  try {
    await driver.testMoveForSelectShapes(url, options)
    console.log(`${testName}.testMoveForSelectShapes done!`)
  } catch (e: any) {
    console.log(`${testName}.testMoveForSelectShapes error:`, e.message)
  }
}

export async function testMoveSelectAll(
  filename: string,
  { soulma, mastergo, xiaopiu, figma, pixso, local }: DriverMap,
  options: MoveSelectAllOptions = { mousemoveDelta: 10, mousemoveSteps: 30 }
) {
  const file = getTestFile(filename)

  if (soulma) {
    await runMoveSelectAll({
      driver: soulma,
      url: file.soulma,
      testName: 'soulma',
      options,
    })
  }

  if (mastergo) {
    await runMoveSelectAll({
      driver: mastergo,
      url: file.mastergo,
      testName: 'mastergo',
      options,
    })
  }

  if (xiaopiu) {
    await runMoveSelectAll({
      driver: xiaopiu,
      url: file.xiaopiu,
      testName: 'xiaopiu',
      options,
    })
  }

  if (figma) {
    await runMoveSelectAll({
      driver: figma,
      url: file.figma,
      testName: 'figma',
      options,
    })
  }

  if (pixso) {
    await runMoveSelectAll({
      driver: pixso,
      url: file.pixso,
      testName: 'pixso',
      options,
    })
  }

  if (local) {
    await runMoveSelectAll({
      driver: local,
      url: file.local,
      testName: 'local',
      options,
    })
  }
}

export async function testMoveForSelectShapes(
  filename: string,
  { soulma, mastergo, xiaopiu, figma, pixso, local }: DriverMap,
  options: MoveSelectAllOptions = { mousemoveDelta: 10, mousemoveSteps: 0 }
) {
  const file = getTestFile(filename)

  if (soulma) {
    await runMoveForSelectShapes({
      driver: soulma,
      url: file.soulma,
      testName: 'soulma',
      options,
    })
  }

  if (mastergo) {
    await runMoveForSelectShapes({
      driver: mastergo,
      url: file.mastergo,
      testName: 'mastergo',
      options,
    })
  }

  if (xiaopiu) {
    await runMoveForSelectShapes({
      driver: xiaopiu,
      url: file.xiaopiu,
      testName: 'xiaopiu',
      options,
    })
  }

  if (figma) {
    await runMoveForSelectShapes({
      driver: figma,
      url: file.figma,
      testName: 'figma',
      options,
    })
  }

  if (pixso) {
    await runMoveForSelectShapes({
      driver: pixso,
      url: file.pixso,
      testName: 'pixso',
      options,
    })
  }

  if (local) {
    await runMoveForSelectShapes({
      driver: local,
      url: file.local,
      testName: 'local',
      options,
    })
  }
}
