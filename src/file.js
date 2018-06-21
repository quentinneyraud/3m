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

        this.setDestinationInfos()
    }

    /**
     * Return all infos on a path
     * @param filePath
     * @returns {{path: string, name: string, directoryPath: string, directoryName: string, extension: string}}
     */
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

    /**
     * Construct destination file name with provided pattern
     * @returns {string}
     */
    getDestinationFileName () {
        return this.patternCliArg
            .replace('[EXT]', this.source.extension)
            .replace('[NAME]', this.source.name)
            .replace('[INDEX]', this.index)
            .replace('[INDEX_IN_DIR]', this.indexInDirectory)
            .replace('[DIR_NAME]', this.source.directoryName)
            .replace('[PATH]', relative(process.cwd(), this.source.directoryPath))
    }

    /**
     * Set all infos about destination
     */
    setDestinationInfos () {
        this.destination.path = resolve(this.destinationCliArg, this.getDestinationFileName())
        this.destination = {
            ...this.destination,
            ...this.getPathInfos(this.destination.path)
        }
    }

    /**
     * Ensure that destination directory exists
     * @returns {Promise}
     */
    createDestinationDirectory () {
        return ensureDir(this.destination.directoryPath)
    }

    /**
     * Move the file its destination directory
     * @returns {Promise}
     */
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

    /**
     * Minify and move the file its destination directory
     * @returns {Promise}
     */
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