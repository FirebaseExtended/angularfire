var app = angular.module('chat', ['firebase']);
app.controller('Chat', function Chat($scope, $firebase) {
  // Get a reference to the Firebase
  var messagesFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/chat');
  var messageCountFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/numChatMessages');

  // Initialize $scope variables
  $scope.messages = $firebase(messagesFirebaseRef.limit(2));
  $scope.messageCount = $firebase(messageCountFirebaseRef);
  $scope.username = 'Guest' + Math.floor(Math.random() * 101);

  // Clears the demo Firebase reference
  $scope.clearRef = function () {
    messagesFirebaseRef.set(null);
    messageCountFirebaseRef.set(null);
  };

  // Adds a new message item
  $scope.addMessage = function() {
    var promise = $scope.messages.$add({
      from: $scope.username,
      content: $scope.message
    });

    // Transaction testing
    $scope.messageCount.$transaction(function(currentCount) {
      if (!currentCount) {
        return 1;
      } else {
        return currentCount + 1;
      }
    });

    $scope.message = "";
    return promise;
  };
});