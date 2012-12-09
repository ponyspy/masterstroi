exports.index = function(req, res) {
	if (req.session.user_id) {
		res.render('index', {layout:'layoutAuth'});
	}
	else {
		res.render('index');
	}
};

exports.main = function(req, res) {
	if (req.session.user_id) {
		res.render(req.params.path, {layout:'layoutAuth', auth:true});
	}
	else {
		res.render(req.params.path);
	}
};