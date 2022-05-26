import { Page } from 'puppeteer-core'
import { resolveCaptcha } from '../captcha/normal/resolve'
import { printCaptcha } from '../captcha/normal/printScreen'

export async function verifyCaptcha (page: Page) {
  await page.waitForTimeout(5000)
  // @ts-ignore
  const statusImageCaptcha = await page.$eval('#txtValidacao', element => element.value)
  if (!statusImageCaptcha) {
    await printCaptcha(page, '#imgCaptcha')
    const solutionCaptcha = await resolveCaptcha()
    if (!solutionCaptcha) {
      return false
    }
    await page.waitForSelector('#txtValidacao')
    await page.type('#txtValidacao', solutionCaptcha)
    return true
  }
}
