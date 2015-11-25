'use strict';

var express = require('express'),
    router = express.Router(),
    Firebase = require("firebase"),
    request = require('request'),
    USE_DEV_PAYMENTS = false,
    config = require('../../config/config'),
    VenmoService = require('../services/VenmoService'),
    InvoicesService = require('../services/InvoicesService');

module.exports = function (app) {
    app.use('/', router);
};

var VenmoController = {

    /**
    * `VenmoPaymentsController.pay()`
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
            console.log.info("ABOUT TO PAY", data);
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
        console.log.info("payments", req.body.payment.invoices);
        var paymentsProm = this.aggregateInvoices(req.body.payment.invoices, req.body),
            venmoRef = new Firebase(config.firebase.url + 'venmoUsers'),
            self = this,
            payments = undefined;
        return paymentsProm.then(function (data) {
            console.log.info("data", data);
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
            return Promise.all(proms);
        }).then(function (users) {
            console.log.info("USERS", users);
            var mapped = payments.map(function (p, i) {
                var venmoParams = {};
                console.log.info("DEV", dev);
                if (dev) {
                    venmoParams = self.getDevPayment(self.currentUser);
                } else {
                    venmoParams = {
                        access_token: self.currentUser.access_token,
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
            console.log.info("mapped", mapped);
            return mapped;
        });
    },

    getDevPayment: function getDevPayment(user, type) {
        console.log.info("USER", user);
        var data = {
            access_token: user.access_token,
            note: config.venmo.sandboxParams.note,
            amount: config.venmo.sandboxParams.paymentAmount.settled
        };
        console.log.info("DATA", data);
        if (type === 'pending') {
            data.email = 'bureddog22@gmail.com';
            data.amount = config.venmo.sandboxParams.paymentAmount.settld;
        } else {
            data.user_id = config.venmo.sandboxParams.userId;
        }
        return data;
    },

    aggregateInvoices: function aggregateInvoices(invoiceIds, params) {
        var _this2 = this;

        return InvoicesService.getInvoicesFromIds(invoiceIds).then(function (invoices) {
            _this2.invoices = invoices;
            var invoiceGroups = _.groupBy(_this2.invoices, 'payee');
            console.log.info('invoicegroups', invoiceGroups);
            var payments = [];
            _.forIn(invoiceGroups, function (val, key) {
                console.log.info('val', val);
                console.log.info('key', key);
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
            console.log.info('payments again', payments);
            return payments;
        });
    }
};

router.post('/venmo/link', VenmoController.link);
router.post('/venmo/pay', VenmoController.pay);