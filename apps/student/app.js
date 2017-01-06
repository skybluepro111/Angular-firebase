(function() {
    'use strict';
    //init firebase in Client
    firebase.initializeApp({
        apiKey: "AIzaSyDFvKYcPoNOxgLfTTKIuRMNkJnMcEiLj8c",
        authDomain: "knotester.firebaseapp.com",
        databaseURL: "https://knotester.firebaseio.com",
        storageBucket: "project-6135035707737357701.appspot.com",
    });
    // firebase.initializeApp({
    //     apiKey: "AIzaSyATIHn1GxDChl6JHO0xEAAE5jQgrlSOtBY",
    //     authDomain: "knotester-dev.firebaseapp.com",
    //     databaseURL: "https://knotester-dev.firebaseio.com",
    //     storageBucket: "knotester-dev.appspot.com",
    // });


    const ERROR_APP_INIT = 'error_app_init';
    window.deferredBootstrapper.bootstrap({
        element: window.document.body,
        module: 'studentApp',
        resolve: {
            STARTUP_CONFIG: ['$q', '$http', function($q, $http) {

                var deferred = $q.defer();
                var currentUser = {};

                function loginToServer(data) {
                    var idToken = data;
                    return $http.post('/api/auth/firebaseToken', {
                        'idToken': idToken
                    })
                }
                var unsubscribe = firebase.auth().onAuthStateChanged(function(user) {
                    unsubscribe(); //Check it only once when start up
                    if (user) {
                        firebase.auth().currentUser.getToken(false)
                            .then(loginToServer)
                            .then(function(response) {
                                if (response.data.success) {
                                    currentUser.userId = firebase.auth().currentUser.uid;
                                    deferred.resolve(currentUser);
                                }
                            }, function(error) {
                                currentUser.userId = null;
                                deferred.resolve(ERROR_APP_INIT);
                            });
                    } else {
                        currentUser.userId = null;
                        deferred.resolve(ERROR_APP_INIT);
                    }
                }, function(error) {
                    deferred.resolve(ERROR_APP_INIT);
                });
                return deferred.promise;
            }]
        }
    });




    angular.module('studentApp', [
        'ngRoute',
        'infinite-scroll',
        'ngStorage',
        'minicolors',
        'mp.colorPicker',
        'ui.bootstrap-slider'
      ])
        .config(config)
        .run(run);

    config.$inject = ['STARTUP_CONFIG', '$routeProvider', '$locationProvider'];

    function config(STARTUP_CONFIG, $routeProvider, $locationProvider) {
        $routeProvider.
        when('/login', {
            templateUrl: './student/login/login.html',
            controller: 'LoginCtrl',
            controllerAs: 'vm'
        }).
        when('/notes', {
            templateUrl: './student/notes/notes.html',
            controller: 'NotesCtrl',
            controllerAs: 'vm'
        }).
        when('/classes', {
            templateUrl: './student/classes/classes.html',
            controller: 'ClassesCtrl',
            controllerAs: 'vm'
        }).
        when('/profile', {
            templateUrl: './student/login/profile.html',
            controller: 'ProfileCtrl',
            controllerAs: 'vm'
        }).
        when('/messages', {
            templateUrl: './student/messages/messages.html'
        }).
        when('/homeworks', {
            templateUrl: './student/homeworks/homeworks.html'
        }).
        when('/recover', {
            templateUrl: './student/login/recover.html',
            controller: 'RecoverCtrl',
            controllerAs: 'vm'
        }).
        when('/logout', {
            template: '',
            controller: 'LogoutCtrl',
            controllerAs: 'vm'
        }).
        otherwise({
            redirectTo: '/notes'
        });
    }

    run.$inject = ['STARTUP_CONFIG', 'AuthService', '$rootScope', '$location', '$http', '$localStorage'];

    function run(STARTUP_CONFIG, AuthService, $rootScope, $location, $http, $localStorage) {
        if (STARTUP_CONFIG == ERROR_APP_INIT) {
            $rootScope.currentUser = {};
            $location.path('/login');
            return;
        } else {
            $rootScope.currentUser = STARTUP_CONFIG;
        }
        AuthService.loginToServer().then(function(data) {
            angular.extend($rootScope.currentUser, data);
        }, function(error) {
            $rootScope.currentUser.userId = null;
            $location.path('/login');
        });
        // var authFlag = false;
        // var idToken = '';
        // firebase.auth().onAuthStateChanged(function(user) {
        //     if (user) {
        //         authFlag = true;
        //         // User is signed in.
        //         console.log("Logged In");
        //         var idToken;
        //         firebase.auth().currentUser.getToken(false).then(function(ret) {
        //           idToken =ret;
        //           $http.post('./../api/auth/firebaseToken', {
        //               'idToken': idToken
        //           }).then(function(response) {
        //               console.log(response);
        //               if (response.data.success) {
        //                   $rootScope.currentUser.userId = firebase.auth().currentUser.uid;
        //                   //read user information
        //                    AuthService.loadCurrentUser().then(function(data){
        //                      angular.extend($rootScope.currentUser,data);
        //                      console.log($rootScope.currentUser);
        //                    });
        //               }
        //           }, function(error) {
        //               $rootScope.currentUser.userId = null;
        //               console.error(error);
        //           });
        //         });
        //       } else {
        //         authFlag = false;
        //         $rootScope.currentUser.userId = null;
        //         console.log("Logged Out");
        //       }
        //});


        $rootScope.$on('$locationChangeStart', function(event, next, current) {
            // redirect to login page if not logged in and trying to access a restricted page
            if ($location.path().indexOf('login') < 0) {
                if ($rootScope.currentUser.userId) {
                    //console.log($rootScope.currentUser.userId);
                } else {
                    $location.path('/login');
                }
            } else {}
        });

        $rootScope.logout = function() {
            console.log('click', $rootScope.currentUser);
            $rootScope.currentUser = null;
            firebase.auth().signOut().then(function() {
                $.notify('Successful Logout. Redirecting', 'success');
                window.location = '/';
                $rootScope.$apply();
            }, function(error) {
              console.log(error);
            });
        };
    }
})();
