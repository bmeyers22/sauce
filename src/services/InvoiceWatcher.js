var Firebase = require("firebase");
var Queue = require('promise-queue');
var config = require('../../config/config');
var maxConcurrent = 1;
var maxQueue = Infinity;
var queue = new Queue(maxConcurrent, maxQueue);
var disconnectRef = new Firebase(`${config.firebase.url}invoiceWatcher/lastDisconnect`);

module.exports = {
    start: function () {
        console.info("=== Starting InvoiceWatcher ===");
        disconnectRef.once('value', (snap) => {
            this.lastDisconnect = snap.exists() ? snap.val() : 0;
            console.info(`=== InvoiceWatcher start date: ${this.lastDisconnect} ===`);
            this.watchInvoices();
        });
        // disconnectRef.onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
    },
    watchInvoices: function () {
        var ref = new Firebase(`${config.firebase.url}invoices`);
        ref.orderByChild('createdAt').startAt(this.lastDisconnect).on('child_added', (snap) => {
            disconnectRef.set(snap.val().createdAt + 1);
            this.updateUserBalances(snap);
        });
        return;
    },
    updateUserBalances: function (snapshot) {
        let self = this;
        queue.add(() => {
            return new Promise((resolve, reject) => {
                var newInvoice = snapshot.val();
                console.log("CHild added", snapshot.key());

                new Firebase(`${config.firebase.url}groupInfos`).orderByChild('home').equalTo(newInvoice.home).once('value', function (snap) {
                    snap.forEach((child) => {
                        let val = child.val();
                        val.users[newInvoice.payer].balance = val.users[newInvoice.payer].balance - newInvoice.amount;
                        val.users[newInvoice.payee].balance = val.users[newInvoice.payee].balance + newInvoice.amount;
                        new Firebase(`${config.firebase.url}groupInfos/${child.key()}/users`).set(val.users, resolve);
                        console.log("FINISHED SET");
                    });
                })

            })
        })
    }
};
