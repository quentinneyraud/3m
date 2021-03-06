import program from 'commander'
import { version } from '../package.json'
import { resolve } from 'path'
import { validateBoolean } from './utils'

const DEFAULT_DESTINATION = './dist'
const DEFAULT_PATTERN = '[NAME][EXT]'
const DEFAULT_EXTENSIONS = 'jpg,jpeg,png'
const AVAILABLE_PATTERN_SPECIALS = ['[NAME]', '[EXT]', '[INDEX]', '[DIR_NAME]', '[INDEX_IN_DIR]', '[PATH]']

/**
 * Class Cli
 */
export default class Cli {
    /**
     * Set CLI infos and parse command
     */
    execute () {
        program
            .version(version, '-v, --version')
            .usage('[options] <file or directory ...>')
            .option('-o, --output-dir <destination directory>', 'set destination directory', DEFAULT_DESTINATION)
            .option('-p, --pattern <pattern>', 'Set files names, availables patterns : ' + AVAILABLE_PATTERN_SPECIALS.join(','), DEFAULT_PATTERN)
            .option('-e, --extensions <extensions>', 'Set extensions', DEFAULT_EXTENSIONS)
            .option('-r, --recursive', 'recursive search', false)
            .option('--no-clear', 'Clear destination directory')
            .option('--no-minify', 'Minify medias')
            .parse(process.argv)
    }

    /**
     * Return all CLI arguments validated
     * @returns {object}
     */
    getArguments () {
        this.arguments = program.opts()
        this.arguments.sources = (program.args.length > 0) ? program.args : ['.']
        this.validateArguments()
        return this.arguments
    }

    /**
     * Validate CLI arguments
     */
    validateArguments () {
        this.arguments.clear = validateBoolean(this.arguments.clear)
        this.arguments.minify = validateBoolean(this.arguments.minify)
        this.arguments.recursive = validateBoolean(this.arguments.recursive)

        this.arguments.sources = this.arguments.sources.map(source => resolve(process.cwd(), source))
        this.arguments.outputDir = resolve(process.cwd(), this.arguments.outputDir)
    }
}