const moment = require('moment');

class Message {
  constructor(params) {
    this.msg = params.msg || null;
    this.duration = (params.duration && params.duration < 10) ? params.duration : 5;
    if (params.priority) {
      if (typeof params.priority === 'number') {
        this.priority = (params.priority > 0 && params.priority <= 10) ? params.priority : 5;
      } else if (typeof params.priority === 'string') {
        switch (params.priority) {
          case 'HIGH':
            this.priority = 10;
            break;
          case 'MEDIUM':
            this.priority = 5;
            break;
          case 'LOW':
            this.priority = 1;
            break;
        }
      }
    }
    this.priority = this.priority || 5;
    this.timestamp = moment();
  }

  setLinesArray(length) {
    let lines = [];
    let words = this.msg.split(' ').filter((word) => {
      return word.length > 0
    });
    let unfilledLine = false;

    while (words.length !== 0) {
      let line = '';

      if (words[0].length > length) {
        let iteration = 0;
        while (words[0].length > length * iteration) {
          let part = words[0].substr(length * iteration, length);
          lines.push(part);
          iteration++;
        }
        words.shift();
        unfilledLine = true;
        continue;
      }

      line = unfilledLine ? lines.pop() : words.shift();
      unfilledLine = false;
      while (words[0] && line.length + words[0].length + 1 <= length) {
        line += ` ${words[0]}`;
        words.shift();
      }
      lines.push(line);
    }

    this.lines = lines;
  }
}

class MessageService {

  constructor(params) {
    this.messageList = [];
    this.bufferSize = params.bufferSize;
    this.bufferOverflowCallback = params.bufferOverflowCallback;
  }

  getNextMessage() {
    return this.messageList.shift() || null;
  }

  resetMessageList() {
    this.messageList = [];
  }

  addToQueue(message) {
    if (message instanceof Message) {
      if (this.messageList.length === this.bufferSize) {
        this.bufferOverflowCallback(this.messageList.pop());
      }
      let posToInsert = 0;
      for (let i = 0; i < this.messageList.length; i++) {
        if (this.messageList[i].priority > message.priority) {
          continue;
        } else if (this.messageList[i].priority === message.priority) {
          if (this.messageList[i].timestamp.isBefore(message.timestamp)) {
            continue;
          } else {
            posToInsert = i;
            break;
          }
        } else {
          posToInsert = i;
          break;
        }
      }
      this.messageList.splice(posToInsert, 0, message);
    } else {
      return new Error('Not a Message type');
    }
  }
}

module.exports = {
  Message: Message,
  MessageService: MessageService
}