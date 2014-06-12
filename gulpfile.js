// SkinnyJS Gulpfile
"use strict";

var source = [ 'src/racks.coffee', 'src/utils.coffee' ],
	products = [ 'src/products/*.coffee' ],
	test = [ 'test/**/*.coffee' ],
	dest = 'dist',
	gulp = require('gulp'),
	coffee = require('gulp-coffee'),
	uglify = require('gulp-uglify'),
	concat = require('gulp-concat'),
	rename = require('gulp-rename'),
	gutil = require('gulp-util');

gulp.task('sources', function () {
	return gulp.src(source)
		.pipe(coffee())
		.pipe(gulp.dest(dest))
		.on('error', gutil.log);
});

gulp.task('products', function () {
	return gulp.src(products)
		.pipe(coffee())
		.pipe(gulp.dest(dest + '/products'))
		.on('error', gutil.log);
});

gulp.task('tests', function () {
	return gulp.src(test)
		.pipe(coffee())
		.pipe(concat('test.js'))
		.pipe(gulp.dest('test'))
		.on('error', gutil.log);
});

gulp.task('default', ['sources', 'tests', 'products']);

gulp.task('watch', ['default'], function () {
	gulp.watch(source, ['sources']);
	gulp.watch(products, ['products']);
	gulp.watch(test, ['tests']);
});
