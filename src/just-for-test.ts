import fs from 'fs/promises'
import path from 'path'
import puppeteer from 'puppeteer'

import { configAuth, authStorage } from './utils/auth-handler'
import { uploadSketchFile } from './cases/upload-file'
import { DriverOptions, SoulmaDriver } from './drivers/index'
import { Product } from './types'

async function main() {
  await configAuth([Product.soulma])

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

  const soulma = new SoulmaDriver({
    browser,
    token: authStorage.get().soulma.token,
    options: testingOptions,
  })
  const sketchFolder = path.resolve(__dirname, '../../../Download/sketchs')

  await fs.readdir(sketchFolder).then(async (sketchFiles) => {
    return await uploadSketchFile(
      sketchFiles.slice(0, 1).map((file) => path.join(sketchFolder, file)),
      { soulma }
    )
  })

  // 将链接写入项目根目录.test-url.json, 格式如:
  /**
   * {
      "Travelisto-UI-Kit": {
        "soulma": "http://abc.xk.design/design/4Z3Vk18mW3Zqu",
        "mastergo": "https://mastergo.com/file/46847941920334",
        "xiaopiu": "https://js.design/f/K2m1tS?p=tfAO9nGhb9",
        "figma": "https://www.figma.com/file/483Tb8ZtpqJqijj0QlEKuJ/Travelisto-UI-Kit?node-id=0%3A1",
        "pixso": "https://pixso.cn/app/editor/RIZcHwNd1q2jQ4FFFe8l5A",
        "local": "http://localhost:8080/design/JQgu73WJpZb5"
      },
      "hektar-ui-kit-carlhauser": {
        "soulma": "http://abc.xk.design/design/SJpxV19ULxmqe",
        "mastergo": "https://mastergo.com/file/46964925674623",
        "xiaopiu": "https://js.design/f/rM2HzS?p=_rsYDPH9tM",
        "figma": "https://www.figma.com/file/N2sBbFU34LKAMdydcKIX8c/hektar-ui-kit-carlhauser-55",
        "pixso": "",
        "local": "http://localhost:8080/design/JdylhW7RdiA1"
      }
    }
   */
}

main()
