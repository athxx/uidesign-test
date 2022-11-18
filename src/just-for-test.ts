import fs from 'fs/promises'
import path from 'path'
import puppeteer from 'puppeteer'

import { configAuth, authStorage } from './utils/auth-handler'
import { uploadSketchFile } from './cases/upload-file'
import { DriverOptions } from './drivers/index'
import { Product } from './types'

async function main() {

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--start-maximized'],
  })
  const testingOptions: DriverOptions = {
    pageSettings: {
      width: 1920,
      height: 1080,
    },
  }

  const sketchFolder = path.resolve(__dirname, '../../../Download/sketchs')


  // 将链接写入项目根目录.test-url.json, 格式如:
  /**
   * {
      "Travelisto-UI-Kit": {
        "mastergo": "https://mastergo.com/file/46847941920334",
        "jsDesigner": "https://js.design/f/K2m1tS?p=tfAO9nGhb9",
        "figma": "https://www.figma.com/file/483Tb8ZtpqJqijj0QlEKuJ/Travelisto-UI-Kit?node-id=0%3A1",
        "pixso": "https://pixso.cn/app/editor/RIZcHwNd1q2jQ4FFFe8l5A"
      },
      "hektar-ui-kit-carlhauser": {
        "mastergo": "https://mastergo.com/file/46964925674623",
        "jsDesigner": "https://js.design/f/rM2HzS?p=_rsYDPH9tM",
        "figma": "https://www.figma.com/file/N2sBbFU34LKAMdydcKIX8c/hektar-ui-kit-carlhauser-55",
        "pixso": ""
      }
    }
   */
}

main()
