import sys
import RPi.GPIO as GPIO
import dht11
import time
import json

# initialize GPIO
GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM)
GPIO.cleanup()

# read data using pin 14
pin = int(sys.argv[1])
instance = dht11.DHT11(pin)

while True:
    result = instance.read()
    if result.is_valid():
        data = {}
        data['time'] = str(time.strftime(
            "%D %H:%M:%S", time.localtime(time.time())))
        data['temperature'] = result.temperature
        data['humidity'] = result.humidity
        print(json.dumps(data))
        sys.stdout.flush()

    time.sleep(1)
