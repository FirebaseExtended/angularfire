/**
 * Set up the GUI and return a handle to the model for the GUI
 * @param globalEvents
 * @return {*}
 */
function initializeGUI(globalEvents, editor) {

  var displayMode = "init";
  globalEvents.on("beginloading", function() {
    $("#gettingstarteddiv").hide();
    displayMode = "beginloading";
    setTimeout(function() {
      if(displayMode == "beginloading") {
        globalEvents.trigger("loading");
      }
    }, 1000);
  });

  globalEvents.on("loading", function() {
    displayMode = "loading";
    $("#gettingstarteddiv").hide();
    $("#loadingdiv").show();
    $("#loadeddiv").hide();
  });

  globalEvents.on("loaded", function() {
    displayMode = "loaded";
    $("#gettingstarteddiv").hide();
    $("#loadingdiv").hide();
    $("#loadeddiv").show();
    editor.refresh();
  });

  var inTransition = false;
  var nextInst = null;
  var nextEditorState = null;

  var InstructionsModel = Backbone.Model.extend({
    startTransition:function () {
      if (!inTransition) {
        nextInst = null;
        nextEditorState = null;
        inTransition = true;
        var self = this;
        $("#fadeOutArea").fadeOut(450, function () {
          inTransition = false;
          if (nextInst) {
            self.setInstructions(nextInst);
          }
          if (nextEditorState) {
            self.setEditorState(nextEditorState);
          }
          return false;
        });
      }
    },
    setInstructions:function (inst) {
      nextInst = inst;
      if (!inTransition) {
        this.set({instructions:inst});
        this.set({error:null});
        $("#fadeOutArea").fadeIn(500, function () {
          return false;
        });
      }
    },
    setEditorState:function(codeState) {
      nextEditorState = codeState;
      if(!inTransition) {
        //set the editor to a new mode...
        editor.setTextAsSegments(nextEditorState.code);
        editor.setSaveHandler(nextEditorState.saveEditorState);
        editor.setMode(nextEditorState.showToolbar, nextEditorState.height);
      }
    },
    setError:function (error) {
      this.set({error:error});
    }
  });
  var Instructions = new InstructionsModel;

  var InstructionsView = Backbone.View.extend({
    el:$("#tutorialbody"),

    events:{
      "click #advanceButton":"advanceTutorial",
      "click #beginButt":"beginTutorial"
    },

    initialize:function () {
      this.listenTo(this.model, "change:instructions", this.render);
      this.listenTo(this.model, "change:error", this.doRenderError);
    },

    firstTime:true,

    render:function () {
      var instData = this.model.get("instructions");
      var renderedBody = this.generateHTMLFromMarkdown_(instData.body);

      //Update the progress widget
      this.showProgressWidget_(instData.progress);
      if (instData.progress) {
        //Set the lesson number in the title
        $("#shareWidget").hide();
        $("#lessonnumber").show()
        $("#lessonnumber").text("" + (instData.progress.lesson + 1) + ".");
      } else {
        $("#lessonnumber").hide();

        if (instData.shareSessID) {
          //Ok, show the share widget instead
          var iframeURL = "https://platform.twitter.com/widgets/tweet_button.html" +
            "?url=" + encodeURIComponent("https://www.firebase.com/tutorial/#session/" + instData.shareSessID) +
            "&text=" + encodeURIComponent("Check out the app I built with @Firebase") +
            "&count=none";
          $("#shareWidget").show();
          var tweetButt = $('<iframe allowtransparency="true" frameborder="0" scrolling="no"' +
            ' src="' + iframeURL + '"' +
            ' style="width:60px; height:20px;"></iframe>')

          var tweetHolder = $("#tweetButtonHolder");
          tweetHolder.empty();
          tweetHolder.append(tweetButt);
        }
      }

      //Update the right column
      $("#advanceDiv").hide();
      if (instData.button) {
        $("#advanceDiv").show();
        if (instData.completed) {
          $("#advanceButton").addClass("blue");
          $("#advanceButton").removeClass("orange");
        } else {
          $("#advanceButton").addClass("orange");
          $("#advanceButton").removeClass("blue");
        }
        $("#advanceButton").text(instData.button);
      }

      //Update the instructions for the step.
      $("#stepTitle").text(instData.title);
      $("#instructions").html(renderedBody);

      //prettify code in instructions
      $("code").addClass("prettyprint");
      prettyPrint();

      //make sure all links in instructions are target blank
      $("#instructions a").attr("target", "_blank");
    },

    doRenderError:function () {
      var error = this.model.get("error");
      if (error) {
        $("#errorText").show();
        $("#errorText").text(error);
      } else {
        $("#errorText").hide()
      }

    },

    advanceTutorial:function () {
      globalEvents.trigger("advance");
    },

    generateHTMLFromMarkdown_:function (toRender) {
      return marked(toRender);
    },

    showProgressWidget_:function (progress) {

      var widgetWrapper = $("#progressWidget");
      var sectionList = $("#lessonnumbuttons");
      sectionList.empty();

      if (progress) {
        widgetWrapper.show();
        for (var i = 0; i < progress.maxLessons; i++) {
          var newLessonButt = null;
          if(progress.lesson == i) {
            newLessonButt = $("<li>" + (i + 1) + "</li>");
            newLessonButt.addClass("active");
          } else {
            var stepLink = $("<a>" + (i + 1) + "</a>");
            stepLink.click((function(lessonNum) {
              return function() {
                globalEvents.trigger("jumpToStep", lessonNum);
              }
            })(i));
            newLessonButt = $("<li></li>");
            newLessonButt.append(stepLink);
          }
          sectionList.append(newLessonButt);
        }
        var skipToEndButt = $("<li><a>&gt;&gt;</a></li>");
        skipToEndButt.click(function() {
          globalEvents.trigger("skipToEnd");
        });
        sectionList.append(skipToEndButt);
      } else {
        widgetWrapper.hide();
      }
    },
    beginTutorial: function() {
      globalEvents.trigger("begin");
    }
  });
  new InstructionsView({model:Instructions});

  return Instructions;
}
