import os
import re

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait


BASE_URL = os.getenv(
    "BASE_URL",
    "http://127.0.0.1:8000/?balance=30000&reserved=20001",
)


@pytest.fixture
def driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1400,1000")

    chrome_bin = os.getenv("CHROME_BIN")
    if chrome_bin:
        options.binary_location = chrome_bin

    chromedriver_path = os.getenv("CHROMEDRIVER_PATH")
    service = Service(chromedriver_path) if chromedriver_path else Service()

    driver = webdriver.Chrome(service=service, options=options)
    driver.implicitly_wait(2)

    yield driver

    driver.quit()


def open_transfer_form(driver):
    driver.get(BASE_URL)
    driver.find_element(By.XPATH, "//*[contains(text(), 'Рубли')]").click()


def page_text(driver):
    return driver.find_element(By.TAG_NAME, "body").text


def card_input(driver):
    return driver.find_element(By.CSS_SELECTOR, "input")


def amount_inputs(driver):
    inputs = driver.find_elements(By.CSS_SELECTOR, "input[placeholder='1000']")
    return [input_field for input_field in inputs if input_field.is_displayed()]


def amount_input(driver):
    WebDriverWait(driver, 3).until(lambda d: len(amount_inputs(d)) > 0)
    return amount_inputs(driver)[0]


def enter_card(driver, card_number):
    field = card_input(driver)
    field.clear()
    field.send_keys(card_number)


def enter_amount(driver, amount):
    field = amount_input(driver)
    field.clear()
    field.send_keys(str(amount))


def set_amount_by_js(driver, amount):
    field = amount_input(driver)

    driver.execute_script(
        """
        const input = arguments[0];
        const value = arguments[1];

        input.focus();
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.blur();
        """,
        field,
        str(amount),
    )


def visible_transfer_buttons(driver):
    buttons = driver.find_elements(
        By.XPATH,
        "//button[contains(., 'Перевести')]",
    )
    return [button for button in buttons if button.is_displayed()]


def commission_text(driver):
    text = page_text(driver)
    match = re.search(r"Комиссия:\s*\d+\s*₽", text)
    return match.group(0) if match else ""


def test_successful_transfer_available_for_valid_data(driver):
    open_transfer_form(driver)
    enter_card(driver, "1111222233334444")
    enter_amount(driver, 1000)

    assert visible_transfer_buttons(driver), (
        "Для валидной карты и допустимой суммы должна отображаться кнопка «Перевести»"
    )


def test_insufficient_funds_message_is_shown(driver):
    open_transfer_form(driver)
    enter_card(driver, "1111222233334444")
    enter_amount(driver, 9100)

    assert "Недостаточно средств" in page_text(driver), (
        "При недостатке средств должно отображаться сообщение об ошибке"
    )

    assert not visible_transfer_buttons(driver), (
        "Кнопка «Перевести» не должна отображаться при недостатке средств"
    )


def test_br_01_commission_calculated_correctly_for_boundary_amount(driver):
    open_transfer_form(driver)
    enter_card(driver, "1111222233334444")
    enter_amount(driver, 9090)

    actual_commission = commission_text(driver)

    assert "909" in actual_commission, (
        "BR-01 BUG: комиссия рассчитана неверно. "
        f"Для суммы 9090 ожидается комиссия 909 ₽, получено: {actual_commission}"
    )

    assert visible_transfer_buttons(driver), (
        "Перевод должен быть доступен, так как 9090 + 909 = 9999"
    )


def test_br_02_card_number_more_than_16_digits_is_rejected(driver):
    open_transfer_form(driver)
    enter_card(driver, "11112222333344445")

    assert not amount_inputs(driver), (
        "BR-02 BUG: поле суммы отображается для номера карты длиной 17 цифр"
    )


def test_br_03_negative_amount_is_rejected(driver):
    open_transfer_form(driver)
    enter_card(driver, "1111222233334444")

    # Используется JS, потому что в некоторых браузерах Selenium не всегда
    # стабильно вводит минус в input type='number' через send_keys.
    set_amount_by_js(driver, -100)

    assert not visible_transfer_buttons(driver), (
        "BR-03 BUG: кнопка «Перевести» отображается для отрицательной суммы"
    )


def test_br_04_transfer_button_not_shown_without_amount(driver):
    open_transfer_form(driver)
    enter_card(driver, "1111222233334444")

    assert not visible_transfer_buttons(driver), (
        "BR-04 BUG: кнопка «Перевести» отображается без ввода суммы"
    )