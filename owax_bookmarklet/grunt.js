module.exports = function (grunt) {
  "use strict";

  grunt.loadNpmTasks('grunt-json');

  grunt.initConfig({
    json: {
      localeKo: {
        src: '_locales/ko/messages.json',
        dest: 'dist/locale_ko.js',
        namespace: 'achecker_locale'
      }
    },

    concat: {
      dist: {
        src: [
          'lib/Section.js', 'lib/Sections.js', 'dist/locale_ko.js',
          'lib/i18n.js', 'src/app.js'
        ],
        dest: 'dist/built.js'
      }
    },

    min: {
      dist: {
        src: ['dist/built.js'],
        dest: 'dist/built.min.js'
      }
    }
  });

  grunt.registerTask('default', 'json concat min');
};
