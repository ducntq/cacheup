module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      version: '<%= pkg.version %>',
      banner:
        '// Cacheup\n' +
        '// v<%= pkg.version %>\n' +
        '//\n' +
        '// Copyright (c)<%= grunt.template.today("yyyy") %> Tan Nguyen\n' +
        '// Distributed under MIT license\n' +
        '//\n'
    },

    mochaTest: {
      test: {
        options: {
          timeout: 2500,
          reporter: 'spec',
          slow: 2500
        },
        src: ['tests/test.js'],
      }
    },

    jshint: {
      options: {
        jshintrc : '.jshintrc'
      },
      adapters : [ 'adapters/*.js' ]
    },

    benchmark: {
      all: {
        src: ['benchmarks/*.js'],
        dest: 'benchmarks/results.csv'
      }
    }
  });

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-benchmark');

  grunt.registerTask('test', ['jshint', 'mochaTest']);
  grunt.registerTask('default', ['test']);

};