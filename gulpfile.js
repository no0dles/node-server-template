var gulp = require("gulp");
var shell = require("gulp-shell");
var tslint = require("gulp-tslint");
var mocha = require("gulp-mocha");
var clean = require("gulp-clean");
var ts = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var istanbul = require("gulp-istanbul");
var open = require("gulp-open");
var argv = require("yargs").argv;
var path = require("path");
var remapIstanbul = require("remap-istanbul/lib/gulpRemapIstanbul");

const tsProject = ts.createProject('tsconfig.json');

gulp.task("watch", ["build"], function () {
  return gulp.watch("lib/**/*.ts", ["compile-ts"]);
});

gulp.task("build", ['compile-ts']);

gulp.task("pre-coverage", function () {
  return gulp.src(["dist/**/*.js", "!dist/**/*spec.js", "!dist/**/*.mock.js"])
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

gulp.task("build-coverage", ["set-test-node-env", "pre-coverage"], function () {
  return gulp.src("dist/**/*.spec.js", {read: false})
    .pipe(mocha({
      reporter: "dot",
      require: ["source-map-support/register"]
    }))
    .pipe(istanbul.writeReports({
      reporters: [ /*"lcov",*/ "json" ],
      reportOpts: {
        //lcov: {dir: "dist/coverage/html", file: "lcov.info" },
        json: {dir: "dist/coverage/json", file: "coverage.json" }
      }
    }));
});

gulp.task("coverage", ["build-coverage"], function () {
  return gulp.src("dist/coverage/json/coverage.json")
    .pipe(remapIstanbul({
      reports: {
        "html": "dist/coverage/html"
      }
    }));
});

gulp.task("open-coverage", ["coverage"], function () {
  return gulp.src('dist/coverage/html/index.html')
    .pipe(open());
});

gulp.task("set-test-node-env", function() {
  return process.env.NODE_ENV = "test";
});

gulp.task("test", ["set-test-node-env"], function () {
  var basePath = "dist/";
  var dir = argv.dir ? path.join(argv.dir, "/**") : "**";
  var pattern = argv.pattern ? argv.pattern : "*.spec.js";

  return gulp.src(path.join(basePath, dir, pattern), {read: false})
    .pipe(mocha({
      reporter: "spec",
      require: ["source-map-support/register"]
    }));
});

gulp.task("clean", function () {
  return gulp.src(["dist/**/*"], {read: false})
    .pipe(clean());
});

gulp.task("compile-ts", function () {
  return tsProject.src()
    .pipe(sourcemaps.init())
    .pipe(ts(tsProject))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("dist"));
});

gulp.task("tslint", function() {
  return gulp.src(["lib/**/*.ts"])
    .pipe(tslint({
      formatter: "prose"
    }))
    .pipe(tslint.report())
});

gulp.task("default", ["watch"]);
