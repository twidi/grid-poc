import _ from 'lodash';

export const Utils = {
    /**
     * Mock _.uniqueId from lodash, but with a reseted counter, for the duration
     * of the test. With an helper to help reset in the same test function.
     * Useful in a test to ensure the counter always start with 1
     * @example
     *   let mock = Utils.mockUniqueId();
     *   // do some stuff
     *   // need a new reset during the meme test function, call:
     *   mock.reset();
     */
    mockUniqueId() {
        let idCounter = 0;

        /**
         * Copy of the uniqueId function from lodash that will be use as a mock
         * @param  {[type]} prefix [description]
         * @return {[type]}        [description]
         */
        let uniqueId = function (prefix) {
            let id = ++idCounter;
            return String(prefix == null ? '' : prefix) + id;
        };

        // keep a copy of the original
        let original = _.uniqueId;

        // do the mocking
        spyOn(_, 'uniqueId').and.callFake(uniqueId);

        // returns an object with the original function, the mocked one, and
        // a reset helper
        return {
            original: original,
            mocked: uniqueId,
            reset() {
                idCounter = 0;
            }
        };
    }
};
