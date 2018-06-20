import colors from 'colors'
import Cli from './cli'
import { lstatSync, ensureDir, emptyDir } from 'fs-extra'
import glob from 'glob'
import { parse } from 'path'
import { bytesToMo, round } from './utils'
import File from './file'

// Initialize colors themes
colors.setTheme({
    info: ['yellow'],
    warning: ['yellow'],
    error: ['red', 'underline'],
    success: ['green']
})

export default class MoveImage {
    constructor () {
        this.setCliArguments()
        this.setSourceFiles()

        this.sourceFilesSize = this.sourceFiles.reduce((acc, val) => acc + val.originalSize, 0)
    }

    setCliArguments () {
        let cli = new Cli()
        cli.execute()
        this.cliArgs = cli.getArguments()
    }

    setSourceFiles () {
        let allFiles = []
        this.cliArgs.sources.forEach(source => {
            let sourceStats = lstatSync(source)

            if (sourceStats.isFile()) {
                allFiles.push(source)
            } else {
                // Find all files matching source and extensions options
                let globExpression = source
                if (this.cliArgs.recursive) {
                    globExpression += '/**'
                }
                globExpression += '/*.{' + this.cliArgs.extensions + '}'

                allFiles = allFiles.concat(glob.sync(globExpression)
                    .filter(filePath => parse(filePath).dir !== this.cliArgs.dist))
            }
        })
        this.sourceFiles = allFiles.map((originalPath, index) => new File(originalPath, index, this.cliArgs.pattern, this.cliArgs.dist))
    }

    process () {
        const special = (n) => {
            return round(bytesToMo(n))
        }

        console.log('###########')
        console.log(`📷  Found ${this.sourceFiles.length} medias`)
        if (this.sourceFiles.length === 0) {
            process.exit(1)
        }
        if (this.cliArgs.optimize) {
            console.log(`💪  Total size: ${special(this.sourceFilesSize)} Mo`)
        }
        console.log('###########')

        ensureDir(this.cliArgs.dist)
            .then(() => {
                if (this.cliArgs.clear) {
                    return emptyDir(this.cliArgs.dist)
                        .then(() => console.log('Emptied '.success, this.cliArgs.dist))
                }
            })
            .then(() => {
                let promises = this.sourceFiles.map(file => (this.cliArgs.optimize) ? file.optimize() : file.moveToDest())
                return Promise.all(promises)
            })
            .then(() => {
                if (this.cliArgs.optimize) {
                    let totalFilesSizeAfter = this.sourceFiles.reduce((acc, val) => acc + val.minifiedSize, 0)
                    let sizeDifference = this.sourceFilesSize - totalFilesSizeAfter
                    let sizeDifferenceRatio = (sizeDifference / this.sourceFilesSize) * 100
                    console.log('###########')
                    console.log(`💪  Total size minified: ${special(totalFilesSizeAfter)} Mo, saved ${special(sizeDifference)}Mo (${round(sizeDifferenceRatio)}%)`)
                    console.log('###########')
                }
            })
            .catch((err) => {
                console.log(err.message.error)
            })
    }
}