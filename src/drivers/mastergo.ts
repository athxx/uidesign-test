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

    await page.goto('https://mastergo.com/files/login')
    await page.waitForSelector('.login-register-container')
    const $pswBtn = (
      await page.$$('.login-register-container .text-btn-wrap')
    )?.[2]
    await $pswBtn?.click()

    await page.waitForSelector('.login-register-container .text-input')
    const $inputName = (
      await page.$$('.login-register-container .text-input')
    )?.[0]
    await $inputName?.type(this._account.name)
    const $inputPassword = (
      await page.$$('.login-register-container .text-input')
    )?.[1]
    await $inputPassword?.type(this._account.password)

    await page.waitForSelector('.login-register-container .text-input')
    const $btnLogin = (
      await page.$$('.login-register-container .light-btn')
    )?.[0]
    await $btnLogin?.click()
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
    const testFn = () =>
      mousemoveInRetanglePath(mouse, {
        start: { x, y },
        steps: options.mousemoveSteps,
        delta: options.mousemoveDelta,
      })

    await this.recordPerformance(page, testFn, {
      screenshots: true,
      filename: 'mastergo-move-select-all.json',
    })
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
    const testFn = () =>
      mousemoveInDiagonalPath(mouse, {
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        delta: options.mousemoveDelta,
      })

    await this.recordPerformance(page, testFn, {
      screenshots: true,
      filename: 'mastergo-move-for-select-shapes.json',
    })
  }

  async testWheelZoom(url: string) {
    await this.waitForCanvasReady(url, {})

    const page = await this.getMainPage()
    const testFn = () => this.zoomCanvasByMockWheel('#canvas')

    await this.recordPerformance(page, testFn, {
      screenshots: true,
      filename: 'mastergo-wheel-zoom.json',
    })
  }

  async getDocList(auth: string): Promise<any> {
    // 获取列表
    const folderUrl =
      'https://mastergo.com/api/v1/users/teams?withProjects=true&page[size]=1000&page[number]=1'
    const project = await axios.get(folderUrl, { headers: { cookie: auth } })
    let projectId: string = ''
    for (const item of project.data.data) {
      if (item.name === '个人空间') {
        projectId = item.projects[0].id
      }
    }
    console.log('project ID  : ', projectId)
    const url =
      'https://mastergo.com/api/v1/documents?page[offset]=20&page[size]=3000&sort=-updated_at&projectId=' +
      projectId
    const resp = await axios.get(url, { headers: { cookie: auth } })

    return resp.data.data
  }

  async viewDocList(reportFile: string) {
    const page = await this.getMainPage()
    const cookies = await page.cookies()
    const cookie = cookies.reduce((acc, curr) => {
      acc += `${curr.name}=${curr.value};`
      return acc
    }, '')
    const list = await this.getDocList(cookie)
    const preUrl = 'https://mastergo.com/file/'
    let i = 0,
      j = 0
    // 循环打开文件
    // 捕捉到painter渲染就跳转到下一个文件
    for (const item of list) {
      i++
      try {
        // await page.goto(preUrl + item.id)
        await this.testCanvasFirstPainted(preUrl + item.id)
      } catch (error) {
        j++
        // 捕捉不到就把文件记录下来
        await fs.appendFile(reportFile, preUrl + item.id + ' : ' + error + '\n')
        console.log(error)
      }
    }

    const result = `${new Date().toISOString()}     平台共执行 ${i} 个文件, 其中成功 ${
      i - j
    } 个, 失败 ${j} 个.\n`

    await fs.appendFile(reportFile, result)
  }
}
