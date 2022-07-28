module.exports = function(app,io) {

	var serialNumber = '0000000063cfc714';
	
	var gpio = require('rpi-gpio');
	var exec = require('child_process').exec;
	var fs = require('fs');

	var sqlite3 = require('sqlite3').verbose();
	var db;
	var GeneralSettings;
	var port;
	createDb();

	var isBuzzerOn = true;
	var isTimerOFF = true;
	
	var workername = '';
	var label_settings_2x2 = [];
	var label_settings_4x3 = [];

	////////// DATABASE /////////////////////////////////
	function createDb() {
		db = new sqlite3.Database('ws.sqlite3');
		db.all("SELECT * FROM GeneralSettings", function(err, rows) {
			if(rows.length > 0)
			{
				GeneralSettings = rows[0];
				if(GeneralSettings.isBuzzerOn == 0)
					isBuzzerOn = false;
				else
					isBuzzerOn = true;

				if(GeneralSettings.isTimerOFF == 1)
					isTimerOFF = true;
				else
					isTimerOFF = false;

				getGeneralSettings();
            }

		});

		db.all("SELECT * FROM LabelSettings2x2 where IsActive = 1", function(err, rows) {
			label_settings_2x2 = rows;
		});

		db.all("SELECT * FROM LabelSettings4x3 where IsActive = 1", function(err, rows) {
			label_settings_4x3 = rows;
		});
	}
	////////// DATABASE_END ////////////////////////////
	var result = exec("cat /proc/cpuinfo | grep Serial", function (error, stdout, stderr) {
		if(error){
			console.error('exec error: ${error}');
		}
		else{
			var hwserial = stdout.toString();
			hwserial = hwserial.split(':')[1];
			hwserial = hwserial.replace(' ','');
			hwserial = hwserial.substring(0,16);
			//console.log("=",hwserial,"=");
			if(hwserial.toString() == serialNumber.toString()){
			}
			else{
				
			}
		}
	});
	
	///////// GENERAL_SETTINGS //////////////////////////
	/*	var r   = 33;
		var y   = 35;
		var g   = 37;
		var b   = 40;

		var delay = 1000;

		gpio.destroy();
		gpio.reset();

		gpio.on('export', function(channel) {
					console.log('Channel set: ' + channel);
		});

		var prevValue = false;
		gpio.on('change', function(channel, value) {
			//console.log('Channel ' + channel + ' value is now ' + value);
			if(value == true && prevValue == false){
				io.sockets.emit('forceprint', true);
				console.log("Button Push...");
			}
			prevValue = value;
		});


		var r_on = 0;
		var y_on = 0;
		var g_on = 0;
		var b_on = 0;

		function rOn() {
				setTimeout(function () {
						gpio.write(r, r_on, rOn);
				}, delay);
		}

		function yOn() {
				setTimeout(function () {
						gpio.write(y, y_on, yOn);
				}, delay);
		}

		function gOn() {
				setTimeout(function () {
						gpio.write(g, g_on, gOn);
				}, delay);
		}

		function bOn() {
				setTimeout(function () {
						gpio.write(b, b_on, bOn);
				}, delay);
		}

		gpio.setup(r, gpio.DIR_OUT,rOn);
		gpio.setup(y, gpio.DIR_OUT,yOn);
		gpio.setup(g, gpio.DIR_OUT,gOn);
		gpio.setup(b, gpio.DIR_OUT,bOn);

		gpio.setup(16, gpio.DIR_IN, gpio.EDGE_BOTH);
	
    */     
	var SerialPort = require('serialport');
    	//const Readline = SerialPort.parsers.Readline;

	function getGeneralSettings() {

		try {
			var stats = fs.lstatSync('/dev/ttyUSB0');
			var result = exec("echo RaspberryPi | sudo -S chmod a+rw /dev/ttyUSB0", function (error, stdout, stderr) {
				port = new SerialPort('/dev/ttyUSB0', {
					baudRate: 9600,
					parser: SerialPort.parsers.readline("\n")
				});
				var str = '';
				port.on('open', function () {
					console.log("Open");
					port.on('data', function (data) {
						var data = data.toString('utf8');
						data = data.replace('.','');
						data = data.replace('.','');
						//console.log(data);
						io.sockets.emit('message', data.toString());
					});
				});
				initPrinter();
                        });
		}
		catch (err) {
			console.log("No Weight Attached");
			initPrinter();
		}
	}

    function allOff() {
		r_on = 0;
		y_on = 0;
		g_on = 0;
        b_on = 0;
	}

	function redOn() {
		allOff();
		r_on = 1;
		y_on = 0;
		g_on = 0;
		if(isBuzzerOn)
			b_on = 1;
		setTimeout(function () {
			allOff();
		},2000);
	}

	function yellowOn() {
		allOff();
		r_on = 0;
		y_on = 1;
		g_on = 0;
		if(isBuzzerOn)
			b_on = 1;	
		setTimeout(function () {
			allOff();
		},2000);
	}

	function greenOn() {
		allOff();
		r_on = 0;
		y_on = 0;
		g_on = 1;
		if(isBuzzerOn)
			b_on = 1;
		setTimeout(function () {
			allOff();
		},2000);
	}

	var printer = undefined;
	function initPrinter() {

		if(printer == undefined)
		{
			try{
				var stats = fs.lstatSync('/dev/usb');
				if (stats.isDirectory()) {


					var result = exec("echo RaspberryPi | sudo -S chmod a+rw /dev/usb/lp0", function (error, stdout, stderr) {
                                                try{
						printer = new SerialPort('/dev/usb/lp0', { baudrate: 9600});
                                                console.log("Open Printer Port");
                                                    }
                                                    catch(e){}
						return printer;
					});

				}
			}
			catch(err){
				console.log("Error on printer"+err);
			}
		}
		else{
			return printer;
		}
	}

	function Print2x2_300(weight,printData,shift_time,date_time,wn) {
        
			var printer_ = initPrinter();
			if(printer_ == undefined)
				return;

        	date_time = date_time.replace('-', '/');
			date_time = date_time.replace('-', '/');

			printer_.write("^XA^PR4^MD24", function (err) {
			});

			for (var i = 0; i < label_settings_2x2.length; i++) {

				var item = label_settings_2x2[i];
				if (item.Id == 1) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + "" + weight + " kg.^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 2) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + "" + printData.ShipperNo + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 3) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + "" + wn.toString().toUpperCase() + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 4) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + "" + date_time.replace('-', '/') + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 5) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + "" + shift_time + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 6) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + "" + printData.CountryName.toString().toUpperCase() + "^FS^FS^FS", function (err) {
					});
				}
				}
				printer_.write("^XZ", function (err) {
				});
			//}
	}

	function Print4x3_300(weight,printData,shift_time,date_time,wn){
            
		    var printer_ = initPrinter();
			if(printer_ == undefined)
			return;

			date_time = date_time.replace('-', '/');
			date_time = date_time.replace('-', '/');
			
			printer_.write("^XA^PR4^MD24", function (err) {
			});
			printer_.write("^FO0,180^GB1600,0,3^FS", function (err) {
			});

			printer_.write("^FO40,280^A0N,30,30^FDManufactured by:^FS^FS^FS", function (err) {
			});
			printer_.write("^FO40,340^A0N,50,45^FDCADILA^FS ^FS ^FS", function (err) {
			});
			printer_.write("^FO40,410^A0N,22,22^FDPHARMACEUTICALS  LIMITED^FS ^FS ^FS", function (err) {
			});
			printer_.write("^FO40,460^A0N,24,24^FD1389,Dholka-382225,^FS ^FS ^FS", function (err) {
			});
			printer_.write("^FO40,510^A0N,24,24^FDDist.:Ahmedabad.^FS ^FS ^FS", function (err) {
			});
			printer_.write("^FO340,180^GB0,800,2^FS", function (err) {
			});

			for (var i = 0; i < label_settings_4x3.length; i++) {

				var item = label_settings_4x3[i];

				if (item.Id == 1) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + printData.ProductName + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 2) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + printData.FullName1 + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 3) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + printData.FullName2 + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 4) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + printData.FullName3 + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 5) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + printData.Remarks1 + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 6) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + printData.Remarks2 + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 7) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + printData.Remarks3 + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 8) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + " " + printData.MfgLicNo + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 9) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + " " + printData.MfgNo + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 10) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + " " + printData.MfgDate + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 11) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + " " + printData.ExpDate + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 12) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FDDate & Shift   : " + date_time + " " + shift_time+ "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 13) {

                    printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + "" + weight + " Kg.^FS^FS^FS", function (err) {
					});
                }
				else if (item.Id == 14) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + " " + printData.ShipperNo + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 15) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + " " + wn.toString().toUpperCase() + "^FS^FS^FS", function (err) {
					});
				}
				else if (item.Id == 16) {
					printer_.write("^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD"+printData.BoxDetails+"^FS^FS^FS", function (err) {
					});
					
				}
			}

			printer_.write("^XZ", function (err) {
			});
	}

	///////// GENERAL_SETTINGS_END //////////////////////////
	app.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});

	app.get('/api/getip',function (req,res) {
		res.json(getNetworkIP());
	});

	function getNetworkIP() {
		var os = require('os');
		var ifaces = os.networkInterfaces();
		var addresses = [];

		Object.keys(ifaces).forEach(function (ifname) {
			var alias = 0;

			ifaces[ifname].forEach(function (iface) {
				if ('IPv4' !== iface.family || iface.internal !== false) {
					return;
				}

				if (alias >= 1) {
					addresses.push(iface.address);
				} else {
					addresses.push(iface.address);
				}
				++alias;
			});
		});

		if(!addresses.length>0)addresses.push('0.0.0.0');
		return addresses;
	}

	// app.get('/downloadbatchdata', function(req, res){
	// 	var filename = req.query.filename;
	// 	var file = fixed_path+filename+".csv";
	// 	res.download(file);
	// });

	// app.get('/api/getcsv',function (req,res) {
	// 	var filename = req.query.filename;
	// 	fs.readFile(fixed_path+filename+".csv", function (err, data) {
	// 		var csv = data;
	// 		res.setHeader('Content-disposition', 'attachment; filename='+filename+'.csv');
	// 		res.set('Content-Type', 'text/csv');
	// 		res.status(200).send(csv);
	// 	})
	// });


	io.sockets.on('connection', function (socket) {

		//console.log("New Connection...");

		socket.on('alloff', function (data) {
			allOff();
		});

		socket.on('redon', function (data) {
			redOn();
		});

		socket.on('yellowon', function (data) {
			yellowOn();
		});

		socket.on('greenon', function (data) {
            		greenOn();
		});

	});

	io.sockets.on('disconnect', function (socket) {
		console.log("Client disconnected...");
	});

	// app.get('/api/exit',function (req,res) {
	// 	var child = exec("sudo shutdown -h now", function (error, stdout, stderr) {
	// 		//res.end("Shutdown...");
	// 	});
	// 	res.json('Shutdown...');
	// });

	function getDate2() {
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
		//var sDate = dd+'-'+MM+'-'+yy+' '+hh+':'+mm+':'+ss;
		//var sDate = yy+'-'+MM+'-'+dd+' '+hh+':'+mm+':'+ss;
		if(isTimerOFF == true)
		{
			sDate = dd+'-'+MM+'-'+yy;
		}
		else{
			sDate = dd+'-'+MM+'-'+yy+' '+hh+':'+mm+':'+ss;
		}
		return sDate;
	}

	function getDate() {
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
		//var sDate = dd+'-'+MM+'-'+yy+' '+hh+':'+mm+':'+ss;
		//var sDate = yy+'-'+MM+'-'+dd+' '+hh+':'+mm+':'+ss;
		var sDate = '';
		// if(isTimerOFF == true)
		// {
		// 	sDate = yy+'-'+MM+'-'+dd;
		// }
		// else{
		// 	sDate = yy+'-'+MM+'-'+dd+' '+hh+':'+mm+':'+ss;
		// }
		if(isTimerOFF == true)
		{
			sDate = dd+'-'+MM+'-'+yy;
		}
		else{
			sDate = dd+'-'+MM+'-'+yy+' '+hh+':'+mm+':'+ss;
		}
		return sDate;
	}

	// Users Data
	app.get('/api/addNewUser',function (req,res) {
		var username = req.query.username;
		var firstname = req.query.firstname;
		var lastname = req.query.lastname;
		var password = req.query.password;
		db.all("SELECT * FROM Users where Username = '"+username+"'", function(err, rows) {
			if(rows.length > 0)
			{
				res.json({'error':true,'message':'Username already exist.'});
			}
			else{
				var datetime = getDate();
				var loginDateTime = '';
				var stmt = db.prepare("INSERT INTO Users('FirstName','LastName','Username','Password','Created','LastLogin') VALUES (?,?,?,?,?,?)");
				stmt.run(firstname,lastname,username,password,datetime,loginDateTime);
				stmt.finalize();
				res.json({'error':false,'message':'User registered successfully'});
			}
		});
	});

	app.get('/api/checkLogin',function (req,res) {
		var username = req.query.username;
		var password = req.query.password;
		workername = req.query.workername;
                if(workername == undefined)
                {
                    res.json({'error':true,'message':'Invalid Workername'});
                }
                else if(!workername.length > 0){
                    res.json({'error':true,'message':'Invalid Workername'});
                }
                else{
                    var query = "SELECT * FROM Users where Username = '"+username+"' and Password = '"+password+"'";
					db.all(query, function(err, rows) {
							if(rows.length > 0)
							{
									res.json({'error':false,'message':'Login Successfully','data':rows[0]});
							}
							else{
									res.json({'error':true,'message':'Invalid username or password'});
							}
					});
                }
	});

	app.get('/api/getUsersList',function (req,res) {

		var query = "SELECT  *  FROM Users";
		db.all(query, function(err, rows) {
			if(rows.length > 0)
			{
				res.json({'error':false,'data':rows});
			}
			else{
				res.json({'error':true});
			}
		});
	});

	app.get('/api/getusers',function (req,res) {

		var query = "SELECT * FROM Users";
		db.all(query, function(err, rows) {
			if(rows.length > 0)
			{
				res.json({'error':false,'data':rows});
			}
			else{
				res.json({'error':true});
			}
		});

	});
	
	app.get('/api/updateuser',function (req,res) {

		var query = "UPDATE Users set Username = ? , Password = ? where ID = ?";
		var stmt = db.prepare(query);
		stmt.run(req.query.username,req.query.password,req.query.id);
		stmt.finalize();
		res.json({'error':false,'message':"User updated successfully"});

	});

	app.get('/api/deleteuser',function (req,res) {

		var query = "Delete from Users where ID = ?";
		var stmt = db.prepare(query);
		stmt.run(req.query.id);
		stmt.finalize();
		res.json({'error':false,'message':"User deleted successfully"});

	});

	// End Users Data

	// Batch Data

	app.get('/api/records',function (req,res) {
		var filename = req.query.filename;
		var query = "SELECT  *  FROM Records where BatchNo = "+filename;
		db.all(query, function(err, rows) {
			//console.log(rows);
			res.json({'error':false,'data':rows});
		})
	})

	app.get('/api/getAllBatchRecords',function (req,res) {
		var query = "SELECT nb.* , bm.*,nb.ID NB_ID,bm.ID BM_ID,nb.Created  NB_Created,bm.Created BM_Created FROM NewBatchRecord  nb LEFT OUTER JOIN BatchMasterRecord  bm ON nb.MasterNumber = bm.MasterNumber WHERE bm.ProductName = nb.ProductName order by nb.ID desc LIMIT 50";
		db.all(query, function(err, rows) {
			if(rows.length > 0)
			{
				res.json({'error':false,'data':rows});
			}
			else{
				res.json({'error':true});
			}
		});
	});

	app.get('/api/getSingleBatchRecords',function (req,res) {
		var batch_id = req.query.batch_id;
		var query = "SELECT nb.* , bm.*,nb.ID NB_ID,bm.ID BM_ID,nb.Created  NB_Created,bm.Created BM_Created FROM NewBatchRecord  nb LEFT OUTER JOIN BatchMasterRecord  bm ON nb.MasterNumber = bm.MasterNumber WHERE bm.ProductName = nb.ProductName and nb.ID = "+batch_id+"   order by nb.ID desc LIMIT 1";
		db.all(query, function(err, rows) {
			if(rows.length > 0)
			{
				res.json({'error':false,'data':rows});
			}
			else{
				res.json({'error':true});
			}
		});
	});

	app.get('/api/getDuplicateRecord',function (req,res) {
		var filename = req.query.filename;
		var record = req.query.record;
		var batch = JSON.parse(req.query.batch);
		//console.log(batch);
		var query = "SELECT  *  FROM Records where BatchNo = "+filename+" and ShipperNo = "+record;
		db.all(query, function(err, rows) {
			if(rows.length > 0)
			{
				var data = rows[0];

				//console.log(data);
				var weight = data.Weight;
				var format = batch.PrintFormat;
				var printData = batch;
				printData.ShipperNo = data.ShipperNo;
				var shift_time = data.ShiftTime;
				var PrintCopies = parseInt(batch.PrintCount);
				//console.log(printData);
				if(format == 1)
				{
					for(var i=0;i<PrintCopies;i++) {
						Print4x3_300(weight,printData,shift_time,data.DateTime,data.User);
					}
				}
				else{
					for(var i=0;i<PrintCopies;i++) {
						Print2x2_300(weight,printData,shift_time,data.DateTime,data.User);
					}
				}
				res.json({'error':false});

			}
			else{
				res.json({'error':true});
			}
		})

		// res.json({'error':false});
	})
	
	app.get('/api/getProductRecords',function (req,res) {
		var query = "SELECT  *  FROM BatchMasterRecord";
		db.all(query, function(err, rows) {
			if(rows.length > 0)
			{
				res.json({'error':false,'data':rows});
			}
			else{
				res.json({'error':true});
			}
		});
	});

	app.get('/api/addNewBatch',function (req,res) {

		var masterNumber = req.query.masterNumber;
		var productName = req.query.productName;
		var mfgNo = req.query.mfgNo;
		var mfgLicNo = req.query.mfgLicNo;
		var mfgDate = req.query.mfgDate;
		var expDate = req.query.expDate;
		var minShipperWt = req.query.minShipperWt;
		var maxShipperWt = req.query.maxShipperWt;
		var halfcarton = req.query.halfcarton;
		var boxQty = req.query.boxQty;
		var shipperNo = req.query.shipperNo;
		var countryName = req.query.countryName;
		var username = req.query.username;
		var status = 0;
		var boxCompleted = 0;
		var editbatchnumber = req.query.editbatchnumber;
		var print_option = req.query.print_option;
		var print_copy = req.query.print_copy;

		var datetime = getDate();

		if(editbatchnumber == -1){
			var stmt = db.prepare("INSERT INTO NewBatchRecord('MasterNumber','ProductName','MfgNo','MfgLicNo','MfgDate','ExpDate','MinShipperWt','MaxShipperWt','HalfCarton','BoxQty','ShipperNo','CountryName','PackedBy','Status','BoxCompleted','Print','PrintCount','Created')" +
				"VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
			stmt.run(masterNumber,productName,mfgNo,mfgLicNo,mfgDate,expDate,minShipperWt,maxShipperWt,halfcarton,boxQty,shipperNo,countryName,username,status,boxCompleted,print_option,print_copy,datetime);
			stmt.finalize();
			res.json({'error':false,'message':'New batch created successfully.'});
		}
		else{
			var stmt = db.prepare("UPDATE NewBatchRecord set 'MasterNumber' = ?,'ProductName' = ?,'MfgNo'=?,'MfgLicNo'=?,'MfgDate'=?,'ExpDate'=?,'MinShipperWt'=?,'MaxShipperWt'=?,'HalfCarton'=?,'BoxQty'=?,'ShipperNo'=?,'CountryName'=?,'PackedBy'=?,'Print'=?,'PrintCount'=?,'Created'=? where ID = ?");
			stmt.run(masterNumber,productName,mfgNo,mfgLicNo,mfgDate,expDate,minShipperWt,maxShipperWt,halfcarton,boxQty,shipperNo,countryName,username,print_option,print_copy,datetime,editbatchnumber);
			stmt.finalize();
			res.json({'error':false,'message':'Batch updated successfully.'});
		}

	});

	app.get('/api/updateBatchStatus',function (req,res) {
		var batchID = req.query.batchID;
		var batchStatus = req.query.status;
		
		if(batchStatus == 0 || batchStatus == 2){
			batchStatus = 1;
			var query = "UPDATE NewBatchRecord set Status = 2 where Status = 1";
			var stmt = db.prepare(query);
			stmt.run();
			stmt.finalize();
			var query = "UPDATE NewBatchRecord set Status = ? where ID = ?";
			stmt = db.prepare(query);
			stmt.run(batchStatus,batchID);
			stmt.finalize();

			res.json({'error':false});
		}
		else if(batchStatus == 1){
			batchStatus = 2;
			var query = "UPDATE NewBatchRecord set Status = ? where ID = ?";
			var stmt = db.prepare(query);
			stmt.run(batchStatus,batchID);
			stmt.finalize();
			res.json({'error':false});
		}
		else if(batchStatus == 3){
			var query = "UPDATE NewBatchRecord set Status = 4 where ID = ?";
			var stmt = db.prepare(query);
			stmt.run(batchID);
			stmt.finalize();
			res.json({'error':false});
		}
		else if(batchStatus == 4){
			var query = "DELETE FROM NewBatchRecord where ID = ?";

			var stmt = db.prepare(query);
			stmt.run(batchID);
			stmt.finalize();

			var query = "DELETE FROM Records where BatchNo = ?";
			var stmt = db.prepare(query);
			stmt.run(batchID);
			stmt.finalize();

			
			res.json({'error':false});
		}
	});

	app.get('/api/updateBatchStatusComplete',function (req,res) {
		var batchID = req.query.batchID;
		var query = "UPDATE NewBatchRecord set Status = 3 where ID = ?";
		var stmt = db.prepare(query);
		stmt.run(batchID);
		stmt.finalize();
		res.json({'error':false});
	});

	app.get('/api/getShippers',function (req,res) {
		var batchNo = req.query.batchNo;
		var query = "SELECT * FROM Records where BatchNo = '"+batchNo+"' and Status = 1 order by ID desc";
		db.all(query, function(err, rows) {
			res.json({'error':false,'data':rows});
		});
	});

	app.get('/api/getMinMax',function (req,res) {
		var batchno = req.query.batchno;
		var halfweight = req.query.halfweight;
		var avg = 0;
		var query = "select Weight from Records where BatchNo = "+batchno+" and Status = 1 order by ShipperNo desc limit 5";
		db.all(query, function(err, rows) {
			for(var i=0;i<rows.length;i++){
				var recordWeight = rows[i].Weight;
				avg+= parseFloat(recordWeight);
			}
			console.log("SUM = ",avg);
				avg = avg/5;
				avg = avg.toFixed(3);
				//console.log("Avg = ",avg);
				//console.log((parseFloat(avg)-parseFloat(halfweight)).toFixed(3));
				//console.log((parseFloat(avg)+parseFloat(halfweight)).toFixed(3));
				var query = "UPDATE NewBatchRecord set MinShipperWt = ?, MaxShipperWt = ? where ID = ?";
				var stmt = db.prepare(query);
				stmt.run((parseFloat(avg)-parseFloat(halfweight)).toFixed(3),(parseFloat(avg)+parseFloat(halfweight)).toFixed(3),batchno);
				stmt.finalize();
				res.json({'error':false,'minShipperWeight':(parseFloat(avg)-parseFloat(halfweight)).toFixed(3),'maxShipperWeight':
					(parseFloat(avg)+parseFloat(halfweight)).toFixed(3)
				});
		});
	})

	app.post('/api/printweight',function (req,res) {
		
		console.log("Triggered");
		var data = req.body;
		console.log(data);
		var weight = data.weight;
		var format = data.format;
		var printData = data.data;
		var shift_time = data.shift;
		var isforceprint = data.forceprint;
		var wn = data.wn;
		workername = wn;
		var PrintCopies = parseInt(data.data.PrintCount);

		weight = parseFloat(weight).toFixed(3);
		if(isforceprint == true)
		{
			weight = weight.toString();
			var str2 = "*";
			weight = weight.concat(str2);
		}
		weight = weight.toString();
                        
		var date = getDate();
		var stmt = db.prepare("INSERT INTO Records('BatchNo','ShipperNo','MasterNumber','ProductName','MfgNo','MfgLicNo','MfgDate','ExpDate','Weight','DateTime','User','ShiftTime','Created','Status')" +
			"VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
		stmt.run(printData.NB_ID,parseInt(printData.ShipperNo),printData.MasterNumber,printData.ProductName,printData.MfgNo,printData.MfgLicNo,printData.MfgDate,printData.ExpDate,weight,date,wn.toUpperCase(),shift_time,getDate(),1);
		stmt.finalize();
		
		var query = "UPDATE NewBatchRecord set ShipperNo = ? where ID = ?";
		var stmt = db.prepare(query);
		stmt.run(parseInt(printData.ShipperNo)+1,printData.NB_ID);
		stmt.finalize();
		
		if(format == 1)
		{
			for(var i=0;i<PrintCopies;i++) {
				Print4x3_300(weight,printData,shift_time,getDate2(),data.wn);
			}
		}
		else{
			for(var i=0;i<PrintCopies;i++) {
				Print2x2_300(weight,printData,shift_time,getDate2(),data.wn);
			}
		}

		io.sockets.emit('printdone', "ok");
		res.json({'error':false});
	});

	app.post('/api/testprint',function (req,res) {
		var data = req.body;
		console.log(data);
		var weight = data.weight;
		var format = data.format;
		var printData = data.data;
		printData.BoxCompleted = 0;
		//printData.ShipperNo = '0';
		if(weight == '0.000')
		printData.ShipperNo = '0';
		var shift_time = data.shift;
		var PrintCopies = parseInt(data.data.PrintCount);
		if(format == 1)
		{
			if(printData.Print == 1)
			{
				for(var i=0;i<PrintCopies;i++) {
					Print4x3_300(weight,printData,shift_time,getDate2(),data.wn);
				}
			}
		}
		else{
			if(printData.Print == 1)
			{
				for(var i=0;i<PrintCopies;i++) {
					Print2x2_300(weight,printData,shift_time,getDate2(),data.wn);
				}
			}
		}
		res.json({'error':false});
	});

	// End Batch Data

	//Master Data

	app.get('/api/getAllMasterRecords',function (req,res) {
		var masterNumber = req.query.masterNumber;
		var query = "SELECT * FROM BatchMasterRecord";
		db.all(query, function(err, rows) {
			if(rows.length > 0)
			{
				res.json({'error':false,'data':rows});
			}
			else{
				res.json({'error':true});
			}
		});
	});

	app.get('/api/addNewMasterRecord',function (req,res) {
		var masterNumber = req.query.newMasterNumber;
		var productName = req.query.productName;
		var fullName1 = req.query.fullName1;
		var fullName2 = req.query.fullName2;
		var fullName3 = req.query.fullName3;
		var boxDetails = req.query.boxDetails;
		var remarks1 = req.query.remarks1;
		var remarks2 = req.query.remarks2;
		var remarks3 = req.query.remarks3;
		var print_format = req.query.print_format;

		var datetime = getDate();
		var stmt = db.prepare("INSERT INTO BatchMasterRecord('MasterNumber','ProductName','FullName1','FullName2','FullName3','BoxDetails','Remarks1','Remarks2','Remarks3','Created','PrintFormat') VALUES (?,?,?,?,?,?,?,?,?,?,?)");
		stmt.run(masterNumber,productName,fullName1,fullName2,fullName3,boxDetails,remarks1,remarks2,remarks3,datetime,print_format);
		stmt.finalize();
		res.json({'error':false,'master_record_error':false,'message':'Master record inserted successfully.'});
	});

	app.get('/api/updateMasterRecord',function (req,res) {

		var master_id = req.query.master_id;
		var masterNumber = req.query.newMasterNumber;
		var productName = req.query.productName;
		var fullName1 = req.query.fullName1;
		var fullName2 = req.query.fullName2;
		var fullName3 = req.query.fullName3;
		var boxDetails = req.query.boxDetails;
		var remarks1 = req.query.remarks1;
		var remarks2 = req.query.remarks2;
		var remarks3 = req.query.remarks3;
		var print_format = req.query.print_format;

		var datetime = getDate();
		var stmt = db.prepare("UPDATE BatchMasterRecord set 'MasterNumber' = ? ,'ProductName' = ?,'FullName1' = ?,'FullName2' = ? ,'FullName3' = ? ,'BoxDetails' = ?,'Remarks1' = ?,'Remarks2' = ? ,'Remarks3' = ? , 'Created' = ? ,'PrintFormat' = ? where ID = ?");
		stmt.run(masterNumber,productName,fullName1,fullName2,fullName3,boxDetails,remarks1,remarks2,remarks3,datetime,print_format,master_id);
		stmt.finalize();
		res.json({'error':false,'master_record_error':false,'message':'Master record updated successfully.'});

	});

	app.post('/api/deletemaster',function (req,res) {
		var id = req.body.id;
        var query = "Delete from BatchMasterRecord where ID = ?";
		var stmt = db.prepare(query);
		stmt.run(id);
		stmt.finalize();
		res.json({'error':false});
	});

	//End Master Data

	app.post('/api/deleteweight',function (req,res) {
		var id = req.body.id;
        var query = "Delete from Records where ID = ?";
		var stmt = db.prepare(query);
		stmt.run(id);
		stmt.finalize();
		res.json({'error':false});
	});

	app.post('/api/updatedata',function (req,res) {
		var data = req.body.data;
		var id = req.body.id;
		var index = req.body.index;
		var query = "";
		if(index == 1)
			query = "UPDATE Records set User = ? where ID = ?";
		if(index == 2)
			query = "UPDATE Records set ShiftTime = ? where ID = ?";
		if(index == 3)
			query = "UPDATE Records set DateTime = ? where ID = ?";
		if(index == 4)
			query = "UPDATE Records set Weight = ? where ID = ?";
		var stmt = db.prepare(query);
		stmt.run(data,id);
		stmt.finalize();
        
		res.json({'error':false});
	});

	app.get('/api/buzzerstatusupdate',function (req,res) {
		var value = req.query.data;
		if(value == 0)
			isBuzzerOn = false;
		else
			isBuzzerOn = true;
		var query = "UPDATE GeneralSettings set isBuzzerOn = ?";
		var stmt = db.prepare(query);
		stmt.run(value);
		stmt.finalize();
		res.json({'error':false,'message':""});
	});

	app.get('/api/timestatusupdate',function (req,res) {
		var value = req.query.data;
		if(value == 1)
			isTimerOFF = true;
		else
			isTimerOFF = false;
		var query = "UPDATE GeneralSettings set isTimerOFF = ?";
		var stmt = db.prepare(query);
		stmt.run(value);
		stmt.finalize();
		res.json({'error':false,'message':""});
	});

	
	app.get('/api/getGeneralSettins',function (req,res) {

		var query = "SELECT * FROM GeneralSettings";
		db.all(query, function(err, rows) {
			if(rows.length > 0)
			{
				res.json({'error':false,'data':rows[0]});
			}
			else{
				res.json({'error':true});
			}
		});

	});
	
	app.get('/api/updategeneralsettingssystemid',function (req,res) {

		var query = "UPDATE GeneralSettings set Extra2 = ?";
		var stmt = db.prepare(query);
		stmt.run(req.query.systemid);
		stmt.finalize();
		res.json({'error':false,'message':"System ID updated successfully"});

	});

	app.get('/api/updategeneralsettings',function (req,res) {

		var query = "UPDATE GeneralSettings set AdminPassword = ?";
		var stmt = db.prepare(query);
		stmt.run(req.query.adminpassword);
		stmt.finalize();

		res.json({'error':false,'message':"Admin Password updated successfully"});

	});

	app.post('/api/updatedate',function (req,res) {

		var date_time = req.body.date_time
        console.log(date_time);
		setTimeout(function () {
			var child = exec("echo RaspberryPi | sudo -S date -s '"+date_time+"'", function (error, stdout, stderr) {

                            var child1 = exec("echo RaspberryPi | sudo hwclock -w", function (error, stdout, stderr) {
                                var child2 = exec("echo RaspberryPi | sudo hwclock -r", function (error, stdout, stderr) {
                                });
                            });
                            
			});
		},1000);
		res.json('1');
	});

	app.get('/api/getLabelSettings2x2',function (req,res) {

		var query = "SELECT * FROM LabelSettings2x2";
		db.all(query, function(err, rows) {
			if(rows.length > 0)
			{
				res.json({'error':false,'data':rows});
			}
			else{
				res.json({'error':true});
			}
		});

	});

	app.get('/api/updateLabel2x2',function (req,res) {

		var query = "UPDATE LabelSettings2x2 set FieldName = ? , LeftPos = ? , TopPos = ? , FontSize = ? , IsActive = ? where Id = ?";
		var stmt = db.prepare(query);
		stmt.run(req.query.FieldName,req.query.LeftPos,req.query.TopPos,req.query.FontSize,req.query.IsActive,req.query.id);
		stmt.finalize();

		db.all("SELECT * FROM LabelSettings2x2 where IsActive = 1", function(err, rows) {
			label_settings_2x2 = rows;

			var str = "^XA^PR4^MD24";
			for (var i = 0; i < label_settings_2x2.length; i++) {
					var item = label_settings_2x2[i];
					if (item.Id == 1) {
						str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + "0.000 kg.^FS^FS^FS";
					}
					else if (item.Id == 2) {
						str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + "100^FS^FS^FS";
					}
					else if (item.Id == 3) {
						str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + "OPERATOR^FS^FS^FS";
					}
					else if (item.Id == 4) {
						str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + " 26/07/2022^FS^FS^FS";
					}
					else if (item.Id == 5) {
						str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + " II^FS^FS^FS";
					}
					else if (item.Id == 6) {
						str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + " INDIA^FS^FS^FS";
					}
				}
				str+="^XZ";
				res.json({'error':false,'message':"Data updated successfully","cmd":str});
		});
		

	});

	app.get('/api/getLabelSettings4x3',function (req,res) {

		var query = "SELECT * FROM LabelSettings4x3 Order By Id asc";
		db.all(query, function(err, rows) {
			if(rows.length > 0)
			{
				res.json({'error':false,'data':rows});
			}
			else{
				res.json({'error':true});
			}
		});

	});

	app.get('/api/updateLabel4x3',function (req,res) {

		var query = "UPDATE LabelSettings4x3 set FieldName = ? , LeftPos = ? , TopPos = ? , FontSize = ? , IsActive = ? where Id = ?";
		var stmt = db.prepare(query);
		stmt.run(req.query.FieldName,req.query.LeftPos,req.query.TopPos,req.query.FontSize,req.query.IsActive,req.query.id);
		stmt.finalize();
		db.all("SELECT * FROM LabelSettings4x3 where IsActive = 1", function(err, rows) {
			label_settings_4x3 = rows;

			var str = "^XA^PR4^MD24";
			str+="^FO0,180^GB1600,0,3^FS";
			str+="^FO40,280^A0N,30,30^FDManufactured by:^FS^FS^FS";
			str+="^FO40,340^A0N,50,45^FDCADILA^FS ^FS ^FS"
			str+="^FO40,410^A0N,22,22^FDPHARMACEUTICALS  LIMITED^FS ^FS ^FS";
			str+="^FO40,460^A0N,24,24^FD1389,Dholka-382225,^FS ^FS ^FS";
			str+="^FO40,510^A0N,24,24^FDDist.:Ahmedabad.^FS ^FS ^FS";
			str+="^FO340,180^GB0,800,2^FS";
			for (var i = 0; i < label_settings_4x3.length; i++) {

				var item = label_settings_4x3[i];

				if (item.Id == 1) {
					str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FDPRODUCT NAME^FS^FS^FS";
				}
				else if (item.Id == 2) {
					str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FDPRODUCT FULL NAME 1^FS^FS^FS";
				}
				else if (item.Id == 3) {
					str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FDPRODUCT FULL NAME 2^FS^FS^FS";
				}
				else if (item.Id == 4) {
					str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FDPRODUCT FULL NAME 3^FS^FS^FS";
				}
				else if (item.Id == 5) {
					str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FDREMARKS LINE 1^FS^FS^FS";
				}
				else if (item.Id == 6) {
					str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FDREMARKS LINE 2^FS^FS^FS";
				}
				else if (item.Id == 7) {
					str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FDREMARKS LINE 3^FS^FS^FS";
				}
				else if (item.Id == 8) {
					str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + " G/1500^FS^FS^FS";
				}
				else if (item.Id == 9) {
					str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + " J1010^FS^FS^FS";
				}
				else if (item.Id == 10) {
					str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + " JUN 2022^FS^FS^FS";
				}
				else if (item.Id == 11) {
					str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + " JUL 2024^FS^FS^FS";
				}
				else if (item.Id == 12) {
					str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FDDate & Shift   : 26/07/2022 II^FS^FS^FS";
				}
				else if (item.Id == 13) {
					str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + "0.000 Kg.^FS^FS^FS";
				}
				else if (item.Id == 14) {
					str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + " 100^FS^FS^FS";
				}
				else if (item.Id == 15) {
					str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD" + item.FieldName + " OPERATOR^FS^FS^FS";
				}
				else if (item.Id == 16) {
					str+="^FO" + item.LeftPos + "," + item.TopPos + "^A0N," + item.FontSize + "," + item.FontSize + "^FD10x10x10^FS^FS^FS";
				}
			}
			str+="^XZ";
			
			res.json({'error':false,'message':"Data updated successfully","cmd":str});
		});

	});


	setInterval(function(){
		update();
	},5000);


	function update(){
		setTimeout(function () {

			if(fs.existsSync('/home/pi/Desktop/1'))
			{
				var child = exec("echo RaspberryPi | sudo rm -rf cadila", function (error, stdout, stderr) {
					var child = exec("echo RaspberryPi | sudo git clone https://github.com/itechinterface/cadila.git", function (error, stdout, stderr) {
						var child = exec("echo RaspberryPi | sudo rm -rf /home/pi/Downloads/ShipperScale/app", function (error, stdout, stderr) {
							var child = exec("echo RaspberryPi | sudo mv /home/pi/Downloads/ShipperScale/cadila/app /home/pi/Downloads/ShipperScale/", function (error, stdout, stderr) {
								var child = exec("echo RaspberryPi | sudo rm -rf /home/pi/Downloads/ShipperScale/public", function (error, stdout, stderr) {
									var child = exec("echo RaspberryPi | sudo mv /home/pi/Downloads/ShipperScale/cadila/public /home/pi/Downloads/ShipperScale/", function (error, stdout, stderr) {
										var child = exec("echo RaspberryPi | sudo rm -rf /home/pi/Downloads/ShipperScale/cadila", function (error, stdout, stderr) {
											var child = exec("echo RaspberryPi | sudo rm -rf /home/pi/Desktop/1", function (error, stdout, stderr) {
		
											});
										});
									});
								});
							});
						});
					});
                });
			}
			
			
		},1000);
	}
	
	app.get('*', function(req, res) {
		res.sendfile('./public/index.html');
	});
};




			
			
			
		