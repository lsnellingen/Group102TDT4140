var bodyParser = require('body-parser');
var express = require('express');
var morgan = require('morgan');
var ora = require('ora');
var path = require('path');
var stormpath = require('express-stormpath');
var webpack = require('webpack');


var config = require('./webpack.config');

var port = process.env.PORT || 3000;

const mysql = require('mysql');

var app = express();
var compiler = webpack(config);

var spinner = ora({
  interval: 100
});

function failAndExit(err) {
  spinner.fail();
  console.error(err.stack);
  process.exit(1);
}

app.use(morgan('combined'));

app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}));

app.use('/css', express.static(__dirname + '/src/css'));

app.use(stormpath.init(app, {
  web: {
    produces: ['application/json'],
    me: {
      expand: {
        customData: true
      }
    }
  }
}));

var connection = mysql.createConnection({
  host     : 'mysql.stud.ntnu.no',
  user     : 'larssne_edubot',
  password : '54321',
  database : 'larssne_edubot',
  debug    : true
});

app.post('/me', stormpath.authenticationRequired, bodyParser.json(), function (req, res) {
  function writeError(message) {
    res.status(400);
    res.json({ message: message, status: 400 });
    res.end();
  }

  function saveAccount() {
    req.user.givenName = req.body.givenName;
    req.user.surname = req.body.surname;
    req.user.email = req.body.email;

    if ('color' in req.body.customData) {
      req.user.customData.color = req.body.customData.color;
    }

    req.user.save(function (err) {
      if (err) {
        return writeError(err.userMessage || err.message);
      }
      res.end();
    });
  }

  if (req.body.password) {
    var application = req.app.get('stormpathApplication');

    application.authenticateAccount({
      username: req.user.username,
      password: req.body.existingPassword
    }, function (err) {
      if (err) {
        return writeError('The existing password that you entered was incorrect.');
      }

      req.user.password = req.body.password;

      saveAccount();
    });
  } else {
    saveAccount();
  }
});

app.get('/api/subject/', function(req, res) {
  connection.query("SELECT * FROM feedback", function(error, rows, fields) {
    if(!!error) {
      console.log("Error");
    }else {
      res.send(rows);
    }
  });
});

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'src/html/index.html'));
});

spinner.text = 'Starting Dev Sever on port ' + port,
spinner.start();

app.on('error', failAndExit);
app.on('stormpath.error', failAndExit);

app.listen(port, function () {
  spinner.succeed();
  spinner.text = 'Initializing Stormpath';
  spinner.start();
  app.on('stormpath.ready', function () {
    spinner.succeed();
    console.log('\nListening at http://localhost:' + port);
    // Now bring back error logging.
    app.get('stormpathLogger').transports.console.level = 'error';
  });
  connection.connect(function(error) {
    if(!!error) {
      console.log("Error connecting to database");
    }else {
      console.log("Successfully connected to database");
    }
  });

});
