/**
 * Following are the responsibilities of this file.
 * - Handle user creation
 * - Call token service and generate tokens which are associated with user
 * - Handle user deletion
 * - Handle user data update functionality
 **/

 const fs = require('fs');
 const helpers = require('./helpers');
 const _data = require('./data');
 const authService = require('./authservice');

 var user = {};

 user._users = {};

 user.handleRequest = (data, callback) => {
   var requestTypes = ['get','post','delete','put'];

   var method = typeof(requestTypes[data.method]) !== 'undefined' ?
                user._users[data.method] : false;

   if (requestTypes.indexOf(data.method) > -1) {
     user._users[data.method](data, callback);
   } else {
     callback(400, {'Error':'Method not supported'});
   }
 };

/**
 * Only logged in user can get this information so one needs to pass a valid token
 * to be able to get user information.
 * Following are required fields
 * Headers
 * - token (*)
 *
 * QueryString
 * - phone (*)
 **/
 user._users.get = (data, callback) => {

   const token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20
                ? data.headers.token.trim() : false;

   const queryString = data.queryString;
   const email = typeof(queryString.email) == 'string' && queryString.email.trim().length > 0
                ? queryString.email.trim() : false;

   if (email) {
     if (token) {
       authService.verifyToken(email, token, (isTokenValid) => {
         if (isTokenValid) {
           _data.readFile('users', email, (error, data) => {
             if (!error) {
              delete data.password;
              callback(200, data);
           } else {
             callback(400, {'error':'Couldn\'t retrieve the data'});
           }
           });
         } else {
           callback(400, {'error':'Token is expired'});
         }
       });
     } else {
       callback(400, {'error' : 'token not valid or missing'});
     }
 } else {
   callback(400, {'error':'email is not provided'});
 }
 };

/**
 * This method is responsible for creating new user. Required fields are as below.
 * Fields marked with '*' are mandatory.
 * - email (*)
 * - password (*), minimum 8 characters, should contain atleast on capital letter
 *                                       should contain numbers and character
 *                                       and atleast one Symbol
 * - country code (*) // for twilio to send SMS across all countries
 * - phone number (*)
 * - street address (*)
 * - pinCode (*)
 * All the fields are mandatory since we would need to deliver the pizza to their
 * home so correct address and phone number and email for invoice is necessary.
 **/
 user._users.post = (data, callback) => {

   // check all required fields
   var payload = data.payload;
   if (payload) {
     var email = typeof(payload.email) == 'string' && payload.email.trim().length > 0
                          ? payload.email.trim() : false;
     var password = typeof(payload.password) == 'string' && payload.password.trim().length >= 8
                          ? payload.password.trim() : false;
     var countryCode = typeof(payload.countryCode) == 'number' && payload.countryCode > 0
                          ? payload.countryCode : false;
     var phoneNumber = typeof(payload.phone) == 'string' && payload.phone.trim().length == 10
                          ? payload.phone.trim() : false;
     var streetAddress = typeof(payload.streetAddress) == 'string' && payload.streetAddress.trim().length > 0
                          ? payload.streetAddress.trim() : false;
     var pinCode = typeof(payload.pinCode) == 'string' && payload.pinCode.trim().length > 0
                          ? payload.pinCode.trim() : false;


     if (email && password && countryCode && phoneNumber && streetAddress && pinCode) {
       // check if password is valid password
       if (!helpers.isSatisfyPasswordPolicy(password)) {
         callback(400, {'error':'Password policy: need atleast 8 character length password, one capital letter, one number and one special character'});
         return;
       }

       // check if this user exists.
       _data.readFile('users', email, (error, data) => {
         if (error) {
           // create new user now
           // password needs to be encrypted
           var hashedPassword = helpers.hashPassword(password);

           payload.password = hashedPassword;

           _data.createFile('users', email, payload, (error)=> {
             if (!error) {
               callback(200, {'success':'You can use your email adress and password for login'});
             } else {
               callback(404, {'error':'Failed to create new user'});
             }
           });
         } else {
           callback(400, {'error':'user already exists'});
         }
       });
     } else {
       callback(400, {'error':'missing required fields',
       'email':email, 'password': password ? 'provided':'password policy need atleast 8 character length password, one capital letter, one number and one special character',
       'countryCode': countryCode,
      'phoneNumber': phoneNumber, 'streetAddress': streetAddress, 'pinCode':pinCode});
     }
   } else {
     callback(400, {'error':'payload is missing'});
   }
 };

 /**
  * Responsible for deleting the user.
  * Fields marked with (*) are mandatory
  * Headers
  * - token (*)
  *
  * QueryString
  * - email (*)
  *
  * Body
  * - email (*)
  *
  * Note: email is mandatory and can be passed either through query or through
  * body
  **/
 user._users.delete = (data, callback) => {

   var email = typeof(data.queryString.email) == 'string' &&
                data.queryString.email.trim().length > 0
                ? data.queryString.email.trim() : false;
   if (!email) {
     email = typeof(data.payload.email) == 'string' &&
                  data.payload.email.trim().length > 0
                  ? data.payload.email.trim() : false;
   }

   if (email) {
     var token = typeof(data.headers.token) == 'string' &&
                 data.headers.token.trim().length == 20
                 ? data.headers.token.trim() : false;
     if (token) {
       authService.verifyToken(email, token, (isTokenValid) => {
         if (isTokenValid) {

           _data.deleteFile('users', email, (error) => {
             if (!error) {
               callback(200);
             } else {
               callback(400, {'error':'could not delete user'});
             }
           });

         } else {
           callback(400, {'error':'token is expired, please login and use new token'});
         }
       });
     } else {
       callback(400, {'error':'token missing or not valid'});
     }
   } else {
      callback(400, {'error':'email should be provided in query parameters'});
   }
 };

/**
 * This method is responsible for updating user information except e-mail.
 * Email can not be updated since it's a primary key
 * Header
 * - token (*)
 *
 * Body
 * - countryCode (optional)
 * - phoneNumber (optional)
 * - streetAddress (optional)
 * - pinCode (optional)
 **/
 user._users.put = (data, callback) => {

   const tokenId = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20
                 ? data.headers.token : false;

   var email = typeof(data.queryString.email) == 'string' &&
                data.queryString.email.trim().length > 0
                ? data.queryString.email.trim() : false;
   if (!email) {
     email = typeof(data.payload.email) == 'string' &&
                  data.payload.email.trim().length > 0
                  ? data.payload.email.trim() : false;
   }

   if (tokenId && email) {
     // verify token expiry
     if (authService.verifyToken(email, tokenId, (isTokenValid) => {

       if (isTokenValid) {
         var countryCode = typeof(data.payload.countryCode) == 'number' &&
                            data.payload.countryCode > 0
                            ? data.payload.countryCode : false;

         var phoneNumber = typeof(data.payload.phone) == 'string' &&
                            data.payload.phone.trim().length == 10
                            ? data.payload.phone.trim() : false;

         var streetAddress = typeof(data.payload.streetAddress) == 'string' &&
                            data.payload.streetAddress.trim().length > 0
                            ? data.payload.streetAddress.trim() : false;

         var pinCode = typeof(data.payload.pinCode) == 'string' &&
                            data.payload.pinCode.trim().length > 0
                            ? data.payload.pinCode.trim() : false;

         var password = data.payload.password;

         if (password && !helpers.isSatisfyPasswordPolicy(password)) {
           callback(400, {'error':'Password policy: need atleast 8 character length password, one capital letter, one number and one special character'});
           return;
         }

        _data.readFile('users', email, (error, userData) => {
          if (!error) {
            if (countryCode) {
              userData.countryCode = countryCode;
            }

            if (phoneNumber) {
              userData.phone = phoneNumber;
            }

            if (streetAddress) {
              userData.streetAddress = streetAddress;
            }

            if (pinCode) {
              userData.pinCode = pinCode;
            }

            if (password) {
              userData.password = helpers.hashPassword(password);
            }

            _data.updateFile('users', email, userData, (error) => {
              if (!error) {
                delete userData['password'];
                callback(200, userData);
              } else {
                callback(400, {'error':'Couldn\'t update the data'});
              }
            });
          } else {
            callback(400, {'error':'Could not update the data'});
          }
        });
       } else {
         callback(400, {'error':'Token is expired, please login again'});
       }
     }));
   } else {
    callback(400, {'error':'Token not valid or token is missing, email might be mising too'});
   }
 };

 module.exports = user;
