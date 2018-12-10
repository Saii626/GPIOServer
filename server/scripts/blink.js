var pin = -1;
var eventLoop = null;

function start(rpio, params) {
  if (eventLoop !== null) {
    stop(rpio, params);
    setTimeout(start, 1000, rpio, params);
    return 'Restarting';
  }
  pin = params.pin || 12;
  rpio.open(pin, rpio.OUTPUT, rpio.LOW);

  //Loop
  let interval = params.timeout || 1000;
  eventLoop = setInterval(() => {
    rpio.write(pin, rpio.HIGH);
    console.log('high');
    setTimeout(() => {
      rpio.write(pin, rpio.LOW);
      console.log('low');
    }, interval);
  }, 2 * interval);
  return 'Starting';
}

function stop(rpio, params) {
  if (eventLoop !== null) {
    clearInterval(eventLoop);
    rpio.close(pin);
    pin = -1;
    eventLoop = null;
  }
  return 'Stopping'
}

function info() {
  return {
    name: 'blink',
    requestOptions: {
      pin: 'Number(optional, default value 12)',
      timeout: 'Number(optional, timeout in miliseconds, default value 1000)'
    },
    working: 'Repeatedly toggles pin from HIGH to LOW after each timeout interval'
  }
}

module.exports = {
  start: start,
  stop: stop,
  info: info
}