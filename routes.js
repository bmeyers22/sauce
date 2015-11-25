var redis = require("redis");

function bootstrapIndex(keyOverride) {
    var $redis = redis.createClient(),
    key = keyOverride || $redis.get('web:index:current');
    return $redis.get('web:index:' + key);
}


module.exports = function(app) {
    app.get('*', function(req, res) {
        res.send(bootstrapIndex());
    });
};
