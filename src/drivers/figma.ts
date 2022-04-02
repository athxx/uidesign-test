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

    const testFn = () =>
      mousemoveInRetanglePath(mouse, {
        start: { x, y },
        steps: options.mousemoveSteps,
        delta: options.mousemoveDelta,
      })

    await this.recordPerformance(page, testFn, {
      screenshots: true,
      filename: 'figma-move-select-all.json',
    })
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
    const testFn = () =>
      mousemoveInDiagonalPath(mouse, {
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        delta: options.mousemoveDelta,
      })

    await this.recordPerformance(page, testFn, {
      screenshots: true,
      filename: 'figma-move-for-select-shapes.json',
    })
  }

  async testWheelZoom(url: string) {
    await this.waitForCanvasReady(url, {})

    const page = await this.getMainPage()
    const testFn = () => this.zoomCanvasByMockWheel()

    await this.recordPerformance(page, testFn, {
      screenshots: true,
      filename: 'figma-wheel-zoom.json',
    })
  }

  async getDocList(auth: string): Promise<any> {
    const folderUrl = 'https://www.figma.com/api/user/state'
    const folder = await axios.get(folderUrl, { headers: { cookie: auth } })
    const folderId = folder.data.meta.drafts_folder_id
    // console.log(folderId);
    const url = 'https://www.figma.com/api/folders/' + folderId + '/files'
    const resp = await axios.get(url, { headers: { cookie: auth } })
    return resp.data.meta.files
  }

  async viewDocList(reportFile: string) {
    const page = await this.getMainPage()
    const cookies = await page.cookies()
    const cookie = cookies.reduce((acc, curr) => {
      acc += `${curr.name}=${curr.value};`
      return acc
    }, '')
    const list = await this.getDocList(cookie)
    let i = 0,
      j = 0
    // 循环打开文件
    // 捕捉到painter渲染就跳转到下一个文件
    for (const item of list) {
      i++
      try {
        // await page.goto(item.url)
        await this.testCanvasFirstPainted(item.url)
        page.on('dialog', async (dialog) => {
          console.log('here')
          await dialog.accept()
        })
      } catch (error) {
        j++
        // 捕捉不到就把文件记录下来
        await fs.appendFile(reportFile, item.url + ' : ' + error + '\n')
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
