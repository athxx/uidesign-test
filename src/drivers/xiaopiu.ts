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

    await sleep(500)

    const $btnTabs = await page.$$('.tab-item')
    const $btnUseAccount = $btnTabs?.[$btnTabs.length - 1]

    await $btnUseAccount?.click()

    const $inputName = await page.$('.input-item input')

    await $inputName?.type(this._account.name)
    await sleep(500)

    const $inputPassword = await page.$('.input-item+.input-item input')

    await $inputPassword?.type(this._account.password)
    await sleep(500)

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
    await page.waitForSelector('#editCanvas')
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

  async getDocList(auth: string): Promise<any> {
    // 获取列表
    const url = 'https://ds.js.design/projects/list'
    console.log(auth)

    const resp = await axios.post(url, null, { headers: { cookie: auth } })
    return resp.data.projects
  }

  async viewDocList(reportFile: string) {
    const page = await this.getMainPage()
    await page.goto('https://ds.js.design')
    const cookies = await page.cookies()
    const cookie = cookies.reduce((acc, curr) => {
      acc += `${curr.name}=${curr.value};`
      return acc
    }, '')

    const list = await this.getDocList(cookie)
    const preUrl = 'https://js.design/f/'
    let i = 0,
      j = 0
    // 循环打开文件
    // 捕捉到painter渲染就跳转到下一个文件
    for (const item of list) {
      i++
      try {
        await this.testCanvasFirstPainted(preUrl + item.shortId)
      } catch (error) {
        j++
        // 捕捉不到就把文件记录下来
        await fs.appendFile(
          reportFile,
          preUrl + item.shortId + ' : ' + error + '\n'
        )
        console.log(error)
      }
    }
    const result =
      new Date().toISOString() +
      '     平台共执行 ' +
      i +
      ' 个文件, 其中成功 ' +
      (i - j) +
      ' 个, 失败 ' +
      j +
      ' 个.\n'
    await fs.appendFile(reportFile, result)
  }
}
