'use strict';

var Firebase = require("firebase");
var Queue = require('promise-queue');
var config = require('../../config/config');
var maxConcurrent = 1;
var maxQueue = Infinity;
var queue = new Queue(maxConcurrent, maxQueue);
var lastTimestampRef = new Firebase(config.firebase.url + 'invoiceWatcher/lastTimestamp');
var lastPaidTimestampRef = new Firebase(config.firebase.url + 'invoiceWatcher/lastPaidTimestamp');

module.exports = {
    start: function start() {
        var _this = this;

        console.info("=== Starting InvoiceWatcher ===");
        lastTimestampRef.once('value', function (snap) {
            _this.lastTimestamp = snap.exists() ? snap.val() : 0;
            console.info('=== InvoiceWatcher start date: ' + _this.lastTimestamp + ' ===');
            _this.watchInvoices();
        });
        lastPaidTimestampRef.once('value', function (snap) {
            _this.lastPaidTimestamp = snap.exists() ? snap.val() : 0;
            console.info('=== InvoiceWatcher start paid date: ' + _this.lastPaidTimestamp + ' ===');
            _this.watchPaidInvoices();
        });
        // lastTimestampRef.onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
    },
    watchInvoices: function watchInvoices() {
        var _this2 = this;

        var ref = new Firebase(config.firebase.url + 'invoices');
        ref.on('child_added', function (snap) {
            if (!snap.val().paid && snap.val().createdAt > _this2.lastTimestamp) {
                _this2.lastTimestamp = snap.val().createdAt;
                lastTimestampRef.set(_this2.lastTimestamp);
                _this2.updateUserBalances(snap);
            }
        });
        return;
    },
    watchPaidInvoices: function watchPaidInvoices() {
        var _this3 = this;

        var ref = new Firebase(config.firebase.url + 'paidInvoices');
        ref.on('child_added', function (snap) {
            if (snap.val().createdAt > _this3.lastPaidTimestamp) {
                _this3.lastPaidTimestamp = snap.val().createdAt;
                lastPaidTimestampRef.set(_this3.lastPaidTimestamp);
                _this3.updateUserBalances(snap, true);
            }
        });
        return;
    },
    updateUserBalances: function updateUserBalances(snapshot, paid) {
        var self = this;
        queue.add(function () {
            return new Promise(function (resolve, reject) {
                var newInvoice = snapshot.val();
                if (paid) {
                    console.log("Paid Child added", snapshot.val());
                } else {
                    console.log("Child added", snapshot.val());
                }

                new Firebase(config.firebase.url + 'groupInfos').orderByChild('home').equalTo(newInvoice.home).once('value', function (snap) {
                    snap.forEach(function (child) {
                        var val = child.val(),
                            amount = paid ? -newInvoice.amount : newInvoice.amount;
                        val.users[newInvoice.payer].balance = val.users[newInvoice.payer].balance - amount;
                        val.users[newInvoice.payee].balance = val.users[newInvoice.payee].balance + amount;
                        new Firebase(config.firebase.url + 'groupInfos/' + child.key() + '/users').set(val.users, resolve);
                        console.log("FINISHED SET");
                        if (paid) {
                            console.log("SET Was for paid transaction");
                        }
                    });
                });
            });
        });
    }
};