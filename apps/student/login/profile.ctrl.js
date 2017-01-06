(function() {
    'use strict';
    angular.module('studentApp')
        .controller('ProfileCtrl', ProfileCtrl);
    ProfileCtrl.$inject = ['AuthService', '$rootScope', '$scope', '$location', '$timeout', '$http'];

    function ProfileCtrl(AuthService, $rootScope, $scope, $location, $timeout, $http) {
        var vm = this;
        vm.checkEdit = checkEdit;
        vm.profileUpdating = false;
        vm.passwordUpdating = false;
        vm.emailUpdating = false;
        vm.saveProfile = saveProfile;
        vm.changePassword = changePassword;
        vm.changeEmail = changeEmail;
        vm.changePasswordErrorsClass = {}
        vm.changePasswordErrors = [];
        vm.changeEmailErrorsClass = {}
        vm.changeEmailErrors = [];
        vm.oldMail = $rootScope.currentUser.email;
        vm.pageNumber = 1;
        vm.changePage = changePage;
        initController();

        function initController() {
            AuthService.loadCurrentUser().then(function(data) {
                angular.extend($rootScope.currentUser, data);
                vm.firstName = $rootScope.currentUser.firstName;
                vm.lastName = $rootScope.currentUser.lastName;
                vm.phone = $rootScope.currentUser.phone;
            });
        }

        function checkEdit() {
            if (($rootScope.currentUser.firstName == vm.firstName) && ($rootScope.currentUser.lastName == vm.lastName) && ($rootScope.currentUser.phone == vm.phone)) {
                vm.edited = false;
                $('#profile-submit').val('OK');
            } else {
                vm.edited = true;
                $('#profile-submit').val('Update');
            }
        }

        function saveProfile() {
            var user = {};
            vm.profileUpdating = true;
            user.firstName = vm.firstName;
            user.lastName = vm.lastName;
            user.phone = vm.phone;
            user.userId = $rootScope.currentUser.userId;
            user.email = $rootScope.currentUser.email;
            AuthService.SaveProfile(user).then(function(data) {
                $.notify('Your information has been saved', 'success');
                angular.extend($rootScope.currentUser, data);
                vm.profileUpdating = false;
            }, function(error) {
                vm.profileUpdating = false;
            });
        }

        function changeEmail () {
            vm.changeEmailErrorsClass = {}
            vm.changeEmailErrors = [];
            vm.emailUpdating = true;

            if (vm.changeEmailErrors.length === 0) {
                var user = firebase.auth().currentUser;
                var credential = firebase.auth.EmailAuthProvider.credential(
                    $rootScope.currentUser.email,
                    vm.password
                );

                user.reauthenticate(credential).then(function() {
                  // User re-authenticated.
                  user.updateEmail(vm.email).then(function() {
                      // Update successful.
                     var owner = $rootScope.currentUser;
                     owner.email = vm.email;
                     AuthService.SaveProfile(owner).then(function(data) {
                          $.notify('Your email has been changed. Mail sent', 'success');
                          user.sendEmailVerification();
                          vm.password = '';
                          vm.email = '';
                          vm.emailUpdating = false;
                          angular.extend($rootScope.currentUser, data);

                    }, function(error) {
                        vm.changeEmailErrors.push(error.message);
                        vm.changeEmailErrorsClass.email = true;
                        vm.emailUpdating = false;
                        $scope.$apply();
                    });
                  }, function(error) {
                      vm.changeEmailErrors.push(error.message);
                      vm.changeEmailErrorsClass.email = true;
                      vm.emailUpdating = false;
                      $scope.$apply();
                  });
                }, function(error) {
                  // An error happened.
                  vm.changePasswordErrors.push(error.message);
                  vm.changeEmailErrorsClass.password = true;
                  vm.emailUpdating = false;
                  $scope.$apply();
                });
            } else {
                vm.emailUpdating = true;
            }
        }

        function changePage(number) {
            $timeout(function() {
                vm.pageNumber = number;
                initController();
            }, 100);
        }

        function changePassword() {
            vm.changePasswordErrorsClass = {}
            vm.changePasswordErrors = [];
            vm.passwordUpdating = true;

            if (vm.newPassword.length < 6) {
                vm.changePasswordErrors.push('Password must be more than 6 characters');
                vm.changePasswordErrorsClass.newPassword = true;
            }
            if (vm.newPassword != vm.confirmPassword) {
                vm.changePasswordErrors.push('Password must be same');
                vm.changePasswordErrorsClass.newPassword = true;
                vm.changePasswordErrorsClass.confirmPassword = true;
            }

            if(vm.changePasswordErrors.length === 0) {
                var user = firebase.auth().currentUser;
                var credential = firebase.auth.EmailAuthProvider.credential(
                    $rootScope.currentUser.email,
                    vm.currentPassword
                );
                // Prompt the user to re-provide their sign-in credentials

                user.reauthenticate(credential).then(function() {
                  // User re-authenticated.
                  user.updatePassword(vm.newPassword).then(function() {
                      // Update successful.
                    $.notify('Password has been changed successfully', 'success');
                    vm.newPassword = '';
                    vm.confirmPassword = '';
                    vm.currentPassword = '';
                    vm.passwordUpdating = false;
                    $scope.$apply();
                  }, function(error) {
                      vm.changePasswordErrors.push(error.message);
                      vm.changePasswordErrorsClass.currentPassword = true;
                      vm.confirmPassword = '';
                      vm.currentPassword = '';
                      vm.newPassword = '';
                      vm.passwordUpdating = false;
                      $scope.$apply();
                  });
                }, function(error) {
                  // An error happened.
                  vm.changePasswordErrors.push(error.message);
                  vm.changePasswordErrorsClass.currentPassword = true;
                  vm.confirmPassword = '';
                  vm.currentPassword = '';
                  vm.newPassword = '';
                  vm.passwordUpdating = false;
                  $scope.$apply();
                });
            } else {
                vm.passwordUpdating = false;
            }
        }
    }
})();
