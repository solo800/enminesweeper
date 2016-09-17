var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    sass = require('gulp-sass'),
    sassSrc = './sass/*.scss',
    cssDest = './css';

var jsfiles = ['*.js', 'src/**/*.js'];

gulp.task('sass', function () {
    return gulp.src(sassSrc)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(cssDest));
});

gulp.task('sass:watch', function () {
    gulp.watch(sassSrc, ['sass']);
});

gulp.task('jsStyle', function () {
    return gulp.src(jsfiles)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish', {
            verbose: true
        }));
});

gulp.task('jsStyle:watch', function () {
    gulp.watch(jsfiles, ['jsStyle']);
});

gulp.task('default', [
    'sass',
    'sass:watch',
    'jsStyle',
    'jsStyle:watch'
], function () {});
