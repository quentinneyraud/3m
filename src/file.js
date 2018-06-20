import { statSync, copyFile, rename } from 'fs-extra'
import { parse, resolve } from 'path'
import { shortFile } from './utils'
import imagemin from 'imagemin'
import imageminMozjpeg from 'imagemin-mozjpeg'
import imageminPngquant from 'imagemin-pngquant'

export default class File {
    constructor (originalPath, index, patternCliArg, distCliArg) {
        this.originalPath = originalPath
        this.index = index
        this.originalSize = statSync(this.originalPath).size
        this.distDirectory = distCliArg
        this.patternCliArg = patternCliArg

        this.setDestinationPath()
    }

    setDestinationPath () {
        let parsed = parse(this.originalPath)

        let newFileName = this.patternCliArg
            .replace('[EXT]', parsed.ext)
            .replace('[NAME]', parsed.name)
            .replace('[INDEX]', this.index)
            .replace('[FOLDER_NAME]', parsed.dir.split('/').pop())

        this.destinationPath = resolve(this.distDirectory, newFileName)
    }

    moveToDest () {
        return copyFile(this.originalPath, this.destinationPath)
            .then(() => {
                console.log('Moved '.success, `${shortFile(this.originalPath, 1)} => ${shortFile(this.destinationPath, 1)}`)
            })
    }

    optimize () {
        return new Promise((resolve, reject) => {
            imagemin([this.originalPath], this.distDirectory, {
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
                    rename(files[0].path, this.destinationPath, () => {
                        console.log('Minified and moved '.success, `${shortFile(this.originalPath, 1)} => ${shortFile(this.destinationPath, 1)}`)
                        this.minifiedSize = statSync(this.destinationPath).size
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