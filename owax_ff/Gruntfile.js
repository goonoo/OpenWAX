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
          'app/**/*.js',
          '!app/content/scripts/colorInspector.js',
          '!app/content/scripts/rainbowColor.js'
        ]
      }
    },

    exec: {
      zip: {
        command: 'cd app; zip -r ../app.xpi . -i \\*.xul -i \\*.js -i \\*.html -i \\*.properties -i \\*.dtd -i \\*.css -i \\*.png -i \\*.manifest -i \\*.rdf -x test\\* -x sample\\* -x template\\* -x \\*sample.html',
        stdout: true
      }
    }
  });

  // load plugins
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('default', ['jshint', 'exec']);
};
