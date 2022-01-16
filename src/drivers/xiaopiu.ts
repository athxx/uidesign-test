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
import { sleep } from '../utils/process'

interface Account {
  name: string
  password: string
}

export class XiaopiuDriver extends TestDriver {
  private _account: Account

  constructor(args: TestDriverCtorArgs & Account) {
    super(args)
    this._account = {
      name: args.name,
      password: args.password,
    }
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

    await page.goto('https://js.design/login')

    const $btnTabs = await page.$$('.tab-item')
    const $btnUseAccount = $btnTabs?.[$btnTabs.length - 1]

    await $btnUseAccount?.click()

    const $inputName = await page.$('.input-item input')

    await $inputName?.type(this._account.name)
    await sleep(100)

    const $inputPassword = await page.$('.input-item+.input-item input')

    await $inputPassword?.type(this._account.password)
    await sleep(100)

    const $btnLogin = await page.$('.action-btn')

    await $btnLogin?.click()
    await page.waitForNavigation()
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
    const testFn = () =>
      mousemoveInRetanglePath(mouse, {
        start: { x, y },
        steps: options.mousemoveSteps,
        delta: options.mousemoveDelta,
      })

    await this.recordPerformance(page, testFn, {
      screenshots: true,
      filename: 'xiaopiu-move-select-all.json',
    })
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
    const testFn = () =>
      mousemoveInDiagonalPath(mouse, {
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        delta: options.mousemoveDelta,
      })

    await this.recordPerformance(page, testFn, {
      screenshots: true,
      filename: 'xiaopiu-move-for-select-shapes.json',
    })
  }

  async testWheelZoom(url: string) {
    await this.waitForCanvasReady(url, {})

    const page = await this.getMainPage()
    const testFn = () => this.zoomCanvasByMockWheel('#canvasEditDiv')

    await this.recordPerformance(page, testFn, {
      screenshots: true,
      filename: 'xiaopiu-wheel-zoom.json',
    })
  }
}
