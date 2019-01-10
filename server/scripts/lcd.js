const pythonShell = require('python-shell');
const path = require('path');
const moment = require('moment');
const {
  Message,
  MessageService
} = require('../helper_scripts/message-module.js');

var options = {
  mode: 'text',
  scriptPath: path.join(__dirname, '../i2c')
}

var isMock = true;

var currentHealth = {
  status: 'healthy',
  error: null
};

if (!isMock) {
  let pythonProcess = new pythonShell.PythonShell('lcd_interface.py', options);

  pythonProcess.on('message', (msg) => {
    console.log(msg);
  })
}
// Line 1 : Date and Time
if (!isMock) {
  let timeLoop = setInterval(() => {

    // 11:30:05pm 23th Sat
    let time = moment().format('hh:mm:ssa  Do ddd');
    showMsg(time, 1);
  }, 200);
}

// Line 3 and 4 : Display msgs via web request
let msgService = new MessageService({
  bufferSize: 100,
  bufferOverflowCallback: (msg) => {
    if (msg.priority >= 5) {
      let postData = {
        title: "LCD Display",
        body: "Medium priority msgs are being dropped"
      }
      require('request').post('http://localhost:8020/zuk', {
        form: postData
      }, function(err, res, body) {
        if (err) {
          console.error(err);
        }
      });
    }
  }
});

function displayLoop(msg, iteration) {
  if (msg && msg.lines.length > iteration * 2) {
    showMsg(msg.lines[iteration * 2] || ' ', 3);
    showMsg(msg.lines[iteration * 2 + 1] || ' ', 4);

    setTimeout(() => {
      displayLoop(msg, iteration + 1)
    }, msg.duration * 1000);
  } else if (msg && msg.lines.length <= iteration * 2) {
    showMsg(' ', 3);
    showMsg(' ', 4);

    setTimeout(() => {
      displayLoop(null, 0);
    }, 1000);
  } else {
    let nextMsg = msgService.getNextMessage();
    if (nextMsg) {
      displayLoop(nextMsg, 0);
    } else {
      setTimeout(() => {
        displayLoop(null, 0)
      }, 2000);
    }
  }
}

displayLoop(null, 0);

// API facing functions
function health() {
  return currentHealth;
}

function info() {
  return {
    name: 'lcd',
    requestOptions: [{
      displayMsg_1: {
        msg: 'String',
        duration: '0...10s',
        priority: '1...10 || {HIGH, MEDIUM, LOW}'
      },

      displayLine: {
        line: 'String' // display line on Line 2 of LCD
      }
    }],
    working: 'Shows the string'
  }
}


function displayMsg(rpio, params) {
  if (params.msg) {
    if (params.msg && params.msg.length > 0) {
      let message = new Message(params);
      message.setLinesArray(20);
      msgService.addToQueue(message);
      return message;
    } else {
      return {
        status: 'error',
        error: 'msg can not be empty'
      }
    }
  }
}

// Line 2 : Usaually to show temperature and humidity
function displayLine(rpio, params) {
  if (!isMock) {
    if (params.line) {
      showMsg(params.line, 2);
    } else {
      return {
        status: 'error',
        error: 'line can not be empty'
      }
    }
  } else {
    console.log(`Display line: ${params}`);
  }
}

// Currently not exported and used
function clear() {
  let sendObj = {
    command: 'clear'
  }
  if (!isMock) {
    pythonProcess.send(JSON.stringify(sendObj));
  } else {
    console.log('Clear display');
  }
}

// Internal function to talk to underlying python script to display msg
function showMsg(msg, line) {
  if (!msg) {
    return;
  }
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
  if (!isMock) {
    pythonProcess.send(JSON.stringify(sendObj));
  } else {
    let color;
    switch (line) {
      case 1:
        color = '\x1b[36m'; // Cyan
        break;
      case 2:
        color = '\x1b[31m'; // Red
        break;
      case 3:
      case 4:
        color = '\x1b[32m'; // Green
        break;
      default:
        color = '\x1b[37m'; //White
    }
    console.log(`${color}%s\x1b[0m`, `Line: ${line}\tStr: ${msgToShow}`);
  }
}

module.exports = (params) => {
  isMock = params.isMock;
  return {
    health: health,
    info: info,
    displayMsg: displayMsg,
    displayLine: displayLine
  }
}