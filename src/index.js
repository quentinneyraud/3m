let colors = require('colors')
let glob = require('glob')
let imagemin = require('imagemin')
let imageminMozjpeg = require('imagemin-mozjpeg')
let fs = require('fs-extra')
let updateLog = require('single-line-log')
let program = require('commander')
let pkg = require('../package.json')
let path = require('path')
let imageminPngquant = require('imagemin-pngquant')

const DEFAULT_SOURCE = '.'
const DEFAULT_DIST = './dist'
const DEFAULT_PATTERN = '[NAME][EXT]'
const DEFAULT_EXTENSIONS = 'jpg,png'
const AVAILABLE_PATTERN_SPECIALS = ['[NAME]', '[EXT]', '[INDEX]', '[FOLDER_NAME]']

// Initialize colors themes
colors.setTheme({
    info: ['yellow'],
    warning: ['yellow'],
    error: ['red', 'underline'],
    success: ['green']
})

/**
 * Ensure val is a boolean
 * @param val
 * @returns {boolean}
 */
const validateBoolean = (val) => {
    return !!val
}

/**
 * Validate all CLI options
 * @param options
 * @returns {*}
 */
const validateOptions = (options) => {
    validateBoolean(options.clear)
    validateBoolean(options.optimize)

    options.source = path.resolve(process.cwd(), options.source)
    options.dist = path.resolve(process.cwd(), options.dist)

    return options
}

/**
 * Return validated CLI options
 * @returns {*}
 */
const getCliOptions = () => {
    program
        .version(pkg.version, '-v, --version')
        .option('-s, --source <source_folder>', 'Set source folder', DEFAULT_SOURCE)
        .option('-d, --dist <dist_folder>', 'Set dist folder', DEFAULT_DIST)
        .option('-p, --pattern <pattern>', 'Set files names, availables patterns : ' + AVAILABLE_PATTERN_SPECIALS.join(','), DEFAULT_PATTERN)
        .option('-e, --extensions <extensions>', 'Set extensions', DEFAULT_EXTENSIONS)
        .option('--no-clear', 'Clear dist folder')
        .option('--no-optimize', 'Optimize images')
        .parse(process.argv)

    return validateOptions(program.opts())
}

/**
 * Create file name based on pattern option
 * @param pattern
 * @param {string} name source file name
 * @param {number} index file index in list of all files
 * @returns {string}
 */
const createFileName = (pattern, name, index) => {
    let parsed = path.parse(name)

    return pattern
        .replace('[EXT]', parsed.ext)
        .replace('[NAME]', parsed.name)
        .replace('[INDEX]', index)
        .replace('[FOLDER_NAME]', parsed.dir.split('/').pop())
}

const options = getCliOptions()

// Find all files matching source and extensions options
const globExpression = options.source + '/*.{' + options.extensions + '}'
const filesPaths = glob.sync(globExpression)

console.log(`📷 Found ${filesPaths.length} medias`)

fs.ensureDir(options.dist)
    .then(() => {
        if (options.clear) {
            return fs.emptyDir(options.dist)
        }
    })
    .then(() => {
        let promises = filesPaths.map((filePath, index) => {
            let newPath = path.resolve(options.dist, createFileName(options.pattern, filePath, index))

            if (options.optimize) {
                return optimizeImage(filePath, newPath)
            } else {
                return fs.copyFile(filePath, newPath)
                    .then(() => {
                        console.log('success ', newPath)
                    })
            }
        })
        return Promise.all(promises)
    })
    .catch((err) => {
        console.log(err)
    })

/**
 * Optimise une image
 * @param filePath
 * @param newPath
 * @returns {Promise.<T>}
 */
const optimizeImage = (filePath, newPath) => {
    return imagemin([filePath], 'dist', {
        use: [
            imageminMozjpeg({
                quality: 80
            }),
            imageminPngquant({quality: '65-80'})
        ]
    })
        .then((files) => {
            fs.rename(files[0].path, newPath, () => {
                console.log('success ', newPath)
            })
        })
        .catch((err) => {
            console.dir(err.message, newPath)
        })
}