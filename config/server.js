var express = require('express');
var json = require('json-middleware').middleware();
var urlencode = require('urlencode');
var bodyparser = require('body-parser');
var app = express();
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
	extended: true
}));

var database = require('./dbConnection')();

//----------------------------------------------------------

var query = require('../app/models/query');

// Login
app.post('/api/login/', function(req, res) {
	var conn = database();

	var username = req.body.username,
 		password = req.body.password;

	conn.query('SELECT * FROM AIDAVEC_USER WHERE USR_EMAIL = \'' + username + '\' AND USR_SENHA = \'' + password + '\'', function(err,result){
		return res.json(result);
	});
});

// CRUD GetAll
app.get('/api/:tablename', function(req, res) {
	var conn = database();

	var tablename = req.params.tablename;

	conn.query('SELECT * FROM ' + tablename, function(err,result){
		return res.json(result);
	});
});

// CRUD Insert
app.post('/api/:tablename', function(req, res) {
	var conn = database();

 	var tablename = req.params.tablename, 
 		data = req.body;

 		console.log(data);

	conn.query('INSERT INTO ' + tablename + ' SET ? ', [data], function(err,result){
		return res.json(result);
	});
});

// CRUD GetObject
app.get('/api/:tablename/:id', function(req, res) {

	console.log('Entrou no getobj');
	var conn = database();

});

// CRUD UpdateObject
app.put('/api/:tablename/:id', function(req, res) {

	console.log('Entrou no update');
	var conn = database();

});

// CRUD DeleteObject
app.delete('/api/:tablename/:id', function(req, res) {

	console.log('Entrou no delete');
	var conn = database();

});
//------------------------------------------------------

module.exports = app;

