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

interface Account {
  name: string
  password: string
}

export class FigmaDriver extends TestDriver {
  private _account: Account

  constructor(args: TestDriverCtorArgs & Account) {
    super(args)
    this._account = {
      name: args.name,
      password: args.password,
    }
  }

  async makeReady() {
    const page = await this.getMainPage()

    // TODO: 暂时无法得知figma是如何使用token来鉴权的. 这里直接走登录流程
    await page.goto('https://www.figma.com/login')
    await page.type('input[name="email"]', this._account.name)
    await page.type('input[name="password"]', this._account.password)

    const $btnLogin = await page.$('button[type="submit"]')
    await $btnLogin?.click()
    await page.waitForNavigation()
  }

  async setZoom(zoom: number) {}

  async testCanvasFirstPainted(url: string): Promise<CanvasFirstPaintedResult> {
    await this.ready()

    const page = await this.getMainPage()
    const startTime = performance.now()

    await page.goto(url)
    await page.waitForSelector('.progress_bar--outer--3EVoD')
    await page.waitForSelector('.progress_bar--outer--3EVoD', { hidden: true })

    return {
      costSecond: (performance.now() - startTime) / 1000,
    }
  }

  async testMoveSelectAll(url: string, options: MoveSelectAllOptions) {
    await this.waitForCanvasReady(url, {
      waitResourceSecond: 15000, // 因为翻墙的原因, 所以等待久一点
    })

    const page = await this.getMainPage()
    const keyboard = page.keyboard
    const mouse = page.mouse
    const pageSettings = this.options.pageSettings
    const x = pageSettings.width / 2
    const y = pageSettings.height / 2

    await keyboard.down('ControlLeft')
    await keyboard.press('A')
    await keyboard.up('ControlLeft')

    await page.tracing.start({
      screenshots: true,
      path: 'performances/figma-move-select-all.json',
    })
    await mousemoveInRetanglePath(mouse, {
      start: { x, y },
      steps: options.mousemoveSteps,
      delta: options.mousemoveDelta,
    })
    await page.tracing.stop()
  }

  async testMoveForSelectShapes(url: string, options: MoveSelectAllOptions) {
    await this.waitForCanvasReady(url, {
      waitResourceSecond: 15000, // 因为翻墙的原因, 所以等待久一点
    })

    const canvasBoundingRect = await this.getCanvasBoundingRect('.view canvas')

    if (!canvasBoundingRect) {
      console.error('canvas boundings not found!')

      return
    }

    const page = await this.getMainPage()
    const mouse = page.mouse
    const rulerWidth = 0
    const rulerHeight = 0
    const startX =
      canvasBoundingRect.left + rulerWidth + /** figma左侧可直接拖动 */ +5
    const startY = canvasBoundingRect.top + rulerHeight
    const endX = startX + canvasBoundingRect.width
    const endY = startY + canvasBoundingRect.height

    await page.tracing.start({
      screenshots: true,
      path: 'performances/figma-move-for-select-shapes.json',
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
      path: 'performances/figma-wheel-zoom.json',
    })
    await this.zoomCanvasByMockWheel()
    await page.tracing.stop()
  }
}
