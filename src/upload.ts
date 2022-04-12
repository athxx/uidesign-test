import puppeteer from 'puppeteer'
import { configAuth, authStorage } from './utils/auth-handler'

import {
  DriverOptions,
  PixsoDriver,
  SoulmaDriver,
  MastergoDriver,
  FigmaDriver,
  XiaopiuDriver,
  TestDriver,
} from './drivers/index'
import { Product } from './types'
import { sleep } from './utils/process'
import { DriverMap } from './cases/types'

import fs from 'fs/promises'

const products: string[] = [
  Product.soulma,
  Product.mastergo,
  Product.xiaopiu,
  Product.figma,
  Product.pixso,
]

const Drivers = {
  [Product.soulma]: SoulmaDriver,
  [Product.mastergo]: MastergoDriver,
  [Product.figma]: FigmaDriver,
  [Product.pixso]: PixsoDriver,
  [Product.xiaopiu]: XiaopiuDriver,
}

async function getDriver(
  browser: puppeteer.Browser,
  driverName: string
): Promise<TestDriver> {
  const opt: DriverOptions = {
    pageSettings: {
      width: 1920,
      height: 1080,
    },
    timeout: 180000,
  }
  if (driverName === 'soulma') {
    return new SoulmaDriver({
      browser,
      token: authStorage.get()[driverName].token,
      options: opt,
    })
  }

  // @ts-ignore
  return new Drivers[driverName as string]({
    browser,
    name: authStorage.get()[driverName].account.name,
    password: authStorage.get()[driverName].account.password,
    options: opt,
  })
}

async function main() {
  let driverName: string = process.argv[2]
  let dir: string = process.argv[3]
  // dir = 'E:/sketchs/'
  if (
    driverName === undefined ||
    dir.length < 4 ||
    products.indexOf(driverName) === -1
  ) {
    console.log(
      'error: missing required argument platform \n\n' +
        '[ Platform Options ] : soulma, figma, mastergo, pixso, xiaopiu\n' +
        '[ Sketch Directory ] : E:/sketchs/'
    )
    return
  }
  const path = require('path')
  const reportFile = path.join(
    `${__dirname}/../report/upload_${driverName}.log`
  )
  dir = path.join(dir, '/') // sketch路径
  console.log('log will save at : ' + reportFile)
  // @ts-ignore
  await configAuth([Product[driverName]])
  const browser = await puppeteer.launch({
    headless: true,
    devtools: true,
    args: [
      '--start-maximized',
      // '--proxy-server=127.0.0.1:7890'
    ],
  })

  const driver = await getDriver(browser, driverName)
  await driver.ready()
  await driver.upload(dir, reportFile)
  await browser.close()
}

main()
