import { Page } from 'puppeteer-core'
import { verifyCaptcha } from './verify'

export async function makeLogin (page: Page) {
  await page.goto('https://senhawebsts.prefeitura.sp.gov.br/Account/Login.aspx?ReturnUrl=%2f%3fwa%3dwsignin1.0%26wtrealm%3dhttps%253a%252f%252fduc.prefeitura.sp.gov.br%252fportal%252f%26wctx%3drm%253d0%2526id%253dpassive%2526ru%253d%25252fportal%25252f%26wct%3d2021-02-03T21%253a22%253a14Z&wa=wsignin1.0&wtrealm=https%3a%2f%2fduc.prefeitura.sp.gov.br%2fportal%2f&wctx=rm%3d0%26id%3dpassive%26ru%3d%252fportal%252f&wct=2021-02-03T21%3a22%3a14Z', { waitUntil: 'networkidle0' })
  await page.type('#formBody_formBody_txtUser', '22.646.078/0001-10')
  await page.type('#formBody_formBody_txtPassword', 'Andressa646078')
  if (!await verifyCaptcha(page)) return makeLogin(page)
  await page.click('#formBody_formBody_btnLogin')
  await page.waitForTimeout(5000)
  // @ts-ignore
  const userOrPasswordError = await page.$eval('#formBody_formBody_UserPasswordCustomValidator > div', element => element.innerText.trim()).catch(e => 'login ok')
  if (userOrPasswordError !== 'login ok' || !userOrPasswordError) return false
  return true
}
