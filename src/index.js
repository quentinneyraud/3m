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

const DEFAULT_SOURCE = process.cwd()
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

/*

Utils

 */

/**
 * Round at 2 decimals
 * @param num
 * @returns {number}
 */
const r2d = (num) => {
    return Math.round(num * 100) / 100
}

/**
 * Ensure val is a boolean
 * @param val
 * @returns {boolean}
 */
const validateBoolean = (val) => {
    return !!val
}

/**
 * Keep the last n level
 * @param file
 * @param n
 */
const shortFile = (file, n) => {
    return file.split('/')
        .slice(-(n + 1))
        .join('/')
}

/**
 * Class Cli
 */
class Cli {
    execute () {
        program
            .version(pkg.version, '-v, --version')
            .option('-s, --source <source_folder>', 'Set source folder', DEFAULT_SOURCE)
            .option('-d, --dist <dist_folder>', 'Set dist folder', DEFAULT_DIST)
            .option('-p, --pattern <pattern>', 'Set files names, availables patterns : ' + AVAILABLE_PATTERN_SPECIALS.join(','), DEFAULT_PATTERN)
            .option('-e, --extensions <extensions>', 'Set extensions', DEFAULT_EXTENSIONS)
            .option('-r, --recursive', 'recursive search', false)
            .option('--no-clear', 'Clear dist folder')
            .option('--no-optimize', 'Optimize images')
            .parse(process.argv)
    }

    getArguments () {
        this.arguments = program.opts()
        this.validateArguments()
        return this.arguments
    }

    validateArguments () {
        this.arguments.clear = validateBoolean(this.arguments.clear)
        this.arguments.optimize = validateBoolean(this.arguments.optimize)
        this.arguments.recursive = validateBoolean(this.arguments.recursive)

        this.arguments.source = path.resolve(process.cwd(), this.arguments.source)
        this.arguments.dist = path.resolve(process.cwd(), this.arguments.dist)
    }
}

/**
 * Class File
 */
class File {
    constructor (originalPath, index) {
        this.originalPath = originalPath
        this.index = index
        this.originalSize = fs.statSync(this.originalPath).size / 1000000

        this.setDestinationPath()
    }

    setDestinationPath () {
        let parsed = path.parse(this.originalPath)

        let newFileName = options.pattern
            .replace('[EXT]', parsed.ext)
            .replace('[NAME]', parsed.name)
            .replace('[INDEX]', this.index)
            .replace('[FOLDER_NAME]', parsed.dir.split('/').pop())

        this.destinationPath = path.resolve(options.dist, newFileName)
    }

    moveToDest () {
        return fs.copyFile(this.originalPath, this.destinationPath)
            .then(() => {
                console.log('Moved '.success, `${shortFile(this.originalPath, 1)} => ${shortFile(this.destinationPath, 1)}`)
            })
    }

    optimize () {
        return new Promise((resolve, reject) => {
            imagemin([this.originalPath], options.dist, {
                use: [
                    imageminMozjpeg({
                        quality: 80
                    }),
                    imageminPngquant({
                        quality: '65-80'
                    })
                ]
            })
                .then((files) => {
                    fs.rename(files[0].path, this.destinationPath, () => {
                        console.log('Minified and moved '.success, `${shortFile(this.originalPath, 1)} => ${shortFile(this.destinationPath, 1)}`)
                        this.minifiedSize = fs.statSync(this.destinationPath).size / 1000000
                        resolve()
                    })
                })
                .catch((err) => {
                    console.log(err.message.error, this.originalPath)
                    reject()
                })
        })
    }
}

const cli = new Cli()
cli.execute()
const options = cli.getArguments()


// Find all files matching source and extensions options
let globExpression = options.source
if (options.recursive) {
    globExpression += '/**'
}
globExpression += '/*.{' + options.extensions + '}'

const files = glob.sync(globExpression)
    .filter(filePath => path.parse(filePath).dir !== options.dist)
    .map((originalPath, index) => new File(originalPath, index))


const totalFilesSize = files.reduce((acc, val) => acc + val.originalSize, 0)
console.log('###########')
console.log(`📷  Found ${files.length} medias`)
options.optimize && files.length > 0 && console.log(`💪  Total size: ${r2d(totalFilesSize)} Mo`)
console.log('###########')

files.length === 0 && process.exit(0)

fs.ensureDir(options.dist)
    .then(() => {
        if (options.clear) {
            return fs.emptyDir(options.dist)
                .then(() => console.log('Emptied '.success, options.dist))
        }
    })
    .then(() => {
        let promises = files.map((file) => {
            if (options.optimize) {
                return file.optimize()
            } else {
                return file.moveToDest()
            }
        })
        return Promise.all(promises)
    })
    .then(() => {
        let totalFilesSizeAfter = files.reduce((acc, val) => acc + val.minifiedSize, 0)
        let sizeDifference = totalFilesSize - totalFilesSizeAfter
        let sizeDifferenceRatio = (sizeDifference / totalFilesSize) * 100
        console.log('###########')
        console.log(`💪  Total size minified: ${r2d(totalFilesSizeAfter)} Mo, saved ${r2d(sizeDifference)}Mo (${r2d(sizeDifferenceRatio)}%)`)
        console.log('###########')
    })
    .catch((err) => {
        console.log(err.message.error)
    })