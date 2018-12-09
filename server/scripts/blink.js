var pin = -1;
var isRunning = false;

function start(rpio, params) {
  if (pin != -1) {
    restart(rpio, params);
    return 'Restarting';
  }
  pin = params.pin || 12;
  rpio.open(pin, rpio.OUTPUT, rpio.LOW);
  isRunning = true;
  loop(rpio, params.timeout);
  return 'Starting';
}

function stop(rpio, params) {
  isRunning = false;
  return 'Stopping'
}

function info() {
  return `Request body template
{
  pin: Number (optional, default value 12),
  timeout: Number (optional, timeout in miliseconds, default value 1000)
}
  `
}

function restart(rpio, params) {
  stop(rpio, params);
  setTimeout(() => {
    run(rpio, params)
  }, 3 * (params.timeout || 1000));
}

function loop(rpio, timeout) {
  interval = timeout || 1000;
  setInterval(() => {
    if (isRunning) {
      rpio.write(pin, rpio.HIGH);
      console.log('high');
      setTimeout(() => {
        rpio.write(pin, rpio.LOW);
        console.log('low');
      }, interval);
    } else {
      rpio.close(pin);
      pin = -1;
    }
  }, 2 * interval);
}

module.exports = {
  start: start,
  stop: stop,
  info: info
}