describe('FirebaseAuth',function(){
  'use strict';

  var $firebaseAuth, ref, authService, auth, result, failure, status, tick, $timeout, log, fakePromise, fakePromiseResolve, fakePromiseReject;

  beforeEach(function(){

    log = {
      warn:[]
    };

    module('firebase',function($provide){
      $provide.value('$log',{
        warn:function(){
          log.warn.push(Array.prototype.slice.call(arguments,0));
        }
      })
    });
    module('testutils');

    result = undefined;
    failure = undefined;
    status = null;

    fakePromise = function () {
      var resolve;
      var reject;
      var obj = {
        then: function (_resolve, _reject) {
          resolve = _resolve;
          reject = _reject;
        },
        resolve: function (result) {
          resolve(result);
        },
        reject: function (err) {
          reject(err);
        }
      };
      fakePromiseReject = obj.reject;
      fakePromiseResolve = obj.resolve;
      return obj;
    }

    //offAuth, signInWithToken, updatePassword, changeEmail, removeUser
    auth = firebase.auth();
    ['signInWithCustomToken','signInAnonymously','signInWithEmailAndPassword',
      'signInWithPopup','signInWithRedirect', 'signInWithCredential',
      'signOut',
      'createUserWithEmailAndPassword','sendPasswordResetEmail'
    ].forEach(function (funcName) {
      spyOn(auth, funcName).and.callFake(fakePromise);
    });
    spyOn(auth, 'onAuthStateChanged').and.callFake(function (cb) {
      fakePromiseResolve = function (result) {
        cb(result);
      }
      return function () {/* Deregister */};
    });

    inject(function(_$firebaseAuth_,_$timeout_, $q, $rootScope){
      $firebaseAuth = _$firebaseAuth_;
      authService = $firebaseAuth(auth);
      $timeout = _$timeout_;

      tick = function (cb) {
        setTimeout(function() {
          $q.defer();
          $rootScope.$digest();
          cb && cb();
        }, 1000)
      };
    });

  });

  function getArgIndex(callbackName){
    //In the firebase API, the completion callback is the second argument for all but a few functions.
    switch (callbackName){
      case 'authAnonymously':
      case 'onAuthStateChanged':
        return 0;
      case 'authWithOAuthToken':
        return 2;
      default :
        return 0;
    }
  }

  function wrapPromise(promise){
    promise.then(function(_result_){
      status = 'resolved';
      result = _result_;
    },function(_failure_){
      status = 'rejected';
      failure = _failure_;
    });
  }

  function callback(callbackName, callIndex){
    callIndex = callIndex || 0; //assume the first call.
    var argIndex = getArgIndex(callbackName);
    return auth[callbackName].calls.argsFor(callIndex)[argIndex];
  }

  it('will throw an error if a string is used in place of a Firebase auth instance',function(){
    expect(function(){
      $firebaseAuth('https://some-firebase.firebaseio.com/');
    }).toThrow();
  });

  it('will throw an error if a database instance is used in place of a Firebase auth instance',function(){
    expect(function(){
      $firebaseAuth(firebase.database());
    }).toThrow();
  });

  it('will throw an error if a database reference is used in place of a Firebase auth instance',function(){
    expect(function(){
      $firebaseAuth(firebase.database().ref());
    }).toThrow();
  });

  it('will not throw an error if an auth instance is provided',function(){
      $firebaseAuth(firebase.auth());
  });

  describe('$signInWithCustomToken',function(){
    it('passes custom token to underlying method',function(){
      authService.$signInWithCustomToken('myToken');
      expect(auth.signInWithCustomToken).toHaveBeenCalledWith('myToken');
    });

    it('will reject the promise if authentication fails',function(){
      var promise = authService.$signInWithCustomToken('myToken')
      wrapPromise(promise);
      fakePromiseReject("myError");
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      var promise = authService.$signInWithCustomToken('myToken')
      wrapPromise(promise);
      fakePromiseResolve("myResult");
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$authAnonymously',function(){
    it('passes options object to underlying method',function(){
      authService.$signInAnonymously();
      expect(auth.signInAnonymously).toHaveBeenCalled();
    });

    it('will reject the promise if authentication fails',function(){
      var promise = authService.$signInAnonymously('myToken')
      wrapPromise(promise);
      fakePromiseReject("myError");
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      var promise = authService.$signInAnonymously('myToken')
      wrapPromise(promise);
      fakePromiseResolve("myResult");
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$signInWithEmailWithPassword',function(){
    it('passes options and credentials object to underlying method',function(){
      var email = "abe@abe.abe";
      var password = "abeabeabe";
      authService.$signInWithEmailAndPassword(email, password);
      expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        email, password
      );
    });

    it('will reject the promise if authentication fails',function(){
      var promise = authService.$signInWithEmailAndPassword('', '');
      wrapPromise(promise);
      fakePromiseReject("myError");
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      var promise = authService.$signInWithEmailAndPassword('', '');
      wrapPromise(promise);
      fakePromiseResolve("myResult");
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$signInWithPopup',function(){
    it('passes AuthProvider to underlying method',function(){
      var provider = new firebase.auth.FacebookAuthProvider();
      authService.$signInWithPopup(provider);
      expect(auth.signInWithPopup).toHaveBeenCalledWith(
        provider
      );
    });

    it('turns string to AuthProvider for underlying method',function(){
      var provider = 'facebook';
      authService.$signInWithPopup(provider);
      expect(auth.signInWithPopup).toHaveBeenCalledWith(
        jasmine.any(firebase.auth.FacebookAuthProvider)
      );
    });

    it('will reject the promise if authentication fails',function(){
      var promise = authService.$signInWithPopup('google');
      wrapPromise(promise);
      fakePromiseReject("myError");
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      var promise = authService.$signInWithPopup('google');
      wrapPromise(promise);
      fakePromiseResolve("myResult");
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$signInWithRedirect',function(){
    it('passes AuthProvider to underlying method',function(){
      var provider = new firebase.auth.FacebookAuthProvider();
      authService.$signInWithRedirect(provider);
      expect(auth.signInWithRedirect).toHaveBeenCalledWith(
        provider
      );
    });

    it('turns string to AuthProvider for underlying method',function(){
      var provider = 'facebook';
      authService.$signInWithRedirect(provider);
      expect(auth.signInWithRedirect).toHaveBeenCalledWith(
        jasmine.any(firebase.auth.FacebookAuthProvider)
      );
    });

    it('will reject the promise if authentication fails',function(){
      var promise = authService.$signInWithRedirect('google');
      wrapPromise(promise);
      fakePromiseReject("myError");
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      var promise = authService.$signInWithRedirect('google');
      wrapPromise(promise);
      fakePromiseResolve("myResult");
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$signInWithCredential',function(){
    it('passes credential object to underlying method',function(){
      var credential = "!!!!";
      authService.$signInWithCredential(credential);
      expect(auth.signInWithCredential).toHaveBeenCalledWith(
        credential
      );
    });

    it('will reject the promise if authentication fails',function(){
      var promise = authService.$signInWithCredential('CREDENTIAL');
      wrapPromise(promise);
      fakePromiseReject("myError");
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      var promise = authService.$signInWithCredential('CREDENTIAL');
      wrapPromise(promise);
      fakePromiseResolve("myResult");
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$getAuth()',function(){
    it('returns getAuth() from backing auth instance',function(){
      expect(authService.$getAuth()).toEqual(auth.currentUser);
    });
  });

  describe('$signOut()',function(){
    it('will call signOut() on backing auth instance when user is signed in',function(){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {provider: 'facebook'};
      });
      authService.$signOut();
      expect(auth.signOut).toHaveBeenCalled();
    });

    it('will call not signOut() on backing auth instance when user is not signed in',function(){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return null;
      });
      authService.$signOut();
      expect(auth.signOut).not.toHaveBeenCalled();
    });
  });

  describe('$onAuthStateChanged()',function(){
    //todo add more testing here after mockfirebase v2 auth is released

    it('calls onAuthStateChanged() on the backing auth instance', function() {
      function cb() {}
      var ctx = {};
      authService.$onAuthStateChanged(cb, ctx);
      expect(auth.onAuthStateChanged).toHaveBeenCalledWith(jasmine.any(Function));
    });

    it('returns a deregistration function', function(){
      var cb = function () {};
      var ctx = {};
      expect(authService.$onAuthStateChanged(cb, ctx)).toEqual(jasmine.any(Function))
    });
  });

  describe('$requireSignIn()',function(){
    it('will be resolved if user is logged in', function(done){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {provider: 'facebook'};
      });

      authService.$requireSignIn()
        .then(function (result) {
          expect(result).toEqual({provider:'facebook'});
          done();
        })
        .catch(function () {
          console.log(arguments);
        });

      fakePromiseResolve(null);
      tick();
    });

    it('will be rejected if user is not logged in', function(done){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return null;
      });

      authService.$requireSignIn()
        .catch(function (error) {
          expect(error).toEqual("AUTH_REQUIRED");
          done();
        });

      fakePromiseResolve(null);
      tick();
    });
  });

  describe('$waitForSignIn()',function(){
    it('will be resolved with authData if user is logged in', function(done){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {provider: 'facebook'};
      });

      wrapPromise(authService.$waitForSignIn());

      fakePromiseResolve({provider: 'facebook'});
      tick(function () {
        expect(result).toEqual({provider:'facebook'});
        done();
      });
    });

    it('will be resolved with null if user is not logged in', function(done){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return;
      });

      wrapPromise(authService.$waitForSignIn());

      fakePromiseResolve();
      tick(function () {
        expect(result).toEqual(undefined);
        done();
      });
    });

    // TODO: Replace this test
    // it('promise resolves with current value if auth state changes after onAuth() completes', function() {
    //   ref.getAuth.and.returnValue({provider:'facebook'});
    //   wrapPromise(auth.$waitForSignIn());
    //   callback('onAuth')();
    //   $timeout.flush();
    //   expect(result).toEqual({provider:'facebook'});
    //
    //   ref.getAuth.and.returnValue(null);
    //   wrapPromise(auth.$waitForSignIn());
    //   $timeout.flush();
    //   expect(result).toBe(null);
    // });
  });

  describe('$createUserWithEmailAndPassword()',function(){
    it('passes email/password to method on backing ref',function(){
      var email = 'somebody@somewhere.com';
      var password = '12345';
      authService.$createUserWithEmailAndPassword(email, password);
      expect(auth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
          email, password);
    });

    it('will reject the promise if creation fails',function(){
      var promise = authService.$createUserWithEmailAndPassword('abe@abe.abe', '12345');
      wrapPromise(promise);
      fakePromiseReject("myError");
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon creation',function(){
      var promise = authService.$createUserWithEmailAndPassword('abe@abe.abe', '12345');
      wrapPromise(promise);
      fakePromiseResolve("myResult");
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$updatePassword()',function() {
    it('passes new password to method on backing auth instance',function(done) {
      var pass = "CatInDatHat";
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {updatePassword: function (password) {
          expect(password).toBe(pass);
          done();
        }};
      });
      authService.$updatePassword(pass);
    });

    it('will reject the promise if creation fails',function(){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {updatePassword: function (password) {
          return fakePromise();
        }};
      });

      var promise = authService.$updatePassword('PASSWORD');
      wrapPromise(promise);
      fakePromiseReject("myError");
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon creation',function(){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {updatePassword: function (password) {
          return fakePromise();
        }};
      });

      var promise = authService.$updatePassword('PASSWORD');
      wrapPromise(promise);
      fakePromiseResolve("myResult");
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$updateEmail()',function() {
    it('passes new email to method on backing auth instance',function(done) {
      var pass = "abe@abe.abe";
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {updateEmail: function (password) {
          expect(password).toBe(pass);
          done();
        }};
      });
      authService.$updateEmail(pass);
    });

    it('will reject the promise if creation fails',function(){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {updateEmail: function (password) {
          return fakePromise();
        }};
      });

      var promise = authService.$updateEmail('abe@abe.abe');
      wrapPromise(promise);
      fakePromiseReject("myError");
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon creation',function(){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {updateEmail: function (password) {
          return fakePromise();
        }};
      });

      var promise = authService.$updateEmail('abe@abe.abe');
      wrapPromise(promise);
      fakePromiseResolve("myResult");
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$deleteUser()',function(){
    it('calls delete on backing auth instance',function(done) {
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {delete: function () {
          done();
        }};
      });
      authService.$deleteUser();
    });

    it('will reject the promise if creation fails',function(){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {delete: function (password) {
          return fakePromise();
        }};
      });

      var promise = authService.$deleteUser();
      wrapPromise(promise);
      fakePromiseReject("myError");
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon creation',function(){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {delete: function (password) {
          return fakePromise();
        }};
      });

      var promise = authService.$deleteUser();
      wrapPromise(promise);
      fakePromiseResolve("myResult");
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$sendPasswordResetEmail()',function(){
    it('passes email to method on backing auth instance',function(){
      var email = "somebody@somewhere.com";
      authService.$sendPasswordResetEmail(email);
      expect(auth.sendPasswordResetEmail).toHaveBeenCalledWith(email);
    });

    it('will reject the promise if creation fails',function(){
      var promise = authService.$sendPasswordResetEmail('abe@abe.abe');
      wrapPromise(promise);
      fakePromiseReject("myError");
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon creation',function(){
      var promise = authService.$sendPasswordResetEmail('abe@abe.abe');
      wrapPromise(promise);
      fakePromiseResolve("myResult");
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });
});
