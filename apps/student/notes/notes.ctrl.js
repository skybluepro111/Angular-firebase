(function() {
    'use strict';
    angular.module('studentApp')
        .controller('NotesCtrl', NotesCtrl);
    NotesCtrl.$inject = ['NotesService', '$rootScope', '$scope', '$location', '$timeout', '$localStorage','$window', '$sce'];

    function NotesCtrl(NotesService, $rootScope, $scope, $location, $timeout, $localStorage, $window, $sce) {
        var vm = this;
        vm.loadMoreNotes = loadMoreNotes;
        vm.getNoteId = getNoteId;
        vm.noteClickHandle = noteClickHandle;
        vm.settingsClickHandle = settingsClickHandle;
        vm.AnnotationTranparency = '';
        vm.showMarkers = false;
        vm.showAnnotations = false;

        vm.settings = {
            color: '#000',
            thickness: 1,
            transparency: 1
        };

        vm.customSettings = {
          control: 'hue',
          inline: true,
        };

        initController();

        var firebaseRef = firebase.database();
        var noteId = '';
        var userId = $rootScope.currentUser.userId;
        function getNoteId(note){
            return note.id;
        }

        var firebaseWrapper = {

            UpdateAnnotations: function(annotations) {
                function onComplete(error) {
                    if(error) {
                        console.log("upload error");
                    }
                };
                // Save entire array in firebase at once.
                // Use update() instead of set(). Set overwrites data.
                firebaseRef
                    .ref("annotations")
                    .child(noteId)
                    .child(userId)
                    .update(annotations, onComplete);
            },

            GetNewAnnotationID: function() {
                // Calling push generates a reference to the new data path.
                return firebaseRef
                    .ref("annotations")
                    .child(noteId)
                    .child(userId)
                    .push()
                    .key;
            },

            ReadAllAnnotations: function(callback) {
                firebaseRef
                    .ref("annotations")
                    .child(noteId)
                    .child(userId)
                    .once("value", callback);
            },

            ReadAllBookmarks: function(callback) {
                firebaseRef
                    .ref("bookmarks")
                    .child(noteId)
                    .child(userId)
                    .once("value", callback);
            },

            ReadDataCenter: function(callback) {
                firebaseRef
                    .ref("datacenters")
                    .once("value", callback);
            },

            ReadNoteData: function(callback) {
                firebaseRef
                    .ref("notes")
                    .child(noteId)
                    .once("value", callback);
            },

            WriteBookmark: function(bookmark) {
                firebaseRef
                    .ref("bookmarks")
                    .child(noteId)
                    .child(userId)
                    .push(bookmark);
            },
        }

        var video = '';
        var player;

        var bookmarkArray = [];

        function initController() {
          vm.noteList = [];
          loadUserNotes();

          var drawing = false; // This is true for as long as the line is being drawn.

          // the last coordinates before the current move
          var lastX;
          var lastY;

          var currentX;
          var currentY;

          var settingsCanvas = document.getElementById("setting-canvas");

          var ctx = settingsCanvas.getContext("2d");

          settingsCanvas.addEventListener("mousedown", mouseDownEvent);
          settingsCanvas.addEventListener("touchstart", mouseDownEvent);
          settingsCanvas.addEventListener("mouseup", mouseUpEvent);
          settingsCanvas.addEventListener("mouseout", mouseUpEvent);
          settingsCanvas.addEventListener("touchend", mouseUpEvent);
          settingsCanvas.addEventListener("touchcancel", mouseUpEvent);
          settingsCanvas.addEventListener("touchmove",   mouseMoveEvent);
          settingsCanvas.addEventListener("mousemove", mouseMoveEvent);

          // canvas reset
          function reset(){
            settingsCanvas.width = settingsCanvas.width;
          }

          function draw(lX, lY, cX, cY){
            ctx.beginPath();
            ctx.moveTo(lX,lY);
            ctx.lineTo(cX,cY);
            ctx.lineCap = "round";
            ctx.globalAlpha = vm.settings.transparency/10;
            ctx.lineWidth = vm.settings.thickness;
            ctx.strokeStyle = vm.settings.color;
            ctx.stroke();
            ctx.closePath();
          }

          function mouseUpEvent(event) {
            // stop drawing
            drawing = false;
          }

          function mouseDownEvent(event) {
            if(event.offsetX!==undefined){
              lastX = event.offsetX;
              lastY = event.offsetY;
            } else {
              lastX = event.layerX - event.currentTarget.offsetLeft;
              lastY = event.layerY - event.currentTarget.offsetTop;
            }

            // begins new line
            ctx.beginPath();

            drawing = true;
          }

          function mouseMoveEvent(event){
            if(drawing){
              // get current mouse position
              if(event.offsetX!==undefined){
                currentX = event.offsetX;
                currentY = event.offsetY;
              } else {
                currentX = event.layerX - event.currentTarget.offsetLeft;
                currentY = event.layerY - event.currentTarget.offsetTop;
              }

              draw(lastX, lastY, currentX, currentY);

              // set current coordinates to last one
              lastX = currentX;
              lastY = currentY;
            }
          }

          vm.reset = reset;

        }

        var pageSize = 50;
        var curIndex = 0;
        var noteList = [];

        function loadMoreNotes() {
            for (var i = 0; i < pageSize; i++) {
                if (curIndex < noteList.length) {
                    vm.noteList.push(noteList[curIndex]);
                    loadNoteDetail(noteList[curIndex]);
                    curIndex++;
                }else {
                    break;
                }
            }
        }

        function noteClickHandle(note) {
            noteId = note.id;
            vm.note = note;

            initModal();

            var noteElement = document.getElementById(vm.note.id);
            noteElement.setAttribute('data-toggle', 'modal');
            noteElement.setAttribute('data-target', '#notes-modal');


        }

        function settingsClickHandle() {
            var settingsElement = document.getElementById('settings');
            settingsElement.setAttribute('data-toggle', 'modal');
            settingsElement.setAttribute('data-target', '#settings-modal');


        }

        $('#notes-modal').on('hidden.bs.modal', function (e) {
            var parentNode = document.getElementById("Video").parentNode;

            noteId = '';
            player.dispose();


            var videoElement = document.createElement('Video');

            videoElement.id = 'Video';
            videoElement.className = 'video-js vjs-default-skin vjs-nofull vjs-fullscreen-control';
            videoElement.setAttribute('height', 'auto');
            videoElement.setAttribute('width', 'auto');
            videoElement.setAttribute('controls', '');
            videoElement.setAttribute('autoplay', '');

            parentNode.appendChild(videoElement);

        });

        $(document).on('show.bs.modal', '.modal', function(event) {
          var zIndex = 1040 + (10 * $('.modal:visible').length);
          $(this).css('z-index', zIndex);
          setTimeout(function() {
            $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
          }, 0);
        });


        function initModal(note) {
            firebaseWrapper.ReadAllBookmarks( function(snapshot){
                var bookmarks = snapshot.val();
                var markers   = [];
                bookmarkArray = [];
                vm.bookmarks = [];

                for(var element in bookmarks) {
                    var bookmark = bookmarks[element];
                    markers.push({time: bookmark.position, text: bookmark.type});

                    FormatBookmark(bookmark);
                    bookmarkArray.push(bookmark);
                }

                vm.bookmarks = bookmarkArray;


                video = document.getElementById('Video');
                var videoSource = document.createElement("source");
                videoSource.src = $sce.trustAsResourceUrl(vm.note.videoFullUrl);
                videoSource.type = "video/mp4";
                video.appendChild(videoSource);

                video.addEventListener("loadedmetadata", AnnotationControl(video));

                LoadVideoPlayer(markers);

                $scope.$apply();


            });



            vm.user = $rootScope.currentUser;
            vm.AnnotationColor        = "Green"; // Default color
            vm.AnnotationThickness    = 8;       // Default thickness

            // Functions in scope
            vm.SaveBookmark           = SaveBookmark;
            vm.SetAnnotationColor     = SetAnnotationColor;
            vm.SetAnnotationThickness = SetAnnotationThickness;
            vm.SetVideoTime           = SetVideoTime;
            vm.toggleMarkers          = toggleMarkers;
            vm.toggleAnnotations      = toggleAnnotations;
            vm.saveAnnotationsPresets = saveAnnotationsPresets;
        }

        function LoadVideoPlayer(markers) {
            player = videojs(video);
            player.markers({
                markerTip:{
                    display: true,
                    text: function(marker){
                        return marker.text;
                    }
                },
                markers: markers
            });
        }

        function SaveBookmark(bookmarkType) {
            var bookmarkTime = parseInt(video.currentTime, 10);

            var newBookmark = {
                 position: bookmarkTime,
                 type: bookmarkType
            };

            firebaseWrapper.WriteBookmark(newBookmark);

            // Add new marker on timeline
            player.markers.add([{
                time: bookmarkTime,
                text: bookmarkType
            }]);

            // Make a new locally stored bookmark
            FormatBookmark(newBookmark);
            bookmarkArray.push(newBookmark);
            vm.bookmarks = bookmarkArray;
        }

        function FormatBookmark(bookmark) {
            bookmark.htmlClass = "";
            bookmark.icon      = "";

            if(bookmark.type == "test") {
                bookmark.htmlClass = "list-group-item list-group-item-success";
                bookmark.icon = "icons/bm_test.png";

            } else if(bookmark.type == "review") {
                bookmark.htmlClass = "list-group-item list-group-item-info";
                bookmark.icon = "icons/bm_review.png";

            } else if(bookmark.type == "question") {
                bookmark.htmlClass = "list-group-item list-group-item-warning";
                bookmark.icon = "icons/bm_question.png";

            } else if(bookmark.type == "important") {
                bookmark.htmlClass = "list-group-item list-group-item-danger";
                bookmark.icon = "icons/bm_important.png";

            } else if(bookmark.type == "audio") {
                bookmark.htmlClass = "list-group-item list-group-item-success";
                bookmark.icon = "icons/bm_audio.png";
            }

            // Set time for bookmark
            bookmark.sec = bookmark.position % 60;
            bookmark.min = Math.floor(bookmark.position / 60);

            return bookmark;
        }

        function DrawLine(prevX, prevY, currX, currY, width, color, context) {
            context.beginPath();
            context.moveTo(prevX, prevY);
            context.lineTo(currX, currY);
            context.lineCap     = "round";
            context.lineWidth   = width;
            context.strokeStyle = color;
            context.stroke();
            context.closePath();
        }

        function IsOdd(number) {
            return number % 2 ==  1 ||
                number % 2 == -1;
        }

        function DrawExistingAnnotation(Annotations, context) {
            for(var a=0; a < Annotations.length; a++) {
                var DataArray = Annotations[a].data;
                var width     = Annotations[a].thickness;
                var color     = Annotations[a].color;

                if(IsOdd(DataArray.length)) continue;

                var currX = DataArray[0];
                var currY = DataArray[1];


                for(var i=0; i < DataArray.length-1; i+=2) {
                    var prevX = currX;
                    var prevY = currY;

                    currX = DataArray[i];
                    currY = DataArray[i+1];

                    DrawLine(prevX, prevY, currX, currY,
                             width, color, context);
                }
            }
        }

        function SetAnnotationColor(color) {
            vm.AnnotationColor = color;
        }

        function SetAnnotationThickness(thickness) {
            vm.AnnotationThickness = thickness
        }

        function SetVideoTime(time) {
            video.currentTime = time;
        }

        // Video drawing
        function AnnotationControl(newVideo) {

            var videoWidth  = newVideo.videoWidth;
            var videoHeight = newVideo.videoHeight;

            var playerWidth  = 621;//newVideo.offsetWidth;
            var playerHeight = 349;//newVideo.offsetHeight;

            var layerAnnotation    = document.getElementById("annotation");
            layerAnnotation.width  = playerWidth;
            layerAnnotation.height = playerHeight-50;
            var contextAnnotation  = layerAnnotation.getContext("2d");

            var unsavedUserAnnotations = false;
            var drawing                = false; // This is true for as long as the line is being drawn.
            var LineBeginning          = false; // This is true only when the line starts, then it is false.

            var FullResAnnotations     = []; // Full resolution annotations from firebase
            var PlayerResAnnotations   = []; // Annotations scaled to the video player

            // Because of touch screens displays, there can be multiple
            // simultaneous lines that are actively being drawn.
            var CurrentLines       = []; // Array of arrays of unsaved line points.
            var UnsavedAnnotations = [];

            var AnnotationIds      = []; // Firebase ids for new annotations
            var AnnotationBeginTime; // This is the start time of the current annotation being drawn.


            firebaseWrapper.ReadAllAnnotations( function(snapshot) {
                var FirebaseSnapshot = snapshot.val();

                FullResAnnotations = [];

                for(var Id in FirebaseSnapshot) {
                    if(!FirebaseSnapshot.hasOwnProperty(Id)) {
                        continue; // Make sure FirebaseSnapshot has property annotation.
                    }
                    var annotation = FirebaseSnapshot[Id];

                    var SplitString = annotation.data.split(",");

                    // Remove tailing space from array data.
                    SplitString.splice(SplitString.length - 1, 1);
                    if(IsOdd(SplitString.length)) continue;



                    var DataArray = [];

                    for(var i=0; i < SplitString.length; i+=2) {
                        DataArray[i]   = parseInt(SplitString[i],   10);
                        DataArray[i+1] = parseInt(SplitString[i+1], 10);
                    }

                    // Save annotation data in array.
                    var AnnotationData = {
                        color:     annotation.color,
                        data:      DataArray,
                        end:       annotation.end,
                        start:     annotation.start,
                        thickness: annotation.thickness
                    };


                    FullResAnnotations.push(AnnotationData);
                }
                RedrawAnnotations(true);
            });

            // This function draws annotations on the canvas from two sources:
            // 1. The current saved user annotations.
            // 2. The current unsaved user annotations.

            function RedrawAnnotations(RescaleAnnotations) {

                videoWidth  = newVideo.videoWidth;
                videoHeight = newVideo.videoHeight;

                playerWidth  = newVideo.offsetWidth;
                playerHeight = newVideo.offsetHeight;

                // Check if video player resolution has changed since last drawing.
                if(RescaleAnnotations == true) {
                    PlayerResAnnotations = [];

                    // Copy object FullResAnnotations into PlayerResAnnotations
                    for(var a in FullResAnnotations) {
                        var object = new Object();

                        object.data = []
                        for(var i=0; i < FullResAnnotations[a].data.length; i++) {
                            object.data[i] = FullResAnnotations[a].data[i];
                        }
                        object.color     = FullResAnnotations[a].color;
                        object.end       = FullResAnnotations[a].end;
                        object.start     = FullResAnnotations[a].start;
                        object.thickness = FullResAnnotations[a].thickness;

                        PlayerResAnnotations.push(object);
                    }

                    // Annotations need to be scaled from video coordinates to
                    // the new player coordinates.
                    for(var a in PlayerResAnnotations) {
                        var DataArray = PlayerResAnnotations[a].data;
                        if(IsOdd(DataArray.length)) continue;

                        // // Convert from video coordinates to relative coodinates.
                        for(var i=0; i < DataArray.length; i+=2) {
                            var relativeX = DataArray[i]   / videoWidth  * playerWidth;
                            var relativeY = DataArray[i+1] / videoHeight * playerHeight;

                            DataArray[i]   = parseInt(relativeX, 10);
                            DataArray[i+1] = parseInt(relativeY, 10);
                        }


                        PlayerResAnnotations[a].data = DataArray;
                    }
                }

                contextAnnotation.clearRect(0, 0, layerAnnotation.width, layerAnnotation.height);
                var currentVideoTime = parseInt(newVideo.currentTime, 10);


                // 1. Draw existing annotations from PlayerResAnnotations array.
                for(var currentAnnotation in PlayerResAnnotations) {
                    if(!PlayerResAnnotations.hasOwnProperty(currentAnnotation)) {
                        continue;
                    }
                    var annotation = PlayerResAnnotations[currentAnnotation];

                    if(annotation.start <= currentVideoTime) {
                        if(annotation.end > currentVideoTime) {

                            DrawExistingAnnotation([annotation], contextAnnotation);
                        }
                    }
                }

                // 2. Draw existing unsaved user annotations
                if(unsavedUserAnnotations) {

                    DrawExistingAnnotation(UnsavedAnnotations, contextAnnotation);

                    // Redraw current line(s) that are still being made by the user.
                    for(var i = 0; i < CurrentLines.length; i++) {
                        var CurrentUnsavedAnnotation = {
                            color: vm.AnnotationColor,
                            data:  CurrentLines[i],
                            end:   undefined,
                            start: AnnotationBeginTime,
                            thickness: vm.AnnotationThickness
                        };


                        DrawExistingAnnotation([CurrentUnsavedAnnotation], contextAnnotation);
                    }
                }
            };

            function ClearUnsavedUserAnnotations() {
                UnsavedAnnotations     = [];
                AnnotationIds          = [];
                CurrentLines           = [];
                unsavedUserAnnotations = false;
            }

            //NOTE: currently this clears AND saves the annotations
            var SaveAnnotations = function() {
                if(unsavedUserAnnotations) {
                    videoWidth  = newVideo.videoWidth;
                    videoHeight = newVideo.videoHeight;

                    playerWidth  = newVideo.offsetWidth;
                    playerHeight = newVideo.offsetHeight;

                    // Upload annotations to firebase.
                    var FirebaseAnnotationData = new Object();

                    var EndTime = parseInt(newVideo.currentTime, 10) -1;
                    for(var a = 0; a < UnsavedAnnotations.length; a++) {

                        // Video seek bar allows end time to be less than start time.
                        if(EndTime <= UnsavedAnnotations[a].start) {
                            continue;
                        }

                        var LineData    = UnsavedAnnotations[a].data;
                        var ArrayString = "";



                        // Change data array from screen to video coordin÷
                        for(var number=0; number < LineData.length; number+=2) {
                            LineData[number]   = LineData[number]   / playerWidth  * videoWidth;
                            LineData[number+1] = LineData[number+1] / playerHeight * videoHeight;

                            var firebaseX = parseInt(LineData[number],   10);
                            var firebaseY = parseInt(LineData[number+1], 10);

                            ArrayString = ArrayString.concat(firebaseX, ", ",
                                                             firebaseY, ", ");
                        }

                        // Firebase data
                        var firebasedata = {
                            color:     UnsavedAnnotations[a].color,
                            data:      ArrayString,
                            end:       EndTime,
                            start:     UnsavedAnnotations[a].start,
                            thickness: UnsavedAnnotations[a].thickness
                        };

                        // Pair data for firebase with unique firebase id.
                        FirebaseAnnotationData[AnnotationIds[a]] = firebasedata;

                        // Save our annotation locally as well.
                        FullResAnnotations.push({
                            color:     UnsavedAnnotations[a].color,
                            data:      LineData,
                            end:       EndTime,
                            start:     UnsavedAnnotations[a].start,
                            thickness: UnsavedAnnotations[a].thickness
                        });
                    }

                    // Save entire array in firebase at once.
                    firebaseWrapper.UpdateAnnotations(FirebaseAnnotationData)

                    ClearUnsavedUserAnnotations();
                    RedrawAnnotations(true);
                }

            };

            vm.SaveAnnotations = SaveAnnotations;


            // Redraw annotations if seeking is done in the video timeline.
            newVideo.onseeked = function() {
                RedrawAnnotations();
            }


            // SetInterval for updating annotations on the video.
            window.setInterval(function() {
                var currentVideoTime = parseInt(newVideo.currentTime, 10);

                for(var a in FullResAnnotations) {
                    if(FullResAnnotations[a].start == currentVideoTime ||
                       FullResAnnotations[a].end   == currentVideoTime ) {
                        RedrawAnnotations();
                        break;
                    }
                }
            }, 1000); // Check once per second


            window.addEventListener("resize", function() {
                playerWidth  = newVideo.offsetWidth;
                playerHeight = newVideo.offsetHeight;

                layerAnnotation.width  = playerWidth;
                layerAnnotation.height = playerHeight-50;

                ClearUnsavedUserAnnotations();
                RedrawAnnotations(true);
            });



            function HandleEvent(event) {

                var PushUnsavedAnnotation = false;
                var DrawLines             = false;

                var offset = layerAnnotation.getBoundingClientRect();

                if(event.type === "mousedown" ||
                   event.type === "touchstart") {
                    drawing       = true;
                    LineBeginning = true;
                }
                else if(event.type === "mouseup" ||
                        event.type === "mouseout" ||
                        event.type === "touchend" ||
                        event.type === "touchcancel") {

                    PushUnsavedAnnotation = true;
                }
                else if(event.type === "mousemove") {
                    if(drawing) {

                        if(CurrentLines[ CurrentLines.length -1 ] == undefined) {
                            CurrentLines.push([]);
                        }

                        // Add mousemove event points at end of CurrentLines array
                        // just in case there is any touch data currently also in the array.
                        var MaxPosition = CurrentLines.length -1;

                        var eventX = event.clientX - parseInt(offset.left, 10);
                        var eventY = event.clientY - parseInt(offset.top, 10);

                        eventX = parseInt(eventX, 10);
                        eventY = parseInt(eventY, 10);

                        CurrentLines[ MaxPosition ].push(eventX);
                        CurrentLines[ MaxPosition ].push(eventY);

                        DrawLines = true;
                    }
                }
                else if(event.type === "touchmove" ||
                        event.targetTouches.length >= 1) {

                    if(drawing) {
                        // Touch screens support multiple simultaneous touches.
                        var NumberOfTouches = event.targetTouches.length;

                        for(var i = 0; i < NumberOfTouches; i++) {

                            if(CurrentLines[i] == undefined) {
                                CurrentLines.push([]);
                            }

                            var touch = event.targetTouches[i]
                            var eventX = touch.clientX - offset.left;
                            var eventY = touch.clientY - offset.top;

                            eventX = parseInt(eventX, 10);
                            eventY = parseInt(eventY, 10);

                            CurrentLines[i].push(eventX);
                            CurrentLines[i].push(eventY);

                            DrawLines = true;
                        }
                    }
                }

                if(PushUnsavedAnnotation) {
                    for(var i = 0; i < CurrentLines.length; i++) {
                        var CurrentLine = CurrentLines[i];

                        if(CurrentLine.length > 0 && !IsOdd(CurrentLine.length)) {

                            var LocalAnnotation = { color: vm.AnnotationColor,
                                                    data:  CurrentLine,
                                                    end:   undefined,
                                                    start: AnnotationBeginTime,
                                                    thickness: vm.AnnotationThickness }

                            UnsavedAnnotations.push(LocalAnnotation);
                        }
                    }
                    CurrentLines = [];
                    drawing      = false;
                }

                if(DrawLines) {

                    for(var i = 0; i < CurrentLines.length; i++) {
                        var CurrentLine = CurrentLines[i];

                        // Limit line length to 500 points (1,000 x / y).
                        if(drawing && (CurrentLine.length < 1000)) {

                            var LengthOfPointList = CurrentLine.length;

                            // Skip if there is only one x y pair in the array.
                            if(LengthOfPointList <= 2) { break; }

                            // LengthOfPointList -1 and -2 are the x y coordinates of the last touch event.
                            // LengthOfPointList -3 and -4 are the x y coordinates of the touch event before that.
                            var prevX = CurrentLine[ LengthOfPointList -4 ];
                            var prevY = CurrentLine[ LengthOfPointList -3 ];
                            var currX = CurrentLine[ LengthOfPointList -2 ];
                            var currY = CurrentLine[ LengthOfPointList -1 ];

                            DrawLine(prevX, prevY, currX, currY,
                                     vm.AnnotationThickness, vm.AnnotationColor,
                                     contextAnnotation );

                            if(LineBeginning) {
                                AnnotationBeginTime = parseInt(newVideo.currentTime, 10);
                                LineBeginning = false;
                                unsavedUserAnnotations = true;

                                // Create annotation ID for uploading to firebase.
                                var id = firebaseWrapper.GetNewAnnotationID();
                                AnnotationIds.push(id);
                            }
                        }
                    }
                }
            }

            layerAnnotation.addEventListener("mousedown", HandleEvent);
            layerAnnotation.addEventListener("mouseup",   HandleEvent);
            layerAnnotation.addEventListener("mousemove", HandleEvent);
            layerAnnotation.addEventListener("mouseout",  HandleEvent);

            layerAnnotation.addEventListener("touchstart",  HandleEvent);
            layerAnnotation.addEventListener("touchend",    HandleEvent);
            layerAnnotation.addEventListener("touchcancel", HandleEvent);
            layerAnnotation.addEventListener("touchmove",   HandleEvent);
        }

        function loadUserNotes() {
            NotesService.loadAll().then(function(notes) {
                var newNoteList = [];
                for (var key in notes) {
                    var note = notes[key];
                    note.id = key;
                    newNoteList.unshift(note);
                }
                noteList = newNoteList;
                loadMoreNotes();
                if (noteList.length == 0) {
                  $location.path("/classes");
                }
            }, function(error) {
                console.log(error);
            });
        };

        function loadNoteDetail(note) {
            vm.dataLoading = true;
            NotesService.loadNoteDetail(note.id).then(function(data) {
                angular.extend(note, data);
                vm.dataLoading = false;
            }, function(error) {
                console.log(error);
            });
        }

        function saveAnnotationsPresets() {
            console.log('clicked');
        }

        function toggleMarkers() {
            vm.showMarkers = !vm.showMarkers;
        }

        function toggleAnnotations() {
            vm.showAnnotations = !vm.showAnnotations;
        }

    }

})();
