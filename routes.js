var redis = require("redis");

function bootstrapIndex(keyOverride, res) {

    var $redis = redis.createClient(),
        key = keyOverride;
    if (!key) {
        $redis.get('web:index:current', function (err, reply) {
            $redis.get('web:index:' + reply, function (err, reply) {
                return res.send(reply)
            });
        })
    } else {
        $redis.get('web:index:' + key, function (err, reply) {
            return res.send(reply)
        });
    }
}


module.exports = function(app) {
    app.get('*', function(req, res) {
        bootstrapIndex(req.body.revision, res);
    });
};
