import {DriverMap} from './types'

export async function testCanvasFirstPainted({ soulma, mastergo }: DriverMap) {
  if(soulma) {
    const { costSecond: soulmaSecond } = await soulma.testCanvasFirstPainted('https://abc.xk.design/design/00000000002J')

    console.log('soulma.testCanvasFirstPainted cost:', soulmaSecond)
  }

  if(mastergo) {
    const { costSecond: mastergoSecond } = await mastergo.testCanvasFirstPainted('https://mastergo.com/file/46761570483870')

    console.log('mastergo.testCanvasFirstPainted cost:', mastergoSecond)
  }
}