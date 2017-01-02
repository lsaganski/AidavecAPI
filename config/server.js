var express = require('express');
var json = require('json-middleware').middleware();
var urlencode = require('urlencode');
var bodyparser = require('body-parser');
var app = express();
//var multer = require('multer');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');

app.use(bodyparser.urlencoded({
	extended: true
}));
app.use(bodyparser.json());
app.use(express.static(path.join(__dirname, 'public')));   //__dirname + '/public'


var database = require('./dbConnection')();

//----------------------------------------------------------

var query = require('../app/models/query');

var sucess = true;

// Login
app.post('/api/login/', function(req, res) {
	var conn = database();

	var username = req.body.username,
 		password = req.body.password;

	conn.query('SELECT * FROM AIDAVEC_USER WHERE USR_EMAIL = \'' + username + '\' AND USR_SENHA = \'' + password + '\'', function(err,result){
		return res.json(result);
	});
});

app.post('/api/upload', function(req, res){

  // create an incoming form object
  var form = new formidable.IncomingForm();

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/uploads');

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name));
  });

  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    res.end('success');
  });

  // parse the incoming request containing the form data
  form.parse(req);

});

app.get('/api/images/:file', function (req, res){
    file = req.params.file;
    var dirname = path.join(__dirname, '/uploads');
    var img = fs.readFileSync(path.join(__dirname, '/uploads/' + file));
    res.writeHead(200, {'Content-Type': 'image/jpg' });
    res.end(img, 'binary');
});

// Check if email is already regsitered
app.post('/api/checkemail/', function(req, res) {
	var conn = database();

	var email = req.body.email;

	conn.query('SELECT * FROM AIDAVEC_USER WHERE USR_EMAIL = \'' + email + '\'', function(err,result){
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
app.post('/api/user', function(req, res) {
	var conn = database();

 	var data = req.body;

	conn.query('INSERT INTO AIDAVEC_USER SET ? ', [data], function(err,result){

		SendMail(data.USR_EMAIL, result.insertId);

		return res.json(result);
	});
});

// CRUD Insert
app.post('/api/waypoints', function(req, res) {
	var conn = database();

 	var data = req.body; 

 	var result = 'T';

 	success = true;

 	for (var index in data.waypoints) {
 		var waypoint = data.waypoints[index];

 		SaveWaypoint(waypoint, conn);

 		if (success == false)
 			break;
	};

	return res.sendStatus(success ? 200 : 501);
});

function SaveWaypoint(data, conn) {
	conn.query('INSERT INTO AIDAVEC_WAYPOINT SET ? ', [data], function(err,result){

		if (err)
			success = false;

		return true;
	});
}

// Ativar cadastro
app.get('/api/active/user/:id', function(req, res) {
	var conn = database();

	var id = req.params.id;

	conn.query('UPDATE AIDAVEC_USER SET USR_STATUS = 1 WHERE USR_ID = ' + id, function(err,result){
		return res.end("<html><body>Cadastro ativado com sucesso.</body></html>");
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

function SendMail(address, id) {
	var nodemailer = require('nodemailer');

   	var transporter = nodemailer.createTransport({
	    host: 'smtp.mobila.com.br',
	    port: 587,
	    secure: false, // use SSL
	    auth: {
	        user: 'contato@mobila.com.br',
	        pass: '1978@Mobila'
	    }
	});

	var email = {
  		from: 'contato@mobila.com.br', // Quem enviou este e-mail
  		to: address, // Quem receberá
  		subject: 'Confirme seu cadastro',  // Um assunto bacana :-) 
  		html: 'Bem vindo !<br><br>Você fez um novo cadastro no Aidavec.<br><br>Para começar a usar o aplicativo é necessário ativar seu cadastro, clicando no link abaixo :<br><br><a href="http://www.mobila.kinghost.net/aidavecapi/api/active/user/' + id + '">Ativar cadastro</a>' // O conteúdo do e-mail
	};

	transporter.sendMail(email, function(err, info){
  		if(err)
    		throw err; // Oops, algo de errado aconteceu.
	});
}

module.exports = app;

