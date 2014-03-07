/* global module */

module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    exec: {
      casperjs : {
        command : 'casperjs test tests/e2e/'
      }
    },

    uglify : {
      app : {
        files : {
          'angularfire.min.js' : ['angularfire.js']
        }
      }
    },

    jshint : {
      options : {
        'bitwise' : true,
        'boss'    : true,
        'browser' : true,
        'curly'   : true,
        'devel'   : true,
        'eqnull'  : true,
        'globals' : {
          'angular'             : false,
          'Firebase'            : false,
          'FirebaseSimpleLogin' : false
        },
        'globalstrict' : true,
        'indent'       : 2,
        'latedef'      : true,
        'maxlen'       : 115,
        'noempty'      : true,
        'nonstandard'  : true,
        'undef'        : true,
        'unused'       : true,
        'trailing'     : true
      },
      all : ['angularfire.js']
    },

    watch : {
      scripts : {
        files : 'angularfire.js',
        tasks : ['default', 'notify:watch'],
        options : {
          interrupt : true
        }
      }
    },

    notify: {
      watch: {
        options: {
          title: 'Grunt Watch',
          message: 'Build Finished'
        }
      }
    },

    karma: {
      unit: {
        configFile: 'tests/automatic_karma.conf.js'
      },
      continuous: {
        configFile: 'tests/automatic_karma.conf.js',
        singleRun: true,
        browsers: ['PhantomJS']
      },
      auto: {
         configFile: 'tests/automatic_karma.conf.js',
         autowatch: true,
         browsers: ['PhantomJS']
      }/*,
      "kato": {
         configFile: 'tests/automatic_karma.conf.js',
         options: {
            files: [
               '../bower_components/angular/angular.js',
               '../bower_components/angular-mocks/angular-mocks.js',
               '../lib/omnibinder-protocol.js',
               'lib/lodash.js',
               'lib/MockFirebase.js',
               '../angularfire.js',
               'unit/AngularFire.spec.js'
            ]
         },
         autowatch: true,
         browsers: ['PhantomJS']
      }*/
    },

    changelog: {
      options: {
        dest: 'CHANGELOG.md'
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('build', ['jshint', 'uglify']);
  grunt.registerTask('test', ['exec:casperjs', 'karma:continuous']);

  grunt.registerTask('protractor', 'e2e tests for omnibinder', function () {
    var done = this.async();

    if (!grunt.file.isDir('selenium')) {
      grunt.log.writeln('Installing selenium and chromedriver dependency');
      grunt.util.spawn({
        cmd: './node_modules/protractor/bin/install_selenium_standalone'
      }, function (err) {
        if (err) grunt.log.error(err);

        runProtractor();
      });
    } else {
      runProtractor();
    }

    function runProtractor() {
      grunt.util.spawn({
        cmd: './node_modules/protractor/bin/protractor',
        args: ['tests/protractorConf.js']
      }, function (err, result, code) {
        grunt.log.write(result);
        done(err);
      });
    }
  });

  grunt.registerTask('default', ['build', 'test']);
};
