const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForTransferButton(driver, timeoutMs = 3000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const buttons = await driver.findElements(
      By.xpath("//button[contains(., 'Перевести')]")
    );

    if (buttons.length > 0) {
      return true;
    }

    await sleep(200);
  }

  return false;
}

(async function testNegativeAmount() {
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

    inputs = await driver.findElements(By.css("input[placeholder='1000']"));
    const amountInput = inputs[0];

    // Надёжно устанавливаем отрицательное значение через JS
    await driver.executeScript(`
      const input = arguments[0];
      input.focus();
      input.value = '-100';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.blur();
    `, amountInput);

    await sleep(1000);

    // Проверяем, что значение реально установилось
    const actualValue = await amountInput.getAttribute('value');
    console.log('Amount field value:', actualValue);

    const buttonAppeared = await waitForTransferButton(driver, 3000);

    if (buttonAppeared) {
      throw new Error('BUG: появилась кнопка перевода на отрицательную сумму');
    }

    console.log('PASS: пройден тест на проверку отрицательной суммы');
  } catch (e) {
    console.error('FAIL:', e.message);
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();