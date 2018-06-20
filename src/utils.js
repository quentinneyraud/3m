/**
 * Convert bytes to Mo
 * @param bytes
 * @returns {number}
 */
export const bytesToMo = (bytes) => {
    return bytes / 1000000
}

/**
 * Round number
 * @param num
 * @param decimals
 * @returns {number}
 */
export const round = (num, decimals = 2) => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * Ensure val is a boolean
 * @param val
 * @returns {boolean}
 */
export const validateBoolean = (val) => {
    return !!val
}

/**
 * Keep the last n level
 * @param file
 * @param n
 */
export const shortFile = (file, n) => {
    return file.split('/')
        .slice(-(n + 1))
        .join('/')
}

/**
 * Return infos about minification
 * @param sizeBefore
 * @param sizeAfter
 */
export const minificationInfos = (sizeBefore, sizeAfter) => {
    return {
        difference: sizeBefore - sizeAfter,
        ratio: ((sizeBefore - sizeAfter) / sizeBefore) * 100
    }
}