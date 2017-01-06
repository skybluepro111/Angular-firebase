/*
1. Get user's notes list
2. Get Note Detail directly from firebase database.
3.
*/
var express = require('express');
var router = express.Router();

var fb = require('../../config/firebase.js');
/* GET notes list. */
router.get('/', function(req, res, next) {
    var ref = fb.db.ref("user_notes/" + req.session['userId']);
    ref.once("value", function(snapshot) {
        var dict = {};
        snapshot.forEach(function(userNoteSnapshot) {
            var key = userNoteSnapshot.key;
            var data = userNoteSnapshot.val();
            if (data.status == 'read' || data.status == 'published' || req.session['userType'] == 'teacher') {
                dict[key] = data;
            }
        });
        res.json(dict)
    });
});

/*View a note*/
router.get('/:noteId', function(req, res, next) {
    //Please Get Note Detail directly from firebase database.
    var ref = fb.db.ref("user_notes/" + req.session['userId'] + "/" + req.params.noteId);
    ref.update({
        status: 'read'
    });
    res.json({
        success: true
    });
});
//Create a new Note
router.post('/', function(req, res, next) {
    var verifiedData = req.body; //We Can Change / Verify Data at here.
    verifiedData.createdOn = fb.TIMESTAMP;
    verifiedData.teacher = req.session['userId'];
    var newKey = fb.db.ref('notes').push().key;
    var updates = {};
    updates['/notes/' + newKey] = verifiedData;
    fb.db.ref().update(updates);
    verifiedData.id = newKey;
    updateUserNotesStatus(verifiedData, verifiedData.status, function() {});
    var ret = {};
    ret[newKey] = verifiedData;
    return res.json(ret);
});

//Update Note
router.put('/:noteId', function(req, res, next) {
    var verifiedData = req.body; //We Can Change / Verify Data at here.
    var noteId = req.params.noteId;
    if (!noteId) {
      return res.status(404).json({
            success: false,
            message: 'noteId is required!'
      });
    }
    var ref = fb.db.ref("notes/" + noteId);
    ref.update(verifiedData);
    verifiedData.id = noteId;
    updateUserNotesStatus(verifiedData, verifiedData.status, function() {});
    var ret = {};
    ret[noteId] = verifiedData;
    return res.json(ret);
});
//Update Note
router.put('/:noteId/status', function(req, res, next) {
    var verifiedData = req.body; //We Can Change / Verify Data at here.
    var noteId = req.params.noteId;
    if (!noteId) {
        return res.status(404).json({
            success: false,
            message: 'noteId is required!'
        });
    }
    var ref = fb.db.ref("notes/" + noteId);
    ref.update(verifiedData);
    verifiedData.id = noteId;
    updateUserNotesStatus(verifiedData, verifiedData.status, function() {});
    return res.json(verifiedData);
});
//delete note


function updateUserNotesStatus(note, status, callback) {
    //Read Students in Classes
    var ref = fb.db.ref("classes/" + note.classId);
    ref.once('value').then(function(snapshot) {
        var cls = snapshot.val();
        if (!cls) {
            callback(false);
            return;
        }
        var dict = {};
        Object.keys(cls.students).forEach(function(userKey) {
            dict[userKey + '/' + note.id + '/title'] = note.title;
            dict[userKey + '/' + note.id + '/status'] = status;
            if (note.createdOn) {
                dict[userKey + '/' + note.id + '/createdOn'] = note.createdOn;
            }

        });
        dict[note.teacher + '/' + note.id + '/title'] = note.title;
        dict[note.teacher + '/' + note.id + '/status'] = status;
        if (note.createdOn) {
            dict[note.teacher + '/' + note.id + '/createdOn'] = note.createdOn;
        }
        fb.db.ref('user_notes').update(dict);
        callback(true);
    }, function(error) {
        callback(false);
    });
}
//
// /* POST /todos */
// router.post('/', function(req, res, next) {
//   Todo.create(req.body, function (err, post) {
//     if (err) return next(err);
//     res.json(post);
//   });
// });
//
// /* GET /todos/id */
// router.get('/:id', function(req, res, next) {
//   Todo.findById(req.params.id, function (err, post) {
//     if (err) return next(err);
//     res.json(post);
//   });
// });
//
// /* PUT /todos/:id */
// router.put('/:id', function(req, res, next) {
//   Todo.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
//     if (err) return next(err);
//     res.json(post);
//   });
// });

/* DELETE /todos/:id */
// router.delete('/:id', function(req, res, next) {
//     Todo.findByIdAndRemove(req.params.id, req.body, function(err, post) {
//         if (err) return next(err);
//         res.json(post);
//     });
// });

module.exports = router;
