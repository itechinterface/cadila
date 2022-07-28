module.exports = function(app,io) {


	const mysqldump = require('mysqldump');


	function dump() {
		//setTimeout(function () {
		mysqldump({
			connection: {
				host: '127.0.0.1',
				user: 'root',
				password: '',
				database: 'skf_channel1'
			},
			dumpToFile: 'E://'+dumpdt()+'.sql'
		});
		/*setTimeout(function () {
		 dump();
		 },1000);
		 */
		//},10000);
	}

	//dumpToFile: 'C://Users/Quality/Desktop/BACKUP/'+dumpdt()+'.sql'
	//dumpToFile: dumpdt()+'.sql'

	app.post('/api/logout',function (req,res) {

		dump();
		res.json({'error':false,'data':''});

	});

	function dumpdt() {
		var date = new Date();
		var dd = date.getDate();
		dd =  parseInt(dd)<10 ? '0'+dd : dd;
		var MM = date.getMonth()+1;
		MM =  parseInt(MM)<10 ? '0'+MM : MM;
		var yy = date.getFullYear();
		var hh = date.getHours();
		hh =  parseInt(hh)<10 ? '0'+hh : hh;
		var mm = date.getMinutes();
		mm =  parseInt(mm)<10 ? '0'+mm : mm;
		var ss = date.getSeconds();
		ss =  parseInt(ss)<10 ? '0'+ss : ss;
		var sDate = '';
		sDate = yy+'_'+MM+'_'+dd+'_'+hh+'_'+mm+'_'+ss;
		return sDate;
	}

	//var mysql = require('mysql');
    const path = require('path');

	// var con = mysql.createConnection({
	// 	host: "",
	// 	user: "",
	// 	password: "",
	// 	database: "skf",
	// 	acquireTimeout: 1000000
	// });

	// var pdf = require('html-pdf');

	var Excel = require('exceljs');

	var pdf = require('html-pdf');
	var fs = require('fs');

	var mysql = require('simple-mysql');

	


	var connection = mysql.createConnection({
		host: '127.0.0.1',
		user: 'root',
		password: '',
		database: 'skf_channel1'
	}, 'default');

	/*var connection = mysql.createConnection({
		host: 'itechdbinstance.cyho2kwqrj4c.ap-south-1.rds.amazonaws.com',
		user: 'itechinterface',
		password: 'Password1904',
		database: 'skf_channel2'
	}, 'default');*/


	// con.connect(function(err) {
	// 	if (err) throw err;
	// 	console.log("Connected!");
	// });

	//pingpong();
	function pingpong() {
		setTimeout(function () {
			var sql = "SELECT * FROM ping_pong";
			//console.log("PING TO SERVER");

			connection.query(sql,function (err,data) {
				//console.log(data);
			});
			setTimeout(function () {
				pingpong();
			},5000);
		},10000);
	}

	function database_datetime() {
		var date = new Date();
		var dd = date.getDate();
		dd =  parseInt(dd)<10 ? '0'+dd : dd;
		var MM = date.getMonth()+1;
		MM =  parseInt(MM)<10 ? '0'+MM : MM;
		var yy = date.getFullYear();
		var hh = date.getHours();
		hh =  parseInt(hh)<10 ? '0'+hh : hh;
		var mm = date.getMinutes();
		mm =  parseInt(mm)<10 ? '0'+mm : mm;
		var ss = date.getSeconds();
		ss =  parseInt(ss)<10 ? '0'+ss : ss;
		var sDate = '';
		sDate = yy+'-'+MM+'-'+dd+' '+hh+':'+mm+':'+ss;
		return sDate;
	}


	app.post('/api/insert',function (req,res) {

		var obj =  req.body.obj;
		var table =  req.body.table;

		connection.insert(obj,table,function (err,data) {
			//console.log(err);
			res.json({'error':err,'data':data});

		});

	});

	app.post('/api/update',function (req,res) {

		var criteria =  req.body.criteria;
		var obj =  req.body.obj;
		var table =  req.body.table;

		connection.update(criteria,obj,table,function (err,data) {
			res.json({'error':err,'data':data});
		});

	});

	app.get('/api/findAll',function (req,res) {

		var table = req.query.table;

		connection.findAll({id: 'DESC'},table,function (err,data) {
			res.json({'error':err,'data':data});
		});
	});

	app.get('/api/findAllPaginated',function (req,res) {

		var table = req.query.table;
		var limit = req.query.limit;
		var offset = req.query.offset;

		connection.findAllPaginated({id: 'DESC'},limit,offset,table,function (err,data) {
			res.json({'error':err,'data':data});
		});
	});

	// connection.query("SHOW CREATE TABLE mode_c_types",function (err,data) {
	// 	console.log(data);
	// });


	app.post('/api/query',function (req,res) {

		var query =  req.body.query;
		console.log(query);
		connection.query(query,function (err,data) {
			res.json({'error':err,'data':data});
		});

	});



	app.post('/api/findBy',function (req,res) {

		var criteria =  req.body.criteria;
		var table =  req.body.table;

		connection.findBy(criteria,{id: 'DESC'},table,function (err,data) {
			res.json({'error':err,'data':data});
		});

	});

	app.post('/api/delete',function (req,res) {

		var obj =  req.body.obj;
		var table =  req.body.table;

		connection.deleteBy(obj,table,function (err,data) {
			res.json({'error':err,'data':data});
		});

	});

	app.post('/api/downloadcsv',function (req,res) {

		var data =  req.body.data;
		var mode =  req.body.mode;
		var type = req.body.type;
		var data_a = [];
		var data_b = [];
		if(parseInt(mode) == 4)
		{
			data_a =  req.body.data_a;
			data_b =  req.body.data_b;
			var type_a = req.body.type_a;
			var type_b = req.body.type_b;
		}
		
		// console.log(data);
		// console.log(mode);
		//res.json({'error':false,'message':'File Downloaded Successfully'});
		if(parseInt(mode) == 1)
			saveMode1Excel(data,res);
		else if(parseInt(mode) == 2)
			saveMode2Excel(data,res);
		else if(parseInt(mode) == 3)
			saveMode3Excel(data,res);
		else if(parseInt(mode) == 4)
			saveMode4Excel(data_a,data_b,type_a,type_b,res);
		else if(parseInt(mode) == 5)
			saveMode5Excel(data,type,res);
	});

	//saveMode2Excel("");

	function database_datetime2(date) {
		var dd = date.getDate();
		dd =  parseInt(dd)<10 ? '0'+dd : dd;
		var MM = date.getMonth()+1;
		MM =  parseInt(MM)<10 ? '0'+MM : MM;
		var yy = date.getFullYear();
		var hh = date.getHours();
		hh =  parseInt(hh)<10 ? '0'+hh : hh;
		var mm = date.getMinutes();
		mm =  parseInt(mm)<10 ? '0'+mm : mm;
		var ss = date.getSeconds();
		ss =  parseInt(ss)<10 ? '0'+ss : ss;
		var sDate = '';
		sDate = yy+'-'+MM+'-'+dd;
		return sDate;
	}

	function saveMode2Excel(data,res) {
		data = data.reverse();
		try {
			var workbook = new Excel.Workbook();
			var worksheet = workbook.addWorksheet('My Sheet');

			worksheet.columns = [
				{ header: '', key: 'A'},
				{ header: '', key: 'B'},
				{ header: '', key: 'C'},
				{ header: '', key: 'D'},
				{ header: '', key: 'E'},
				{ header: '', key: 'F'},
				{ header: '', key: 'G'},
				{ header: '', key: 'H'},
				{ header: '', key: 'I'},
				{ header: '', key: 'J'},
				{ header: '', key: 'K'},
				{ header: '', key: 'L'},
				{ header: '', key: 'M'},
				{ header: '', key: 'N'},
				{ header: '', key: 'O'},
				{ header: '', key: 'P'},
				{ header: '', key: 'Q'},
				{ header: '', key: 'R'},
				{ header: '', key: 'S'},
				{ header: '', key: 'T'},
				{ header: '', key: 'U'},
				{ header: '', key: 'V'},
				{ header: '', key: 'W'},
				{ header: '', key: 'X'},
				{ header: '', key: 'Y'},
				{ header: '', key: 'Z'},
				{ header: '', key: 'AA'},
			];

			worksheet.mergeCells('A1:I1');
			worksheet.getCell('I1').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('I1').value = 'Meta Data';

			worksheet.mergeCells('J1:N1');
			worksheet.getCell('N1').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('N1').value = 'Inner Ring';

			worksheet.mergeCells('O1:X1');
			worksheet.getCell('X1').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('X1').value = 'Assembly';

			worksheet.mergeCells('Y1:AA1');
			worksheet.getCell('AA1').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('AA1').value = 'Assembly Data Sheet';

			worksheet.addRow({A:"Roller Diameter Grade",B:"Date",C:'Shift',D:'Operator',E:'Mo.No.',F:'OR Invoice No.',
				G:'IR Invoice No.',H:'Cage Invoice No.',I:'Roller Batch No.',
				J:'Sr.No.',K:'Unique Id No.',L:'Bore',M:'Width',N:'Extra',
				O:'Cage Radial Clearance',P:'Stand Back 1',Q:'Stand Back 2',R:'Stand Back 3',S:'Stand Back Avg',
				T:'Spacer Width Calculated',U:'Spacer Width Actual',V:'Axial Clearance / Preload',W:'Total Width',X:'Set No.',Y:'Designation',Z:'ZF Wind Article No',AA:'Certificate gemnerate Date'
			});

			var row_count = 2;

			var count = 0;
			for(var i=0;i<data.length;i++){

				var d = data[i];
				// console.log(d);

				row_count++;

				//console.log(new Date(d.date));
				var s = new Date(d.date);//.toLocaleString(undefined, {timeZone: 'Asia/Kolkata'});

				//console.log(database_datetime2(s));

				worksheet.getCell('A'+row_count).value = d.roller_dia_grade;
				worksheet.getCell('B'+row_count).value = database_datetime2(s);
				worksheet.getCell('C'+row_count).value = d.shift;
				worksheet.getCell('D'+row_count).value = d.operator;
				worksheet.getCell('E'+row_count).value = d.mo_no;
				worksheet.getCell('F'+row_count).value = d.or_inv_no;
				worksheet.getCell('G'+row_count).value = d.ir_inv_no;
				worksheet.getCell('H'+row_count).value = d.cage_inv_no;
				worksheet.getCell('I'+row_count).value = d.roller_batch_no;
				worksheet.getCell('J'+row_count).value = d.ir_sr;
				worksheet.getCell('K'+row_count).value = d.ir_unq;
				worksheet.getCell('L'+row_count).value = d.bore;
				worksheet.getCell('M'+row_count).value = d.iw;
				worksheet.getCell('N'+row_count).value = d.ie;
				worksheet.getCell('O'+row_count).value = d.crc;
				worksheet.getCell('P'+row_count).value = d.sb1;
				worksheet.getCell('Q'+row_count).value = d.sb2;
				worksheet.getCell('R'+row_count).value = d.sb3;
				worksheet.getCell('S'+row_count).value = d.sbavg;


				if(count == 1)
				{
					var c = 'T'+row_count+':'+'T'+parseInt(parseInt(row_count)-parseInt(1));
					worksheet.mergeCells(c);
					worksheet.getCell(c).value = d.swc;

					c = 'U'+row_count+':'+'U'+parseInt(parseInt(row_count)-parseInt(1));
					worksheet.mergeCells(c);
					worksheet.getCell(c).value = d.swa;

					c = 'V'+row_count+':'+'V'+parseInt(parseInt(row_count)-parseInt(1));
					worksheet.mergeCells(c);
					worksheet.getCell(c).value = d.ac;

					c = 'W'+row_count+':'+'W'+parseInt(parseInt(row_count)-parseInt(1));
					worksheet.mergeCells(c);
					worksheet.getCell(c).value = d.tw;

					c = 'X'+row_count+':'+'X'+parseInt(parseInt(row_count)-parseInt(1));
					worksheet.mergeCells(c);
					worksheet.getCell(c).value = d.setno;

					c = 'Y'+row_count+':'+'Y'+parseInt(parseInt(row_count)-parseInt(1));
					worksheet.mergeCells(c);
					worksheet.getCell(c).value = d.designation;

					c = 'Z'+row_count+':'+'Z'+parseInt(parseInt(row_count)-parseInt(1));
					worksheet.mergeCells(c);
					worksheet.getCell(c).value = d.zf_wind_article_no;

					c = 'AA'+row_count+':'+'AA'+parseInt(parseInt(row_count)-parseInt(1));
					worksheet.mergeCells(c);
					worksheet.getCell(c).value = d.certdate;

					// worksheet.getCell('T'+row_count).value = d.swc;
					// worksheet.getCell('U'+row_count).value = d.swa;
					// worksheet.getCell('V'+row_count).value = d.ac;
					// worksheet.getCell('W'+row_count).value = d.tw;
					// worksheet.getCell('X'+row_count).value = d.setno;
					// worksheet.getCell('Y'+row_count).value = d.designation;
					// worksheet.getCell('Z'+row_count).value = d.zf_wind_article_no;
					// worksheet.getCell('AA'+row_count).value = d.certdate;

					//row_count++;
					count = 0;
				}
				else
					count++;


				// worksheet.addRow({A:d.roller_dia_grade,B:d.date,C:d.shift,D:d.operator,E:d.mo_no,F:d.or_inv_no,
				// 	G:d.ir_inv_no,H:d.cage_inv_no,I:d.roller_batch_no,
                //
				// 	J:d.ir_sr,K:d.ir_unq,L:d.bore,M:d.iw,N:d.ie,
				// 	O:d.crc,P:d.sb1,Q:d.sb2,R:d.sb3,S:d.sbavg,
				// 	U:d.swa,V:d.ac,W:d.tw,X:d.setno,Y:d.designation,Z:d.zf_wind_article_no,
				// 	AA:d.certdate
				// });

			}


			// var tempFilePath = '';
			// if(data.length > 0 && advance == 0)
			// {
			// 	tempFilePath = "D:/files/"+data[0].TypeName+".xlsx";
			// }
			// else if(advance == 1)
			// {
			// 	tempFilePath = "D:/files/"+file_datetime()+".xlsx";
			// }
			// else {
			// 	tempFilePath = "D:/files/"+"OOOOOOO.xlsx";
			// }
			// workbook.xlsx.writeFile(tempFilePath).then(function() {
			// 	console.log('file is written');
			// });

			workbook.xlsx.writeFile("mode-2.xlsx").then(function() {
				console.log('file is written');
				res.sendfile(path.join(__dirname, '/../mode-2.xlsx'));
			});
		} catch(err) {
			console.log('OOOOOOO this is the error: ' + err);
		}

	}


	function saveMode1Excel(data,res) {
		try {
			var workbook = new Excel.Workbook();
			var worksheet = workbook.addWorksheet('SKF-Mode-1');

			worksheet.columns = [
				{ header: '', key: 'A'},
				{ header: '', key: 'B'},
				{ header: '', key: 'C'},
				{ header: '', key: 'D'},
				{ header: '', key: 'E'},
				{ header: '', key: 'F'},
				{ header: '', key: 'G'},
				{ header: '', key: 'H'},
				{ header: '', key: 'I'},
				{ header: '', key: 'J'},
				{ header: '', key: 'K'},
				{ header: '', key: 'L'},
				{ header: '', key: 'M'},
				{ header: '', key: 'N'},
				{ header: '', key: 'O'},
				{ header: '', key: 'P'},
				{ header: '', key: 'Q'},
				{ header: '', key: 'R'},
				{ header: '', key: 'S'},
				{ header: '', key: 'T'},
				{ header: '', key: 'U'},
				{ header: '', key: 'V'},
				{ header: '', key: 'W'},
				{ header: '', key: 'X'},
				{ header: '', key: 'Y'},
			];

			worksheet.mergeCells('A1:I1');
			worksheet.getCell('I1').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('I1').value = 'Meta Data';

			worksheet.mergeCells('J1:N1');
			worksheet.getCell('N1').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('N1').value = 'Outer Ring';

			worksheet.mergeCells('O1:S1');
			worksheet.getCell('S1').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('S1').value = 'Inner Ring';

			worksheet.mergeCells('T1:Y1');
			worksheet.getCell('Y1').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('Y1').value = 'Assembly';

			worksheet.addRow({A:"Roller Diameter Grade",B:"Date",C:'Shift',D:'Operator',E:'Mo.No.',F:'OR Invoice No.',
				G:'IR Invoice No.',H:'Cage Invoice No.',I:'Roller Batch No.',
				J:'Sr.No.',K:'Unique Id No.',L:'OD',M:'Width',N:'Extra',
				O:'Sr.No.',P:'Unique Id No.',Q:'Bore',R:'Width',S:'Extra',
				T:'Cage Radial Clearance',U:'Total Width 1',V:'Total Width 2',W:'Total Width 3',X:'Total Width Average',Y:'Extra'
			});

			for(var i=0;i<data.length;i++){

				var d = data[i];
				var s = new Date(d.date);
				// console.log(d);
				worksheet.addRow({A:d.roller_dia_grade,B:database_datetime2(s),C:d.shift,D:d.operator,E:d.mo_no,F:d.or_inv_no,
					G:d.ir_inv_no,H:d.cage_inv_no,I:d.roller_batch_no,
					J:d.or_sr,K:d.or_unq,L:d.od,M:d.ow,N:d.oe,
					O:d.ir_sr,P:d.ir_unq,Q:d.bore,R:d.iw,S:d.ie,
					T:d.crc,U:d.tw1,V:d.tw2,W:d.tw3,X:d.twavg,Y:d.ex
				});

			}
			// var tempFilePath = '';
			// if(data.length > 0 && advance == 0)
			// {
			// 	tempFilePath = "D:/files/"+data[0].TypeName+".xlsx";
			// }
			// else if(advance == 1)
			// {
			// 	tempFilePath = "D:/files/"+file_datetime()+".xlsx";
			// }
			// else {
			// 	tempFilePath = "D:/files/"+"OOOOOOO.xlsx";
			// }
			// workbook.xlsx.writeFile(tempFilePath).then(function() {
			// 	console.log('file is written');
			// });

			workbook.xlsx.writeFile("mode-1.xlsx").then(function() {
				console.log('file is written');
				// res.sendFile("mode-1.xlsx");
				res.sendfile(path.join(__dirname, '/../mode-1.xlsx'));
			});
		} catch(err) {
			console.log('OOOOOOO this is the error: ' + err);
		}

	}

	function saveMode3Excel(data,res) {
		try {
			var workbook = new Excel.Workbook();
			var worksheet = workbook.addWorksheet('SKF-Mode-1');

			worksheet.columns = [
				{ header: '', key: 'A'},
				{ header: '', key: 'B'},
				{ header: '', key: 'C'},
				{ header: '', key: 'D'},
				{ header: '', key: 'E'},
				{ header: '', key: 'F'},
				{ header: '', key: 'G'},
				{ header: '', key: 'H'},
				{ header: '', key: 'I'},
				{ header: '', key: 'J'},
				{ header: '', key: 'K'},
				{ header: '', key: 'L'},
				{ header: '', key: 'M'},
				{ header: '', key: 'N'},
				{ header: '', key: 'O'},
				{ header: '', key: 'P'},
				{ header: '', key: 'Q'},
				{ header: '', key: 'R'},
				{ header: '', key: 'S'},
				{ header: '', key: 'T'},
				{ header: '', key: 'U'},
				{ header: '', key: 'V'},
				{ header: '', key: 'W'},
				{ header: '', key: 'X'},
				{ header: '', key: 'Y'},
				{ header: '', key: 'Z'},
			];

			worksheet.mergeCells('A1:I1');
			worksheet.getCell('I1').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('I1').value = 'Meta Data';

			worksheet.mergeCells('J1:N1');
			worksheet.getCell('N1').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('N1').value = 'Outer Ring';

			worksheet.mergeCells('O1:S1');
			worksheet.getCell('S1').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('S1').value = 'Inner Ring';

			worksheet.mergeCells('T1:Y1');
			worksheet.getCell('Y1').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('Y1').value = 'Assembly';

			worksheet.addRow({A:"Roller Diameter Grade",B:"Date",C:'Shift',D:'Operator',E:'Mo.No.',F:'OR Invoice No.',
				G:'IR Invoice No.',H:'Cage Invoice No.',I:'Roller Batch No.',
				J:'Sr.No.',K:'Unique Id No.',L:'OD',M:'Width',N:'Extra',
				O:'Sr.No.',P:'Unique Id No.',Q:'Bore',R:'Width',S:'Extra',
				T:'Cage Radial Clearance',U:'Stand Back 1',V:'Stand Back 2',W:'Stand Back 3',X:'Stand Back Avg',Y:'Total Width',Z:'Set No'
			});

			for(var i=0;i<data.length;i++){

				var d = data[i];
				// console.log(d);
				worksheet.addRow({A:d.roller_dia_grade,B:d.date,C:d.shift,D:d.operator,E:d.mo_no,F:d.or_inv_no,
					G:d.ir_inv_no,H:d.cage_inv_no,I:d.roller_batch_no,
					J:d.or_sr,K:d.or_unq,L:d.od,M:d.ow,N:d.oe,
					O:d.ir_sr,P:d.ir_unq,Q:d.bore,R:d.iw,S:d.ie,
					T:d.crc,U:d.sb1,V:d.sb2,W:d.sb3,X:d.sbavg,Y:d.tw,Z:d.setno
				});

			}
			// var tempFilePath = '';
			// if(data.length > 0 && advance == 0)
			// {
			// 	tempFilePath = "D:/files/"+data[0].TypeName+".xlsx";
			// }
			// else if(advance == 1)
			// {
			// 	tempFilePath = "D:/files/"+file_datetime()+".xlsx";
			// }
			// else {
			// 	tempFilePath = "D:/files/"+"OOOOOOO.xlsx";
			// }
			// workbook.xlsx.writeFile(tempFilePath).then(function() {
			// 	console.log('file is written');
			// });

			workbook.xlsx.writeFile("mode-3.xlsx").then(function() {
				console.log('file is written');
				// res.sendFile("mode-1.xlsx");
				res.sendfile(path.join(__dirname, '/../mode-3.xlsx'));
			});
		} catch(err) {
			console.log('OOOOOOO this is the error: ' + err);
		}

	}

    function saveMode4Excel(data_a,data_b,type_a,type_b,res) {
		try {
			var workbook = new Excel.Workbook();
			var worksheet = workbook.addWorksheet('SKF-Mode-4');

			worksheet.columns = [
				{ header: '', key: 'A'},
				{ header: '', key: 'B'},
				{ header: '', key: 'C'},
				{ header: '', key: 'D'},
				{ header: '', key: 'E'},
				{ header: '', key: 'F'},
				{ header: '', key: 'G'},
				{ header: '', key: 'H'},
				{ header: '', key: 'I'},
				{ header: '', key: 'J'},
				{ header: '', key: 'K'},
				{ header: '', key: 'L'},
				{ header: '', key: 'M'},
				{ header: '', key: 'N'},
				{ header: '', key: 'O'},
				{ header: '', key: 'P'},
				{ header: '', key: 'Q'},
				{ header: '', key: 'R'},
				{ header: '', key: 'S'},
				{ header: '', key: 'T'},
				{ header: '', key: 'U'},
				{ header: '', key: 'V'},
				{ header: '', key: 'W'},
				{ header: '', key: 'X'},
				{ header: '', key: 'Y'},
				{ header: '', key: 'Z'},
				{ header: '', key: 'AA'},
				{ header: '', key: 'AB'},
				{ header: '', key: 'AC'},
				{ header: '', key: 'AD'},
				{ header: '', key: 'AE'},
				{ header: '', key: 'AF'},
				{ header: '', key: 'AG'},
				{ header: '', key: 'AH'},
				{ header: '', key: 'AI'},
				{ header: '', key: 'AJ'},
				{ header: '', key: 'AK'},
				{ header: '', key: 'AL'},
				{ header: '', key: 'AM'},
				{ header: '', key: 'AN'},
				{ header: '', key: 'AO'},
				{ header: '', key: 'AP'},
				{ header: '', key: 'AQ'},
				{ header: '', key: 'AR'},
				{ header: '', key: 'AS'},
				{ header: '', key: 'AT'},
				{ header: '', key: 'AU'}
			];


			worksheet.mergeCells('K1:Z1');
			worksheet.getCell('Z1').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('Z1').value = type_a.brgType;

			worksheet.mergeCells('AA1:AP1');
			worksheet.getCell('AP1').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('AP1').value = type_b.brgType;

			worksheet.mergeCells('A2:J2');
			worksheet.getCell('J2').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('J2').value = 'Meta Data';

			worksheet.mergeCells('K2:O2');
			worksheet.getCell('O2').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('O2').value = 'Outer Ring';

			worksheet.mergeCells('P2:T2');
			worksheet.getCell('T2').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('T2').value = 'Inner Ring';

			worksheet.mergeCells('U2:Z2');
			worksheet.getCell('Z2').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('Z2').value = 'Assembly';

			worksheet.mergeCells('AA2:AE2');
			worksheet.getCell('AE2').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('AE2').value = 'Outer Ring';

			worksheet.mergeCells('AF2:AJ2');
			worksheet.getCell('AJ2').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('AJ2').value = 'Inner Ring';

			worksheet.mergeCells('AK2:AP2');
			worksheet.getCell('AP2').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('AP2').value = 'Assembly';

			worksheet.mergeCells('AQ2:AU2');
			worksheet.getCell('AU2').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('AU2').value = 'Final Assembly';

			worksheet.addRow({A:"Roller Diameter Grade",B:"Date",C:'Shift',D:'Operator',E:'Mo.No.',F:'OR Invoice No.',
				G:'IR Invoice No.',H:'Cage Invoice No.',I:'Roller Batch No.',J:'Rivet Invoice No.',
				K:'Sr.No.',L:'Unique Id No.',M:'OD',N:'Width',O:'Extra',
				P:'Sr.No.',Q:'Unique Id No.',R:'Bore',S:'Width',T:'Extra',
				U:'CRC',V:'StandBack1',W:'StandBack2',X:'StandBack3',Y:'StandBackAvg',Z:'TotalWidth',
				AA:'Sr.No.',AB:'Unique Id No.',AC:'OD',AD:'Width',AE:'Extra',
				AF:'Sr.No.',AG:'Unique Id No.',AH:'Bore',AI:'Width',AJ:'Extra',
				AK:'CRC',AL:'StandBack1',AM:'StandBack2',AN:'StandBack3',AO:'StandBackAvg',AP:'TotalWidth',
				AQ:'SetNo',AR:'CSW',AS:'ASW',AT:'AC',AU:'TotalWidthWithSpacer'
			});

			worksheet.addRow({A:"",B:"",C:'',D:'',E:'',F:'',
				G:'',H:'',I:'',J:'',
				K:'Size',L:'',M:type_a.od_size,N:type_a.ow_size,O:type_a.oe_size,
				P:'Size',Q:'',R:type_a.bore_size,S:type_a.iw_size,T:type_a.ie_size,
				U:type_a.crc_size,V:'',W:'',X:'',Y:'',Z:type_a.tw_size,

				AA:'Size',AB:'',AC:type_b.od_size,AD:type_b.ow_size,AE:type_b.oe_size,
				AF:'Size',AG:'',AH:type_b.bore_size,AI:type_b.iw_size,AJ:type_b.ie_size,
				AK:type_b.crc_size,AL:'',AM:'',AN:'',AO:'',AP:type_b.tw_size,

				AQ:'',AR:'',AS:'',AT:type_a.ac_size,AU:''
			});

			worksheet.addRow({A:"",B:"",C:'',D:'',E:'',F:'',
				G:'',H:'',I:'',J:'',
				K:'Min',L:'',M:type_a.od_min,N:type_a.ow_min,O:type_a.oe_min,
				P:'Min',Q:'',R:type_a.bore_min,S:type_a.iw_min,T:type_a.ie_min,
				U:type_a.crc_min,V:'',W:'',X:'',Y:'',Z:type_a.tw_min,

				AA:'Min',AB:'',AC:type_b.od_min,AD:type_b.ow_min,AE:type_b.oe_min,
				AF:'Min',AG:'',AH:type_b.bore_min,AI:type_b.iw_min,AJ:type_b.ie_min,
				AK:type_b.crc_min,AL:'',AM:'',AN:'',AO:'',AP:type_b.tw_min,

				AQ:'',AR:'',AS:'',AT:type_a.ac_min,AU:''
			});

			worksheet.addRow({A:"",B:"",C:'',D:'',E:'',F:'',
				G:'',H:'',I:'',J:'',
				K:'Max',L:'',M:type_a.od_max,N:type_a.ow_max,O:type_a.oe_max,
				P:'Max',Q:'',R:type_a.bore_max,S:type_a.iw_max,T:type_a.ie_max,
				U:type_a.crc_max,V:'',W:'',X:'',Y:'',Z:type_a.tw_max,

				AA:'Max',AB:'',AC:type_b.od_max,AD:type_b.ow_max,AE:type_b.oe_max,
				AF:'Max',AG:'',AH:type_b.bore_max,AI:type_b.iw_max,AJ:type_b.ie_max,
				AK:type_b.crc_max,AL:'',AM:'',AN:'',AO:'',AP:type_b.tw_max,

				AQ:'',AR:'',AS:'',AT:type_a.ac_max,AU:''
			});

			

			for(var i=0;i<data_a.length;i++){

				var d = data_a[i];
				var d1 = data_b[i];
				var s = new Date(d.date);
				
				
				// console.log(d);
				worksheet.addRow({A:d.roller_dia_grade,B:s,C:d.shift,D:d.operator,E:d.mo_no,F:d.or_inv_no,
				G:d.ir_inv_no,H:d.cage_inv_no,I:d.roller_batch_no,J:d.rivet_inv_no,
				K:d.or_sr,L:d.or_unq,M:d.od,N:d.ow,O:d.oe,
				P:d.ir_sr,Q:d.ir_unq,R:d.bore,S:d.iw,T:d.ie,
				U:d.crc,V:d.sb1,W:d.sb2,X:d.sb3,Y:d.sba,Z:d.tw,
				AA:d1.or_sr,AB:d1.or_unq,AC:d1.od,AD:d1.ow,AE:d1.oe,
				AF:d1.ir_sr,AG:d1.ir_unq,AH:d1.bore,AI:d1.iw,AJ:d1.ie,
				AK:d1.crc,AL:d1.sb1,AM:d1.sb2,AN:d1.sb3,AO:d1.sba,AP:d1.tw,
				AQ:d.set_no,AR:d.csw,AS:d.asw,AT:d.ac,AU:d.tws
				});

			}


			// var tempFilePath = '';
			// if(data.length > 0 && advance == 0)
			// {
			// 	tempFilePath = "D:/files/"+data[0].TypeName+".xlsx";
			// }
			// else if(advance == 1)
			// {
			// 	tempFilePath = "D:/files/"+file_datetime()+".xlsx";
			// }
			// else {
			// 	tempFilePath = "D:/files/"+"OOOOOOO.xlsx";
			// }
			// workbook.xlsx.writeFile(tempFilePath).then(function() {
			// 	console.log('file is written');
			// });

			workbook.xlsx.writeFile("mode-4.xlsx").then(function() {
				console.log('file is written');
				// res.sendFile("mode-1.xlsx");
				res.sendfile(path.join(__dirname, '/../mode-4.xlsx'));
			});
		} catch(err) {
			console.log('OOOOOOO this is the error: ' + err);
		}

	}

    function saveMode5Excel(data,type,res) {
		try {
			var workbook = new Excel.Workbook();
			var worksheet = workbook.addWorksheet('SKF-Mode-5');

			worksheet.columns = [
				{ header: '', key: 'A'},
				{ header: '', key: 'B'},
				{ header: '', key: 'C'},
				{ header: '', key: 'D'},
				{ header: '', key: 'E'},
				{ header: '', key: 'F'},
				{ header: '', key: 'G'},
				{ header: '', key: 'H'},
				{ header: '', key: 'I'},
				{ header: '', key: 'J'},
				{ header: '', key: 'K'},
				{ header: '', key: 'L'},
				{ header: '', key: 'M'},
				{ header: '', key: 'N'},
				{ header: '', key: 'O'},
				{ header: '', key: 'P'},
				{ header: '', key: 'Q'},
				{ header: '', key: 'R'},
				{ header: '', key: 'S'},
				{ header: '', key: 'T'}
			];


			worksheet.mergeCells('A1:AA1');
			worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('A1').value = type.brgType;

			worksheet.mergeCells('A2:K2');
			worksheet.getCell('K2').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('K2').value = 'Meta Data';

			worksheet.mergeCells('L2:T2');
			worksheet.getCell('T2').alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('T2').value = 'Inner Ring';

			worksheet.addRow({A:"Roller Diameter Grade",B:"Date",C:'Shift',D:'Operator',E:'Mo.No.',F:'OR Invoice No.',
				G:'IR Invoice No.',H:'Cage Invoice No.',I:'Roller Batch No.',J:'Rivet Invoice No.',K:'Roller Size',
				L:'Sr.No.',M:'Unique Id No.',N:'Width',O:'Track',P:'Bore',Q:'Sholder',R:'Extra',
				S:'Roller Grade',T:'Dia Over Roller'
			});

			worksheet.addRow({A:"",B:"",C:'',D:'',E:'',F:'',
				G:'',H:'',I:'',J:'',K:'',
				L:'Size',M:'',N:type.iw_size,O:type.irt_size,P:type.bore_size,Q:type.irs_size,R:type.ie_size,
				S:type.rdg_size,T:type.dor_size
			});

			worksheet.addRow({A:"",B:"",C:'',D:'',E:'',F:'',
				G:'',H:'',I:'',J:'',K:'',
				L:'Min',M:'',N:type.iw_min,O:type.irt_min,P:type.bore_min,Q:type.irs_min,R:type.ie_min,
				S:type.rdg_min,T:type.dor_min
			});

			worksheet.addRow({A:"",B:"",C:'',D:'',E:'',F:'',
				G:'',H:'',I:'',J:'',K:'',
				L:'Max',M:'',N:type.iw_max,O:type.irt_max,P:type.bore_max,Q:type.irs_max,R:type.ie_max,
				S:type.rdg_max,T:type.dor_max
			});

			for(var i=0;i<data.length;i++){

				var d = data[i];
				var s = new Date(d.date);
				// console.log(d);
				worksheet.addRow({A:d.rdg,B:database_datetime2(s),C:d.shift,D:d.operator,E:d.mo_no,F:d.or_inv_no,
					G:d.ir_inv_no,H:d.cage_inv_no,I:d.roller_batch_no,J:d.rivet_inv_no,K:d.roller_size,
					L:d.ir_sr,M:d.ir_unq,N:d.iw,O:d.irt,P:d.bore,Q:d.irs,R:d.ie,
					S:d.rdg,T:d.dor
				});

			}
			// var tempFilePath = '';
			// if(data.length > 0 && advance == 0)
			// {
			// 	tempFilePath = "D:/files/"+data[0].TypeName+".xlsx";
			// }
			// else if(advance == 1)
			// {
			// 	tempFilePath = "D:/files/"+file_datetime()+".xlsx";
			// }
			// else {
			// 	tempFilePath = "D:/files/"+"OOOOOOO.xlsx";
			// }
			// workbook.xlsx.writeFile(tempFilePath).then(function() {
			// 	console.log('file is written');
			// });

			workbook.xlsx.writeFile("mode-5.xlsx").then(function() {
				console.log('file is written');
				// res.sendFile("mode-1.xlsx");
				res.sendfile(path.join(__dirname, '/../mode-5.xlsx'));
			});
		} catch(err) {
			console.log('OOOOOOO this is the error: ' + err);
		}

	}


	app.post('/api/mode2_printcertificate',function (req,res) {

		var data =  req.body.data;

		var html = fs.readFileSync('mode1.html', 'utf8');

		html = html.replace("@1",data.designation);
		html = html.replace("@2",data.zf_wind_article_no);
		html = html.replace("@3",data.certdate);
		html = html.replace("@4",data.setno);
		html = html.replace("@5",data.tw);
		html = html.replace("@6",data.ac);

		var options = {  };

		pdf.create(html, options).toFile('public/mode2_certificates/'+data.setno+'.pdf', function(err, res2) {
			if (err)
				return console.log(err);
            console.log(res2);
			//res.sendFile("${process.cwd()}/public/mode2_certificates/index1.html");
			// res.sendFile(res2.filename);
            // res.sendFile());
            res.sendfile(path.join(__dirname, '/../public/mode2_certificates/'+data.setno+'.pdf'));
			//res.json({'error':false,'message':'Certificate Printed Successfully'});
		});

	});

    // console.log(path.join(__dirname, '/../public/mode2_certificates/1.pdf'));

	app.use(function(req, res, next) {
		//log(req);
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});

	app.get('*', function(req, res) {
		res.sendfile('./public/index.html');
	});
};
