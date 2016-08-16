if (window.jamsine) {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
}

try {
  // TODO: stop hard-coding this
  var config = {
    apiKey: "AIzaSyCcB9Ozrh1M-WzrwrSMB6t5y1flL8yXYmY",
    authDomain: "angularfire-dae2e.firebaseapp.com",
    databaseURL: "https://angularfire-dae2e.firebaseio.com",
    storageBucket: "angularfire-dae2e.appspot.com",
  };
  firebase.initializeApp(config);
} catch (err) {
  console.log('Failed to initialize the Firebase SDK [web]:', err);
}
