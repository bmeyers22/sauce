var express = require('express'),
  router = express.Router(),
  redis = require("redis");

module.exports = function (app) {
  app.use('/', router);
};

function bootstrapIndex(keyOverride) {
  let $redis = redis.createClient(),
    key = keyOverride || $redis.get('web:current');
  return $redis.get(key);
}


router.get('/', function (req, res, next) {
    res.send(bootstrapIndex());
});
