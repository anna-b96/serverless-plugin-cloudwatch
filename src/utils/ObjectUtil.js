'use strict'

class ObjectUtil {

    static isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }
    static getSafe(fn, defaultVal) {
        try {
            return fn();
        } catch (e) {
            return defaultVal;
        }
    }
}
module.exports = ObjectUtil
