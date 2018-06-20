import Cli from './cli'
import { lstatSync, ensureDir, emptyDir } from 'fs-extra'
import glob from 'glob'
import { parse, dirname } from 'path'
import { booleanToEmoji, bytesToMo, minificationInfos, round } from './utils'
import File from './file'
import Log from './Log'
import { globToTree } from 'glob-tree-list'
import util from 'util'

export default class MoveImage {
    constructor () {
        this.sourceFiles = []

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

                allFiles = allFiles.concat(glob.sync(globExpression, {
                    ignore: this.cliArgs.outputDir + '/**/*'
                }))
            }
        })

        // Remove possible duplicate
        allFiles = Array.from(new Set(allFiles))

        let allFilesIndexInDir = allFiles.reduce((acc, file) => {
            acc.indexs[dirname(file)] = acc.indexs[dirname(file)] || 0
            acc.indexs[dirname(file)]++

            acc[file] = acc.indexs[dirname(file)]

            return acc
        }, { indexs: {} })

        this.sourceFiles = allFiles.map((originalPath, index) => new File(originalPath, index, allFilesIndexInDir[originalPath], this.cliArgs.pattern, this.cliArgs.outputDir))
    }

    onFileProcessed (fileAction) {
        this.filesOk++
        fileAction.progress = `${this.filesOk}/${this.sourceFiles.length}`

        if (fileAction.status === 'success') {
            Log.successAction(fileAction)
        } else {
            Log.errorAction(fileAction)
        }
    }

    process () {
        this.filesOk = 0
        const special = (n) => {
            return round(bytesToMo(n))
        }

        // Log infos
        Log.separator()
        Log.empty()
        Log.basic('Source(s):', `${this.cliArgs.sources.join(', ')}`)
        Log.basic('Destination directory:', `${this.cliArgs.outputDir}`)
        Log.basic('Extensions:', `${this.cliArgs.extensions}`)
        Log.basic('Pattern:', `${this.cliArgs.pattern}`)
        Log.basic('Clear destination:', booleanToEmoji(this.cliArgs.clear))
        Log.basic('Minify medias:', booleanToEmoji(this.cliArgs.minify))
        Log.basic('Recursive:', booleanToEmoji(this.cliArgs.recursive))

        Log.empty()

        Log.basic(`📷  Found ${this.sourceFiles.length} medias`)
        if (this.sourceFiles.length === 0) {
            process.exit(1)
        }
        if (this.cliArgs.minify) {
            Log.basic(`💪  Total size: ${special(this.sourceFilesSize)} Mo`)
        }
        Log.empty()
        Log.separator()
        Log.empty()

        ensureDir(this.cliArgs.outputDir)
            .then(() => {
                if (this.cliArgs.clear) {
                    return emptyDir(this.cliArgs.outputDir)
                        .then(() => Log.success('Emptied', this.cliArgs.outputDir))
                }
            })
            .then(() => {
                let promises = this.sourceFiles.map(file => (this.cliArgs.minify) ? file.minifyAndMove().then(this.onFileProcessed.bind(this)) : file.moveToDest().then(this.onFileProcessed.bind(this)))
                return Promise.all(promises)
            })
            .then(() => {
                Log.empty()
                if (this.cliArgs.minify) {
                    let totalFilesSizeAfter = this.sourceFiles.reduce((acc, file) => acc + file.destination.size, 0)
                    let minInfos = minificationInfos(this.sourceFilesSize, totalFilesSizeAfter)
                    Log.separator()
                    Log.empty()
                    Log.basic(`💪  Total size minified: ${special(totalFilesSizeAfter)} Mo, saved ${special(minInfos.difference)}Mo (${round(minInfos.ratio)}%)`)
                    Log.empty()
                    Log.separator()
                }
            })
            .catch((err) => {
                Log.error('Error', err.message.error)
            })
    }
}