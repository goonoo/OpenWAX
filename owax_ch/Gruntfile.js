/*jshint node: true */
"use strict";
module.exports = function (grunt) {
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: "../.jshintrc"
      },
      files: {
        src: [
          'grunt.js',
          'app/*.js',
          'app/lib/*.js',
          '!app/lib/colorInspector.js',
          '!app/lib/rainbowColor.js'
        ]
      }
    },

    exec: {
      zip: {
        command: 'zip -r app.zip app/*'
      }
    }
  });

  // load plugins
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('default', ['jshint', 'exec']);
};
