// Single request example
// Used only for dev purposes

var request = require('request'),
	moment = require('moment'),
	jsSHA = require("jssha"),

    bwaKey = 'XXX',
    bwaSecret = 'XXX',
    bwaBaseUrl = 'https://bulk-whois-api.com/api/query';



// To repeat on each request
var domain = '167.216.224.214',
    date = moment.utc().format('YYYY-MM-DD HH:mm:ss'),
    requestBody = 'query='+domain,
    shaObj = new jsSHA(bwaKey+date+requestBody, "TEXT"),
    options = {
      url: bwaBaseUrl,
      method: 'POST',
      body: requestBody,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Key': bwaKey,
        'Time': date,
 		'Sign': shaObj.getHMAC(bwaSecret, "TEXT", "SHA-512", "HEX").toLowerCase()
      }
    };
request(options, function (err, response, body) {
  if (err) {
    console.log('There was an error with the request.');
    return;
  }

  body = JSON.parse(body);
  if (response.statusCode != 200 || body.success != 1) {
    console.log('There was an error with the response.');
    return;
  }



  console.log('response: '+JSON.stringify(response, null, 2));
  console.log('body: '+JSON.stringify(body, null, 2));
});

