var express = require('express');
var router = express.Router();
var fb = require('../../config/firebase.js');

router.post("/firebaseToken", function(req, res) {
    var idToken = req.body.idToken;
    var userType = req.body.userType;
    fb.auth.verifyIdToken(idToken).then(function(decodedToken) {
        var uid = decodedToken.sub;
        req.session['userId'] = uid;
        if (userType) {
          req.session['userType'] =userType;
        }else{
          req.session['userType'] ='student';
        }
        res.json({
            success: true
        });

    }).catch(function(error) {
        req.session.uid = null;
        console.log(error);
        res.status(404).json({
            success: false,
            message:error
        });
    });
});
router.get('/logout',function(req,res){
  req.session.destroy();
  res.json({
      success: true
  })
});

module.exports = router;
