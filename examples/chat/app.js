angular.module('chat', ['firebase'])
  .controller('Chat', ['$scope', '$timeout', 'angularFireCollection',
    function($scope, $timeout, angularFireCollection) {
      var url = 'https://angularFire.firebaseio-demo.com/chat';
      $scope.messages = angularFireCollection(new Firebase(url).limit(50));
      $scope.username = 'Guest' + Math.floor(Math.random()*101);
      $scope.addMessage = function() {
        $scope.messages.add({from: $scope.username, content: $scope.message});
        $scope.message = "";
      }
    }
  ])
  .directive('autoScroll', function($timeout) {
    return function(scope, elements, attrs) {
      scope.$watch("messages.length", function() {
        $timeout(function() {
          elements[0].scrollTop = elements[0].scrollHeight
        });
      });
    }
  });
