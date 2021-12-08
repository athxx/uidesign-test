import {Browser} from 'puppeteer'

export interface TestDriverCtorArgs {
  browser: Browser
}

export type CanvasFirstPaintedResult = Promise<{costSecond: number}>

export abstract class TestDriver {
  browser: Browser

  constructor({browser}: TestDriverCtorArgs) {
    this.browser = browser
  }

  abstract ready(): Promise<void>
  abstract testCanvasFirstPainted(url: string): CanvasFirstPaintedResult
}