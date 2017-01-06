(function() {
    'use strict';
    angular.module('studentApp')
        .factory('SettingsCache', SettingsCache)
        .factory('SettingsService', SettingsService);

    SettingsCache.$inject = ['$cacheFactory'];
    function SettingsCache($cacheFactory) {
        return $cacheFactory('SettingsCache');
    }

    SettingsService.$inject = ['SettingsCache', '$http', '$rootScope', '$localStorage','$q'];
    function SettingsService(SettingsCache, $http,  $rootScope, $localStorage, $q) {
        var service = {};
        initService();
        service.getUrlByDataCenterId = getUrlByDataCenterId;        
        return service;

        function initService(){
          //load Datacenters;
          var ref = firebase.database().ref("datacenters/");
          ref.once('value').then(function(snapshot) {
              var data = snapshot.val();
              SettingsCache.put('dataCenters', data);
              console.log('SET datacenters to cache');
          }, handleError);
        }
        function getUrlByDataCenterId(datacenterId) {
          var deferred = $q.defer();
          var dataCentersCached = SettingsCache.get('dataCenters');
          if (dataCentersCached) {
            console.log('load datacenters from cache');
            deferred.resolve(dataCentersCached[datacenterId].url);
            return deferred.promise;
          }
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
