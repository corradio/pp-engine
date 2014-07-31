var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('gulp-browserify');
var coffee = require('gulp-coffee');
// var sass = require('gulp-ruby-sass');
// var prefix = require('gulp-autoprefixer');
// var rename = require('gulp-rename');
var concat = require('gulp-concat');
var es = require('event-stream');

/*

 - https://npmjs.org/package/gulp-uglify
 - https://npmjs.org/package/gulp-coffeelint
 - https://npmjs.org/package/gulp-exec # run a Python webserver
 - https://npmjs.org/package/gulp-imagemin
 - https://npmjs.org/package/gulp-gzip # to compress assets on S3
 - https://npmjs.org/package/gulp-ngmin
 - https://npmjs.org/package/gulp-symlink
 - https://npmjs.org/package/gulp-notify
 - https://npmjs.org/package/gulp-usemin

*/

gulp.task('scripts', function () {
    gulp.src(['app/scripts/main.coffee'], {read: false})
        .pipe(browserify({
            debug: true,
            transform: ['coffeeify'],
            extensions: ['.js', '.coffee'],
        })).on('error', gutil.log)
        .pipe(concat('main.js'))
        .pipe(gulp.dest('dist/scripts'));
});

gulp.task('app-assets', function () {
    es.concat(
        gulp.src(['app/*.{css,html,ico,txt}', 'app/.htaccess'])
            .pipe(gulp.dest('dist/')),
        gulp.src(['app/styles/*'])
            .pipe(gulp.dest('dist/styles')),
        gulp.src(['app/img/**/*'])
            .pipe(gulp.dest('dist/img')),
        gulp.src(['app/bower_components/**/*'])
            .pipe(gulp.dest('dist/bower_components'))
    );
});

gulp.task('app-templates', function () {
    gulp.src(['app/pages/*.html'])
        .pipe(gulp.dest('dist/pages'));
});

gulp.task('build', ['app-assets', 'app-templates', 'scripts']);