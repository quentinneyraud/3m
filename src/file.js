import { statSync, copyFile, rename } from 'fs-extra'
import { parse, resolve } from 'path'
import { bytesToMo, minificationInfos, round, shortFile } from './utils'
import imagemin from 'imagemin'
import imageminMozjpeg from 'imagemin-mozjpeg'
import imageminPngquant from 'imagemin-pngquant'
import Log from './Log'

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
                Log.action('Moved '.success,
                    `${shortFile(this.source.path, 1)} => ${shortFile(this.destination.path, 1)}`)
            })
    }

    minifyAndMove () {
        const special = (n) => {
            return round(bytesToMo(n))
        }

        if (CAN_MINIFY.indexOf(this.extension) < 0) {
            Log.warning('Cannot minify', this.source.path)
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
                    rename(files[0].path, this.destination.path, () => {
                        this.destination.size = statSync(this.destination.path).size
                        let minInfos = minificationInfos(this.source.size, this.destination.size)
                        Log.action('Minified and moved '.success,
                            `${shortFile(this.source.path, 1)} (${special(this.source.size)}Mo) => ${shortFile(this.destination.path, 1)} (${special(this.destination.size)}Mo)`,
                            `saved ${special(minInfos.difference)}Mo (${round(minInfos.ratio)}%)`)
                        resolve()
                    })
                })
                .catch((err) => {
                    Log.error(err.message, this.source.path)
                    reject()
                })
        })
    }
}