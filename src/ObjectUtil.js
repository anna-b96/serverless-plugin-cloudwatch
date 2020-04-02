'use strict'

class ObjectUtil {

    static isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }
}
module.exports = ObjectUtil
