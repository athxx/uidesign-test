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
    timeout: 300000,
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
  const driverName: string = process.argv[2]
  if (driverName === undefined || products.indexOf(driverName) === -1) {
    console.log(
      'error: missing required argument platform \n\n\n' +
        'Platform Options : soulma, figma, mastergo, pixso, xiaopiu'
    )
    return
  }

  // @ts-ignore
  await configAuth([Product[driverName]])

  const browser = await puppeteer.launch({
    headless: true,
    devtools: false,
    args: ['--start-maximized'],
  })

  const driver = await getDriver(browser, driverName)

  await driver.ready()

  const reportFile = '../report_' + driverName + '.log'
  await driver.viewDocList(reportFile)
  await browser.close()
}

main()
