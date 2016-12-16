var path = require('path'), fs = require('fs');

module.exports = function (grunt) {

    var
        fileName = 'keys.js',
        minFileName = 'key.min.js',
        src = './src/', dist = './dist/',
        uglify = {
            main:{
                files: {}
            },
            options:{
                mangle: false,
                beautify: true,
                indentStart: 0,
                indentLevel: 0
            }
        };
    uglify.main.files[dist + minFileName] = [dist + fileName];

    grunt.initConfig({
        uglify:uglify
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('build', function () {
        try {
            fs.mkdirSync(dist);
        }catch(e){
            // dir exists
        }
        fs.writeFileSync(dist + fileName, fs.readFileSync(src + fileName));

        grunt.task.run('uglify');
    });
};