let gulp = require("gulp");
let autoprefixer = require("gulp-autoprefixer");
let imagemin = require("gulp-imagemin");
let uglyfy = require("gulp-uglify");

let babel = require("babel-core");
import { transform } from 'babel-core';
import * as babel from 'babel-core';

babel.transform(code, options); // => { code, map, ast }

gulp.task('prefix', function () {
    return gulp.src(['public/*.css'])
        .pipe(autoprefixer({
            browsers: ['last 4 version', 'iOS >= 8.1', 'Android >= 4.4'],
            cascade: false
        }))
        .pipe(gulp.dest('gulp/css'));
});

gulp.task('babel', function() {
    gulp.src('public/*.es6')
        .pipe(babel())
        .pipe(gulp.dest('gulp/babel'));
});

gulp.task('test', function () {
    console.log('test');
});

gulp.task('img', function () {
   gulp.src('hogehoge')
       .pipe(imagemin())
       .pipe(gulp.dist('fuga'));
});

gulp.task('default', ['babel', 'prefix']);