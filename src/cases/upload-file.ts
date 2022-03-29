import { DriverMap } from './types'

export async function uploadSketchFile(
  filePaths: string[],
  { soulma, mastergo, xiaopiu, figma, pixso, local }: DriverMap
) {
  // TODO: just test code
  if (soulma) {
    const page = await soulma.getMainPage()

    await soulma.makeReady()
    await page.goto('http://abc.xk.design/')

    const $uploadBtn = await page.$('input[name="file"]')

    await $uploadBtn?.uploadFile(...filePaths)
  }
}
