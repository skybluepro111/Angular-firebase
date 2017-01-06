(function() {
    'use strict';
    angular.module('studentApp')
        .factory('NotesCache', NotesCache)
        .factory('NotesService', NotesService);


    NotesCache.$inject = ['$cacheFactory'];

    function NotesCache($cacheFactory) {
        return $cacheFactory('NotesCache');
    }
    NotesService.$inject = ['SettingsService', 'NotesCache', '$http', '$rootScope', '$localStorage', '$q'];

    function NotesService(SettingsService, NotesCache, $http, $rootScope, $localStorage, $q) {
        var service = {};
        initService();
        service.loadAll = loadAll;
        service.loadNoteDetail = loadNoteDetail;
        return service;

        function initService() {
        }

        function loadAll() {
            return $http.get('/api/notes').then(handleSuccess, handleError);
        }

        function loadNoteDetail(noteId) {
            var deferred = $q.defer();
            //Try to get data from Cache first
            var noteCached = NotesCache.get(noteId);
            if (noteCached) {
                deferred.resolve(noteCached);
                return deferred.promise;
            }
            //Get Data from Database Directly
            var ref = firebase.database().ref("notes/" + noteId);
            ref.once('value').then(function(snapshot) {
                var data = snapshot.val();
                if (!data) {
                    return deferred.reject('Not Exist');
                }
                data.videoLengthStr = helper.secondsToMMSS(data.videoLength);
                data.loaded = true;
                if (data.coverFrames != null && data.coverFrames.length > 0) {
                    SettingsService.getUrlByDataCenterId(data.dataCenter).then(function(url) {
                        data.coverFullUrl = url + data.coverFrames[0].imagePath;
                        data.videoFullUrl = url + data.videoPath;
                        NotesCache.put(noteId, data);
                        return deferred.resolve(data);
                    }, function(error) {
                        console.log(error);
                        deferred.reject(error);
                    });
                } else {
                    NotesCache.put(noteId, data);
                    deferred.resolve(data);
                }
            }, function(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        }

        function viewNoteById(noteId) {
            return $http.get('/api/notes/' + noteId).then(handleSuccess, handleError);
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
