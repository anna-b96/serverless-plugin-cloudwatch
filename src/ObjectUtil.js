'use strict'

class ObjectUtil {

    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }
}
module.exports = ObjectUtil
