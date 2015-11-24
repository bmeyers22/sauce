const Firebase = require("firebase");

module.exports = {
    getAuthToken(token) {
        return new Promise( (resolve, reject) => {
            let options = {
                method: 'post',
                body: {
                    redirect_uri: sails.config.venmo.redirectUri,
                    client_id: sails.config.venmo.clientId,
                    client_secret: sails.config.venmo.clientSecret,
                    code: token
                },
                json: true,
                url: sails.config.venmo.endpoint
            };
            request.post(options, function (error, response, body) {
                resolve(body);
            });
        });
    },
    getVenmoUser(userId) {
        return new Promise( (resolve, reject) => {
            let usersRef = new Firebase(sails.config.firebase.url + 'venmoUsers');
            usersRef.orderByKey().equalTo(userId).once('value', function (snapshot) {
                let obj = snapshot.val()[userId];
                obj.id = userId;
                resolve(obj);
            })
        });

    }
}
