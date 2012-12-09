var fs = require('fs');

exports.bath = function(req, res) {
	fs.readdir(__dirname + '/../public/img/demo/p1', function(err, files) {
		res.render('bath', {files:files});
	});
};

exports.apartment = function(req, res) {
	fs.readdir(__dirname + '/../public/img/demo/p2', function(err, files) {
		res.render('apartment', {files:files});
	});
};

exports.office = function(req, res) {
	fs.readdir(__dirname + '/../public/img/demo/p3', function(err, files) {
		res.render('office', {files:files});
	});
};

exports.house = function(req, res) {
	fs.readdir(__dirname + '/../public/img/demo/p4', function(err, files) {
		res.render('house', {files:files});
	});
};

exports.upload = function(req, res) {
	var selectDir = req.body.menu + '/';
	
	fs.readdir(__dirname + '/../public/img/demo/' + selectDir, function(err, files) {
		var imgName = files.length + 1;
		
		if (req.files.img1.type == 'image/jpeg') {
			fs.rename(req.files.img1.path, __dirname + '/../public/img/demo/' + selectDir + imgName + '.jpg');
			res.redirect('/demo');
		}
		else {
			fs.unlink(req.files.img1.path);
			res.redirect('/demo');
		}
	});
};