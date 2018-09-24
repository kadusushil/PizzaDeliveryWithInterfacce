/**
 * This class has following responsibility
 * - Initiates http and https server
 * - Routes the requests to specific handlers
 * - Returns the result to whoever called the api
 **/

const http = require('http');
const https = require('https');
const config = require('./config');
const fs = require('fs');
const path = require('path');
const url = require('url');
const userService = require('./userservice');
// const tokenService = require('./tokenservice');
const { StringDecoder } = require('string_decoder');
const helpers = require('./helpers');
const authService = require('./authService');
const pizzaService = require('./pizzaservice');
const cartService = require('./cartservice');
const checkout = require('./checkout');
const orderHistory = require('./orderhistory');
const miscService = require('./miscservice');

const server = {};

// set up http server
server.httpServer = http.createServer(config.httpPort, (request, response) => {
  server.handleRequest(request, response);
});

const keyFile = path.join(__dirname, './../certs', 'key.pem');
const certFile = path.join(__dirname, './../certs', 'cert.pem');

// set up https ceritificates
const options = {
  key: fs.readFileSync(keyFile),
  cert: fs.readFileSync(certFile)
};

// create https server
server.httpsServer = https.createServer(options, (request, response) => {
  server.handleRequest(request, response);
});

server.init = () => {

  // start listening http server
  server.httpServer.listen(config.httpPort, () => {
    console.log('http : ENV: ', config.envMode + ' PORT: ', config.httpPort);
  });

  // start listening https server
  server.httpsServer.listen(config.httpsPort, () => {
  console.log('https: ENV: ', config.envMode + ' PORT: ', config.httpsPort);  });

  // cartService.getValidPizzaForId("111111");
};

server.handleRequest = (request, response) => {

  var parsedUrl = url.parse(request.url, true);
  var pathName = parsedUrl.pathname;
  var trimmedPath = pathName.replace(/^\/+|\/+$/g, '');
  var queryString = parsedUrl.query;
  var method = request.method.toLowerCase();

  var buffer = '';
  var decoder = new StringDecoder('utf-8');
  // start receiving data event and gather the data from stream
  request.on('data', (data) => {
    buffer += decoder.write(data);
  });

  request.on('end', () => {
    buffer += decoder.end();
    var payload = helpers.convertJsonToObject(buffer);
    var data = {
      'method' : method,
      'path' : trimmedPath,
      'headers' : request.headers,
      'payload' : payload,
      'queryString' : queryString
    };

    console.log('Request: ', data);
    var selectedHandler = typeof(server.routes[trimmedPath]) !== 'undefined'
                            ? server.routes[trimmedPath] : server.notDefined;

    // If the request is within the public directory use to the public handler instead
    selectedHandler = trimmedPath.indexOf('public/') > -1 ? miscService.public : selectedHandler;

    selectedHandler(data, (statusCode, responseData, contentType) => {

    // Determine the type of response (fallback to JSON)
    contentType = typeof(contentType) == 'string' ? contentType : 'json';
    statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

    var stringPayload = '';

    if (contentType == 'json') {
      response.setHeader('Content-Type', 'application/json');
      var payload = typeof(responseData) == 'object' ? responseData : {};
      stringPayload = JSON.stringify(payload);
    }

    if (contentType == 'png') {
      response.setHeader('Content-Type', 'image/png');
      stringPayload = typeof(responseData) !== 'undefined' ? responseData : '';
    }

    if (contentType == 'jpg') {
      response.setHeader('Content-Type', 'image/jpeg');
      stringPayload = typeof(responseData) !== 'undefined' ? responseData : '';
    }

    if (contentType == 'html') {
      response.setHeader('Content-Type', 'text/html');
      stringPayload = typeof(responseData) == 'string' ? responseData : '';
    }

    if (contentType == 'plain') {
      response.setHeader('Content-Type', 'text/plain');
      stringPayload = typeof(responseData) !== 'undefined' ? responseData : '';
    }

    if (contentType == 'favicon') {
      response.setHeader('Content-Type', 'image/x-icon');
      stringPayload = typeof(responseData) !== 'undefined' ? responseData : '';
    }

    if (contentType == 'css') {
        response.setHeader('Content-Type', 'text/css');
        stringPayload = typeof(responseData) !== 'undefined' ? responseData : '';
    }

    console.log('Response: ', stringPayload);
    console.log('StatusCode: ', statusCode);
    response.writeHead(statusCode);
    response.end(stringPayload);
    });
  });
};

server.notDefined = function(data, callback) {
  callback(404);
};

server.routes = {
  '' : miscService.index,
  'account/create' : userService.createAccount,
  'account/edit' : userService.editAccount,
  'account/deleted' : userService.deletedAccount,
  'session/create' : authService.createSession,
  'session/delete' : authService.deleteSession,
  'home/menu' : pizzaService.showMenu,
  'account/cart' : cartService.showCart,
  'account/checkout' : checkout.showCheckout,
  'api/users' : userService.handleRequest,
  'api/auth' : authService.handleRequest,
  'api/menu' : pizzaService.handleRequest,
  'api/cart' : cartService.handleRequest,
  'api/checkout' : checkout.handleRequest,
  'api/history': orderHistory.handleRequest,
  'favicon.ico' : miscService.favicon,
  'public' : miscService.public
};

module.exports = server;
