var Store = require('./../../app/Grid/Store.js');

describe("Grid.Store", function() {

    it("should raise if a grid is not available", function() {
        expect(function() {
            Store.getGrid('bar');
        }).toThrowError(Store.Exceptions.GridDoesNotExist, "No grid with the name <bar>");
    });

});