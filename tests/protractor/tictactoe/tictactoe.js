var app = angular.module('tictactoe', ['firebase']);
app.controller('TictactoeCtrl', function Chat($scope, $firebase) {
  // Get a reference to the Firebase
  var boardFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/tictactoe');

  // Get the board as an AngularFire object
  var obj = $firebase(boardFirebaseRef).$asObject();

  // Create a 3-way binding to Firebase
  obj.$bindTo($scope, 'boardBinding').then(function() {
    $scope.resetRef();
  });

  // Initialize $scope variables
  $scope.whoseTurn = 'X';


  /* Resetd the tictactoe Firebase reference */
  $scope.resetRef = function () {
    console.log("reset");
    $scope.boardBinding.board = "A";
    /*$scope.boardBinding.board = {
      x0: {
        y0: "",
        y1: "",
        y2: ""
      },
      x1: {
        y0: "",
        y1: "",
        y2: ""
      },
      x2: {
        y0: "",
        y1: "",
        y2: ""
      }
    }*/
  };

  /* Makes a move at the current cell */
  $scope.makeMove = function(rowId, columnId) {
    console.log(rowId, columnId);
    //rowId = rowId.toString();
    //columnId = columnId.toString();
    if ($scope.boardBinding.board[rowId][columnId] === "") {
      // Update the board
      $scope.boardBinding.board[x + rowId][y + columnId] = $scope.whoseTurn;

      console.log($scope.boardBinding.board);

      // Change whose turn it is
      $scope.whoseTurn = ($scope.whoseTurn === 'X') ? 'O' : 'X';
    }
  };

  /* Destroys all AngularFire bindings */
  $scope.destroy = function() {
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