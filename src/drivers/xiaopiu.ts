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

export class XiaopiuDriver extends TestDriver {
  private _webToken: string

  constructor(args: TestDriverCtorArgs & { cookie: string }) {
    super(args)
    this._webToken = args.cookie
  }

  private async _closeTipsModal({
    modalName,
    timeout = 2500,
  }: {
    modalName?: string
    timeout?: number
  }) {
    const page = await this.getMainPage()

    const $btnCloseModal = await page.waitForSelector('#popupCloseBtn', {
      timeout,
    })

    await $btnCloseModal?.click()
  }

  async makeReady() {
    const page = await this.getMainPage()

    await page.goto('https://ds.js.design/')

    return page.evaluate(function setToken(token) {
      document.cookie = token
    }, this._webToken)
  }

  async setZoom(zoom: number) {
    const page = await this.getMainPage()
    const $btnZoom = await page.$('._31E46')

    await $btnZoom?.click()

    const $zoomInput = await page.$('.PyIrq')

    await $zoomInput?.type(`${Math.floor(zoom * 100)}`)
    await page.keyboard.press('Enter')
  }

  async waitForCanvasReady(url: string, { zoom }: { zoom?: number }) {
    await this.testCanvasFirstPainted(url)
    await this._closeTipsModal({ modalName: 'theme' }).catch(() =>
      Promise.resolve()
    )
    await this.waitForCanvasLazyPaintResource()
    await this._closeTipsModal({ modalName: 'font', timeout: 5000 }).catch(() =>
      Promise.resolve()
    )

    if (typeof zoom === 'number') {
      await this.setZoom(zoom)
    }
  }

  async testCanvasFirstPainted(url: string): Promise<CanvasFirstPaintedResult> {
    await this.ready()

    const page = await this.getMainPage()
    const startTime = performance.now()

    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.loading')
    await page.waitForSelector('.loading', { hidden: true })

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

    const x = pageSettings.width / 2
    const y = pageSettings.height / 2

    await page.tracing.start({
      screenshots: true,
      path: 'performances/xiaopiu-move-select-all.json',
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

    const canvasBoundingRect = await this.getCanvasBoundingRect('#editCanvas')

    if (!canvasBoundingRect) {
      console.error('canvas boundings not found!')

      return
    }

    const page = await this.getMainPage()
    const mouse = page.mouse
    const rulerWidth = 60
    const rulerHeight = 40
    const startX = canvasBoundingRect.left + rulerWidth
    const startY = canvasBoundingRect.top + rulerHeight
    const endX = startX + canvasBoundingRect.width
    const endY = startY + canvasBoundingRect.height

    await page.tracing.start({
      screenshots: true,
      path: 'performances/xiaopiu-move-for-select-shapes.json',
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
      path: 'performances/xiaopiu-wheel-zoom.json',
    })
    await this.zoomCanvasByMockWheel('#canvasEditDiv')
    await page.tracing.stop()
  }
}
