/* global module */
module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*!\n <%= pkg.title || pkg.name %> v<%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> Firebase, Inc.\n' +
        '* MIT LICENSE: http://firebase.mit-license.org/\n*/\n\n'
    },

    /****************
     * CONCAT
     ****************/

    concat: {
      app: {
        options: { banner: '<%= meta.banner %>' },
        src: [
          'src/module.js',
          'src/**/*.js'
        ],
        dest: 'angularfire.js'
      }
    },

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
        ignores: ['src/polyfills.js'],
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
      all: ['src/**/*.js']
    },

    // Auto-run tasks on file changes
    watch : {
      scripts : {
        files : ['src/**/*.js', 'tests/unit/**/*.spec.js'],
        tasks : ['build', 'test:unit', 'notify:watch'],
        options : {
          interrupt : true
        }
      }
    },

    // Unit tests
    karma: {
      options: {
        configFile: 'tests/automatic_karma.conf.js'
      },
      singlerun: {
        autowatch: false,
        singleRun: true
      },
      watch: {
         autowatch: true,
         singleRun: false
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
  grunt.registerTask('install', ['shell:protractor_install']);
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
  grunt.registerTask('build', ['jshint', 'concat', 'uglify']);

  // Default task
  grunt.registerTask('default', ['build', 'test']);
};
