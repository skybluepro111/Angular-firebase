(function() {
    'use strict';
    angular.module('studentApp')
        .controller('LoginCtrl', LoginCtrl);
    LoginCtrl.$inject = ['AuthService', '$rootScope', '$scope', '$location', '$timeout', '$http'];

    function LoginCtrl(AuthService, $rootScope, $scope, $location, $timeout, $http) {
        var vm = this;
        vm.login = login;
        vm.signup = signup;
        vm.signupErrors = [];
        vm.loginErrors = [];
        vm.signupErrorsClass = {};
        vm.loginErrorsClass = {};
        vm.showPassword = false;
        vm.showPassword2 = false;
        vm.toggleShowPassword = toggleShowPassword;
        vm.toggleShowPassword2 = toggleShowPassword2;
        vm.pageNumber = 1;
        vm.changePage = changePage;

        initController();

        function initController() {}

        function changePage(number) {
            $timeout(function() {
                vm.pageNumber = number;
                initController();
            }, 100);
        }

        function login() {
            vm.loginErrors = [];
            vm.loginErrorsClass = {};
            vm.dataLoading = true;
            AuthService.Login(vm.email, vm.password, function(result) {
                    $.notify('Successful Login. Redirecting', 'success');
                    $location.path('/');
                    $timeout(function() {}, 0);
                },
                function(error) {
                    vm.loginErrors.push(error.message);
                    vm.loginErrorsClass.password = true;
                    vm.loginErrorsClass.email = true;
                    $scope.$apply();
                    vm.dataLoading = false;
                });
        };

        function signup() {
            vm.showPassword = false;
            vm.showPassword2 = false;
            vm.signupErrorsClass = {}
            vm.signupErrors = [];
            if (vm.password.length < 6) {
                vm.signupErrors.push('Password must be more than 6 characters');
                vm.signupErrorsClass.password = true;
            }
            if (vm.password != vm.password2) {
                vm.signupErrors.push('Password must be same');
                vm.signupErrorsClass.password = true;
                vm.signupErrorsClass.password2 = true;
            }

            if(vm.signupErrors.length === 0) {
                var user = {
                    firstName: vm.firstName,
                    lastName: vm.lastName,
                    email: vm.email,
                    password: vm.password
                }
                AuthService.signUp(user, function(result) {
                    var newUser = firebase.auth().currentUser;
                    newUser.sendEmailVerification();
                    $.notify('Registration Successful. A verification email has been sent to your email address', 'success');

                    $location.path('/');
                    $timeout(function() {}, 0);
                },
                function(error) {
                    vm.signupErrors.push(error.message);
                    $scope.$apply();
                    vm.dataLoading = false;
                })
            }


        }

        function toggleShowPassword() {
            vm.showPassword = !vm.showPassword;
        }

        function toggleShowPassword2() {
            vm.showPassword2 = !vm.showPassword2;
        }
    }
})();
