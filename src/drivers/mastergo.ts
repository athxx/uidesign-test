import {performance} from 'perf_hooks'

import {TestDriver, TestDriverCtorArgs, CanvasFirstPaintedResult} from './driver'

export class MastergoDriver extends TestDriver {
  private _webToken: string

  constructor(args: TestDriverCtorArgs & { cookie: string }) {
    super(args)
    this._webToken = args.cookie
  }

  async ready() {
    const page = await this.browser.newPage()

    await page.goto('https://mastergo.com/')

    return page.evaluate(function setToken(token: string) {
      document.cookie = token
    }, this._webToken)
  }

  async testCanvasFirstPainted(url: string): CanvasFirstPaintedResult {
    await this.ready()

    const page = await this.browser.newPage()
    const startTime = performance.now()

    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.skeleton_screen_editpage')
    await page.waitForSelector('.skeleton_screen_editpage', { hidden: true })

    return {
      costSecond: (performance.now() - startTime) / 1000
    }
  }
}