const gulp = require("gulp");
const autoprefixer = require("gulp-autoprefixer");
const imagemin = require("gulp-imagemin");
const uglyfy = require("gulp-uglify");
const rename = require("gulp-rename");
const ejs = require("gulp-ejs");
const Stream = require('stream');
const sass = require('gulp-sass');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');

let filePath = '';

// let babel = require("babel-core");
// import { transform } from 'babel-core';
// import * as babel from 'babel-core';
//
// babel.transform(code, options); // => { code, map, ast }

gulp.task('prefix', function () {
    return gulp.src(['gulp/scss/*.scss'])
        .pipe(getFileName())
        .pipe(plumber({
            errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(sass())
        .pipe(autoprefixer({
            browsers: ['last 4 version', 'iOS >= 8.1', 'Android >= 4.4'],
            cascade: false
        }))
        .pipe(gulp.dest("public/"+ getLastDir() +"/style2.css"));
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

gulp.task('watch', function () {
   gulp.task('gulp/scss/*scss', ['prefix']);
});

gulp.task("ejs", function() {
    gulp.src(
        ["gulp/ejs/fragment/*.ejs"] //参照するディレクトリ、出力を除外するファイル
    )
        .pipe(ejs())
        .pipe(getFileName(filePath))
        .pipe(rename(function(path) {
            console.log(filePath);
            let pathArr = filePath.substr(0, filePath.length-4).split('\\');
            let lastDir = pathArr[pathArr.length-1];
            console.log(lastDir);
            path.dirname = lastDir;
            path.extname = '.html';
            path.basename = 'index2';
        }))
        .pipe(gulp.dest("public/"))
});

function getFileName() {
    let stream = new Stream.Transform({ objectMode: true });
    stream._transform = function(file, unused, callback) {
        filePath = file.path;
        callback(null, file);
    };
    return stream;
}

function getScssDir() {
    let pathArr = filePath.substr(0, filePath.length-5).split('\\');
    return pathArr[pathArr.length-1];
}

gulp.task('default', ['ejs']);