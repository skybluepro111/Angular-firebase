(function() {
    'use strict';
    angular.module('studentApp')
        .controller('LogoutCtrl', LogoutCtrl);
    LogoutCtrl.$inject = ['$rootScope', '$scope', '$location', '$timeout'];

    function LogoutCtrl($rootScope, $scope, $location, $timeout) {
        function logout() {
            firebase.auth().signOut().then(function() {
                $.notify('Successful Logout. Redirecting', 'success');
                $rootScope.currentUser = {};
                $location.path('/login');
                $rootScope.$apply();
            }, function(error) {
              console.log(error);
            });
        }

        logout();


    }
})();
