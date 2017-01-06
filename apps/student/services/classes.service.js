(function() {
    'use strict';
    angular.module('studentApp')
        .factory('ClassesCache', ClassesCache)
        .factory('ClassesService', ClassesService);


    ClassesCache.$inject = ['$cacheFactory'];

    function ClassesCache($cacheFactory) {
        return $cacheFactory('ClassesCache');
    }

    ClassesService.$inject = ['ClassesCache', '$http', '$rootScope', '$localStorage', '$q'];

    function ClassesService(ClassesCache, $http, $rootScope, $localStorage, $q) {
        var service = {};
        initService();
        service.loadAll = loadAll;
        service.loadClassDetail = loadClassDetail;
        service.findClassByCode = findClassByCode;
        service.joinClass = joinClass;
        return service;

        function initService() {
        }

        function loadAll() {
            return $http.get('/api/classes').then(handleSuccess, handleError);
        }

        function loadClassDetail(classId) {
            var deferred = $q.defer();
            //Try to get data from Cache first
            var classCached = ClassesCache.get(classId);
            if (classCached) {
                deferred.resolve(classCached);
                return deferred.promise;
            }
            //Get Data from Database Directly
            var ref = firebase.database().ref("classes/" + classId);
            ref.once('value').then(function(snapshot) {
                var data = snapshot.val();
                if (!data) {
                    return deferred.reject('Not Exist');
                }
                data.loaded = true;
                ClassesCache.put(classId, data);
                deferred.resolve(data);
            }, function(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        }
        function findClassByCode(strCode){
          var refClassCode = firebase.database().ref('class_codes/' + strCode.toUpperCase());
          return refClassCode.once('value').then(function(snapshot) {
              var data = snapshot.val();
              return data;
          }, handleError);
        }
        function joinClass(cls){
          var user = {userId: $rootScope.currentUser.userId, name:$rootScope.currentUser.name};
          var theClass = {classId:cls.classId, name:cls.name};
          return $http.post('/api/classes/join',{'user':user, 'cls':theClass}).then(handleSuccess, handleError);
        }

    }

    // private functions
    function handleSuccess(res) {
        return res.data;
    }

    function handleError(error) {
        console.log(error);
        return error;
    }

})();
