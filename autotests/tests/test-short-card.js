const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async function testShortCard() {
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--window-size=1400,1000');
  options.setChromeBinaryPath(process.env.CHROME_BIN);

  const service = new chrome.ServiceBuilder(process.env.CHROMEDRIVER_PATH);

  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .setChromeService(service)
    .build();

  try {
    await driver.get('http://127.0.0.1:8000/?balance=30000&reserved=20001');

    await driver.findElement(By.xpath("//*[contains(text(),'Рубли')]")).click();

    const cardInput = await driver.findElement(By.css('input'));
    await cardInput.sendKeys('111122223333444'); // 15 цифр

    await sleep(1000);

    const amountInputs = await driver.findElements(
      By.css("input[placeholder='1000']")
    );

    if (amountInputs.length > 0) {
      throw new Error('BUG: для номера карты длиной менее 16 цифр появилось поле сумма');
    }

    console.log('PASS: тест валидации на короткий номер карты пройден');
  } catch (e) {
    console.error('FAIL:', e.message);
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();