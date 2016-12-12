exports.login = function(req, res, conn) {
	var username = req.params.username,
 		password = req.params.password;

	console.log('Login com  : ' + username + ' e : ' + password);

	conn.query('SELECT * FROM user WHERE username = ? AND password = ?',[username, password],function(err,result){
		if(err) return res.status(400).json();

		return res.status(200).json(result);
	});
}

exports.getall = function(req, res, conn) {
	var tablename = req.params.tablename;

	console.log('GetAll na  : ' + tablename);

	console.log('conn B é : ' + conn);

	conn.query('SELECT * FROM ?',[tablename],function(err,result){
		if(err) return res.status(400).json();

		return res.status(200).json(result);
	});
}

exports.create = function(req, res, conn) {
 	var tablename = req.params.tablename, 
 		data = req.body;

	console.log('Insert na  : ' + tablename);
	conn.query('INSERT INTO ? SET ?',[tablename, data],function(err,result){
		if(err) return res.status(400).json(err);

		return res.status(200).json(result);
	});
 }


exports.get = function(req, res, conn) {
 	var tablename = req.params.tablename, 
 		id = req.params.id;

	conn.query('SELECT * FROM ? WHERE id = ?',[tablename, id],function(err,result){
		if(err) return res.status(400).json(err);

		return res.status(200).json(result[0]);
	});
}

exports.update = function(req, res, conn) {
 	var tablename = req.params.tablename, 
 		data = req.body,
 		id 	   = req.params.id;

	conn.query('UPDATE ? SET ? WHERE id = ? ',[tablename, data, id],function(err,result){
		if(err) return res.status(400).json(err);

		return res.status(200).json(result);
	});
}

exports.delete = function(req, res, conn) {
 	var tablename = req.params.tablename, 
 		id = req.params.id;

	conn.query('DELETE FROM ? WHERE id = ? ',[tablename, id],function(err,result){
		if(err) return res.status(400).json(err);

		return res.status(200).json(result);
	});
}
 