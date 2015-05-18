// A simplified implementation for bulk-whois-api.com

// To install dependencies run:
// npm install request moment jssha --save

// Require necessary libs
var request = require('request'),
  moment  = require('moment'),
  jsSHA   = require('jssha'),
  config = {
    bwaKey:     'XXX',
    bwaSecret:  'XXX',
    bwaBaseUrl: 'https://bulk-whois-api.com/api/query'
  };

function getWhoisData(domain, callback) {
  'use strict';

  var date = moment.utc().format('YYYY-MM-DD HH:mm:ss'),
    requestBody = 'query=' + domain,
    shaObj = new jsSHA(config.bwaKey + date + requestBody, 'TEXT'),
    options = {
      url: config.bwaBaseUrl,
      method: 'POST',
      body: requestBody,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Key': config.bwaKey,
        'Time': date,
        'Sign': shaObj.getHMAC(config.bwaSecret, "TEXT", "SHA-512", "HEX").toLowerCase()
      }
    };
  request(options, function (err, response, body) {
    if (err) {
      console.log('There was an error with the whois request.');
      callback(err, null);
      return;
    }

    body = JSON.parse(body);

    if (response.statusCode !== 200 || body.success !== 1) {
      console.log('There was an error in the whois response.');
      callback('Error', null);
      return;
    }

    // get the data you need here or return the whole body.output
    callback(null, body.output);
  });
}

getWhoisData('google.com', function (err, data) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(data);
})
