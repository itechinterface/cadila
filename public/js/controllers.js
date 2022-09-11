angular.module('starter.controllers', [])

    .factory('socket', function ($rootScope) {
        var socket = io.connect('http://localhost:8080');
        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                })
            }
        };
    })

    .directive('keyshortcut', ['$rootScope','socket',function(rootScope,socket) {
            return {
                link: function ($scope, $element, $attrs,$emit) {
                    $element.bind("keydown", function (event) {
                        rootScope.$broadcast('keydown',event.which);
                    });

                    socket.on('message', function (data) {
                        data = data.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '') ;
                        //console.log(data);
			if(data.length>2)
				data = data.substr(0,data.length-3)+'.'+data.substr(data.length-3);
                        data = parseFloat(data).toFixed(3);
                        if(data.toString().split(".").length>1)
                            window.localStorage.setItem('dp',data.toString().split(".")[1].length);
                        else
                            window.localStorage.setItem('dp',3);
                        data = parseFloat(data);
                        data = data.toFixed(parseInt(window.localStorage.getItem('dp')));
                        rootScope.$broadcast('onWeightChange',data);
                    });

                    socket.on('forceprint', function (data) {
                        rootScope.$broadcast('forceprint',data);
                    });

                    socket.on('printdone', function (data) {
                        rootScope.$broadcast('printdone',data);
                    });




                }
            };
        }
    ])

    .factory('focus', function($timeout, $window) {
        return function(id) {
            $timeout(function() {
                var element = $window.document.getElementById(id);
                if(element)
                    element.focus();
            });
        };
    })

    .controller('mainctrl',function(socket,focus,$interval,$timeout,$rootScope,$scope, $http,$window,$mdDialog,$location,$q,$sce) {

        $scope.Model = {

        };

        var lastKey;

        $rootScope.$on('keydown', function (evt,data) {
            if($location.absUrl() == 'http://localhost:8081/#/dashboard')
            {
                console.log(data);
                switch (data) {
                    case 17:{
                        if(lastKey == 27){
                            $timeout(function() {
                                $scope.Model.reopenHide = !$scope.Model.reopenHide;
                            });
                        }
                        break;
                    }
                    default:
                }
                lastKey = data;
            }
        });

        $scope.Model.selectedBatch;
        var adminPassword = '';
        var reOpenbatch;
        var forcePrintLimit = 1;

        var doprint = 0;
        var weightlock = false;
        var lastWeight = 0;
        var lastWeightData = 0;

        function allOff() {
            socket.emit("alloff",true);
        }

        function redOn() {
            socket.emit("redon",true);
        }

        function greenOn() {
            socket.emit("greenon",true);
        }

        function yellowOn() {
            socket.emit("yellowon",true);
        }

        $rootScope.$on('forceprint', function (evt,data) {
            if($scope.Model.selectedBatch.Status==1) {
		$scope.manual();
            }
            else if($scope.Model.selectedBatch.Status==2)
            {
                alertPopup("Error",'Batch is on Hold');
            }
        });

        $rootScope.$on('printdone', function (evt,data) {
            weightlock = false;
            if($scope.Model.selectedBatch!= undefined && $scope.Model.selectedBatch.Status==1) {
                $http.get('api/getShippers?batchNo='+$scope.Model.selectedBatch.NB_ID+'&temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        $scope.Model.shipperData = data.data;
                        $http.get('/api/getSingleBatchRecords?batch_id='+$scope.Model.selectedBatch.NB_ID+'&temp='+Math.random())
                        .success(function(data) {
                            $scope.Model.selectedBatch = data.data[0];
                            $scope.Model.selectedBatch.BoxCompleted = $scope.Model.shipperData.length;
                            var bCompleted = parseInt($scope.Model.selectedBatch.BoxCompleted);
                            if(bCompleted == 5){
                                $http.get('/api/getMinMax?batchno='+$scope.Model.selectedBatch.NB_ID+'&halfweight='+$scope.Model.selectedBatch.HalfCarton+'&temp='+Math.random())
                                    .success(function(data) {
                                        if(data.error == false){
                                            $scope.Model.selectedBatch.MinShipperWt = parseFloat(data.minShipperWeight);
                                            $scope.Model.selectedBatch.MaxShipperWt = parseFloat(data.maxShipperWeight);
                                            $scope.Model.cMin = $scope.Model.selectedBatch.MinShipperWt.toFixed(3);
                                            $scope.Model.cMax = $scope.Model.selectedBatch.MaxShipperWt.toFixed(3);
                                            $scope.$apply();
                                        }
                                    })
                                    .error(function(data) {
                                        console.log(data);
                                    });
                            }
                        })
                        .error(function(data) {
                            
                        });
                    }
                })
                .error(function(data) {
                    console.log(data);
                });    
            }
        });

        $rootScope.$on('onWeightChange', function (evt,data) {
            if($location.absUrl() == 'http://localhost:8081/#/dashboard')
            {
                if(weightlock == true)
                    return;
                
                var weight = data;
                $scope.Model.cWeight = weight;
                lastWeightData = weight;
                lastWeight = parseFloat(data);

                if($scope.Model.weightScreen_hidden == true)
                  return;
                
                  if($scope.Model.selectedBatch!= undefined && $scope.Model.selectedBatch.Status==1){
                    var bCompleted = parseInt($scope.Model.selectedBatch.BoxCompleted);
                    if(bCompleted < 5){
                        yellowOn();
                        if(lastWeight <= 0){
                            doprint = 0;
                        }
                        return;
                    }
                }

                if(lastWeight<(parseFloat($scope.Model.cMin)*0.10).toFixed(3)){
                    doprint = 0;
                }

                if(lastWeight>=parseFloat($scope.Model.cMin) && lastWeight <= parseFloat($scope.Model.cMax))
                {
                    greenOn();
                }
                else if((lastWeight>(parseFloat($scope.Model.cMin) - (parseFloat($scope.Model.cMin)*0.10).toFixed(3))) && lastWeight<parseFloat($scope.Model.cMin))
                {
                    yellowOn();
                }
                else if(lastWeight>parseFloat($scope.Model.cMax)){
                    redOn();
                }
            }
        });

        function forceP(){

            // //DummyStart
            // doprint = 0;
            // weightlock = false;
            // lastWeightData = $scope.Model.manualweightenter;
            // lastWeight = $scope.Model.manualweightenter;;
            // //DummyEnd

            if($scope.Model.selectedBatch.Status==2)
            {
                alertPopup("Error",'Batch is on Hold');
                return;
            }

            var bCompleted = parseInt($scope.Model.selectedBatch.BoxCompleted);

            if(parseInt($scope.Model.selectedBatch.BoxQty) == bCompleted)
            {
                alertPopup("Error",'Shipper Count Completed As Per Batch. You can weight more 5 Shipper after this.');
            }

            if((parseInt($scope.Model.selectedBatch.BoxQty)+5) == bCompleted)
            {
                alertPopup("Error",'Shipper Count Completed As Per Batch.And you have weight more 5 shippers.');
                return;
            }

            if(bCompleted < 5){
                return;
            }

            if($scope.Model.selectedBatch!= undefined && $scope.Model.selectedBatch.Status==1){
                var limit = parseInt(forcePrintLimit)/100;
                if((lastWeight>=(parseFloat($scope.Model.cMin) - (parseFloat($scope.Model.cMin)*limit).toFixed(3))) && (lastWeight<=(parseFloat($scope.Model.cMax) + parseFloat((parseFloat($scope.Model.cMax)*limit).toFixed(3))))){
                    if(doprint == 0){
                        weightlock = true;
                        doprint = 1;
                        greenOn();
                        $timeout(function () {
                            $http({
                                url: '/api/printweight',
                                method: "POST",
                                data: {"weight":lastWeightData,"forceprint":false,"format":$scope.Model.selectedBatch.PrintFormat,"data":$scope.Model.selectedBatch,"wn":window.localStorage.getItem('wn'),"shift":window.localStorage.getItem('shift')}
                            })
                            .then(function(response) {
                                
                            },
                            function(response) { // optional
                                
                            });
                        },500);
                    }
                }
                else{
                    if(doprint == 0){
                        weightlock = true;
                        doprint = 1;
                        greenOn();
                        $timeout(function () {
                            $http({
                                url: '/api/printweight',
                                method: "POST",
                                data: {"weight":lastWeightData,"forceprint":true,"format":$scope.Model.selectedBatch.PrintFormat,"data":$scope.Model.selectedBatch,"wn":window.localStorage.getItem('wn'),"shift":window.localStorage.getItem('shift')}
                            })
                            .then(function(response) {
                                
                            },
                            function(response) { // optional
                                
                            });
                            // socket.emit("printweight",{"weight":lastWeightData,"forceprint":true,"format":$scope.Model.selectedBatch.PrintFormat,"data":$scope.Model.selectedBatch,"wn":window.localStorage.getItem('wn'),"shift":window.localStorage.getItem('shift')});
                        },500);
                    }
                }
            }
        }

        $scope.manual = function () {
            // //DummyStart
            // doprint = 0;
            // weightlock = false;
            // lastWeightData = $scope.Model.manualweightenter;
            // lastWeight = $scope.Model.manualweightenter;;
            // //DummyEnd

            var bCompleted = parseInt($scope.Model.selectedBatch.BoxCompleted);
            if($scope.Model.selectedBatch!= undefined && $scope.Model.selectedBatch.Status==1){

                if(parseInt($scope.Model.selectedBatch.BoxQty) == bCompleted)
                {
                    alertPopup("Error",'Shipper Count Completed As Per Batch. You can weight more 5 Shipper after this.');
                }

                if((parseInt($scope.Model.selectedBatch.BoxQty)+5) == bCompleted)
                {
                    alertPopup("Error",'Shipper Count Completed As Per Batch.And you have weight more 5 shippers.');
                    return;
                }
                
                if(bCompleted < 5){
                    if(doprint == 0){
                        if(lastWeight > 0.050){
                            weightlock = true;
                            doprint = 1;
                            greenOn();
                            $timeout(function () {
                                $http({
                                    url: '/api/printweight',
                                    method: "POST",
                                    data: {"weight":lastWeightData,"forceprint":false,"format":$scope.Model.selectedBatch.PrintFormat,"data":$scope.Model.selectedBatch,"wn":window.localStorage.getItem('wn'),"shift":window.localStorage.getItem('shift')}
                                })
                                .then(function(response) {
                                        
                                    },
                                    function(response) { // optional
                                        
                                    });
                                    //socket.emit("printweight",);
                            },500);
                        }
                    }
                }
                else{
                    var limit = parseInt(forcePrintLimit)/100;
                    if((lastWeight>=(parseFloat($scope.Model.cMin) - (parseFloat($scope.Model.cMin)*limit).toFixed(3))) && (lastWeight<=(parseFloat($scope.Model.cMax) + parseFloat((parseFloat($scope.Model.cMax)*limit).toFixed(3))))){
                        if(doprint == 0){
                            weightlock = true;
                            doprint = 1;
                            greenOn();
                            $timeout(function () {
                                //socket.emit("printweight",{"weight":lastWeightData,"forceprint":false,"format":$scope.Model.selectedBatch.PrintFormat,"data":$scope.Model.selectedBatch,"wn":window.localStorage.getItem('wn'),"shift":window.localStorage.getItem('shift')});
                                $http({
                                    url: '/api/printweight',
                                    method: "POST",
                                    data: {"weight":lastWeightData,"forceprint":false,"format":$scope.Model.selectedBatch.PrintFormat,"data":$scope.Model.selectedBatch,"wn":window.localStorage.getItem('wn'),"shift":window.localStorage.getItem('shift')}
                                })
                                .then(function(response) {
                                        
                                    },
                                    function(response) { // optional
                                        
                                    });
                            },500);
                        }
                    }
                    else{
                        if(lastWeight > 0.050){
                            alert("Weight Out of Range");
                        }
                    }
                }
            }
        }

        $scope.manualweightEntered = function(){
            if($rootScope.username != 'admin')
                return;
            $scope.manual();
        }

        $scope.deleteShipper = function(item){
            if($scope.Model.showManualEntryFields == false)
            return;
            if($rootScope.username != 'admin')
                return;
            //if(item.ID == $scope.Model.shipperData[0].ID)
            var result = confirm("Want to delete?");
                if (result) {
                    $http({
                        url: '/api/deleteweight',
                        method: "POST",
                        data: {'id':item.ID}
                    })
                        .then(function(response) {
                                $http.get('api/getShippers?batchNo='+$scope.Model.selectedBatch.NB_ID+'&temp='+Math.random())
                                .success(function(data) {
                                    if(data.error == false){
                                        $scope.Model.shipperData = data.data;
                                        $scope.Model.selectedBatch.BoxCompleted = $scope.Model.shipperData.length;
                                    }
                                })
                                .error(function(data) {
                                    console.log(data);
                                }); 
                            },
                            function(response) { // optional
                                
                            });     
                }
        }

        $scope.changeData = function(item,index){
            if($scope.Model.showManualEntryFields == false)
            return;
            if($rootScope.username != 'admin')
                return;
            var title = "";
            if(index == 1)
                title = 'Enter Operator for Shipper No. '+item.ShipperNo;
            if(index == 2)
                title = 'Enter Shift for Shipper No. '+item.ShipperNo;
            if(index == 3)
                title = 'Enter Date(dd-mm-yyyy) for Shipper No. '+item.ShipperNo;
            if(index == 4)
                title = 'Enter Weight for Shipper No. '+item.ShipperNo;

            var confirm = $mdDialog.prompt()
            .title('')
            .textContent(title)
            .placeholder('')
            .ariaLabel('')
            .initialValue('')
            .ok('Update')
            .cancel('Cancel');
            $mdDialog.show(confirm).then(function(result) {

                
                $http({
                    url: '/api/updatedata',
                    method: "POST",
                    data: { 'data':result,'id':item.ID,'index':index}
                })
                    .then(function(response) {
                            $http.get('api/getShippers?batchNo='+$scope.Model.selectedBatch.NB_ID+'&temp='+Math.random())
                            .success(function(data) {
                                if(data.error == false){
                                    $scope.Model.shipperData = data.data;
                                    $scope.Model.selectedBatch.BoxCompleted = $scope.Model.shipperData.length;
                                }
                            })
                            .error(function(data) {
                                console.log(data);
                            }); 
                        },
                        function(response) { // optional
                            
                        });
                
            }, function() {

            });
        }
        
        $scope.Model.networkip = '0.0.0.0';
        function getNetworkIP() {
            $http.get('/api/getip?temp='+Math.random())
                .success(function(data) {
                    $scope.Model.networkip = data[0];
                })
                .error(function(data) {
                    $scope.Model.networkip = "0.0.0.0";
                });
        }

        $scope.setDateTime = function () {
            var date_time = $scope.Model.datetimeset;
            $http({
                url: '/api/updatedate',
                method: "POST",
                data: { 'date_time':date_time}
            })
                .then(function(response) {
                        // success
                        alertPopup("Admin Settings",'Date & Time set successfully...');
                        $scope.Model.datetimeset = '';
                    },
                    function(response) { // optional
                        // failed
                        alertPopup("Admin Settings",'Something went wrong...');
                    });
        }

        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        $scope.Model.showManualEntryFields = false;
        $scope.hiddenKey = function(){
            $scope.Model.hiddenKeyCount++;
            if($scope.Model.hiddenKeyCount > 20)
            {
                $scope.Model.showManualEntryFields = true;
            }
        }

        $scope.Model.showAdminView = false;
        $scope.$on('$viewContentLoaded', function() {

            $scope.Model.hiddenKeyCount = 0;
            $scope.Model.showManualEntryFields = false;

            var url = $location.absUrl().split('?')[0];
            if(url.toString().indexOf('localhost') == -1)
                $scope.Model.showAdminView = true;
            

            $rootScope.wn = '';
            $scope.Model.changepass = false;
            getNetworkIP();
            $rootScope.wn = window.localStorage.getItem('wn');
            $rootScope.username = window.localStorage.getItem('username'); 

            allOff();
            var batch = JSON.parse(window.localStorage.getItem('reloadDashboard'));
            //console.log(batch);
            window.localStorage.removeItem('reloadDashboard');
            if(batch != null){
                $scope.Model.selectedBatch = batch;
                $scope.Model.cMin = batch.MinShipperWt.toFixed(3);
                $scope.Model.cMax = batch.MaxShipperWt.toFixed(3);
                var data = JSON.parse(window.localStorage.getItem('login_info'));
                window.localStorage.setItem('username',data.data.Username);
                window.localStorage.setItem('firstname',data.data.FirstName);
                window.localStorage.setItem('lastname',data.data.LastName);
                window.localStorage.setItem('password',data.data.Password);
                window.localStorage.setItem('id',data.data.ID);
                $scope.Model.fullnameStr = data.data.FirstName.toUpperCase()+' '+data.data.LastName.toUpperCase();
                $scope.Model.shortnameStr = data.data.FirstName.charAt(0).toUpperCase()+''+data.data.LastName.charAt(0).toUpperCase();
                $scope.Model.isLogin = true;
                showMainBoard();
                $http.get('api/getShippers?batchNo='+$scope.Model.selectedBatch.NB_ID+'&temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        $scope.Model.shipperData = data.data;
                        $scope.Model.selectedBatch.BoxCompleted = $scope.Model.shipperData.length;
                        //console.log($scope.Model.shipperData);
                    }
                })
                .error(function(data) {
                    console.log(data);
                }); 
            }
            else{
                $scope.Model.lockScreen_hidden = true;
                $scope.Model.loginScreen_hidden = true;
                $scope.Model.registerScreen_hidden = true;
                $scope.Model.weightScreen_hidden = true;
                $scope.Model.batchInfoScreen_hidden = true;
                $scope.Model.masterInfoScreen_hidden = true;
                $scope.Model.formNewBatch_hidden = true;
                $scope.Model.formMaster_hidden = true;
                $scope.Model.adminSettings_hidden = true;

                $rootScope.wn = "";
                $rootScope.username = ""; 
                GoLogin();
            }
            $http.get('/api/getGeneralSettins?temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        adminPassword = data.data.AdminPassword;
                        forcePrintLimit = parseInt(data.data.Extra1);
                        $scope.Model.systemID = data.data.Extra2;
                    }
                })
                .error(function(data) {

                });

        });
        
        $scope.adminSettings = function () {
            GoLock('Enter Admin Password','AdminSettings');
        }

        $scope.changeSystemID = function () {
            if($scope.Model.systemID.length == 0)
            {
                alertPopup("System Settings","System ID should not be empty.");
                return;
            }

            $http.get('/api/updategeneralsettingssystemid?systemid='+$scope.Model.systemID+'&temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        alertPopup("System Settings",data.message);
                    }
                })
                .error(function(data) {
                });
        }

        $scope.changeAdminPassword = function () {
            if($scope.Model.adminPassword.length == 0)
            {
                alertPopup("Admin Settings","Admin Password should not be empty.");
                return;
            }

            $http.get('/api/updategeneralsettings?adminpassword='+$scope.Model.adminPassword+'&temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        adminPassword = $scope.Model.adminPassword;
                        alertPopup("Admin Settings",data.message);
                    }
                })
                .error(function(data) {
                });
        }

        $scope.updateUser = function (item) {

            if(item.Username.length == 0)
            {
                alertPopup("Admin Settings","Username should not be empty.");
                return;
            }

            if(item.Username.toUpperCase()  == 'ADMIN')
            {
                alertPopup("Admin Settings","Username should not be Admin.");
                return;
            }

            if(item.Password.length == 0)
            {
                alertPopup("Admin Settings","Password should not be empty.");
                return;
            }

            $http.get('/api/updateuser?username='+item.Username+'&password='+item.Password+'&id='+item.ID+'&temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        alertPopup("Admin Settings",data.message);
                    }
                })
                .error(function(data) {

                });
        }

        $scope.updateLabel2x2 = function (data) {
            for(var i=0;i<data.length;i++){
                var item = data[i];
                $http.get('/api/updateLabel2x2?FieldName='+item.FieldName+'&LeftPos='+item.LeftPos+'&TopPos='+item.TopPos+'&FontSize='+item.FontSize+'&IsActive='+item.IsActive+'&id='+item.Id+'&temp='+Math.random())
                    .success(function(data) {
                        $scope.view22(data.cmd);
                    })
                    .error(function(data) {
                    });

                // if(i== data.length-1){
                    
                // }
            }
        }

        $scope.updateLabel4x3 = function (data) {

            for(var i=0;i<data.length;i++){
                var item = data[i];
                $http.get('/api/updateLabel4x3?FieldName='+item.FieldName+'&LeftPos='+item.LeftPos+'&TopPos='+item.TopPos+'&FontSize='+item.FontSize+'&IsActive='+item.IsActive+'&id='+item.Id+'&temp='+Math.random())
                    .success(function(data) {
                        $scope.view43(data.cmd);
                    })
                    .error(function(data) {

                    });

                // if(i== data.length-1){
                    
                // }
            }
        }

        $scope.deleteUser = function (item) {

            $http.get('/api/deleteuser?username='+item.Username+'&password='+item.Password+'&id='+item.ID+'&temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        alertPopup("Admin Settings",data.message);
                        $scope.Model.users = [];
                        $http.get('/api/getusers?temp='+Math.random())
                            .success(function(data) {
                                if(data.error == false){
                                    $scope.Model.users = data.data;
                                }
                            })
                            .error(function(data) {

                            });
                    }
                })
                .error(function(data) {

                });
        }

        function RunAdminSettings() {

            $scope.Model.users = [];

            $scope.Model.adminPassword = adminPassword;
            $http.get('/api/getusers?temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        $scope.Model.users = data.data;
                    }
                })
                .error(function(data) {

                });

            $scope.Model.LabelSmall = [];
            $http.get('/api/getLabelSettings2x2?temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        $scope.Model.LabelSmall = data.data;
                    }
                })
                .error(function(data) {

            });

            $scope.Model.LabelBig = [];
            $http.get('/api/getLabelSettings4x3?temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        $scope.Model.LabelBig = data.data;
                    }
                })
                .error(function(data) {

                });

            $http.get('/api/getGeneralSettins?temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        var cs = data.data;
                        if(cs.isBuzzerOn == 0){
                            $scope.Model.buzzer = "OFF";
                        }
                        else{
                            $scope.Model.buzzer = "ON";
                        }

                        if(cs.isTimerOFF == 1){
                            $scope.Model.timeformat = "OFF";
                        }
                        else{
                            $scope.Model.timeformat = "ON";
                        }
                    }
                })
                .error(function(data) {

                });

            $scope.Model.lockScreen_hidden = true;
            $scope.Model.loginScreen_hidden = true;
            $scope.Model.registerScreen_hidden = true;
            $scope.Model.weightScreen_hidden = true;
            $scope.Model.batchInfoScreen_hidden = true;
            $scope.Model.masterInfoScreen_hidden = true;
            $scope.Model.formNewBatch_hidden = true;
            $scope.Model.formMaster_hidden = true;
            $scope.Model.adminSettings_hidden = false;
        }

        $scope.buzzerOnOff = function () {

            var buzzerValue = 1;
            if($scope.Model.buzzer == "OFF"){
                buzzerValue = 1;
                $scope.Model.buzzer = "ON";
            }
            else{
                buzzerValue = 0;
                $scope.Model.buzzer = "OFF";
            }
            
            $http.get('/api/buzzerstatusupdate?data='+buzzerValue+'&temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        alertPopup("Buzzer settings changed ...");
                    }
                })
                .error(function(data) {

                });
        }

        $scope.timeStatusUpdate = function () {

            var timeformat = 1;
            if($scope.Model.timeformat == "ON"){
                timeformat = 1;
                $scope.Model.timeformat = "OFF";
            }
            else{
                timeformat = 0;
                $scope.Model.timeformat = "ON";
            }

            $http.get('/api/timestatusupdate?data='+timeformat+'&temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        alertPopup("Time settings changed ...");
                    }
                })
                .error(function(data) {

                });
        }
        
        $scope.forcePrinter = function () {
            GoLock('Enter Password','ForcePrint');
        }

        GoLock = function (msg,redirectScreen) {
            $scope.Model.isLogin = false;
            $scope.Model.lockPassword = '';
            window.localStorage.setItem('lockredirectScreen',redirectScreen);
            $scope.Model.lockmsg = msg;
            $scope.Model.lockScreen_hidden = false;
            $scope.Model.loginScreen_hidden = true;
            $scope.Model.registerScreen_hidden = true;
            $scope.Model.weightScreen_hidden = true;
            $scope.Model.batchInfoScreen_hidden = true;
            $scope.Model.masterInfoScreen_hidden = true;
            $scope.Model.formNewBatch_hidden = true;
            $scope.Model.formMaster_hidden = true;
            $scope.Model.adminSettings_hidden = true;
        }
        
        $scope.screenLock = function () {
            $scope.Model.isLogin = false;
            if($scope.Model.weightScreen_hidden == false){
                $scope.Model.lockPassword = '';
                window.localStorage.setItem('lockredirectScreen','WeightScreen');
                $scope.Model.lockmsg = "Enter your password to retrieve your session";
                $scope.Model.lockScreen_hidden = false;
                $scope.Model.loginScreen_hidden = true;
                $scope.Model.registerScreen_hidden = true;
                $scope.Model.weightScreen_hidden = false;
                $scope.Model.batchInfoScreen_hidden = true;
                $scope.Model.masterInfoScreen_hidden = true;
                $scope.Model.formNewBatch_hidden = true;
                $scope.Model.formMaster_hidden = true;
                $scope.Model.adminSettings_hidden = true;
            }
            else
                GoLock('Enter your password to retrieve your session','Dashboard');
        }

        function alertPopup(title,desc) {
            $scope.Model.title = title;
            $scope.Model.description = desc;
            $timeout(function() {
                jQuery('#myModal').modal();
            });
        }

        $scope.openLock = function () {

            if($scope.Model.lockPassword == undefined || $scope.Model.lockPassword.length == 0)
            {
                alertPopup("Screen Lock",'Please enter password');
                return;
            }

            var screen = window.localStorage.getItem('lockredirectScreen');
            //window.localStorage.removeItem('lockredirectScreen');
            if(screen == 'Dashboard'){
                if($scope.Model.lockPassword != window.localStorage.getItem('password'))
                {
                    alertPopup("Screen Lock",'Please enter valid password');
                    $scope.Model.lockPassword = '';
                    return;
                }
                window.localStorage.removeItem('lockredirectScreen');
                GoDashboard();
                $scope.Model.isLogin = true;
            }
            else if(screen == 'Registration'){

                if($scope.Model.lockPassword != adminPassword)
                {
                    alertPopup("Screen Lock",'Please enter valid password');
                    $scope.Model.lockPassword = '';
                    return;
                }
                window.localStorage.removeItem('lockredirectScreen');
                GoRegistration();
                $scope.Model.isLogin = true;
            }
            else if(screen == 'AdminSettings'){

                 var username = window.localStorage.getItem('username');
                 var pass = window.localStorage.getItem('password');

                 if($scope.Model.lockPassword == (adminPassword+"0000") && username == 'admin'){

                        $scope.Model.changepass = true;
                        window.localStorage.removeItem('lockredirectScreen');
                        RunAdminSettings();
                        $scope.Model.isLogin = true;


                 }
                 else if($scope.Model.lockPassword == adminPassword){

                        window.localStorage.removeItem('lockredirectScreen');
                        RunAdminSettings();
                        $scope.Model.isLogin = true;

                 }
                 
                 else{
                    alertPopup("Screen Lock",'Please enter valid password');
                    $scope.Model.lockPassword = '';
                    return;
                }
                 
            }
            else if(screen == 'CreateNewBatch'){
                if($scope.Model.lockPassword != window.localStorage.getItem('password'))
                {
                    alertPopup("Screen Lock",'Please enter valid password');
                    $scope.Model.lockPassword = '';
                    return;
                }
                window.localStorage.removeItem('lockredirectScreen');
                CreateNewBatch();
                $scope.Model.isLogin = true;
            }
            else if(screen == 'MasterRecord'){


                var username = window.localStorage.getItem('username');
                var pass = window.localStorage.getItem('password');
                
                if($scope.Model.lockPassword == pass && username == 'admin'){
                
                         window.localStorage.removeItem('lockredirectScreen');
                         MasterRecord();
                         $scope.Model.isLogin = true;
                
                }
                else{
                     alertPopup("Error",'Please enter valid password');
                     $scope.Model.lockPassword = '';
                     return;
                }
                
                //  if($scope.Model.lockPassword != window.localStorage.getItem('password'))
                //  {
                //      alertPopup("Screen Lock",'Please enter valid password');
                //      $scope.Model.lockPassword = '';
                //      return;
                //  }
                
            }
            else if(screen == 'WeightScreen'){
                if($scope.Model.lockPassword != window.localStorage.getItem('password'))
                {
                    alertPopup("Screen Lock",'Please enter valid password');
                    $scope.Model.lockPassword = '';
                    return;
                }
                window.localStorage.removeItem('lockredirectScreen');
                showMainBoard();
                $scope.Model.isLogin = true;
            }
            else if(screen == 'ForcePrint'){
                if($scope.Model.lockPassword != window.localStorage.getItem('password'))
                {
                    alertPopup("Screen Lock",'Please enter valid password');
                    $scope.Model.lockPassword = '';
                    return;
                }
                window.localStorage.removeItem('lockredirectScreen');
                showMainBoard();
                forceP();
                $scope.Model.isLogin = true;
            }
            else if(screen == 'ReOpen'){
                if($scope.Model.lockPassword != adminPassword)
                {
                    alertPopup("Screen Lock",'Please enter valid password');
                    $scope.Model.lockPassword = '';
                    return;
                }
                window.localStorage.removeItem('lockredirectScreen');
                var id = reOpenbatch.NB_ID;
                $http.get('/api/updateBatchStatus?batchID='+id+'&status=1&batch_no='+reOpenbatch.MfgNo+'&temp='+Math.random())
                    .success(function(data) {
                        $scope.batchFilter(-1);
                        $scope.Model.isLogin = true;
                    })
                    .error(function(data) {

                    });
            }
        }

        GoLogin = function () {
            $scope.Model.username = '';
            $scope.Model.password = '';
            $scope.Model.workername = ''
            $scope.Model.lockScreen_hidden = true;
            $scope.Model.loginScreen_hidden = false;
            $scope.Model.registerScreen_hidden = true;
            $scope.Model.weightScreen_hidden = true;
            $scope.Model.batchInfoScreen_hidden = true;
            $scope.Model.masterInfoScreen_hidden = true;
            $scope.Model.formNewBatch_hidden = true;
            $scope.Model.formMaster_hidden = true;
            $scope.Model.adminSettings_hidden = true;
            $location.path('/dashboard');
        }

        GoRegistration = function () {
            $scope.Model.isLogin = false;
            $scope.Model.username_reg = '';
            $scope.Model.password_reg = '';
            $scope.Model.repassword = '';
            $scope.Model.firstname = '';
            $scope.Model.lastname = '';
            $scope.Model.lockScreen_hidden = true;
            $scope.Model.loginScreen_hidden = true;
            $scope.Model.registerScreen_hidden = false;
            $scope.Model.weightScreen_hidden = true;
            $scope.Model.batchInfoScreen_hidden = true;
            $scope.Model.masterInfoScreen_hidden = true;
            $scope.Model.formNewBatch_hidden = true;
            $scope.Model.formMaster_hidden = true;
            $scope.Model.adminSettings_hidden = true;
            $location.path('/dashboard');
        }

        GoDashboard = function () {
            $scope.Model.lockScreen_hidden = true;
            $scope.Model.loginScreen_hidden = true;
            $scope.Model.registerScreen_hidden = true;
            $scope.Model.weightScreen_hidden = true;
            $scope.Model.batchInfoScreen_hidden = true;
            $scope.Model.masterInfoScreen_hidden = true;
            $scope.Model.formNewBatch_hidden = true;
            $scope.Model.formMaster_hidden = true;
            $scope.Model.adminSettings_hidden = true;
            $location.path('/dashboard');
        }

        $scope.clearLogin = function () {
            $scope.Model.username = '';
            $scope.Model.password = '';
            $scope.Model.workername = '';
            $scope.shift_time = '';
            $scope.Model.username_reg = '';
            $scope.Model.password_reg = '';
            $scope.Model.repassword = '';
            $scope.Model.firstname = '';
            $scope.Model.lastname = '';
        }

        var wn = '';
        $scope.login = function () {
            if($scope.Model.username == undefined || $scope.Model.username.length == 0)
            {
                alertPopup("Login",'Please enter username');
                return;
            }
            if($scope.Model.password == undefined || $scope.Model.password.length == 0)
            {
                alertPopup("Login",'Please enter password');
                return;
            }
            if($scope.shift_time == undefined || $scope.shift_time.length == 0)
            {
                alertPopup("Login",'Please select shift time');
                return;
            }

            if($scope.Model.workername == undefined || $scope.Model.workername.length == 0)
            {
                alertPopup("Login",'Please enter worker name');
                return;
            }

            if($scope.Model.workername.length < 3 )
            {
                alertPopup("Login",'Please enter valid operator name');
                return;
            }

            window.localStorage.setItem('shift',$scope.shift_time);
            wn = $scope.Model.workername;
            window.localStorage.setItem('wn',wn);
            $rootScope.wn = window.localStorage.getItem('wn');
            window.localStorage.setItem('pushbutton',true);
            $http.get('/api/checkLogin?username='+$scope.Model.username+'&password='+$scope.Model.password+'&lastname='+$scope.Model.lastname+'&workername='+$scope.Model.workername+'&temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        $scope.batchFilter(-1);
                        window.localStorage.setItem('login_info',JSON.stringify(data));
                        window.localStorage.setItem('username',data.data.Username);
                        window.localStorage.setItem('firstname',data.data.FirstName);
                        window.localStorage.setItem('lastname',data.data.LastName);
                        window.localStorage.setItem('password',data.data.Password);
                        window.localStorage.setItem('id',data.data.ID);
                        $rootScope.username = data.data.Username;
                        $scope.Model.fullnameStr = data.data.FirstName.toUpperCase()+' '+data.data.LastName.toUpperCase();
                        $scope.Model.shortnameStr = data.data.FirstName.charAt(0).toUpperCase()+''+data.data.LastName.charAt(0).toUpperCase();
                        $scope.Model.isLogin = true;
                    }
                    else{
                        alertPopup("Error",data.message);
                    }
                })
                .error(function(data) {
                    console.log(data);
                });

        }

        $scope.registration = function () {

            if($scope.Model.firstname == undefined || $scope.Model.firstname.length == 0)
            {
                alertPopup("Registration",'Please enter first name');
                return;
            }
            if($scope.Model.lastname == undefined || $scope.Model.lastname.length == 0)
            {
                alertPopup("Registration",'Please enter last name');
                return;
            }
            if($scope.Model.username_reg == undefined || $scope.Model.username_reg.length == 0)
            {
                alertPopup("Registration",'Please enter username');
                return;
            }
            if($scope.Model.username_reg.toUpperCase() == 'ADMIN')
            {
                alertPopup("Registration",'Username should not be Admin');
                return;
            }
            if($scope.Model.password_reg == undefined || $scope.Model.password_reg.length == 0)
            {
                alertPopup("Registration",'Please enter password');
                return;
            }
            if($scope.Model.repassword == undefined || $scope.Model.repassword.length == 0)
            {
                alertPopup("Registration",'Please enter repeat password');
                return;
            }
            if($scope.Model.repassword != $scope.Model.password_reg)
            {
                alertPopup("Registration",'Please enter valid repeat password');
                return;
            }

            $http.get('/api/addNewUser?username='+$scope.Model.username_reg+'&firstname='+$scope.Model.firstname+'&lastname='+$scope.Model.lastname+'&password='+$scope.Model.password_reg+'&temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        alertPopup("Registration",data.message);
                        GoLogin();
                    }
                    else{
                        alertPopup("Error",data.message);
                    }
                })
                .error(function(data) {
                    console.log(data);
                });
        }

        $scope.goRegistration = function () {
            GoLock('Enter Admin Password','Registration');
        }

        $scope.goLogin = function () {
            GoLogin();
        }
        
        $scope.logout = function () {
            window.localStorage.removeItem('username');
            window.localStorage.removeItem('firstname');
            window.localStorage.removeItem('lastname');
            window.localStorage.removeItem('password');
            window.localStorage.removeItem('id');
            window.localStorage.removeItem('login_info');
            window.localStorage.removeItem('reloadDashboard');
            $scope.Model.fullnameStr = '';
            $scope.Model.shortnameStr = '';
            $scope.Model.isLogin = false;
            $rootScope.wn = "";
            $rootScope.username = ""; 
            $scope.shift_time = undefined;
            GoLogin();
        }
        
        $scope.dashboard = function () {
            GoDashboard();
        }

        // Batch Data

        $scope.duplicate = function() {
            $http.get('/api/getDuplicateRecord?filename='+$scope.Model.selectedBatch.NB_ID+'&record='+$scope.Model.dupShipper+'&batch='+JSON.stringify($scope.Model.selectedBatch)+'&temp='+Math.random())
                .success(function(data) {
                    $scope.Model.dupShipper = "";
                })
            .error(function(data) {
                console.log(data);
            });
            
        }

        $scope.batchFilter = function (status) {
            $scope.Model.all_batch_records = [];
            $http.get('/api/getAllBatchRecords?temp='+Math.random())
            .success(function(data) {
                if(data.error == false){
                    //console.log(data.data);
                    var totalOnHold = 0;
                    var totalCompleted = 0;
                    if(data.data.length>0)
                        $scope.Model.totalAll = data.data.length;
                    else
                        $scope.Model.totalAll = 0;
                    for(var i =0;i<data.data.length;i++){
                        if(status == -1)
                            $scope.Model.all_batch_records.push(data.data[i]);
                        else if(data.data[i].Status == status){
                            $scope.Model.all_batch_records.push(data.data[i]);
                        }

                        if(data.data[i].Status == 2){
                            totalOnHold++;
                        }
                        if(data.data[i].Status == 3){
                            totalCompleted++;
                        }
                    }
                    $scope.Model.totalOnHold = totalOnHold;
                    $scope.Model.totalCompleted = totalCompleted;
                }
                else{
                    $scope.Model.totalOnHold = 0;
                    $scope.Model.totalCompleted = 0;
                    $scope.Model.totalAll = 0;
                }
            })
            .error(function(data) {

            });

            $scope.Model.reopenHide = false;
            $scope.Model.lockScreen_hidden = true;
            $scope.Model.loginScreen_hidden = true;
            $scope.Model.registerScreen_hidden = true;
            $scope.Model.weightScreen_hidden = true;
            $scope.Model.batchInfoScreen_hidden = false;
            $scope.Model.masterInfoScreen_hidden = true;
            $scope.Model.formNewBatch_hidden = true;
            $scope.Model.formMaster_hidden = true;
            $scope.Model.adminSettings_hidden = true;
        }

        $scope.changeBatchStatus = function (batch) {

            if(batch.Status == 3)
            {
                if($rootScope.username == 'admin')
                {
                    var id = batch.NB_ID;
                    $http.get('/api/updateBatchStatus?batchID='+id+'&status='+batch.Status+'&batch_no='+batch.MfgNo+'&temp='+Math.random())
                        .success(function(data) {
                            $scope.batchFilter(-1);
                        })
                        .error(function(data) {
        
                        });
                }
                else{
                    alert("Please contact Admin");
                }
            }
            else{
                var id = batch.NB_ID;
                $http.get('/api/updateBatchStatus?batchID='+id+'&status='+batch.Status+'&batch_no='+batch.MfgNo+'&temp='+Math.random())
                    .success(function(data) {
                        $scope.batchFilter(-1);
                    })
                    .error(function(data) {

                    });
            }
            
        }

        $scope.reopenBatch = function (batch) {
                reOpenbatch = batch;
                GoLock('Enter Admin Password','ReOpen');
        }
        
        $scope.editBatch = function (batch) {
            if($rootScope.username == 'admin')
            {
                $scope.Model.csvHide = false;
                window.localStorage.setItem('batch_id',batch.NB_ID);
                window.localStorage.setItem('editbatch',JSON.stringify(batch));
                $scope.createNewBatch();
            }
            else{
                alert("Please Contact Admin");
            }
        }

        $scope.createNewBatch = function () {
            GoLock('Enter Password','CreateNewBatch');
        }

        function CreateNewBatch() {

            $scope.Model.productsInMaster = [];
            $http.get('/api/getProductRecords?temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        for(var i =0;i<data.data.length;i++){
                            $scope.Model.productsInMaster.push(data.data[i]);
                        }
                        
                        if(window.localStorage.getItem('editbatch') != undefined){
                            var obj_batch = JSON.parse(window.localStorage.getItem('editbatch'));
            
                            window.localStorage.removeItem('editbatch');
                            $scope.Model.editedBatchNumber = obj_batch.NB_ID;
            
                            for(var i=0;i<$scope.Model.productsInMaster.length;i++)
                            {
                                if(obj_batch.MasterNumber == $scope.Model.productsInMaster[i].MasterNumber)
                                {
                                    $scope.Model.product = JSON.stringify($scope.Model.productsInMaster[i]);
                                }
                            }
                            
                            $scope.Model.mfgNo = obj_batch.MfgNo;
                            $scope.Model.mfgLicNo = obj_batch.MfgLicNo;
                            $scope.Model.mfgDate = obj_batch.MfgDate;
                            $scope.Model.expDate = obj_batch.ExpDate;
                            $scope.Model.minShipperWt = obj_batch.MinShipperWt;
                            $scope.Model.maxShipperWt = obj_batch.MaxShipperWt;
                            $scope.Model.halfCarton = obj_batch.HalfCarton;
                            $scope.Model.boxQty = obj_batch.BoxQty;
                            $scope.Model.shipperNo = parseInt(obj_batch.ShipperNo);
                            $scope.Model.countryName = obj_batch.CountryName;
                            if(obj_batch.Print == 0)
                            {
                                $scope.print_option = 'NO';
                                obj_batch.PrintCount = 0;
                            }
                            else
                                $scope.print_option = 'YES';
                            
                            $scope.Model.printcopy = obj_batch.PrintCount;
                        }
                        else{
                            $scope.Model.product = '';
                            $scope.Model.editedBatchNumber = -1;
                            $scope.Model.mfgNo = '';
                            $scope.Model.mfgLicNo = '';
                            $scope.Model.mfgDate = '';
                            $scope.Model.expDate = '';
                            $scope.Model.minShipperWt = '';
                            $scope.Model.maxShipperWt = '';
                            $scope.Model.halfCarton = '';
                            $scope.Model.boxQty = '';
                            $scope.Model.shipperNo = 1;
                            $scope.Model.countryName = '';
                            $scope.print_option = '';
                            $scope.Model.printcopy = 1;
                        }
            
                        $scope.Model.lockScreen_hidden = true;
                        $scope.Model.loginScreen_hidden = true;
                        $scope.Model.registerScreen_hidden = true;
                        $scope.Model.weightScreen_hidden = true;
                        $scope.Model.batchInfoScreen_hidden = true;
                        $scope.Model.masterInfoScreen_hidden = true;
                        $scope.Model.formNewBatch_hidden = false;
                        $scope.Model.formMaster_hidden = true;
                        $scope.Model.adminSettings_hidden = true;

                    }
                })
                .error(function(data) {

                });
        }

        $scope.saveBatch = function () {

            
            if($scope.Model.product == undefined || $scope.Model.product.length == 0)
            {
                alertPopup("New Batch",'Please select product');
                return;
            }

            $scope.Model.product = JSON.parse($scope.Model.product.toString());
            
            if($scope.Model.mfgNo == undefined || $scope.Model.mfgNo.length==0)
            {
                alertPopup("New Batch",'Please enter batch No');
                return;
            }

            if($scope.Model.mfgLicNo == undefined || $scope.Model.mfgLicNo.length==0)
            {
                alertPopup("New Batch",'Please enter Mfg Lic No');
                return;
            }

            if($scope.Model.mfgDate == undefined || $scope.Model.mfgDate.length==0)
            {
                alertPopup("New Batch",'Please enter Mfg Date');
                return;
            }

            if($scope.Model.expDate == undefined || $scope.Model.expDate.length==0)
            {
                alertPopup("New Batch",'Please enter Expiry Date');
                return;
            }

            if($scope.Model.halfCarton == undefined || $scope.Model.halfCarton.length==0)
            {
                alertPopup("New Batch",'Please enter half carton weight.');
                return;
            }

            if($scope.Model.boxQty == undefined || $scope.Model.boxQty.length==0)
            {
                alertPopup("New Batch",'Please enter total Box Quantity');
                return;
            }

            if($scope.Model.shipperNo == undefined || $scope.Model.shipperNo.length==0)
            {
                //alertPopup("New Batch",'Please enter Shipper No');
                // return;
                $scope.Model.shipperNo = 1;
            }

            if($scope.Model.countryName == undefined || $scope.Model.countryName.length==0)
            {
                alertPopup("New Batch",'Please enter country name');
                return;
            }

            if($scope.print_option == undefined || $scope.print_option.length==0)
            {
                alertPopup("New Batch",'Please select Print Option');
                return;
            }

            if($scope.Model.printcopy == undefined || $scope.Model.printcopy.length==0)
            {
                alertPopup("New Batch",'Please enter Print Copy No.');
                return;
            }

            var masterNumber = $scope.Model.product.MasterNumber;
            var productName = $scope.Model.product.ProductName;
            var mfgNo = $scope.Model.mfgNo;
            var mfgLicNo = $scope.Model.mfgLicNo;
            var mfgDate = $scope.Model.mfgDate;
            var expDate = $scope.Model.expDate;
            var minShipperWt = "0.000";
            var maxShipperWt = "0.000";
            if($scope.Model.editedBatchNumber == -1){
                minShipperWt = "0.000";
                maxShipperWt = "0.000";
            }
            else{
                minShipperWt = $scope.Model.minShipperWt.toFixed(3);
                maxShipperWt = $scope.Model.maxShipperWt.toFixed(3);
            }
            var boxQty = $scope.Model.boxQty;
            var shipperNo = $scope.Model.shipperNo;
            var countryName = $scope.Model.countryName;
            var username = $scope.Model.workername;
            var halfCarton = $scope.Model.halfCarton.toFixed(3);

            var print_copy = $scope.Model.printcopy;

            var print_option = 1;
            if($scope.print_option == 'NO')
            {
                print_option = 0;
                print_copy = 0;
            }
                
            $http.get('/api/addNewBatch?masterNumber='+masterNumber
                +'&productName='+productName+'&mfgNo='+mfgNo
                +'&mfgLicNo='+mfgLicNo
                +'&mfgDate='+mfgDate
                +'&expDate='+expDate+'&minShipperWt='+minShipperWt+'&maxShipperWt='
                +maxShipperWt+'&boxQty='+boxQty+'&shipperNo='+shipperNo
                +'&countryName='+countryName
                +'&username='+username
                +'&halfcarton='+halfCarton
                +'&print_option='+print_option
                +'&print_copy='+print_copy
                +'&editbatchnumber='+$scope.Model.editedBatchNumber
                +'&temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        $scope.batchFilter(-1);
                    }
                    else{
                        alert(data.message);
                        alertPopup("Error",data.message);
                    }
                })
                .error(function(data) {
                    console.log(data);
                });


        }

        $scope.testprint = function (batch) {

            
            $http({
                url: '/api/testprint',
                method: "POST",
                data: {"weight":"0.000","format":batch.PrintFormat,"data":batch,"PrintCopies":batch.PrintCount,"wn":window.localStorage.getItem('wn'),"shift":window.localStorage.getItem('shift')}
            })
                .then(function(response) {
                        
                    },
                    function(response) { // optional
                        
                    });
            
        }

        $scope.reportPrint = function (batch) {
            // var ip = $scope.Model.systemip;
            // if(ip == undefined || ip.length == 0)
            // {
            //     alertPopup("Error",'Please enter system ip');
            //     return;
            // }

            // $http.get('http://'+ip+':8081/api/records?filename='+batch.NB_ID+'&temp='+Math.random())
            $http.get('/api/records?filename='+batch.NB_ID+'&temp='+Math.random())
                .success(function(data) {
                    var array = data.data;
                    var stringMaster = "";

                    var count = 1;
                    var W = [];

                    if(array.length>0){
                        for(var i=0;i<array.length;i++){
                            var count = i+1;
                            var d = array[i];
                            // var inner = array[i+1].split(",");
                            // var string = "<div class='thinD' style='border-top: none'> <label class='rightB' style='font-size:8px;width: 8%;float: left;height: 15px'>"+count+"</label> <label class='rightB' style='font-size:8px;width: 20%;float: left;height: 15px'>"+inner[7]+"</label> <label class='rightB' style='font-size:8px;width: 10%;float: left;height: 15px'>"+inner[9]+"</label> <label class='rightB' style='font-size:8px;width: 30%;float: left;height: 15px'>"+inner[8]+"</label> <label style='font-size:8px;width: 15%;float: left;padding: 3px;;height: 15px'>"+inner[6]+" (Kg.)</label> </div>";
                            var string = "<div class='thinD' style='border-top: none'> <label class='rightB' style='font-size:8px;width: 8%;float: left;height: 15px'>"+count+"</label> <label class='rightB' style='font-size:8px;width: 20%;float: left;height: 15px'>"+d.DateTime+"</label> <label class='rightB' style='font-size:8px;width: 10%;float: left;height: 15px'>"+d.ShiftTime+"</label> <label class='rightB' style='font-size:8px;width: 30%;float: left;height: 15px'>"+d.User+"</label> <label style='font-size:8px;width: 15%;float: left;padding: 3px;;height: 15px'>"+d.Weight+" (Kg.)</label> </div>";
                            stringMaster += string;
                            var val = d.Weight.toString().replace('*','');
                            if(val != NaN)
                                W.push(parseFloat(val));
                            else
                                W.push(0);
                            count++;
                        }
                    }
                    // console.log(W);
                    // alert(Math.max.apply(null, W));
                    // alert(Math.min.apply(null, W));

                    var height = count*20;
                    var htmltext = "<html><style type='text/css'> div { padding: 3px; border-color: black; border-style: solid; background: transparent; } .thin { border-width: thin; } .thinD{ border-width: thin; width: 48%;height:auto;float: left } .rightB{ padding: 3px; border-right: solid 1px #444444;height: 20px; } .pagebreak { page-break-before: always; }</style><body onload='window.print()'><p><div class='thin'> <label style='font-size: 14px;text-align: center;width: 100%;display: block'>CADILA PHARMACEUTICALS LTD.</label> <label style='font-size: 12px;text-align: center;width: 100%;display: block'>BATCH WISE SHIPPER WEIGHING REPORT</label></div><div class='thin' style='height: 30px;border-top: none'> <label style='font-size: 10px;text-align: left;width: 66%;display: block;float: left;border-right: solid 1px #444444;height: 30px'>PRODUCT NAME : {{batch.ProductName}}</label> <label style='font-size: 10px;text-align: center;width: 33%;display: block;float: left'>BATCH NO : {{batch.MfgNo}}</label></div><div class='thin' style='height: 30px;border-top: none'> <label style='font-size: 10px;text-align: left;width: 33%;display: block;float: left;border-right: solid 1px #444444;height: 30px'>PACKING ORDER NO. :                  </label> <label style='font-size: 10px;text-align: center;width: 33%;display: block;float: left;border-right: solid 1px #444444;height: 30px'>MFG.DATE : {{batch.MfgDate}}</label> <label style='font-size: 10px;text-align: center;width: 33%;display: block;float: left'>EXP.DATE : {{batch.ExpDate}}</label></div><br><div style='height:auto;border: none'> <label style='font-size: 12px;text-align: center;width: 100%;display: block;float: left'>WEIGHING DETAILS</label> <p style='font-size: 10px'> <br> <br> <br> WEIGH ALL THE PACKED CARRUGATED BOX AS PER RESPECTIVE SOP. <br> <br> BALANCE IDENTIFICATION NO : "+$scope.Model.systemID+" WEIGHT OF FILLED CARTON :______________ <br> <br> AVERAGE GROSS WEIGHT OF BOX NO. 1 TO 5 :_____________Kg. <br> <br> WEIGHT DONE BY :___________________________________________ <br> <br> CHECKED BY DATE :__________________________________(PACKING) <br> <br> VERIFIED BY DATE :__________________________________(QA) <br> <br> PACKED BOX WEIGHT LIMIT : {{batch.MinShipperWt}} Kg. TO {{batch.MaxShipperWt}} Kg. </p></div><div style='background-color: transparent;border: none;height:"+height+"px;width: 100%'> <div class='thinD'> <label class='rightB' style='font-size:8px;font-weight: bold;width: 8%;float: left;height: 20px'>BOX NO</label> <label class='rightB' style='font-size:8px;;font-weight: bold;width: 20%;float: left;height: 20'>DATE</label> <label class='rightB' style='font-size:8px;;font-weight: bold;width: 10%;float: left;height: 20px'>SHIFT</label> <label class='rightB' style='font-size:8px;;font-weight: bold;width: 30%;float: left;height: 20px'>DONE BY</label> <label style='font-size:8px;width: 15%;;font-weight: bold;float: left;padding: 3px;;height: 20px'>WEIGHT (Kg.)</label> </div> <div class='thinD' style='border-left: none'> <label class='rightB' style='font-size:8px;font-weight: bold;width: 8%;float: left;height: 20px'>BOX NO</label> <label class='rightB' style='font-size:8px;font-weight: bold;width: 20%;float: left;height: 20px'>DATE</label> <label class='rightB' style='font-size:8px;font-weight: bold;width: 10%;float: left;height: 20px'>SHIFT</label> <label class='rightB' style='font-size:8px;font-weight: bold;width: 30%;float: left;height: 20px'>DONE BY</label> <label style='font-size:8px;width: 15%;font-weight: bold;float: left;padding: 3px;height: 20px'>WEIGHT (Kg.)</label> </div> {{loop}}</div><div class='pagebreak' style='border: none'></div><div style='border: none'><label style='font-size: 12px;text-align: center;width: 100%;height: 30px;display: block;float: left'>WEIGHING SUMMARY</label><p style='height: 10px'></p><div style='height: 20px;border-width: thin;width: 96%'> <label style='padding: 3px;font-size: 10px;text-align: left;width: 48%;display: block;float: left;border-right: solid 1px #444444;height: 15px'>MINIMUM WEIGHT</label> <label style='padding: 3px;font-size: 10px;text-align: left;width: 48%;display: block;float: left'>{{batch.MinShipperWt}} (Kg.)</label></div><div style='height: 20px;border-width: thin;border-top: none;width: 96%'> <label style='padding: 3px;font-size: 10px;text-align: left;width: 48%;display: block;float: left;border-right: solid 1px #444444;height: 15px'>MAXIMUM WEIGHT</label> <label style='padding: 3px;font-size: 10px;text-align: left;width: 48%;display: block;float: left'>{{batch.MaxShipperWt}} (Kg.)</label></div><div style='height: 20px;border-width: thin;border-top: none;width: 96%'> <label style='padding: 3px;font-size: 10px;text-align: left;width: 48%;display: block;float: left;border-right: solid 1px #444444;height: 15px'>WEIGHT OF LOOSE BOX & QUANTITY</label> <label style='padding: 3px;font-size: 10px;text-align: left;width: 48%;display: block;float: left'>NOS</label></div><div style='height: 20px;border-width: thin;border-top: none;width: 96%'> <label style='padding: 3px;font-size: 10px;text-align: left;width: 48%;display: block;float: left;border-right: solid 1px #444444;height: 15px'>CHECKED BY (PACKING)</label> <label style='padding: 3px;font-size: 10px;text-align: left;width: 48%;display: block;float: left'>VERIFIED BY (QA)</label></div><div style='height: 20px;border-width: thin;border-top: none;width: 96%'> <label style='padding: 3px;font-size: 10px;text-align: left;width: 48%;display: block;float: left;border-right: solid 1px #444444;height: 15px'></label> <label style='padding: 3px;font-size: 10px;text-align: left;width: 48%;display: block;float: left'></label></div><div style='height: 20px;border-width: thin;border-top: none;width: 96%'> <label style='padding: 3px;font-size: 10px;text-align: left;width: 48%;display: block;float: left;border-right: solid 1px #444444;height: 15px'>SIGN & DATE</label> <label style='padding: 3px;font-size: 10px;text-align: left;width: 48%;display: block;float: left'>SIGN & DATE</label></div><p style='height: 10px'></p><div style='height: 20px;border-width: thin;width: 96%'> <label style='padding: 3px;font-size: 10px;text-align: left;width: 48%;display: block;float: left;height: 15px'>REMARKS :</label> <label style='padding: 3px;font-size: 10px;text-align: left;width: 48%;display: block;float: left'></label></div><div style='height: 50px;border-width: thin;border-top: none;width: 96%'><label style='padding: 3px;font-size: 10px;text-align: left;width: 48%;display: block;float: left;height: 95px'>If any box weight is out of limits, then physically verify the box as per respective SOP and record it.</label> <label style='padding: 3px;font-size: 10px;text-align: left;width: 48%;display: block;float: left'></label></div></div></body></html>";

                    htmltext = htmltext.replace('{{batch.MfgNo}}',batch.MfgNo);
                    htmltext = htmltext.replace('{{batch.ProductName}}',batch.ProductName);
                    htmltext = htmltext.replace('{{batch.MfgDate}}',batch.MfgDate);
                    htmltext = htmltext.replace('{{batch.ExpDate}}',batch.ExpDate);
                    htmltext = htmltext.replace('{{batch.MinShipperWt}}',batch.MinShipperWt);
                    htmltext = htmltext.replace('{{batch.MaxShipperWt}}',batch.MaxShipperWt);
                    htmltext = htmltext.replace('{{batch.MinShipperWt}}',Math.min.apply(null,W));
                    htmltext = htmltext.replace('{{batch.MaxShipperWt}}',Math.max.apply(null,W));
                    htmltext = htmltext.replace('{{loop}}',stringMaster);

                    //console.log(stringMaster);
                    var popupWinindow = window.open('', '_blank', 'width=600,height=700,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
                    popupWinindow.document.open();
                    popupWinindow.document.write(htmltext);
                    popupWinindow.document.close();

                    //console.log(stringMaster);
                    //$window.open("http://"+ip+":8081/api/getcsv?filename="+batch.NB_ID+"&session="+Math.random());
                })
                .error(function(data) {
                    console.log(data);
                });
        }

        // End Batch Data
        
       
        //Master Records

        $scope.editMaster = function (master) {
            window.localStorage.setItem('editmaster',JSON.stringify(master));
            $scope.masterRecord();
        }

        $scope.masterRecord = function () {
            GoLock('Enter Password','MasterRecord');
        }

        $scope.recordMasterList = function () {

            $scope.Model.all_master_records = [];
            $http.get('/api/getAllMasterRecords?temp='+Math.random())
                .success(function(data) {
                    if(data.error == false){
                        for(var i =0;i<data.data.length;i++){
                            $scope.Model.all_master_records.push(data.data[i]);
                        }
                    }
                })
                .error(function(data) {

                });

            $scope.Model.lockScreen_hidden = true;
            $scope.Model.loginScreen_hidden = true;
            $scope.Model.registerScreen_hidden = true;
            $scope.Model.weightScreen_hidden = true;
            $scope.Model.batchInfoScreen_hidden = true;
            $scope.Model.masterInfoScreen_hidden = false;
            $scope.Model.formNewBatch_hidden = true;
            $scope.Model.formMaster_hidden = true;
            $scope.Model.adminSettings_hidden = true;
        }

        function MasterRecord() {

            $scope.Model.printSettings = ["4x3","2x2"];
            $scope.Model.masterRecords = [];

            if(window.localStorage.getItem('editmaster') != undefined){
                var obj_master = JSON.parse(window.localStorage.getItem('editmaster'));
                window.localStorage.removeItem('editmaster');
                $scope.Model.editedMasterNumber = obj_master.ID;
                if(obj_master.PrintFormat == 1)
                    $scope.print_format = "4x3"
                else
                    $scope.print_format = "2x2"
                $scope.Model.newMasterNumber = obj_master.MasterNumber;
                $scope.Model.masterProductName = obj_master.ProductName;
                $scope.Model.masterFullName1 = obj_master.FullName1;
                $scope.Model.masterFullName2 = obj_master.FullName2;
                $scope.Model.masterFullName3 = obj_master.FullName3;
                $scope.Model.masterBoxDetails = obj_master.BoxDetails;
                $scope.Model.masterRemarks1 = obj_master.Remarks1;
                $scope.Model.masterRemarks2 = obj_master.Remarks2;
                $scope.Model.masterRemarks3 = obj_master.Remarks3;
            }
            else{
                $scope.Model.newNumber = true;
                $scope.Model.editedMasterNumber = -1;

                $scope.master = '';
                $scope.print_format = ''
                $scope.Model.newMasterNumber = '';
                $scope.Model.masterProductName = '';
                $scope.Model.masterFullName1 = '';
                $scope.Model.masterFullName2 = '';
                $scope.Model.masterFullName3 = '';
                $scope.Model.masterBoxDetails = '';
                $scope.Model.masterRemarks1 = '';
                $scope.Model.masterRemarks2 = '';
                $scope.Model.masterRemarks3 = '';
            }

            

            $scope.Model.lockScreen_hidden = true;
            $scope.Model.loginScreen_hidden = true;
            $scope.Model.registerScreen_hidden = true;
            $scope.Model.weightScreen_hidden = true;
            $scope.Model.batchInfoScreen_hidden = true;
            $scope.Model.masterInfoScreen_hidden = true;
            $scope.Model.formNewBatch_hidden = true;
            $scope.Model.formMaster_hidden = false;
            $scope.Model.adminSettings_hidden = true;
        }

        $scope.deleteMaster = function(master){

            $http({
                url: '/api/deletemaster',
                method: "POST",
                data: {'id':master.ID}
            })
                .then(function(response) {
                        $scope.recordMasterList();
                    },
                    function(response) { // optional
                        
                    });

        }

        $scope.saveMaster = function () {

            if($scope.Model.editedMasterNumber == -1){
                if($scope.Model.newMasterNumber == undefined || $scope.Model.newMasterNumber.length==0)
                {
                    alertPopup("Master Record",'Please select master record or Add new record');
                    return;
                }

                if($scope.Model.masterProductName == undefined || $scope.Model.masterProductName.length==0)
                {
                    alertPopup("Master Record",'Please enter product name');
                    return;
                }

                if($scope.print_format == undefined)
                {
                    alertPopup("Master Record",'Please select print format');
                    return;
                }

                var newMasterNumber = $scope.Model.newMasterNumber.toUpperCase();
                var productName = $scope.Model.masterProductName;
                var fullName1 = $scope.Model.masterFullName1;
                var fullName2 = $scope.Model.masterFullName2;
                var fullName3 = $scope.Model.masterFullName3;
                var boxDetails = $scope.Model.masterBoxDetails;
                var remarks1 = $scope.Model.masterRemarks1;
                var remarks2 = $scope.Model.masterRemarks2;
                var remarks3 = $scope.Model.masterRemarks3;
                var value = 1;
                if($scope.print_format != undefined){
                    var value = 1;
                    if($scope.print_format == '2x2')
                        value = 2;
                    else
                        value = 1;
                }

                $http.get('/api/addNewMasterRecord?newMasterNumber='+newMasterNumber+'&productName='+productName+'&fullName1='+fullName1+'&fullName2='+fullName2+'&fullName3='+fullName3+'&boxDetails='+boxDetails+'&remarks1='+remarks1+'&remarks2='+remarks2+'&remarks3='+remarks3+'&print_format='+value+'&temp='+Math.random())
                    .success(function(data) {
                        if(data.error == false && data.master_record_error == false){
                            // alertPopup("Master Record",data.message);
                            $scope.recordMasterList();
                        }
                        else if(data.master_record_error == true){
                            alertPopup("Error",data.message);
                        }
                        else{
                            alertPopup("Error",data.message);
                        }
                    })
                    .error(function(data) {
                        console.log(data);
                    });
            }
            else {

                if($scope.Model.newMasterNumber == undefined || $scope.Model.newMasterNumber.length==0)
                {
                    alertPopup("Master Record",'Please select master record or Add new record');
                    return;
                }

                if($scope.Model.masterProductName == undefined || $scope.Model.masterProductName.length==0)
                {
                    alertPopup("Master Record",'Please enter product name');
                    return;
                }

                if($scope.print_format == undefined)
                {
                    alertPopup("Master Record",'Please select print format');
                    return;
                }

                var master_id = $scope.Model.editedMasterNumber;
                var newMasterNumber = $scope.Model.newMasterNumber.toUpperCase();
                var productName = $scope.Model.masterProductName;
                var fullName1 = $scope.Model.masterFullName1;
                var fullName2 = $scope.Model.masterFullName2;
                var fullName3 = $scope.Model.masterFullName3;
                var boxDetails = $scope.Model.masterBoxDetails;
                var remarks1 = $scope.Model.masterRemarks1;
                var remarks2 = $scope.Model.masterRemarks2;
                var remarks3 = $scope.Model.masterRemarks3;
                var value = 1;
                if($scope.print_format != undefined){
                    var value = 1;
                    if($scope.print_format == '2x2')
                        value = 2;
                    else
                        value = 1;
                }

                $http.get('/api/updateMasterRecord?newMasterNumber='+newMasterNumber+'&master_id='+master_id+'&productName='+productName+'&fullName1='+fullName1+'&fullName2='+fullName2+'&fullName3='+fullName3+'&boxDetails='+boxDetails+'&remarks1='+remarks1+'&remarks2='+remarks2+'&remarks3='+remarks3+'&print_format='+value+'&temp='+Math.random())
                    .success(function(data) {
                        if(data.error == false && data.master_record_error == false){
                            //alertPopup("Master Record",data.message);
                            $scope.recordMasterList();
                        }
                        else if(data.master_record_error == true){
                            alertPopup("Error",data.message);
                        }
                        else{
                            alertPopup("Error",data.message);
                        }
                    })
                    .error(function(data) {
                        console.log(data);
                    });
            }

        }
        //End Master Records

        $scope.changeBatchComplete = function (batch) {
            var id = batch.NB_ID;
            $http.get('/api/updateBatchStatusComplete?batchID='+id+'&temp='+Math.random())
                .success(function(data) {
                    $scope.batchFilter(-1);
                })
                .error(function(data) {

                });
        }

        $scope.viewBatch = function (batch) {
            doprint = 1;
            weightlock = false;
            $scope.Model.selectedBatch = batch;
            window.localStorage.setItem('reloadDashboard',JSON.stringify(batch));
            showMainBoard();
            location.reload();
            //$location.path('/home');
        }

        function showMainBoard() {
            $scope.Model.lockScreen_hidden = true;
            $scope.Model.loginScreen_hidden = true;
            $scope.Model.registerScreen_hidden = true;
            $scope.Model.weightScreen_hidden = false;
            $scope.Model.batchInfoScreen_hidden = true;
            $scope.Model.masterInfoScreen_hidden = true;
            $scope.Model.formNewBatch_hidden = true;
            $scope.Model.formMaster_hidden = true;
            $scope.Model.adminSettings_hidden = true;
        }

        // RunAdminSettings();

        $scope.view22 = function(cmd){
            console.log(cmd);
            $http({
            method: 'GET',
            url: 'http://api.labelary.com/v1/printers/8dpmm/labels/2x2/0/'+cmd,
            responseType: 'arraybuffer'
            }).then(function(response) {
            var str = _arrayBufferToBase64(response.data);
            $scope.image2 = str;
            // str is base64 encoded.
            }, function(response) {
                //console.error('error in getting static img.');
            });
        }

        $scope.view43 = function(cmd){
            console.log(cmd);
            $http({
            method: 'GET',
            url: 'http://api.labelary.com/v1/printers/8dpmm/labels/4x3/0/'+cmd,
            responseType: 'arraybuffer'
            }).then(function(response) {
            var str = _arrayBufferToBase64(response.data);
            $scope.image = str;
            // str is base64 encoded.
            }, function(response) {
                //console.error('error in getting static img.');
            });
        }

        function _arrayBufferToBase64(buffer) {
            var binary = '';
            var bytes = new Uint8Array(buffer);
            var len = bytes.byteLength;
            for (var i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
        }

    })
