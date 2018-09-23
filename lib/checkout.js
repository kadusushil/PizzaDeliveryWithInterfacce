/**
 * This file is responsible for handling the checkout process.
 * It accepts users request to checkout the items from cart.
 **/

const fs = require('fs');
const _data = require('./data');
const authService = require('./authservice');
const helpers = require('./helpers');
const orderHistory = require('./orderhistory');

var checkout = {};

checkout._check = {};

checkout.handleRequest = (data, callback) => {
  const possibleMethods = ['post'];

  if (possibleMethods.indexOf(data.method) > -1) {
    checkout._check[data.method](data, callback);
  } else {
    callback(400, {'error':'Operation not permitted'});
  }
};

/**
 * Method responsible for checking out users cart.
 * Following are the mandatory Fields
 * Header
 * - token
 *
 * QueryString
 * - email
 *
 * Body
 * - Card details for stripe
 **/
checkout._check.post = (data, callback) => {

  const email = typeof(data.queryString.email) == 'string' && data.queryString.email.trim().length > 0
                ? data.queryString.email.trim() : false;

  if (!email) {
    email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0
                 ? data.payload.email.trim() : false;
  }

  const token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20
                ? data.headers.token.trim() : false;

  const stripeToken = typeof(data.payload.stripeToken) == 'string' && data.payload.stripeToken.trim().length > 0
                ? data.payload.stripeToken.trim() : false;

  if (email && token && stripeToken) {
    authService.verifyToken(email, token, (isTokenValid) => {
      if (isTokenValid) {
        _data.readFile('cart', email, (error, orderData) => {
          if (!error && orderData) {

            var amount = helpers.getAmountFromOrder(orderData);
            helpers.makePayment(email, amount, stripeToken, (error) => {
              if (!error) {
                console.log('Payment successful');
                orderHistory.addOrder(email, orderData, (data) => {
                  if (data) {
                    // checkout and send email
                    // TODO need to update the email part
                    helpers.sendEmail(email, 'Pizza: Order confirmation',
                    'This email is to confirm your order we received.', (error) => {
                      if (!error || error) {
                        console.log('Message has been sent successfully');
                        // once email is sent successfully
                        // empty the cart and send success back.
                        _data.deleteFile('cart', email, (error) => {
                          if (!error) {
                            callback(200, data);
                          } else {
                            callback(400, {'error':'Could not empty the cart'});
                          }
                        });
                      } else {
                        // we won't be making this order fail since payment is done
                        // ideally, we should have timer to try this job again
                        // after some time.
                        console.log('Error sending email: ', error);
                      }
                    });
                  } else {
                    callback(400, {'error':'adding order failed'})
                  }
                });
              } else {
                console.log('Payment didn\'t go through');
                callback(500, error)
              }
            });
          } else {
            callback(400, {'error':'error checking out cart'});
          }
        });
      } else {
        callback(401, {'error':'Token expired, please try again later'});
      }
    });
  } else {
    callback(400, {'eror':'missing required fields'});
  }
};

module.exports = checkout;
