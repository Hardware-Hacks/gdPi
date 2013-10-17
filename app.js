var url = require('url');
var request = require('request');
var express = require('express');
var ejs = require('ejs');

var app = express();
  
app.get('/:ip/:password/:action/:actionNumber', function(req, response) {
  var ip = req.params.ip;
  var password = req.params.password;
  var action = req.params.action;
  var action = req.params.actionNumber;

  options = {
    protocol: "http:",
    host: ip,
    pathname: '/bacpac/' + action + '?t=' + password + '&p=%' + actionNumber
  };

  var goProURL = url.format(options);

  request(goProURL, function(err, res, body) {
    console.log(response);
  });
});
  
app.listen(8080);

// Turn on camera : http://<ip>/bacpac/PW?t=<password>&p=%01
// Turn off camera : http://<ip>/bacpac/PW?t=<password>&p=%00
// Change mode    : http://<ip>/bacpac/PW?t=<password>&p=%02
 
// Start capture : http://<ip>/bacpac/SH?t=<password>&p=%01
// Stop capture : http://<ip>/bacpac/SH?t=<password>&p=%00