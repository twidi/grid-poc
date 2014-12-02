var actions = require('./../../app/Grid/actions.js');
var Manipulator = require('./../../app/Grid/Manipulator.js');
var Store = require('./../../app/Grid/Store.js');

var customMatchers = require('./custom-matchers.js');


describe("Grid.actions", function() {

    beforeEach(function() {
        jasmine.addMatchers(customMatchers);
    });

    it("should add a grid", function(done) {
        // will increment this for each callback called, should be 2 at the end
        var passed = 0;
        // will store the grid name received via the "add" event
        var addedGridName;
        // to check the grid at the end
        var grid;

        var onChange = function() {
            passed++;
        };

        var  onAdd = function(gridName) {
            passed++;
            addedGridName = gridName;
        };

        var grid = Manipulator.createBaseGrid('foo', 5);

        // add some listeners
        Store.addChangeListener(onChange);
        Store.on('add', onAdd);

        try {

            actions.addGrid(grid);

        } finally {

            // give some time to let the callbacks to be called
            setTimeout(function() {
                // clean the listeners
                Store.removeChangeListener(onChange);
                Store.removeListener('add', onAdd);

                // check if the callback were called
                expect(passed).toEqual(2);
                expect(addedGridName, 'foo');

                // check if we really have the new grid
                expect(function() {
                    var grid = Store.getGrid('foo');
                }).not.toThrowError(Store.Exceptions.GridDoesNotExist);

                // and if it is valid
                var expected =
                    '<grid name="foo" space="5px" type="mainGrid">' +
                        '<content/>' +
                    '</grid>';
                expect(grid).toEqualXML(expected);

                // tell jasmine we're done
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