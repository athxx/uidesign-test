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

export class PixsoDriver extends TestDriver {
  private _account: Account

  constructor(args: TestDriverCtorArgs & Account) {
    super(args)
    this._account = {
      name: args.name,
      password: args.password,
    }
  }

  async makeReady(): Promise<void> {
    const page = await this.getMainPage()

    await page.goto('https://pixso.cn/user/login/')

    const $btnLoginTypes = await page.$$(
      '.sign-in-by-account--tabs .text-header5'
    )
    const $btnLoginByPassword = $btnLoginTypes[$btnLoginTypes.length - 1]

    await $btnLoginByPassword.click()

    const $signContainer = await page.waitForSelector(
      '.sign-in-by-account--pw-box'
    )
    const $inputAccount = await $signContainer?.$('input.input--box')
    const $inputPassword = await $signContainer?.$('input[type="password"]')
    const $btnSign = await $signContainer?.$('.btn--next')

    await $inputAccount?.type(this._account.name)
    await $inputPassword?.type(this._account.password)
    await $btnSign?.click()
    await page.waitForNavigation()
  }

  async setZoom(zoom: number): Promise<void> {}

  async testCanvasFirstPainted(url: string): Promise<CanvasFirstPaintedResult> {
    await this.ready()

    const page = await this.getMainPage()
    const startTime = performance.now()

    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.editor-loading-page', { visible: true })
    await page.waitForSelector('.editor-loading-page', { hidden: true })

    return {
      costSecond: (performance.now() - startTime) / 1000,
    }
  }

  async testMoveSelectAll(
    url: string,
    options: MoveSelectAllOptions
  ): Promise<void> {
    await this.waitForCanvasReady(url, { zoom: options.zoom })

    const page = await this.getMainPage()
    const keyboard = page.keyboard
    const mouse = page.mouse
    const pageSettings = this.options.pageSettings
    const x = pageSettings.width / 2 - 50
    const y = pageSettings.height / 2

    await keyboard.down('ControlLeft')
    await keyboard.press('A')
    await keyboard.up('ControlLeft')

    const testFn = () =>
      mousemoveInRetanglePath(mouse, {
        start: { x, y },
        steps: options.mousemoveSteps,
        delta: options.mousemoveDelta,
      })

    await this.recordPerformance(page, testFn, {
      screenshots: true,
      filename: 'pixso-move-select-all.json',
    })
  }

  async testMoveForSelectShapes(
    url: string,
    options: MoveSelectAllOptions
  ): Promise<void> {
    await this.waitForCanvasReady(url, { zoom: options.zoom })

    const canvasBoundingRect = await this.getCanvasBoundingRect('#fic-canvas')

    if (!canvasBoundingRect) {
      console.error('canvas boundings not found!')

      return
    }

    const page = await this.getMainPage()
    const mouse = page.mouse
    const rulerWidth = 0
    const rulerHeight = 0
    const startX =
      canvasBoundingRect.left + rulerWidth + /** pixso左侧可直接拖动 */ +31
    const startY = canvasBoundingRect.top + rulerHeight + 28
    const endX = startX + canvasBoundingRect.width
    const endY = startY + canvasBoundingRect.height
    const testFn = () =>
      mousemoveInDiagonalPath(mouse, {
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        delta: options.mousemoveDelta,
      })

    await this.recordPerformance(page, testFn, {
      screenshots: true,
      filename: 'pixso-move-for-select-shapes.json',
    })
  }

  async testWheelZoom(url: string): Promise<void> {
    await this.waitForCanvasReady(url, {})

    const page = await this.getMainPage()
    const testFn = () => this.zoomCanvasByMockWheel()

    await this.recordPerformance(page, testFn, {
      screenshots: true,
      filename: 'pixso-wheel-zoom.json',
    })
  }
}
