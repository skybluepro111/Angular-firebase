var express = require('express');
var session = require('express-session');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}));

//session
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'hovercamsecretsessionabc',
    name: 'hcsessionabc',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: false
    }
}));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

//assets
app.use(express.static(__dirname + '/public'));
//routes
var api = require('./routes/api/api');
var student = require('./routes/student/index');
var teacher = require('./routes/teacher/index');

app.use('/api', api);
app.use('/student', student);
app.use('/teacher', teacher);


app.use(express.static(__dirname + '/apps'));

app.get("/", function(req, res) {
    res.redirect('/student');
});

// app.get("/student", function(req, res) {
//     res.sendFile("./views/student/index.html",{ root : __dirname});
// });

app.set('port', (process.env.PORT || 8080));
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
