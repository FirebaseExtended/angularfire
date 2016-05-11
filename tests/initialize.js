var config = {
  apiKey: "AIzaSyDOlKivprJ3SquwbMUoBB0uK7V_FjUWAqI",
  authDomain: "topstory.firebaseapp.com",
  databaseURL: "https://topstory.firebaseio.com"
};
firebase.initializeApp(config);
firebase.database().ref().child("angularfire").remove();
