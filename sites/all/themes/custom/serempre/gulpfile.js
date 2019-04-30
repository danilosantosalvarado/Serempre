'use strict';

var importOnce = require('node-sass-import-once'),
  path = require('path');

var options = {};

// #############################
// Edit these paths and options.
// #############################

// The root paths are used to construct all the other paths in this
// configuration. The "project" root path is where this gulpfile.js is located.
// While Zen distributes this in the theme root folder, you can also put this
// (and the package.json) in your project's root folder and edit the paths
// accordingly.
options.rootPath = {
  project     : __dirname + '/',
  styleGuide  : __dirname + '/andes/',
  theme       : __dirname + '/'
};

options.theme = {
  root  : options.rootPath.theme,
  css   : options.rootPath.theme + 'css/',
  sass  : options.rootPath.theme + 'sass/',
  js    : options.rootPath.theme + 'js/'
};

// Set the URL used to access the Drupal website under development. This will
// allow Browser Sync to serve the website and update CSS changes on the fly.
//options.drupalURL = 'http://andes.dev.local/';
 options.drupalURL = 'http://andes.dev.local/';

// Define the node-sass configuration. The includePaths is critical!
options.sass = {
  importer: importOnce,
  includePaths: [
    options.theme.sass,
    options.rootPath.project + 'node_modules/breakpoint-sass/stylesheets',
    options.rootPath.project + 'node_modules/chroma-sass/sass',
    options.rootPath.project + 'node_modules/support-for/sass',
    options.rootPath.project + 'node_modules/typey/stylesheets'
  ],
  outputStyle: 'expanded'
};

// Define which browsers to add vendor prefixes for.
// http://autoprefixer.github.io/
// https://browserl.ist/?q=last%205%20version
// https://evilmartians.com/chronicles/autoprefixer-7-browserslist-2-released
options.autoprefixer = {
  grid: true,
  browsers: [
    'last 5 versions',
    '> 1%',
    'Ie 9',
    'Ie 10',
    'Ie 11'
  ]
};


// Define the paths to the JS files to lint.
options.eslint = {
  files  : [
    options.theme.js + '**/*.js',
    '!' + options.theme.js + '**/*.min.js'
  ]
};

// If your files are on a network share, you may want to turn on polling for
// Gulp watch. Since polling is less efficient, we disable polling by default.
options.gulpWatchOptions = {};
// options.gulpWatchOptions = {interval: 1000, mode: 'poll'};


// ################################
// Load Gulp and tools we will use.
// ################################
var gulp      = require('gulp'),
  $           = require('gulp-load-plugins')(),
  browserSync = require('browser-sync').create(),
  del         = require('del'),
  // gulp-load-plugins will report "undefined" error unless you load gulp-sass manually.
  sass        = require('gulp-sass'),
  // kss         = require('kss'),
  plumber     = require('gulp-plumber'),
  notify      = require('gulp-notify'),
  eslint      = require('gulp-eslint');

// The default task.
gulp.task('default', ['build']);

// #################
// Build everything.
// #################
gulp.task('build', ['watch:css']); //'styles:production', 'lint'

// ##########
// Build CSS.
// ##########
var sassFiles = [
  options.theme.sass + '**/*.scss',
  // Do not open Sass partials as they will be included as needed.
  '!' + options.theme.sass + '**/_*.scss'
];

gulp.task('styles', ['clean:css'], function() {
  return gulp.src(sassFiles)
    .pipe(plumber({
      errorHandler: function (error) {
        notify.onError({
          title:    "Gulp",
          subtitle: "Failure!",
          message:  "Error: <%= error.message %>",
          sound:    "Beep"
        }) (error);
        this.emit('end');
      }
    }))
    .pipe($.sourcemaps.init())
    .pipe(sass(options.sass).on('error', sass.logError))
    .pipe($.autoprefixer(options.autoprefixer))
    .pipe($.size({showFiles: true}))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(options.theme.css))
    .pipe($.if(browserSync.active, browserSync.stream({match: '**/*.css'})));
});

gulp.task('styles:production', ['clean:css'], function() {
  return gulp.src(sassFiles)
    .pipe($.sass(options.sass).on('error', sass.logError))
    .pipe($.autoprefixer(options.autoprefixer))
    .pipe($.size({showFiles: true}))
    .pipe(gulp.dest(options.theme.css));
});


// #########################
// Lint Sass and JavaScript.
// #########################
gulp.task('lint', ['lint:sass', 'lint:js']);

// Lint JavaScript.
// https://github.com/adametry/gulp-eslint/tree/master/example
gulp.task('lint:js', function() {
  return gulp.src(options.eslint.files)
    .pipe(eslint({
      configFile: 'config.json'
    }))
    .pipe($.eslint.format());
});

// Lint JavaScript and throw an error for a CI to catch.
gulp.task('lint:js-with-fail', function() {
  return gulp.src(options.eslint.files)
    .pipe($.eslint({
      configFile: 'config.json'
    }))
    //.pipe($.eslint.format())
    .pipe($.eslint.failOnError());
});

// Lint Sass.
gulp.task('lint:sass', function() {
  return gulp.src(options.theme.sass + '**/*.scss')
    .pipe($.sassLint())
    .pipe($.sassLint.format());
});

// Lint Sass and throw an error for a CI to catch.
gulp.task('lint:sass-with-fail', function() {
  return gulp.src(options.theme.sass + '**/*.scss')
    .pipe($.sassLint())
    .pipe($.sassLint.format())
    .pipe($.sassLint.failOnError());
});

// ##############################
// Watch for changes and rebuild.
// ##############################
gulp.task('watch', ['browser-sync','watch:js']); //,'watch:lint-and-styleguide'

gulp.task('browser-sync', ['watch:css'], function() {
  if (!options.drupalURL) {
    return Promise.resolve();
  }
  return browserSync.init({
    proxy: options.drupalURL,
    noOpen: false
  });
});

gulp.task('watch:css', ['styles'], function() {
  return gulp.watch(options.theme.sass + '**/*.scss', options.gulpWatchOptions, ['styles']);
});

gulp.task('watch:lint-and-styleguide', ['lint:sass'], function() {
  return gulp.watch([
      options.theme.sass + '**/*.scss',
    ], options.gulpWatchOptions, ['lint:sass']);
});

gulp.task('watch:js', ['lint:js'], function() {
  return gulp.watch(options.eslint.files, options.gulpWatchOptions, ['lint:js']);
});


// // Clean CSS files.
gulp.task('clean:css', function() {
  return del([
      options.theme.css + '**/*.css',
      options.theme.css + '**/*.map'
    ], {force: true});
});


// Resources used to create this gulpfile.js:
// - https://github.com/google/web-starter-kit/blob/master/gulpfile.babel.js
// - https://github.com/dlmanning/gulp-sass/blob/master/README.md
// - http://www.browsersync.io/docs/gulp/
