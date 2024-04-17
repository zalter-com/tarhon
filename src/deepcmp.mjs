/**
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
export const deepCompare = (a, b) => {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (`${a}` !== `${b}`) return false;
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const k of ka) {
        if (!kb.includes(k) || !deepCompare(a[k], b[k])){
            return false;
        }
    }
    return true;
};
