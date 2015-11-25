const express = require('express'),
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
    link: function (req, res) {
        let ref = new Firebase(config.firebase.url),
        authCode = req.body.data.data.authorizationCode,
        userId = req.body.data.userId,
        venmoUsers = ref.child(`venmoUsers/${userId}`),
        userRef = ref.child(`users/${userId}/hasVenmo`);
        return VenmoService.getAuthToken(authCode)
        .then( (response) => {
            let user = {};
            venmoUsers.set(response);
            userRef.set(true);
            return res.json({
                user: response
            });
        });
    },

    setCurrentUser: function (userId) {
        return VenmoService.getVenmoUser(userId).then((user) => {
            return this.currentUser = user;
        });
    },
    /**
    * `VenmoPaymentsController.pay()`
    */
    pay(req, res) {
        let self = this,
        payments;
        return this.setCurrentUser(req.body.user)
        .then( (user) => {
            return self.getPayments(req, res, USE_DEV_PAYMENTS);
        })
        .then( (data) => {
            payments = data;
            console.log.info("ABOUT TO PAY", data);
            let proms = data.map(function (p) {
                return self.sendPayment(p.venmoParams);
            })
            return Promise.all(proms);
        })
        .then( (paymentResponses) => {
            return res.json({
                response: paymentResponses,
                paymentsSent: payments
            });
        });
    },

    sendPayment: function (data) {
        return new Promise(function (resolve, reject){
            let options = {
                method: 'post',
                body: data,
                json: true,
                url: config.venmo.paymentEndpoint
            };
            let response = request.post(options, function (error, response, body) {
                resolve(body);
            });
        });

    },

    getPayments: function (req, res, dev) {
        console.log.info("payments", req.body.payment.invoices);
        let paymentsProm = this.aggregateInvoices(req.body.payment.invoices, req.body),
        venmoRef = new Firebase(`${config.firebase.url}venmoUsers`),
        self = this,
        payments;
        return paymentsProm.then(function (data) {
            console.log.info("data", data);
            payments = data;
            let proms = data.map(function (p) {
                return new Promise(function (resolve, reject) {
                    venmoRef
                    .orderByKey()
                    .equalTo(p.user)
                    .once('value', function (snapshot) {
                        if (snapshot.exists()) {
                            let obj = snapshot.val()[p.user];
                            obj.id = p.user;
                            resolve(obj);
                        } else {
                            new Firebase(`${config.firebase.url}users`)
                            .orderByKey()
                            .equalTo(p.user)
                            .once('value', function (snapshot) {
                                let obj = snapshot.val()[p.user];
                                obj.id = p.user;
                                resolve(obj);
                            });
                        }
                    });

                })
            });
            return Promise.all(proms);
        }).then(function (users) {
            console.log.info("USERS", users);
            let mapped = payments.map(function (p, i) {
                let venmoParams = {};
                console.log.info("DEV", dev)
                if (dev) {
                    venmoParams = self.getDevPayment(self.currentUser);
                } else {
                    venmoParams = {
                        access_token: self.currentUser.access_token,
                        user_id: users[i].user ? users[i].user.id : users[i].email,
                        amount: p.amount,
                        note: p.note || "Payment made through Settld"
                    }
                }
                return {
                    invoices: p.invoices,
                    venmoParams: venmoParams
                }
            });
            console.log.info("mapped", mapped);
            return mapped;
        });
    },

    getDevPayment: function (user, type) {
        console.log.info("USER", user);
        let data = {
            access_token: user.access_token,
            note: config.venmo.sandboxParams.note,
            amount: config.venmo.sandboxParams.paymentAmount.settled
        }
        console.log.info("DATA", data);
        if (type === 'pending') {
            data.email = 'bureddog22@gmail.com'
            data.amount = config.venmo.sandboxParams.paymentAmount.settld
        }
        else {
            data.user_id = config.venmo.sandboxParams.userId
        }
        return data
    },

    aggregateInvoices: function(invoiceIds, params) {
        return InvoicesService.getInvoicesFromIds(invoiceIds)
        .then( (invoices) => {
            this.invoices = invoices;
            let invoiceGroups = _.groupBy(this.invoices, 'payee');
            console.log.info('invoicegroups', invoiceGroups);
            let payments = [];
            _.forIn(invoiceGroups, function (val, key) {
                console.log.info('val', val);
                console.log.info('key', key);
                let amount = 0;
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
        })
    }
};

router.post('/venmo/link', VenmoController.link);
router.post('/venmo/pay', VenmoController.pay);
