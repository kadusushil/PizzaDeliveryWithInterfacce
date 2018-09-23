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
    console.log('Buffer: ', buffer);
    var payload = helpers.convertJsonToObject(buffer);
    console.log('payload: ', payload);
    var data = {
      'method' : method,
      'path' : trimmedPath,
      'headers' : request.headers,
      'payload' : payload,
      'queryString' : queryString
    };

    console.log('Data: ', data);
    var selectedHandler = typeof(server.routes[trimmedPath]) !== 'undefined'
                            ? server.routes[trimmedPath] : server.notDefined;
    selectedHandler(data, (statusCode, responseData) => {

      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
      var payload = typeof(responseData) == 'object' ? responseData : {};

      var stringPayload = JSON.stringify(payload);

      response.setHeader('Content-Type', 'application/json');
      response.writeHead(statusCode);
      response.end(stringPayload+'\n');
    });
  });
};

server.notDefined = function(data, callback) {
  callback(404);
};

server.routes = {
  'user' : userService.handleRequest,
  'auth' : authService.handleRequest,
  'menu' : pizzaService.handleRequest,
  'cart' : cartService.handleRequest,
  'checkout' : checkout.handleRequest,
  'history': orderHistory.handleRequest
};

module.exports = server;
