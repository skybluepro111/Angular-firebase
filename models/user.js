// I'll move some functions from router to here.
var schemas = {
    user: {
        id: String,
        name: String,
        password: String
    }
}

var fb = require('../../config/firebase.js');
var User = function(data){
  this.data = data;
}
User.prototype.data = {};
User.prototype.get = function (name) {
    return this.data[name];
}
User.prototype.set = function (name, value) {
    this.data[name] = value;
}

User.prototype.save(callback){
}

User.findById = function (id, callback) {

}
module.exports = User;
