let gulp = require("gulp");
let autoprefixer = require("gulp-autoprefixer");
let imagemin = require("gulp-imagemin");
let uglyfy = require("gulp-uglify");
let rename = require("gulp-rename");
let ejs = require("gulp-ejs");
let Stream = require('stream');

// let babel = require("babel-core");
// import { transform } from 'babel-core';
// import * as babel from 'babel-core';
//
// babel.transform(code, options); // => { code, map, ast }

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


let filePath = '';
function getFileName() {
    let stream = new Stream.Transform({ objectMode: true });
    stream._transform = function(file, unused, callback) {
        filePath = file.path;
        callback(null, file);
    };
    return stream;
}

gulp.task('default', ['ejs']);