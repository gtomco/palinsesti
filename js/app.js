var app = angular.module('myApp',['ui.bootstrap','ui.router','ngBaasbox','ngMessages']);


app.service("connService", function($baasbox,tokenService){
      var url = "http://localhost:9001";
      return {
            init: function(){
                  $baasbox.init({
                        //url: "http://213.183.128.135:9000",
                        //url:"http://192.168.1.163:9000",
                        url: url,
                        appCode: 1234567890,
                        session: tokenService.getToken()
                  });
                  return $baasbox;
            },
            getUrl: function(){
                  return url;
            }
      };
});


app.run(['$templateCache', function ($templateCache) {
  $templateCache.put('error-messages',
    '<span class="help-block" ng-message="email">Il campo deve essere un\'email valida</span>\n' +
    '<span class="help-block" ng-message="max">Il valore è troppo grande</span>\n' +
    '<span class="help-block" ng-message="min">Il valore è troppo piccolo</span>\n' +
    '<span class="help-block" ng-message="maxlength">Il campo è troppo lungo</span>\n' +
    '<span class="help-block" ng-message="minlength">Il campo è troppo corto</span>\n' +
    '<span class="help-block" ng-message="number">Il valore deve essere un numero</span>\n' +
    '<span class="help-block" ng-message="pattern">Il campo non rispetta le regole definite</span>\n' +
    '<span class="help-block" ng-message="required">Il campo è obbligatorio</span>\n' +
    '<span class="help-block" ng-message="url">Il campo deve essere un url valido</span>\n' +
    '<span class="help-block" ng-message="date">Il campo deve essere una data valida</span>\n' +
    '<span class="help-block" ng-message="datetimelocal">Il campo deve essere una data valida</span>\n' +
    '<span class="help-block" ng-message="time">Il campo deve essere una data valida</span>\n' +
    '<span class="help-block" ng-message="week">Il campo deve essere una settimana valida</span>\n' +
    '<span class="help-block" ng-message="month">Il campo deve essere un mese valido</span>\n' +
    '<span class="help-block" ng-message="parse">Il valore non è valido</span>\n' +
    '<span class="help-block" ng-message="text">Il valore non è valido</span>\n' +
    '');
}]);


app.service("tokenService", function(){
      return {
            getToken: function(){
                  try
                  {
                        var token = localStorage.getItem("id_token");
                        if(token.length == 36)
                              return token;
                        else
                              return false;
                  }
                  catch(err)
                  {
                        return false;
                  }
            },
            setToken: function(token){
                  localStorage.setItem("id_token", token);
            },
            deleteToken: function(){
                  localStorage.setItem("id_token", null);
            }
      };
});


app.service("loggedService", function(tokenService,$rootScope){
      return {
            isLogged: function(){
                  //$rootScope.isUserLogged = tokenService.getToken()!=false;
                  return tokenService.getToken()!=false;
            },
            reportExpired: function(){
                  $rootScope.isUserLogged = false;
                  tokenService.deleteToken();
            }
      };
});


app.controller("profileCtrl", function($scope,$rootScope,connService,tokenService){
      $scope.me = [];
      $baasbox = connService.init();
      $scope.url = connService.getUrl();
      $scope.token = tokenService.getToken();
      $baasbox.me()
      .then(function (response) { //Success
            $scope.me = response;
            $scope.updateProf = function(){
                  $baasbox.updateProfile($scope.me)
                  .then(function(response){
                  }), function(response){
                  }
            };
            $scope.deleteAgency = function(id){
                  $scope.me.visibleByAnonymousUsers.agencies.splice(id,1);
                  $scope.updateProf();
            };
      }, function (error) { // Fail

      });

});

app.directive('loading', ['$http' ,function ($http)
{
      return {
            restrict: 'A',
            link: function (scope, elm, attrs)
            {
                  scope.isLoading = function () {
                        //return $http.pendingRequests.length > 0;
                        //return 1;
                        return 0;
                  };
                  scope.$watch(scope.isLoading(), function (v)
                  {
                        if(v){
                              elm.show();
                        }
                        else{
                              elm.hide();
                        }
                  });
            }
      };

}]);

app.factory("authService", function(tokenService,connService,loggedService,$rootScope,$state) {
      var $baasbox = connService.init();

      return {
            login: function(username, password, remember){
                  if(loggedService.isLogged()==false){
                        $baasbox.login(username, password).then(function(response){
                              tokenService.setToken(response["X-BB-SESSION"]);
                              $('#Login').modal('hide');
                              $rootScope.isUserLogged = true;
                              $rootScope.modal.close('close');
                              $state.go("profile");
                        },
                        function(response){

                        })
                  }
            },
            register: function(username, password, fullname, email){
                  if(loggedService.isLogged()==false){
                        $baasbox.signup({username:username, password:password})
                        .then(function (response) { //Success
                              tokenService.setToken(response["X-BB-SESSION"]);
                              $baasbox.me()
                              .then(function (response) { //Success
                                    var me = response;
                                    me.visibleByTheUser.fullname=fullname;
                                    me.visibleByTheUser.email=email;
                                    me.visibleByAnonymousUsers.agencies = [];
                                    $baasbox.updateProfile(me)
                                    .then(function(response) {
                                          $('#Register').modal('hide');
                                          $rootScope.isUserLogged = true;
                                          $rootScope.modal.close('close');
                                    },function(error){

                                    })

                              }, function (error) { // Fail

                              });
                        }, function (error) { // Fail
                              alert("C'e un errore!");
                        });
                  }
            },
            logout: function(){
                  if(loggedService.isLogged())
                  {
                        tokenService.deleteToken();
                        $rootScope.isUserLogged = false;
                        $baasbox.logout();
                        if($state.current.data.requireLogin)
                        {
                              $state.go("home");
                        }

                  }
            }
      };
});

app.config(function($stateProvider, $urlRouterProvider){

      // For any unmatched url, send to /home
      $urlRouterProvider.otherwise("/home")

      $stateProvider
      .state('home', {
            url: "/home",
            templateUrl: "partials/home.html",
            data: {
                  requireLogin: false
            }
      })

      .state('funzionalita', {
            url: "/funzionalita",
            templateUrl: "partials/funzionalita.html",
            data: {
                  requireLogin: false
            }
      })

      .state('domande-frequenti', {
            url: "/domande-frequenti",
            templateUrl: "partials/domande-frequenti.html",
            data: {
                  requireLogin: false
            }
      })

      .state('nostri-clienti', {
            url: "/nostri-clienti",
            templateUrl: "partials/nostri-clienti.html",
            controller: "MapCtrl",
            data: {
                  requireLogin: true
            }
      })

      .state('versione-prova', {
            url: "/versione-prova",
            templateUrl: "partials/versione-prova.html",
            data: {
                  requireLogin: true
            }
      })

      .state('profile', {
            url: "/profile",
            templateUrl: "partials/profile.html",
            controller: "profileCtrl",
            data: {
                  requireLogin: true
            }
      })

      /*
      .state('stampa', {
            url: "/stampa",
            templateUrl: "partials/stampa.html",
            data: {
                  requireLogin: true
            }
      })
      .state('stampa-rapida', {
            url: "/stampa-rapida",
            templateUrl: "partials/stampa-rapida.html",
            data: {
                  requireLogin: true
            }
      })
      .state('stampa-personalizata', {
            url: "/stampa-personalizata",
            templateUrl: "partials/stampa-personalizata.html",
            data: {
                  requireLogin: true
            }
      })
      */

});

app.run(function ($rootScope, loggedService) {
      $rootScope.$watch(function(){
            return loggedService.isLogged();
      }, function(v){
            $rootScope.isUserLogged = v;
      });
});


app.run(function ($rootScope,authService,loggedService, $state) {
      $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
            var requireLogin = toState.data.requireLogin;

            if (requireLogin && !$rootScope.isUserLogged) {
                  event.preventDefault();
                  $rootScope.openLogin();
                  $state.go('home');
            }
      });
});

app.controller("loginCtrl", function($scope, $rootScope, authService){
      $scope.loginBtn = function (username, password, remember) {
            authService.login(username, password, remember);
            $scope.user = "";
            $scope.pass = "";
            $scope.remember = false;
            //$modalInstance.close('close');
      };

      $scope.cancelBtn = function () {
            $rootScope.modal.close("close");
      };

      $scope.logReg = function(){
            $rootScope.modal.close("close");
            $scope.openRegister();
      }
});

app.controller("registerCtrl", function($scope, $rootScope, authService){
      $scope.registerBtn = function (username, password, fullname, email) {
            authService.register(username, password, fullname, email)
            $scope.regUser = "";
            $scope.regPass = "";
            $scope.fullname = "";
            $scope.email = "";
      };

      $scope.regcancelBtn = function () {
            $rootScope.modal.close("close");
      };
});

app.controller("userCtrl", ['$scope', '$rootScope','connService', '$rootScope', '$modal', 'authService', function($scope, loggedService, connService, $rootScope, $modal, authService){
      connService.init();

      $rootScope.openLogin = function(){
            $rootScope.modal = $modal.open({
                  templateUrl: 'partials/login.html',
                  controller: "loginCtrl",
                  size: "sm"
            });
            $rootScope.modal.result.then(function () {
                  //authService.login("geiv","geiv",false);
            }, function () {
                  //authService.login("geiv","geiv",false);
            });
      };

      $rootScope.openRegister = function(){
            $rootScope.modal = $modal.open({
                  templateUrl: 'partials/register.html',
                  controller: "registerCtrl",
                  size:"sm"

            });

            $rootScope.modal.result.then(function () {
                  //authService.login("geiv","geiv",false);
            }, function () {
                  //authService.login("geiv","geiv",false);
            });
      };

      $rootScope.logout = function(){
            authService.logout();
      }
}]);

/*******************************************
****              Map            ***********
********************************************/
app.directive('fileModel', ['$parse', function ($parse) {
      return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                  var model = $parse(attrs.fileModel);
                  var modelSetter = model.assign;

                  element.bind('change', function(){
                        scope.$apply(function(){
                              modelSetter(scope, element[0].files[0]);
                        });
                  });
            }
      };
}]);

app.controller("MapCtrl",['$scope','$rootScope','connService','tokenService','$http',function($scope, $rootScope, connService, tokenService,$http) {
      $baasbox = connService.init();
      /*mapOptions object which contains the initialization variables*/
      var mapOptions = {
            zoom: 15,
            center: new google.maps.LatLng(41.9027835, 12.496365500000024) /*we center the map around this point*/
      }

      $scope.map = new google.maps.Map(document.getElementById('map'), mapOptions);/* here we create the new map inside the HTML <div id="map"></div> container*/
      var infoWindow = new google.maps.InfoWindow();/*create a infoWindow object to show informtion ehen we click to a marker*/

      getClients();

      function getClients(){
            $baasbox.getAllUsers()
            .then(function(res) {
                  $scope.url = connService.getUrl();
                  $scope.token = tokenService.getToken();
                  angular.forEach(res, function(user, i){
                        angular.forEach(user.visibleByAnonymousUsers.agencies, function(agency, j){
                              createMarker(agency);
                        });
                  });

            },function(err) {

            });
      }
      getClients();

      var createMarker = function(info){
            /* info == res */
            var marker = new google.maps.Marker({
                  map: $scope.map,/*specifikon map per tu vendosur Marker*/
                  position: new google.maps.LatLng(info.lat, info.long),
                  title: info.agency,
                  image: info.img /* Here comes the id of the image */
            });

            marker.content = '<div class="infoWindowContent">' + info.desc + '</div>';
            google.maps.event.addListener(marker, 'click', function(){
                  var infoWindowContent = '<img width="250px" src="' + connService.getUrl() + '/file/' + marker.image + '?X-BB-SESSION=' + tokenService.getToken() + '"><h3 style="color:black;">' + marker.title + '</h3><span style="color:black;"' + marker.content + '</span>';
                  infoWindow.setContent(infoWindowContent);
                  console.log(infoWindowContent);
                  infoWindow.open($scope.map, marker);
            });/* end of create marker function */

      }/* end of createMarker funcion */

      $scope.addPoint = function() {
            var file = $scope.myFile;
            //this is the BaasBox URL
            var uploadUrl = connService.getUrl() + '/file';
            /*fileUpload.uploadFileToUrl(file, uploadUrl);*/
            var fd = new FormData();
            fd.append('file', file);
            $http.post(uploadUrl, fd, {
                  transformRequest: angular.identity,
                  headers: {
                        'Content-Type': undefined,
                        'X-BB-SESSION': tokenService.getToken()
                  }
            })
            .success(function(res){
                  $rootScope.imgId = res.data.id;
                  storeData();
            })
            .error(function(err){

            });

            function storeData() {
                  /* this function stores all the clients data */
                  var data = new function(){
                        this.agency = $scope.agency;
                        this.gamePoint = $scope.gamePoint;
                        this.address = $scope.address;
                        /*this.img = my_url;*/
                        this.img = $rootScope.imgId;/* here we store the image ID of the agency*/
                        this.lat = $scope.point.lat();
                        this.long = $scope.point.lng();
                        this.desc = $scope.desc;
                  }
                  $baasbox.me()
                  .then(function (response) { //Success
                        var me = response;
                        var length = me.visibleByAnonymousUsers.agencies.length;
                        me.visibleByAnonymousUsers.agencies[length] = data;
                        $baasbox.updateProfile(me)
                        .then(function(response) {
                              getClients();
                        },function(error){
                        })
                  }, function (error) { // Fail
                  });

                  /* reset the form */
                  $scope.address = "";
                  $scope.agency = "";
                  $scope.gamePoint ="";
                  $scope.point = "";//reset the coords
                  $scope.desc = "";
            }
      };

      var marker; /* create the marker variable to keep a Marker object. first it has a null value*/

      function placeMarker(location) {
            if ( marker ) { /* if marker exist we will change the position of the marker */
                  marker.setPosition(location);
            }
            else {
                  marker = new google.maps.Marker({
                        position: location,
                        map: $scope.map
                  });
            }
            $scope.point = location;
            $scope.$apply(); /* we call this method to apply the changes */
      }
      /*here we are waiting for a click event*/
      google.maps.event.addListener($scope.map, 'click', function(event) {
            placeMarker(event.latLng); /*A LatLng is a point in geographical coordinates: latitude and longitude.*/
      });
}]); // end of contoller MapCtrl


app.controller("dfCtrl",['$scope', '$http', function($scope, $http) {
    $http.get('partials/domande-frequenti.json').success(function(data) {
        $scope.questions = data;
    });
 }]);

app.controller("homeCtrl",['$scope','$http', function($scope, $http){
    $http.get('partials/slider.json').success(function(data){
        $scope.slides = data;
    })
}]);

app.controller("panCtrl",['$scope','$http', function($scope, $http){
    $http.get('partials/panoramica.json').success(function(data){
        $scope.panoramica = data;
    })
}]);



//////////////////////////////////////////////////////////////////////////////
//THE FOLLOWING CODE WILL BE USED IN LATTER UPDATES
//////////////////////////////////////////////////////////////////////////////
/*

app.controller('sportsCtrl', function ($scope, $http) //This controller is responsible for all printing of the betting tickets
{
      //This part requests data from the database
      $http.get("./sports.json")
      .success(function (response) {$scope.sports = response.sports;
            $scope.selected_sport = $scope.sports[0]["id"];
      });
      $http.get("./championships.json")
      .success(function (response) {$scope.championships = response.championships;});
      $http.get("./matches.json")
      .success(function (response) {$scope.matches = response.matches;});
      $http.get("./matches_taxonomy.json")
      .success(function (response) {$scope.matches_taxonomy = response.matches_taxonomy;});

      //////////////////////////////////////////////////////////////////////////////
      //THIS SECTION IS RESPONSIBLE FOR THE SIMPLE PRINTING
      //////////////////////////////////////////////////////////////////////////////

      //This is the COMMIT logo which is added to every printed ticked
      var imgData = 'data:image/png;base64,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';

      //This public function is responsible for quick printing of betting ticket, based on chosen button
      $scope.stampa_rapida = function(id)
      {
            var date = new Date();
            $scope.today_Date = date.getTime();
            var doc = new jsPDF("l"); //New PDF document is initialized
            doc.addImage(imgData, 'PNG', 5, 5, 32, 10);
            var sport_name; //This variable will hold the name of the chosen sport, after it gets pulled from database, based on id
            angular.forEach($scope.sports, function(sport, index) { //This loop takes the response from the sport database and assigns the right name based on given ID
                  if(sport.id==id)
                  sport_name = sport.name;
            });
            doc.setFontSize(40);
            doc.text(65, 25, "Palinsesto per "+sport_name); //This line prints a heading in the PDF page
            doc.setFontSize(8);
            var first = true; //This variable keeps track of the first iteration of the loop below, it only prints the first table cell (heading) with wider width
            doc.cellInitialize(); //This function initializes a grid-system for the PDF document
            angular.forEach($scope.matches_taxonomy, function(match_taxonomy, index) {
                  if(match_taxonomy.id==id) //This finds the right taxonomies for the given ID of the sport
                  {
                        angular.forEach(match_taxonomy.list, function(field, index) { //This loop prints all the fields of the taxonomies
                              if(first==true)
                              {
                                    first=false;
                                    doc.cell(5,50,50,10,field,0);
                              }
                              else
                              doc.cell(5,50,25,10,field,0);
                        });
                  }
            });
            var found = 0;
            angular.forEach($scope.matches, function(match_list, index) //Now this loop iterates the matches database
            {
                  if(match_list.id==id) //First, it finds the right matches object for the given sport ID
                  {
                        var row=1; //This variable keeps track of the actual row for printing data
                        angular.forEach(match_list.list, function(list, index_y) //This loops through the list of matches
                        {
                              //if(list.date >= $scope.today_Date && list.date <= $scope.today_Date+1) <-- THIS CODE ACTIVATES THE FUNCTIONALITY OF PRINTING THE EVENTS OF TODAY ONLY
                              {
                                    found = found + 1;
                                    angular.forEach(list, function(field, index_x) //This loops through every cell of the match data
                                    {
                                          if(index_x=="championship") //If the actual index reaches "championship", since it is only an ID, it needs to find the right name in it's own database
                                          {
                                                angular.forEach($scope.championships, function(sport, index) //Loops through the sports
                                                {
                                                      if(sport.id==id) //Checks for the right sport, given the ID
                                                      angular.forEach(sport.list, function(championship, index) //Loops through every championship for that given sport
                                                      {
                                                            if(championship.id==field) //If the id of the championship is found, the field variable above, gets overwritten with the name, instead of the ID
                                                            field = championship.name;
                                                      });
                                                });
                                          }
                                          if(index_x=="match")
                                          doc.cell(5,50,50,10,field,row);
                                          else
                                          doc.cell(5,50,25,10,field,row);
                                    });
                                    row++;
                              }
                        });
                  }
            });
            if(found!=0)
            doc.save("palinsesto.pdf"); //This function saves the modified PDF document.
            else
            alert("Non ci sono eventi con questi dati, prego provate altri filtri!"); //If the loop doesn't find any result from the database, it pops up an alert
      }

      //////////////////////////////////////////////////////////////////////////////
      //THIS SECTION IS RESPONSIBLE FOR THE ADVANCED PRINTING
      //////////////////////////////////////////////////////////////////////////////

      $scope.stampa_personalizata = function()
      {
            var id = $scope.selected_sport; //This variable holds the ID which is chosen at the sports filter
            var doc = new jsPDF("l"); //This initializes a new blank PDF, in landscape mode, default size is A4
            doc.addImage(imgData, 'PNG', 5, 5, 32, 10);
            var sport_name; //This variable will be used to hold the name of the sport, taken from the database, given only the ID of it
            angular.forEach($scope.sports, function(sport, index) { //This loops the sports database, to find the name of the sport ID
                  if(sport.id==id)
                  sport_name = sport.name;
            });
            doc.setFontSize(40);
            doc.text(65, 25, "Palinsesto per "+sport_name);
            doc.setFontSize(8);
            var first = true; //This variable keeps track of the first iteration of the header row of the table, which should be printed wider than the others
            doc.cellInitialize();
            //As used above, this part will find the taxonomies for the chosen sport, and prepare the header row of the table
            angular.forEach($scope.matches_taxonomy, function(match_taxonomy, index) {
                  if(match_taxonomy.id==id)
                  {
                        var i=10;
                        angular.forEach(match_taxonomy.list, function(field, index) {
                              if(first==true)
                              {
                                    first=false;
                                    doc.cell(5,50,50,10,field,0);
                              }
                              else
                              doc.cell(5,50,25,10,field,0);
                        });
                  }
            });
            var found=0; //If results are found in the database, this will keep track of how many, and in the end will determine if a PDF will be printed or an error will be displayed
            angular.forEach($scope.matches, function(match_list, index) {
                  if(match_list.id==id)
                  {
                        var row=1;
                        angular.forEach(match_list.list, function(list, index_y)
                        {
                              if(list.championship==$scope.selected_champ && list.data >= $scope.date_1 && list.data <= $scope.date_2)
                              {
                                    found=found+1;
                                    angular.forEach(list, function(field, index_x)
                                    {
                                          if(index_x=="championship")
                                          {
                                                angular.forEach($scope.championships, function(sport, index)
                                                {
                                                      if(sport.id==id)
                                                      angular.forEach(sport.list, function(championship, index)
                                                      {
                                                            if(championship.id==field)
                                                            field = championship.name;
                                                      });
                                                });
                                          }
                                          if(index_x=="match")
                                          doc.cell(5,50,50,10,field,row);
                                          else
                                          doc.cell(5,50,25,10,field,row);
                                    });
                                    row++;
                              }
                        });
                  }
            });
            if(found!=0)
            doc.save("palinsesto.pdf");
            else
            alert("Non ci sono eventi con questi dati, prego provate altri filtri!");
      }

      //////////////////////////////////////////////////////////////////////////////
      //THIS SECTION IS RESPONSIBLE FOR HANDLING THE FILTERS IN THE ADVANCED PRINTING
      //////////////////////////////////////////////////////////////////////////////

      //The following variables are used to initialize the date fields in the ADVANCED PRINTING
      var date = new Date();
      $scope.date_1 = date.getTime(); //All date variables will be saved in MILLISECONDS
      $scope.date_2 = null;
      $scope.minDate = $scope.date_1; //Minimum date possible. It isn't logical to select a date for an event that has passed.

      //The following function is responsible for the collapse/expand of the calendars at the ADVANCED PRINTING filters
      $scope.open = function($event, id) {
            $event.preventDefault();
            $event.stopPropagation();
            if(id==1){
                  if($scope.opened_2) //Checks if the other calendar is expanded, so the two calendars don't overlap each-other visually
                  $scope.opened_2=!$scope.opened_2;
                  $scope.opened_1=!$scope.opened_1;
            }
            else if(id==2){
                  if($scope.opened_1) //Checks if the other calendar is expanded, so the two calendars don't overlap each-other visually
                  $scope.opened_1=!$scope.opened_1;
                  $scope.opened_2=!$scope.opened_2;
            }
      };
});

//This module provides a custom directive for angular expressions. Specifically it provides a custom date format for the date-picker elements
app.directive('myformat', function() {
      return {
            require: 'ngModel',
            link: function(scope, element, attrs, ngModel) {
                  ngModel.$parsers.push(function(viewValue) {
                        return +viewValue;
                  });
            }
      }
});
*/
