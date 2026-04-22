const { Builder, By } = require('selenium-webdriver');

(async function testBoundaryBug() {
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    await driver.get('http://localhost:8000/?balance=30000&reserved=20001');

    await driver.findElement(By.xpath("//*[contains(text(),'Рубли')]")).click();

    let inputs = await driver.findElements(By.css("input"));

    await inputs[0].sendKeys("1111222233334444");

    inputs = await driver.findElements(By.css("input"));

    await inputs[1].sendKeys("9099");

    let buttons = await driver.findElements(By.xpath("//button[contains(., 'Перевести')]"));

    if (buttons.length === 0) {
      throw new Error("BUG: перевод должен быть возможен, но кнопки нет");
    }

    console.log("OK");

  } catch (e) {
    console.error("TEST FAILED:", e.message);
    process.exit(1);
  } finally {
    await driver.quit();
  }
})();