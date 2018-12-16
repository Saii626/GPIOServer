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

  showMsg(timeShow, 1);
}, 300);

pythonProcess.on('message', (msg) => {
  console.log(msg);
})

function health() {
  return currentHealth;
}

function info() {
  return {
    name: 'lcd',
    requestOptions: {
      msg: 'String (message to show on the screen, required)',
      line: 'Number(on which line(1-4) message will be shown, required)'
    },
    working: 'Shows the string on specified line'
  }
}

function displayMsg(rpio, params) {
  if (params.msgs) {
    for (msg of params.msgs) {
      displayMsg(rpio, msg);
    }
    return;
  }
  if (params.msg && params.line) {
    if (validLines.indexOf(parseInt(params.line)) > -1) {
      showMsg(params.msg, params.line);
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

function flashMsg(rpio, params) {
  if (params.msgs) {
    for (msg of params.msgs) {
      flashMsg(rpio, msg);
    }
    return;
  }
  displayMsg(rpio, params);
  setTimeout(clearLine, params.timeout || 5000, rpio, params)
}

function clearLine(rpio, params) {
  if (params.line && validLines.indexOf(parseInt(params.line)) > -1) {
    showMsg('', params.line);
    return {
      status: 'Success'
    };
  } else {
    return {
      error: 'error',
      reason: 'Line must be present and should have value in between 1-4 inclusive'
    };
  }
}

function clear() {
  let sendObj = {
    command: 'clear'
  }
  pythonProcess.send(JSON.stringify(sendObj));
}

function showMsg(msg, line) {
  if (msg.length < 20) {
    let remaingLength = 20 - msg.length;
    msgToShow = msg.concat(' '.repeat(remaingLength));
  } else {
    msgToShow = msg.substr(0, 20);
  }
  let sendObj = {
    command: 'display',
    args: [msgToShow, parseInt(line)]
  }
  pythonProcess.send(JSON.stringify(sendObj));
}


module.exports = {
  health: health,
  info: info,
  displayMsg: displayMsg,
  flashMsg: flashMsg,
  clearLine: clearLine,
  clear: clear
}