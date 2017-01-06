var exports = {};
//Firebase Server Side
const firebase = require("firebase");
firebase.initializeApp({
  serviceAccount: "./config/knotester-f6bba1a035be.json",
  databaseURL: "https://knotester.firebaseio.com"
  //serviceAccount: "./config/knotester-dev-43b12df2f7dc.json",
  //databaseURL: "https://knotester-dev.firebaseio.com"
});
exports.auth = firebase.auth();
exports.db = firebase.database();
exports.TIMESTAMP = firebase.database.ServerValue.TIMESTAMP;
//
module.exports = exports;
