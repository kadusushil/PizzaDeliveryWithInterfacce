/**
 * This class is responsible for following things
 * - You can view your current cart
 * - You can add/update itmes to the cart
 * - You can delete items from the cart
 * You need to be logged in to perform operation on the cart
 **/

 const _data = require('./data');
 const authService = require('./authservice');

 var cart = {};

 cart._service = {};

 /**
  * Enter into the service through this method
  * Choose possible options
  **/
 cart.handleRequest = (data, callback) => {
   var possibleMethods = ['get', 'post', 'delete'];
   console.log('Inside handle request of cart');
   if (possibleMethods.indexOf(data.method) > -1) {
     console.log('Inside cart, selecting post method: ', data.method);
     cart._service[data.method](data, callback);
   } else {
     callback(400, {'error':'operation not supported'});
   }
 };

 /**
  * A user can view his current cart using this method
  * Required fields are marked with (*).
  * Headers
  * - token (*)

  * QueryString
  * - email (*)
  **/
 cart._service.get = (data, callback) => {
   var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20
               ? data.headers.token : false;

   var email = typeof(data.queryString.email) == 'string' && data.queryString.email.trim().length > 0
               ? data.queryString.email.trim() : false;

   if (token && email) {
     // verify the token
     authService.verifyToken(email, token, (isTokenValid) => {
       if (isTokenValid) {
         _data.readFile('cart', email, (error, cartData) => {
           if (!error) {
             callback(200, cartData);
           } else {
             callback(200, {});
           }
         });
       } else {
         callback(401, {'error':'Token is expired'});
       }
     });
   } else {
     callback(400, {'error':'missing required fields, please pass valid token in headers and email of the user is query'});
   }
 };

 /**
  * Deletes the item from cart
  * Fields marked with (*) are mandatory
  * Headers
  * - token (*)
  *
  * QueryString
  * - email (*)
  *
  * Body (optional)
  * - [{'id':pizza_id}]
  *
  * If body is empty then entire cart in emptied other specific items are deleted.
  **/
 cart._service.delete = (data, callback) => {
   const email = typeof(data.queryString.email) == 'string' && data.queryString.email.trim().length > 0
                 ? data.queryString.email.trim() : false;

   if (!email) {
     email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0
                  ? data.payload.email.trim() : false;
   }
   const token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20
                 ? data.headers.token.trim() : false;

   const cartDetails = typeof(data.payload) == 'object' ? data.payload : false;

   if (email && token) {
     authService.verifyToken(email, token, (isTokenValid) => {
       if (isTokenValid) {
         if (!cartDetails) {
           _data.deleteFile('cart', email, (error) => {
             if (!error) {
               callback(200);
             } else {
               callback(400, {'error':'Could not delete the cart'});
             }
           });
         } else {
           // TODO when body is passed
         }
       } else {
         callback(401, {'error':'Not a valid token'});
       }
     });
   } else {
     callback(400, {'error':'missing required fields.'});
   }
 };

 /**
  * Adds item to the cart
  * Fields marked with (*) are mandatory
  * Headers
  * - token
  *
  * QueryString
  * - email
  *
  * Payload (payload in following format)
  * - [{"id":111111, "quantity":2}, {"id":444444, "quantity":1}]
  *
  **/
 cart._service.post = (data, callback) => {
   const email = typeof(data.queryString.email) == 'string' && data.queryString.email.trim().length > 0
                 ? data.queryString.email.trim() : false;

   if (!email) {
     email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0
                  ? data.payload.email.trim() : false;
   }

   const token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20
                 ? data.headers.token.trim() : false;

   const cartDetails = typeof(data.payload) == 'object' ? data.payload : false;

   if (email && token && cartDetails) {
     authService.verifyToken(email, token, (isTokenValid) => {
       if (isTokenValid) {
           // see if existing cart has any details
           _data.readFile('cart', email, (error, data) => {
             if (!error && data) {

               // check if the pizza id is valid
               cart.getValidPizzaForId(cartDetails.id, (pizza) => {
                 if (pizza) {
                   console.log('Process further');
                   // check if item exists
                   cart.getValidPizzaForIdFromCart(email, cartDetails.id, (pizzaCart)=> {
                     if (pizzaCart) {
                       // existing order
                     _data.readFile('cart', email, (error, cartData) => {
                       if (!error && cartData) {
                        const updatedCart = cartData.filter( el => el.id !== cartDetails.id );
                        pizzaCart.quantity = pizzaCart.quantity + cartDetails.quantity;
                        updatedCart.push(pizzaCart);
                        _data.updateFile('cart', email, updatedCart, (error) => {
                          if (!error) {
                            // send latest cart
                            callback(200, updatedCart);
                          } else {
                            callback(400, {'error':'Error adding item to cart'});
                          }
                        });
                       } else {
                         callback(400, {'error':'Error adding item to cart'});
                       }
                     });
                     } else {
                       // new order
                       _data.readFile('cart', email, (error, data) => {
                         if (!error && data) {
                           pizza.quantity = cartDetails.quantity;
                           data.push(pizza);
                           _data.updateFile('cart', email, data, (error) => {
                             if (!error) {
                               // send latest cart
                               callback(200, data);
                             } else {
                               callback(400, {'error':'Error adding item to cart'});
                             }
                           });
                         } else {
                           callback(400, {'error':'Error adding item to cart'});
                         }
                       });
                     }
                   })
                 } else {
                   callback(400, {'error':'Not a valid pizza'});
                 }
               });
             } else {

              _data.readFile('menu', 'menu', (error, menuData) => {
                var found = false;
                var foundPizza = false;
                if (!error && menuData) {
                  var itemsProcessed = 0;
                  menuData.forEach((pizza, index, array) => {
                    if (pizza.id == cartDetails.id) {
                      found = true;
                      foundPizza = pizza;
                      foundPizza.quantity = cartDetails.quantity;
                    }

                    itemsProcessed++;
                    if(itemsProcessed === array.length) {
                      if (found) {
                        var cartArray = [];
                        cartArray.push(foundPizza);
                        // cart is empty
                        _data.createFile('cart', email, cartArray, (error) => {
                          if (!error) {
                            callback(200, cartArray);
                          } else {
                            callback(400, {'error':'Could not add items to cart'});
                          }
                        });
                      } else {
                        callback(400, {'error':'not a valid pizza, please check your order'});
                      }
                    }
                  });
                } else {
                  callback(400, {'error':'Unable to add to cart'});
                }
              });
             }
           });
       } else {
         callback(401, {'error':'Not a valid token'});
       }
     });
   } else {
     callback(400, {'error':'missing required fields.'});
   }
 };

 /**
  * Checks if the provided id is valid pizza id.
  **/
 cart.getValidPizzaForId = (pizzaId, callback) => {
   _data.readFile('menu', 'menu', (error, data) => {
     if (!error && data) {
       var found = false;
       var count = 0;
       data.forEach((pizza, index, array) => {
         count++;
         if (pizza.id == pizzaId) {
           found = true;
           callback(pizza);
         }
         if (array.length == count) {
           if (!found) {
             callback(false);
           }
         }
       });
     } else {
       callback(false);
     }
   });
 };

 /**
  * Checks if the provided id is present in existing cart of the user.
  **/
 cart.getValidPizzaForIdFromCart = (email, pizzaId, callback) => {
   _data.readFile('cart', email, (error, data) => {
     if (!error && data) {
       var found = false;
       var count = 0;
       data.forEach((pizza, index, array) => {
         count++;
         if (pizza.id == pizzaId) {
           found = true;
           callback(pizza);
         }
         if (array.length == count) {
           if (!found) {
             callback(false);
           }
         }
       });
     } else {
       callback(false);
     }
   });
 };

 module.exports = cart;
