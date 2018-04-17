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
const tap = require('gulp-tap');
const using = require('gulp-using');

let filePath = '';

gulp.task('default', ['prefix']);

gulp.task('prefix', function () {
    return gulp.src(['gulp/scss/*.scss'])
        .pipe(using())
        .pipe(plumber({
            errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(getFileName(filePath))
        .pipe(sass())
        .pipe(autoprefixer({
            browsers: ['last 4 version', 'iOS >= 8.1', 'Android >= 4.4'],
            cascade: false
        }))
        .pipe(rename(function(path) {
            console.log(filePath);
            let pathArr = filePath.substr(0, filePath.length-5).split('\\');
            let lastDir = pathArr[pathArr.length-1];
            console.log(lastDir);
            path.dirname = lastDir;
            path.extname = '.css';
            path.basename = 'style2';
        }))
        .pipe(gulp.dest("public/"));
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
   gulp.task('./gulp/scss/*scss', ['prefix'])
       .on('change', function(event) {
           console.log('File ' + event.path + ' was ' + event.type + ', running tasks...')
   });
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

function getBottomDir(path) {
    let pathArr = path.substr(0, filePath.length-4).split('\\');
    console.log('ふにふに', pathArr[pathArr.length-1]);
    return pathArr[pathArr.length-1];
}

