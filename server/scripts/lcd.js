const pythonShell = require('python-shell');
const path = require('path');

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
const validLines = [1, 2, 3, 4]

var options = {
  mode: 'text',
  scriptPath: path.join(__dirname, '../i2c')
}

var currentHealth = {
  status: 'healthy',
  error: null
};

let pythonProcess = new pythonShell.PythonShell('lcd_interface.py', options);

let timeLoop = setInterval(() => {
  let date = new Date();
  let hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;

  let min = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;

  let sec = date.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec;

  let month = monthNames[date.getMonth()];

  let day = date.getDate();
  day = (day < 10 ? "0" : "") + day;

  let timeShow = "  " + hour + ":" + min + ":" + sec + "  " + month + " " + day;

  let sendObj = {
    command: 'display',
    args: [timeShow, 1]
  }
  pythonProcess.send(JSON.stringify(sendObj));
}, 300);

pythonProcess.on('message', (msg) => {
  console.log(msg);
})

function health() {
  return currentHealth;
}

function displayMsg(rpio, params) {
  if (params.msg && params.line) {
    if (validLines.indexOf(parseInt(params.line)) > -1) {
      let sendObj = {
        command: 'display',
        args: [params.msg, parseInt(params.line)]
      }
      pythonProcess.send(JSON.stringify(sendObj));
      return {
        status: 'Success'
      };
    } else {
      return {
        error: 'error',
        reason: 'Line must be in between 1-4 inclusive'
      };
    }
  } else {
    return {
      error: 'error',
      reason: 'Must have msg and line in req body'
    }
  }
}
module.exports = {
  health: health,
  displayMsg: displayMsg
}