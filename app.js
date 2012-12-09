var fs = require('fs');
var express = require('express'),
				app = express.createServer();
				
var user = require('./routes/user');
var site = require('./routes/site');
var demo = require('./routes/demo');

app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
app.use(express.bodyParser({ keepExtensions: true, uploadDir:__dirname + '/upload' }));
app.use(express.cookieParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(express.static(__dirname + '/public'));
app.use(express.methodOverride());
app.use(app.router);

app.use(function(err, req, res, next){
  res.render('404', {
      status: err.status || 500
    , error: err
  });
});
app.use(function(req, res, next){
  res.render('404', { 
			status: 404, 
			url: req.url 
	});
});

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', { pretty: true });


// site block
app.get('/', site.index);
app.get('/:path', site.main);

// user block
app.get('/user/login', user.login);
app.get('/user/logout', user.logout);
app.post('/user/login', user.auth);

// demo block
app.get('/demo/bath', demo.bath);
app.get('/demo/apartment', demo.apartment);
app.get('/demo/office', demo.office);
app.get('/demo/house', demo.house);
app.post('/demo/upload', demo.upload);

app.listen(3000,'127.0.0.1');
console.log('Server running at http://127.0.0.1:3000');