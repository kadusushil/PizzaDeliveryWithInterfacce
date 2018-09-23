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
  // init data module
  // _data.init();
  // TODO only for testing and should be removed.
  // _data.createFile('users', 'abcdef', {'abc':123}, (error)=>{
  //   console.log('Received file status: ', error);
  //   if (!error) {
  //     _data.listFiles('users', false, (error, fileNames)=> {
  //       if (!error) {
  //         fileNames.forEach((fileName)=> {
  //           console.log('FILE: ', fileName);
  //         });
  //       }
  //     });
  //   }
  // });
  // _data.updateFile('users', 'testing', {'def':456}, (error)=> {
  //   console.log('The file is updated: ', error);
  // });
  //
  // _data.readFile('users', 'testing', (error, data)=> {
  //   console.log('File content: ', data);
  // });
  server.init();
}

app.init();

module.exports = app;
