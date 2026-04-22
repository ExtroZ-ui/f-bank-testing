const { Builder, By } = require('selenium-webdriver');

(async function testSuccess() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    await driver.get('http://localhost:8000/?balance=30000&reserved=20001');

    await driver.findElement(By.xpath("//*[contains(text(),'Рубли')]")).click();

    let inputs = await driver.findElements(By.css("input"));

    await inputs[0].sendKeys("1111222233334444");

    inputs = await driver.findElements(By.css("input"));

    await inputs[1].sendKeys("1000");

    console.log("OK: success test passed");

  } catch (e) {
    console.error("FAIL:", e);
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();