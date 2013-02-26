/*jslint node: true */
module.exports = function (grunt) {
  "use strict";

  grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-exec');

  grunt.initConfig({
    jslint: {
      files: [
        'app/**/*.js'
      ],
      exclude: [
        'app/content/scripts/colorInspector.js',
        'app/content/scripts/rainbowColor.js'
      ],
      directives: {
        browser: true,
        nomen: true,
        regexp: true,
        plusplus: true,
        indent: 2,
        vars: true
      }
    },

    exec: {
      zip: {
        command: 'cd app; zip -r ../app.xpi . -i \\*.xul -i \\*.js -i \\*.html -i \\*.properties -i \\*.dtd -i \\*.css -i \\*.png -i \\*.manifest -i \\*.rdf -x test\\* -x sample\\* -x template\\* -x \\*sample.html',
        stdout: true
      }
    }
  });

  grunt.registerTask('default', 'jslint exec');
};
