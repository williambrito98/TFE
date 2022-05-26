import { Page } from 'puppeteer-core'
import { readdirSync } from 'fs'
export async function waitDownload (page: Page, dirDownloads: string) {
  console.log('ESPERANDO DOWNLOAD DOS ARQUIVOS')
  let wasDownload = true
  let string = ''
  while (wasDownload) {
    string = readdirSync(dirDownloads).join('')
    if (string.includes('crdownload')) {
      await page.waitForTimeout(1500)
      continue
    } else {
      wasDownload = false
    }
  }
}
