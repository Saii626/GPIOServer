import I2C_LCD_driver
import time
import sys
import json

mylcd = I2C_LCD_driver.lcd()

# lcd_display_string
# lcd_clear
# lcd_load_custom_chars
# lcd_write
# lcd_write_char


def display(string, line):
    mylcd.lcd_display_string(string, line, 0)


def clear():
    mylcd.lcd_clear()


while True:
    commandObj = json.loads(sys.stdin.readline())
    if "command" in commandObj:
        if commandObj["command"] == "display":
            display(commandObj["args"][0], int(commandObj["args"][1]))
        elif commandObj["command"] == "clear":
            clear()
    else:
        time.sleep(0.1)
