var express = require('express');
var http = require('http');
var _ = require('underscore');
var Stream = require('stream');
var m3u8 = require('m3u8');
var hls = require('hls-buffer');
var request = require('request');

var app = express();

Object.size = function(obj) {
  var size = 0, key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) size++;

  }

  return size;
};

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

var _hexToDec = function(val) {
  return parseInt(val, 16);
}

// Convert the GoPro's estimated remaining photos to memory left
var _picsToMem = function(val) { // Picz II Men
  return _hexToDec(val) * 6847116.72194287;
}

var commands = {
  // Josh Villbrandt's findings
  'power': {
    'cmd': 'bacpac/PW',
    'wait': 3500,
    'values': {
      true: '01',
      false: '00'
    }
  },
  'record': {
    'cmd': 'camera/SH',
    'wait': 0,
    'values': {
      true: '01',
      false: '00'
    }
  },

  // Commands and values from http://goprouser.freeforums.org/howto-livestream-to-pc-and-view-files-on-pc-smartphone-t9393-150.html
  'preview': {
    'cmd': 'camera/PV',
    'wait': 0,
    'values': {
      true: '02',
      false: '00'
    }
  },
  'mode': {
    'cmd': 'camera/CM',
    'wait': 0,
    'values': {
      'video': '00',
      'photo': '01',
      'burst': '02',
      'timer': '03',
      'settings': '07'
    }
  },
  'orientation': {
    'cmd': 'camera/UP',
    'wait': 0,
    'values': {
      'up': '00',
      'down': '01'
    }
  },
  'vidres': {
    'cmd': 'camera/VV',
    'wait': 0,
    'values': {
      'WVGA': '00',
      '720p': '01',
      '960p': '02',
      '1080p': '03',
      '1440p': '04',
      '2.7K': '05',
      '2.7KCin': '06',
      '4K': '07',
      '4KCin': '08'
    }
  },
  'fov': { // Field of view - doesn't work on Hero 3+
    'cmd': 'camera/FV',
    'wait': 0,
    'values': {
      'wide': '00',
      'medium': '01',
      'narrow': '02'
    }
  },
  'picres': { // doesn't work on Hero 3+
    'cmd': 'camera/PR',
    'wait': 0,
    'values': {
      '11mp-wide': '00',
      '8mp-medium': '01',
      '5mp-wide': '02',
      '5mp-medium': '03',
    }
  },
  'timer': {
    'cmd': 'camera/TI',
    'wait': 0,
    'values': { // 'seconds': 'seconds as hex'
      '0.5': '00', // the exception to the rule
      '1': '01',
      '2': '02',
      '5': '05',
      '10': '0a',
      '30': '1e',
      '60': '3c'
    }
  },
  'locate': {
    'cmd': 'camera/LL',
    'wait': 0,
    'values': {
      true: '01',
      false: '00'
    }
  },
  'bipvol': { // bip volume
    'cmd': 'camera/BS',
    'wait': 0,
    'values': { // percent
      0: '00',
      70: '01',
      100: '02',
    }
  }
}

var statuses = {
  'bacpac/se': {
    'power': {
      'a': 18,
      'b': 20,
      'translate': {
        '00': false,
        '01': true
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
        '01': 'photo',
        '02': 'burst',
        '03': 'timer',
        '07': 'settings'
      }
    },
    'timer': {
      'a': 10,
      'b': 12,
      'translate': {
        '00': '0.5', // the exception to the rule
        '01': '1',
        '02': '2',
        '05': '5',
        '0a': '10',
        '1e': '30',
        '3c': '60'
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
    'locating': {
      'a': 36,
      'b': 37,
      'translate': {
        '9': false,
        'd': true
      }
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
    'memoryLeft': { // Estimated photos left. Returned as actual memory remaining.
      'a': 42,
      'b': 46,
      'translate': _picsToMem
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
    'recording': {
      'a': 60,
      'b': 62,
      'translate': {
        '01': true,
        '04': false
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
    },
    'bipvol': {
      'a': 32,
      'b': 34,
      'translate': { // percent
        '00': '0',
        '01': '70',
        '02': '100',
      }
    }
  }
}

var getStatus = function(password, callback) {
  var status = {};

  var urls = [];
  var commands = [];

  // Construct an array of URL objects to pass to multiple requests
  for (command in statuses) {
    urls.push({
      host: goProIP,
      path: statusURL['path'].replace('CMD', command).replace('PWD', password),
      port: statusURL['port'],
      method: 'GET'
    });

    commands.push(command);
  }

  // Synchronously iterate asychronous requests via a recursive function
  var getPart = function(urls, commands) {
    url = urls.shift();
    cmd = commands.shift();

    var request = http.request(url, function(response) {
      var dataArray = [];

      response.on('data', function(chunk) {
        dataArray.push(chunk); // Append octet stream data to our data
      }).on('end', function(chunk) {
        // Convert and store the data as a hex string
        var data = (new Buffer(dataArray[0])).toString('hex'); // the data that comes back is an array itself; we don't want a 2D array
        console.log(data);

        // loop through different parts that we know how to translate
        for (item in statuses[cmd]) {
          var args = statuses[cmd][item];
          var part = data.slice(args['a'], args['b']);

          // translate the response value if we know how
          if (typeof args['translate'] == 'function') {
            status[item] = args['translate'](part);
          } else if (typeof args['translate'] == 'object') {
            status[item] = args['translate'][part];
          } else {
            status[item] = part;
          }
        }

        if (urls.length) {
          getPart(urls, commands);
        } else {
          callback(status);
        }
      }).on('error', function(error) { // something went wrong
        console.log(error);
      });
    }).on('error', function(error) {
      console.log('problem with request: ' + error.message)
    }).end();
  }

  getPart(urls, commands);
}

app.get('/status', function(req, res) {
  getStatus(req.query.password, function(status) {
    res.jsonp(JSON.stringify(status));
    res.end();
  });
});

app.get('/:command/:value', function(req, res) {
  if (_.has(commands, req.params.command) && _.has(commands[req.params.command]['values'], req.params.value)) {
    var request = http.request({
      host: goProIP,
      path: commandURL['path'].replace('CMD', commands[req.params.command]['cmd']).replace('PWD', req.query.password).replace('VAL', commands[req.params.command]['values'][req.params.value]),
      port: commandURL['port'],
      method: 'GET'
    }, function(response) {
      setTimeout(function() {
        getStatus(req.query.password, function(status) {
          res.jsonp(JSON.stringify(status));
          res.end();
        });
      }, commands[req.params.command]['wait']); // The GoPro doesn't update its status right away. We need to be patient.
    }).on('error', function(error) {
      console.log('problem with request: ' + error.message)
    }).end();
  } else {
    res.status(404).send('Not found.');
    res.end();
  }
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
  if (stream) {
    response.setHeader('Content-Type', 'video/mp2s');
    stream.pipe(response);
  } else {
    response.end();
  }
});

app.use(function (error, req, res, next) {
  if (!error) {
    next();
  } else {
    console.error(error.stack);
    res.send(500);
  }
});

app.listen(8080, function() {
  var request = http.request({
    host: goProIP,
    path: statusURL['path'].replace('CMD', 'bacpac/se').replace('PWD', 'goprohero'),
    port: statusURL['port'],
    method: 'GET'
  }, function(response) {
    console.log('whatever');
  }).on('error', function(error) { // something went wrong
    console.log(error);
  }).end();
});

// Turn on camera : http://<ip>/bacpac/PW?t=<password>&p=%01
// Turn off camera : http://<ip>/bacpac/PW?t=<password>&p=%00
// Change mode    : http://<ip>/bacpac/PW?t=<password>&p=%02
// http://10.5.5.9/bacpac/PW%3Ft=goprohero&p=%01


// Start capture : http://<ip>/bacpac/SH?t=<password>&p=%01
// Stop capture : http://<ip>/bacpac/SH?t=<password>&p=%00
// 10.5.5.9
// goprohero
