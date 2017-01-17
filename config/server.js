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
var auxResult;

// Login
app.post('/api/login/', function(req, res) {
	var conn = database();

	var username = req.body.username,
 		password = req.body.password;

	conn.query('SELECT * FROM AIDAVEC_USER WHERE USR_EMAIL = \'' + username + '\' AND USR_SENHA = \'' + password + '\'', function(err,result){
		return res.json(result);
	});
});

// UPLOAD
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

//GET FILE
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

// CRUD Get Notes
app.get('/api/notes/:userid', function(req, res) {
	var conn = database();
	var userid = req.params.userid;

	conn.query('SELECT * FROM AIDAVEC_NOTIFICACAO WHERE USR_ID = ' + userid, function(err,result){
		return res.json(result);
	});
});

// CRUD Get Chart Semanal
app.get('/api/chart_semanal/:userid', function(req, res) {
	var conn = database();
	var userid = req.params.userid;

	conn.query('SELECT 80 as SEGUNDA, 30 as TERCA, 160 as QUARTA, 70 as QUINTA, 170 as SEXTA, 75 as SABADO, 180 as DOMINGO FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + userid + ' LIMIT 1', function(err,result){
		return res.json(result);
	});
});

// CRUD Get Report
app.get('/api/report/:userid', function(req, res) {
	var conn = database();
	var userid = req.params.userid;

	var totalPontos = 0;
	var totalPontosCampanha = 0;
	var kmDia = 0;
	var kmSemana = 0;
	var mkMes = 0;

	conn.query('SELECT 32154 as TOTALPONTOS FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + userid + ' LIMIT 1', function(err, rows, fields) {
		totalPontos = rows[0].TOTALPONTOS;
		conn.query('SELECT 1234 as TOTALPONTOSCAMPANHA FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + userid + ' LIMIT 1', function(err, rows, fields) {
			totalPontosCampanha = rows[0].TOTALPONTOSCAMPANHA;
			conn.query('SELECT 121 as KMDIA FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + userid + ' LIMIT 1', function(err, rows, fields) {
				kmDia = rows[0].KMDIA;
				conn.query('SELECT 489 as KMSEMANA FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + userid + ' LIMIT 1', function(err, rows, fields) {
					kmSemana = rows[0].KMSEMANA;
					conn.query('SELECT 1290 as KMMES FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + userid + ' LIMIT 1', function(err, rows, fields) {
						kmMes = rows[0].KMMES;
						return res.json([{ total_pontos: totalPontos, total_pontos_campanha: totalPontosCampanha, km_dia: kmDia, km_semana: kmSemana, km_mes: kmMes }]);		
					});		
				});		
			});		
		});		
	});

});

// CRUD Get Vehicle
app.get('/api/vehicle/:userid', function(req, res) {
	var conn = database();
	var userid = req.params.userid;

	conn.query('SELECT * FROM AIDAVEC_VEICULO WHERE USR_ID = ' + userid, function(err,result){
		return res.json(result);
	});
});

// CRUD Get User
app.get('/api/user/:userid', function(req, res) {
	var conn = database();
	var userid = req.params.userid;

	conn.query('SELECT * FROM AIDAVEC_USER WHERE USR_ID = ' + userid, function(err,result){
		return res.json(result);
	});
});

// CRUD Get Last Waypoint
app.get('/api/waypoint/', function(req, res) {
	var conn = database();

	conn.query('SELECT * FROM AIDAVEC_WAYPOINT ORDER BY WAY_ID DESC LIMIT 1', function(err,result){
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
app.post('/api/vehicle', function(req, res) {
	var conn = database();
	var data = req.body;

	conn.query('INSERT INTO AIDAVEC_VEICULO SET ? ', [data], function(err,result){
		return res.json(result);
	});
});

// CRUD Insert
app.post('/api/notes', function(req, res) {
	var conn = database();
	var data = req.body;

	conn.query('INSERT INTO AIDAVEC_NOTIFICACAO SET ? ', [data], function(err,result){
		if (data.NOT_PUSH == 1)
			SendPush(data);

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

	return res.json(auxResult);
});

// CRUD Update
app.put('/api/user', function(req, res) {
	var conn = database();
 	var data = req.body;

 	if (data.USR_SENHA != null && data.USR_SENHA.length > 0) {
		conn.query('UPDATE AIDAVEC_USER SET USR_NOME = \'' + [data.USR_NOME] + '\', USR_SOBRENOME = \'' + [data.USR_SOBRENOME] + '\', USR_EMAIL = \'' + [data.USR_EMAIL] + '\', USR_TELEFONE = \'' + [data.USR_TELEFONE] + '\', USR_UF = \'' + [data.USR_UF] + '\', USR_CIDADE = \'' + [data.USR_CIDADE] + '\', USR_DEVICE = \'' + [data.USR_DEVICE] + '\', USR_STATUS = '+ [data.USR_STATUS] + ', USR_SENHA = \'' + [data.USR_SENHA] + '\' WHERE USR_ID = ' + [data.USR_ID], function(err,result){

			if (data.USR_STATUS == 0)
				SendMail(data.USR_EMAIL, [data.USR_ID]);

			return res.json(result);
		});
	} else {
		conn.query('UPDATE AIDAVEC_USER SET USR_NOME = \'' + [data.USR_NOME] + '\', USR_SOBRENOME = \'' + [data.USR_SOBRENOME] + '\', USR_EMAIL = \'' + [data.USR_EMAIL] + '\', USR_TELEFONE = \'' + [data.USR_TELEFONE] + '\', USR_UF = \'' + [data.USR_UF] + '\', USR_CIDADE = \'' + [data.USR_CIDADE] + '\', USR_DEVICE = \'' + [data.USR_DEVICE] + '\', USR_STATUS = '+ [data.USR_STATUS] + ' WHERE USR_ID = ' + [data.USR_ID], function(err,result){

			if (data.USR_STATUS == 0)
				SendMail(data.USR_EMAIL, [data.USR_ID]);

			return res.json(result);
		});
	}
});

// CRUD Update
app.put('/api/vehicle', function(req, res) {
	var conn = database();
 	var data = req.body;

	conn.query('UPDATE AIDAVEC_VEICULO SET VEI_MARCA = \'' + [data.VEI_MARCA] + '\', VEI_MODELO = \'' + [data.VEI_MODELO] + '\', VEI_COR = \'' + [data.VEI_COR] + '\', VEI_ANO = ' + [data.VEI_ANO] + ', VEI_COBERTURA = ' + [data.VEI_COBERTURA] + ' WHERE VEI_ID = ' + [data.VEI_ID], function(err,result){
		return res.json(result);
	});
});

// CRUD Update
app.put('/api/note', function(req, res) {
	var conn = database();
 	var data = req.body;

	conn.query('UPDATE AIDAVEC_NOTIFICACAO SET USR_ID = ' + [data.USR_ID] + ', NOT_TITULO = \'' + [data.NOT_TITULO] + '\', NOT_MENSAGEM = \'' + [data.NOT_MENSAGEM] + '\', NOT_OPCAOA = \'' + [data.NOT_OPCAOA] + '\', NOT_OPCAOB = \'' + [data.NOT_OPCAOB] + '\', NOT_OPCAOC = \'' + [data.NOT_OPCAOC] + '\', NOT_OPCAOD = \'' + [data.NOT_OPCAOD] + '\', NOT_OPCAOE = \'' + [data.NOT_OPCAOE] + '\', NOT_TIPO = ' + [data.NOT_TIPO] + ', NOT_PUSH = ' + [data.NOT_PUSH] + ', NOT_RESPOSTA = \'' + [data.NOT_RESPOSTA] + '\' WHERE NOT_ID = ' + [data.NOT_ID], function(err,result){
		return res.json(result);
	});
});

// Ativar cadastro
app.get('/api/active/user/:id', function(req, res) {
	var conn = database();

	var id = req.params.id;

	conn.query('UPDATE AIDAVEC_USER SET USR_STATUS = 1 WHERE USR_ID = ' + id, function(err,result){
		return res.end("<html><body>Cadastro ativado com sucesso.</body></html>");
	});
});


// CRUD DeleteObject
app.delete('/api/:tablename/:id', function(req, res) {

	console.log('Entrou no delete');
	var conn = database();

});
//------------------------------------------------------
//FUNCTIONS
//------------------------------------------------------

function SaveWaypoint(data, conn) {
	conn.query('INSERT INTO AIDAVEC_WAYPOINT SET ? ', [data], function(err,result){

		if (err)
			success = false;

		auxResult = result;

		return true;
	});
}

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

function SendPush(data) {
	var conn = database();
	var FCM = require('fcm-push');

	var serverKey = 'AAAARhibgJE:APA91bEtTC0e8pQlBll010FKGow46EoNqVkEJpQRXWMwnI4a33YabwXpsmv9fGkpwAd3uGS9xZ3ZSJIiklhSnK7ChZwxHFRLG2LDFsarfBZ7099ItTMNKt-S6FRmoDKZiOLgzbND3XSN1Dglcp-e1b4M_McoMFUz7g';
	var fcm = new FCM(serverKey);

	var query = '';

	if (data.USR_ID != null && data.USR_ID.length > 0) {
		query = 'SELECT * FROM AIDAVEC_USER WHERE USR_ID = ' + data.USR_ID;
		console.log('enviou apenas para o ' + data.USR_ID);
	} else {
		query = 'SELECT * FROM AIDAVEC_USER';
		console.log('Enviou para todos');
	}

	conn.query(query, function(err, rows, fields) {
	    if (err) throw err;

	    for (var i in rows) {
	        var message = {
			    to: rows[i].USR_DEVICE, // required fill with device token or topics
	//		    collapse_key: 'your_collapse_key', 
			    data: {
			        'NOT_TITULO': data.NOT_TITULO,
			        'NOT_MENSAGEM': data.NOT_MENSAGEM,
			        'NOT_TIPO': data.NOT_TIPO,
			        'NOT_OPCAOA': data.NOT_OPCAOA,
			        'NOT_OPCAOB': data.NOT_OPCAOB,
			        'NOT_OPCAOC': data.NOT_OPCAOC,
			        'NOT_OPCAOD': data.NOT_OPCAOD,
			        'NOT_OPCAOE': data.NOT_OPCAOE
			    },
			    notification: {
			        title: data.NOT_TITULO,
			        body: data.NOT_MENSAGEM
			    }
			};

			console.log('message é : ' + JSON.stringify(message, null, 4));

			//callback style
			fcm.send(message, function(err, response){
			    if (err) {
			        console.log("NÃO enviou o push!");
			    } else {
			        console.log("Push enviado com sucesso");
			    }
			});

	    }


	});
}

module.exports = app;

