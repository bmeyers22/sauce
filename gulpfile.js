var gulp = require('gulp'),
nodemon = require('gulp-nodemon'),
plumber = require('gulp-plumber'),
livereload = require('gulp-livereload'),
babel = require('gulp-babel'),
sass = require('gulp-ruby-sass');

var paths = {
    js: [
        'src/services/**/*.js',
        'src/controllers/**/*.js'
    ]
}

gulp.task('sass', function () {
    return sass('./public/css/**/*.scss')
    .pipe(gulp.dest('./public/css'))
    .pipe(livereload());
});

gulp.task('controllers', function(done) {
    return gulp.src(['src/controllers/**/*.js'])
    .pipe(babel({
            presets: ['es2015']
        }))
    .pipe(gulp.dest('app/controllers/'));
});

gulp.task('services', function(done) {
    return gulp.src(['src/services/**/*.js'])
    .pipe(babel({
            presets: ['es2015']
        }))
    .pipe(gulp.dest('app/services/'));
});


gulp.task('watch', function() {
    gulp.watch(paths.js, ['controllers', 'services']);
});

gulp.task('develop', function () {
    livereload.listen();
    nodemon({
        script: 'app.js',
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
    'controllers',
    'services',
    'sass',
    'develop',
    'watch'
]);
gulp.task('build', [
    'controllers',
    'services',
    'sass'
]);
