const { Builder, By } = require('selenium-webdriver');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async function testCardBug() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    await driver.get('http://localhost:8000/?balance=30000&reserved=20001');

    await driver.findElement(By.xpath("//*[contains(text(),'Рубли')]")).click();

    let cardInput = await driver.findElement(By.css("input"));
    await cardInput.sendKeys("11112222333344445");

    await sleep(1000);

    let amountInputs = await driver.findElements(By.css("input[placeholder='1000']"));

    if (amountInputs.length > 0) {
      throw new Error("BUG: поле суммы появилось для карты длиной 17 цифр");
    }

    console.log("OK");

  } catch (e) {
    console.error("TEST FAILED:", e.message);
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();