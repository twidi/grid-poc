var actions = require('./../../app/Grid/actions.js');
var Manipulator = require('./../../app/Grid/Manipulator.js');
var Store = require('./../../app/Grid/Store.js');

describe("Grid.actions", function() {

    it("should add a grid", function(done) {
        var passed = false;
        var onChangeState = function() {
            passed = true;
        }
        var grid = Manipulator.createBaseGrid('foo', 5);
        Store.addChangeListener(onChangeState);
        try {
            actions.addGrid(grid);
        } finally {
            setTimeout(function() {
                Store.removeChangeListener(onChangeState);
                expect(passed).toBe(true);
                expect(function() {
                    var grid = Store.getGrid('foo');
                }).not.toThrowError(Store.Exceptions.GridDoesNotExist);
                done();
            }, 0.01);
        }
    });

});

describe("Grid.Store", function() {

    it("should raise if a grid is not available", function() {
        expect(function() {
            Store.getGrid('bar')
        }).toThrowError(Store.Exceptions.GridDoesNotExist, "No grid with the name <bar>");
    });

});