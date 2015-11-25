var redis = require("redis");

function bootstrapIndex(keyOverride) {
    var $redis = redis.createClient(),
    key = keyOverride || $redis.get('web:current');
    return $redis.get(key);
}


module.exports = function(app) {
    app.get('*', function(req, res) {
        res.send(bootstrapIndex());
    });
};
