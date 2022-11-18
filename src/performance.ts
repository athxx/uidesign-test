import puppeteer from 'puppeteer'
import { program } from 'commander'
import {
  MastergoDriver,
  JsDesignerDriver,
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
import { authStorage, authConfirmer, configAuth } from './utils/auth-handler'

interface ProgramOptions {
  tests: string
  products: string
  pageWidth: string
  pageHeight: string
  editUrl: string
  editAuth: string
  timeout: string
}

const pkg = require('../package.json')
const testingCases = [
  TestCase.firstPainted,
  TestCase.moveAll,
  TestCase.moveForSelect,
  TestCase.wheelZoom,
]
const products = [
  Product.mastergo,
  Product.jsDesigner,
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
  .option('--timeout <number>', 'Second for handle timeout waiting')

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

async function configEditAuth(products: Product[]) {
  if (products.includes(Product.mastergo)) {
    const { name, password } = await authConfirmer.askForMastergo()

    authStorage.setAuthData('mastergo', { account: { name, password } })
  }

  if (products.includes(Product.jsDesigner)) {
    const { name, password } = await authConfirmer.askForJsDesigner()

    authStorage.setAuthData('jsDesigner', { account: { name, password } })
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
  if (options.editUrl) {
    const products = filterProducts(options.editUrl)

    await configEditUrl(filename, products)
    return
  }

  if (options.editAuth) {
    const products = filterProducts(options.editAuth)

    await configEditAuth(products)
    return
  }

  await configTestUrl(filename)
  await configAuth(filterProducts(options.products))

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
    timeout: Number.isNaN(Number(options.timeout))
      ? undefined
      : Number(options.timeout) * 1000,
  }
  const testingCases = options.tests
  const authData = authStorage.get()

  let mastergo: MastergoDriver | undefined
  let jsDesigner: JsDesignerDriver | undefined
  let figma: FigmaDriver | undefined
  let pixso: PixsoDriver | undefined

  if (authData.mastergo) {
    mastergo = new MastergoDriver({
      browser,
      name: authData.mastergo.account.name,
      password: authData.mastergo.account.password,
      options: testingOptions,
    })
  }

  if (authData.jsDesigner) {
    jsDesigner = new JsDesignerDriver({
      browser,
      name: authData.jsDesigner.account.name,
      password: authData.jsDesigner.account.password,
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
    mastergo,
    jsDesigner,
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
