var app = angular.module('chat', ['firebase']);
app.controller('ChatCtrl', function Chat($scope, $FirebaseObject, $FirebaseArray) {
  // Get a reference to the Firebase
  var chatFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/chat');
  var messagesFirebaseRef = chatFirebaseRef.child("messages").limitToLast(2);
  var numMessagesFirebaseRef = chatFirebaseRef.child("numMessages");

  // Get AngularFire sync objects

  // Get the chat data as an object
  $scope.chat = new $FirebaseObject(chatFirebaseRef);

  // Get the chat messages as an array
  $scope.messages = new $FirebaseArray(messagesFirebaseRef);

  // Verify that $inst() works
  verify($scope.chat.$ref() === chatFirebaseRef, "Something is wrong with $FirebaseObject.$inst().");
  verify($scope.messages.$ref() === messagesFirebaseRef, "Something is wrong with $FirebaseArray.$inst().");

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
      console.log('adding message'); //debug
      // Add a new message to the messages list
      $scope.messages.$add({
        from: $scope.username,
        content: $scope.message
      });

      // Reset the message input
      $scope.message = "";

      // Increment the messages count by 1
      numMessagesFirebaseRef.transaction(function (currentCount) {
        if (currentCount === null) {
          // Set the initial value
          return 1;
        }
        else if (currentCount < 0) {
          // Return undefined to abort the transaction
          return;
        }
        else {
          // Increment the messages count by 1
          return currentCount + 1;
        }
      }, function (error, committed, snapshot) {
        if( error ) {

        }
        else if(!committed) {
          // Handle aborted transaction
          verify(false, "Messages count transaction unexpectedly aborted.")
        }
        else {
          // Success
        }
      });
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