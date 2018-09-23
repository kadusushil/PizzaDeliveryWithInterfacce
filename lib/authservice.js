/**
 * Login service is responsible for following things.
 * - Create new token by providing username and passoword.
 * - Logout by providing correct token.
 * - Provide method to verify if the token is valid or not.
 **/

const fs = require('fs');
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

var authService = {};

authService._auth = {};

// entry to the authService
authService.handleRequest = (data, callback) => {
  var possibleMethods = ['post', 'delete'];

  if (possibleMethods.indexOf(data.method) > -1) {
    authService._auth[data.method](data, callback);
  } else {
    callback(400, {'error':'Operation not permitted'});
  }
};

/**
 * Verifies the token expiry and email associated with it.
 **/
authService.verifyToken = (email, tokenId, callback) => {

  _data.readFile('tokens', tokenId, (error, data) => {
    if (!error && data) {
      // check expiry
      if (email == data.email && data.expiry > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

/**
 * Logs user into the platform and provides the token with expiry.
 * This token then can be used for other operations in the platform.
 * Following are required fields in body.
 * - Email
 * - Password
 **/
authService._auth.post = (data, callback) => {

  // check if required data is passed or not.
  var payload = data.payload;
  var email = typeof(payload.email) == 'string' && payload.email.trim().length > 0
              ? payload.email.trim() : false;

  var password = typeof(payload.password) == 'string' && payload.password.trim().length > 0
              ? payload.password : false;

  console.log('Email: ', email + ' password: ', password);
  if (email && password) {
    _data.readFile('users', email, (error, data) => {
      if (!error) {
        var originalHashedPassword = data.password;
        var receivedHashedPassword = helpers.hashPassword(password);

        if (originalHashedPassword == receivedHashedPassword) {
          // create new token here.
          var tokenId = helpers.generateRandomId(20);

          if (tokenId) {
          // check this token does not exist
          _data.readFile('tokens', tokenId, (error, fileData) => {
            if (error) {
              var expiry = Date.now() + config.tokenExpiry;

              var tokenObj = {
                'token' : tokenId,
                'email' : data.email,
                'expiry' : expiry
              };

              _data.createFile('tokens', tokenId, tokenObj, (error) => {
                if (!error) {
                  // token Successfuly created
                  callback(200, tokenObj);
                } else {
                  callback(400, {'error':'Error creating token, please try again!'});
                }
              });
            } else {
              callback(400, {'error':'Error generating token, please try again!'});
            }
          });
        } else {
          callback(400, {'error':'Error generating token, please try again'});
        }
        } else {
          callback(400, {'error':'Password did not match'});
        }
      } else {
        callback(400, {'error':'Not a valid user'});
      }
    });
  } else {
    callback(400, {'error':'Missing required fields'});
  }
};

/**
 * Logs user out of the session. Deletes the token if token provided valid.
 * Header
 * - token (*)
 **/
authService._auth.delete = (data, callback) => {
  // check if we received header
  var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20
              ? data.headers.token : false;
  const email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0
              ? data.payload.email.trim() : false;
  if (token) {
    // check token expiry
  authService.verifyToken(email, token, (isTokenValid)=> {
    if (isTokenValid) {
      // delete token and return response to client
      _data.deleteFile('tokens', token, (error) => {
        if (!error) {
          // user logged out successfully
          callback(200);
        } else {
          // there was a problem when deleting token, try again later
          callback(400, {'error':'Error deleting token, try again later'});
        }
      });
    } else {
      callback(400, {'error':'Token is expired, try signing in again'});
    }
  });
  } else {
    callback(400, {'error':'Token missing or not provided'});
  }
};

module.exports = authService;
