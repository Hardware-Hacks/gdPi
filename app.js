var request = require('request');
var express = require('express');

var app = express();
  
app.get('/:ip/:password/:action/:actionNumber', function(req, response) {
  var ip = req.params.ip;
  var password = req.params.password;
  var action = req.params.action;
  var actionNumber = req.params.actionNumber;

 request(
    { method: 'GET', 
      uri: 'http://' + ip + '/bacpac/' + action + '?t=' + password + '&p=%' + actionNumber
    }, function (error, response, body) {
      console.log("recording")
    }
  )


});
  
app.listen(8080);

// Turn on camera : http://<ip>/bacpac/PW?t=<password>&p=%01
// Turn off camera : http://<ip>/bacpac/PW?t=<password>&p=%00
// Change mode    : http://<ip>/bacpac/PW?t=<password>&p=%02
// http://10.5.5.9/bacpac/PW%3Ft=goprohero&p=%01
 
// Start capture : http://<ip>/bacpac/SH?t=<password>&p=%01
// Stop capture : http://<ip>/bacpac/SH?t=<password>&p=%00
// 10.5.5.9
// goprohero
