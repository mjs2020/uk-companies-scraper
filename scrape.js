// Require necessary libs
var request = require("request"),
	cheerio = require("cheerio"),
    csv     = require("fast-csv"),
    whois   = require('whois-json'),
    fs      = require('fs'),
    url     = require('url');

/*
 *
 */

// Config
var config = {
  inCsv:  'companies.csv',
  outCsv:  'result.csv'
};


// PROCESS
var i=0;
console.log('Start processing');
csv
  .fromPath(config.inCsv, {headers: true})
  .transform(function(biz, next){
    // Get domain
    var domain = '';
    if (biz.originalUrl != '') {
      domain = getDomain(biz.originalUrl);
    }

    // Log progress
    console.log('Processing item ' + i + ' domain: ' + domain);
    i++;

    // Gather whois data
    whois(domain, function(err1, whoisData) {
      if (!err1) {
        biz.whoisDomain                   = whoisData.domainName;
        biz.whoisUpdatedDate              = whoisData.updatedDate;
        biz.whoisCreationDate             = whoisData.creationDate;
        biz.whoisRegistrar                = whoisData.registrar;
        biz.whoisRegistrarUrl             = whoisData.registrarUrl;
        biz.whoisRegistrantName           = whoisData.registrantName;
        biz.whoisRegistrantOrganization   = whoisData.registrantOrganization;
        biz.whoisRegistrantStreet         = whoisData.registrantStreet;
        biz.whoisRegistrantCity           = whoisData.registrantCity;
        biz.whoisRegistrantStateProvince  = whoisData.registrantStateProvince;
        biz.whoisRegistrantPostalCode     = whoisData.registrantPostalCode;
        biz.whoisRegistrantCountry        = whoisData.registrantCountry;
        biz.whoisRegistrantPhone          = whoisData.registrantPhone;
        biz.whoisRegistrantFax            = whoisData.registrantFax;
        biz.whoisRegistrantEmail          = whoisData.registrantEmail;
        biz.whoisNameServer               = whoisData.nameServer;
      }
      // Make archive.org request
      if (biz.archiveUrl != "") {
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
          next(null, biz);
        });
      } else {
        next(null, biz);
      }
    });
  })
  .pipe(csv.createWriteStream({headers: true}))
  .pipe(fs.createWriteStream(config.outCsv, {encoding: "utf8"}));


// UTILITIES
function getDomain (customUrl) {
  return url.parse(customUrl).hostname;
}
