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
          port: 3030
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
        jshintrc: '.jshintrc'
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
      },
      manual: {
        configFile: 'tests/manual_karma.conf.js',
        autowatch: true,
        singleRun: true
      }
    },

    // End to end (e2e) tests
    protractor: {
      options: {
        configFile: "tests/protractor.conf.js"
      },
      singlerun: {},
      saucelabs: {
        options: {
          args: {
            sauceUser: process.env.SAUCE_USERNAME,
            sauceKey: process.env.SAUCE_ACCESS_KEY
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
    }
  });

  require('load-grunt-tasks')(grunt);

  // Installation
  grunt.registerTask('install', ['shell:protractor_install']);
  grunt.registerTask('update', ['shell:npm_install', 'shell:bower_install']);

  // Single run tests
  grunt.registerTask('test', ['test:unit', 'test:e2e']);
  grunt.registerTask('test:unit', ['karma:singlerun']);
  grunt.registerTask('test:e2e', ['connect:testserver', 'protractor:singlerun']);
  grunt.registerTask('test:manual', ['karma:manual']);

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
