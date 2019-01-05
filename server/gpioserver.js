const express = require('express');
const app = express();
const http = require('http');
const httpServer = http.createServer(app);
const request = require('request');
const fs = require('fs');
const path = require('path');
const rpio = require('rpio');

app.use(express.json());

let options = {
  gpiomem: true,
  mapping: 'gpio'
}

if (process.env.NODE_ENV !== 'production') {
  options.mock = 'raspi-3';
}
rpio.init(options);

var scripts = [];
const scriptFolder = path.join(__dirname, './scripts');
fs.readdir(scriptFolder, (err, files) => {
  if (err) {
    console.error(err);
    return;
  }

  for (let file of files) {
    let stat = fs.statSync(scriptFolder + '/' + file);
    if (stat.isFile() && file.slice(-2) == 'js') {
      scripts.push({
        file: file.substring(0, file.length - 3),
        exec: require('./scripts/' + file)
      });
    }
  }
});

app.post('/:script/:action', (req, res) => {
  for (let script of scripts) {
    if (script.file === req.params.script) {
      res.send(script.exec[req.params.action](rpio, req.body));
      return;
    }
  }

  res.send('No script found');
});

app.get('/:script/:action/', (req, res) => {
  for (let script of scripts) {
    if (script.file === req.params.script) {
      res.send(script.exec[req.params.action](rpio, req.query));
      return;
    }
  }
  res.send('No script found');
});

function registerSelf() {
  const postData = {
    path: 'gpio',
    ip: 'http://localhost:8040',
    name: 'gpio'
  }

  request.post('http://localhost:8000/register', {
    form: postData
  }, function(err, res, body) {
    if (res && res.statusCode && (res.statusCode === 200 || res.statusCode === 204)) {
      console.log("Successfully registered");
    } else {
      console.log("Will retry");
      setTimeout(registerSelf, 2000);
    }
  });
}

httpServer.listen(process.env.PORT || 8040, function() {

  if (process.env.NODE_ENV === 'production') {
    registerSelf();
  }
  console.log("Server started on port: " + httpServer.address().port);
});