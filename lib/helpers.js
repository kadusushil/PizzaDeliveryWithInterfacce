/**
 * Provides helper method needed for the rest of the application.
 * - Convert JSON data to object
 **/

const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const http = require('http');
const _data = require('./data');
const StringDecoder = require('string_decoder').StringDecoder;
const querystring = require('querystring');

var helpers = {};

/**
 * Makes a stripe payment.
 *
 * - orders : actual orders
 * - email : email of the user
 * - stripeToken : received from client
 **/
helpers.makePayment = (email, amount, stripeToken, callback) => {

  const payload = {
    'amount' : amount,
    'currency' : 'usd',
    'description': 'Charging for ' + email,
    'source': stripeToken
  }

  const stringPayload = querystring.stringify(payload);

  const requestDetails = {
    'protocol' : 'https:',
    'host': 'api.stripe.com',
    'path' : '/v1/charges',
    'headers' : {
      'Authorization' : 'Bearer ' + config.stripe,
      'Content-Type' : 'application/x-www-form-urlencoded',
    }
  };

  console.log('requestDetails: ', requestDetails);
  const decoder = new StringDecoder('utf-8');
  const req = https.request(requestDetails, (res) => {

    var status = res.statusCode;
    console.log('StatusCode: ', status);
    if (status == 200 || status == 201) {
       callback(false);
    } else {
       callback({'error':'payment didn\'t go through'});
    }

    // for debugging purpose
    res.on('data', (d) => {
        console.log('request: ', decoder.write(d));
      });
  });

  // bind to an error event
  req.on('error', (error)=> {
    console.log('Error occurred: ', error);
    callback(error);
  });

  req.write(stringPayload);
  req.end();
};

/**
 * Helper method to send email
 **/
 helpers.sendEmail = (email, subject, text, callback) => {

   const payload = {
     'from' : 'Mailgun Sandbox <postmaster@sandbox0857177683f74439869a12fb519dde12.mailgun.org>',
     'to' : email,
     'subject' : subject,
     'text' : text
   }

   // difference between JSON.stringfy and queryString.stringify
   const stringPayload = querystring.stringify(payload);

   const requestDetails = {
     'protocol' : 'https:',
     'hostname' : 'api.mailgun.net',
     'method' : 'POST',
     'path' : '/v3/sandbox0857177683f74439869a12fb519dde12.mailgun.org/messages',
     'auth' : 'api:' + config.mailgun,
     'headers' : {
         'Content-Type' : 'application/x-www-form-urlencoded',
         'Content-Length': Buffer.byteLength(stringPayload),
     }
   }

   const decoder = new StringDecoder('utf-8');
   // Instantiate the request
   const req = https.request(requestDetails, (res) => {
     var status = res.statusCode;

     console.log('Status code: ', status);
     // callback caller successfully
     if (status == 200 || status == 201) {
         callback(false);
     } else {
       callback('Status code is: ' + status);
     }

     // for debugging purpose
     res.on('data', (d) => {
         console.log('request: ', decoder.write(d));
       });
   });

   // bind to an error event
   req.on('error', (error)=> {
     console.log('Error occurred: ', error);
     callback(error);
   });

   req.write(stringPayload);
   req.end();

   //
   // curl -s --user 'api:8ac0e0ff0b1a2c94349992d07627dcbf-7bbbcb78-406b2e2d' \
   // >     https://api.mailgun.net/v3/sandbox62aedc2aa01444bda3b9afe35376ac08.mailgun.org/messages \
   // >         -F from='Mailgun Sandbox <postmaster@sandbox62aedc2aa01444bda3b9afe35376ac08.mailgun.org>' \
   // >         -F to='Sushil Kadu <sushil.kadu@orangebitsindia.com>' \
   // >         -F subject='Hello Sushil Kadu' \
   // >         -F text='Congratulations Sushil Kadu, you just sent an email with Mailgun!  You are truly awesome!'
 };

/**
 * Return the order amount from set of orders.
 **/
helpers.getAmountFromOrder = (orders) => {
  var amount = 0;
  orders.forEach(order => {
    console.log('Order: ', order);
    var orderAmount = parseFloat(order.price.replace('$', ''));
    amount += (orderAmount*order.quantity);
  });
  console.log('Order Amount: ', amount);
  return amount;
};

/**
 * Helps you hash your password.
 **/
helpers.hashPassword = (str) => {

  if (typeof(str) == 'string' && str.length > 0) {
     var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
     return hash;
  } else {
    return false;
  }
};

/**
 * As the name suggests, converts a normal string data into JSON object
 * recognised by JS.
 **/
helpers.convertJsonToObject = (strData) => {
  try {
    var obj = JSON.parse(strData);
    return obj;
  } catch(e) {
    return {};
  }
}

/**
 * Main task is to generate random characters upto length specified by the user.
 **/
helpers.generateRandomId = (strLength) => {

  const tokenLength = typeof(strLength) == 'number' && strLength > 0
                        ? strLength : false;
  if (tokenLength) {
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var token = '';
    for (var i = 1; i <= tokenLength; i++) {
      var randomChar = possibleCharacters.charAt(Math.floor(Math.random()
      * possibleCharacters.length));
      token += randomChar;
    }
    return token;
  } else {
    return false;
  }
};

/**
 * Checks if the string has any lowercase letter
 **/
helpers.hasLowerCase = (str) => {
    return (/[a-z]/.test(str));
}

/**
 * Checks if the string has any lowercase letter
 **/
helpers.hasUpperCase = (str) => {
    return (/[A-Z]/.test(str));
}

/**
 * Checks if the string has any lowercase letter
 **/
helpers.hasNumber = (str) => {
    return (/[0-9]/.test(str));
}

/**
 * Checks if the string has special character
 **/
helpers.hasSpecialCharacter = (str) => {
 return /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/.test(str);
}

/**
 * Checks if the password is valid
 **/
helpers.validateEmail = (email) => {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

helpers.isSatisfyPasswordPolicy = (password) => {
  var password = typeof(password) == 'string' && password.trim().length >= config.passwordLength
                                  ? password : false;
  if (!password) {
    return false;
  }

  if (!helpers.hasUpperCase(password)) {
    return false;
  }

  if (!helpers.hasSpecialCharacter(password)) {
    return false;
  }

  if (!helpers.hasNumber(password)) {
    return false;
  }

  return true;
}

module.exports = helpers;
