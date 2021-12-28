import { performance } from 'perf_hooks'

import {
  TestDriver,
  TestDriverCtorArgs,
  CanvasFirstPaintedResult,
  MoveSelectAllOptions,
} from './driver'
import {
  mousemoveInRetanglePath,
  mousemoveInDiagonalPath,
} from '../utils/mouse'

export class SoulmaDriver extends TestDriver {
  private _webToken: string

  constructor(args: TestDriverCtorArgs & { token: string }) {
    super(args)
    this._webToken = args.token
  }

  async makeReady() {
    const page = await this.getMainPage()

    await page.goto('https://abc.xk.design/')

    return page.evaluate(function setToken(token: string) {
      window.localStorage.setItem('XK-Token', token)
    }, this._webToken)
  }

  async setZoom(zoom: number) {
    const page = await this.getMainPage()
    const keyboard = page.keyboard
    const $zoom = await page.$('.zoom')

    await $zoom?.click()

    const $zoomInput = await page.$('.xk-menu .menu-input')

    await $zoomInput?.type(String(Math.floor(zoom * 100)))
    await keyboard.press('Enter')
  }

  async testCanvasFirstPainted(url: string): Promise<CanvasFirstPaintedResult> {
    await this.ready()

    const page = await this.getMainPage()
    const startTime = performance.now()

    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.progress-mask')
    await page.waitForSelector('.progress-mask', { hidden: true })

    return {
      costSecond: (performance.now() - startTime) / 1000,
    }
  }

  async testMoveSelectAll(url: string, options: MoveSelectAllOptions) {
    await this.waitForCanvasReady(url, { zoom: options.zoom })

    const page = await this.getMainPage()
    const keyboard = page.keyboard
    const mouse = page.mouse
    const pageSettings = this.options.pageSettings

    await keyboard.down('ControlLeft')
    await keyboard.press('A')
    await keyboard.up('ControlLeft')

    // TODO: 点击中心只会拖曳某个图层
    let x = pageSettings.width / 2
    let y = pageSettings.height / 2 + 100

    await page.tracing.start({
      screenshots: true,
      path: 'performances/soulma-move-select-all.json',
    })
    await mousemoveInRetanglePath(mouse, {
      start: { x, y },
      steps: options.mousemoveSteps,
      delta: options.mousemoveDelta,
    })
    await page.tracing.stop()
  }

  async testMoveForSelectShapes(url: string, options: MoveSelectAllOptions) {
    await this.waitForCanvasReady(url, { zoom: options.zoom })

    const canvasBoundingRect = await this.getCanvasBoundingRect('.slm-canvas')

    if (!canvasBoundingRect) {
      console.error('canvas boundings not found!')

      return
    }

    const page = await this.getMainPage()
    const mouse = page.mouse
    const rulerWidth = 50
    const rulerHeight = 30
    const startX = canvasBoundingRect.left + rulerWidth
    const startY = canvasBoundingRect.top + rulerHeight
    const endX = startX + canvasBoundingRect.width
    const endY = startY + canvasBoundingRect.height

    await page.tracing.start({
      screenshots: true,
      path: 'performances/soulma-move-for-select-shapes.json',
    })
    await mousemoveInDiagonalPath(mouse, {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
      delta: options.mousemoveDelta,
    })
    await page.tracing.stop()
  }

  async testWheelZoom(url: string) {
    await this.waitForCanvasReady(url, {})

    const page = await this.getMainPage()

    await page.tracing.start({
      screenshots: true,
      path: 'performances/soulma-wheel-zoom.json',
    })
    await this.zoomCanvasByMockWheel('.slm-view')
    await page.tracing.stop()
  }
}