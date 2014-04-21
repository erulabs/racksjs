// SkinnyJS Gulpfile
"use strict";

var source = [ 'src/**/*.coffee' ],
	test = [ 'test/**/*.coffee' ],
    dest = 'dist',
    gulp = require('gulp'),
    coffee = require('gulp-coffee'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename');

gulp.task('sources', function () {
	return gulp.src(source)
		.pipe(coffee())
		.pipe(concat('racks.js'))
		.pipe(gulp.dest(dest))
		.pipe(rename('racks.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest(dest));
});

gulp.task('tests', function () {
	return gulp.src(test)
		.pipe(coffee())
		.pipe(concat('test.js'))
		.pipe(gulp.dest('test'));
});

gulp.task('default', ['sources']);

gulp.task('watch', function () {
	gulp.watch(source, ['sources']);
	gulp.watch(test, ['tests']);
});
