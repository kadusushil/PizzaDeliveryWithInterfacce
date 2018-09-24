/**
 * This file provide following things.
 * - Entry into application
 * - Initilizes the app
 **/

const http = require('http');
const https = require('https');
const _data = require('./lib/data');
const config = require('./lib/config');
const server = require('./lib/server');

var app = {};

app.init = () => {
  server.init();
}

app.init();

module.exports = app;
