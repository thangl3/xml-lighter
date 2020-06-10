const { src, dest, series, parallel, watch } = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
const inject = require('gulp-inject');
const del = require('del');
const injectSeries = require('stream-series');
const browserSync = require('browser-sync').create();

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

function streamJsTestTask() {
  return src('test/*.js')
    .pipe(babel())
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(dest('dist/'));
}

function injectTask() {
  return src('test/*.html')
    .pipe(inject(
      injectSeries(streamJsTask(), streamCssTask(), streamJsTestTask()),
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

function dev() {
  browserSync.init({
    server: {
      baseDir: 'dist',
      directory: true,
    },
    serveStatic: [{ route: 'dist', dir: './dist' }],
  });
  watch('themes/*.css', series(clear, injectTask)).on('change', browserSync.reload);
  watch('test/*.*', series(clear, injectTask)).on('change', browserSync.reload);
  watch('src/*.js', series(clear, injectTask)).on('change', browserSync.reload);
}

exports.dev = dev;
exports.test =  series(clear, injectTask);
exports.default = series(clear, parallel(streamCssTask, streamJsTask));
