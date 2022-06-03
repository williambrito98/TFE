import { Page } from 'puppeteer-core'
import { resolveCaptcha } from '../captcha/normal/resolve'
import { printCaptcha } from '../captcha/normal/printScreen'

export async function verifyCaptcha (page: Page, tentativas: number = 0) {
  // @ts-ignore
  const statusImageCaptcha = await page.$eval('#txtValidacao', element => element.value)
  if (!statusImageCaptcha) {
    if (tentativas < 5 || tentativas === 0) {
      await printCaptcha(page, '#imgCaptcha')
    }

    if (tentativas > 5) {
      return false
    }
    const solutionCaptcha = await resolveCaptcha()
    if (!solutionCaptcha) {
      return verifyCaptcha(page, tentativas++)
    }
    await page.waitForSelector('#txtValidacao')
    await page.type('#txtValidacao', solutionCaptcha)
    return true
  }
}
