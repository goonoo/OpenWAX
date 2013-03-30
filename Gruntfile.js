/*jshint node: true */
"use strict";
module.exports = function (grunt) {
  var pkgInfo = grunt.file.readJSON('package.json');

  grunt.initConfig({
    pkg: pkgInfo,
    jshint: {
      options: {
        jshintrc: ".jshintrc"
      },
      files: {
        src: [
          'Gruntfile.js',
          'lib/*.js',
          'owax_bookmarklet/src/*.js',
          'owax_ch/app/*.js',
          'owax_ch/app/lib/*.js',
          '!owax_ch/app/lib/colorInspector.js',
          '!owax_ch/app/lib/rainbowColor.js',
          'owax_ff/app/**/*.js',
          '!owax_ff/app/content/scripts/colorInspector.js',
          '!owax_ff/app/content/scripts/rainbowColor.js'
        ]
      }
    },

    qunit: {
      all: ['test/*.test.html']
    },

    json: {
      files: {
        src: ['owax_bookmarklet/_locales/ko/messages.json'],
        dest: 'owax_bookmarklet/dist/locale_ko.js',
        namespace: 'achecker_locale'
      }
    },

    concat: {
      openwax: {
        options: {
          stripBanners: true,
          banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        src: [
          'lib/Section.js',
          'lib/Sections.js',
          'lib/Score.js'
        ],
        dest: 'release/OpenWAX-' + pkgInfo.version + '.js'
      },

      bookmarklet: {
        options: {
          stripBanners: true,
          banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        src: [
          'owax_bookmarklet/lib/Section.js',
          'owax_bookmarklet/lib/Sections.js',
          'owax_bookmarklet/lib/Score.js',
          'owax_bookmarklet/dist/locale_ko.js',
          'owax_bookmarklet/lib/i18n.js',
          'owax_bookmarklet/src/app.js'
        ],
        dest: 'owax_bookmarklet/dist/built.js'
      }
    },

    exec: {
      chrome: {
        command: 'cd owax_ch; zip -r ../release/chrome-app-' + pkgInfo.version + '.zip app/*; cd ..'
      },
      firefox: {
        command: 'cd owax_ff/app; zip -r ../../release/firefox-app-' + pkgInfo.version + '.xpi . -i \\*.xul -i \\*.js -i \\*.html -i \\*.properties -i \\*.dtd -i \\*.css -i \\*.png -i \\*.manifest -i \\*.rdf -x test\\* -x sample\\* -x template\\* -x \\*sample.html; cd ../..'
      }
    },

    uglify: {
      bookmarklet: {
        options: {
          stripBanners: true,
          banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        src: ['owax_bookmarklet/dist/built.js'],
        dest: 'owax_bookmarklet/dist/built.min.js'
      }
    }
  });

  // load plugins
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-json');

  // default task
  grunt.registerTask('default', ['jshint', 'qunit', 'json', 'concat', 'uglify', 'exec']);
};
