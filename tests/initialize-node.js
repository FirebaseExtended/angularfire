var path = require('path');
var firebase = require('firebase');

if (!process.env.ANGULARFIRE_TEST_DB_URL) {
  throw new Error('You need to set the ANGULARFIRE_TEST_DB_URL environment variable.');
}

try {
  firebase.initializeApp({
    databaseURL: process.env.ANGULARFIRE_TEST_DB_URL
  });
} catch (err) {
  console.log('Failed to initialize the Firebase SDK [Node]:', err);
}
