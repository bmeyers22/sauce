var Firebase = require("firebase");

module.exports = {
    start: function () {
        sails.log.info("=== Starting InvoiceWatcher ===");
        this.watchInvoices();
    },
    watchInvoices: function () {
        var ref = new Firebase(sails.config.firebase.url + "invoices");
        ref.on('child_added', this.updateUserBalances);
        return;
    },
    updateUserBalances: function (snapshot) {
        var newInvoice = snapshot.val(),
            payee = new Firebase(sails.config.firebase.url + 'users/' + newInvoice.payee),
            payer = new Firebase(sails.config.firebase.url + 'users/' + newInvoice.payer),
            home = new Firebase(sails.config.firebase.url + 'homes/' + newInvoice.home);
        sails.log.info("BALANCE FOR PAYEE", payee.balance);
        sails.log.info("BALANCE FOR PAYER", payer.balance);
    }
};
