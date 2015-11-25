"use strict";

var Firebase = require("firebase");
var config = require('../../config/config');

module.exports = {
    start: function start() {
        console.log.info("=== Starting InvoiceWatcher ===");
        this.watchInvoices();
    },
    watchInvoices: function watchInvoices() {
        var ref = new Firebase(config.firebase.url + "invoices");
        ref.on('child_added', this.updateUserBalances);
        return;
    },
    updateUserBalances: function updateUserBalances(snapshot) {
        var newInvoice = snapshot.val(),
            payee = new Firebase(config.firebase.url + "users/" + newInvoice.payee),
            payer = new Firebase(config.firebase.url + "users/" + newInvoice.payer),
            home = new Firebase(config.firebase.url + "homes/" + newInvoice.home);
        console.log.info("BALANCE FOR PAYEE", payee.balance);
        console.log.info("BALANCE FOR PAYER", payer.balance);
    }
};