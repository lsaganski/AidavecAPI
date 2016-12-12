
var mysql = require('mysql');

var conn = function() {
	return mysql.createConnection({
		host : 'mysql.mobila.kinghost.net', 
		port : '3306',
		user : 'mobila', 
		password : 'have1978', 
		database : 'mobila'
	});
};

module.exports = function() {
	return conn;
}