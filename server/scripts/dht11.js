const pythonShell = require('python-shell');
const path = require('path');

var options = {
  mode: 'json',
  scriptPath: path.join(__dirname, '../i2c'),
  args: ['21']
}

var isErred = false;
var currentData = {
  time: 0,
  temperature: 0,
  humidity: 0
}

let pythonProcess = pythonShell.PythonShell.run('dht11_interface.py', options, (err) => {
  if (err) {
    console.error(err);
    isErred = true;
  }
});

pythonProcess.on('message', (msg) => {
  currentData = msg;
});

function health() {
  return isErred ? 'Error occured' : 'Healthy';
}

function data(rpio, params) {
  return currentData;
}

module.exports = {
  health: health,
  data: data
}