/**
 * Holds the configuration parameters of the application.
 **/

const config = {};

/**
 * Staging confiuration
 * Token expiry will be here for 24 hours
 **/
config.staging = {
  'httpPort' : 8000,
  'httpsPort' : 8001,
  'envMode' : 'staging',
  'hashingSecret' : 'StagingSecRet',
  'tokenExpiry' : 24 * 60 * 60 * 1000,
  'passwordLength' : 5
};

/**
 * Production configuration
 * Token expiry here will be 1 hour
 **/
config.production = {
  'httpPort' : 9000,
  'httpsPort' : 9001,
  'envMode' : 'production',
  'hashingSecret' : 'ProductionSecRet',
  'tokenExpiry' : 1 * 60 * 60 * 1000,
  'passwordLength' : 8
};

var environment = typeof(config[process.env.NODE_ENV]) !== 'undefined'
                  ? config[process.env.NODE_ENV] : config.staging;

environment.mailgun = process.env.MAILGUN;
environment.stripe = process.env.STRIPE;

module.exports = environment;
