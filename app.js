

var express = require('express'),
    config = require('./config/config'),
    redis = require("redis");

var app = express();

require('./config/express')(app, config);

app.listen(config.port, function () {
    console.log('Express server listening on port ' + config.port);
});

function bootstrapIndex(keyOverride) {
  var $redis = redis.createClient(),
    key = keyOverride || $redis.get('web:index:current');
  return $redis.get(key);
}


app.get('*', function (req, res, next) {
    res.send(bootstrapIndex());
});
