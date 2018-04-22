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
const using = require('gulp-using');
const fs = require('fs');

const prefixDir = 'anlweek';
let filePath = '';

gulp.task('default', ['prefix']);

//file watcherで予約中
gulp.task('prefix', function () {
    return gulp.src(['gulp/scss/fragment/'+ prefixDir +'.scss'])
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

//file watcherで予約中
gulp.task("ejs", function() {
    const json = JSON.parse(fs.readFileSync('gulp/ejs/config.json'));
    gulp.src(
        ["gulp/ejs/fragment/*.ejs"] //参照するディレクトリ、出力を除外するファイル
    )
        .pipe(ejs(json))
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

gulp.task('babel', function() {
    gulp.src('public/*.es6')
        .pipe(babel())
        .pipe(gulp.dest('gulp/babel'));
});

gulp.task('img', function () {
   gulp.src('hogehoge')
       .pipe(imagemin())
       .pipe(gulp.dist('fuga'));
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

