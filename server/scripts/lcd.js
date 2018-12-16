const pythonShell = require('python-shell');
const path = require('path');

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

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

module.exports = {
  health: health
}