/**
 * VenmoPaymentsController
 *
 * @description :: Server-side logic for managing venmopayments
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Firebase = require("firebase");
var request = require('request');

module.exports = {

  getAuthToken: function (token) {
    var options = {
      method: 'post',
      body: {
        redirect_uri: sails.config.venmo.redirect_uri,
        client_id: sails.config.venmo.client_id,
        client_secret: sails.config.venmo.client_secret,
        code: token
      },
      json: true,
      url: sails.config.venmo.endpoint
    }
    return new Promise(function (resolve, reject){
      request.post(options, function (error, response, body) {
        resolve(body);
      });
    });
  },
  /**
   * `VenmoPaymentsController.pay()`
   */
  link: function (req, res) {
    var ref = new Firebase(sails.config.firebase.url),
      token = req.body.token;
    var venmoUsers = ref.child("venmoUsers");
    this.getAuthToken(req.body.data.data.authorizationCode).then(function (response) {
      var user = {};
      user[req.body.data.userId] = response;
      venmoUsers.set(user);
      sails.log(user);
      return res.json({
        user: response
      });
    });
  },
  /**
   * `VenmoPaymentsController.pay()`
   */
  pay: function (req, res) {
    return res.json({
      todo: 'pay() is not implemented yet!'
    });
  },


  /**
   * `VenmoPaymentsController.request()`
   */
  request: function (req, res) {
    return res.json({
      todo: 'request() is not implemented yet!'
    });
  }
};
