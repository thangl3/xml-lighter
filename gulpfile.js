const { src, dest, series, parallel, watch } = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
const inject = require('gulp-inject');
const del = require('del');
const es = require('event-stream');
const injectSeries = require('stream-series');
const through2 = require('through2');

function clear() {
  return del(['dist/**']);
}

function streamJsTask() {
  return src('src/*.js')
    .pipe(babel())
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(dest('dist/'));
}

function streamCssTask() {
  return src('themes/*.css')
    .pipe(cleanCSS())
    .pipe(rename({ extname: '.min.css' }))
    .pipe(dest('dist/'));
}

function streamJsExampleTask() {
  return src('example/*.js')
    .pipe(babel())
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(dest('dist/'));
}

function injectTask() {
  return src('example/*.html')
    .pipe(inject(
      injectSeries(streamJsTask(), streamCssTask(), streamJsExampleTask()),
      {
        relative: true,
        transform: function (filePath, file, index, length, targetFile) {
          if (/(.+?)\.js/.test(file.basename)) {
            return inject.transform.apply(inject.transform, arguments);
          }

          const cssFilenames = file.basename.match(/(.+?)\.min.css/);

          if (cssFilenames && targetFile.basename.indexOf(cssFilenames[1]) !== -1) {
            return inject.transform.apply(inject.transform, arguments);
          }
        },
      }
    ))
    .pipe(dest('dist/'));
}

function watcher() {
  watch('themes/*.css', series(clear, streamCssTask));

  watch('src/*.js', series(clear, streamJsTask));
}

exports.clear = clear;
exports.watch = watcher;
exports.inject =  series(clear, injectTask);
exports.default = series(clear, parallel(streamCssTask, streamJsTask));
