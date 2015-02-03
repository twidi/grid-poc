const Exceptions = {

    /**
     * Base the given exceptions on the `Error` object
     *
     * @param  {Object} exceptions - On object with exception names as keys, and "class" as value
     */
    normalize(exceptions) {
        for (const name in exceptions) {
            if (exceptions.hasOwnProperty(name)) {
                const klass = exceptions[name];
                klass.prototype = new Error();
                klass.prototype.constructor = klass;
                klass.displayName = name;
            }
        }
    }

};

export { Exceptions };
