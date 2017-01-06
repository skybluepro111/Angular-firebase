(function() {
    'use strict';
    angular.module('studentApp')
        .controller('ClassesCtrl', ClassesCtrl);
    ClassesCtrl.$inject = ['ClassesService', '$rootScope', '$scope', '$location', '$timeout'];

    function ClassesCtrl(ClassesService, $rootScope, $scope, $location, $timeout) {
        var vm = this;
        vm.classJoinHandle = classJoinHandle;
        vm.classClickHandle = classClickHandle;
        vm.findClassByCode = findClassByCode;
        initController();

        function initController() {
            vm.classList = [];
            loadUserClasses();
        }

        var classList = [];

        function loadUserClasses() {
            ClassesService.loadAll().then(function(classes) {
                var newClassList = [];
                for (var key in classes) {
                    var cls = classes[key];
                    cls.id = key;
                    loadClassDetail(cls);
                    newClassList.unshift(cls);
                }
                classList = newClassList;
                vm.classList = classList;
                if (classList.length == 0) {
                    vm.welcome = true;
                } else {
                    vm.welcome = false;
                }
                // console.log(vm.welcome);
                $timeout(function() {}, 0);
            }, function(error) {
                console.log(error);
            });
        };

        function loadClassDetail(cls) {
            vm.dataLoading = true;
            ClassesService.loadClassDetail(cls.id).then(function(data) {
                angular.extend(cls, data);
                vm.dataLoading = false;
            }, function(error) {
                console.log(error);
            });
        }

        function findClassByCode(strCode) {
            //Test F0728378
            if (strCode.length < 3) {
                vm.codedClass = null;
                return;
            }
            ClassesService.findClassByCode(strCode).then(function(data) {
                $timeout(function() {
                    vm.codedClass = data;
                }, 0);
            }, function(error) {
                vm.codedClass = null;
                console.log(error);
            });
        }

        function classJoinHandle(cls) {
            vm.enteringCode = false;
            ClassesService.joinClass(cls).then(function(data) {
                console.log("Jion Class: %j", data);
                vm.codedClass = null;
                if (data.success == true) {
                    loadUserClasses();
                }
            }, function(error) {
                console.log(error);
            });
        }

        function classClickHandle(cls) {
            console.log(cls.name);
        }

    }
})();
