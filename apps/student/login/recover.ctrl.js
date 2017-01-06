(function() {
    'use strict';
    angular.module('studentApp')
        .controller('RecoverCtrl', RecoverCtrl);
    RecoverCtrl.$inject = ['AuthService', '$rootScope', '$scope', '$location', '$timeout', '$http'];

    function RecoverCtrl(AuthService, $rootScope, $scope, $location, $timeout, $http) {
        var vm = this;
        vm.recover = recover;
        vm.recoverEmail = '';
        vm.recoverErrorsClass = {}
        vm.recoverErrors = [];

        // initController();

        function recover(recoverEmail) {
            vm.recoverErrorsClass = {}
            vm.recoverErrors = [];
            AuthService.recover(vm.recoverEmail, function(result) {
                $.notify('A recovery email has been sent. Check your inbox', 'success');
                $location.path('/');
                $timeout(function() {}, 0);
            },
            function(error) {
                vm.recoverErrors.push(error.message);
                vm.recoverErrorsClass.email = true;
                $scope.$apply();
                vm.dataLoading = false;
            });
        }


    }
})();
