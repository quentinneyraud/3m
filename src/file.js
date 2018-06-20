import { statSync, copyFile, rename } from 'fs-extra'
import { parse, resolve } from 'path'
import { shortFile } from './utils'
import imagemin from 'imagemin'
import imageminMozjpeg from 'imagemin-mozjpeg'
import imageminPngquant from 'imagemin-pngquant'

const CAN_MINIFY = ['.jpg', '.jpeg', '.png']

export default class File {
    constructor (originalPath, index, patternCliArg, destinationCliArg) {
        let parsed = parse(originalPath)
        this.source = {
            path: originalPath,
            directory: parsed.dir.split('/').pop(),
            name: parsed.name,
            size: statSync(originalPath).size
        }
        this.destination = {
            directory: destinationCliArg
        }
        this.index = index
        this.patternCliArg = patternCliArg
        this.extension = parsed.ext

        this.setDestinationPath()
    }

    setDestinationPath () {
        let newFileName = this.patternCliArg
            .replace('[EXT]', this.extension)
            .replace('[NAME]', this.source.name)
            .replace('[INDEX]', this.index)
            .replace('[FOLDER_NAME]', this.source.directory)

        this.destination.path = resolve(this.destination.directory, newFileName)
    }

    moveToDest () {
        return copyFile(this.source.path, this.destination.path)
            .then(() => {
                console.log('Moved '.padEnd(30).success, `${shortFile(this.source.path, 1)} => ${shortFile(this.destination.path, 1)}`)
            })
    }

    minifyAndMove () {
        if (CAN_MINIFY.indexOf(this.extension) < 0) {
            console.log('Cannot minify '.padEnd(30).warning, this.source.path)
            this.destination.size = this.source.size
            return this.moveToDest()
        }

        return new Promise((resolve, reject) => {
            imagemin([this.source.path], this.destination.directory, {
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
                    rename(files[0].path, this.destination.directory, () => {
                        console.log('Minified and moved '.padEnd(30).success, `${shortFile(this.source.path, 1)} => ${shortFile(this.destination.path, 1)}`)
                        this.destination.size = statSync(this.destination.path).size
                        resolve()
                    })
                })
                .catch((err) => {
                    console.log(err.message.error, this.source.path)
                    reject()
                })
        })
    }
}