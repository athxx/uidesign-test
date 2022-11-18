import puppeteer from 'puppeteer'
import { configAuth, authStorage } from './utils/auth-handler'

import {
  DriverOptions,
  PixsoDriver,
  MastergoDriver,
  FigmaDriver,
  JsDesignerDriver,
  TestDriver,
} from './drivers/index'
import { Product } from './types'
import { sleep } from './utils/process'
import { DriverMap } from './cases/types'

import fs from 'fs/promises'

const products: string[] = [
  Product.mastergo,
  Product.jsDesigner,
  Product.figma,
  Product.pixso,
]

const Drivers = {
  [Product.mastergo]: MastergoDriver,
  [Product.figma]: FigmaDriver,
  [Product.pixso]: PixsoDriver,
  [Product.jsDesigner]: JsDesignerDriver,
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
        'Platform Options : figma, mastergo, pixso, jsDesigner'
    )
    return
  }
  const path = require('path')
  const reportFile = path.join(`${__dirname}/../report/open_${driverName}.log`)
  console.log('log will save at : ' + reportFile)

  // @ts-ignore
  await configAuth([Product[driverName]])

  const debug = !!process.argv[3] || false
  const browser = await puppeteer.launch({
    headless: !debug,
    devtools: debug,
    args: ['--start-maximized'],
  })

  const driver = await getDriver(browser, driverName)
  await driver.ready()
  await driver.viewDocList(reportFile)
  await browser.close()
}

main()
