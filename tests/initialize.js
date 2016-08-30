if (window.jamsine) {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
}

var config = {
  apiKey: 'AIzaSyC3eBV8N95k_K67GTfPqf67Mk1P-IKcYng',
  authDomain: 'oss-test.firebaseapp.com',
  databaseURL: 'https://oss-test.firebaseio.com',
  storageBucket: 'oss-test.appspot.com'
};
firebase.initializeApp(config);
