var express = require('express');
var router = express.Router();

var fb = require('../../config/firebase.js');
/* GET User Profile. */
router.get('/0', function(req, res, next) {
    var ref = fb.db.ref("users/" + req.session['userId']);
    ref.once("value", function(snapshot) {
        res.json(snapshot.val())
    });
});
/* Update User Profile */
router.put('/0', function(req, res, next) {
    if (req.session['userId'] != req.body['userId']) {
        res.status(404).json({
            success: false,
            message: 'User can only update self!'
        });
        return;
    }
    var verifiedData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        email: req.body.email || 'no-mail@mail.com'
    };

    verifiedData.name = verifiedData.firstName + " " + verifiedData.lastName;

    var ref = fb.db.ref("users/" + req.session['userId']);
    ref.update(verifiedData);
    return res.json(verifiedData);
});

/* Update User Profile */
router.put('/create', function(req, res, next) {
    //console.log(req.body);
    if (req.session['userId'] != req.body['userId']) {
        res.status(404).json({
            success: false,
            message: 'User can only update self!'
        });
        return;
    }
    var verifiedData = req.body;//We Can Change / Verify Data at here.
    verifiedData['type'] = req.session['userType'];
    verifiedData['createdOn'] = fb.TIMESTAMP;
    verifiedData['name'] = verifiedData.firstName + " " + verifiedData.lastName;
    verifiedData['userId'] = null;
    verifiedData['password'] = null;

    var ref = fb.db.ref("users/" + req.session['userId']);
    ref.update(verifiedData);
    return res.json(verifiedData);
});
/*View a user*/
router.get('/:userId', function(req, res, next) {
    //We may need to verify student friend permissions here
    var ref = fb.db.ref("users/" + req.params.noteId);
    ref.once("value", function(snapshot) {
        res.json(snapshot.val())
    });
});
router.put('/:userId', function(req, res, next) {
  if (req.session['userType'] != 'teacher') {
      res.status(404).json({
          success: false,
          message: 'Only teacher can update others!'
      });
      return;
  }
  var verifiedData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName
  };
  verifiedData.name = verifiedData.firstName + " " + verifiedData.lastName;
  var ref = fb.db.ref("users/" + req.params.userId);
  ref.update(verifiedData);
  return res.json(verifiedData);
});
module.exports = router;
