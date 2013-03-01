/*jshint node: true */
"use strict";
module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        jshintrc: "../.jshintrc"
      },
      files: {
        src: [
          'grunt.js',
          'lib/*.js',
          'src/*.js'
        ]
      }
    },

//  json: {
//    files: {
//      src: ['_locales/ko/messages.json'],
//      dest: 'dist/locale_ko.js',
//      namespace: 'achecker_locale'
//    }
//  },

    concat: {
      dist: {
        src: [
          'lib/Section.js', 'lib/Sections.js', 'lib/Score.js',
          'dist/locale_ko.js', 'lib/i18n.js', 'src/app.js'
        ],
        dest: 'dist/built.js'
      }
    },

    uglify: {
      dist: {
        src: ['dist/built.js'],
        dest: 'dist/built.min.js'
      }
    }
  });

  // load plugins
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  //grunt.loadNpmTasks('grunt-json');

  // default task
  // grunt.registerTask('default', ['jshint', 'json', 'concat', 'uglify']);
  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
};
