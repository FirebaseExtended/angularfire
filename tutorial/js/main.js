/**
 * This file contains the main control logic for the Firebase Tutorial
 */

//Constants
var TUTORIAL_DATA_ROOT = "firebase-tutorial.firebaseio.com/";
//var PROTOCOL = location.protocol + "//";
var PROTOCOL = "https://";
var EXAMPLES_ROOT = "data/examples/";
var TUTORIALS_ROOT = "data/tutorials/";
var DEFAULT_TUTORIAL_TOKEN = "tutorial/basic/0";

var SCRIPT_ROOT = 'https://cdn.firebase.com/v0/firebase.js';
var ANGULAR_JS = 'https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.1.5/angular.min.js';
var ANGULARFIRE_JS = 'https://cdn.firebase.com/libs/angularfire/0.5.0-rc1/angularfire.min.js';
var DEMO_SERVER_DOMAIN_SUFFIX = ".firebaseio-demo.com/";

var AppRouter = Backbone.Router.extend({
  routes:{
    "gettingstarted":"gettingstarted",
    "tutorial/:name/:lesson(/:completed)":"tutorial",
    "session/:sessionID":"session",
    '*path':'defaultRoute'
  },

  defaultRoute:function () {
    this.goToPage("gettingstarted", {trigger:true})
  },

  goToPage: function(token) {
    this.navigate(token, {trigger: true});
  }
});

//On document ready, lets get started...
function startTutorial() {
  //Create the history router
  var router = new AppRouter;
  window.TutorialRouter = router;

  //Set up the global events manager
  var globalEvents = _.extend({}, Backbone.Events);

  //set up the gui
  var templater = new Templater();
  var dataRoot = new Firebase(PROTOCOL + TUTORIAL_DATA_ROOT);
  var editor = new TutorialIDE($("#editor"), dataRoot.child("popouts").push());
  var guiController = initializeGUI(globalEvents, editor);

  //And other state managers
  var userSession = new UserSession(dataRoot, templater);
  var tutorialLoader = new TutorialLoader(templater);

  router.on("route:tutorial", function (name, lesson, completed) {
    globalEvents.trigger("beginloading");
    tutorialLoader.get(name, function (tut) {
      var lessonData = tut.getLessonData(Number(lesson), completed);
      if (lessonData == Tutorial.NONEXISTENT_SENTINEL) {
        router.goToPage(tut.getDefaultLesson());
      } else {
        //display the code.
        guiController.setEditorState({code: lessonData.code,
          saveEditorState: null,
          showToolbar: false,
          height: null
        });

        //Now, display new instructions:
        globalEvents.trigger("loaded");
        guiController.setInstructions(lessonData.instructions);
      }
    }, userSession.getDemoFirebase());
  });

  router.on("route:session", function (sessionID) {
    globalEvents.trigger("beginloading");
    userSession.resetSessionID(sessionID,
      function(code) {
        guiController.setEditorState({code: [{text: code}],
          saveEditorState: function() {
            userSession.saveCode(editor.getText());
          },
          showToolbar: true,
          height: 575
        });
      },
      function(parsedData) {
        globalEvents.trigger("loaded");
        parsedData.shareSessID = userSession.getSessID();
        guiController.setInstructions(parsedData);
    });
  });

  router.on("route:gettingstarted", function (sessionID) {
    $("#gettingstarteddiv").show();
    $("#loadingdiv").hide();
    $("#loadeddiv").hide();
  });

  //handle global events
  globalEvents.on("advance", function () {
    var tut = tutorialLoader.getCurrentTutorial();
    if (!tut) {
      console.log("Tried to go to next step in a tutorial, but we haven't loaded one yet...");
      return;
    }
    var error = tut.validateCurrentLesson(editor.getTextAsSegments());
    if (error) {
      guiController.setError(error);
    } else {
      var token = tut.getNextLessonHistoryToken()
      if (token) {
        guiController.startTransition();
        router.goToPage(token);
      } else {
        //We're done with the tutorial. Create a shareable session.
        globalEvents.trigger("skipToEnd");
      }
    }
  });

  globalEvents.on("skipToEnd", function () {
    var tut = tutorialLoader.getCurrentTutorial();
    if (!tut) {
      console.log("Tried to skip to the end of a tutorial, but we haven't loaded one yet...");
      return;
    }
    guiController.startTransition();
    userSession.saveCode(tut.getFinalCode());
    userSession.saveInstructionsMode(TUTORIALS_ROOT + tut.getName() + "/session-instructions.yaml");
    router.goToPage("session/" + userSession.getSessID());
  });

  globalEvents.on("begin", function () {
    $("#gettingstarteddiv").fadeOut(450, function () {
      router.goToPage(DEFAULT_TUTORIAL_TOKEN);
      return false;
    });
    guiController.startTransition();
  });

  globalEvents.on("jumpToStep", function(lessonNum) {
    var tut = tutorialLoader.getCurrentTutorial();
    if (!tut) {
      console.log("Tried to skip to a step in a tutorial, but we haven't loaded one yet...");
      return;
    }
    router.goToPage("tutorial/" + tut.getName() + "/" + lessonNum);
  });
  Backbone.history.start();
}

/**
 * Helper functions that dynamically pulls in a file for us to parse in JS.
 * @param url
 * @param callback
 */
function loadFileAsString(url, callback) {
  $.ajax({
    url:url,
    dataType:"text",
    cache:false,
    success:function (data) {
      callback(data);
    },
    error:function (err) {
      console.log("Failed to load file: " + url);
    }
  });
}

/**
 * Code to manage a "user session" -- the part of the tutorial after code has been loaded and the user is given a URL they can share.
 */
function UserSession(dataRoot, templater) {
  this.rootFirebaseRef_ = dataRoot.child("users").child(this.generateSessionID_());
  this.monitoredPaths = [];
  this.templateSymbols_ = {
    FIREBASE_JS:SCRIPT_ROOT,
    ANGULAR_JS:ANGULAR_JS,
    ANGULARFIRE_JS:ANGULARFIRE_JS,
    TUTORIAL_FIREBASE:PROTOCOL + this.getSessID() + DEMO_SERVER_DOMAIN_SUFFIX,
    SESSIONID: this.getSessID()
  };
  this.templater_ = templater;
  templater.addSymbolSource(this.templateSymbols_);
}

UserSession.prototype.resetSessionID = function (sessID, onCodeLoaded, onInstructionsLoaded) {
  //remove old listeners
  for (var i = 0; i < this.monitoredPaths.length; i++) {
    this.monitoredPaths[i].off();
  }
  this.monitoredPaths = [];

  //and point to a new session
  this.rootFirebaseRef_ = this.rootFirebaseRef_.parent().child(sessID);

  //update the templater
  this.templateSymbols_.TUTORIAL_FIREBASE = PROTOCOL + this.getSessID() + DEMO_SERVER_DOMAIN_SUFFIX;
  this.templateSymbols_.SESSIONID = this.getSessID();

  //now establish new listens to the code and instructions
  var self = this;
  var codeRef = this.rootFirebaseRef_.child("code");
  codeRef.on("value", function (codeSnap) {
    var code = codeSnap.val();
    onCodeLoaded(code ? code : "");
  });
  this.monitoredPaths.push(codeRef);

  var modeRef = this.rootFirebaseRef_.child("instructions");
  modeRef.on("value", function (instructionsSnap) {
    if(instructionsSnap.val() !== null) {
      loadFileAsString(instructionsSnap.val(), function (data) {
        var parsedData = jsyaml.load(data);
        parsedData.body = self.templater_.render(parsedData.body);
        onInstructionsLoaded(parsedData);
      });
    }
  });
  this.monitoredPaths.push(modeRef);
}

UserSession.prototype.generateSessionID_ = function () {
  if (window.isDebugMode) {
    return "chat";
  } else {
    var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    var retVal = chars.charAt(Math.floor(Math.random() * 26, 1));
    for (var i = 0; i < 10; i++) {
      retVal = retVal + chars.charAt(Math.floor(Math.random() * chars.length, 1));
    }
    return retVal;
  }
}

UserSession.prototype.getDemoFirebase = function () {
  return new Firebase(PROTOCOL + this.getSessID() + DEMO_SERVER_DOMAIN_SUFFIX);
}

UserSession.prototype.getSessID = function () {
  return this.rootFirebaseRef_.name();
}

UserSession.prototype.saveCode = function (code) {
  this.rootFirebaseRef_.child("code").set(code);
}

UserSession.prototype.saveInstructionsMode = function (instFile) {
  this.rootFirebaseRef_.child("instructions").set(instFile);
}

/***
 * Loads tutorials and caches them.
 */
function TutorialLoader(templater) {
  this.currentTutorialName = null;
  this.currentTutorial = null;
  this.templater_ = templater;
}

TutorialLoader.prototype.get = function (tutorialName, callback, fbRef) {
  var self = this;
  if (tutorialName == this.currentTutorialName) {
    setTimeout(function () {
      callback(self.currentTutorial);
    }, 0);
  } else {
    //We're loading a new tutorial. Go get it.
    this.loadTutorialData_(tutorialName, function (tutData) {
      var newTut = new Tutorial(tutorialName, tutData, self.templater_);
      fbRef.set(newTut.getSampleData());
      self.currentTutorial = newTut;
      self.currentTutorialName = tutorialName;
      callback(newTut);
    });
  }
}

TutorialLoader.prototype.getCurrentTutorial = function () {
  return this.currentTutorial;
}

TutorialLoader.prototype.loadTutorialData_ = function (tutName, callback) {
  loadFileAsString("data/tutorials/" + tutName + "/lessons.yaml", function (yamlText) {
    var parsedData = jsyaml.load(yamlText);
    callback(parsedData);
  });
}

/**
 * This allows us to do string replacement on the tutorial data to customize the tutorial for the particular student.
 * @constructor
 */
function Templater() {
  this.symbolSources_ = [];
}

Templater.prototype.addSymbolSource = function (source) {
  this.symbolSources_.push(source);
}

Templater.prototype.render = function (template, additionalSources) {
  var retVal = template;

  function escapeRegEx(lit) {
    return lit.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }

  var doReplace = function (source) {
    var keys = _.keys(source);
    for (var i = 0; i < keys.length; i++) {
      var sym = keys[i];
      var regexp = new RegExp(escapeRegEx('$' + sym), "g");
      retVal = retVal.replace(regexp, source[sym]);
    }
  }
  _.map(this.symbolSources_, doReplace);
  if(additionalSources) {
    doReplace(additionalSources);
  }

  return retVal;
}

if(!window.isDebugMode) {
  $(document).ready(startTutorial);
}
