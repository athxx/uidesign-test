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

export class MastergoDriver extends TestDriver {
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

    await page.goto('https://mastergo.com/')

    const $btnLogin = await page.$('.login')

    await $btnLogin?.click()

    const $modalLogin = await page.waitForSelector(
      '.login-register-container',
      {
        visible: true,
      }
    )

    const $inputName = await $modalLogin?.$('.text-input')
    const $inputPassword = await $modalLogin?.$('.login-password .text-input')
    const $btnStart = await $modalLogin?.$('.light-btn')

    await $inputName?.type(this._account.name)
    await $inputPassword?.type(this._account.password)
    await $btnStart?.click()
    await page.waitForNavigation()
  }

  async setZoom(zoom: number) {
    const page = await this.getMainPage()

    // TODO: only support 100%
    if (zoom !== 1) {
      return
    }

    const keyboard = page.keyboard

    await keyboard.down('ControlLeft')
    await keyboard.press('0')
    await keyboard.up('ControlLeft')
  }

  async testCanvasFirstPainted(url: string): Promise<CanvasFirstPaintedResult> {
    await this.ready()

    const page = await this.getMainPage()
    const startTime = performance.now()

    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.skeleton_screen_editpage')
    await page.waitForSelector('.skeleton_screen_editpage', { hidden: true })

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

    let x = pageSettings.width / 2
    let y = pageSettings.height / 2

    await page.tracing.start({
      screenshots: true,
      path: 'performances/mastergo-move-select-all.json',
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

    const canvasBoundingRect = await this.getCanvasBoundingRect('#canvas')

    if (!canvasBoundingRect) {
      console.error('canvas boundings not found!')

      return
    }

    const page = await this.getMainPage()
    const mouse = page.mouse
    const rulerWidth = 0
    const rulerHeight = 0
    const startX = canvasBoundingRect.left + rulerWidth
    const startY = canvasBoundingRect.top + rulerHeight
    const endX = startX + canvasBoundingRect.width
    const endY = startY + canvasBoundingRect.height

    await page.tracing.start({
      screenshots: true,
      path: 'performances/mastergo-move-for-select-shapes.json',
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
      path: 'performances/mastergo-wheel-zoom.json',
    })
    await this.zoomCanvasByMockWheel('#canvas')
    await page.tracing.stop()
  }
}
