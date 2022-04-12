import { performance } from 'perf_hooks'
import axios from 'axios'
import fs from 'fs/promises'
import { sleep } from '../utils/process'
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

    // const $inputName = ( await page.$$('.login-register-container .text-input') )?.[0]
    const $inputName = await page.$('input[placeholder="手机号/邮箱"]')
    await $inputName?.type(this._account.name)

    // const $inputPassword = ( await page.$$('.login-register-container .text-input') )?.[1]
    const $inputPassword = await page.$('input[placeholder="密码"]')
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
      mousemoveInRectanglePath(mouse, {
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
      'https://mastergo.com/api/v1/documents?page[offset]=0&page[size]=3000&sort=name&projectId=' +
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
    const path = require('path')
    let curTime = +new Date().toJSON().replace(/([TZ.\-:])+/g, '')
    const statFile = path.join(
      path.dirname(reportFile),
      `open_mastergo_${curTime}.csv`
    )
    await fs.writeFile(statFile, 'Time,Name,Url\n')
    console.log(statFile)
    const list = await this.getDocList(cookie)
    const l = list.length
    const preUrl = 'https://mastergo.com/file/'
    let k = 0
    // 循环打开文件
    // 捕捉到painter渲染就跳转到下一个文件
    for (const v of list) {
      k++
      // const num = +v.name.slice(0, 4)
      // if (![1422, 2110, 2514, 2601].includes(num)) {
      //   continue
      // }
      try {
        // await page.goto(preUrl + item.id)
        const t = (
          await this.testCanvasFirstPainted(preUrl + v.id)
        ).costSecond.toFixed(3)
        await fs.appendFile(statFile, `${t},${v.name},${preUrl}${v.id}\n`)
        console.log(`${k}/${l}\t${preUrl}${v.id}\t${t}\t${v.name}`)
      } catch (e) {
        // 捕捉不到就把文件记录下来
        await fs.appendFile(reportFile, preUrl + v.id + ' : ' + e + '\n')
        await fs.appendFile(
          statFile,
          `300,${v.name},${preUrl}${v.id},error:${e}\n`
        )
        console.log(`${k}/${l}\t${v.name}\t${preUrl}${v.id}\t错误:${e}`)
      }
    }
  }

  async upload(dir: string, reportFile: string) {
    const list = await fs.readdir(dir)
    const page = await this.getMainPage()
    const path = require('path')
    let files: string[] = []
    for (const f of list) {
      const num = +f.slice(0, 4)
      if (path.extname(f) === '.sketch' && num > 0 && num > 400 && num < 501) {
        files.push(dir + f)
        if (files.length >= 10 || num == 500) {
          try {
            await page.evaluate(() => {
              HTMLInputElement.prototype.click = () => {}
            })
            await page.waitForSelector('.project_header_title_action')
            const btnUp = (
              await page.$$('.project_header_title_action .m-button--secondary')
            )?.[1]
            await btnUp?.click()
            await page.waitForSelector('#skupload')
            const $upBtn = await page.$('input[id="skupload"]')
            await $upBtn?.uploadFile(...files)
            await page.waitForSelector('.import_panel .m-button__content')
            await page.waitForFunction(
              'document.querySelector(".import_panel .m-button__content").innerText.includes("导入完成")'
            )
            await page.click('.import_panel .m-button--secondary')
            await page.waitForSelector('.import_panel')
            files = []
            page.goto('https://mastergo.com/files/drafts')
            console.log(`upload to ${num}`)
          } catch (e) {
            // 捕捉不到就把文件记录下来
            await fs.appendFile(reportFile, `${f} , [ error ] ${e}\n`)
            console.log('error : ' + f, e)
          }
        }
      }
    }
  }
}
