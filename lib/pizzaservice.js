/**
 * This service is responsible for following things
 * - Returns Pizza menu for the user
 * Other operations are not possible with this service
 **/

 const _data = require('./data');
 const authService = require('./authservice');
 const helpers = require('./helpers');

 var pizzaService = {};

 pizzaService.menu = {};

 pizzaService._menu = {};


 pizzaService.thankYou = (data, callback) => {
   if (data.method == 'get') {
     // Prepare data for interpolation
     var templateData = {
       'head.title' : 'Pizza Menu',
       'head.description' : 'Shows pizza menu',
       'body.class' : 'thank_you'
     };

     // Read in a template as a string
     helpers.getTemplate('thank_you',templateData,function(err,str){
       if(!err && str){
         // Add the universal header and footer
         helpers.addUniversalTemplates(str,templateData,function(err,str){
           if(!err && str){
             // Return that page as HTML
             callback(200,str,'html');
           } else {
             callback(500,undefined,'html');
           }
         });
       } else {
         callback(500,undefined,'html');
       }
     });
   } else {
     callback(405,undefined,'html');
   }
 };

 pizzaService.showMenu = (data, callback) => {
   // Reject any request that isn't a GET
   if(data.method == 'get'){
     // Prepare data for interpolation
     var templateData = {
       'head.title' : 'Pizza Menu',
       'head.description' : 'Shows pizza menu',
       'body.class' : 'showMenu'
     };
     // Read in a template as a string
     helpers.getTemplate('showMenu',templateData,function(err,str){
       if(!err && str){
         // Add the universal header and footer
         helpers.addUniversalTemplates(str,templateData,function(err,str){
           if(!err && str){
             // Return that page as HTML
             callback(200,str,'html');
           } else {
             callback(500,undefined,'html');
           }
         });
       } else {
         callback(500,undefined,'html');
       }
     });
   } else {
     callback(405,undefined,'html');
   }
 };

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
