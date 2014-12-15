var gulp = require('gulp');
var source = require('vinyl-source-stream'); // Used to stream bundle for further handling
var browserify = require('browserify');
var watchify = require('watchify');
var reactify = require('reactify');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var notify = require('gulp-notify');
var concat = require('gulp-concat');
var cssmin = require('gulp-cssmin');
var gutil = require('gulp-util');
var shell = require('gulp-shell');
var glob = require('glob');
var livereload = require('gulp-livereload');
var jasminePhantomJs = require('gulp-jasmine2-phantomjs');
var jsdoc = require('gulp-jsdoc');
var jsx = require('gulp-jsx');
var requireify = require('requireify');
var print = require('gulp-print');
var rename = require('gulp-rename');

// External dependencies you do not want to rebundle while developing,
// but include in your application deployment
var dependencies = [
	'react',
].concat(glob.sync('./vendors/**/*.js'));


var browserifyTask = function (options) {

  var browserifyTransforms = [
    reactify  // We want to convert JSX to normal javascript
  ];

  if (options.development) {
    browserifyTransforms.push(
      requireify  // allow access to modules in console
    );
  }

  // Our app bundler
	var appBundler = browserify({
		entries: [options.src], // Only need initial file, browserify finds the rest
   	transform: browserifyTransforms,
		debug: options.development, // Gives us sourcemapping
		cache: {}, packageCache: {}, fullPaths: true // Requirement of watchify
	});

	// We set our dependencies as externals on our app bundler when developing
	(options.development ? dependencies : []).forEach(function (dep) {
		appBundler.external(dep);
	});

  // The rebundle process
  var rebundle = function () {
    var start = Date.now();
    console.log('Building APP bundle');
    appBundler.bundle()
      .on('error', gutil.log)
      .pipe(source('main.jsx'))
      .pipe(gulpif(!options.development, streamify(uglify())))
      .pipe(gulpif(/\.jsx$/, rename({extname: '.js'})))
      .pipe(gulp.dest(options.dest))
      .pipe(gulpif(options.live_update, livereload()))
      .pipe(notify(function () {
        console.log('APP bundle built in ' + (Date.now() - start) + 'ms');
      }));
  };

  // Fire up Watchify when developing
  if (options.live_update) {
    appBundler = watchify(appBundler);
    appBundler.on('update', rebundle);
  }

  rebundle();

  // We create a separate bundle for our dependencies as they
  // should not rebundle on file changes. This only happens when
  // we develop. When deploying the dependencies will be included
  // in the application bundle
  if (options.development) {

  	var testFiles = glob.sync('./specs/**/*-spec.js');
		var testBundler = browserify({
			entries: testFiles,
			debug: true, // Gives us sourcemapping
			transform: browserifyTransforms,
			cache: {}, packageCache: {}, fullPaths: true // Requirement of watchify
		});

		dependencies.forEach(function (dep) {
			testBundler.external(dep);
		});

  	var rebundleTests = function () {
  		var start = Date.now();
  		console.log('Building TEST bundle');
  		testBundler.bundle()
      .on('error', gutil.log)
	      .pipe(source('specs.js'))
	      .pipe(gulp.dest(options.dest))
	      .pipe(gulpif(options.live_update, livereload()))
	      .pipe(notify(function () {
	        console.log('TEST bundle built in ' + (Date.now() - start) + 'ms');
	      }));
  	};

    if (options.live_update) {
      testBundler = watchify(testBundler);
      testBundler.on('update', rebundleTests);
    }
    rebundleTests();

    // Remove some modules when deploying, as it is only for
    // testing
    // if (!options.development) {
    //   dependencies.splice(dependencies.indexOf('a-module'), 1);
    // }

    if (options.vendors) {

      var vendorFiles = glob.sync('./vendors/**/*.js');
      var vendorsBundler = browserify({
        entries: vendorFiles,
        debug: true,
        transform: browserifyTransforms,
        require: dependencies
      });

      // Run the vendor bundle
      var start = new Date();
      console.log('Building VENDORS bundle');
      vendorsBundler.bundle()
        .on('error', gutil.log)
        .pipe(source('vendors.js'))
        .pipe(gulpif(!options.development, streamify(uglify())))
        .pipe(gulp.dest(options.dest))
        .pipe(notify(function () {
          console.log('VENDORS bundle built in ' + (Date.now() - start) + 'ms');
        }));

      }

  }

}

var cssTask = function (options) {
    if (options.development) {
      var run = function () {
        console.log(arguments);
        var start = new Date();
        console.log('Building CSS bundle');
        gulp.src(options.src)
          .pipe(concat('main.css'))
          .pipe(gulp.dest(options.dest))
          .pipe(notify(function () {
            console.log('CSS bundle built in ' + (Date.now() - start) + 'ms');
          }));
      };
      run();
      gulp.watch(options.src, run);
    } else {
      gulp.src(options.src)
        .pipe(concat('main.css'))
        .pipe(cssmin())
        .pipe(gulp.dest(options.dest));
    }
}

// Starts our development workflow
gulp.task('default', function () {

  browserifyTask({
    development: true,
    live_update: true,
    vendors: false,
    src: './app/main.jsx',
    dest: './build'
  });

  cssTask({
    development: true,
    src: './styles/**/*.css',
    dest: './build'
  });

});

gulp.task('vendors', function() {

  browserifyTask({
    development: true,
    live_update: false,
    vendors: true,
    src: './app/main.jsx',
    dest: './build'
  });

  cssTask({
    development: true,
    src: './styles/**/*.css',
    dest: './build'
  });

});

gulp.task('deploy', function () {

  browserifyTask({
    development: false,
    live_update: false,
    vendors: true,
    src: './app/main.jsx',
    dest: './dist'
  });

  cssTask({
    development: false,
    src: './styles/**/*.css',
    dest: './dist'
  });

});

gulp.task('test', function () {
    return gulp.src('./build/testrunner-phantomjs.html').pipe(jasminePhantomJs());
});

/**
 * Convert all jsx into real JS then create documentation
 */
gulp.task('doc', function() {
    var docDir = 'doc';
    var docTemplate = {
      path: "node_modules/jaguarjs-jsdoc/"
    };
    gulp.src(["./app/**/*.jsx", "./app/**/*.js"])
        .pipe(gulpif(/\.jsx$/, rename({suffix: '.jsx', extname: '.js'})))
        .pipe(jsx())
        .pipe(gulpif(/\.jsx\.js$/, gulp.dest('./dist-doc')))
        .pipe(jsdoc(docDir, docTemplate));
});
