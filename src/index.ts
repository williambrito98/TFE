import { makeLogin } from './components/login'
import { recalculateTFE } from './components/recalculateTFE'
import CreateBrowser from './components/CreateBrowser/CreateBrowser'
import TFE from '../tfe.json'
import { appendFileSync, renameSync, writeFileSync } from 'fs'
import { waitDownload } from './components/utils/downloads'
import { resolve } from 'path'

const CONFIG = {
  maxTentativas: 5,
  atualTentativas: 0,
  indexError: 0
}

async function main () {
  let browserHelper : any
  try {
    for (let index = CONFIG.indexError; index < TFE.length; index++) {
      CONFIG.indexError = index
      console.log(TFE[index].CNPJ)
      console.log(TFE[index].RAZAO)

      const cpfcnpj = TFE[index].CNPJ.replace(/-|\./gmi, '')
      const newBrowser = new CreateBrowser()
      const { browser, page } = await newBrowser.init()
      browserHelper = browser
      if (!await makeLogin(page, cpfcnpj, TFE[index].SENHA.toString())) {
        console.log('USUARIO OU SENHA INCORRETO')
        await browser.close()
        appendFileSync(resolve('./error.csv'), `${TFE[index].RAZAO};USUARIO OU SENHA INCORRETO\n`)
        continue
      }
      console.log('LOGIN OK')
      await page.waitForSelector('#headingTwo > h5 > button')
      await page.goto('https://duc.prefeitura.sp.gov.br/portal/forms/frm03_SituacaoCadastral.aspx', { waitUntil: 'networkidle0' })
      const unidadesEconomicas = await page.$$('#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_gvDados tbody tr')
      for (let i = 1; i < unidadesEconomicas.length - 1; i++) {
        await page.waitForSelector('#divProcessando', { hidden: true })

        const numberOffTheTR = (i + 1).toString().padStart(2, '0')
        await page.waitForSelector(`#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_gvDados_ctl${numberOffTheTR}_lblPendencia`)
        await page.waitForTimeout(2500)
        console.log(numberOffTheTR)
        // @ts-ignore
        const pendencia = await page.$eval(`#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_gvDados_ctl${numberOffTheTR}_lblPendencia`, element => element.textContent.trim()).catch(e => console.log(e))
        console.log(pendencia)
        // @ts-ignore
        const ativo = await page.$eval(`#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_gvDados_ctl${numberOffTheTR}_lblAtivo`, element => element.innerText)
        console.log(ativo)
        // if (pendencia === 'S' && ativo === 'S') {
        await page.click(`#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_gvDados_ctl${numberOffTheTR}_ccm_formatado_link`)
        await page.waitForSelector('#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_fdsTFE')

        const contentTFEsection = await page.$('#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_grdTFE_ctl02_chkDebito').catch(e => false)
        // console.log(contentTFEsection)
        if (!contentTFEsection) {
          console.log('ERRO AO CALCULAR TFE')
          appendFileSync(resolve('./error.csv'), `${TFE[index].RAZAO};Não há informações registradas para sugestões de recolhimentos de TFE\n`)
          await page.click('#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_uc_CabecalhoDebitos_btnListaCCMs')
          continue
        }
        console.log('RECALCULANDO TFE')
        await recalculateTFE(page)
        console.log('BAIXANDO BOLETO')
        // await page.waitForTimeout(1500)
        await page.waitForSelector('#divProcessando', { hidden: true })
        await page.click('#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_btnPagar')
        await page.waitForTimeout(5000)
        // console.log(browser.targets().length, browser.pages.length)
        // await page.waitForTimeout(3500900)
        await waitDownload(page, resolve('./downloads/'))
        await page.waitForTimeout(2000)
        renameSync(resolve('./downloads/boleto.pdf'), resolve(`./downloads/${TFE[index].RAZAO.trim().replace(/\.|\/|:/gmi, '')}.pdf`))
        await page.click('#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_uc_CabecalhoDebitos_btnListaCCMs')
      //  }
      }
      console.log('fimmmm')
      await browser.close()
    }

    return true
  } catch (error) {
    await browserHelper.close()
    console.log(error)
    return false
  }
}

(async () => {
  let canStop = false
  while (canStop === false) {
    const robo = await main()
    if (!robo) {
      if (CONFIG.atualTentativas === CONFIG.maxTentativas) {
        delete TFE[CONFIG.indexError]
        writeFileSync('../tfe.json', JSON.stringify(TFE.filter(item => item.RAZAO !== null)))
        CONFIG.atualTentativas = 0
        continue
      }
      CONFIG.atualTentativas++
      continue
    }
    canStop = true
  }
})()
