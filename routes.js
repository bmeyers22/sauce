var redis = require("redis");

function bootstrapIndex(keyOverride, res) {

    var $redis = redis.createClient(),
        key = keyOverride;
    $redis.auth(process.env.REDIS_PASSWORD);
    if (!key) {
        $redis.get('web:index:current', function (err, reply) {
            $redis.get('web:index:' + reply, function (err, reply) {
                return res.send(reply || "Hello");
            });
        })
    } else {
        $redis.get('web:index:' + key, function (err, reply) {
            return res.send(reply || "hello");
        });
    }
}


module.exports = function(app) {
    app.get('*', function(req, res) {
        bootstrapIndex(req.body.revision, res);
    });
};
