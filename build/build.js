// Copyright 2015 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Gulp tasks for building the project.
 */
import del from 'del';
import gulp from 'gulp';
import gulpFilter from 'gulp-filter';
import gulpMinifyCss from 'gulp-minify-css';
import gulpHtmlmin from 'gulp-htmlmin';
import gulpUglify from 'gulp-uglify';
import gulpUseref from 'gulp-useref';
import gulpRev from 'gulp-rev';
import gulpRevReplace from 'gulp-rev-replace';
import uglifySaveLicense from 'uglify-save-license';
import path from 'path';

import conf from './conf';

/**
 * Builds production package and places it in the dist directory.
 */
gulp.task('build', ['backend:prod', 'build-frontend']);

/**
 * Builds production version of the frontend application.
 *
 * Following steps are done here:
 *  1. Vendor CSS and JS files are concatenated and minified.
 *  2. index.html is minified.
 *  3. CSS and JS assets are suffixed with version hash.
 *  4. Everything is saved in the dist directory.
 */
gulp.task('build-frontend', ['assets', 'index:prod', 'clean-dist'], function() {
  let htmlFilter = gulpFilter('*.html', {restore: true});
  let vendorCssFilter = gulpFilter('**/vendor.css', {restore: true});
  let vendorJsFilter = gulpFilter('**/vendor.js', {restore: true});
  let assetsFilter = gulpFilter(['**/*.js', '**/*.css'], {restore: true});
  let searchPath = [
    // To resolve local paths.
    path.relative(conf.paths.base, conf.paths.prodTmp),
    // To resolve bower_components/... paths.
    path.relative(conf.paths.base, conf.paths.base),
  ];

  return gulp.src(path.join(conf.paths.prodTmp, '*.html'))
      .pipe(gulpUseref({searchPath: searchPath}))
      .pipe(vendorCssFilter)
      .pipe(gulpMinifyCss())
      .pipe(vendorCssFilter.restore)
      .pipe(vendorJsFilter)
      .pipe(gulpUglify({preserveComments: uglifySaveLicense}))
      .pipe(vendorJsFilter.restore)
      .pipe(assetsFilter)
      .pipe(gulpRev())
      .pipe(assetsFilter.restore)
      .pipe(gulpUseref({searchPath: searchPath}))
      .pipe(gulpRevReplace())
      .pipe(htmlFilter)
      .pipe(gulpHtmlmin({
        removeComments: true,
        collapseWhitespace: true,
        conservativeCollapse: true,
      }))
      .pipe(htmlFilter.restore)
      .pipe(gulp.dest(conf.paths.distPublic));
});

/**
 * Copies assets to the dist directory.
 */
gulp.task('assets', ['clean-dist'], function() {
  return gulp.src(path.join(conf.paths.assets, '/**/*'), {base: conf.paths.app})
      .pipe(gulp.dest(conf.paths.distPublic));
});

/**
 * Cleans all build artifacts.
 */
gulp.task('clean', ['clean-dist'], function() {
  return del([conf.paths.goWorkspace, conf.paths.tmp, conf.paths.coverage]);
});

/**
 * Cleans all build artifacts in the dist/ folder.
 */
gulp.task('clean-dist', function() { return del([conf.paths.dist]); });
