var express = require('express');
var path = require('path');
var router = express.Router();
var notes = require('./notes');
var classes = require('./classes');
var users = require('./users');
var auth = require('./auth');

router.get("/", function(req, res) {
    res.send('Welcome to use Knotseter API! Please use Post!');
});
router.use(authChecker);
router.use('/notes', notes);
router.use('/classes', classes);
router.use('/users', users);
router.use('/auth', auth);

function authChecker(req, res, next) {
    //console.log("Checker: %j", req.session);
    if (req.session['userId'] || req.path.indexOf('auth') > 0) {
        return next();
    }
    return res.status(401).json({
        success: false,
        message: 'Login Required.'
    });
}
module.exports = router;
