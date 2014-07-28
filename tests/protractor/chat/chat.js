var app = angular.module('chat', ['firebase']);
app.controller('ChatCtrl', function Chat($scope, $firebase) {
  // Get a reference to the Firebase
  var chatFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/chat');
  var messagesFirebaseRef = chatFirebaseRef.child("messages").limit(2);
  var numMessagesFirebaseRef = chatFirebaseRef.child("numMessages");

  // Get AngularFire sync objects
  var chatSync = $firebase(chatFirebaseRef);
  var messagesSync = $firebase(messagesFirebaseRef);
  var numMessagesSync = $firebase(numMessagesFirebaseRef);

  // Get the chat data as an object
  $scope.chat = chatSync.$asObject();

  // Get the chat messages as an array
  $scope.messages = messagesSync.$asArray();

  // Verify that $inst() works
  verify($scope.chat.$inst() === chatSync, "Something is wrong with $FirebaseObject.$inst().");
  verify($scope.messages.$inst() === messagesSync, "Something is wrong with $FirebaseArray.$inst().");

  // Initialize $scope variables
  $scope.message = "";
  $scope.username = 'Guest' + Math.floor(Math.random() * 101);

  /* Clears the chat Firebase reference */
  $scope.clearRef = function () {
    chatSync.$remove();
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

      // Increment the messages count by 1
      numMessagesSync.$transaction(function (currentCount) {
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
      }).then(function (snapshot) {
        if (snapshot === null) {
          // Handle aborted transaction
          verify(false, "Messages count transaction unexpectedly aborted.")
        }
        else {
          // Success
        }
      }, function(error) {
        verify(false, "Messages count transaction errored: " + error);
      });
    }
  };

  /* Destroys all AngularFire bindings */
  $scope.destroy = function() {
    $scope.chat.$destroy();
    $scope.messages.$destroy();
  };

  /* Logs a message and throws an error if the inputted expression is false */
  function verify(expression, message) {
    if (!expression) {
      console.log(message);
      throw new Error(message);
    }
  }
});