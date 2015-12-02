var gulp = require('gulp'),
nodemon = require('gulp-nodemon'),
plumber = require('gulp-plumber'),
livereload = require('gulp-livereload'),
babel = require('gulp-babel'),
sass = require('gulp-ruby-sass'),
sh = require('shelljs');

var paths = {
    js: [
        'src/**/*.js'
    ],
    views: [
        'src/**/*.handlebars'
    ]
}

gulp.task('clean-app', function() {
    sh.rm('-r', 'app/');
});

gulp.task('sass', function () {
    return sass('./public/css/**/*.scss')
    .pipe(gulp.dest('./public/css'))
    .pipe(livereload());
});

gulp.task('views', function () {
    return gulp.src(paths.views)
    .pipe(gulp.dest('app/'));
});

gulp.task('javascript', function(done) {
    return gulp.src(paths.js)
    .pipe(babel({
            presets: ['es2015']
        }))
    .pipe(gulp.dest('app/'));
});


gulp.task('watch', function() {
    gulp.watch(paths.js, ['javascript']);
});

gulp.task('develop', function () {
    livereload.listen();
    nodemon({
        exec: 'node-inspector --web-port=3000 & node --debug',
        script: 'app.js',
        debug: true,
        ext: 'js coffee handlebars',
        stdout: false
    }).on('readable', function () {
        this.stdout.on('data', function (chunk) {
            if(/^Express server listening on port/.test(chunk)){
                livereload.changed(__dirname);
            }
        });
        this.stdout.pipe(process.stdout);
        this.stderr.pipe(process.stderr);
    });
});

gulp.task('default', [
    'clean-app',
    'javascript',
    'views',
    'sass',
    'develop',
    'watch'
]);
gulp.task('build', [
    'clean-app',
    'javascript',
    'views',
    'sass'
]);
