/* global module */

module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    // Run shell commands
    shell: {
      options: {
        stdout: true
      },
      protractor_install: {
        command: 'node ./node_modules/protractor/bin/webdriver-manager update'
      },
      npm_install: {
        command: 'npm install'
      },
      bower_install: {
        command: 'bower install'
      }
    },

    // Create local server
    connect: {
      testserver: {
        options: {
          hostname: 'localhost',
          port: 8000
        }
      }
    },

    // Minify JavaScript
    uglify : {
      app : {
        files : {
          'angularfire.min.js' : ['angularfire.js']
        }
      }
    },

    // Lint JavaScript
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

    // Auto-run tasks on file changes
    watch : {
      scripts : {
        files : 'angularfire.js',
        tasks : ['build', 'test:unit', 'notify:watch'],
        options : {
          interrupt : true
        }
      }
    },

    // Unit tests
    karma: {
      options: {
        configFile: 'tests/automatic_karma.conf.js',
      },
      singlerun: {
        autowatch: false,
        singleRun: true
      },
      watch: {
         autowatch: true,
         singleRun: false,
      }
    },

    // End to end (e2e) tests
    protractor: {
      options: {
        keepAlive: true,
        configFile: "tests/protractor.conf.js"
      },
      singlerun: {},
      saucelabs: {
        options: {
          configFile: "tests/protractor.conf.js",
          args: {
            //sauceUser: process.env.SAUCE_USERNAME,
            //sauceKey: process.env.SAUCE_ACCESS_KEY
            sauceUser: "firebase",
            sauceKey: "fe4386d9-4ab2-477b-a0d9-24dbecd98e04"
          }
        }
      }
    },

    // Desktop notificaitons
    notify: {
      watch: {
        options: {
          title: 'Grunt Watch',
          message: 'Build Finished'
        }
      }
    },

    // Auto-populating changelog
    changelog: {
      options: {
        dest: 'CHANGELOG.md'
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  // Installation
  grunt.registerTask('install', ['update', 'shell:protractor_install']);
  grunt.registerTask('update', ['shell:npm_install', 'shell:bower_install']);

  // Single run tests
  grunt.registerTask('test', ['test:unit', 'test:e2e']);
  grunt.registerTask('test:unit', ['karma:singlerun']);
  grunt.registerTask('test:e2e', ['connect:testserver', 'protractor:singlerun']);

  // Watch tests
  grunt.registerTask('test:watch', ['karma:watch']);
  grunt.registerTask('test:watch:unit', ['karma:watch']);

  // Travis CI testing
  grunt.registerTask('travis', ['build', 'test:unit', 'connect:testserver', 'protractor:saucelabs']);

  // Build tasks
  grunt.registerTask('build', ['jshint', 'uglify']);

  // Default task
  grunt.registerTask('default', ['build', 'test']);
};
