

var express = require('express'),
    rollbar = require('rollbar'),
    config = require('./config/config'),
    InvoiceWatcher = require('./app/services/InvoiceWatcher');

var app = express();

app.use(rollbar.errorHandler('f49a7120fe8d4d6f8a3b78602b5ae3f6'));

require('./config/express')(app, config);

app.listen(config.port, function () {
    console.log('Express server listening on port ' + config.port);
});

InvoiceWatcher.start();
