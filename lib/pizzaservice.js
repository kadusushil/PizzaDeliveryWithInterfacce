/**
 * This service is responsible for following things
 * - Returns Pizza menu for the user
 * Other operations are not possible with this service
 **/

 const _data = require('./data');
 const authService = require('./authservice');

 var pizzaService = {};

 pizzaService.menu = {};

 pizzaService._menu = {};

 pizzaService.handleRequest = (data, callback) => {
   var possibleMethods = ['get'];

   if (possibleMethods.indexOf(data.method) > -1) {
     pizzaService._menu[data.method](data, callback);
   } else {
     callback(400, {'error':'this operation is not permitted'});
   }
 };

 /**
  * This method returns the Pizza menu for user.
  *
  * Headers
  * - token
  *
  * QueryString
  * - email
  **/
 pizzaService._menu.get = (data, callback) => {

   const token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20
                 ? data.headers.token.trim() : false;
   const email = typeof(data.queryString.email) == 'string' && data.queryString.email.trim().length > 0
                 ? data.queryString.email.trim() : false;

  if (token && email) {
    authService.verifyToken(email, token, (isTokenValid) => {
      if (isTokenValid) {
        _data.readFile('menu', 'menu', (error, data) => {
          if (!error && data) {
            callback(200, data);
          } else {
            callback(400, {'error':'Could not retrieve the menu items'});
          }
        });
      } else {
        callback(401, {'error':'Not a valid token'});
      }
    });
  } else {
    callback(400, {'error':'token or email is missing or not valid'});
  }
 };

 module.exports = pizzaService;
