import _ from 'lodash';


/**
 * Tools to manage exceptions
 * @namespace
 * @memberOf module:Utils
 */
const Exceptions = {

    /**
     * Base the given exceptions on the `Error` object
     *
     * @param  {Object} exceptions - On object with exception names as keys, and "class" as value
     */
    normalize(exceptions) {

        _.forOwn(exceptions, (klass, name) => {
            klass.prototype = new Error();
            klass.prototype.constructor = klass;
            klass.displayName = name;
        });

    }

};

export { Exceptions };
