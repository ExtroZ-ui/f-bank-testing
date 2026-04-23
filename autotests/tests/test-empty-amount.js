const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async function testEmptyAmount() {
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

    let inputs = await driver.findElements(By.css('input'));
    await inputs[0].sendKeys('1111222233334444');

    await sleep(1000);

    const transferButtons = await driver.findElements(
      By.xpath("//button[contains(., 'Перевести')]")
    );

    if (transferButtons.length > 0) {
      throw new Error('BUG: кнопка перевода появилась без ввода суммы');
    }

    console.log('PASS: пройден тест на проверку пустого количества');
  } catch (e) {
    console.error('FAIL:', e.message);
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();