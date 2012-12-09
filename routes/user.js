exports.login = function(req, res) {
	if (req.session.user_id) {
		res.redirect('/user');
	}
	else {
		res.render('login');
	}
};

exports.logout =  function (req, res) {
  delete req.session.user_id;
  res.redirect('/');
};

exports.auth = function (req, res) {
  var post = req.body;
  if (post.user == 'dandy4me' && post.password == 'crazyfish') {
    req.session.user_id = '4786242642';
    res.redirect('back');
  }
	else {
    res.send('Bad user/pass');
  }
};