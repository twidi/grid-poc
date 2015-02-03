var Exceptions = {

    /**
     * Base the given exceptions on the `Error` object
     *
     * @param  {Object} exceptions - On object with exception names as keys, and "class" as value
     */
    normalize: function(exceptions) {
        for (var name in exceptions) {
            var klass = exceptions[name];
            klass.prototype = new Error();
            klass.prototype.constructor = klass;
            klass.displayName = name;
        }
    },

};

module.exports = Exceptions;