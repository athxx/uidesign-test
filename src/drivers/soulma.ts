import {performance} from 'perf_hooks'

import {TestDriver, TestDriverCtorArgs, CanvasFirstPaintedResult} from './driver'

export class SoulmaDriver extends TestDriver {
  private _webToken: string

  constructor(args: TestDriverCtorArgs & { token: string }) {
    super(args)
    this._webToken = args.token
  }

  async ready() {
    const page = await this.browser.newPage()

    await page.goto('https://abc.xk.design/')

    return page.evaluate(function setToken(token: string) {
      window.localStorage.setItem('XK-Token', token)
    }, this._webToken)
  }

  async testCanvasFirstPainted(url: string): CanvasFirstPaintedResult {
    await this.ready()

    const page = await this.browser.newPage()
    const startTime = performance.now()

    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.progress-mask')
    await page.waitForSelector('.progress-mask', { hidden: true })

    return {
      costSecond: (performance.now() - startTime) / 1000
    }
  }
}