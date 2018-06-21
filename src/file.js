import { copyFile, rename, statSync, ensureDir } from 'fs-extra'
import { parse, resolve, relative, sep } from 'path'
import imagemin from 'imagemin'
import imageminMozjpeg from 'imagemin-mozjpeg'
import imageminPngquant from 'imagemin-pngquant'

const CAN_MINIFY = ['.jpg', '.jpeg', '.png']

export default class File {
    constructor (originalPath, index, indexInDirectory, patternCliArg, destinationCliArg) {
        this.source = {
            ...this.getPathInfos(originalPath),
            size: statSync(originalPath).size
        }
        this.destination = {}
        this.index = index
        this.indexInDirectory = indexInDirectory
        this.destinationCliArg = destinationCliArg
        this.patternCliArg = patternCliArg

        this.setDestinationPath()
    }

    getPathInfos (filePath) {
        let parsed = parse(filePath)
        return {
            path: filePath,
            name: parsed.name,
            directoryPath: parsed.dir,
            directoryName: parsed.dir.split(sep).pop(),
            extension: parsed.ext
        }
    }

    setDestinationPath () {
        let newFileName = this.patternCliArg
            .replace('[EXT]', this.source.extension)
            .replace('[NAME]', this.source.name)
            .replace('[INDEX]', this.index)
            .replace('[INDEX_IN_DIR]', this.indexInDirectory)
            .replace('[DIR_NAME]', this.source.directoryName)
            .replace('[PATH]', relative(process.cwd(), this.source.directoryPath))

        this.destination.path = resolve(this.destinationCliArg, newFileName)
        this.destination = {
            ...this.destination,
            ...this.getPathInfos(this.destination.path)
        }
    }

    createDestinationDirectory () {
        return ensureDir(this.destination.directoryPath)
    }

    moveToDest () {
        return new Promise((resolve, reject) => {
            this.createDestinationDirectory()
                .then(() => copyFile(this.source.path, this.destination.path))
                .then(() => {
                    this.destination.size = this.source.size
                    resolve({
                        status: 'success',
                        type: 'move',
                        title: 'Moved',
                        source: this.source,
                        destination: this.destination
                    })
                })
                .catch(err => {
                    reject({
                        status: 'error',
                        title: 'Error',
                        error: err,
                        source: this.source,
                        destination: this.destination
                    })
                })
        })
    }

    minifyAndMove () {
        if (CAN_MINIFY.indexOf(this.source.extension) < 0) {
            return this.moveToDest()
        }

        return new Promise((resolve, reject) => {
            this.createDestinationDirectory()
                .then(() => {
                    return imagemin([this.source.path], this.destination.directoryPath, {
                        use: [
                            imageminMozjpeg({
                                quality: 80
                            }),
                            imageminPngquant({
                                quality: '65-80'
                            })
                        ]
                    })
                })
                .then((files) => {
                    rename(files[0].path, this.destination.path, () => {
                        this.destination.size = statSync(this.destination.path).size
                        resolve({
                            status: 'success',
                            type: 'minify',
                            title: 'Minified and moved',
                            source: this.source,
                            destination: this.destination
                        })
                    })
                })
                .catch((err) => {
                    reject({
                        status: 'error',
                        title: 'Error',
                        error: err,
                        source: this.source,
                        destination: this.destination
                    })
                })
        })
    }
}