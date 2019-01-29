const pythonShell = require('python-shell');
const path = require('path');
const request = require('request');
const fs = require('fs');

var options = {
  mode: 'json',
  scriptPath: path.join(__dirname, '../i2c'),
  args: ['21']
}

var isMock = true;

var currentHealth = {
  status: 'healthy',
  error: null
};

let currentData = {
  time: 0,
  temperature: 0,
  humidity: 0
}

let pythonProcess;

let Resources = null;

function initialize() {
  Resources = require('../resources.js')(isMock);
  if (!isMock) {
    pythonProcess = pythonShell.PythonShell.run('dht11_interface.py', options, (err) => {
      if (err) {
        currentHealth.status = 'error';
        currentHealth.error = err;
      }
    });

    pythonProcess.on('message', (msg) => {
      currentData = msg;

      let postMsg = 'Temp: ' + currentData.temperature + 'C  Humd: ' + currentData.humidity + '%'

      const postData = {
        line: postMsg
      }
      request.post('http://localhost:8040/lcd/displayLine', {
        json: postData
      }, function(err, res, body) {
        if (err) {
          console.error(err);
        }
      });
    });
  }
}

// Storing data to harddisk every 5 mins
function storeData() {
  if (currentData.temperature == 0 && currentData.humidity == 0) {
    setTimeout(storeData, 2000); // Data not initialized. Retry after 2 seconds
    return;
  }

  fs.access(Resources.dh11_fileLocation, fs.constants.F_OK, (err) => {
    if (err) {
      fs.open(Resources.dh11_fileLocation, 'w', (err, fd) => {
        if (err) {
          console.error(err);
          return
        }
        fs.write(fd, 'timestamp,temperature,humidity\n', (err, written, str) => {
          if (err) {
            console.error(err);
          }
        })
      })
    }
  });
  fs.appendFile(Resources.dh11_fileLocation, `${currentData.time},${currentData.temperature},${currentData.humidity}\n`, (err) => {
    console.log(err);
  });

  setTimeout(storeData, 1000 * 60 * 5); // Store after 5 mins
}
storeData();

function health() {
  return currentHealth;
}

function data(rpio, params) {
  return currentData;
}

function info() {
  return {
    name: 'dht11',
    working: 'Returns currentData. It contains temperature, humidity and timestamp'
  }
}

module.exports = (params) => {
  isMock = params.isMock;
  initialize();
  return {
    health: health,
    data: data,
    dataFile: Resources.dh11_fileLocation,
    info: info
  }
}