var express = require('express');
var json = require('json-middleware').middleware();
var urlencode = require('urlencode');
var bodyparser = require('body-parser');
var app = express();
//var multer = require('multer');
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var crypto = require('crypto');


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
app.post('/api/getnotes/', function(req, res) {
	var conn = database();
	var data = req.body;

	conn.query('SELECT * FROM AIDAVEC_NOTIFICACAO WHERE USR_ID IS NULL OR USR_ID = ' + data.USR_ID, function(err,result){
		return res.json(result);
	});
});

// CRUD Get Answers
app.post('/api/getanswers/', function(req, res) {
	var conn = database();
	var data = req.body;

	conn.query('SELECT * FROM AIDAVEC_RESPOSTA WHERE USR_ID = ' + data.USR_ID + ' AND NOT_ID = ' + data.NOT_ID, function(err,result){
		return res.json(result);
	});
});

// CRUD Get Chart Semanal
app.post('/api/getchartsemanal', function(req, res) {
	var conn = database();
	var data = req.body;

	var seg = 0, ter = 0, qua = 0, qui = 0, sex = 0, sab = 0, dom= 0;

	var today = new Date(data.DT_TODAY);
	var dayOfWeek = today.getDay();
	if (dayOfWeek == 0)
		dayOfWeek = 7;   // Se for domingo, pegar o domingo passado, pois a semana deve comecar na segunda e terminar no domingo da proxima semana, segundo desejo do cliente.
	var diff = today.getDate() - (dayOfWeek - 1); // dayweek - 1, pois não quero comecar do domingo e sim da segunda.

	// SEGUNDA
	var inicio = new Date(today.setDate(diff));
	inicio.setHours(0, 0, 0);
	var fim = new Date(inicio);
	fim.setHours(23, 59, 59);

	var query = 'SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as TOTAL FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + getStrDateTime(inicio) + '\' AND WAY_DATE <= \'' + getStrDateTime(fim) + '\'';
console.log(query);
	conn.query(query, function(err, rows, fields){
		if (err)
			console.log(err) 
		else
			seg = rows[0].TOTAL;
 
 		// TERCA
		inicio = new Date(inicio.setDate(inicio.getDate() + 1));
		inicio.setHours(0, 0, 0);
		fim = new Date(inicio);
		fim.setHours(23, 59, 59);

		conn.query('SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as TOTAL FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + getStrDateTime(inicio) + '\' AND WAY_DATE <= \'' + getStrDateTime(fim) + '\'', function(err, rows, fields){
			if (rows.length > 0) 
				ter = rows[0].TOTAL;

			// QUARTA
			inicio = new Date(inicio.setDate(inicio.getDate() + 1));
			inicio.setHours(0, 0, 0);
			fim = new Date(inicio);
			fim.setHours(23, 59, 59);
			
			conn.query('SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as TOTAL FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + getStrDateTime(inicio) + '\' AND WAY_DATE <= \'' + getStrDateTime(fim) + '\'', function(err, rows, fields){
				if (rows.length > 0) 
					qua = rows[0].TOTAL;

				// QUINTA
				inicio = new Date(inicio.setDate(inicio.getDate() + 1));
				inicio.setHours(0, 0, 0);
				fim = new Date(inicio);
				fim.setHours(23, 59, 59);
				
				conn.query('SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as TOTAL FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + getStrDateTime(inicio) + '\' AND WAY_DATE <= \'' + getStrDateTime(fim) + '\'', function(err, rows, fields){
					if (rows.length > 0) 
						qui = rows[0].TOTAL;

					// SEXTA
					inicio = new Date(inicio.setDate(inicio.getDate() + 1));
					inicio.setHours(0, 0, 0);
					fim = new Date(inicio);
					fim.setHours(23, 59, 59);

					conn.query('SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as TOTAL FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + getStrDateTime(inicio) + '\' AND WAY_DATE <= \'' + getStrDateTime(fim) + '\'', function(err, rows, fields){
						if (rows.length > 0) 
							sex = rows[0].TOTAL;

						// SABADO
						inicio = new Date(inicio.setDate(inicio.getDate() + 1));
						inicio.setHours(0, 0, 0);
						fim = new Date(inicio);
						fim.setHours(23, 59, 59);
						
						conn.query('SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as TOTAL FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + getStrDateTime(inicio) + '\' AND WAY_DATE <= \'' + getStrDateTime(fim) + '\'', function(err, rows, fields){
							if (rows.length > 0) 
								sab = rows[0].TOTAL;

							// DOMINGO
							inicio = new Date(inicio.setDate(inicio.getDate() + 1));
							inicio.setHours(0, 0, 0);
							fim = new Date(inicio);
							fim.setHours(23, 59, 59);

							conn.query('SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as TOTAL FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + getStrDateTime(inicio) + '\' AND WAY_DATE <= \'' + getStrDateTime(fim) + '\'', function(err, rows, fields){
								if (rows.length > 0) 
									dom = rows[0].TOTAL;

								return res.json([{ dom: dom, seg: seg, ter: ter, qua: qua, qui: qui, sex: sex, sab: sab }]);		
							});
						});
					});
				});
			});
		});
	});
});

// CRUD Get Chart Semanal
app.post('/api/getcharthome', function(req, res) {
	var conn = database();
	var data = req.body;

	var ca = 0, cb = 0, cc = 0, cd = 0, ce = 0, cf = 0, cg = 0, ch = 0;

	var today = new Date(data.DT_TODAY);
	//var today = new Date();
	var month = today.getMonth();
	var dtini = getDtIniByMonth(month);
	var dtfim = getDtFimByMonth(month);


	// Mes atual
	var query = 'SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as TOTAL FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + dtini + '\' AND WAY_DATE <= \'' + dtfim + '\'';
console.log(query);
	conn.query(query, function(err, rows, fields){
		if (rows.length > 0) 
			ch = rows[0].TOTAL;

		// Um mes atras
		if ((month-1) < 0)
			month = 11;
		else
			month--;

		var dtini = getDtIniByMonth(month);
		var dtfim = getDtFimByMonth(month);

		query = 'SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as TOTAL FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + dtini + '\' AND WAY_DATE <= \'' + dtfim + '\'';
console.log(query);
		conn.query(query, function(err, rows, fields){
			if (rows.length > 0) 
				cg = rows[0].TOTAL;

			// Dois meses atras
			if ((month-1) < 0)
				month = 11;
			else
				month--;

			var dtini = getDtIniByMonth(month);
			var dtfim = getDtFimByMonth(month);
			
			query = 'SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as TOTAL FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + dtini + '\' AND WAY_DATE <= \'' + dtfim + '\'';
console.log(query);
			conn.query(query, function(err, rows, fields){
				if (rows.length > 0) 
					cf = rows[0].TOTAL;

				// Tres meses atras
				if ((month-1) < 0)
					month = 11;
				else
					month--;

				var dtini = getDtIniByMonth(month);
				var dtfim = getDtFimByMonth(month);
				
				query = 'SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as TOTAL FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + dtini + '\' AND WAY_DATE <= \'' + dtfim + '\'';
console.log(query);
				conn.query(query, function(err, rows, fields){
					if (rows.length > 0) 
						ce = rows[0].TOTAL;

					// Quatro meses atras
					if ((month-1) < 0)
						month = 11;
					else
						month--;

					var dtini = getDtIniByMonth(month);
					var dtfim = getDtFimByMonth(month);
					
					query = 'SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as TOTAL FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + dtini + '\' AND WAY_DATE <= \'' + dtfim + '\'';
console.log(query);
					conn.query(query, function(err, rows, fields){
						if (rows.length > 0) 
							cd = rows[0].TOTAL;

						// Cinco meses atras
						if ((month-1) < 0)
							month = 11;
						else
							month--;

						var dtini = getDtIniByMonth(month);
						var dtfim = getDtFimByMonth(month);
					
						query = 'SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as TOTAL FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + dtini + '\' AND WAY_DATE <= \'' + dtfim + '\'';
console.log(query);
						conn.query(query, function(err, rows, fields){
							if (rows.length > 0) 
								cc = rows[0].TOTAL;

							// Seis meses atras
							if ((month-1) < 0)
								month = 11;
							else
								month--;

							var dtini = getDtIniByMonth(month);
							var dtfim = getDtFimByMonth(month);
							
							query = 'SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as TOTAL FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + dtini + '\' AND WAY_DATE <= \'' + dtfim + '\'';
console.log(query);
							conn.query(query, function(err, rows, fields){
								if (rows.length > 0) 
									cb = rows[0].TOTAL;
								
								// Seis meses atras
								if ((month-1) < 0)
									month = 11;
								else
									month--;

								var dtini = getDtIniByMonth(month);
								var dtfim = getDtFimByMonth(month);
								
								query = 'SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as TOTAL FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + dtini + '\' AND WAY_DATE <= \'' + dtfim + '\'';
console.log(query);
								conn.query(query, function(err, rows, fields){
									if (rows.length > 0) 
										ca = rows[0].TOTAL;
									
									return res.json([{ ca: ca, cb: cb, cc: cc, cd: cd, ce: ce, cf: cf, cg: cg, ch: ch }]);		
								});
							});
						});
					});
				});
			});
		});
	});

	//return res.json([{ ca: ca, cb: cb, cc: cc, cd: cd, ce: ce, cf: cf, cg: cg, ch: ch }]);		
});

// CRUD Get Report
app.post('/api/report/', function(req, res) {
	var conn = database();
	var data = req.body;

	var totalPontos = 0;
	var totalPontosCampanha = 0;
	var kmDia = 0;
	var kmSemana = 0;
	var mkMes = 0;

	var today = new Date(data.DT_TODAY);

	var curDate = getStrDateTime(today);

	conn.query('SELECT CAU_PONTUACAO as TOTALPONTOS FROM AIDAVEC_CAMPANHA_USUARIO WHERE USR_ID = ' + data.USR_ID + ' AND CAM_ID = 1', function(err, rows, fields) {
		totalPontos = rows[0].TOTALPONTOS;
		conn.query('SELECT IFNULL(SUM(CAU_PONTUACAO), 0) as TOTALPONTOSCAMPANHA FROM AIDAVEC_CAMPANHA_USUARIO WHERE USR_ID = ' + data.USR_ID + ' AND CAM_ID > 1', function(err, rows, fields) {
			totalPontosCampanha = rows[0].TOTALPONTOSCAMPANHA;
			conn.query('SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as KMDIA FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + getDayBegin() + '\' AND WAY_DATE <= \'' + curDate + '\'', function(err, rows, fields) {
				kmDia = rows[0].KMDIA;
				conn.query('SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as KMSEMANA FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + getWeekBegin() + '\' AND WAY_DATE <= \'' + curDate + '\'', function(err, rows, fields) {
					kmSemana = rows[0].KMSEMANA;
					conn.query('SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as KMMES FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + getMonthBegin() + '\' AND WAY_DATE <= \'' + curDate + '\'', function(err, rows, fields) {
						kmMes = rows[0].KMMES;
						return res.json([{ total_pontos: totalPontos, total_pontos_campanha: totalPontosCampanha, km_dia: kmDia, km_semana: kmSemana, km_mes: kmMes }]);		
					});		
				});		
			});		
		});		
	});

});

// CRUD Get Report
app.get('/api/kmporperiodo', function(req, res) {
	var conn = database();
	var data = req.body;

	var km = 0;

	conn.query('SELECT IFNULL(SUM(WAY_PERCORRIDO), 0) as KM FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' AND WAY_DATE >= \'' + data.DT_INICIO + '\' AND WAY_DATE <= \'' + data.DT_FIM + '\'', function(err, rows, fields) {
		km = rows[0].KM;
	});		

});

// CRUD Get Vehicle
app.post('/api/getvehicle/', function(req, res) {
	var conn = database();
	var data = req.body;

	conn.query('SELECT * FROM AIDAVEC_VEICULO WHERE USR_ID = ' + data.USR_ID, function(err,result){
		return res.json(result);
	});
});

// CRUD Get User
app.post('/api/getuser/', function(req, res) {
	var conn = database();
	var data = req.body;

	conn.query('SELECT * FROM AIDAVEC_USER WHERE USR_ID = ' + data.body, function(err,result){
		return res.json(result);
	});
});

// CRUD Get Last Waypoint
app.post('/api/getwaypoint/', function(req, res) {
	var conn = database();
	var data = req.body;

	conn.query('SELECT * FROM AIDAVEC_WAYPOINT WHERE USR_ID = ' + data.USR_ID + ' ORDER BY WAY_ID DESC LIMIT 1', function(err,result){
		return res.json(result);
	});
});

// CRUD Insert
app.post('/api/user', function(req, res) {
	var conn = database();
 	var data = req.body;
 	data.USR_DT_CADASTRO = getStrDateTime(new Date());

	conn.query('INSERT INTO AIDAVEC_USER SET ? ', [data], function(err,result){

		InsertDefaultCampaign(result.insertId);
		SendMail(data.USR_EMAIL, result.insertId.toString());

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
app.post('/api/log', function(req, res) {
	var conn = database();
	var data = req.body;
	data.LOG_DATA = getStrDateTime(new Date());

	conn.query('INSERT INTO AIDAVEC_LOG SET ? ', [data], function(err,result){
		return res.json(result);
	});
});

// CRUD Insert
app.post('/api/campaign', function(req, res) {
	var conn = database();
	var data = req.body;

	conn.query('INSERT INTO AIDAVEC_CAMPANHA SET ? ', [data], function(err,result){
		return res.json(result);
	});
});

// CRUD Insert
app.post('/api/campaign', function(req, res) {
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

// CRUD Insert
app.post('/api/notes', function(req, res) {
	var conn = database();
	var data = req.body;

console.log('user is : ' + data.USR_ID)
    var query = 'INSERT INTO AIDAVEC_NOTIFICACAO (USR_ID, NOT_TITULO, NOT_MENSAGEM, NOT_TIPO, NOT_OPCAOA, NOT_OPCAOB, NOT_OPCAOC, NOT_OPCAOD, NOT_OPCAOE, NOT_PUSH) VALUES (' + ((data.USR_ID != null && data.USR_ID.length > 0) ? [data.USR_ID] : 'NULL') + ', \'' + [data.NOT_TITULO] + '\', \'' + [data.NOT_MENSAGEM] + '\', ' + [data.NOT_TIPO] + ', \'' + [data.NOT_OPCAOA] + '\', \'' + [data.NOT_OPCAOB] + '\', \'' + [data.NOT_OPCAOC] + '\', \'' + [data.NOT_OPCAOD] + '\', \'' + [data.NOT_OPCAOE] + '\', ' + [data.NOT_PUSH] + ')'
console.log(query)
	conn.query(query, function(err,result){

//	conn.query('INSERT INTO AIDAVEC_NOTIFICACAO SET ? ', [data], function(err,result){

		InsertResposta(data, result.insertId); 

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

	return res.json({ success: success });	  
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
app.put('/api/password', function(req, res) {
	var conn = database();
 	var data = req.body;

 	if (data.USR_SENHA != null && data.USR_SENHA.length > 0) {
		conn.query('UPDATE AIDAVEC_USER SET USR_SENHA = \'' + [data.USR_SENHA] + '\' WHERE USR_ID = ' + [data.USR_ID], function(err,result){
			return res.json(result);
		});
	} 
});

// CRUD Update
app.put('/api/forgot', function(req, res) {
	var conn = database();
 	var data = req.body;

	var aux = '' + Math.round(Math.random() * (99999 - 10000) + 10000);
	var pass = crypto.createHash('md5').update(aux).digest("hex");
	

	conn.query('UPDATE AIDAVEC_USER SET USR_SENHA = \'' + [pass] + '\' WHERE USR_EMAIL = \'' + [data.USR_EMAIL] + '\'', function(err,result){
		SendPassMail(data.USR_EMAIL, aux);

		return res.json(result);
	});
});

// CRUD Update
app.put('/api/vehicle', function(req, res) {
	var conn = database();
 	var data = req.body;

 	var query = 'UPDATE AIDAVEC_VEICULO SET VEI_MARCA = \'' + [data.VEI_MARCA] + '\', VEI_MODELO = \'' + [data.VEI_MODELO] + '\', VEI_COR = \'' + [data.VEI_COR] + '\', VEI_ANO = ' + [data.VEI_ANO] + ', VEI_COBERTURA = \'' + [data.VEI_COBERTURA] + '\' , VEI_STATUS = ' + [data.VEI_STATUS] + ' , VEI_OKFOTOA = ' + [data.VEI_OKFOTOA] + ' , VEI_OKFOTOB = ' + [data.VEI_OKFOTOB] + ' , VEI_OKFOTOC = ' + [data.VEI_OKFOTOC] + ' WHERE VEI_ID = ' + [data.VEI_ID];
 	console.log(query);
	conn.query(query, function(err,result){
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

// CRUD Update
app.put('/api/answer', function(req, res) {
	var conn = database();
 	var data = req.body;

	conn.query('UPDATE AIDAVEC_RESPOSTA SET RES_RESPOSTA = \'' + [data.RES_RESPOSTA] + '\' WHERE USR_ID = ' + [data.USR_ID] + ' AND NOT_ID = ' + [data.NOT_ID], function(err,result){
		return res.json(result);
	});
});

// Ativar cadastro
app.get('/api/active/user/:code', function(req, res) {
	var conn = database();
	var code = req.params.code;
	//code = Buffer.from(code, 'base64').toString('ascii');

	var query = 'SELECT * FROM AIDAVEC_TOKEN WHERE TOK_HASH = \'' + code + '\' AND TOK_STATUS = 1' ;
	conn.query(query, function(err, rows, fields) {
		if (err) {
			return res.end("<html><body>Código inválido.</body></html>");	
		}

	    if (rows.length > 0) {
	    	usrid = rows[0].USR_ID;
	    	query = 'UPDATE AIDAVEC_TOKEN SET TOK_STATUS = 0 WHERE TOK_ID = ' + rows[0].TOK_ID;

			conn.query(query, function(err,result){

				if (err) {
					return res.end("<html><body>Código inválido.</body></html>");	
				}

		    	query = 'UPDATE AIDAVEC_USER SET USR_STATUS = 1 WHERE USR_ID = ' + usrid;
				conn.query(query, function(err,result){
					if (err)
						return res.end("<html><body>Código inválido.</body></html>");	
					else
						return res.end("<html><body>Cadastro ativado com sucesso.</body></html>");
				});
			});
	    } else {
			return res.end("<html><body>Código inválido.</body></html>");	

	    }
	});

	
	/*// uso o campo USR_DEVICE emprestado para verificar o id hasheado. Neste momento o campo ainda nao é usado para armazenar o device token.	  
	conn.query('UPDATE AIDAVEC_USER SET USR_STATUS = 1, USR_DEVICE = NULL WHERE USR_DEVICE = ' + code, function(err,result){
		if (err)
			return res.end("<html><body>Código inválido.</body></html>");	
		else
			return res.end("<html><body>Cadastro ativado com sucesso.</body></html>");
	});*/
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

	var query = 'SELECT * FROM AIDAVEC_WAYPOINT WHERE WAY_DATE = \'' + data.way_date + '\'' ;
	console.log(query);
	conn.query(query, function(err, rows, fields) {
		if (!err && rows.length == 0) {

			conn.query('INSERT INTO AIDAVEC_WAYPOINT SET ? ', [data], function(err,result){

				if (err)
					success = false;

				auxResult = result;

				var curDate; 

				var query = 'SELECT * FROM AIDAVEC_CAMPANHA WHERE CAM_INICIO <= \'' + data.way_date + '\' AND CAM_FIM >= \'' + data.way_date + '\' AND CAM_STATUS = 1';
				console.log(query);
				conn.query(query, function(err, rows, fields) {
				    if (err) throw err;

				    for (var i in rows) {
				    	query = 'UPDATE AIDAVEC_CAMPANHA_USUARIO SET CAU_DISTANCIA = CAU_DISTANCIA + ' + data.way_percorrido + ', CAU_PONTUACAO = CAU_PONTUACAO + ' + data.way_percorrido + ' WHERE USR_ID = ' + data.usr_id + ' AND CAM_ID = ' + rows[i].CAM_ID;
				    	console.log(query);
		    			conn.query(query, function(err,result){

							if (err) {
								success = false;
								console.log('erro no update pontuacao');
							}
						});
				    }
				});
			});

		} 

		return true;
	});


}

function SendMail(address, id) {
	var conn = database();
	var hashed = '';
	//if (typeof Buffer.from === "function") {
    	// Node 5.10+
    //	hashed = Buffer.from(id).toString('base64');
	//} else {
	    // older Node versions
	    hashed = new Buffer(id).toString('base64');
	//}
	//var hashed = Buffer.from(id).toString('base64');

	conn.query('INSERT INTO AIDAVEC_TOKEN (TOK_HASH, USR_ID, TOK_STATUS) VALUES (\'' + hashed + '\', ' + id + ', 1)', function(err,result){

		var nodemailer = require('nodemailer');

	   	var transporter = nodemailer.createTransport({
		    host: 'srv58.prodns.com.br',
		    port: 465,
		    secure: true, // use SSL
		    auth: {
		        user: 'no-reply@aidavec.com.br',
		        pass: 'nrp@aidavec901'
		    }
		});

		var email = {
	  		from: 'no-reply@aidavec.com.br', // Quem enviou este e-mail
	  		to: address, // Quem receberá
	  		subject: 'Confirme seu cadastro',  // Um assunto bacana :-) 
//	  		html: 'Bem vindo !<br><br>Você fez um novo cadastro no Aidavec.<br><br>Para começar a usar o aplicativo é necessário ativar seu cadastro, clicando no link abaixo :<br><br><a href="http://www.mobila.kinghost.net/aidavecapi/api/active/user/' + hashed + '">Ativar cadastro</a>' // O conteúdo do e-mail
	  		html: 'Bem vindo !<br><br>Você fez um novo cadastro no Aidavec.<br><br>Para começar a usar o aplicativo é necessário ativar seu cadastro, clicando no link abaixo :<br><br><a href="http://52.67.200.134:3000/api/active/user/' + hashed + '">Ativar cadastro</a>' // O conteúdo do e-mail

		};

		transporter.sendMail(email, function(err, info){
	  		if(err)
	    		throw err; // Oops, algo de errado aconteceu.
		});
	});
}

function SendPassMail(address, pass) {
	var conn = database();

	var nodemailer = require('nodemailer');

   	var transporter = nodemailer.createTransport({
	    host: 'srv58.prodns.com.br',
	    port: 465,
	    secure: true, // use SSL
	    auth: {
	        user: 'no-reply@aidavec.com.br',
	        pass: 'nrp@aidavec901'
	    }
	});

	var email = {
  		from: 'no-reply@aidavec.com.br', // Quem enviou este e-mail
  		to: address, // Quem receberá
  		subject: 'Senha provisória',  // Um assunto bacana :-) 
  		html: 'Olá !<br><br>Conforme solicitado, geramos uma nova senha provisória para que você possa acessar o Aidavec. <br><br>Altere sua senha provisória o quanto antes. <br><br>Caso você não tenha solicitado isso, contacte o administrador. <br><br>Sua senha provisória é : ' + pass 
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
			        body: data.NOT_MENSAGEM, 
			        sound: 'bells'
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

function InsertResposta(data, not_id) {
	var conn = database();

	var query = '';

	if (data.USR_ID != null && data.USR_ID.length > 0) {
		query = 'SELECT * FROM AIDAVEC_USER WHERE USR_ID = ' + data.USR_ID;
	} else {
		query = 'SELECT * FROM AIDAVEC_USER';
	}

	conn.query(query, function(err, rows, fields) {
	    if (err) throw err;

	    for (var i in rows) {

	    	query = 'INSERT INTO AIDAVEC_RESPOSTA (NOT_ID, USR_ID) VALUES (' + not_id + ', ' + rows[i].USR_ID + ')';
			conn.query(query, function(err,result){

				if (err) throw err;

			});
	    }
	});
}

function InsertDefaultCampaign(id) {

	var conn = database();
	conn.query('INSERT INTO AIDAVEC_CAMPANHA_USUARIO (CAM_ID, USR_ID, CAU_PONTUACAO, CAU_DISTANCIA) VALUES (1, ' + id + ', 0, 0)', function(err,result){

		if (err)
			return false;

	});
}

function getDayBegin() {
	var d = new Date();
	d.setHours(0, 0, 0);
	return getStrDateTime(d);
}

function getWeekBegin() {
	var d = new Date();
	d.setHours(0, 0, 0);
	var dayOfWeek = d.getDay();
	if (dayOfWeek == 0)
		dayOfWeek = 7
	var diff = d.getDate() - (dayOfWeek-1);
	return getStrDateTime(new Date(d.setDate(diff)));
}

function getMonthBegin() {
	var d = new Date();
	d.setHours(0, 0, 0);
	d.setDate(1);
	return getStrDateTime(d);
}

function getDtIniByMonth(m) {
	var d = new Date();

	// Se mes solicitado for maior que o atual, é pq o mes desejado é do ano anterior
	if (m > d.getMonth()){
		d = new Date(d.setFullYear(d.getFullYear() - 1));
    }

	d.setMonth(m);
	d.setHours(0, 0, 0);
	d.setDate(1);
	return getStrDateTime(d);
}

function getDtFimByMonth(m) {
	var d = new Date();

	if ((m) > d.getMonth()){
		d = new Date(d.setFullYear(d.getFullYear() - 1));
    }

	if ((m+1) > 11) {
		d.setMonth(0);
		d = new Date(d.setFullYear(d.getFullYear() + 1));
	} else
		d.setMonth(m+1);

	d.setHours(23, 59, 59);
	d.setDate(0);

	return getStrDateTime(new Date(d));

}

function getStrDateTime(d) {

    var hour = d.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = d.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = d.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = d.getFullYear();

    var month = d.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = d.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;

}

module.exports = app;