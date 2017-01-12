if (window.jamsine) {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
}

try {
  // TODO: stop hard-coding this
  var config = {
    apiKey: "AIzaSyCcB9Ozrh1M-WzrwrSMB6t5y1flL8yXYmY",
    authDomain: "oss-test.firebaseapp.com",
    databaseURL: "https://oss-test.firebaseio.com",
    storageBucket: "oss-test.appspot.com"
  };
  firebase.initializeApp(config);
} catch (err) {
  console.log('Failed to initialize the Firebase SDK [web]:', err);
}
