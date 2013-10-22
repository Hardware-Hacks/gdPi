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


app.get('/videoDog', function(req, res) {

    // var boundary = "BoundaryString";

    var options = {
    // host to forward to
    host:   '10.5.5.9',
    // port to forward to
    port:   8080,
    // path to forward to
    path:   '/live/amba.m3u8',
    // request method
    method: 'GET',
    // headers to send
    headers: req.headers
  };

  var creq = http.request(options, function(cres) {

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    // res.setHeader('Content-Type', 'multipart/x-mixed-replace');        
    res.setHeader('Connection', 'close');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Cache-Control', 'no-cache, private');
    res.setHeader('Expires', 0);
    res.setHeader('Max-Age', 0);

    // wait for data
    var body = "";
    cres.on('data', function(chunk){
      console.log("cres.on data");
      body += chunk;      
    });

    cres.on('end', function(){
      var stream = new Stream();
      var parser = m3u8.createStream();      
      stream.pipe = function(dest) {
        console.log('stream.pipe');
        console.log(body);
        dest.write(body);
        console.log(dest);
      };

      console.log('cres.on end');

      stream.pipe(parser);

      parser.on('item', function(item) {      
        console.log('parse on item');
        item.set('uri', 'http://10.5.5.9/live/' + item.get('uri'));
      });

      parser.on('m3u', function(m3u) {

        console.log('parser on m3u');
        res.write(m3u);
        res.writeHead(cres.statusCode);
        res.end();
      });

    });

  }).on('error', function(e) {
    // we got an error, return 500 error to client and log error
    console.log(e.message);
    res.writeHead(500);
    res.end();
  });

  creq.end();

});


app.get('/index.m3u8', function(request, response) {

  var buffer = hls('http://10.5.5.9:8080/live/amba.m3u8');

  if (request.url === '/index.m3u8') {
        // first return a playlist
        buffer.playlist(function(err, pl) {
            response.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            console.log(pl);
            response.end(pl);
        });
    } else {
        // else return the linked segment
        var stream = buffer.segment(request.url);
        response.setHeader('Content-Type', 'video/mp2s');
        stream.pipe(response);
    }

});  


// app.get('/video', function(req, res) {
//     request({
//       method: 'GET', 
//       uri: 'http://10.5.5.9:8080/live/amba.m3u8'
//     }, function (error, res, body) {
//       response.header('Access-Control-Allow-Origin', "*");    
//       console.log(response);
//       response.writeHead('temp');
//       response.end();   
//     });

//   // var remoteUrl = remote + req.url;
//   // request(remoteUrl).pipe(res);


// });

app.listen(8080);

// Turn on camera : http://<ip>/bacpac/PW?t=<password>&p=%01
// Turn off camera : http://<ip>/bacpac/PW?t=<password>&p=%00
// Change mode    : http://<ip>/bacpac/PW?t=<password>&p=%02
// http://10.5.5.9/bacpac/PW%3Ft=goprohero&p=%01


// Start capture : http://<ip>/bacpac/SH?t=<password>&p=%01
// Stop capture : http://<ip>/bacpac/SH?t=<password>&p=%00
// 10.5.5.9
// goprohero
