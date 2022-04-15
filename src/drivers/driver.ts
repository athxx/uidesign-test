import * as fs from 'fs'
import * as path from 'path'
import { Browser, Page, TracingOptions } from 'puppeteer'

import { sleep } from '../utils/process'
import { mouseWheelZoom } from '../utils/mouse'
import { getDatetimeInfo } from '../utils/datetime'

export interface DriverOptions {
  pageSettings: {
    width: number
    height: number
  }
  timeout?: number
}

export interface TestDriverCtorArgs {
  browser: Browser
  options?: DriverOptions
}

export type CanvasFirstPaintedResult = Promise<{ costSecond: number }>

export interface MoveSelectAllOptions {
  zoom?: number
  mousemoveSteps: number
  mousemoveDelta: number
}

let mainPage: Page | undefined

const fileSaver = (function () {
  const dateInfo = getDatetimeInfo()
  const _performancesDir = path.resolve(
    __dirname,
    `../../performances/${dateInfo.year}_${dateInfo.month}_${dateInfo.day}_${dateInfo.hour}_${dateInfo.minute}`
  )

  return {
    get performancesDir() {
      if (!fs.existsSync(_performancesDir)) {
        fs.mkdirSync(_performancesDir)
      }

      return _performancesDir
    },
  }
})()

export abstract class TestDriver {
  private _readyPromise: Promise<void> | undefined

  browser: Browser

  options: DriverOptions = {
    pageSettings: {
      width: 800,
      height: 600,
    },
  }

  constructor({ browser, options }: TestDriverCtorArgs) {
    this.browser = browser
    this.options = {
      ...this.options,
      ...options,
    }
  }
  abstract getDocList(auth: string): Promise<void>
  abstract viewDocList(reportFile: string): Promise<any>
  abstract upload(dir: string, reportFile: string): Promise<void>

  abstract makeReady(): Promise<void>
  abstract setZoom(zoom: number): Promise<void>
  abstract testCanvasFirstPainted(
    url: string
  ): Promise<CanvasFirstPaintedResult>
  abstract testMoveSelectAll(
    url: string,
    options: MoveSelectAllOptions
  ): Promise<void>
  abstract testMoveForSelectShapes(
    url: string,
    options: MoveSelectAllOptions
  ): Promise<void>
  abstract testWheelZoom(url: string): Promise<void>

  ready() {
    if (!this._readyPromise) {
      this._readyPromise = this.makeReady()
    }

    return this._readyPromise
  }

  async getMainPage() {
    if (!mainPage) {
      mainPage = await this.browser.newPage()
      const pages = await this.browser.pages()
      if (pages.length > 1) {
        await pages[0].close()
      }
      if (this.options.pageSettings) {
        const { width, height } = this.options.pageSettings

        await mainPage.setViewport({ width, height })
      }

      if (typeof this.options.timeout === 'number') {
        await mainPage.setDefaultTimeout(this.options.timeout)
      }
    }

    return mainPage
  }

  waitForCanvasLazyPaintResource(ms: number = 5000) {
    return sleep(ms)
  }

  async waitForCanvasReady(
    url: string,
    { zoom, waitResourceSecond }: { zoom?: number; waitResourceSecond?: number }
  ) {
    await this.testCanvasFirstPainted(url)
    await this.waitForCanvasLazyPaintResource(waitResourceSecond)

    if (typeof zoom === 'number') {
      await this.setZoom(zoom)
    }
  }

  async getCanvasBoundingRect(domSelector: string, page?: Page) {
    if (typeof page === 'undefined') {
      page = await this.getMainPage()
    }

    return await page.evaluate(function getBoundingRect(selector: string) {
      const canvas = document.querySelector(selector)
      const rect = canvas?.getBoundingClientRect()
      let r: Omit<DOMRect, 'toJSON'> | undefined

      if (rect) {
        r = {
          width: rect.width,
          height: rect.height,
          x: rect.x,
          y: rect.y,
          top: rect.top,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right,
        }
      }

      return r
    }, domSelector)
  }

  async zoomCanvas(deltas?: number[]) {
    const page = await this.getMainPage()
    const mouse = page.mouse
    const keyboard = page.keyboard
    const pageSettings = this.options.pageSettings

    await mouse.move(pageSettings.width / 2, pageSettings.height / 2)

    await keyboard.down('ControlLeft')
    await mouseWheelZoom(page.mouse, deltas)
    await keyboard.up('ControlLeft')
  }

  async zoomCanvasByMockWheel(registedWheelSelector: string = '') {
    const page = await this.getMainPage()
    const mouse = page.mouse
    const pageSettings = this.options.pageSettings

    await mouse.move(pageSettings.width / 2, pageSettings.height / 2)

    return page.evaluate(
      ({
        clientX,
        clientY,
        ctrlKey = true,
        selector,
      }: Partial<WheelEventInit> & { selector: string }) => {
        let node = selector
          ? (document.querySelector(selector) as Element)
          : document

        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
        const makeMockWheel = (zoomType: 'large' | 'small') => {
          return () => {
            const seed = zoomType === 'large' ? -1 : 1
            const initOptions: WheelEventInit = {
              deltaY: seed * 125,
              ctrlKey,
              clientX,
              clientY,
            }
            const mouseWheelEvent = new WheelEvent('mousewheel', initOptions)
            const wheelEvent = new WheelEvent('wheel', initOptions)

            node.dispatchEvent(mouseWheelEvent)
            node.dispatchEvent(wheelEvent)

            return sleep(16.67)
          }
        }
        const queue: Array<() => Promise<unknown>> = []
        const loop = (): Promise<void> => {
          const fn = queue.shift()

          if (fn) {
            return fn().then(loop)
          }

          return Promise.resolve()
        }

        for (let i = 0, l = 20; i < l; i++) {
          queue.push(makeMockWheel('large'))
        }

        for (let i = 0, l = 20; i < l; i++) {
          queue.push(makeMockWheel('small'))
        }

        return loop()
      },
      {
        selector: registedWheelSelector,
        clientX: pageSettings.width / 2,
        clientY: pageSettings.height / 2,
      }
    )
  }

  async recordPerformance(
    page: Page,
    fn: () => Promise<void>,
    options: TracingOptions & { filename: string }
  ) {
    await page.tracing.start({
      screenshots: options.screenshots,
      path: options.path || `${fileSaver.performancesDir}/${options.filename}`,
    })
    await fn()
    await page.tracing.stop()
  }
}
