/* global module */

module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    exec: {
      casperjs : {
        command : 'casperjs test tests/'
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

    changelog: {
      options: {
        dest: 'CHANGELOG.md'
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-notify');
  grunt.loadNpmTasks('grunt-conventional-changelog');

  grunt.registerTask('build', ['jshint', 'uglify']);
  grunt.registerTask('test', ['exec:casperjs']);

  grunt.registerTask('default', ['build', 'test']);
};
