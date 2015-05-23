/*
 * Gather archive.org and whois data
 * For the UK Companies and the wev publication
 * by Francesco Merletti and Marta Musso
 */

// Require necessary libs
var request = require('request'),
  cheerio = require('cheerio'),
  csv     = require('fast-csv'),
  fs      = require('fs'),
  moment  = require('moment'),
  jsSHA   = require('jssha'),
  dp      = require('domain-parser'),
  url     = require('url');

// Import Config
var i = 0,
  config = require('./config');


// PROCESS
console.log('Start processing');

csv
  .fromPath(config.inCsv, {headers: true})
  .transform(function (biz, next) {
    'use strict';

    // If it's a duplicate skip it
    if (biz.duplicates === 'dup') {
      next(null, biz);
      return;
    }

    // Log progress
    console.log('Processing item ' + i + ' domain: ' + getDomain(biz.originalUrl));
    i = i + 1;

    getWhoisData(biz, function (biz) {
      getArchiveData(biz, function (biz) {
        next(null, biz);
      });
    });

  })
  .pipe(csv.createWriteStream({headers: true}))
  .pipe(fs.createWriteStream(config.outCsv, {encoding: "utf8"}));


// UTILITIES
function getDomain(customUrl) {
  'use strict';
  return dp(url.parse(customUrl).hostname).domainName;
}

function getWhoisData(biz, callback) {
  'use strict';
  // If we already have whois data or if we don't have an origialUrl or if the domain is actually an IP address then skip this step
  if (biz.whoisDomain || biz.whoisDomain !== '' || biz.archiveUrl === '' || isIPaddress(getDomain(biz.originalUrl))) {
    console.log('  Whois: Skipped');
    callback(biz);
    return;
  }

  // Otherwise make request to bulk-whois-api.com
  var domain = getDomain(biz.originalUrl),
    date = moment.utc().format('YYYY-MM-DD HH:mm:ss'),
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
      console.log('  Whois: Error - There was an error with the whois request.');
      callback(biz);
      return;
    }

    try {
      body = JSON.parse(body);
    } catch (err) {
      console.log('  Whois: Error - Whois response was not JSON:' + err);
      console.log('  Response:' + body);
      callback(biz);
      return;
    }

    if (response.statusCode !== 200 || body.success !== 1) {
      console.log('  Whois: Error - There was an error in the whois response:' + body.message);
      callback(biz);
      return;
    }

    // Add whois data to biz object
    biz.whoisDomain                   = (body.output.domain ? body.output.domain : domain);
    biz.whoisUpdatedDate              = (body.output.updated_on ? body.output.updated_on : '');
    biz.whoisCreationDate             = (body.output.created_on ? body.output.created_on : '');
    biz.whoisExpirationDate           = (body.output.expires_on ? body.output.expires_on : '');
    biz.whoisRegistrar                = (body.output.registrar && body.output.registrar.name ? body.output.registrar.name : '');
    biz.whoisRegistrarUrl             = (body.output.registrar && body.output.registrar.url ? body.output.registrar.url : '');
    biz.whoisRegistrantName           = (body.output.registrant_contact && body.output.registrant_contact.name ? body.output.registrant_contact.name : '');
    biz.whoisRegistrantOrganization   = (body.output.registrant_contact && body.output.registrant_contact.organization ? body.output.registrant_contact.organization : '');
    biz.whoisRegistrantStreet         = (body.output.registrant_contact && body.output.registrant_contact.address ? body.output.registrant_contact.address : '');
    biz.whoisRegistrantCity           = (body.output.registrant_contact && body.output.registrant_contact.city ? body.output.registrant_contact.city : '');
    biz.whoisRegistrantStateProvince  = (body.output.registrant_contact && body.output.registrant_contact.state ? body.output.registrant_contact.state : '');
    biz.whoisRegistrantPostalCode     = (body.output.registrant_contact && body.output.registrant_contact.zip ? body.output.registrant_contact.zip : '');
    biz.whoisRegistrantCountry        = (body.output.registrant_contact && body.output.registrant_contact.country_code ? body.output.registrant_contact.country_code : '');
    biz.whoisRegistrantPhone          = (body.output.registrant_contact && body.output.registrant_contact.phone ? body.output.registrant_contact.phone : '');
    biz.whoisRegistrantFax            = (body.output.registrant_contact && body.output.registrant_contact.fax ? body.output.registrant_contact.fax : '');
    biz.whoisRegistrantEmail          = (body.output.registrant_contact && body.output.registrant_contact.email ? body.output.registrant_contact.email : '');
    biz.whoisNameServer               = (body.output.nameservers && body.output.nameservers[0] && body.output.nameservers[0].name ? body.output.nameservers[0].name : '');

    console.log('  Whois: Succeeded');
    callback(biz);
  });
}

function getArchiveData(biz, callback) {
  'use strict';
  // If we already have archive data or if we don't have an archiveUrl then skip this step
  if (biz.archiveCaptures || biz.archiveCaptures !== '' || biz.archiveUrl === '') {
    console.log('  Archive: Skipped');
    callback(biz);
    return;
  }
  // Otherwise make archive.org request
  request(biz.archiveUrl, function (err2, response, body) {
    if (!err2) {
      var $ = cheerio.load(body),
        dates    = $('#wm-ipp-inside > table > tbody > tr > td.c > table > tbody > tr:nth-child(2) > td.s > div').html(),
        captures = $('#wm-ipp-inside > table > tbody > tr > td.c > table > tbody > tr:nth-child(2) > td.s > a').html();
      if (dates && captures) {
        biz.archiveCaptures     = captures.split(' ')[0];
        biz.archiveFirstCapture = dates.split(' - ')[0];
        biz.archiveLastCapture  = dates.split(' - ')[1];
      }
    }
    console.log('  Archive: Success');
    callback(biz);
  });
}

// from http://www.w3resource.com/javascript/form/ip-address-validation.php
function isIPaddress(ipaddress) {
  if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {
    return (true)
  }
  return (false)
}
