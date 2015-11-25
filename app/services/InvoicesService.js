'use strict';

var Firebase = require("firebase");
var config = require('../../config/config');

var invoicesRef = new Firebase(config.firebase.url + 'invoices');

module.exports = {
    getInvoicesFromIds: function getInvoicesFromIds(invoiceIds) {
        return Promise.all(invoiceIds.map(function (id) {
            return new Promise(function (resolve, reject) {
                invoicesRef.orderByKey().equalTo(id).once('value', function (snapshot) {
                    var obj = snapshot.val()[id];
                    obj.id = id;
                    resolve(obj);
                });
            });
        })).then(function (invoices) {
            return invoices;
        });
    },
    aggregateInvoicesByPayee: function aggregateInvoicesByPayee(invoices, params) {
        var invoiceGroups = _.groupBy(invoices, 'payee'),
            payments = [];
        _.forIn(invoiceGroups, function (val, key) {
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
        return payments;
    }
};