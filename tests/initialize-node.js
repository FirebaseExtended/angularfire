var firebase = require('firebase');

try {
firebase.initializeApp({
  databaseURL: "https://angularfire-dae2e.firebaseio.com",
  serviceAccount: "./credentials.json"
});
} catch (err) {
  console.log(err)
}
