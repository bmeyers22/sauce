const Firebase = require("firebase"),
    request = require('request'),
    config = require('../../config/config');

module.exports = {
    getAuthToken(token) {
        return new Promise( (resolve, reject) => {
            let options = {
                method: 'post',
                body: {
                    redirect_uri: config.venmo.redirectUri,
                    client_id: config.venmo.clientId,
                    client_secret: config.venmo.clientSecret,
                    code: token
                },
                json: true,
                url: config.venmo.endpoint
            };
            request.post(options, function (error, response, body) {
                resolve(body);
            });
        });
    },
    getVenmoUser(userId) {
        return new Promise( (resolve, reject) => {
            let usersRef = new Firebase(config.firebase.url + 'venmoUsers');
            usersRef.orderByKey().equalTo(userId).once('value', function (snapshot) {
                let obj = snapshot.val()[userId];
                obj.id = userId;
                resolve(obj);
            })
        });

    }
}
