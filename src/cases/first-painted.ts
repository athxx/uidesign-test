import { DriverMap } from './types'
import { getTestFile } from '../utils/resources'
import { CanvasFirstPaintedResult } from '../drivers/index'

async function getMedianForTasks(
  runTimes: number,
  task: () => Promise<CanvasFirstPaintedResult>
) {
  const times: number[] = []

  if (runTimes % 2 === 0) {
    runTimes += 1
  }

  for (let i = 0; i < runTimes; i++) {
    const { costSecond } = await task()

    times.push(costSecond)
  }

  return times[Math.ceil(times.length / 2)]
}

export async function testCanvasFirstPainted(
  filename: string,
  { soulma, mastergo, xiaopiu, figma, pixso }: DriverMap
) {
  // options?: { runTimes: number }
  const file = getTestFile(filename)

  if (soulma) {
    const costSecond = await getMedianForTasks(10, () =>
      soulma.testCanvasFirstPainted(file.soulma)
    )

    console.log('soulma.testCanvasFirstPainted cost:', costSecond)
  }

  if (mastergo) {
    const costSecond = await getMedianForTasks(10, () =>
      mastergo.testCanvasFirstPainted(file.mastergo)
    )

    console.log('mastergo.testCanvasFirstPainted cost:', costSecond)
  }

  if (xiaopiu) {
    const costSecond = await getMedianForTasks(10, () =>
      xiaopiu.testCanvasFirstPainted(file.xiaopiu)
    )

    console.log('xiaopiu.testCanvasFirstPainted cost:', costSecond)
  }

  if (figma) {
    try {
      const costSecond = await getMedianForTasks(10, () =>
        figma.testCanvasFirstPainted(file.figma)
      )

      console.log('figma.testCanvasFirstPainted cost:', costSecond)
    } catch (e: any) {
      console.log(`figma.testCanvasFirstPainted with error: ${e.message}`)
    }
  }

  if (pixso) {
    const { costSecond } = await pixso.testCanvasFirstPainted(file.pixso)

    console.log('pixso.testCanvasFirstPainted cost:', costSecond)
  }
}
