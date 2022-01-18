import { existsSync, writeFileSync } from 'fs'
import { writeFile } from 'fs/promises'
import { resolve } from 'path'
import prompts from 'prompts'
import { Product } from '../types'

const testUrlPath = resolve(__dirname, '../../.test-url.json')

if (!existsSync(testUrlPath)) {
  writeFileSync(testUrlPath, JSON.stringify({}))
}

const testUrl = require('../../.test-url.json')

export const urlConfirmer = {
  async askForUrl(product: string) {
    return prompts({
      type: 'text',
      name: 'value',
      message: `Input url for ${product}:`,
    })
  },
  async confirmForProducts() {
    const info: { [key: string]: string } = {}

    const soulmaUrl = await this.askForUrl(Product.soulma)
    const mastergoUrl = await this.askForUrl(Product.mastergo)
    const xiaopiuUrl = await this.askForUrl(Product.xiaopiu)
    const figmaUrl = await this.askForUrl(Product.figma)
    const pixsoUrl = await this.askForUrl(Product.pixso)
    const localUrl = await this.askForUrl(Product.local)

    info[Product.soulma] = soulmaUrl.value
    info[Product.mastergo] = mastergoUrl.value
    info[Product.xiaopiu] = xiaopiuUrl.value
    info[Product.figma] = figmaUrl.value
    info[Product.pixso] = pixsoUrl.value
    info[Product.local] = localUrl.value

    return info
  },
  async confirmForProduct(product: Product): Promise<string> {
    const productUrl = await this.askForUrl(product)

    return productUrl.value
  },
}

export const urlStorage = {
  get(filename?: string) {
    if (typeof filename === 'string') {
      return testUrl[filename]
    }

    return testUrl
  },

  setFile(filename: string, value: { [key: string]: string }) {
    testUrl[filename] = value
  },

  setProduct(filename: string, key: string, value: string) {
    testUrl[filename][key] = value
  },

  write() {
    return writeFile(testUrlPath, JSON.stringify(testUrl, null, 2), {
      encoding: 'utf-8',
    })
  },
}
