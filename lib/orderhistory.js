/**
 * Responsible for maintaining order history. It will have following things.
 * - Update the order against the user
 * - Add order to order history folder
 * - GET orders provided valid token is passed
 **/

const _data = require('./data');
const helpers = require('./helpers');
const authService = require('./authservice');

var orderhistory = {};

orderhistory._history = {};

// local request routing
orderhistory.handleRequest = (data, callback) => {
  const possibleMethods = ['post'];

  if (possibleMethods.indexOf(data.method) > -1) {
    orderhistory._history[data.method](data, callback);
  } else {
    callback(400, {'erorr':'Operation not permitted'});
  }
};

/**
 * Returns the orders for a user.
 * Following are required fields
 * Headers
 * - token (*)
 *
 * Body
 * - email (*)
 * - order_id (*
 **/
orderhistory._history.post = (data, callback) => {
  const email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0
                ? data.payload.email.trim() : false;
  const token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20
                ? data.headers.token.trim() : false;
  const orderId = typeof(data.payload.orderId) == 'string' && data.payload.orderId.trim().length == 10
                ? data.payload.orderId.trim() : false;

  if (email && token && orderId) {
    // verify token
    authService.verifyToken(email, token, (isTokenValid) => {
      if (isTokenValid) {
          _data.readFile('history', orderId, (error, orderData) => {
            if (!error && orderData) {
              callback(200, orderData);
            } else {
              callback(400, {'error':'Not a valid orderId'});
            }
          });
      } else {
        callback(400, {'error':'Token missing or not valid'});
      }
    });
  } else {
    callback(400, {'error':'Missing required fields'});
  }
};

/**
 * This is responsible for generating order id and adding it to history.
 * Once the order id is generated, it updates the user to link order history.
 **/
orderhistory.addOrder = (email, orderData, callback) => {
  email = typeof(email) == 'string' && email.trim().length > 0
                ? email : false;
  orderData = typeof(orderData) == 'object' ? orderData : false;

  if (email && orderData) {
    const orderId = helpers.generateRandomId(10);
    if (orderId) {
      var order = {
        'order_id' : orderId,
        'details' : orderData
      };

      _data.createFile('history', orderId, order, (error) => {
        if (!error) {
          // udpate user object to referece this
          _data.readFile('users', email, (error, userData) => {
            if (!error && userData) {
              var orderHistory = typeof(userData.orders) == 'object' &&
                                      userData.orders.length > 0
                                      ? userData.orders : [];

              orderHistory.push(orderId);
              userData.orders = orderHistory;

              _data.updateFile('users', email, userData, (error) => {
                if (!error) {
                  console.log('Order added successfully');
                  callback({'order_id':orderId});
                } else {
                  callback(false);
                }
              });
            } else {
              callback(false);
            }
          });
        } else {
          callback(false);
        }
      });
    } else {
      callback(false);
    }
  } else {
    callback(false);
  }
}

module.exports = orderhistory;
