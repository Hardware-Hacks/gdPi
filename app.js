var express = require('express');
var http = require('http');
var _ = require('underscore');
var Stream = require('stream');
var m3u8 = require('m3u8');
var hls = require('hls-buffer');
var request = require('request');

var app = express();

// Credit: https://github.com/joshvillbrandt/GoProController/
var goProIP = '10.5.5.9'

var previewURL = {
  path: '/live/amba.m3u8',
  port: 8080
}

var statusURL = {
  path: '/CMD?t=PWD',
  port: 80
}

var commandURL = {
  path: '/CMD?t=PWD&p=%VAL',
  port: 80
}

var statusTemplate = {
  'summary': 'notfound', // one of 'notfound', 'off', 'on', or 'recording'
  'raw': {}
}

var _hexToDec = function(val) {
  return parseInt(val, 16);
}

var commands = {
  'power': {
    'cmd': 'bacpac/PW',
    'values': {
      true: '01',
      false: '00'
    }
  },
  'record': {
    'cmd': 'camera/SH',
    'values': {
      true: '01',
      false: '00'
    }
  },
  'mode': {
    'cmd': 'camera/CM',
    'values': {
      'video': '00',
      'still': '01'
    }
  }
}

var statuses = {
  'bacpac/se': {
    'power': {
      'a': 18,
      'b': 20,
      'translate': {
        '00': 'off',
        '01': 'on'
      }
    }
  },
  'camera/se': {
    'batt1': {
      'a': 38,
      'b': 40,
      'translate': _hexToDec
    }
  },
  'camera/sx': { // the first 62 bytes of sx are almost the same as se
    'mode': {
      'a': 2,
      'b': 4,
      'translate': {
        '00': 'video',
        '01': 'still',
        '02': 'burst',
        '03': 'timer',
        '07': 'settings'
      }
    },
    'fov': {
      'a': 14,
      'b': 16,
      'translate': {
        '00': '170',
        '01': '127',
        '02': '90'
      }
    },
    'picres': {
      'a': 17,
      'b': 18,
      'translate': {
        '3': '5MP med',
        '6': '7MP med',
        '4': '7MP wide',
        '5': '12MP wide'
      }
    },
    'secselapsed': {
      'a': 26,
      'b': 30,
      'translate': _hexToDec
    },
    'orientation': {
      'a': 37,
      'b': 38,
      'translate': {
        '0': 'up',
        '4': 'down'
      }
    },
    'charging': {
      'a': 39,
      'b': 40,
      'translate': {
        '3': 'no',
        '4': 'yes'
      }
    },
    'mem': { // i really have no idea what this is
      'a': 42,
      'b': 46,
      'translate': _hexToDec
    },
    'npics': {
      'a': 46,
      'b': 50,
      'translate': _hexToDec
    },
    'minsremaining': {
      'a': 50,
      'b': 54,
      'translate': _hexToDec
    },
    'nvids': {
      'a': 54,
      'b': 58,
      'translate': _hexToDec
    },
    'record': {
      'a': 60,
      'b': 62,
      'translate': {
        '05': 'on',
        '04': 'off'
      }
    },
    'batt2': {
      'a': 90,
      'b': 92,
      'translate': _hexToDec
    },
    'vidres': {
      'a': 100,
      'b': 102,
      'translate': {
        '00': 'WVGA',
        '01': '720p',
        '02': '960p',
        '03': '1080p',
        '04': '1440p',
        '05': '2.7K',
        '06': '2.7KCin',
        '07': '4K',
        '08': '4KCin'
      }
    },
    'fps': {
      'a': 102,
      'b': 104,
      'translate': {
        '00': '12',
        '01': '15',
        '02': '24',
        '03': '25',
        '04': '30',
        '05': '48',
        '06': '50',
        '07': '60',
        '08': '100',
        '09': '120',
        '10': '240'
      }
    }
  }
}

app.get('/status', function(req, res) {
  var password = req.query.password; // Later, replace with a stored password so we don't have to transmit it with each request
  var status = JSON.parse(JSON.stringify(statusTemplate)); // Hacky deep copy

  for (command in statuses) {
    (function(cmd) {
      var request = http.request({
        host: goProIP,
        path: statusURL['path'].replace('CMD', cmd).replace('PWD', password),
        port: statusURL['port'],
        method: 'GET'
      }, function(response) {
        console.log('###############################################');
        console.log(statusURL['path'].replace('CMD', cmd).replace('PWD', password));
        var dataArray = [];

        response.on('data', function(chunk) {
          dataArray.push(chunk); // Append octet stream data to our data
        }).on('end', function(chunk) {
          data = (new Buffer(dataArray[0])).toString('hex'); // the data that comes back is an array itself; we don't want a 2D array
          console.log("Data:\t\t\t\t" + data);
          status['raw'][cmd] = data; // save raw response

          // loop through different parts that we know how to translate
          for (item in statuses[cmd]) {
            var args = statuses[cmd][item];
            var part = data.slice(args['a'], args['b']);

            console.log("Translate:\t\t\t" + JSON.stringify(args['translate']));

            // translate the response value if we know how
            if (typeof args['translate'] == 'function') {
              console.log("args['translate'](part):\t" + JSON.stringify(args['translate'](part)));
              status[item] = args['translate'](part);
            } else if (typeof args['translate'] == 'object') {
              console.log("args['translate'][part]:\t" + JSON.stringify(args['translate'][part]));
              status[item] = args['translate'][part[1]];
            } else {
              status[item] = part;
            }

            console.log("Args:\t\t\t\t" + JSON.stringify(args));
            console.log("Item:\t\t\t\t" + item);
            console.log("Part:\t\t\t\t" + JSON.stringify(part));
            console.log();
          }

          // console.log("Status:\n" + JSON.stringify(status, undefined, 2));
        }).on('error', function(error) { // something went wrong
          console.log(error);
        });
      }).on('error', function(error) {
        console.log('problem with request: ' + error.message)
      }).end();
    })(command);
  }

  res.end();
});

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

app.use(function (error, req, res, next) {
  if (!error) {
    next();
  } else {
    console.error(error.stack);
    res.send(500);
  }
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
