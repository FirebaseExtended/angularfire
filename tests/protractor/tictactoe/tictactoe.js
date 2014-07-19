var app = angular.module('tictactoe', ['firebase']);
app.controller('TictactoeCtrl', function Chat($scope, $firebase) {
  // Get a reference to the Firebase
  var boardFirebaseRef = new Firebase('https://angularFireTests.firebaseio-demo.com/tictactoe');

  // Get the board as an AngularFire object
  var obj = $firebase(boardFirebaseRef).$asObject();

  // Create a 3-way binding to Firebase
  obj.$bindTo($scope, 'board').then(function() {
    console.log($scope.board);
    setTimeout(function() {
      console.log($scope.board);

      $scope.resetRef();
    },100);
  });

  // Initialize $scope variables
  $scope.whoseTurn = 'X';


  /* Resetd the tictactoe Firebase reference */
  $scope.resetRef = function () {
    console.log("reset");
    // $scope.board = {
    //   0: {
    //     0: '',
    //     1: '',
    //     2: ''
    //   },
    //   1: {
    //     0: '',
    //     1: '',
    //     2: ''
    //   },
    //   2: {
    //     0: '',
    //     1: '',
    //     2: ''
    //   }
    // };
    $scope.board = [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ];
  };

  /* Makes a move at the current cell */
  $scope.makeMove = function(rowId, columnId) {
    console.log(rowId, columnId);
    rowId = rowId.toString();
    columnId = columnId.toString();
    if ($scope.board[rowId][columnId] === "") {
      // Update the board
      $scope.board[rowId][columnId] = $scope.whoseTurn;

      console.log($scope.board);

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