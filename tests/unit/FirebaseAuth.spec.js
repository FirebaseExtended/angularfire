describe('FirebaseAuth',function(){
  'use strict';

  var $firebaseAuth, ref, authService, auth, result, failure, status, tick, $timeout, log, fakePromise, fakePromiseResolve, fakePromiseReject;

  beforeEach(function(){

    log = {
      warn:[]
    };
    // 
    // module('firebase.utils');
    module('firebase.auth',function($provide){
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

      firebase.database.enableLogging(function () {tick()});
      tick = function () {
        setTimeout(function() {
          $q.defer();
          $rootScope.$digest();
          try {
            $timeout.flush();
          } catch (err) {
            // This throws an error when there is nothing to flush...
          }
        })
      };
    });

  });

  function wrapPromise(promise){
    promise.then(function(_result_){
      status = 'resolved';
      result = _result_;
    },function(_failure_){
      status = 'rejected';
      failure = _failure_;
    });
  }

  describe('Constructor', function() {
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
    it('should return a promise', function() {
      expect(authService.$signInWithCustomToken('myToken')).toBeAPromise();
    });

    it('passes custom token to underlying method',function(){
      authService.$signInWithCustomToken('myToken');
      expect(auth.signInWithCustomToken).toHaveBeenCalledWith('myToken');
    });

    it('will reject the promise if authentication fails',function(){
      var promise = authService.$signInWithCustomToken('myToken');
      wrapPromise(promise);
      fakePromiseReject('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      var promise = authService.$signInWithCustomToken('myToken');
      wrapPromise(promise);
      fakePromiseResolve('myResult');
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$signInAnonymously',function(){
    it('should return a promise', function() {
      expect(authService.$signInAnonymously()).toBeAPromise();
    });

    it('passes options object to underlying method',function(){
      authService.$signInAnonymously();
      expect(auth.signInAnonymously).toHaveBeenCalled();
    });

    it('will reject the promise if authentication fails',function(){
      var promise = authService.$signInAnonymously('myToken');
      wrapPromise(promise);
      fakePromiseReject('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      var promise = authService.$signInAnonymously('myToken');
      wrapPromise(promise);
      fakePromiseResolve('myResult');
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$signInWithEmailWithPassword',function(){
    it('should return a promise', function() {
      var email = 'abe@abe.abe';
      var password = 'abeabeabe';
      expect(authService.$signInWithEmailAndPassword(email, password)).toBeAPromise();
    });

    it('passes options and credentials object to underlying method',function(){
      var email = 'abe@abe.abe';
      var password = 'abeabeabe';
      authService.$signInWithEmailAndPassword(email, password);
      expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        email, password
      );
    });

    it('will reject the promise if authentication fails',function(){
      var promise = authService.$signInWithEmailAndPassword('', '');
      wrapPromise(promise);
      fakePromiseReject('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      var promise = authService.$signInWithEmailAndPassword('', '');
      wrapPromise(promise);
      fakePromiseResolve('myResult');
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$signInWithPopup',function(){
    it('should return a promise', function() {
      var provider = new firebase.auth.FacebookAuthProvider();
      expect(authService.$signInWithPopup(provider)).toBeAPromise();
    });

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
      fakePromiseReject('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      var promise = authService.$signInWithPopup('google');
      wrapPromise(promise);
      fakePromiseResolve('myResult');
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$signInWithRedirect',function(){
    it('should return a promise', function() {
      var provider = new firebase.auth.FacebookAuthProvider();
      expect(authService.$signInWithRedirect(provider)).toBeAPromise();
    });

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
      fakePromiseReject('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      var promise = authService.$signInWithRedirect('google');
      wrapPromise(promise);
      fakePromiseResolve('myResult');
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$signInWithCredential',function(){
    it('should return a promise', function() {
      expect(authService.$signInWithCredential('CREDENTIAL')).toBeAPromise();
    });

    it('passes credential object to underlying method',function(){
      var credential = '!!!!';
      authService.$signInWithCredential(credential);
      expect(auth.signInWithCredential).toHaveBeenCalledWith(
        credential
      );
    });

    it('will reject the promise if authentication fails',function(){
      var promise = authService.$signInWithCredential('CREDENTIAL');
      wrapPromise(promise);
      fakePromiseReject('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon authentication',function(){
      var promise = authService.$signInWithCredential('CREDENTIAL');
      wrapPromise(promise);
      fakePromiseResolve('myResult');
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
    it('should return a promise', function() {
      expect(authService.$signOut()).toBeAPromise();
    });

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
      var credentials = {provider: 'facebook'};
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return credentials;
      });

      authService.$requireSignIn()
        .then(function (result) {
          expect(result).toEqual(credentials);
          done();
        });

      fakePromiseResolve(credentials);
      tick();
    });

    it('will be rejected if user is not logged in', function(done){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return null;
      });

      authService.$requireSignIn()
        .catch(function (error) {
          expect(error).toEqual('AUTH_REQUIRED');
          done();
        });

      fakePromiseResolve();
      tick();
    });
  });
  
  describe('$requireSignIn(requireEmailVerification)',function(){	
    it('will be resolved if user is logged in and has a verified email address', function(done){
      var credentials = {provider: 'facebook', emailVerified: true};
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return credentials;
      });

      authService.$requireSignIn(true)
        .then(function (result) {
          expect(result).toEqual(credentials);
          done();
        });

      fakePromiseResolve(credentials);
      tick();
    });
	
    it('will be resolved if user is logged in and we ignore email verification', function(done){
      var credentials = {provider: 'facebook', emailVerified: false};
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return credentials;
      });

      authService.$requireSignIn(false)
        .then(function (result) {
          expect(result).toEqual(credentials);
          done();
        });

      fakePromiseResolve(credentials);
      tick();
    });
	
   it('will be rejected if user does not have a verified email address', function(done){
     var credentials = {provider: 'facebook', emailVerified: false};
     spyOn(authService._, 'getAuth').and.callFake(function () {
       return credentials;
     });

      authService.$requireSignIn(true)
        .catch(function (error) {
          expect(error).toEqual('EMAIL_VERIFICATION_REQUIRED');
          done();
      });

      fakePromiseResolve(credentials);
      tick();
    });
  });  
  
  describe('$waitForSignIn()',function(){
    it('will be resolved with authData if user is logged in', function(done){
      var credentials = {provider: 'facebook'};
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return credentials;
      });

      authService.$waitForSignIn().then(function (result) {
        expect(result).toEqual(credentials);
        done();
      });

      fakePromiseResolve(credentials);
      tick();
    });

    it('will be resolved with null if user is not logged in', function(done){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return null;
      });

      authService.$waitForSignIn().then(function (result) {
        expect(result).toEqual(null);
        done();
      });

      fakePromiseResolve();
      tick();
    });
  });

  describe('$createUserWithEmailAndPassword()',function(){
    it('should return a promise', function() {
      var email = 'somebody@somewhere.com';
      var password = '12345';
      expect(authService.$createUserWithEmailAndPassword(email, password)).toBeAPromise();
    });

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
      fakePromiseReject('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon creation',function(){
      var promise = authService.$createUserWithEmailAndPassword('abe@abe.abe', '12345');
      wrapPromise(promise);
      fakePromiseResolve('myResult');
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$updatePassword()',function() {
    it('should return a promise', function() {
      var newPassword = 'CatInDatHat';
      expect(authService.$updatePassword(newPassword)).toBeAPromise();
    });

    it('passes new password to method on backing auth instance',function(done) {
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {
          updatePassword: function (password) {
            expect(password).toBe(newPassword);
            done();
          }
        };
      });

      var newPassword = 'CatInDatHat';
      authService.$updatePassword(newPassword);
    });

    it('will reject the promise if creation fails',function(){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {
          updatePassword: function (password) {
            return fakePromise();
          }
        };
      });

      var promise = authService.$updatePassword('PASSWORD');
      wrapPromise(promise);
      fakePromiseReject('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon creation',function(){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {
          updatePassword: function (password) {
            return fakePromise();
          }
        };
      });

      var promise = authService.$updatePassword('PASSWORD');
      wrapPromise(promise);
      fakePromiseResolve('myResult');
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$updateEmail()',function() {
    it('should return a promise', function() {
      var newEmail = 'abe@abe.abe';
      expect(authService.$updateEmail(newEmail)).toBeAPromise();
    });

    it('passes new email to method on backing auth instance',function(done) {
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {
          updateEmail: function (email) {
            expect(email).toBe(newEmail);
            done();
          }
        };
      });

      var newEmail = 'abe@abe.abe';
      authService.$updateEmail(newEmail);
    });

    it('will reject the promise if creation fails',function(){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {
          updateEmail: function (email) {
            return fakePromise();
          }
        };
      });

      var promise = authService.$updateEmail('abe@abe.abe');
      wrapPromise(promise);
      fakePromiseReject('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon creation',function(){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {
          updateEmail: function (email) {
            return fakePromise();
          }
        };
      });

      var promise = authService.$updateEmail('abe@abe.abe');
      wrapPromise(promise);
      fakePromiseResolve('myResult');
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$deleteUser()',function(){
    it('should return a promise', function() {
      expect(authService.$deleteUser()).toBeAPromise();
    });

    it('calls delete on backing auth instance',function(done) {
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {
          delete: function () {
            done();
          }
        };
      });
      authService.$deleteUser();
    });

    it('will reject the promise if creation fails',function(){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {
          delete: function () {
            return fakePromise();
          }
        };
      });

      var promise = authService.$deleteUser();
      wrapPromise(promise);
      fakePromiseReject('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon creation',function(){
      spyOn(authService._, 'getAuth').and.callFake(function () {
        return {
          delete: function () {
            return fakePromise();
          }
        };
      });

      var promise = authService.$deleteUser();
      wrapPromise(promise);
      fakePromiseResolve('myResult');
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });

  describe('$sendPasswordResetEmail()',function(){
    it('should return a promise', function() {
      var email = 'somebody@somewhere.com';
      expect(authService.$sendPasswordResetEmail(email)).toBeAPromise();
    });

    it('passes email to method on backing auth instance',function(){
      var email = 'somebody@somewhere.com';
      authService.$sendPasswordResetEmail(email);
      expect(auth.sendPasswordResetEmail).toHaveBeenCalledWith(email);
    });

    it('will reject the promise if creation fails',function(){
      var promise = authService.$sendPasswordResetEmail('abe@abe.abe');
      wrapPromise(promise);
      fakePromiseReject('myError');
      $timeout.flush();
      expect(failure).toEqual('myError');
    });

    it('will resolve the promise upon creation',function(){
      var promise = authService.$sendPasswordResetEmail('abe@abe.abe');
      wrapPromise(promise);
      fakePromiseResolve('myResult');
      $timeout.flush();
      expect(result).toEqual('myResult');
    });
  });
});
