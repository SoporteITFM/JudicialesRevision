/**
 * Script de automatización de login con Playwright - PJF Juicio en Línea
 * Requiere: PJF_USER y PJF_PASS en archivo .env
 */

const { chromium } = require('playwright');
require('dotenv').config();

// Selectores del formulario de login (ajustar si la página cambia)
const SELECTOR_INPUT_USUARIO = '#UserName';
const SELECTOR_INPUT_PASSWORD = '#UserPassword';
const SELECTOR_BOTON_LOGIN = '#btnIngresaLogin';
const SELECTOR_ROL = 'input[type="image"][src*="rol-p-juridica-privada"]';
const SELECTOR_CONSULTA = '.btnConsultaExpediente';
const URL_LOGIN = 'https://www.serviciosenlinea.pjf.gob.mx/juicioenlinea/Home/Login';

async function main() {
  // 4. Validar que las variables de entorno existan
  const PJF_USER = process.env.PJF_USER;
  const PJF_PASS = process.env.PJF_PASS;

  if (!PJF_USER || PJF_USER.trim() === '') {
    throw new Error(
      'Falta la variable PJF_USER. Asegúrate de definirla en el archivo .env'
    );
  }
  if (!PJF_PASS || PJF_PASS.trim() === '') {
    throw new Error(
      'Falta la variable PJF_PASS. Asegúrate de definirla en el archivo .env'
    );
  }

  // 5. Abrir navegador Chromium visible
  //const browser = await chromium.launch({ headless: false });

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  try {
    // 6. Crear contexto y página
    //const context = await browser.newContext();
    const context = await browser.newContext({
        viewport: null
      });

    const page = await context.newPage();

    // 7. Ir a la URL del login
    await page.goto(URL_LOGIN);

    // 8. Esperar a que el input de usuario esté visible
    await page.waitForSelector(SELECTOR_INPUT_USUARIO, { state: 'visible' });

    // 9. Escribir el usuario
    await page.fill(SELECTOR_INPUT_USUARIO, PJF_USER);

    // 10. Escribir la contraseña
    await page.fill(SELECTOR_INPUT_PASSWORD, PJF_PASS);

    // 11. Click en el botón de login
    await page.click(SELECTOR_BOTON_LOGIN);
    console.log("URL después del login:", page.url());

    await page.waitForSelector(SELECTOR_ROL, { state: 'visible' });
    await page.click(SELECTOR_ROL);
    console.log("Rol seleccionado");

    const botonConsulta = page.locator(
      'a[href="/juicioenlinea/juicioenlinea/Expediente/GetMapa"]'
    );
    await botonConsulta.click();
    await page.waitForSelector('#AjaxContainer', { state: 'visible' });
    console.log("Entramos a Consulta de datos públicos");

    // Selección de circuito (una sola vez)
    await page.waitForSelector('#ddlCircuito_chosen');
    await page.locator('#ddlCircuito_chosen').click();
    await page.locator('#ddlCircuito_chosen')
      .getByText('SÉPTIMO CIRCUITO', { exact: true })
      .click();
    console.log("Circuito seleccionado");

    // Abrir selector de órgano jurisdiccional
    await page.locator('#ddlOrgano_chosen').click();

   // Seleccionar el juzgado dentro del dropdown
   await page.locator('#ddlOrgano_chosen .chosen-results li')
   .filter({ hasText: 'Juzgado Octavo de Distrito' })
   .click();
   console.log("Juzgado seleccionado");
   
   //Seleccionar el amparo
   await page.locator('a').filter({ hasText: 'Amparo Indirecto' }).click();
   await page.getByRole('listitem').filter({ hasText: /^Amparo Indirecto$/ }).click();
   console.log("Amparo seleccionado");

    // Llenar número de expediente
    await page.getByRole('textbox', { name: 'Ejemplo: 1/' }).click();
    await page.getByRole('textbox', { name: 'Ejemplo: 1/' }).fill('408/2025');
    console.log("Expediente Lleno");                         

    // Botón Buscar abre una nueva pestaña: esperar el evento y cargar la página
    const page1Promise = page.waitForEvent('popup');
    await page.getByRole('button', { name: ' Buscar' }).click();
    const page1 = await page1Promise;
    console.log("Pagina abierta");

    await page1.locator('#grvAcuerdos_ctl85_lnkTicketLink2').click();
    console.log("Leyendo sintesis");

    // 12. Esperar navegación después del login
    await page.waitForLoadState('networkidle');

    // 13. Mensaje de éxito
    console.log('Login ejecutado');
  } catch (error) {
    // 14. Mostrar error en consola
    console.error('Error durante el login:', error.message);
    throw error;
  }

  // 15. NO cerramos el navegador: se deja abierto para inspección
  // browser.close(); <- intencionalmente omitido
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
