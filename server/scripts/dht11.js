const pythonShell = require('python-shell');
const path = require('path');
const request = require('request');

var options = {
  mode: 'json',
  scriptPath: path.join(__dirname, '../i2c'),
  args: ['21']
}

var currentHealth = {
  status: 'healthy',
  error: null
};

var currentData = {
  time: 0,
  temperature: 0,
  humidity: 0
}

let pythonProcess = pythonShell.PythonShell.run('dht11_interface.py', options, (err) => {
  if (err) {
    currentHealth.status = 'error';
    currentHealth.error = err;
  }
});

pythonProcess.on('message', (msg) => {
  currentData = msg;

  let postMsg = 'Temp: ' + currentData.temperature + 'C  Humd: ' + currentData.humidity + '%'

  const postData = {
    msg: postMsg,
    line: 2
  }
  request.post('http://localhost:8040/lcd/displayMsg', {
    json: postData
  }, function(err, res, body) {
    if (err) {
      console.error(err);
    }
  });
});

function health() {
  return currentHealth;
}

function data(rpio, params) {
  return currentData;
}

module.exports = {
  health: health,
  data: data
}