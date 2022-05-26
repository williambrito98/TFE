import { Page } from 'puppeteer-core'

export async function recalculateTFE (page: Page) {
  const ARRAY = ['2021', '2020']
  let index = 2
  const positionYear = 1
  while (ARRAY.length !== 0) {
    const numberOffTheTR = index.toString().padStart(2, '0')
    const incidencia = await page.$eval(`#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_grdTFE_ctl${numberOffTheTR}_lblIncidencia`, element => element.textContent.trim()).catch(e => 'sem anos para comparar')
    if (incidencia === 'sem anos para comparar') break
    if (!ARRAY.includes(incidencia.split('/')[positionYear])) {
      index++
      continue
    }
    await page.click(`#ctl00_ctl00_ConteudoPrincipal_ContentPlaceHolder1_grdTFE_ctl${numberOffTheTR}_btnDetalhar`)
    await page.waitForSelector('body > div.ui-dialog.ui-corner-all.ui-widget.ui-widget-content.ui-front.ui-dialog-buttons.ui-draggable', { visible: true })
    await page.waitForTimeout(3000)
    await page.evaluate(() => {
      // @ts-ignore
      const iframe = document.querySelector('#jnlDetalhes').contentDocument
      iframe.querySelector('#txtVoTFEQtdEmpregado_06').value = '10'
      iframe.querySelector('#btnPagar_txtVoTFEQtdEmpregado_06').click()
    })
    await page.waitForTimeout(4500)
    await page.click('body > div.ui-dialog.ui-corner-all.ui-widget.ui-widget-content.ui-front.ui-dialog-buttons.ui-draggable > div.ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix > div > button')
    index++
  }
}
