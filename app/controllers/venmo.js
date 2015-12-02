'use strict';

var express = require('express'),
    _ = require('lodash'),
    router = express.Router(),
    Firebase = require("firebase"),
    request = require('request'),
    USE_DEV_PAYMENTS = true,
    config = require('../../config/config'),
    VenmoService = require('../services/VenmoService'),
    InvoicesService = require('../services/InvoicesService');

module.exports = function (app) {
    app.use('/', router);
};

var VenmoController = function VenmoController() {};
VenmoController.prototype = {
    /**
    * `VenmoPaymentsController.link()`
    */
    link: function link(req, res) {
        var ref = new Firebase(config.firebase.url),
            authCode = req.body.data.data.authorizationCode,
            userId = req.body.data.userId,
            venmoUsers = ref.child('venmoUsers/' + userId),
            userRef = ref.child('users/' + userId + '/hasVenmo');
        return VenmoService.getAuthToken(authCode).then(function (response) {
            var user = {};
            venmoUsers.set(response);
            userRef.set(true);
            return res.json({
                user: response
            });
        });
    },

    setCurrentUser: function setCurrentUser(userId) {
        var _this = this;

        return VenmoService.getVenmoUser(userId).then(function (user) {
            return _this.currentUser = user;
        });
    },
    /**
    * `VenmoPaymentsController.pay()`
    */
    pay: function pay(req, res) {
        var self = this,
            payments = undefined;
        return this.setCurrentUser(req.body.user).then(function (user) {
            return self.getPayments(req, res, USE_DEV_PAYMENTS);
        }).then(function (data) {
            payments = data;
            console.info("ABOUT TO PAY", data);
            var proms = data.map(function (p) {
                return self.sendPayment(p.venmoParams);
            });
            return Promise.all(proms);
        }).then(function (paymentResponses) {
            return res.json({
                response: paymentResponses,
                paymentsSent: payments
            });
        });
    },

    sendPayment: function sendPayment(data) {
        return new Promise(function (resolve, reject) {
            var options = {
                method: 'post',
                body: data,
                json: true,
                url: config.venmo.paymentEndpoint
            };
            var response = request.post(options, function (error, response, body) {
                resolve(body);
            });
        });
    },

    getPayments: function getPayments(req, res, dev) {
        var _this2 = this;

        console.info("payments", req.body.payment.invoices);
        console.info("THIS", this);
        var paymentsProm = this.aggregateInvoices(req.body.payment.invoices, req.body),
            venmoRef = new Firebase(config.firebase.url + 'venmoUsers'),
            payments = undefined;
        return paymentsProm.then(function (data) {
            console.info("data", data);
            payments = data;
            var proms = data.map(function (p) {
                return new Promise(function (resolve, reject) {
                    venmoRef.orderByKey().equalTo(p.user).once('value', function (snapshot) {
                        if (snapshot.exists()) {
                            var obj = snapshot.val()[p.user];
                            obj.id = p.user;
                            resolve(obj);
                        } else {
                            new Firebase(config.firebase.url + 'users').orderByKey().equalTo(p.user).once('value', function (snapshot) {
                                var obj = snapshot.val()[p.user];
                                obj.id = p.user;
                                resolve(obj);
                            });
                        }
                    });
                });
            });
            console.info("MADE IT HERE");
            return Promise.all(proms);
        }).then(function (users) {
            console.info("USERS", users);
            var mapped = payments.map(function (p, i) {
                var venmoParams = {};
                console.info("DEV", dev);
                if (dev) {
                    venmoParams = _this2.getDevPayment(_this2.currentUser);
                } else {
                    venmoParams = {
                        access_token: _this2.currentUser.access_token,
                        user_id: users[i].user ? users[i].user.id : users[i].email,
                        amount: p.amount,
                        note: p.note || "Payment made through Settld"
                    };
                }
                return {
                    invoices: p.invoices,
                    venmoParams: venmoParams
                };
            });
            console.info("mapped", mapped);
            return mapped;
        });
    },

    getDevPayment: function getDevPayment(user, type) {
        console.info("USER", user);
        var data = {
            access_token: user.access_token,
            note: config.venmo.sandboxParams.note,
            amount: config.venmo.sandboxParams.paymentAmount.settled
        };
        console.info("DATA", data);
        if (type === 'pending') {
            data.email = 'bureddog22@gmail.com';
            data.amount = config.venmo.sandboxParams.paymentAmount.settld;
        } else {
            data.user_id = config.venmo.sandboxParams.userId;
        }
        return data;
    },

    aggregateInvoices: function aggregateInvoices(invoiceIds, params) {
        var _this3 = this;

        return InvoicesService.getInvoicesFromIds(invoiceIds).then(function (invoices) {
            console.info("Invoices", invoices);
            _this3.invoices = invoices;
            console.info("THIS", _this3);
            var invoiceGroups = _.groupBy(_this3.invoices, 'payee');
            console.info('invoicegroups', invoiceGroups);
            var payments = [];
            _.forIn(invoiceGroups, function (val, key) {
                console.info('val', val);
                console.info('key', key);
                var amount = 0;
                val.forEach(function (inv) {
                    amount += inv.amount;
                });
                payments.push({
                    invoices: val,
                    user: key,
                    amount: amount,
                    note: params.note
                });
            });
            console.info('payments again', payments);
            return payments;
        });
    }
};

router.post('/venmo/link', function (req, res) {
    new VenmoController().link(req, res);
});
router.post('/venmo/pay', function (req, res) {
    new VenmoController().pay(req, res);
});