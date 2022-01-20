import { DriverMap } from './types'
import { getTestFile } from '../utils/resources'
import { CanvasFirstPaintedResult, TestDriver } from '../drivers/index'

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

async function runFirstPainted({
  driver,
  url,
  testName,
  navigateTimes = 10,
}: {
  driver: TestDriver
  url: string
  testName: string
  navigateTimes?: number
}) {
  try {
    const costSecond = await getMedianForTasks(navigateTimes, () =>
      driver.testCanvasFirstPainted(url)
    )

    console.log(`${testName}.testCanvasFirstPainted cost:`, costSecond)
  } catch (e: any) {
    console.log(`${testName}.testCanvasFirstPainted with error: ${e.message}`)
  }
}

export async function testCanvasFirstPainted(
  filename: string,
  { soulma, mastergo, xiaopiu, figma, pixso, local }: DriverMap
) {
  // options?: { runTimes: number }
  const file = getTestFile(filename)

  if (soulma) {
    await runFirstPainted({
      driver: soulma,
      url: file.soulma,
      testName: 'soulma',
    })
  }

  if (mastergo) {
    await runFirstPainted({
      driver: mastergo,
      url: file.mastergo,
      testName: 'mastergo',
    })
  }

  if (xiaopiu) {
    await runFirstPainted({
      driver: xiaopiu,
      url: file.xiaopiu,
      testName: 'xiaopiu',
    })
  }

  if (figma) {
    await runFirstPainted({
      driver: figma,
      url: file.figma,
      testName: 'figma',
    })
  }

  if (pixso) {
    await runFirstPainted({
      driver: pixso,
      url: file.pixso,
      testName: 'pixso',
    })
  }

  if (local) {
    await runFirstPainted({
      driver: local,
      url: file.local,
      testName: 'local',
    })
  }
}
