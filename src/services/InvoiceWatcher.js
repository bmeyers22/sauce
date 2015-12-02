var Firebase = require("firebase");
var Queue = require('promise-queue');
var config = require('../../config/config');
var maxConcurrent = 1;
var maxQueue = Infinity;
var queue = new Queue(maxConcurrent, maxQueue);
var lastTimestampRef = new Firebase(`${config.firebase.url}invoiceWatcher/lastTimestamp`);
var lastPaidTimestampRef = new Firebase(`${config.firebase.url}invoiceWatcher/lastPaidTimestamp`);

module.exports = {
    start: function () {
        console.info("=== Starting InvoiceWatcher ===");
        lastTimestampRef.once('value', (snap) => {
            this.lastTimestamp = snap.exists() ? snap.val() : 0;
            console.info(`=== InvoiceWatcher start date: ${this.lastTimestamp} ===`);
            this.watchInvoices();
        });
        lastPaidTimestampRef.once('value', (snap) => {
            this.lastPaidTimestamp = snap.exists() ? snap.val() : 0;
            console.info(`=== InvoiceWatcher start paid date: ${this.lastPaidTimestamp} ===`);
            this.watchPaidInvoices();
        });
        // lastTimestampRef.onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
    },
    watchInvoices: function () {
        var ref = new Firebase(`${config.firebase.url}invoices`);
        ref.on('child_added', (snap) => {
            if (!snap.val().paid && snap.val().createdAt > this.lastTimestamp) {
                this.lastTimestamp = snap.val().createdAt;
                lastTimestampRef.set(this.lastTimestamp);
                this.updateUserBalances(snap);
            }
        });
        return;
    },
    watchPaidInvoices: function () {
        var ref = new Firebase(`${config.firebase.url}paidInvoices`);
        ref.on('child_added', (snap) => {
            if (snap.val().createdAt > this.lastPaidTimestamp) {
                this.lastPaidTimestamp = snap.val().createdAt;
                lastPaidTimestampRef.set(this.lastPaidTimestamp);
                this.updateUserBalances(snap, true);
            }
        });
        return;
    },
    updateUserBalances: function (snapshot, paid) {
        let self = this;
        queue.add(() => {
            return new Promise((resolve, reject) => {
                var newInvoice = snapshot.val();
                if (paid) {
                    console.log("Paid Child added", snapshot.val());
                } else {
                    console.log("Child added", snapshot.val());
                }

                new Firebase(`${config.firebase.url}groupInfos`).orderByChild('home').equalTo(newInvoice.home).once('value', function (snap) {
                    snap.forEach((child) => {
                        let val = child.val(),
                            amount = paid ? -newInvoice.amount : newInvoice.amount;
                        val.users[newInvoice.payer].balance = val.users[newInvoice.payer].balance - amount;
                        val.users[newInvoice.payee].balance = val.users[newInvoice.payee].balance + amount;
                        new Firebase(`${config.firebase.url}groupInfos/${child.key()}/users`).set(val.users, resolve);
                        console.log("FINISHED SET");
                        if (paid) {
                            console.log("SET Was for paid transaction");
                        }
                    });
                })

            })
        })
    }
};
