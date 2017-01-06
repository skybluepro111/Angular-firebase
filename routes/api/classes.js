/*
1. Get user's class list
2. Get Class Detail directly from firebase database.
3.
*/
var express = require('express');
var router = express.Router();
var helper = require('../../js/helper.js');
var fb = require('../../config/firebase.js');
/* GET classes list. */
router.get('/', function(req, res, next) {
    var ref = fb.db.ref("user_classes/" + req.session['userId']);
    ref.once("value", function(snapshot) {
        var dict = {};
        snapshot.forEach(function(userNoteSnapshot) {
            var key = userNoteSnapshot.key;
            var data = userNoteSnapshot.val();
            dict[key] = data;
        });
        res.json(dict)
    });
});

/*Join a Class*/
router.post('/join', function(req, res, next) {
    var user = req.body.user;
    var cls = req.body.cls;
    if (req.session['userId'] != user['userId']) {
        res.status(404).json({
            success: false,
            message: 'User can only join self!'
        });
        return;
    }
    //update user_classes
    var refUserClass = fb.db.ref('user_classes/' + user.userId + "/" + cls.classId);
    refUserClass.update({
        'name': cls.name,
        'status': 'active',
        'type': 'student'
    });
    //update class/students
    var refClassStudents = fb.db.ref('classes/' + cls.classId + "/students/" + user.userId);
    refClassStudents.update({
        'name': user.name
    });
    //retrive old notes by class Id
    var refNotes = fb.db.ref('notes');
    refNotes.orderByChild("classId").equalTo(cls.classId).on("value", function(snapshot) {
        var obj = {};
        var hasData = false;
        snapshot.forEach(function(data) {
            //console.log("The " + data.key() + " Note  is the class" + data.val());
            if (data.val().status) {
                obj[data.key + '/status'] = data.val().status;
            }
            if (data.val().createdOn) {
                obj[data.key + '/createdOn'] = data.val().createdOn;
            }
            if (data.val().title) {
                obj[data.key + '/title'] = data.val().title;
            }
            hasData = true;
        });
        if (hasData) {
            var refUserNotes = fb.db.ref('user_notes/' + user.userId);
            refUserNotes.update(obj);
        }
        res.json({
            success: true
        });
    });
});
/* Update Class Profile */
router.put('/:classId', function(req, res, next) {
    var classId = req.params.classId;
    if (classId == null || classId.length < 5) {
        return res.status(404).json({
            success: false,
            message: 'classId is required!'
        });
    }
    var verifiedData = req.body; //We Can Change / Verify Data at here.
    var ref = fb.db.ref("classes/" + classId);
    ref.update(verifiedData);
    return res.json(verifiedData);
});
//Create a new class
router.post('/', function(req, res, next) {
    var verifiedData = req.body; //We Can Change / Verify Data at here.
    verifiedData['createdOn'] = fb.TIMESTAMP;
    verifiedData['status'] = 'active';
    verifiedData['teacher'] = req.session['userId'];
    var newPostKey = fb.db.ref('classes').push().key;
    var updates = {};
    updates['/classes/' + newPostKey] = verifiedData;
    updates['/user_classes/' + req.session['userId'] + '/' + newPostKey + "/name"] = verifiedData['name'];
    updates['/user_classes/' + req.session['userId'] + '/' + newPostKey + "/status"] = 'active';
    updates['/user_classes/' + req.session['userId'] + '/' + newPostKey + "/type"] = 'teacher';
    fb.db.ref().update(updates);
    var ret = {};
    ret[newPostKey] = verifiedData;
    return res.json(ret);
});
/*remove student from the class*/
router.post('/:classId/remove_student', function(req, res, next) {
    if (req.session['userType'] != 'teacher') {
        return res.status(404).json({
            success: false,
            message: 'You are not teacher.'
        });
    }
    var classId = req.params.classId;
    var studentId = req.body.studentId;
    if (!studentId || !classId) {
        return res.status(404).json({
            success: false,
            message: 'Permission or Paremeter Error'
        });
    }
    var refClassStudents = fb.db.ref('classes/' + classId + "/students");
    var obj={};
    obj[studentId] = null;
    refClassStudents.update(obj);
    var refUserClass = fb.db.ref('user_classes/' + studentId);
    var obj2={};
    obj2[classId] = null;
    refUserClass.update(obj2);
    return res.json({
        success: true
    });
});

router.post('/:classId/gencode', function(req, res, next) { //Generate Code
    if (req.session['userType'] != 'teacher') {
        return res.status(404).json({
            success: false,
            message: 'You are not teacher.'
        });
    }
    var classId = req.params.classId;
    var className = req.body.className;
    console.log(className);
    //F0728378
    var dt = new Date();
    var yearStr = String.fromCharCode(64 + dt.getFullYear() - 2010);
    var monthStr = helper.zeroPad(dt.getMonth() + 1, 2);
    var dateStr = helper.zeroPad(dt.getDate(), 2);
    var randomCode = helper.zeroPad(Math.random() * 10000, 4);
    var class_code = {
        'classId': classId,
        'name': className
    }
    var code = yearStr + monthStr + dateStr + randomCode;
    var ret = {};
    ret[code] = class_code;
    var refClass = fb.db.ref('classes/' + classId);
    refClass.update({
        'code': code
    });
    var refClassCodes = fb.db.ref('class_codes/');
    refClassCodes.update(ret);
    return res.json(ret)
});
module.exports = router;
