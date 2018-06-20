import colors from 'colors'
import { bytesToMo, minificationInfos, round, shortFile } from './utils'

const SEPARATOR_CHAR = '#'
const WIDTH = 100
const PAD = 30

// Initialize colors themes
colors.setTheme({
    info: ['yellow'],
    warning: ['yellow'],
    error: ['red', 'underline'],
    success: ['green']
})

class Log {
    separator (char = SEPARATOR_CHAR, length = WIDTH) {
        console.log(char.repeat(length))
    }

    empty () {
        console.log()
    }

    success (title, infos = '') {
        console.log(title.padEnd(PAD).success, infos)
    }

    error (title, infos = '') {
        console.log(title.padEnd(PAD).error, infos)
    }

    warning (title, infos = '') {
        console.log(title.padEnd(PAD).warning, infos)
    }

    basic (message) {
        console.log(message)
    }

    successAction (actionInfos) {
        this.separator('-', WIDTH)
        console.log(actionInfos.title.padEnd(WIDTH - 1 - actionInfos.progress.length).success, actionInfos.progress)
        this.empty()
        console.log('From:'.padEnd(PAD), shortFile(actionInfos.source.path))
        console.log('To:'.padEnd(PAD), shortFile(actionInfos.destination.path))

        if (actionInfos.type === 'minify') {
            let minInfos = minificationInfos(actionInfos.source.size, actionInfos.destination.size)
            console.log('Saved:'.padEnd(PAD), `saved ${round(bytesToMo(minInfos.difference))}Mo (${round(minInfos.ratio)}%)`)
        }
    }

    errorAction (actionInfos) {
        this.separator('-', WIDTH)
        console.log(actionInfos.title.padEnd(WIDTH - 1 - actionInfos.progress.length).error, actionInfos.progress)
        this.empty()
        console.log('From:'.padEnd(PAD), shortFile(actionInfos.source.path))
        console.log('To:'.padEnd(PAD), shortFile(actionInfos.destination.path))
        console.log('Error:'.padEnd(PAD), actionInfos.error.message)
    }
}

export default new Log()