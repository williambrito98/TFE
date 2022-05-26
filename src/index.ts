import { makeLogin } from './components/login'
import { recalculateTFE } from './components/recalculateTFE'
import CreateBrowser from './components/CreateBrowser/CreateBrowser'

(async () => {
  const newBrowser = new CreateBrowser()
  const { browser, page } = await newBrowser.init()
  if (!await makeLogin(page)) {
    console.log('USUARIO OU SENHA INCORRETO')
    return false
  }
  console.log('LOGIN OK')
  await page.waitForSelector('#headingTwo > h5 > button')
  await page.goto('https://duc.prefeitura.sp.gov.br/portal/forms/frm03_SituacaoCadastral.aspx', { waitUntil: 'networkidle0' })
  const unidadesEconomicas = await page.$$('#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_gvDados tbody tr')
  for (let index = 1; index < unidadesEconomicas.length - 1; index++) {
    const numberOffTheTR = (index + 1).toString().padStart(2, '0')
    // @ts-ignore
    const pendencia = await unidadesEconomicas[index].$eval(`#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_gvDados_ctl${numberOffTheTR}_lblPendencia`, element => element.innerText)
    // @ts-ignore
    const ativo = await unidadesEconomicas[index].$eval(`#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_gvDados_ctl${numberOffTheTR}_lblAtivo`, element => element.innerText)
    if (pendencia === 'S' && ativo === 'S') {
      await page.click(`#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_gvDados_ctl${numberOffTheTR}_ccm_formatado_link`)
      await page.waitForSelector('#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_fdsTFE')
      // @ts-ignore
      const contentTFEsection = await page.$eval('#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_fdsTFE', element => element.innerText) as string
      if (contentTFEsection.includes('Não há informações registradas para sugestões')) continue
      console.log('RECALCULANDO TFE')
      await recalculateTFE(page)
      console.log('BAIXANDO BOLETO')
      // await page.click('#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_btnPagar')
    }
  }
  await browser.close()
})()
