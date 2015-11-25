var redis = require("redis");

function bootstrapIndex(keyOverride) {
    var $redis = redis.createClient(),
        key = keyOverride;
        if (!key) {
            $redis.get('web:index:current', function (err, reply) {
                key = reply;
            })
        }
    return $redis.get('web:index:' + key);
}


module.exports = function(app) {
    app.get('*', function(req, res) {
        res.send(bootstrapIndex(req.body.revision));
    });
};
