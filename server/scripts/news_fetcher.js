const request = require('request');

let interval = 3 // minutes
getNews();
let newsFetchLoop = setInterval(getNews, interval * 1000 * 60); // Producer

function setFetchRate(rpio, params) {
  interval = (params.interval && params.interval > 2) ? params.interval : interval;
  clearInterval(newsFetchLoop);
  newsFetchLoop = setInterval(getNews, interval * 1000 * 60);
}

class News {
  constructor(params) {
    this.timestamp = new Date(params.publishedAt);
    this.news = params.title;
    this.url = params.url;
  }
}

// Populate News array
let newsList = []; // Resource

function getNews() {
  const options = {
    url: 'https://newsapi.org/v2/top-headlines?country=in&pageSize=50',
    method: 'GET',
    headers: {
      authorization: 'fd5cae3f615841cf9e13b5dd7fbc0ef6'
    },
    json: true
  }

  request.get(options, function(err, res, body) {
    if (err) {
      console.error(err);
    } else {
      if (body.status && body.status === "ok") {
        body.articles.forEach((article) => {
          newsList.push(new News(article));
        });
      } else {
        console.log(res);
        console.log(body);
      }
    }
  });
}

// Consumer
function showNews() {
  if (newsList && newsList.length > 0) {
    let newsToShow = newsList.shift();

    let postData = {
      msg: newsToShow.news,
      duration: 4,
      priority: 'LOW'
    }
    request.post('http://localhost:8040/lcd/displayMsg', {
      json: postData
    }, function(err, res, body) {
      if (err) {
        console.error(err);
      }
    });
    setTimeout(showNews, 500);
  } else {
    setTimeout(showNews, 5000);
  }
}

showNews();

module.exports = (params) => {
  return {
    setFetchRate: setFetchRate,
    getNews: getNews
  }
}