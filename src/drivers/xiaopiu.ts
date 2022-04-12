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

    await sleep(200)

    const $btnTabs = await page.$$('.tab-item')
    const $btnUseAccount = $btnTabs?.[$btnTabs.length - 1]

    await $btnUseAccount?.click()

    const $inputName = await page.$('.input-item input')

    await $inputName?.type(this._account.name)
    await sleep(200)

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
    await page.waitForSelector('#editCanvas')
    await sleep(200)

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
      mousemoveInRectanglePath(mouse, {
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
    // console.log(auth)

    const resp = await axios.post(url, 'sortType=createDate&size=3000', {
      headers: { cookie: auth },
    })
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
    const l = list.length
    console.log('Total : ' + l)
    const preUrl = 'https://js.design/f/'

    // 循环打开文件
    // 捕捉到painter渲染就跳转到下一个文件
    const path = require('path')
    let curTime = new Date().toJSON().replace(/([TZ.\-:])+/g, '')
    const statFile = path.join(
      path.dirname(reportFile),
      `open_xiaopiu_${curTime}.csv`
    )
    await fs.writeFile(statFile, 'Time,Name,Url\n')
    console.log(statFile)
    let k = 0
    // let ss: number[] = []
    // for (let i = 1; i <= 2737; i++) {
    //   ss.push(i)
    // }
    // for (const v of list) {
    //   const num = +v.name.slice(0, 4)
    //   ss = ss.filter((el) => {
    //     return (el !== num)
    //   })
    // }
    // console.log(ss);
    // return
    for (const v of list) {
      k++
      // const num = +v.name.slice(0, 4)
      // if (![2002, 626, 1310].includes(num)) {
      //   continue
      // }
      try {
        const t = (
          await this.testCanvasFirstPainted(preUrl + v.shortId)
        ).costSecond.toFixed(3)
        console.log(`${k}/${l}\t${preUrl}${v.shortId}\t${t}\t${v.name}`)
        await fs.appendFile(statFile, `${t},${v.name},${preUrl}${v.shortId}\n`)
      } catch (e) {
        // 捕捉不到就把文件记录下来
        // 捕捉不到就把文件记录下来
        await fs.appendFile(
          reportFile,
          `${v.name}\t${preUrl}${v.shortId}\terror:${e}\n`
        )
        await fs.appendFile(
          statFile,
          `300,${v.name},${preUrl}${v.shortId},${e}\n`
        )
        console.log(`${k}/${l}\t${v.name}\t${preUrl}${v.shortId}\t错误:${e}`)
      }
    }
  }

  async upload(dir: string, reportFile: string) {
    const page = await this.getMainPage()
    const list = await fs.readdir(dir)
    const path = require('path')
    for (const f of list) {
      const num = +f.slice(0, 4)
      if (path.extname(f) === '.sketch' && num > 0 && num > 14 && num < 17) {
        try {
          await page.waitForSelector('#importSketchProcess')
          const $upBtn = await page.$('input[accept=".sketch"]')
          await $upBtn?.uploadFile(dir + f)
          // console.log($upBtn);
          await page.click('#popupSubmitBtn')
          await page.waitForFunction(
            'document.querySelector("#root").innerText.includes("文件导入成功")'
          )
          // await sleep(100);
          console.log(f)
        } catch (e) {
          // 捕捉不到就把文件记录下来
          await fs.appendFile(reportFile, `${f} , [ error ] ${e}\n`)
          console.log('error : ' + f)
        }
        await page.goto('https://js.design/workspace')
      }
    }
  }
}
