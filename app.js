require('dotenv').config()

var express = require('express'),
    helmet = require('helmet'),
    exphbs = require('express-handlebars'),
    path = require('path')
    url = require('url'),
    bodyParser = require('body-parser'),
    mongo = require('mongodb'),
    mongoose = require('mongoose'),
    cookieParser = require('cookie-parser'),
    cookieSession = require('cookie-session'),
    path = require('path');

// Init App
var app = express();

// MongoDB
mongoose.Promise = require('bluebird');
var mongoose = mongoose.connect(process.env.MLAB, (err, client) => {
  if (err) {
    console.error(err)
  } else {
    console.log('MongoDB is connected')
  }
});

// Webpack
if (process.env.LOCAL === 'true') {
  var webpack = require('webpack')
  var webpackConfig = require('./webpack.config')
  var compiler = webpack(webpackConfig)
  var webpackDevMiddleware = require('webpack-dev-middleware')
  var webpackHotMiddleware = require('webpack-hot-middleware')
  app.use(webpackDevMiddleware(compiler, {
      publicPath: webpackConfig.output.publicPath,
      stats: {colors: true},
      reload: true,
      inline: true
    })
  )
  app.use(webpackHotMiddleware(compiler))  
}

// Set Static Folder
app.use(express.static(path.join(__dirname, 'assets/public')));

// Helmet
app.use(helmet())

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.text({ type: 'text/html', defaultCharset: 'utf-8' }))
app.use(cookieParser());

// Cookies Session
app.use(cookieSession({
  name: 'session',
  keys: ['key1','key2'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

// Locals
app.use(function(req, res, next){
  res.locals.user = req.session.user || null;
  if (process.env.LOCAL) {
    res.locals.env = true;
  } else {
    res.locals.env = false;
  }

  next();
});

// Router
var cms = require('./app/router/cmsRoutes');
var users = require('./app/router/userRoutes');
var activities = require('./app/router/activityRoutes')
var health = require('./app/router/healthRoutes')
app.use('/', cms)
app.use('/user', users)
app.use('/activities', activities)
app.use('/health', health)

// Handlebars
var hbs = exphbs.create({
  defaultLayout:'main',
  layoutsDir:'app/views/layouts',
  partialsDir:'app/views/partials',
  helpers: {
      date: (val) => { return val.getDate() + '/' + (parseInt(val.getMonth()) + 1 ) + '/' + val.getFullYear() },
      dateStrava: (val) => { var date = new Date(val); return date.getDate() + '/' + (parseInt(date.getMonth()) + 1 ) + '/' + date.getFullYear() },
      stravaTime: (val) => { var time = val / 60; return  Number.parseFloat(time).toFixed(2) },
      stravaDist: (val) => { var dist = val / 1000; return  Number.parseFloat(dist).toFixed(3) }
    }
});

app.engine('handlebars', hbs.engine);
app.set('views', path.join(__dirname, '/app/views/'));
app.set('view engine', 'handlebars');

// 404
app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.redirect('/');
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

// Set Port
app.set('port', (process.env.PORT || 3000));

app.listen(app.get('port'), function () {
  console.log('Launch App on http://localhost:' + process.env.PORT + '/')
})