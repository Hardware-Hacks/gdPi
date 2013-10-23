var request = require('request');
var express = require('express');
var http = require('http');
var Stream = require('stream');
var m3u8 = require('m3u8');
var hls = require('hls-buffer');

var app = express();

app.get('/:ip/:password/:action/:actionNumber', function(req, response) {
  var ip = req.params.ip;
  var password = req.params.password;
  var action = req.params.action;
  var actionNumber = req.params.actionNumber;

  console.log(action + '/' + actionNumber);

  request({
    method: 'GET',
    uri: 'http://' + ip + '/bacpac/' + action + '?t=' + password + '&p=%' + actionNumber
  }, function (error, res, body) {
    response.header('Access-Control-Allow-Origin', "*");
    console.log(response);
    response.writeHead('temp');
    response.end();
  });

});

var buffer = hls('http://10.5.5.9:8080/live/amba.m3u8');

app.get('/index.m3u8', function(request, response) {
  // first return a playlist
  buffer.playlist(function(err, pl) {
    response.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    console.log(pl);
    response.end(pl);
  });
});

app.get('/:hash.ts', function(request, response) {
  // return the linked segment
  var stream = buffer.segment(request.url);
  response.setHeader('Content-Type', 'video/mp2s');
  stream.pipe(response);
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
