angular.module('starter.modeA', [])

    .directive('ngRightClick', function($parse) {
        return function(scope, element, attrs) {
            var fn = $parse(attrs.ngRightClick);
            element.bind('contextmenu', function(event) {
                scope.$apply(function() {
                    event.preventDefault();
                    fn(scope, {$event:event});
                });
            });
        };
    })

    .directive('ngConfirmClick', [
        function(){
            return {
                link: function (scope, element, attr) {
                    //var msg = attr.ngConfirmClick || "Are you sure?";
                    var clickAction = attr.confirmedClick;
                    element.bind('click',function (event) {

                        var retVal = window.prompt("Enter Admin Password : ", "");
                        if(retVal === scope.User.passwordHash)
                        {
                            scope.$eval(clickAction);
                        }
                        else{
                            alert("Wrong Password");
                        }
                        // if ( window.confirm(msg) ) {
                        //
                        //     var retVal = ;
                        //
                        //     scope.$eval(clickAction)
                        // }
                    });
                }
            };
        }])


    .factory('socket', function ($rootScope) {
        // var socket = io.connect('http://localhost:8080');
        // return {
        //     on: function (eventName, callback) {
        //         socket.on(eventName, function () {
        //             var args = arguments;
        //             $rootScope.$apply(function () {
        //                 callback.apply(socket, args);
        //             });
        //         });
        //     },
        //     emit: function (eventName, data, callback) {
        //         socket.emit(eventName, data, function () {
        //             var args = arguments;
        //             $rootScope.$apply(function () {
        //                 if (callback) {
        //                     callback.apply(socket, args);
        //                 }
        //             });
        //         })
        //     }
        // };
    })

    .directive('keyshortcut', ['$rootScope',function(rootScope) {
        return {
            link: function ($scope, $element, $attrs,$emit) {
                $element.bind("keydown", function (event) {
                    rootScope.$broadcast('keydown',event.which);
                });

                // socket.on('message', function (data) {
                //     //rootScope.$broadcast('onWeightChange',data);
                // });

                var ws = new WebSocket("ws://localhost:8080/");

                ws.onopen = function(){
                    console.log("Socket has been opened!");
                };

                ws.onmessage = function(message) {
                    // console.log(message);
                    var json = JSON.parse(message.data);
                    if (json.type === 'm') {
                        var mydata = json.data.utf8Data;
                        mydata = mydata.replace('{','');
                        mydata = mydata.replace('}','');
                        mydata = mydata.split(':');
                        //console.log(mydata);
                        rootScope.$broadcast("data",mydata);
                    }
                };
            }
        };
    }
    ])

    .directive('focusMe', function($timeout, $parse) {
        return {
            //scope: true,   // optionally create a child scope
            link: function(scope, element, attrs) {
                var model = $parse(attrs.focusMe);
                scope.$watch(model, function(value) {
                    if(value === true) {
                        $timeout(function() {
                            element[0].focus();
                        });
                    }
                });
                // on blur event:
                element.bind('blur', function() {
                    scope.$apply(model.assign(scope, false));
                });
            }
        };
    })

    .factory('focus', function($timeout, $window) {
        return function(id) {
            $timeout(function() {
                var element = $window.document.getElementById(id);
                if(element)
                    element.focus();
            });
        };
    })

    .controller('mode_a_ctrl',function(focus,$interval,$timeout,$rootScope,$scope, $http,$window,$mdDialog,$location,$q,$sce,$filter) {

        $scope.Model = {

        };

        $scope.Model.data = [];

        var edited_obj = null;

        $scope.$on('$viewContentLoaded', function() {
            edited_obj = null;
            $scope.reset();
            $scope.reload();

            $scope.User = $rootScope.User;
        });

        $scope.reload = function () {
            edited_obj = null;
            // $http.get('/api/findAll?table=mode_a_types&temp='+Math.random())
            //     .then(function(response) {
            //         $scope.Model.data = response.data.data;
            //     });
            $http({
                url: '/api/findBy',
                method: "POST",
                data: {'criteria':{'active':1},'table':'mode_a_types'}
            })
                .then(function(response) {
                        console.log(response.data);
                        $scope.Model.data = response.data.data;
                    },
                    function(response) { // optional

                    });
        }

        $scope.reset = function () {
            $scope.Model.brgType = "";
            $scope.Model.designation = "";
            $scope.Model.zf_wind_article_no = "";

            $scope.Model.od_size = "";
            $scope.Model.od_min = "";
            $scope.Model.od_max = "";

            $scope.Model.ow_size = "";
            $scope.Model.ow_min = "";
            $scope.Model.ow_max = "";

            $scope.Model.oe_size = "";
            $scope.Model.oe_min = "";
            $scope.Model.oe_max = "";

            $scope.Model.bore_size = "";
            $scope.Model.bore_min = "";
            $scope.Model.bore_max = "";

            $scope.Model.iw_size = "";
            $scope.Model.iw_min = "";
            $scope.Model.iw_max = "";

            $scope.Model.ie_size = "";
            $scope.Model.ie_min = "";
            $scope.Model.ie_max = "";

            $scope.Model.tw_size = "";
            $scope.Model.tw_min = "";
            $scope.Model.tw_max = "";

            $scope.Model.crc_size = "";
            $scope.Model.crc_min = "";
            $scope.Model.crc_max = "";

            edited_obj = null;
        }

        function dbdt() {
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

        $scope.save = function () {

            var obj = {"active":1,

                "brgType":$scope.Model.brgType,
                "designation":$scope.Model.designation,
                "zf_wind_article_no":$scope.Model.zf_wind_article_no,

                "od_size":$scope.Model.od_size,
                "od_min":$scope.Model.od_min,
                "od_max":$scope.Model.od_max,

                "ow_size":$scope.Model.ow_size,
                "ow_min":$scope.Model.ow_min,
                "ow_max":$scope.Model.ow_max,

                "oe_size":$scope.Model.oe_size,
                "oe_min":$scope.Model.oe_min,
                "oe_max":$scope.Model.oe_max,

                "bore_size":$scope.Model.bore_size,
                "bore_min":$scope.Model.bore_min,
                "bore_max":$scope.Model.bore_max,

                "iw_size":$scope.Model.iw_size,
                "iw_min":$scope.Model.iw_min,
                "iw_max":$scope.Model.iw_max,

                "ie_size":$scope.Model.ie_size,
                "ie_min":$scope.Model.ie_min,
                "ie_max":$scope.Model.ie_max,

                "tw_size":$scope.Model.tw_size,
                "tw_min":$scope.Model.tw_min,
                "tw_max":$scope.Model.tw_max,

                "crc_size":$scope.Model.crc_size,
                "crc_min":$scope.Model.crc_min,
                "crc_max":$scope.Model.crc_max
            };

            if(edited_obj == null)
            {
                obj.createdAt = dbdt();
                obj.updatedAt = '';

                $http({
                    url: '/api/insert',
                    method: "POST",
                    data: {'obj':obj , 'table':'mode_a_types'}
                })
                    .then(function(response) {
                            $scope.reset();
                            $scope.reload();
                            $scope.Model.isExpand = false;
                        },
                        function(response) { // optional
                            alert("Something Went Wrong!");
                        });
            }
            else{

                obj.updatedAt = dbdt();
                $http({
                    url: '/api/update',
                    method: "POST",
                    data: {'criteria':{'id':edited_obj.id},'obj':obj , 'table':'mode_a_types'}
                })
                    .then(function(response) {
                            edited_obj = null;
                            $scope.reset();
                            $scope.reload();
                            $scope.Model.isExpand = false;
                        },
                        function(response) { // optional
                            alert("Something Went Wrong!");
                        });
            }

        }

        $scope.select = function (item) {
            $rootScope.brgtype = item;
            $location.url('/mode_a_dashboard');
        }

        $scope.edit = function (item) {

            if($rootScope.User.roleId == 1)
                return;

            $scope.Model.isExpand = true;
            edited_obj = item;
            $scope.Model.brgType = edited_obj.brgType;
            $scope.Model.designation = edited_obj.designation;
            $scope.Model.zf_wind_article_no = edited_obj.zf_wind_article_no;

            $scope.Model.od_size = edited_obj.od_size;
            $scope.Model.od_min = edited_obj.od_min;
            $scope.Model.od_max = edited_obj.od_max;

            $scope.Model.ow_size = edited_obj.ow_size;
            $scope.Model.ow_min = edited_obj.ow_min;
            $scope.Model.ow_max = edited_obj.ow_max;

            $scope.Model.oe_size = edited_obj.oe_size;
            $scope.Model.oe_min = edited_obj.oe_min;
            $scope.Model.oe_max = edited_obj.oe_max;

            $scope.Model.bore_size = edited_obj.bore_size;
            $scope.Model.bore_min = edited_obj.bore_min;
            $scope.Model.bore_max = edited_obj.bore_max;

            $scope.Model.iw_size = edited_obj.iw_size;
            $scope.Model.iw_min = edited_obj.iw_min;
            $scope.Model.iw_max = edited_obj.iw_max;

            $scope.Model.ie_size = edited_obj.ie_size;
            $scope.Model.ie_min = edited_obj.ie_min;
            $scope.Model.ie_max = edited_obj.ie_max;

            $scope.Model.tw_size = edited_obj.tw_size;
            $scope.Model.tw_min = edited_obj.tw_min;
            $scope.Model.tw_max = edited_obj.tw_max;

            $scope.Model.crc_size = edited_obj.crc_size;
            $scope.Model.crc_min = edited_obj.crc_min;
            $scope.Model.crc_max = edited_obj.crc_max;
        }

        $scope.delete = function (item) {

            if($rootScope.User.roleId == 1)
                return;

            /*$http({
             url: '/api/delete',
             method: "POST",
             data: {'obj':{'id':item.id} , 'table':'mode_a_types'}
             })
             .then(function(response) {
             edited_obj = null;
             console.log(response);
             $scope.reset();
             $scope.reload();
             },
             function(response) { // optional
             alert("Something Went Wrong!");
             });*/

            $http({
                url: '/api/update',
                method: "POST",
                data: {'criteria':{'id':item.id},'obj':{'active':0} , 'table':'mode_a_types'}
            })
                .then(function(response) {
                        edited_obj = null;
                        $scope.reset();
                        $scope.reload();
                    },
                    function(response) { // optional
                        alert("Something Went Wrong!");
                    });
        }

    })

    .controller('mode_a_dashboard_ctrl',function(focus,$interval,$timeout,$rootScope,$scope, $http,$window,$mdDialog,$location,$q,$sce,$filter) {


        $scope.$on('$destroy', function() {
            event1();
            event2();
        });

        var event1 = $rootScope.$on('data', function (evt,data) {

            //console.log(data[0]);
            if(data[0].toString() === $scope.Model.twProbe1){
                if($rootScope.modeltitle == mt[11])
                {
                    if($scope.Model.twMode1){
                        $rootScope.manualprob_readonly = true;
                        $rootScope.manualprob = data[1];
                    }
                    else
                        $rootScope.manualprob_readonly = false;
                }
                //console.log(data[1]);
            }
            if(data[0].toString() === $scope.Model.twProbe2){
                if($rootScope.modeltitle == mt[12])
                {
                    if($scope.Model.twMode2){
                        $rootScope.manualprob_readonly = true;
                        $rootScope.manualprob = data[1];
                    }
                    else
                        $rootScope.manualprob_readonly = false;
                }
                //console.log(data[1]);
            }
            if(data[0].toString() === $scope.Model.twProbe3){
                if($rootScope.modeltitle == mt[13])
                {
                    if($scope.Model.twMode3){
                        $rootScope.manualprob_readonly = true;
                        $rootScope.manualprob = data[1];
                    }
                    else
                        $rootScope.manualprob_readonly = false;
                }
                //console.log(data[1]);
            }
            if(data[0].toString() === $scope.Model.crcProbe){
                if($rootScope.modeltitle == mt[10])
                {
                    if($scope.Model.crcMode)
                    {
                        $rootScope.manualprob_readonly = true;
                        $rootScope.manualprob = data[1];
                    }
                    else
                        $rootScope.manualprob_readonly = false;
                }
                //console.log(data[1]);
            }
            if(data[0].toString() === $scope.Model.orodProbe){
                if($rootScope.modeltitle == mt[2])
                {
                    if($scope.Model.orodMode)
                    {
                        $rootScope.manualprob_readonly = true;
                        $rootScope.manualprob = data[1];
                    }
                    else
                        $rootScope.manualprob_readonly = false;
                }
                //console.log(data[1]);
            }
            if(data[0].toString() === $scope.Model.orwProbe){
                if($rootScope.modeltitle == mt[3])
                {
                    if($scope.Model.orwMode)
                    {
                        $rootScope.manualprob_readonly = true;
                        $rootScope.manualprob = data[1];
                    }
                    else
                        $rootScope.manualprob_readonly = false;
                }
                //console.log(data[1]);
            }
            if(data[0].toString() === $scope.Model.irbProbe){
                if($rootScope.modeltitle == mt[7])
                {
                    if($scope.Model.irbMode)
                    {
                        $rootScope.manualprob_readonly = true;
                        $rootScope.manualprob = data[1];
                    }
                    else
                        $rootScope.manualprob_readonly = false;
                }
                //console.log(data[1]);
            }
            if(data[0].toString() === $scope.Model.irwProbe){
                if($rootScope.modeltitle == mt[8])
                {
                    if($scope.Model.irwMode)
                    {
                        $rootScope.manualprob_readonly = true;
                        $rootScope.manualprob = data[1];
                    }
                    else
                        $rootScope.manualprob_readonly = false;
                }
                //console.log(data[1]);
            }
            $scope.$apply();
        });

        $scope.Model = {

        };

        $scope.typesList = function () {
            $location.url("/mode_a_brg_types" );
        }

        $scope.Math = window.Math;
        $scope.Model.data = [];

        var admin_edit_obj = undefined;
        var admin_edit_col = undefined;

        var lastKey = 0;

        var pi = 0;
        var mt = ["Enter Outer Ring SrNo.","Enter Outer Ring Unique Id No.","Enter OD","Enter Outer Ring Width","Enter Outer Ring Extra",
            "Enter Inner Ring SrNo.","Enter Inner Ring Unique Id No.","Enter Bore","Enter Inner Ring Width","Enter Inner Ring Extra",
            "Enter Cage Radial Clearance","Enter Total Width 1","Enter Total Width 2","Enter Total Width 3","Total Width Agerage","Enter Extra"
        ];


        var isDeletePopup = false;
        var isAssemblyPopup = false;
        var isDownloadPopup = false;
        var isFilterPopup = false;

        function esc() {
            $timeout(function () {
                $rootScope.manualprob_readonly = false;
                $rootScope.manualprob  = "";
                isDeletePopup = false;
                isAssemblyPopup = false;
                obj = {};
                pi = 0;
                admin_edit_obj = undefined;
                admin_edit_col = undefined;
                pastKey = 0;
                lastKey = 0;
            }, 200);

        }

        var pastKey = 0;

        var event2 = $rootScope.$on('keydown', function (evt,data) {

            if(parseInt(data) == 27){

                var myEl = angular.element( document.querySelector('.overlay'));
                myEl.removeClass('active');

                var myEl2 = angular.element( document.querySelector('.modal'));
                myEl2.removeClass('active');

                esc();
            }

            if(parseInt(data) == 13 && lastKey != 0){

                if(isNaN($rootScope.manualprob))
                    $rootScope.manualprob = $rootScope.manualprob.toUpperCase();

                var myEl = angular.element( document.querySelector('.overlay'));
                myEl.removeClass('active');

                var myEl2 = angular.element( document.querySelector('.modal'));
                myEl2.removeClass('active');

                $timeout(function () {
                    $rootScope.manualprob_readonly = false;
                    $rootScope.modeltitle = "";
                    $scope.$apply();
                }, 200);

                if($rootScope.manualprob  == undefined || $rootScope.manualprob.length == 0)
                {
                    //alert("Enter Value");
                    //return;
                    $rootScope.manualprob = "0";
                }

                if(isDeletePopup)
                {
                    $timeout(function () {
                        isDeletePopup = false;
                        deleteCellData($rootScope.manualprob);
                        $rootScope.manualprob  = "";
                    }, 200);
                }
                else if(isDownloadPopup)
                {
                    $timeout(function () {
                        isDownloadPopup = false;
                        DownloadNow($rootScope.manualprob);
                        $rootScope.manualprob  = "";
                    }, 200);
                }
                else if(isFilterPopup)
                {
                    $timeout(function () {
                        isFilterPopup = false;
                        FilterNow($rootScope.manualprob);
                        $rootScope.manualprob  = "";
                    }, 200);
                }
                else if(isAssemblyPopup)
                {
                    $timeout(function () {
                        isAssemblyPopup = false;
                        searchCellData($rootScope.manualprob);
                        $rootScope.manualprob  = "";
                    }, 200);
                }
                else
                {

                    checkForDuplicate($rootScope.manualprob);

                    /*if(checkForDuplicate($rootScope.manualprob))
                     {
                     esc();
                     return;
                     }

                     if(admin_edit_obj)
                     {
                     $timeout(function () {
                     updateCellData($rootScope.manualprob);
                     $rootScope.manualprob  = "";
                     }, 200);
                     }
                     else{
                     $timeout(function () {
                     insertInterimData($rootScope.manualprob);
                     $rootScope.manualprob  = "";
                     }, 200);
                     }*/
                }

            }

            if(lastKey == 17){
                //73 for I
                //79 for O

                switch (parseInt(data)){
                    case 49:
                    {
                        pastKey = 49;
                        openWindow(mt[pi]);
                        break;
                    }
                    case 50:
                    {
                        pastKey = 50;
                        pi = 5;
                        openWindow(mt[pi]);
                        break;
                    }
                    // case 49:
                    // {
                    //     openWindow(mt[pi]);
                    //     break;
                    // }
                    case 65:
                    {
                        isAssemblyPopup = true;
                        openWindow("Search : OR Sr.No.");
                        break;
                    }
                    case 68:
                    {
                        if($rootScope.User.roleId == 1)
                            return;

                        isDeletePopup = true;
                        openWindow("Delete Data : Enter Sr.No. OR");
                        break;
                    }
                }
            }
            lastKey = parseInt(data);
        });

        function openWindow(title) {

            if(checkRequired() == false)
                return;

            $timeout(function () {
                $rootScope.modeltitle = title;

                var myEl = angular.element( document.querySelector('.overlay'));
                myEl.addClass('active');

                var myEl2 = angular.element( document.querySelector('.modal'));
                myEl2.addClass('active');

                angular.element( document.querySelector('#manualprob')).focus();
            }, 200);
        }

        function checkForDuplicate(value) {
            var pos = 0;

            if(admin_edit_col)
                pos = admin_edit_col;
            else
                pos = pi;

            if(pos == 0)
            {
                if(value != "0") {
                    var query = "select * from  mode_a_data where brgTypeId = "+$rootScope.brgtype.id+" and or_sr = '"+$rootScope.manualprob+"'";
                    $http({
                        url: '/api/query',
                        method: "POST",
                        data: {'query':query}
                    })
                        .then(function(response) {
                                if(response.data.data.length > 0) {

                                    alert("OR Sr.No. already exist");
                                    esc();
                                }
                                else{
                                    if(admin_edit_obj)
                                    {
                                        $timeout(function () {
                                            updateCellData($rootScope.manualprob);
                                            $rootScope.manualprob  = "";
                                        }, 200);
                                    }
                                    else{
                                        $timeout(function () {
                                            insertInterimData($rootScope.manualprob);
                                            $rootScope.manualprob  = "";
                                        }, 200);
                                    }
                                }
                            },
                            function(response) { // optional

                            });
                }
                else{
                    if(admin_edit_obj)
                    {
                        $timeout(function () {
                            updateCellData($rootScope.manualprob);
                            $rootScope.manualprob  = "";
                        }, 200);
                    }
                    else{
                        $timeout(function () {
                            insertInterimData($rootScope.manualprob);
                            $rootScope.manualprob  = "";
                        }, 200);
                    }
                }
            }
            else if(pos == 5)
            {
                if(value != "0") {
                    var query = "select * from  mode_a_data where brgTypeId = "+$rootScope.brgtype.id+" and ir_sr = '"+$rootScope.manualprob+"'";
                    $http({
                        url: '/api/query',
                        method: "POST",
                        data: {'query':query}
                    })
                        .then(function(response) {
                                if(response.data.data.length > 0) {

                                    alert("IR Sr.No. already exist");
                                    esc();
                                }
                                else{
                                    if(admin_edit_obj)
                                    {
                                        $timeout(function () {
                                            updateCellData($rootScope.manualprob);
                                            $rootScope.manualprob  = "";
                                        }, 200);
                                    }
                                    else{
                                        $timeout(function () {
                                            insertInterimData($rootScope.manualprob);
                                            $rootScope.manualprob  = "";
                                        }, 200);
                                    }
                                }
                            },
                            function(response) { // optional

                            });
                }
                else{
                    if(admin_edit_obj)
                    {
                        $timeout(function () {
                            updateCellData($rootScope.manualprob);
                            $rootScope.manualprob  = "";
                        }, 200);
                    }
                    else{
                        $timeout(function () {
                            insertInterimData($rootScope.manualprob);
                            $rootScope.manualprob  = "";
                        }, 200);
                    }
                }
            }
            else if(pos == 1)
            {
                if(value != "0") {
                    var query = "select * from  mode_a_data where brgTypeId = " + $rootScope.brgtype.id + " and or_unq = '" + $rootScope.manualprob + "'";
                    $http({
                        url: '/api/query',
                        method: "POST",
                        data: {'query': query}
                    })
                        .then(function (response) {
                                if (response.data.data.length > 0) {

                                    alert("OR Unique Id No. already exist");
                                    esc();
                                }
                                else {
                                    if (admin_edit_obj) {
                                        $timeout(function () {
                                            updateCellData($rootScope.manualprob);
                                            $rootScope.manualprob = "";
                                        }, 200);
                                    }
                                    else {
                                        $timeout(function () {
                                            insertInterimData($rootScope.manualprob);
                                            $rootScope.manualprob = "";
                                        }, 200);
                                    }
                                }
                            },
                            function (response) { // optional

                            });
                }
                else{
                    if(admin_edit_obj)
                    {
                        $timeout(function () {
                            updateCellData($rootScope.manualprob);
                            $rootScope.manualprob  = "";
                        }, 200);
                    }
                    else{
                        $timeout(function () {
                            insertInterimData($rootScope.manualprob);
                            $rootScope.manualprob  = "";
                        }, 200);
                    }
                }
            }
            else if(pos == 6) {
                if (value != "0") {
                    var query = "select * from  mode_a_data where brgTypeId = " + $rootScope.brgtype.id + " and ir_unq = '" + $rootScope.manualprob + "'";
                    $http({
                        url: '/api/query',
                        method: "POST",
                        data: {'query': query}
                    })
                        .then(function (response) {
                                if (response.data.data.length > 0) {

                                    alert("OR Unique Id No. already exist");
                                    esc();
                                }
                                else {
                                    if (admin_edit_obj) {
                                        $timeout(function () {
                                            updateCellData($rootScope.manualprob);
                                            $rootScope.manualprob = "";
                                        }, 200);
                                    }
                                    else {
                                        $timeout(function () {
                                            insertInterimData($rootScope.manualprob);
                                            $rootScope.manualprob = "";
                                        }, 200);
                                    }
                                }
                            },
                            function (response) { // optional

                            });
                }
                else {
                    if(admin_edit_obj)
                    {
                        $timeout(function () {
                            updateCellData($rootScope.manualprob);
                            $rootScope.manualprob  = "";
                        }, 200);
                    }
                    else{
                        $timeout(function () {
                            insertInterimData($rootScope.manualprob);
                            $rootScope.manualprob  = "";
                        }, 200);
                    }
                }
            }
            else{
                if(admin_edit_obj)
                {
                    $timeout(function () {
                        updateCellData($rootScope.manualprob);
                        $rootScope.manualprob  = "";
                    }, 200);
                }
                else{
                    $timeout(function () {
                        insertInterimData($rootScope.manualprob);
                        $rootScope.manualprob  = "";
                    }, 200);
                }
            }
        }

        var cols = ["or_sr", "or_unq", "od", "ow", "oe", "ir_sr", "ir_unq", "bore", "iw", "ie","crc","tw1","tw2","tw3","twavg","ex"];
        var obj = {};

        function insertInterimData(value) {

            if(pastKey == 49 && pi >= 4)
            {

                obj[cols[pi]] = value;
                //Check If Inner is Exist
                var query = "select * from  mode_a_data where brgTypeId = " + $rootScope.brgtype.id + " and ir_sr = '" + obj.or_sr + "'";
                $http({
                    url: '/api/query',
                    method: "POST",
                    data: {'query': query}
                })
                .then(function (response) {
                        if (response.data.data.length > 0) {

                            response.data.data[0].roller_dia_grade = $scope.Model.grade;
                            var dt = dbdt();
                            response.data.data[0].date = $filter('date')($scope.Model.dt, "yyyy-MM-dd 00:00:00");
                            response.data.data[0].shift = $scope.Model.shift;
                            response.data.data[0].operator = $rootScope.User.firstName;
                            response.data.data[0].mo_no = $scope.Model.mo;
                            response.data.data[0].or_inv_no = $scope.Model.orinv;
                            response.data.data[0].ir_inv_no = $scope.Model.irinv;
                            response.data.data[0].cage_inv_no = $scope.Model.cageinv;
                            response.data.data[0].roller_batch_no = $scope.Model.batchno;
                            response.data.data[0].active = 1;
                            response.data.data[0].updatedAt = dt;

                            response.data.data[0].or_sr = obj.or_sr;
                            response.data.data[0].or_unq = obj.or_unq;
                            response.data.data[0].od = obj.od;
                            response.data.data[0].ow = obj.ow;
                            response.data.data[0].oe = obj.oe;


                            $http({
                                url: '/api/update',
                                method: "POST",
                                data: {'criteria':{'id':response.data.data[0].id},'obj':response.data.data[0] , 'table':'mode_a_data'}
                            })
                                .then(function(response) {

                                        if(response.data.data.affectedRows == 1)
                                        {
                                            getAllData(-1);
                                            esc();
                                        }
                                    },
                                    function(response) { // optional

                                    });

                        }
                        else {
                            obj[cols[pi]] = value;
                            // insert into db.
                            obj.brgTypeId = $rootScope.brgtype.id;
                            obj.brgType = $rootScope.brgtype.brgType;
                            obj.designation = $rootScope.brgtype.designation;
                            obj.zf_wind_article_no = $rootScope.brgtype.zf_wind_article_no;
                            obj.roller_dia_grade = $scope.Model.grade;
                            var dt = dbdt();
                            obj.date = $filter('date')($scope.Model.dt, "yyyy-MM-dd 00:00:00");
                            obj.shift = $scope.Model.shift;
                            obj.operator = $rootScope.User.firstName;
                            obj.mo_no = $scope.Model.mo;
                            obj.or_inv_no = $scope.Model.orinv;
                            obj.ir_inv_no = $scope.Model.irinv;
                            obj.cage_inv_no = $scope.Model.cageinv;
                            obj.roller_batch_no = $scope.Model.batchno;
                            obj.active = 1;
                            obj.createdAt = dt;
                            obj.content = "";


                            obj.ir_sr = "0";
                            obj.ir_unq = "0";
                            obj.bore = "0";
                            obj.iw = "0";
                            obj.ie = "0";

                            $http({
                                url: '/api/insert',
                                method: "POST",
                                data: {'obj':obj , 'table':'mode_a_data'}
                            })
                                .then(function(response) {
                                        getAllData(0);
                                        esc();
                                    },
                                    function(response) {
                                        esc();
                                    });
                        }
                    },
                    function (response) { // optional

                    });

            }
            else if(pastKey == 50 && pi >= 9)
            {
                obj[cols[pi]] = value;
                //Check If Inner is Exist
                var query = "select * from  mode_a_data where brgTypeId = " + $rootScope.brgtype.id + " and or_sr = '" + obj.ir_sr + "'";
                $http({
                    url: '/api/query',
                    method: "POST",
                    data: {'query': query}
                })
                    .then(function (response) {
                            if (response.data.data.length > 0) {

                                response.data.data[0].roller_dia_grade = $scope.Model.grade;
                                var dt = dbdt();
                                response.data.data[0].date = $filter('date')($scope.Model.dt, "yyyy-MM-dd 00:00:00");
                                response.data.data[0].shift = $scope.Model.shift;
                                response.data.data[0].operator = $rootScope.User.firstName;
                                response.data.data[0].mo_no = $scope.Model.mo;
                                response.data.data[0].or_inv_no = $scope.Model.orinv;
                                response.data.data[0].ir_inv_no = $scope.Model.irinv;
                                response.data.data[0].cage_inv_no = $scope.Model.cageinv;
                                response.data.data[0].roller_batch_no = $scope.Model.batchno;
                                response.data.data[0].active = 1;
                                response.data.data[0].updatedAt = dt;

                                response.data.data[0].ir_sr = obj.ir_sr;
                                response.data.data[0].ir_unq = obj.ir_unq;
                                response.data.data[0].bore = obj.bore;
                                response.data.data[0].iw = obj.iw;
                                response.data.data[0].ie = obj.ie;

                                $http({
                                    url: '/api/update',
                                    method: "POST",
                                    data: {'criteria':{'id':response.data.data[0].id},'obj':response.data.data[0] , 'table':'mode_a_data'}
                                })
                                    .then(function(response) {

                                            if(response.data.data.affectedRows == 1)
                                            {
                                                getAllData(-1);
                                                esc();
                                            }
                                        },
                                        function(response) { // optional

                                        });

                            }
                            else {
                                obj[cols[pi]] = value;
                                // insert into db.
                                obj.brgTypeId = $rootScope.brgtype.id;
                                obj.brgType = $rootScope.brgtype.brgType;
                                obj.designation = $rootScope.brgtype.designation;
                                obj.zf_wind_article_no = $rootScope.brgtype.zf_wind_article_no;
                                obj.roller_dia_grade = $scope.Model.grade;
                                var dt = dbdt();
                                obj.date = $filter('date')($scope.Model.dt, "yyyy-MM-dd 00:00:00");
                                obj.shift = $scope.Model.shift;
                                obj.operator = $rootScope.User.firstName;
                                obj.mo_no = $scope.Model.mo;
                                obj.or_inv_no = $scope.Model.orinv;
                                obj.ir_inv_no = $scope.Model.irinv;
                                obj.cage_inv_no = $scope.Model.cageinv;
                                obj.roller_batch_no = $scope.Model.batchno;
                                obj.active = 1;
                                obj.createdAt = dt;
                                obj.content = "";

                                obj.or_sr = "0";
                                obj.or_unq = "0";
                                obj.od = "0";
                                obj.ow = "0";
                                obj.oe = "0";

                                $http({
                                    url: '/api/insert',
                                    method: "POST",
                                    data: {'obj':obj , 'table':'mode_a_data'}
                                })
                                    .then(function(response) {
                                            getAllData(0);
                                            esc();
                                        },
                                        function(response) {
                                            esc();
                                        });
                            }
                        },
                        function (response) { // optional

                        });
            }
            else{
                //update cell.
                obj[cols[pi]] = value;
                // if(pi == 0)
                //     pi++;
                // if(pi == 5)
                //     pi++;
                pi++;
                openWindow(mt[pi]);
            }
        }

        function updateCellData(value)
        {
            var obj = {
                'updatedAt':dbdt()
            };

            if(admin_edit_col >= 0)
            {
                obj[cols[admin_edit_col]] = value;
                admin_edit_obj[cols[admin_edit_col]] = value;

                if(admin_edit_col == 11 || admin_edit_col == 12 || admin_edit_col == 13){

                    var sum = parseFloat(admin_edit_obj[cols[11]])+parseFloat(admin_edit_obj[cols[12]])+parseFloat(admin_edit_obj[cols[13]]);
                    var avg =  (parseFloat(sum)/3).toFixed(3);

                    obj[cols[14]] = avg;
                    admin_edit_obj[cols[14]] = avg;
                }

                if(admin_edit_col == 16)
                {
                    updateMetaFields(admin_edit_obj,value,"roller_dia_grade");
                    return;
                }
                else if(admin_edit_col == 17)
                {
                    updateMetaFields(admin_edit_obj,value,"date");
                    return;
                }
                else if(admin_edit_col == 18)
                {
                    updateMetaFields(admin_edit_obj,value,"shift");
                    return;
                }
                else if(admin_edit_col == 19)
                {
                    updateMetaFields(admin_edit_obj,value,"operator");
                    return;
                }
                else if(admin_edit_col == 20)
                {
                    updateMetaFields(admin_edit_obj,value,"mo_no");
                    return;
                }
                else if(admin_edit_col == 21)
                {
                    updateMetaFields(admin_edit_obj,value,"or_inv_no");
                    return;
                }
                else if(admin_edit_col == 22)
                {
                    updateMetaFields(admin_edit_obj,value,"ir_inv_no");
                    return;
                }
                else if(admin_edit_col == 23)
                {
                    updateMetaFields(admin_edit_obj,value,"cage_inv_no");
                    return;
                }
                else if(admin_edit_col == 24)
                {
                    updateMetaFields(admin_edit_obj,value,"roller_batch_no");
                    return;
                }
            }
            else
            {
                obj[cols[pi]] = value;
                admin_edit_obj[cols[pi]] = value;


                if(pi == 13){

                    var sum = parseFloat(admin_edit_obj[cols[11]])+parseFloat(admin_edit_obj[cols[12]])+parseFloat(admin_edit_obj[cols[13]]);
                    var avg =  (parseFloat(sum)/3).toFixed(3);

                    obj[cols[14]] = avg;
                    admin_edit_obj[cols[14]] = avg;
                }

                /*obj.roller_dia_grade = $scope.Model.grade;
                obj.date = $filter('date')($scope.Model.dt, "yyyy-MM-dd");
                obj.shift = $scope.Model.shift;
                obj.operator = $rootScope.User.firstName;
                obj.mo_no = $scope.Model.mo;
                obj.or_inv_no = $scope.Model.orinv;
                obj.ir_inv_no = $scope.Model.irinv;
                obj.cage_inv_no = $scope.Model.cageinv;
                obj.roller_batch_no = $scope.Model.batchno;

                admin_edit_obj.roller_dia_grade = $scope.Model.grade;
                admin_edit_obj.date = $filter('date')($scope.Model.dt, "yyyy-MM-dd");
                admin_edit_obj.shift = $scope.Model.shift;
                admin_edit_obj.operator = $rootScope.User.firstName;
                admin_edit_obj.mo_no = $scope.Model.mo;
                admin_edit_obj.or_inv_no = $scope.Model.orinv;
                admin_edit_obj.ir_inv_no = $scope.Model.irinv;
                admin_edit_obj.cage_inv_no = $scope.Model.cageinv;
                admin_edit_obj.roller_batch_no = $scope.Model.batchno;*/

            }

            $http({
                url: '/api/update',
                method: "POST",
                data: {'criteria':{'id':admin_edit_obj.id},'obj':obj , 'table':'mode_a_data'}
            })
                .then(function(response) {

                        if(response.data.data.affectedRows == 1)
                        {
                            var index = $scope.Model.data.map(function(e) { return e.id; }).indexOf(admin_edit_obj.id);
                            $scope.Model.data[index] = admin_edit_obj;
                        }

                        if(admin_edit_col >= 0)
                        {
                            admin_edit_obj = undefined;
                            admin_edit_col = undefined;
                        }
                        else{
                            if(pi >= 15)
                            {
                                esc();
                            }
                            else{
                                if(pi == 13){
                                    pi = 15;
                                    $rootScope.manualprob  = admin_edit_obj[cols[pi]];
                                    openWindow(mt[pi]);
                                }
                                else{
                                    pi++;
                                    $rootScope.manualprob  = admin_edit_obj[cols[pi]];
                                    openWindow(mt[pi]);
                                }
                            }
                        }
                    },
                    function(response) { // optional
                        esc();
                    });
        }

        function updateMetaFields(item,value,k) {

            var obj = {'updatedAt':dbdt()};
            obj[k] = value;

            $http({
                url: '/api/update',
                method: "POST",
                data: {'criteria':{'brgTypeId':item.brgTypeId,'id':item.id},'obj': obj , 'table':'mode_a_data'}
            })
                .then(function(response) {
                        var index = $scope.Model.data.map(function(e) { return e.id; }).indexOf(admin_edit_obj.id);
                        $scope.Model.data[index][k] = value;

                        admin_edit_obj = undefined;
                        admin_edit_col = undefined;

                    },
                    function(response) { // optional

                    });
        }

        function searchCellData(value) {
            var index = $scope.Model.data.map(function(e) { return e.or_sr; }).indexOf(value);
            if(index == -1)
            {
                alert("Incorrect OR Sr.No.");
                return;
            }
            admin_edit_obj = $scope.Model.data[index];
            admin_edit_col = undefined;
            obj = {};
            $timeout(function () {
                pi = 10;
                $rootScope.manualprob  = admin_edit_obj[cols[pi]];
                openWindow(mt[pi]);
            },200);
        }

        function deleteCellData(value)
        {

            var index = $scope.Model.data.map(function(e) { return e.or_sr; }).indexOf(value);
            if(index == -1)
            {
                alert("Incorrect OR Sr.No.");
                return;
            }

            $http({
                url: '/api/delete',
                method: "POST",
                data: {'obj':{'or_sr':value,'brgTypeId':$rootScope.brgtype.id} , 'table':'mode_a_data'}
            })
                .then(function(response) {

                        if(response.data.data.affectedRows == 1)
                        {
                            //$scope.reload();
                            $scope.Model.data.splice(index, 1);
                        }
                        else{
                            alert("Incorrect OR Sr.No.");
                        }
                    },
                    function(response) { // optional
                        alert("Something Went Wrong!");
                    });
        }

        function getAllData(position) {

            if(position == 0)
            {
                var query = "SELECT * FROM mode_a_data where brgTypeId = "+$rootScope.brgtype.id+" ORDER BY id DESC LIMIT 1";
                $http({
                    url: '/api/query',
                    method: "POST",
                    data: {'query':query}
                })
                    .then(function(response) {
                            var obj = response.data.data[0];
                            $scope.Model.data.unshift(obj);
                        },
                        function(response) { // optional

                        });
            }
            else
            {

                var query = "SELECT * FROM mode_a_data where brgTypeId = "+$rootScope.brgtype.id+" ORDER BY id DESC LIMIT "+$scope.Model.perPage;
                $http({
                    url: '/api/query',
                    method: "POST",
                    data: {'query':query}
                })
                    .then(function(response) {
                            $scope.Model.data = response.data.data;
                        },
                        function(response) { // optional

                        });

                // $http({
                //     url: '/api/findBy',
                //     method: "POST",
                //     data: {'criteria':{'brgTypeId':$rootScope.brgtype.id},'table':'mode_a_data'}
                // })
                //     .then(function(response) {
                //             $scope.Model.data = response.data.data;
                //         },
                //         function(response) { // optional
                //
                //         });

            }
        }

        $scope.cell = function (item,col,value) {


            if(col == 0 || col == 1 || col == 5 || col == 6)
            {
                admin_edit_obj = item;
                admin_edit_col = col;

                $timeout(function () {

                    $rootScope.manualprob  = value;
                    //if(col == 3)
                    //{
                    var title = mt[col];
                    //title = title.replace('(1) ','');
                    //title = title.replace('(2) ','');
                    $rootScope.modeltitle = title;
                    //}
                    var myEl = angular.element( document.querySelector('.overlay'));
                    myEl.addClass('active');

                    var myEl2 = angular.element( document.querySelector('.modal'));
                    myEl2.addClass('active');

                    angular.element( document.querySelector('#manualprob')).focus();
                }, 200);
            }
            else{

                if($rootScope.User.roleId == 1)
                    return;

                admin_edit_obj = item;
                admin_edit_col = col;

                $timeout(function () {

                    $rootScope.manualprob  = item[cols[col]];
                    $rootScope.modeltitle = mt[col];

                    if(col == 16)
                    {
                        $rootScope.manualprob  = admin_edit_obj.roller_dia_grade;
                        $rootScope.modeltitle = "Enter Roller Diameter Grade";
                    }
                    else if(col == 17)
                    {
                        $rootScope.manualprob  = admin_edit_obj.date;
                        $rootScope.modeltitle = "Enter Date";
                    }
                    else if(col == 18)
                    {
                        $rootScope.manualprob  = admin_edit_obj.shift;
                        $rootScope.modeltitle = "Enter Shift";
                    }
                    else if(col == 19)
                    {
                        $rootScope.manualprob  = admin_edit_obj.operator;
                        $rootScope.modeltitle = "Enter Operator";
                    }
                    else if(col == 20)
                    {
                        $rootScope.manualprob  = admin_edit_obj.mo_no;
                        $rootScope.modeltitle = "Enter MO No.";
                    }
                    else if(col == 21)
                    {
                        $rootScope.manualprob  = admin_edit_obj.or_inv_no;
                        $rootScope.modeltitle = "Enter OR Invoice No.";
                    }
                    else if(col == 22)
                    {
                        $rootScope.manualprob  = admin_edit_obj.ir_inv_no;
                        $rootScope.modeltitle = "Enter IR Invoice No.";
                    }
                    else if(col == 23)
                    {
                        $rootScope.manualprob  = admin_edit_obj.cage_inv_no;
                        $rootScope.modeltitle = "Enter Cage Invoice No.";
                    }
                    else if(col == 24)
                    {
                        $rootScope.manualprob  = admin_edit_obj.roller_batch_no;
                        $rootScope.modeltitle = "Enter Roller Batch No.";
                    }

                    var myEl = angular.element( document.querySelector('.overlay'));
                    myEl.addClass('active');

                    var myEl2 = angular.element( document.querySelector('.modal'));
                    myEl2.addClass('active');

                    angular.element( document.querySelector('#manualprob')).focus();
                }, 200);
            }



        }

        $scope.$on('$viewContentLoaded', function() {
            // $scope.Model.data = [];
            // getAllData(-1);
            // getMetaData();
            esc();
            getSettings();
        });

        function getSettings() {
            $http.get('/api/findAll?table=mode_a_settings&temp='+Math.random())
                .then(function(response) {

                    $scope.Model.perPage = response.data.data[0].PerPage;
                    $scope.Model.twProbe1 = response.data.data[0].TW1;
                    $scope.Model.twProbe2 = response.data.data[0].TW2;
                    $scope.Model.twProbe3 = response.data.data[0].TW3;

                    $scope.Model.crcProbe = response.data.data[0].CRC;
                    $scope.Model.twMode1 = Boolean(Number(response.data.data[0].TW_Flag1));
                    $scope.Model.twMode2 = Boolean(Number(response.data.data[0].TW_Flag2));
                    $scope.Model.twMode3 = Boolean(Number(response.data.data[0].TW_Flag3));
                    $scope.Model.crcMode = Boolean(Number(response.data.data[0].CRC_Flag));

                    $scope.Model.orodProbe = response.data.data[0].OROD;
                    $scope.Model.orodMode = Boolean(Number(response.data.data[0].OROD_Flag));
                    $scope.Model.orwProbe = response.data.data[0].ORW;
                    $scope.Model.orwMode = Boolean(Number(response.data.data[0].ORW_Flag));

                    $scope.Model.irbProbe = response.data.data[0].IRBR;
                    $scope.Model.irbMode = Boolean(Number(response.data.data[0].IRBR_Flag));
                    $scope.Model.irwProbe = response.data.data[0].IRW;
                    $scope.Model.irwMode = Boolean(Number(response.data.data[0].IRW_Flag));

                    $scope.Model.data = [];
                    getAllData(-1);
                    if($rootScope.User.roleId == 1)
                        return;
                    getMetaData();
                });
        }

        $scope.saveSettings = function () {
            var obj = {
                'PerPage':$scope.Model.perPage,
                'TW1':$scope.Model.twProbe1,
                'TW2':$scope.Model.twProbe2,
                'TW3':$scope.Model.twProbe3,
                'CRC':$scope.Model.crcProbe,
                'TW_Flag1':Number($scope.Model.twMode1),
                'TW_Flag2':Number($scope.Model.twMode2),
                'TW_Flag3':Number($scope.Model.twMode3),
                'CRC_Flag':Number($scope.Model.crcMode),

                'OROD':$scope.Model.orodProbe,
                'OROD_Flag':Number($scope.Model.orodMode),

                'ORW':$scope.Model.orwProbe,
                'ORW_Flag':Number($scope.Model.orwMode),

                'IRBR':$scope.Model.irbProbe,
                'IRBR_Flag':Number($scope.Model.irbMode),

                'IRW':$scope.Model.irwProbe,
                'IRW_Flag':Number($scope.Model.irwMode)

            };

            $http({
                url: '/api/update',
                method: "POST",
                data: {'criteria':{'id':1},'obj':obj , 'table':'mode_a_settings'}
            })
                .then(function(response) {
                        $http.get('/api/findAll?table=mode_a_settings&temp='+Math.random())
                            .then(function(response) {
                                alert("Configuration Updated");
                                $scope.Model.perPage = response.data.data[0].PerPage;
                                $scope.Model.twProbe1 = response.data.data[0].TW1;
                                $scope.Model.twProbe2 = response.data.data[0].TW2;
                                $scope.Model.twProbe3 = response.data.data[0].TW3;
                                $scope.Model.crcProbe = response.data.data[0].CRC;
                                $scope.Model.twMode1 = Boolean(Number(response.data.data[0].TW_Flag1));
                                $scope.Model.twMode2 = Boolean(Number(response.data.data[0].TW_Flag2));
                                $scope.Model.twMode3 = Boolean(Number(response.data.data[0].TW_Flag3));
                                $scope.Model.crcMode = Boolean(Number(response.data.data[0].CRC_Flag));

                                $scope.Model.orodProbe = response.data.data[0].OROD;
                                $scope.Model.orodMode = Boolean(Number(response.data.data[0].OROD_Flag));
                                $scope.Model.orwProbe = response.data.data[0].ORW;
                                $scope.Model.orwMode = Boolean(Number(response.data.data[0].ORW_Flag));

                                $scope.Model.irbProbe = response.data.data[0].IRBR;
                                $scope.Model.irbMode = Boolean(Number(response.data.data[0].IRBR_Flag));
                                $scope.Model.irwProbe = response.data.data[0].IRW;
                                $scope.Model.irwMode = Boolean(Number(response.data.data[0].IRW_Flag));
                            });
                    },
                    function(response) { // optional

                    });
        }

        function getMetaData() {
            $http({
                url: '/api/findBy',
                method: "POST",
                data: {'criteria':{'brgTypeId':$rootScope.brgtype.id,'active':1},'table':'mode_a_meta_data'}
            })
                .then(function(response) {
                        var d = response.data.data;
                        if(d != undefined && d.length > 0)
                        {
                            d = d[0];
                            $scope.Model.grade = d.roller_dia_grade;
                            $scope.Model.dt = new Date(d.date);
                            $scope.Model.shift = d.shift;
                            $scope.Model.mo = d.mo_no;
                            $scope.Model.orinv = d.or_inv_no;
                            $scope.Model.irinv = d.ir_inv_no;
                            $scope.Model.cageinv = d.cage_inv_no;
                            $scope.Model.batchno = d.roller_batch_no;
                        }
                    },
                    function(response) {

                    });
        }

        function dbdt() {
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

        $scope.reload = function () {
            $scope.Model.data = [];
            getAllData(-1);
            getMetaData();
        }

        function checkRequired() {
            if($scope.Model.grade == undefined || $scope.Model.grade.length == 0)
            {
                alert("Enter Roller Diameter Grade");
                return false;
            }
            if($scope.Model.dt == undefined)
            {
                alert("Select Date");
                return false;
            }
            if($scope.Model.shift == undefined || $scope.Model.shift.length == 0)
            {
                alert("Enter Shift");
                return false;
            }
            if($scope.Model.mo == undefined || $scope.Model.mo.length == 0)
            {
                alert("Enter Mo No.");
                return false;
            }
            if($scope.Model.orinv == undefined || $scope.Model.orinv.length == 0)
            {
                alert("Enter OR Invoice No.");
                return false;
            }
            if($scope.Model.irinv == undefined || $scope.Model.irinv.length == 0)
            {
                alert("Enter IR Invoice No.");
                return false;
            }
            if($scope.Model.cageinv == undefined || $scope.Model.cageinv.length == 0)
            {
                alert("Enter Cage Invoice No.");
                return false;
            }
            if($scope.Model.batchno == undefined || $scope.Model.batchno.length == 0)
            {
                alert("Enter Roller Batch No.");
                return false;
            }
        }

        $scope.save = function () {

            if(checkRequired() == false)
                return;

            var obj = {
                'active':0
            };

            $http({
                url: '/api/update',
                method: "POST",
                data: {'criteria':{'brgTypeId':$rootScope.brgtype.id},'obj':obj , 'table':'mode_a_meta_data'}
            })
                .then(function(response) {
                        var obj1 = {
                            'brgTypeId':$rootScope.brgtype.id,
                            'roller_dia_grade':$scope.Model.grade,
                            'date':$filter('date')($scope.Model.dt, "yyyy-MM-dd 00:00:00"),
                            'shift':$scope.Model.shift,
                            'operator':'',
                            'mo_no':$scope.Model.mo,
                            'or_inv_no':$scope.Model.orinv,
                            'ir_inv_no':$scope.Model.irinv,
                            'cage_inv_no':$scope.Model.cageinv,
                            'roller_batch_no':$scope.Model.batchno,
                            'active':1,
                            'createdAt': dbdt()
                        };
                        $http({
                            url: '/api/insert',
                            method: "POST",
                            data: {'obj':obj1 , 'table':'mode_a_meta_data'}
                        })
                            .then(function(response) {
                                    alert("Field Data Saved Successfully.");
                                    getMetaData();
                                },
                                function(response) {
                                });
                    },
                    function(response) { // optional

                    });
        }

        $scope.reset = function () {
            $scope.Model.grade = "";
            $scope.Model.dt = new Date();
            $scope.Model.shift = "";
            $scope.Model.mo = "";
            $scope.Model.orinv = "";
            $scope.Model.irinv = "";
            $scope.Model.cageinv = "";
            $scope.Model.batchno = "";
        }

        $scope.filterBy = function () {
            $timeout(function () {
                $rootScope.manualprob  = "";
                isFilterPopup = true;
                openWindow("Enter OR Sr.No. Range example 100,120");
            }, 200);
        }

        function FilterNow(value) {

            var data = value.split(',');
            if(data == undefined || data.length != 2)
            {
                alert("Invalid Data");
                return;
            }

            var lowerID = -1;
            var upperID = -1;

            var query = "SELECT * FROM mode_a_data where brgTypeId = "+$rootScope.brgtype.id+" and or_sr = '"+data[0]+"'";

            $http({
                url: '/api/query',
                method: "POST",
                data: {'query':query}
            })
                .then(function(response) {

                        if(response.data.data.length > 0)
                        {
                            lowerID = response.data.data[0].id;

                            query = "SELECT * FROM mode_a_data where brgTypeId = "+$rootScope.brgtype.id+" and or_sr = '"+data[1]+"'";

                            $http({
                                url: '/api/query',
                                method: "POST",
                                data: {'query':query}
                            })
                                .then(function(response) {

                                        if(response.data.data.length > 0)
                                        {
                                            upperID = response.data.data[0].id;

                                            query = "SELECT * FROM mode_a_data where brgTypeId = "+$rootScope.brgtype.id+" and id between "+lowerID+" and "+upperID+"  ORDER BY id DESC LIMIT "+$scope.Model.perPage;
                                            $http({
                                                url: '/api/query',
                                                method: "POST",
                                                data: {'query':query}
                                            })
                                                .then(function(response) {
                                                        $scope.Model.data = response.data.data;
                                                    },
                                                    function(response) { // optional

                                                    });
                                        }
                                    },
                                    function(response) { // optional

                                    });
                        }
                    },
                    function(response) { // optional

                    });

            // //alert(data[0]);
            // //alert(data[1]);
            //
            // var query = "SELECT * FROM mode_a_data where brgTypeId = "+$rootScope.brgtype.id+" and or_sr between '"+data[0]+"' and '"+data[1]+"'  ORDER BY id DESC LIMIT "+$scope.Model.perPage;
            // $http({
            //     url: '/api/query',
            //     method: "POST",
            //     data: {'query':query}
            // })
            //     .then(function(response) {
            //             $scope.Model.data = response.data.data;
            //         },
            //         function(response) { // optional
            //
            //         });
        }

        $scope.download = function () {

            $timeout(function () {
                $rootScope.manualprob  = "";
                isDownloadPopup = true;
                openWindow("Enter OR Sr.No. Range example 100,200");
            }, 200);

        }

        function DownloadNow(value) {

            var download_data = [];

            var data = value.split(',');

            if(data == undefined || data.length != 2)
            {
                alert("Invalid Data");
                return;
            }

            var lowerID = -1;
            var upperID = -1;

            var query = "SELECT * FROM mode_a_data where brgTypeId = "+$rootScope.brgtype.id+" and or_sr = '"+data[0]+"'";
            console.log(query);

            $http({
                url: '/api/query',
                method: "POST",
                data: {'query':query}
            })
                .then(function(response) {

                        if(response.data.data.length > 0)
                        {
                            lowerID = response.data.data[0].id;
                            console.log(lowerID);
                            query = "SELECT * FROM mode_a_data where brgTypeId = "+$rootScope.brgtype.id+" and or_sr = '"+data[1]+"'";
                            console.log(query);
                            $http({
                                url: '/api/query',
                                method: "POST",
                                data: {'query':query}
                            })
                                .then(function(response) {

                                        if(response.data.data.length > 0)
                                        {
                                            upperID = response.data.data[0].id;
                                            console.log(upperID);
                                            query = "SELECT * FROM mode_a_data where brgTypeId = "+$rootScope.brgtype.id+" and id between "+lowerID+" and "+upperID+" ORDER BY id desc";
                                            console.log(query);
                                            $http({
                                                url: '/api/query',
                                                method: "POST",
                                                data: {'query':query}
                                            })
                                                .then(function(response) {
                                                        console.log(response);
                                                        download_data = response.data.data;
                                                        console.log(download_data);
                                                        $http({
                                                            url: '/api/downloadcsv',
                                                            method: "POST",
                                                            data: {'data':download_data,'mode':1},
                                                            responseType: 'blob'
                                                        })
                                                            .then(function(response) {
                                                                    console.log(response);
                                                                    var data = response.data;
                                                                    var headers = response.headers;
                                                                    var blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
                                                                    var objectUrl = URL.createObjectURL(blob);
                                                                    window.open(objectUrl);
                                                                },
                                                                function(response) { // optional
                                                                        console.log(response);
                                                                });

                                                    },
                                                    function(response) { // optional

                                                    });
                                        }
                                    },
                                    function(response) { // optional

                                    });
                        }
                    },
                    function(response) { // optional

                    });

            }

    })

    .controller('navController',function(focus,$interval,$timeout,$rootScope,$scope, $http,$window,$mdDialog,$location,$q,$sce,$filter) {

        $scope.Model = {

        };

        // var lastKey;
        // $rootScope.$on('keydown', function (evt,data) {
        //     console.log(data);
        //     if(lastKey == 17){
        //         switch (parseInt(data)){
        //             case 49:
        //             {
        //                 break;
        //             }
        //             case 50:
        //             {
        //                 break;
        //             }
        //             case 51:
        //             {
        //                 break;
        //             }
        //             case 52:
        //             {
        //                 break;
        //             }
        //             case 53:
        //             {
        //                 break;
        //             }
        //             case 54:
        //             {
        //                 break;
        //             }
        //             case 55:
        //             {
        //                 break;
        //             }
        //             case 56:
        //             {
        //                 break;
        //             }
        //         }
        //     }
        //     lastKey = parseInt(data);
        // });

        function getRandomInt (min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        $scope.$on('$viewContentLoaded', function() {

            //alert("ok");
        });

        $scope.mode1 = function () {
            $location.url('/mode_a_brg_types');
        }

        $scope.mode2 = function () {
            $location.url('/mode_b_brg_types');
        }

        $scope.mode3 = function () {
            $location.url('/mode_c_brg_types');
        }

        $scope.logout = function () {
            $rootScope.User = undefined;
            $location.url('/login');
        }

        function dbdt() {
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

        function insertRoles(){
            var obj = {'title':'Administrator','slug':'admin',
                'description':'Administrator Access','active':1,
                'created':dbdt(),'content':''
            };

            $http({
                url: '/api/insert',
                method: "POST",
                data: {'obj':obj , 'table':'role'}
            })
                .then(function(response) {
                        console.log(response);
                    },
                    function(response) { // optional
                        console.log(response);
                    });
        }

        function updateRoles(){
            var obj = {
                'updated':dbdt(),'content':getRandomInt(100,120)
            };
            $http({
                url: '/api/update',
                method: "POST",
                data: {'criteria':{'id':4},'obj':obj , 'table':'role'}
            })
                .then(function(response) {
                        console.log(response);
                    },
                    function(response) { // optional
                        console.log(response);
                    });
        }


    })
