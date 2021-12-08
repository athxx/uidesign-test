import { DriverMap } from './types'
import { MoveSelectAllOptions } from '../drivers'
import { getTestFile } from '../utils/resources'

export async function testMoveSelectAll(
  filename: string,
  { soulma, mastergo, xiaopiu, figma, pixso }: DriverMap,
  options: MoveSelectAllOptions = { mousemoveDelta: 10, mousemoveSteps: 30 }
) {
  const file = getTestFile(filename)

  if (soulma) {
    await soulma.testMoveSelectAll(file.soulma, options)
    console.log('soulma.testMoveSelectAll done!')
  }

  if (mastergo) {
    await mastergo.testMoveSelectAll(file.mastergo, options)
    console.log('mastergo.testMoveSelectAll done!')
  }

  if (xiaopiu) {
    await xiaopiu.testMoveSelectAll(file.xiaopiu, options)
    console.log('xiaopiu.testMoveSelectAll done!')
  }

  if (figma) {
    try {
      await figma.testMoveSelectAll(file.figma, options)
      console.log('figma.testMoveSelectAll done!')
    } catch (e: any) {
      console.log(`figma.testMoveSelectAll with error: ${e.message}`)
    }
  }

  if (pixso) {
    await pixso.testMoveSelectAll(file.pixso, options)
    console.log('pixso.testMoveSelectAll done!')
  }
}

export async function testMoveForSelectShapes(
  filename: string,
  { soulma, mastergo, xiaopiu, figma, pixso }: DriverMap,
  options: MoveSelectAllOptions = { mousemoveDelta: 10, mousemoveSteps: 0 }
) {
  const file = getTestFile(filename)

  if (soulma) {
    await soulma.testMoveForSelectShapes(file.soulma, options)
    console.log('soulma.testMoveForSelectShapes done!')
  }

  if (mastergo) {
    await mastergo.testMoveForSelectShapes(file.mastergo, options)
    console.log('mastergo.testMoveForSelectShapes done!')
  }

  if (xiaopiu) {
    await xiaopiu.testMoveForSelectShapes(file.xiaopiu, options)
    console.log('xiaopiu.testMoveForSelectShapes done!')
  }

  if (figma) {
    try {
      await figma.testMoveForSelectShapes(file.figma, options)
      console.log('figma.testMoveForSelectShapes done!')
    } catch (e: any) {
      console.log(`figma.testMoveForSelectShapes with error: ${e.message}`)
    }
  }

  if (pixso) {
    await pixso.testMoveForSelectShapes(file.pixso, options)
    console.log('pixso.testMoveForSelectShapes done!')
  }
}
