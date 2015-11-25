'use strict';

var Firebase = require("firebase");
var Queue = require('promise-queue');
var config = require('../../config/config');
var maxConcurrent = 1;
var maxQueue = Infinity;
var queue = new Queue(maxConcurrent, maxQueue);
var disconnectRef = new Firebase(config.firebase.url + 'invoiceWatcher/lastDisconnect');

module.exports = {
    start: function start() {
        var _this = this;

        console.info("=== Starting InvoiceWatcher ===");
        disconnectRef.once('value', function (snap) {
            _this.lastDisconnect = snap.exists() ? snap.val() : 0;
            console.info('=== InvoiceWatcher start date: ' + _this.lastDisconnect + ' ===');
            _this.watchInvoices();
        });
        // disconnectRef.onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
    },
    watchInvoices: function watchInvoices() {
        var _this2 = this;

        var ref = new Firebase(config.firebase.url + 'invoices');
        ref.orderByChild('createdAt').startAt(this.lastDisconnect).on('child_added', function (snap) {
            disconnectRef.set(snap.val().createdAt + 1);
            _this2.updateUserBalances(snap);
        });
        return;
    },
    updateUserBalances: function updateUserBalances(snapshot) {
        var self = this;
        queue.add(function () {
            return new Promise(function (resolve, reject) {
                var newInvoice = snapshot.val();
                console.log("CHild added", snapshot.key());

                new Firebase(config.firebase.url + 'groupInfos').orderByChild('home').equalTo(newInvoice.home).once('value', function (snap) {
                    snap.forEach(function (child) {
                        var val = child.val();
                        val.users[newInvoice.payer].balance = val.users[newInvoice.payer].balance - newInvoice.amount;
                        val.users[newInvoice.payee].balance = val.users[newInvoice.payee].balance + newInvoice.amount;
                        new Firebase(config.firebase.url + 'groupInfos/' + child.key() + '/users').set(val.users, resolve);
                        console.log("FINISHED SET");
                    });
                });
            });
        });
    }
};