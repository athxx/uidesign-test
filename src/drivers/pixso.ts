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

    await page.goto(
      'https://pixso.cn/user/login/?response_type=code&redirect_uri=https://pixso.cn/app/drafts&from=1&product=pixso&ux_mode=redirect'
    )

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
      mousemoveInRectanglePath(mouse, {
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
      canvasBoundingRect.left + rulerWidth + /** pixso????????????????????? */ +31
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

  async getDocList(auth: string): Promise<any> {
    // ????????????
    const folderUrl = 'https://api.pixso.cn/api/pix/folders/list'
    const folder = await axios.get(folderUrl, {
      headers: { authorization: auth },
    })

    let folderId: string = ''
    for (const item of folder.data.data) {
      if (item.name == '????????????') {
        folderId = item.id
      }
    }

    const url =
      'https://api.pixso.cn/api/pix/folders/files?folder_id=' + folderId
    const resp = await axios.get(url, { headers: { authorization: auth } })
    // console.log(resp.data.data);
    return resp.data.data
  }

  async viewDocList(reportFile: string) {
    const page = await this.getMainPage()
    const cookies = await page.cookies()
    // console.log(cookies);
    let auth: string = ''
    for (const item of cookies) {
      if (item.name === 'BOSYUNCurrent') {
        // console.log(JSON.parse(decodeURIComponent(item.value)))
        const cookie = JSON.parse(decodeURIComponent(item.value))
        auth = 'Bearer ' + cookie.access_token
        break
      }
    }
    const list = await this.getDocList(auth)
    const preUrl = 'https://pixso.cn/app/editor/'
    let i = 0,
      j = 0
    // ?????????painter?????????????????????????????????
    for (const item of list) {
      i++
      try {
        await this.testCanvasFirstPainted(preUrl + item.file_key)
      } catch (error) {
        j++
        // ????????????????????????????????????
        await fs.appendFile(
          reportFile,
          preUrl + item.file_key + ' : ' + error + '\n'
        )
        // ????????????????????????????????????
        await fs.appendFile(
          reportFile,
          `[${item.doc_name}] ${preUrl}${item.file_key} ,  ??????: ${error}\n`
        )
        console.log(
          `???????????? ${j} ?????????, [${item.doc_name}] ${preUrl}${item.file_key} ,  ??????:  ${error}`
        )
      }
    }
  }

  async upload(dir: string, reportFile: string) {}
}
