/*jslint node: true */
module.exports = function (grunt) {
  "use strict";

  grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-exec');

  grunt.initConfig({
    jslint: {
      files: [
        'app/*.js',
        'app/lib/*.js'
      ],
      exclude: [
        'app/lib/colorInspector.js',
        'app/lib/rainbowColor.js'
      ],
      directives: {
        nomen: true,
        regexp: true,
        plusplus: true,
        indent: 2,
        vars: true
      }
    },

    exec: {
      zip: {
        command: 'zip -r app.zip app/*'
      }
    }
  });

  grunt.registerTask('default', 'jslint exec');
};
