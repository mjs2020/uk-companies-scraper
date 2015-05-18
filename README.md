## Description

This simple Nodejs script reads a list of companies scraped from web-directories in archive.org and fetches
information about their availability in the wayback machine as well as current WHOIS data for the domain.

Whois data is fetched from bulk-whois-api.com (which gives you 500 free queries or has plans for higher query amounts.)

## Installation
You will need to have Nodejs and NPM installed on your system. Clone or download this repository and then from the directory run:
    
    npm install
    
Then you will need to copy ```config.example.js``` to ```config.js``` and fill in the values for your bulk-whois-api.com API keys.

Make sure you have the data you would like to gather in an ```input.csv``` file following the example given (which only includes 10 entries).

## Usage

Run the script by issuing the following command:

    node scrape.js
    
If you would like to run this unattended on a server and keep the script running when you log off use nohup:

    nohup node scrape.js >log.txt &

## Credits

Script developed by Francesco Merletti http://fm.to.it

The script was developed as part of the publication _This is the future: a history of UK companies on the web (1996-2001)_

## Licence

(The MIT Licence)

Copyright (c) 2011-2015 Francesco Merletti

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
