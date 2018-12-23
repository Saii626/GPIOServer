const pythonShell = require('python-shell');
const path = require('path');
const request = require('request');
const moment = require('moment');

var options = {
  mode: 'text',
  scriptPath: path.join(__dirname, '../i2c')
}

var currentHealth = {
  status: 'healthy',
  error: null
};

let pythonProcess = new pythonShell.PythonShell('lcd_interface.py', options);

// Line 1 : Date and Time
let timeLoop = setInterval(() => {

  // 11:30:05pm 23th Sat
  let time = moment().format('hh:mm:ssa  Do ddd');
  showMsg(time, 1);
}, 200);

pythonProcess.on('message', (msg) => {
  console.log(msg);
})


// Line 3 and 4 : Display msgs via web request
let displayMessages = []

function displayLoop(iteration) {

  function updateDisplayMessages(msg) {
    if (msg.repeat == 0) {
      displayMessages.shift()
      displayMessages.push(msg);
    } else if (msg.repeat == 1) {
      displayMessages.shift();
    } else if (msg.repeat > 1) {
      msg.repeat = msg.repeat - 1;
    }
  }

  if (displayMessages && displayMessages.length > 0) {
    let msgToShow = displayMessages[0];

    if (msgToShow.msg) {
      let pos = iteration * 40;
      let line1 = msgToShow.msg.substr(pos, pos + 20);
      let line2 = msgToShow.msg.substr(pos + 20, pos + 40);

      showMsg((line1 && line1.length > 0) ? line1 : ' ', 3);
      showMsg((line2 && line2.length > 0) ? line2 : ' ', 4);

      let nextIter = iteration + 1;

      if (msgToShow.msg.length < (pos + 40)) {
        updateDisplayMessages(msgToShow);
        nextIter = 0;
      }

      setTimeout(() => {
        displayLoop(nextIter);
      }, msgToShow.duration * 1000);

    } else if (msgToShow.lines && msgToShow.lines.length > 0) {
      let line1 = msgToShow.lines[iteration * 2];
      let line2 = msgToShow.lines[iteration * 2 + 1];

      showMsg(line1 || ' ', 3);
      showMsg(line2 || ' ', 4);

      let nextIter = iteration + 1;

      if (msgToShow.lines.length < nextIter * 2) {
        updateDisplayMessages(msgToShow);
        nextIter = 0;
      }

      setTimeout(() => {
        displayLoop(nextIter);
      }, msgToShow.duration * 1000);
    }

  } else {
    showMsg(' ', 3);
    showMsg(' ', 4);
    setTimeout(() => {
      displayLoop(0);
    }, 2000);
  }
};

displayLoop(0);

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
        repeat: '0...5' // 0 for infinite, default 1
      },

      displayMsg_2: {
        lines: '[String]',
        duration: '0...10s',
        repeat: '1...5' // 0 for infinite, default 1
      },
      displayLine: {
        line: 'String' // display line on Line 2 of LCD
      }
    }],
    working: 'Shows the string'
  }
}

class Message {
  constructor(params) {
    this.msg = params.msg || null;
    this.lines = params.lines || null;
    this.duration = (params.duration && params.duration < 10) ? params.duration : 5;
    this.repeat = (params.repeat && params.repeat < 10) ? params.repeat : 1;
    this._noOfMessages = this.msg ? Math.ceil(this.msg.length / 40) : Math.ceil(this.lines.length / 2);
    this._totalTime = this._noOfMessages * this.duration;
  }
}

function displayMsg(rpio, params) {
  if (params.msg) {
    if ((params.msg && params.msg.length > 0) || (params.lines && params.lines.length > 0)) {
      let message = new Message(params);
      checkAndAddMsgToDisplayLoop(message);
      let messageInterlude = new Message({
        msg: ' ',
        duration: 1
      });
      displayMessages.push(messageInterlude);
      return message;
    } else {
      return {
        status: 'error',
        error: 'msg can not be empty'
      }
    }
  }
}

function checkAndAddMsgToDisplayLoop(msg) {
  let totalMsgDuration = 0;
  displayMessages.forEach((message) => {
    totalMsgDuration = totalMsgDuration + message._totalTime * message.repeat;
  });

  totalMsgDuration = totalMsgDuration + msg._totalTime * msg.repeat;

  if (totalMsgDuration > 86400) {
    let postData = {
      title: "LCD Display",
      body: "Msg Buffer 1 day timeout reached. Resetting buffer"
    }
    request.post('https://saikat.app/notify/zuk', {
      form: postData
    }, function(err, res, body) {
      if (err) {
        console.error(err);
      }
    });

    displayMessages = [];
  }
  displayMessages.push(msg);
}

// Line 2 : Usaually to show temperature and humidity
function displayLine(rpio, params) {
  if (params.line) {
    showMsg(params.line, 2);
  } else {
    return {
      status: 'error',
      error: 'line can not be empty'
    }
  }
}

// Currently not exported and used
function clear() {
  let sendObj = {
    command: 'clear'
  }
  pythonProcess.send(JSON.stringify(sendObj));
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
  pythonProcess.send(JSON.stringify(sendObj));
}

module.exports = {
  health: health,
  info: info,
  displayMsg: displayMsg,
  displayLine: displayLine
}