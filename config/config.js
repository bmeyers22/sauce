var path = require('path'),
rootPath = path.normalize(__dirname + '/..'),
env = process.env.NODE_ENV || 'development';

var config = {
    development: {
        root: rootPath,
        app: {
            name: 'sauce'
        },
        port: 3000,
        firebase: {
            url: 'https://incandescent-fire-2053.firebaseIO.com/'
        },
        venmo: {
            sandboxParams: {
                userId: '145434160922624933',
                email: 'venmo@venmo.com',
                phone: '15555555555',
                note: 'Test payment',
                paymentAmount: {
                    settled: '0.10',
                    failed: '0.20',
                    pending: '0.30',
                    settledCharge: '-0.10',
                    pendingCharge: '-0.20'
                }
            },
            meEndpoint: 'https://api.venmo.com/v1/me',
            paymentEndpointDev: 'https://sandbox-api.venmo.com/v1/payments',
            paymentEndpoint: 'https://api.venmo.com/v1/payments',
            scope: 'access_email, access_phone, access_profile, make_payments',
            endpoint: 'https://api.venmo.com/v1/oauth/access_token',
            redirectUri: 'http://localhost:4200/login',
            clientId: '2929',
            clientSecret: 'SHTz2rnN5UeWFXm8DR6jUUb9E9BrqTJ3'
        }
    },

    test: {
        root: rootPath,
        app: {
            name: 'sauce'
        },
        port: 3000,
    },

    production: {
        root: rootPath,
        app: {
            name: 'sauce'
        },
        port: process.env.PORT || 8080,
        venmo: {
            sandboxParams: {
                userId: '145434160922624933',
                email: 'venmo@venmo.com',
                phone: '15555555555',
                note: 'Test payment',
                paymentAmount: {
                    settled: '0.10',
                    failed: '0.20',
                    pending: '0.30',
                    settledCharge: '-0.10',
                    pendingCharge: '-0.20'
                }
            },
            meEndpoint: 'https://api.venmo.com/v1/me',
            paymentEndpointDev: 'https://sandbox-api.venmo.com/v1/payments',
            paymentEndpoint: 'https://api.venmo.com/v1/payments',
            scope: 'access_email, access_phone, access_profile, make_payments',
            endpoint: 'https://api.venmo.com/v1/oauth/access_token',
            redirectUri: 'http://localhost:4200/login',
            clientId: '2929',
            clientSecret: 'SHTz2rnN5UeWFXm8DR6jUUb9E9BrqTJ3'
        }

    }
};

module.exports = config[env];
