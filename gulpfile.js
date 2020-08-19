const { src, dest, series, parallel, watch } = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
const inject = require('gulp-inject');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const rev = require('gulp-rev');
const del = require('del');
const injectSeries = require('stream-series');
const browserSync = require('browser-sync').create();

sass.compiler = require('node-sass');

function clear() {
  return del(['dist/**']);
}

function streamJsTask() {
  return src('src/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(uglify())
    .pipe(rev())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(browserSync.stream())
    .pipe(sourcemaps.write('./maps'))
    .pipe(dest('dist/'));
}

function streamCssTask() {
  return src('themes/*.{css,scss}')
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(cleanCSS())
    .pipe(rev())
    .pipe(rename({ extname: '.min.css' }))
    .pipe(browserSync.reload({ stream:true }))
    .pipe(sourcemaps.write('./maps'))
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
        relative: false,
        transform: function (filePath, file, index, length, targetFile) {
          if (/(.+?)\.js/.test(file.basename)) {
            return inject.transform.apply(inject.transform, arguments);
          }

          const cssFilenames = file.basename.match(/(.+?)-.+?\.min\.css/);

          if (cssFilenames && targetFile.basename.indexOf(cssFilenames[1]) !== -1) {
            return inject.transform.apply(inject.transform, arguments);
          }

          // const htmlFilenames = file.basename.match(/(.+?)\.html/);
          // if (htmlFilenames && htmlFilenames[1]) {
          //   return inject.transform.apply(inject.transform, arguments);
          // }
        },
      }
    ))
    .pipe(dest('dist/'));
}

function dev() {
  clear();
  injectTask();

  browserSync.init({
    server: {
      baseDir: 'dist',
      directory: true,
    },
    serveStatic: [{ route: 'dist', dir: ['./dist', './data'] }],
    reloadDelay: 500,
  });

  watch('src/*.js', series(clear, injectTask));
  watch('test/*.{html,js}', series(clear, injectTask)).on('change', browserSync.reload);
  watch('themes/*.{css,scss}', series(clear, injectTask));
}

function clearBuild() {
  return del(['build/**']);
}

function streamBuildJsTask() {
  return src('src/*.js')
    .pipe(babel())
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(dest('build/'));
}

function streamBuildCssTask() {
  return src('themes/*.{css,scss}')
    .pipe(sass())
    .pipe(cleanCSS())
    .pipe(rename({ extname: '.min.css' }))
    .pipe(dest('build/'));
}

exports.dev = dev;
exports.buildTest =  series(clear, injectTask);
exports.default = series(clearBuild, parallel(streamBuildCssTask, streamBuildJsTask));
