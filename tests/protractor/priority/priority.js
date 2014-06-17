var app = angular.module('priority', ['firebase']);
app.controller('Priority', function Chat($scope, $firebase) {
  // Get a reference to the Firebase
  var messagesFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/priority');

  // Initialize $scope variables
  $scope.messages = $firebase(messagesFirebaseRef);
  $scope.username = 'Guest' + Math.floor(Math.random() * 101);

  // Clears the demo Firebase reference
  $scope.clearRef = function () {
    messagesFirebaseRef.set(null);
    messageCountFirebaseRef.set(null);
  };

  // Adds a new message item
  $scope.addMessage = function() {
    $scope.messages.$add({
      from: $scope.username,
      content: $scope.message,
      '.priority': $scope.messages.$getIndex().length
    });

    $scope.message = "";
  };
});