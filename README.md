# Homework Assignment #2

This project has codebase for assignment #2.

# How to run
Before you run the project, we need to set environment variables for Mailgun and
Stripe.
We have used Mailgun for sending email after order is placed. Use following
command to set private key via command prompt

```
export MAILGUN=<<private key from mailgun>>
```

The reason being, mailgun privacy policy does not allow the token being committed
to open repositories like github or bitbucket.

Similar to this, I've also exported Stripe token secret key. Use following command.
export STRIPE=<<Stripe test secret key>>

The reason is same, it's privacy policy does not allow it's token being flaunted
openly.

Once these 2 steps are done, you can use one of the following commands to run the
project.

```
$ NODE_ENV=staging node index.js // for staging environment
$ NODE_ENV=production node index.js // for production environment
```

# Services
It offers following services.

## Create new user
* Method: POST
* Endpoint: http://localhost:8000/user
* Headers: None
* Body: It should have following mandatory fields
email, phone, password, countryCode, streetAddress, pinCode

Following is sample Body

```
{"email" : "validEmail@OfTheUser.com"
,"phone":"1247612741"
,"password":"<<password according to password policy>>"
,"countryCode" : 91
,"streetAddress" : "Plot no 21, Badrinath society parate layout, Nagpur, Maharashtra"
,"pinCode" : "440025"
}
```

**Note:** After signup, you do not immediately get token. You need to login to get
      token which can be used for sub-sequent api calls.

## Delete user
* Method: DELETE
* Endpoint: http://localhost:8000/user?email=valid@email.com
* Headers: token
* Body:
      email

Sample response
```
{}
```

## Login
* Method: POST
* Endpoint: http://localhost:8000/auth
* Headers: None
* Body:
     email, password
Following is sample body
```
{"email" : "validEmail@OfTheUser.com"
,"password":"<<password according to password policy>>"
}
```

Response:
```
{
    "token": "wri2zkgbah46oemocm4c",
    "email": "validEmail@OfTheUser.com",
    "expiry": 1537000359708
}
```

Expiry for staging is 24 hours and production is one hour.

## Get user data
* Method: GET
* Endpoint: http://localhost:8000/user
* Headers: token (token received after user login)
* QueryString: email=validEmail@OfTheUser.com
* Body: None

Sample URL: http://localhost:8000/user?email=validEmail@OfTheUser.com

Response:
```
{
    "email": "validEmail@OfTheUser.com",
    "phone": "3423412412",
    "countryCode": 91,
    "streetAddress": "Plot no 21, Badrinath society parate layout, Nagpur",
    "pinCode": "440025",
    "orders": [
        "532hym8fu0",
        "ogv20fkybo",
        "d3qzo747ta",
        "6gx1yz81g9",
        "y5tevzh1d1",
        "8tiom6sdoj"
    ]
}
```

## Update user data
* Method: PUT
* Endpoint: http://localhost:8000/user
* Headers: token (token received after login)
* QueryString : email=validEmail@OfTheUser.com
* Body:
email and other fields which you want to update.

**Note 1:** You can not update email

**Note 2:** You can pass email either in query string or through body. Either of it
is mandatory.

Sample URL:
http://localhost:8000/user?email=validEmail@OfTheUser.com

Sample Response:
```
{
    "email": "validEmail@OfTheUser.com",
    "phone": "1287412921",
    "countryCode": 91,
    "streetAddress": "Plot no 21, Badrinath society parate layout, Nagpur",
    "pinCode": "440024",
    "orders": [
        "532hym8fu0",
        "ogv20fkybo",
        "d3qzo747ta",
        "6gx1yz81g9",
        "y5tevzh1d1",
        "8tiom6sdoj"
    ]
}
```

You will get whole response with update data.

## Delete user account
* Method: DELETE
* Endpoint: http://localhost:8000/user
* Headers: token (valid token obtained after user login)
* QueryString: email=validEmail@OfTheUser.com
* Body: email=validEmail@OfTheUser.com

**Note:** Email can be passed either through query string or through body. Either of
it is mandatory.

Sample Response:
```
{} // empty object
```

## Get pizza menu
* Method: GET
* Endpoint: http://localhost:8000/menu
* Headers: token (valid token)

Sample Response:
```
[
    {
        "id": 111111,
        "title": "Neapolitan Pizza",
        "description": "Neapolitan is the original pizza. This delicious pie dates all the way back to 18th century in Naples, Italy. During this time, the poorer citizens of this seaside city frequently purchased food that was cheap and could be eaten quickly. Luckily for them, Neapolitan pizza – a flatbread with tomatoes, cheese, oil, and garlic – was affordable and readily available through numerous street vendors.",
        "price": "$4.59",
        "picture": "https://cdnimg.webstaurantstore.com/uploads/buying_guide/2014/11/pizzatypes-margherita-.jpg"
    },
    {
        "id": 222222,
        "title": "Chicago Pizza",
        "description": "Chicago pizza, also commonly referred to as deep-dish pizza, gets its name from the city it was invented in. During the early 1900’s, Italian immigrants in the windy city were searching for something similar to the Neapolitan pizza that they knew and loved. Instead of imitating the notoriously thin pie, Ike Sewell had something else in mind. He created a pizza with a thick crust that had raised edges, similar to a pie, and ingredients in reverse, with slices of mozzarella lining the dough followed by meat, vegetables, and then topped with a can of crushed tomatoes. This original creation led Sewell to create the now famous chain restaurant, Pizzeria Uno.",
        "price": "$5.59",
        "picture": "https://cdnimg.webstaurantstore.com/uploads/buying_guide/2014/11/pizzatypes-deepdish.jpg"
    },
    {... other options ...}
  ]
  ```


## Add item/items to cart
* Method: POST
* Endpoint: http://localhost:8000/cart
* Headers: token
* QueryString: email
* Body: Array with itemid and quantity. Please see sample data below.

```
{"id":222222, "quantity":4}
```

This tells server, what type of pizza and in how much quantity.
If the id is not valid then error is returned

Sample Response : It will return current cart
```
[
    {
        "id": 333333,
        "title": "New York Style Pizza",
        "description": "While New York-style pizza isn’t exactly the original, it’s become the most popular and widespread choice in the United States. Even though Neapolitan and New York pizzas share similarities, there are distinct differences. Some people will tell you that it’s the minerals in the Big Apple’s water used to make the dough that makes this pizza stand out. However, in order to make a proper New York-style pie, the crust still needs to be thin, like a Neapolitan, but thick enough to fold a slice in half lengthwise. This simplifies eating the pizza without utensils, which is a necessity in New York City's fast-paced setting.",
        "price": "$5.19",
        "picture": "https://cdnimg.webstaurantstore.com/uploads/blog/2016/8/flat.jpg",
        "quantity": 4
    },
    {
        "id": 444444,
        "title": "Sicilian Pizza",
        "description": "Sicilian pizza, also known as sfincione, may seem like a distant cousin of a Chicago-style pie, but the two have their differences. It's not even the same pizza that you'd get in Sicily. So what’s the deal with this complicated pizza? Well, no matter what country you get this square cut, thick crust pizza from, it should always have a spongier consistency than other pizzas. However, sfincione is typically topped with a tomato sauce, onions, herbs, anchovies, and then covered with bread crumbs. This version is typically served on holidays like Christmas and New Year’s Eve in Sicily. But in America, Sicilian pizza features a simple combination of tomato sauce and mozzarella cheese and is eaten all year round.",
        "price": "$3.99",
        "picture": "https://cdnimg.webstaurantstore.com/uploads/blog/2016/8/rectangle.jpg",
        "quantity": 4
    }
]
```
Note: When you send items to cart, it checks the existing cart and if item is
found in cart then it's count is incremented otherwise it is added to the cart.

## Get current cart
* Method: GET
* Endpoint: http://localhost:8000/cart?email=validEmailAddress@test.com
* Headers: token
* QueryString: email
* Body: Array with itemid and quantity. Please see sample data below.

The response would be similar one mentioned above in add cart(POST)

## Delete the cart
* Method: DELETE
* Endpoint: http://localhost:8000/cart?email=validEmailAddress@test.com
* Headers: token
* QueryString: email
* Body: email
You can pass email in either queryString or as a part of body

## Checkout the cart
* Method: POST
* Endpoint: http://localhost:8000/checkout
* Headers: token
* QueryString: email (email=valid@email.com)
* Body: stripeToken and email (email can be sent as part of queryString also)

```
{"stripeToken":"<<valid stripe token>>"}
```

Sample Response:
```
{
    "order_id": "rg0ucdk34c"
}
```

## Order History
* Method: POST
* Endpoint: http://localhost:8000/history
* Headers : token
* Body : email and orderId

Sample Body:
```
{"orderId":"rg0ucdk34c", "email":"validemail@test.com"}
```

Sample Response:
```
{
    "order_id": "rg0ucdk34c",
    "details": [
        {
            "id": 444444,
            "title": "Sicilian Pizza",
            "description": "Sicilian pizza, also known as sfincione, may seem like a distant cousin of a Chicago-style pie, but the two have their differences. It's not even the same pizza that you'd get in Sicily. So what’s the deal with this complicated pizza? Well, no matter what country you get this square cut, thick crust pizza from, it should always have a spongier consistency than other pizzas. However, sfincione is typically topped with a tomato sauce, onions, herbs, anchovies, and then covered with bread crumbs. This version is typically served on holidays like Christmas and New Year’s Eve in Sicily. But in America, Sicilian pizza features a simple combination of tomato sauce and mozzarella cheese and is eaten all year round.",
            "price": "$3.99",
            "picture": "https://cdnimg.webstaurantstore.com/uploads/blog/2016/8/rectangle.jpg",
            "quantity": 2
        },
        {
            "id": 222222,
            "title": "Chicago Pizza",
            "description": "Chicago pizza, also commonly referred to as deep-dish pizza, gets its name from the city it was invented in. During the early 1900’s, Italian immigrants in the windy city were searching for something similar to the Neapolitan pizza that they knew and loved. Instead of imitating the notoriously thin pie, Ike Sewell had something else in mind. He created a pizza with a thick crust that had raised edges, similar to a pie, and ingredients in reverse, with slices of mozzarella lining the dough followed by meat, vegetables, and then topped with a can of crushed tomatoes. This original creation led Sewell to create the now famous chain restaurant, Pizzeria Uno.",
            "price": "$5.59",
            "picture": "https://cdnimg.webstaurantstore.com/uploads/buying_guide/2014/11/pizzatypes-deepdish.jpg",
            "quantity": 2
        }
    ]
}
```
