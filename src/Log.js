import colors from 'colors'

const SEPARATOR = '#############'
const TITLE_PAD = 40

// Initialize colors themes
colors.setTheme({
    info: ['yellow'],
    warning: ['yellow'],
    error: ['red', 'underline'],
    success: ['green']
})

class Log {
    separator () {
        this.empty()
        console.log(SEPARATOR)
        this.empty()
    }

    empty () {
        console.log()
    }

    action (title, move, infos = '') {
        console.log(title.padEnd(TITLE_PAD), move.padEnd(100), infos)
    }

    error (message, infos) {
        console.log(message.padEnd(TITLE_PAD).error, infos)
    }

    warning (message, infos) {
        console.log(message.padEnd(TITLE_PAD).warning, infos)
    }

    basic (message) {
        console.log(message)
    }
}

export default new Log()