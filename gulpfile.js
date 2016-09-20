/*jslint node: true */

var gulp = require('gulp'),
    del = require('del'),
    sass = require('gulp-sass'),
    CSSCompressor = require('gulp-csso'),
    browserSpecificPrefixGenerator = require('gulp-autoprefixer'),
    HTMLMinifier = require('gulp-htmlmin'),
    HTMLValidator = require('gulp-html'),
    JSConcatenator = require('gulp-concat'),
    JSLinter = require('gulp-eslint'),
    JSCompressor = require('gulp-uglify'),
    imageCompressor = require('gulp-imagemin'),
    tempCache = require('gulp-cache'),
    browserSync = require('browser-sync'),
    config = require('./config.json'),
    colors = config.colors,
    reload = browserSync.reload,
    browserChoice = 'default';

/**
 * CHOOSE A BROWSER OTHER THAN THE DEFAULT
 *
 * The following four tasks set the browser preference variable (browserChoice) in
 * the browserSync preferences read by the serve task. To use either of the four
 * browsers when serving this project, invoke Gulp as follows:
 *
 *    gulp safari serve
 *    gulp firefox serve
 *    gulp chrome serve
 *    gulp opera serve
 *
 * Testing in Windows and Linux is pending.
 */

gulp.task('safari', function () {
    'use strict';

    browserChoice = config.browser.safari;
});

gulp.task('firefox', function () {
    'use strict';

    browserChoice = config.browser.firefox;
});

gulp.task('chrome', function () {
    'use strict';

    browserChoice = config.browser.chrome;
});

gulp.task('opera', function () {
    'use strict';

    browserChoice = config.browser.opera;
});

/**
 * VALIDATE HTML
 *
 * This task sources all the HTML files pointed to by the config.scaffoldFolders.html
 * JSON object, then feeds them to the HTMLValidator.
 *
 * On error, the validator will generate one or more incredibly ugly messages to the
 * console with line and column co-ordinates indicating where in your file the error
 * was generated.
 *
 * Note: Regardless of whether your HTML validates or not, no files are copied to any
 * destination folder.
 */
gulp.task('validateHTML', function () {
    'use strict';

    return gulp.src([
        config.baseFolders.dev +
                config.scaffoldFolders.html +
                config.filenames.html.all,

        config.baseFolders.dev +
                config.scaffoldFolders.html +
                config.filenames.html.allNested
    ])
        .pipe(new HTMLValidator());
});

/**
 * COMPRESS HTML
 *
 * This task sources all the HTML files in the folder pointed to by the
 * config.scaffoldFolders.html JSON object, strips comments and whitespace from them,
 * then writes the compressed files to the folder pointed to by the
 * config.baseFolders.prod JSON object.
 *
 * Note: You’ll need to enable the collapseWhitespace option to enable compression,
 *       otherwise, no compression will be carried out on your HTML files.
 */
gulp.task('compressHTML', function () {
    'use strict';

    return gulp.src([
        config.baseFolders.dev +
                config.scaffoldFolders.html +
                config.filenames.html.all,

        config.baseFolders.dev +
                config.scaffoldFolders.html +
                config.filenames.html.allNested
    ])
        .pipe(new HTMLMinifier({
            removeComments: true,
            collapseWhitespace: true
        }))
        .pipe(gulp.dest(config.baseFolders.prod));
});

/**
 * COMPILE CSS FOR DEVELOPMENT WORK
 *
 * This task looks for a single Sass file, compiles the CSS
 * from it, and writes the resulting file to the folder pointed at by the
 * config.scaffoldFolders.styles JSON object. The final CSS file will be formatted
 * with 2-space indentations. Any floating-point calculations will be carried out 10
 * places, and browser-specific prefixes will be added to support 2 browser versions
 * behind all current browsers’ versions.
 */
gulp.task('compileCSSForDev', function () {
    'use strict';

    return gulp.src(config.baseFolders.dev +
            config.scaffoldFolders.styles +
            '00-main-dev/' +
            config.filenames.sass)
        .pipe(sass({
            outputStyle: 'expanded',
            precision: 10
        }).on('error', sass.logError))
        .pipe(browserSpecificPrefixGenerator({
            browsers: ['last 2 versions']
        }))
        .pipe(gulp.dest(config.baseFolders.tmp + config.scaffoldFolders.styles));
});

/**
 * COMPILE CSS FOR PRODUCTION
 *
 * This task looks for a single Sass file, compiles the CSS from it, and writes the
 * resulting single CSS file to the folder pointed at by the
 * config.scaffoldFolders.styles JSON object. Any floating-point calculations will be
 * carried out 10 places, and browser-specific prefixes will be added to support 2
 * browser versions behind all current browsers’ versions. Lastly, the final CSS file
 * is passed through two levels of compression: “outputStyle” from Sass and
 * compressCSS().
 */
gulp.task('compileCSSForProd', function () {
    'use strict';

    return gulp.src(config.baseFolders.dev +
            config.scaffoldFolders.styles +
            '00-main-prod/' +
            config.filenames.sass)
        .pipe(sass({
            outputStyle: 'compressed',
            precision: 10
        }).on('error', sass.logError))
        .pipe(browserSpecificPrefixGenerator({
            browsers: ['last 2 versions']
        }))
        .pipe(new CSSCompressor())
        .pipe(gulp.dest(config.baseFolders.prod + config.scaffoldFolders.styles));
});

/**
 * COMPILE ALL JAVASCRIPT FILES INTO ONE FILE FOR DEVELOPMENT WORK
 *
 * This task sources all the JavaScript files in the folder pointed at by the JSON
 * object config.baseFolders.dev + config.scaffoldFolders.js, gives the compiled
 * JavaScript the name assigned to the JSON object config.filenames.js.main, then
 * writes the result to the JSON object pointed at by config.baseFolders.tmp +
 * config.scaffoldFolders.js.
 */
gulp.task('compileJSForDev', function () {
    'use strict';

    return gulp.src(
        config.baseFolders.dev +
            config.scaffoldFolders.js +
            config.filenames.js.all
    )
        .pipe(new JSConcatenator(config.filenames.js.main))
        .pipe(gulp.dest(config.baseFolders.tmp + config.scaffoldFolders.js));
});

/**
 * COMPILE ALL JAVASCRIPT FILES INTO A SINGLE FILE FOR PRODUCTION
 *
 * This task compiles one or more JavaScript files into a single file whose name is
 * the value to the config.filenames.js.main JSON object. The resulting file is
 * compressed then written to the folder pointed at by the JSON object
 * compileJSForDevbaseFolders.prod + compileJSForDevscaffoldFolders.js.
 *
 * Note: This task does not contain the grid used during development.
 */
gulp.task('compileJSForProd', function () {
    'use strict';

    return gulp.src([
        config.baseFolders.dev +
                config.scaffoldFolders.js +
                config.filenames.js.all,

        '!' + config.baseFolders.dev +
                config.scaffoldFolders.js +
                config.filenames.js.grid
    ])
        .pipe(new JSConcatenator(config.filenames.js.main))
        .pipe(new JSCompressor())
        .pipe(gulp.dest(config.baseFolders.prod + config.scaffoldFolders.js));
});

/**
 * LINT JAVASCRIPT
 *
 * This task lints JavaScript using the linter defined by JSLinter, the second pipe
 * in this task. (ESLint is the linter in this case.) In order to generate a linting
 * report, the multiple JS files in the supplied array are compiled
 * into a single, memory-cached file with a temporary name, then sent to the linter
 * for processing.
 *
 * Note: The temporary file is *not* written to a destination folder.
 */
gulp.task('lintJS', function () {
    'use strict';

    return gulp.src([
        config.baseFolders.dev +
                config.scaffoldFolders.js +
                config.filenames.js.all,

        '!' + config.baseFolders.dev +
                config.scaffoldFolders.js +
                config.filenames.js.grid
    ])
        .pipe(new JSConcatenator(config.filenames.js.main))
        .pipe(new JSLinter({
            rules: {
                indent: [2, 4, {SwitchCase: 1}],
                quotes: [2, 'single'],
                semi: [2, 'always'],
                'linebreak-style': [2, 'unix'],
                'max-len': [2, 85, 4]
            },
            env: {
                node: true,
                browser: true
            },
            extends: 'eslint:recommended'
        }))
        .pipe(JSLinter.formatEach('compact', process.stderr))
        //
        // “To have the process exit with an error code (1) on lint error, return
        // the stream and pipe to failAfterError last.”
        //
        //     — https://github.com/adametry/gulp-eslint
        //
        .pipe(JSLinter.failAfterError());
});

/**
 * COMPRESS THEN COPY IMAGES TO THE PRODUCTION FOLDER
 *
 * This task sources all the images pointed to by the config.baseFolders.dev object,
 * compresses PNGs and JPGs, then copies the final compressed images to the
 * config.baseFolders.prod.
 */
gulp.task('compressThenCopyImagesToProdFolder', function () {
    'use strict';

    return gulp.src(config.baseFolders.dev + config.scaffoldFolders.images + '**/*')
        .pipe(tempCache(
            imageCompressor({
                optimizationLevel: 3, // For PNG files. Accepts 0 – 7; 3 is default.
                progressive: true,    // For JPG files.
                multipass: false,     // For SVG files. Set to true for compression.
                interlaced: false     // For GIF files. Set to true for compression.
            })
        ))
        .pipe(gulp.dest(config.baseFolders.prod + config.scaffoldFolders.images));
});

/**
 * COPY UNPROCESSED ASSETS TO THE PRODUCTION FOLDER
 *
 * This task copies all unprocessed assets that aren’t images, JavaScript, or
 * Sass/CSS in the folder pointed to by the config.baseFolders.dev object to the
 * folder pointed to by the config.baseFolders.prod object. This is because those
 * files are processed by other tasks, specifically:
 *
 * — Images are compressed then copied by the compressThenCopyImagesToProdFolder task
 * — JavaScript is concatenated and compressed by the compileJSForProd task
 * — Sass/CSS is concatenated and compressed by the compileCSSForProd task
 */
gulp.task('copyUnprocessedAssetsToProdFolder', function () {
    'use strict';

    return gulp.src([
        config.baseFolders.dev + '*.*',              // Source all files,
        config.baseFolders.dev + '**',               // and all folders,
                                                     // but not
        '!' + config.baseFolders.dev +
                config.scaffoldFolders.html,         // the HTML folder

        '!' + config.baseFolders.dev +
                config.scaffoldFolders.html + '*.*', // or any files in it

        '!' + config.baseFolders.dev +
                config.scaffoldFolders.html + '**',  // or any sub folders

        '!' + config.baseFolders.dev +
                config.scaffoldFolders.images,       // ignore images;

        '!' + config.baseFolders.dev +
                '**/*.js',                           // ignore JS;

        '!' + config.baseFolders.dev +
                config.scaffoldFolders.styles + '**' // ignore Sass/CSS.
    ], {dot: true}).pipe(gulp.dest(config.baseFolders.prod));
});

/**
 * BUILD
 *
 * This task simply invokes other pre-defined tasks.
 */
gulp.task('build', [
    'validateHTML',
    'compressHTML',
    'compileCSSForProd',
    'lintJS',
    'compileJSForProd',
    'compressThenCopyImagesToProdFolder',
    'copyUnprocessedAssetsToProdFolder'
]);

/**
 * SERVE
 *
 * Used for development only, this task…
 *
 *    — compiles CSS via Sass,
 *    — concatenates one or more JavaScript files into a single file,
 *    — lints JavaScript, and
 *    — validates HTML.
 *
 * Your localhost server looks for index.html as the first page to load from either
 * the temporary folder (config.baseFolders.tmp), the development folder
 * (config.baseFolders.dev), or the folder containing HTML
 * (config.scaffoldFolders.html).
 *
 * Files that require pre-processing must be written to a folder before being served.
 * Thus, CSS and JS are served from a temp folder (config.baseFolders.tmp), while
 * un-processed files, such as fonts and images, are served from the development
 * source folder (config.baseFolders.dev).
 *
 * If a JavaScript file is changed, all JavaScript files are rebuilt, the resulting
 * file is linted, and the browser reloads.
 *
 * If a Sass file is changed, a re-compilation of the primary CSS file is generated,
 * and the browser reloads.
 *
 * Finally, changes to images also trigger a browser reload.
 */
 gulp.task('serve', ['compileCSSForDev', 'compileJSForDev', 'lintJS', 'validateHTML'],
 function () {
	 'use strict';

	 browserSync({
		 notify: true,
		 port: 9000,
		 reloadDelay: 100,
		 browser: browserChoice,
		 server: {
			 baseDir: [].concat(
				 		config.baseFolders.libs,
						config.baseFolders.tmp,
						config.baseFolders.dev,
						config.baseFolders.dev + config.scaffoldFolders.html
					)
		 }
	 });

	 gulp.watch(config.baseFolders.dev +
		 config.scaffoldFolders.js + '*.js',
		 ['compileJSForDev', 'lintJS']).on(
			 'change',
			 reload
		 );

	 gulp.watch(config.baseFolders.dev +
		 config.scaffoldFolders.images + '**/*').on(
			 'change',
			 reload
		 );

	 gulp.watch([config.baseFolders.dev +
		 config.scaffoldFolders.html + '**/*.html'],
		 ['validateHTML']).on(
			 'change',
			 reload
		 );

	 gulp.watch(config.baseFolders.dev +
		 config.scaffoldFolders.styles + '**/*.scss',
		 ['compileCSSForDev']).on(
			 'change',
			 reload
		 );
});

 /**
 * CLEAN
 *
 * This task deletes the folders pointed to by the config.baseFolders.tmp and
 * config.baseFolders.prod JSON objects. Both of these folders are expendable, since
 * Gulp creates them as temporary folders during the serve process and via the build
 * task.
 */
 gulp.task('clean', function () {
	 'use strict';

	 var fs = require('fs'),
	 i,
	 expendableFolders = [config.baseFolders.tmp, config.baseFolders.prod];

	 for (i = 0; i < expendableFolders.length; i += 1) {
		 try {
			 fs.accessSync(expendableFolders[i], fs.F_OK);
			 process.stdout.write('\n\tThe ' + colors.green + expendableFolders[i] +
			 colors.default + ' directory was found and ' + colors.green +
			 'will' + colors.default + ' be deleted.\n');
			 del(expendableFolders[i]);
		 } catch (error) {
			 if (error) {
				 process.stdout.write('\n\tThe ' + colors.red +
				 expendableFolders[i] + colors.default +
				 ' directory does ' + colors.red + 'not' + colors.default +
				 ' exist or is ' + colors.red + 'not' + colors.default +
				 ' accessible.\n');
			 }
		 }
	 }

	 process.stdout.write('\n');
 });

 /**
 * DEFAULT
 *
 * This task does nothing but list the available tasks in this file.
 */
 gulp.task('default', function () {
	 'use strict';

	 var exec = require('child_process').exec;

	 exec('gulp --tasks', function (error, stdout, stderr) {
		 if (null !== error) {
			 process.stdout.write('An error was likely generated when invoking ' +
			 'the `exec` program in the default task.');
		 }

		 if ('' !== stderr) {
			 process.stdout.write('Content has been written to the stderr stream ' +
			 'when invoking the `exec` program in the default task.');
		 }

		 process.stdout.write('\n\tThis default task does ' + colors.red +
		 'nothing' + colors.default + ' but generate this message. The ' +
		 'available tasks are:\n\n' + stdout);
	 });
 });
