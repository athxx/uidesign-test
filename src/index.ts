import puppeteer from 'puppeteer'
import {SoulmaDriver, MastergoDriver} from './drivers/index'
import {testCanvasFirstPainted} from './cases'

async function main() {
 const browser = await puppeteer.launch({
  // headless: false,
  // devtools: true
 })

 const soulma = new SoulmaDriver({ browser, token: '00lI3b91TCXUR2UGYFarFJ8V' })
 const mastergo = new MastergoDriver({ browser, cookie: 'gfsessionid=5feb068a-c8e0-45ea-8dbc-288425f880aa; master_sid_embed=61aa043c-0852-4aca-9046-7b1f66786738;' })

 await testCanvasFirstPainted({soulma, mastergo}) 

 await browser.close()
}

main()