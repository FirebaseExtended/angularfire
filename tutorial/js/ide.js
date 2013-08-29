/**
 * Wrapper object for the code editor, play frame, and toolbar.
 * 
 * This depends on codemirror, which can be built using this command:
 * ./bin/compress codemirror xml htmlmixed matchbrackets closetag javascript > codemirror.min.js
 */

function TutorialIDE(el, firebaseDataRef) {
  this.myEl_ = el;
  
  //Set up the HTML structure
  el.addClass("ideContainer");
  var toolbarEl = $("<div></div>");
  el.append(toolbarEl);
  var contentsEl = $("<div></div>");
  el.append(contentsEl);

  this.editorWrapper = $("<div></div>");
  contentsEl.append(this.editorWrapper);
  this.playFrameWrapper = $("<div></div>");
  this.playFrameWrapper.addClass("playContainer");
  contentsEl.append(this.playFrameWrapper);

  //set up my components
  this.toolbar = new IDEToolbar(toolbarEl, this);
  this.editor = new EditorManager(this.editorWrapper);
  this.playFrame = new PlayFrame(this.playFrameWrapper, firebaseDataRef);

  this.setPlayMode_(false);

  var self = this;
  var trySave = function() {
    self.save();
  };
  this.editor.addBlurHandler(trySave);
  setInterval(trySave, 120000);
}

TutorialIDE.prototype.setSaveHandler = function(saveHandler) {
  this.saveHandler_ = saveHandler;
}

TutorialIDE.prototype.setMode = function(toolbarVisible, height) {
  this.toolbar.setVisible(toolbarVisible);
  this.playFrame.setHeight(height);
  //this.editor.setHeight(height);
  this.edit();
  this.refresh();
}

TutorialIDE.prototype.refresh = function() {
  this.editor.refresh();
}

TutorialIDE.prototype.setText = function (text) {
  this.setTextAsSegments([
    {text:text}
  ]);
}

TutorialIDE.prototype.setTextAsSegments = function (segments) {
  this.editor.set(segments);
}

TutorialIDE.prototype.getText = function () {
  return this.editor.get().join("\n");
}

TutorialIDE.prototype.getTextAsSegments = function () {
  return this.editor.get();
}

TutorialIDE.prototype.play = function () {
  this.save();
  this.setPlayMode_(true);
  var code = this.getText();
  this.playFrame.setContents(code);
}

TutorialIDE.prototype.edit = function () {
  this.setPlayMode_(false);
}

TutorialIDE.prototype.save = function () {
  if (this.saveHandler_) {
    var newText = this.getText();
    if (newText != this.oldText_) {
      this.oldText_ = newText;
      this.saveHandler_(newText);
    }
  }
}

TutorialIDE.prototype.setPlayMode_ = function (isPlayMode) {
  if (isPlayMode) {
    this.editorWrapper.addClass("hide");
    this.playFrameWrapper.removeClass("hide");
    this.toolbar.setDepressedButtonEdit(false);
  } else {
    this.playFrame.setContents("");
    this.playFrameWrapper.addClass("hide");
    this.editorWrapper.removeClass("hide");
    this.toolbar.setDepressedButtonEdit(true);
  }
}

/**
 * Container for the toolbar at the top of the IDE (with play, edit, etc).
 * @param contentDiv
 * @param theIDE
 * @constructor
 */
function IDEToolbar(contentDiv, theIDE) {
  this.myIDE_ = theIDE;
  this.myDiv_ = contentDiv;

  contentDiv.addClass("ideToolbar");

  this.editButt = $("<a><img src='images/code-button.png' style='margin-top: 2px;' />Edit</a>");
  this.editButt.addClass("btn toolbarButton");
  contentDiv.append(this.editButt);

  this.playButt = $("<a><img src='images/green-play-button.png' />Play</a>");
  this.playButt.addClass("btn toolbarButton");
  contentDiv.append(this.playButt);

  var self = this;
  this.editButt.click(function () {
    self.onEditClick();
  });
  this.playButt.click(function () {
    self.onPlayClick();
  });
  
  this.setDepressedButtonEdit(true);
}

IDEToolbar.prototype.setDepressedButtonEdit = function(isEditButt) {
  if(isEditButt) {
    this.editButt.addClass("greydepressed");
    this.editButt.removeClass("lightgrey");
    this.playButt.removeClass("greydepressed");
    this.playButt.addClass("lightgrey");
  } else {
    this.playButt.addClass("greydepressed");
    this.playButt.removeClass("lightgrey");
    this.editButt.removeClass("greydepressed");
    this.editButt.addClass("lightgrey");
  }
}

IDEToolbar.prototype.setVisible = function (visible) {
  if (visible) {
    this.myDiv_.show();
  } else {
    this.myDiv_.hide();
  }
}

IDEToolbar.prototype.onPlayClick = function () {
  this.myIDE_.play();
}

IDEToolbar.prototype.onEditClick = function () {
  this.myIDE_.edit();
}

/**
 * Creates a new editor
 * @param editorDivId The div that will contain this editor.
 */
function EditorManager(el) {
  this.myDiv = el.get(0);
  this.regions = [];
  this.allMarkers_ = [];

  this.editor = CodeMirror(this.myDiv, {
    mode:"htmlmixed",
    autoCloseTags:true,
    lineNumbers:true,
    lineWrapping:false,
    matchBrackets:true
  });
}

EditorManager.prototype.setHeight = function (lim) {
  $(this.editor.getScrollerElement()).css('height', lim ? lim + "px" : "auto");
}

EditorManager.prototype.addBlurHandler = function(handler) {
  this.editor.on("blur", handler);
}

EditorManager.prototype.refresh = function() {
  this.editor.refresh();
}

EditorManager.prototype.set = function (newRegions) {
  //remove old text and regions
  this.clear();

  //Insert all of the text
  var toSet = "";
  for (var i = 0; i < newRegions.length; i++) {
    toSet += ((i == 0) ? "" : "\n") + newRegions[i].text;
  }
  this.editor.setValue(toSet);

  var self = this;
  var setupRegion = function(start, end, isReadOnly, includeLeft, includeRight, color) {
    var startPos = self.editor.posFromIndex(start);
    var endPos = self.editor.posFromIndex(end);
    var marker = self.editor.markText(startPos, endPos, {
      inclusiveLeft: includeLeft,
      inclusiveRight: includeRight,
      readOnly:isReadOnly
    });

    if(color) {
      for (var lN = startPos.line; lN <= endPos.line; lN++) {
        self.editor.addLineClass(lN, "background", "readonlyBackground");
      }
    }
    self.allMarkers_.push(marker);
    return marker;
  }

  var curInd = 0;
  for (var i = 0; i < newRegions.length; i++) {
    var curReg = newRegions[i];
    var isLast = i == newRegions.length - 1;
    var curReadOnly = curReg.readOnly;
    
    //Set up the region
    var newInd = curInd + curReg.text.length;
    this.regions.push(setupRegion(curInd, newInd, curReadOnly, true, true, curReadOnly));
    curInd = newInd;
    if(!isLast) {
      setupRegion(curInd, curInd + 1, true, curReadOnly, false,  false)
      curInd++;
    }
  }

  this.editor.refresh();
}

EditorManager.prototype.clear = function () {
  //remove bookmarks
  for (var i = 0; i < this.allMarkers_.length; i++) {
    this.allMarkers_[i].clear();
  }
  this.allMarkers_ = [];
  this.editor.setValue("");
  this.editor.removeLineClass(0, "background", "readonlyBackground");
  this.regions = [];
}

EditorManager.prototype.get = function () {
  var retVal = [];
  for (var i = 0; i < this.regions.length; i++) {
    var range = this.regions[i].find();
    var text = this.editor.getRange(range.from, range.to);
    retVal.push(text);
  }
  return retVal;
}

/**
 * Holds the contents of the running app.
 */
function PlayFrame(el, firebaseUserRef) {
  this.myEl = el;
  this.myFirebaseRef = firebaseUserRef;
  this.myPlayWindowID = "firebasePlayWindow" + (Math.floor(Math.random() * 100000000));
  this.myContents = null;

  if (this.myFirebaseRef) {
    var popoutButt = $("<div><div>Popout<img class='popoutImg' src='images/external-link.png' /></div></div>");
    popoutButt.addClass("popoutButt");
    this.myEl.append(popoutButt);
    var self = this;
    popoutButt.click(function () {
      self.popout();
    });
  }
}

PlayFrame.prototype.setHeight = function(lim) {
  this.myEl.css('height', lim ? lim + "px" : "auto");
}

/**
 * Contains the running code.
 * @private
 */
PlayFrame.prototype.refreshIFrame_ = function () {
  if (this.myIFrame) {
    $(this.myIFrame).contents().empty();
    $(this.myIFrame).remove();
  }

  this.myIFrame = document.createElement("iframe");
  $(this.myIFrame).addClass("playIFrame");
  $(this.myIFrame).addClass("noborder");
  this.myEl.append($(this.myIFrame));
}

PlayFrame.prototype.setContents = function (newContents) {
  this.myContents = newContents;

  //Throw away the old iframe and get a new one
  this.refreshIFrame_();

  // Originally we were doing document. open() / write() / close() to write the iframe contents, but IE
  // would run the javascript out-of-order.  So using the approach from here:
  // http://sparecycles.wordpress.com/2012/03/08/inject-content-into-a-new-iframe/
  this.myIFrame.contentWindow.contents = newContents;
  this.myIFrame.src = 'javascript:window["contents"]';
  $(this.myIFrame).focus();
}

PlayFrame.prototype.popout = function () {
  this.myFirebaseRef.set(this.myContents);
  window.open("play.html#" + this.myFirebaseRef.name(), this.myPlayWindowID);
}
