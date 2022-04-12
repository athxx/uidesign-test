import { performance } from 'perf_hooks'
import axios from 'axios'
import fs from 'fs/promises'
import {
  TestDriver,
  TestDriverCtorArgs,
  CanvasFirstPaintedResult,
  MoveSelectAllOptions,
} from './driver'
import {
  mousemoveInRectanglePath,
  mousemoveInDiagonalPath,
} from '../utils/mouse'

export class SoulmaDriver extends TestDriver {
  private _webToken: string

  private _host: string

  private _protocol: string

  private _port: number

  private _filePrefix: string

  constructor(
    args: TestDriverCtorArgs & {
      token: string
      host?: string
      protocol?: string
      port?: number
      filePrefix?: string
    }
  ) {
    super(args)
    this._webToken = args.token
    this._host = args.host || 'abc.xk.design'
    this._protocol = args.protocol || 'http:'
    this._port = args.port || 80
    this._filePrefix = args.filePrefix || 'soulma'
  }

  async makeReady() {
    const page = await this.getMainPage()

    await page.goto(`${this._protocol}//${this._host}:${this._port}/`)

    return page.evaluate(function setToken(token: string) {
      window.localStorage.setItem(
        'XK_USER',
        JSON.stringify({ user: { token } })
      )
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
    let x = pageSettings.width / 2 + 50
    let y = pageSettings.height / 2

    const testFn = () =>
      mousemoveInRectanglePath(mouse, {
        start: { x, y },
        steps: options.mousemoveSteps,
        delta: options.mousemoveDelta,
      })

    await this.recordPerformance(page, testFn, {
      screenshots: true,
      filename: `${this._filePrefix}-move-select-all.json`,
    })
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
    const testFn = () =>
      mousemoveInDiagonalPath(mouse, {
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        delta: options.mousemoveDelta,
      })

    await this.recordPerformance(page, testFn, {
      screenshots: true,
      filename: `${this._filePrefix}-move-for-select-shapes.json`,
    })
  }

  async testWheelZoom(url: string) {
    await this.waitForCanvasReady(url, {})

    const page = await this.getMainPage()
    const testFn = () => this.zoomCanvasByMockWheel('.slm-view')

    await this.recordPerformance(page, testFn, {
      screenshots: true,
      filename: `${this._filePrefix}-wheel-zoom.json`,
    })
  }

  async getDocList(auth: string): Promise<any> {
    // 获取列表
    const url = 'http://abc.xk.design/api/doc/list?state=1'
    const resp = await axios.get(url, {
      headers: { 'Content-Type': 'application/json', Token: auth },
    })
    return resp.data.data
  }

  async viewDocList(reportFile: string) {
    const list = await this.getDocList(this._webToken)
    const uri = 'http://abc.xk.design/design/'
    let path = require('path')
    let curTime = new Date().toJSON().replace(/([TZ.\-:])+/g, '')
    const statFile = path.join(
      path.dirname(reportFile),
      `open_soulma_${curTime}.csv`
    )
    await fs.writeFile(statFile, 'Time,Name,Url\n')
    const l = list.length
    console.log(l, statFile)

    let k = 0
    for (const v of list) {
      k++
      try {
        const t = (
          await this.testCanvasFirstPainted(uri + v.doc_id)
        ).costSecond.toFixed(3)
        await fs.appendFile(statFile, `${t},${v.doc_name},${uri}${v.doc_id}\n`)
        console.log(`${k}/${l}\t${t}\t${v.doc_name}`)
      } catch (e) {
        await fs.appendFile(
          statFile,
          `300,${v.doc_name},${uri}${v.doc_id},${e}\n`
        )
        console.log(
          `${k}/${l}\t300\t${v.doc_name}\t${uri}${v.doc_id}\terror:${e}`
        )
      }
    }
  }

  async upload(dir: string, reportFile: string) {}
}
