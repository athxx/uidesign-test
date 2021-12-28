import puppeteer from 'puppeteer'
import { program } from 'commander'
import {
  SoulmaDriver,
  MastergoDriver,
  XiaopiuDriver,
  FigmaDriver,
  PixsoDriver,
  DriverOptions,
} from './drivers/index'
import {
  testCanvasFirstPainted,
  testMoveSelectAll,
  testMoveForSelectShapes,
  testWheelZoom,
} from './cases'
import { DriverMap } from './cases/types'
import { TestCase, Product } from './types'
import { urlConfirmer, urlStorage } from './utils/url-handler'
import { authStorage, authConfirmer } from './utils/auth-handler'

interface ProgramOptions {
  tests: string
  products: string
  pageWidth: string
  pageHeight: string
  editUrl: string
  editAuth: string
}

const pkg = require('../package.json')
const testingCases = [
  TestCase.firstPainted,
  TestCase.moveAll,
  TestCase.moveForSelect,
  TestCase.wheelZoom,
]
const products = [
  Product.soulma,
  Product.mastergo,
  Product.xiaopiu,
  Product.figma,
  Product.pixso,
]
const filterProducts = (str: string): Product[] => {
  return str
    .split(',')
    .filter((item) => products.includes(item as any)) as Product[]
}

program.version(pkg.version)
program.showHelpAfterError()
program
  .usage('<filename> [options]')
  .argument('<filename>')
  .option('-t --tests <string>', 'Test cases specified', testingCases.join(','))
  .option(
    '-p --products <string>',
    'Test products specified',
    products.join(',')
  )
  .option('--page-width <string>', 'Window innerWidth for browser', '1920')
  .option('--page-height <string>', 'Window innerHeight for browser', '1080')
  .option('--edit-url <string>', 'Config test products url')
  .option('--edit-auth <string>', 'Config auth settings')

async function configTestUrl(filename: string) {
  let info = urlStorage.get(filename)

  if (!info) {
    info = await urlConfirmer.confirmForProducts()

    urlStorage.setFile(filename, info)

    return urlStorage.write()
  }
}

async function configEditUrl(filename: string, products: Product[]) {
  for (let i = 0, l = products.length; i < l; i++) {
    const product = products[i]
    const url = await urlConfirmer.confirmForProduct(product)

    urlStorage.setProduct(filename, product, url)
  }

  await urlStorage.write()
}

async function configAuth(products: Product[]) {
  const authData = authStorage.get()

  if (!authData.soulma && products.includes(Product.soulma)) {
    const token = await authConfirmer.askForSoulma()

    authStorage.setAuthData('soulma', { token })
  }

  if (!authData.mastergo && products.includes(Product.mastergo)) {
    const cookie = await authConfirmer.askForMastergo()

    authStorage.setAuthData('mastergo', { cookie })
  }

  if (!authData.xiaopiu && products.includes(Product.xiaopiu)) {
    const cookie = await authConfirmer.askForXiaopiu()

    authStorage.setAuthData('xiaopiu', { cookie })
  }

  if (!authData.figma && products.includes(Product.figma)) {
    const { name, password } = await authConfirmer.askForFigma()

    authStorage.setAuthData('figma', { account: { name, password } })
  }

  if (!authData.pixso && products.includes(Product.pixso)) {
    const { name, password } = await authConfirmer.askForPixso()

    authStorage.setAuthData('pixso', { account: { name, password } })
  }

  return authStorage.write()
}

async function configEditAuth(products: Product[]) {
  if (products.includes(Product.soulma)) {
    const token = await authConfirmer.askForSoulma()

    authStorage.setAuthData('soulma', { token })
  }

  if (products.includes(Product.mastergo)) {
    const cookie = await authConfirmer.askForMastergo()

    authStorage.setAuthData('mastergo', { cookie })
  }

  if (products.includes(Product.xiaopiu)) {
    const cookie = await authConfirmer.askForXiaopiu()

    authStorage.setAuthData('xiaopiu', { cookie })
  }

  if (products.includes(Product.figma)) {
    const { name, password } = await authConfirmer.askForFigma()

    authStorage.setAuthData('figma', { account: { name, password } })
  }

  if (products.includes(Product.pixso)) {
    const { name, password } = await authConfirmer.askForPixso()

    authStorage.setAuthData('pixso', { account: { name, password } })
  }

  return authStorage.write()
}

async function run(filename: string, options: ProgramOptions) {
  await configTestUrl(filename)

  if (options.editUrl) {
    const products = filterProducts(options.editUrl)

    await configEditUrl(filename, products)
  }

  await configAuth(filterProducts(options.products))

  if (options.editAuth) {
    const products = filterProducts(options.editAuth)

    await configEditAuth(products)
  }

  const browser = await puppeteer.launch({
    headless: options.tests === TestCase.firstPainted,
    // devtools: true
    args: ['--start-maximized'],
  })
  const testingOptions: DriverOptions = {
    pageSettings: {
      width: Number(options.pageWidth),
      height: Number(options.pageHeight),
    },
  }
  const testingCases = options.tests
  const authData = authStorage.get()

  let soulma: SoulmaDriver | undefined
  let mastergo: MastergoDriver | undefined
  let xiaopiu: XiaopiuDriver | undefined
  let figma: FigmaDriver | undefined
  let pixso: PixsoDriver | undefined

  if (authData.soulma) {
    soulma = new SoulmaDriver({
      browser,
      token: authData.soulma.token,
      options: testingOptions,
    })
  }

  if (authData.mastergo) {
    mastergo = new MastergoDriver({
      browser,
      cookie: authData.mastergo.cookie,
      options: testingOptions,
    })
  }

  if (authData.xiaopiu) {
    xiaopiu = new XiaopiuDriver({
      browser,
      cookie: authData.xiaopiu.cookie,
      options: testingOptions,
    })
  }

  if (authData.figma) {
    figma = new FigmaDriver({
      browser,
      options: testingOptions,
      name: authData.figma.account.name,
      password: authData.figma.account.password,
    })
  }

  if (authData.pixso) {
    pixso = new PixsoDriver({
      browser,
      options: testingOptions,
      name: authData.pixso.account.name,
      password: authData.pixso.account.password,
    })
  }

  const productsMap = {
    soulma,
    mastergo,
    xiaopiu,
    figma,
    pixso,
  }
  const drivers = filterProducts(options.products).reduce((acc, curr) => {
    const fileUrl = urlStorage.get(filename)[curr]

    // 如果存在链接, 才加入测试
    if (fileUrl) {
      // @ts-ignore
      acc[curr] = productsMap[curr]
    }

    return acc
  }, {} as DriverMap)

  if (testingCases.includes(TestCase.firstPainted)) {
    await testCanvasFirstPainted(filename, drivers)
  }

  if (testingCases.includes(TestCase.moveAll)) {
    await testMoveSelectAll(filename, drivers)
  }

  if (testingCases.includes(TestCase.moveForSelect)) {
    await testMoveForSelectShapes(filename, drivers)
  }

  if (testingCases.includes(TestCase.wheelZoom)) {
    await testWheelZoom(filename, drivers)
  }

  await browser.close()
}

async function main() {
  program.action(run)

  await program.parseAsync(process.argv)
}

main()
