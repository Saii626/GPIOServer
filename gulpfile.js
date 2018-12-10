const gulp = require('gulp');
const nodemon = require('nodemon');

gulp.task('default', function() {
  nodemon({
      script: 'server/gpioserver.js',
      ignore: ['public/*', 'node_modules/*'],
      watch: ['server/scripts']
    })
    .on('restart', function() {
      console.log("server restarted");
    })
});