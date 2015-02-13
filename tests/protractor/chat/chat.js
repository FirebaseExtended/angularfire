var app = angular.module('chat', ['firebase']);
app.controller('ChatCtrl', function Chat($scope, $firebaseObject, $firebaseArray) {
  // Get a reference to the Firebase
  var chatFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/chat');
  var messagesFirebaseRef = chatFirebaseRef.child("messages").limitToLast(2);

  // Get the chat data as an object
  $scope.chat = $firebaseObject(chatFirebaseRef);

  // Get the chat messages as an array
  $scope.messages = $firebaseArray(messagesFirebaseRef);

  // Verify that $inst() works
  verify($scope.chat.$ref() === chatFirebaseRef, "Something is wrong with $firebaseObject.$ref().");
  verify($scope.messages.$ref() === messagesFirebaseRef, "Something is wrong with $firebaseArray.$ref().");

  // Initialize $scope variables
  $scope.message = "";
  $scope.username = 'Guest' + Math.floor(Math.random() * 101);

  /* Clears the chat Firebase reference */
  $scope.clearRef = function () {
    chatFirebaseRef.remove();
  };

  /* Adds a new message to the messages list and updates the messages count */
  $scope.addMessage = function() {
    if ($scope.message !== "") {
      // Add a new message to the messages list
      $scope.messages.$add({
        from: $scope.username,
        content: $scope.message
      });

      // Reset the message input
      $scope.message = "";
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