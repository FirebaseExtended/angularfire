var app = angular.module('chat', ['firebase.database']);

app.controller('ChatCtrl', function Chat($scope, $firebaseObject, $firebaseArray) {
  // Get a reference to the Firebase
  var rootRef = firebase.database().ref();

  // Store the data at a random push ID
  var chatRef = rootRef.child('chat').push();

  // Put the Firebase URL into the scope so the tests can grab it.
  $scope.url = chatRef.toString()

  var messagesRef = chatRef.child('messages').limitToLast(2);

  // Get the chat data as an object
  $scope.chat = $firebaseObject(chatRef);

  // Get the chat messages as an array
  $scope.messages = $firebaseArray(messagesRef);

  // Verify that $inst() works
  verify($scope.chat.$ref() === chatRef, 'Something is wrong with $firebaseObject.$ref().');
  verify($scope.messages.$ref() === messagesRef, 'Something is wrong with $firebaseArray.$ref().');

  // Initialize $scope variables
  $scope.message = '';
  $scope.username = 'Default Guest';

  /* Clears the chat Firebase reference */
  $scope.clearRef = function () {
    chatRef.remove();
  };

  /* Adds a new message to the messages list and updates the messages count */
  $scope.addMessage = function() {
    if ($scope.message !== '') {
      // Add a new message to the messages list
      $scope.messages.$add({
        from: $scope.username,
        content: $scope.message
      });

      // Reset the message input
      $scope.message = '';
    }
  };

  /* Destroys all AngularFire bindings */
  $scope.destroy = function() {
    $scope.chat.$destroy();
    $scope.messages.$destroy();
  };

  $scope.$on('destroy', function() {
    $scope.chat.$destroy();
    $scope.messages.$destroy();
  });

  /* Logs a message and throws an error if the inputted expression is false */
  function verify(expression, message) {
    if (!expression) {
      console.log(message);
      throw new Error(message);
    }
  }
});
