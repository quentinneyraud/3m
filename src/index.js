import Cli from './cli'
import { lstatSync, ensureDir, emptyDir } from 'fs-extra'
import glob from 'glob'
import { parse } from 'path'
import { bytesToMo, minificationInfos, round } from './utils'
import File from './file'
import Log from './Log'

export default class MoveImage {
    constructor () {
        this.setCliArguments()
        this.setSourceFiles()

        this.sourceFilesSize = this.sourceFiles.reduce((acc, file) => acc + file.source.size, 0)
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
                    .filter(filePath => parse(filePath).dir !== this.cliArgs.destination))
            }
        })
        this.sourceFiles = allFiles.map((originalPath, index) => new File(originalPath, index, this.cliArgs.pattern, this.cliArgs.destination))
    }

    process () {
        const special = (n) => {
            return round(bytesToMo(n))
        }

        Log.separator()
        Log.basic(`📷  Found ${this.sourceFiles.length} medias`)
        if (this.sourceFiles.length === 0) {
            process.exit(1)
        }
        if (this.cliArgs.minify) {
            Log.basic(`💪  Total size: ${special(this.sourceFilesSize)} Mo`)
        }
        Log.separator()

        ensureDir(this.cliArgs.destination)
            .then(() => {
                if (this.cliArgs.clear) {
                    return emptyDir(this.cliArgs.destination)
                        .then(() => Log.action('Emptied '.success, this.cliArgs.destination))
                }
            })
            .then(() => {
                let promises = this.sourceFiles.map(file => (this.cliArgs.minify) ? file.minifyAndMove() : file.moveToDest())
                return Promise.all(promises)
            })
            .then(() => {
                if (this.cliArgs.minify) {
                    let totalFilesSizeAfter = this.sourceFiles.reduce((acc, file) => acc + file.destination.size, 0)
                    let minInfos = minificationInfos(this.sourceFilesSize, totalFilesSizeAfter)
                    Log.separator()
                    Log.basic(`💪  Total size minified: ${special(totalFilesSizeAfter)} Mo, saved ${special(minInfos.difference)}Mo (${round(minInfos.ratio)}%)`)
                    Log.separator()
                }
            })
            .catch((err) => {
                Log.error(err.message.error)
            })
    }
}