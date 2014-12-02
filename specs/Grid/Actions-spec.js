var Actions = require('./../../app/Grid/Actions.js');
var Manipulator = require('./../../app/Grid/Manipulator.js');
var Store = require('./../../app/Grid/Store.js');

var customMatchers = require('./custom-matchers.js');


describe("Grid.Actions", function() {

    beforeEach(function() {
        jasmine.addMatchers(customMatchers);
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();
    });

    it("should add a grid", function(done) {
        // will increment this for each callback called, should be 2 at the end
        var callbacksCalled = 0;
        // will store the grid name received via the "add" event
        var addedGridName;
        // to check the grid at the end
        var grid;

        var onStateChange = function() {
            callbacksCalled++;
        };

        var  onAddGrid = function(gridName) {
            callbacksCalled++;
            addedGridName = gridName;
        };

        var grid = Manipulator.createBaseGrid('foo', 5);

        // add some listeners
        Store.addChangeListener(onStateChange);
        Store.on('addGrid', onAddGrid);

        try {

            Actions.addGrid(grid);

        } finally {

            // give some time to let the callbacks to be called
            setTimeout(function() {
                // clean the listeners
                Store.removeChangeListener(onStateChange);
                Store.removeListener('addGrid', onAddGrid);

                // check if the callback were called
                expect(callbacksCalled).toEqual(2);
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

    it("should enter design mode", function(done) {
        // will increment this for each callback called, should be 2 at the end
        var callbacksCalled = 0;
        // will store the grid name received via the "add" event
        var updatedGridName;
        // to check the grid at the end
        var grid;

        var onStateChange = function() {
            callbacksCalled++;
        };

        var  onEnterDesignMode = function(gridName) {
            callbacksCalled++;
            updatedGridName = gridName;
        };

        // add a grid to work on
        var grid = Manipulator.createBaseGrid('foo', 5);
        Actions.addGrid(grid);

        // give some time to let the grid to be added
        setTimeout(function() {
            var grid = Store.getGrid('foo');

            // add some listeners
            Store.addChangeListener(onStateChange);
            Store.on('enterDesignMode', onEnterDesignMode);

            try {

                Actions.enterDesignMode('foo');

            } finally {

                // give some time to let the callbacks to be called
                setTimeout(function() {
                    // clean the listeners
                    Store.removeChangeListener(onStateChange);
                    Store.removeListener('enterDesignMode', onEnterDesignMode);

                    // check if the callback were called
                    expect(callbacksCalled).toEqual(2);
                    expect(updatedGridName, 'foo');

                    // check if we really have the new grid
                    expect(function() {
                        var grid = Store.getGrid('foo');
                    }).not.toThrowError(Store.Exceptions.GridDoesNotExist);

                    // check if the grid has placeholders
                    var expected =
                        '<grid name="foo" space="5px" type="mainGrid">' +
                            '<content>' +
                                '<rows type="placeholder">' +
                                    '<cells type="placeholder">' +
                                        '<content/>' +
                                    '</cells>' +
                                '</rows>' +
                            '</content>' +
                        '</grid>';
                    expect(grid).toEqualXML(expected);

                    // tell jasmine we're done
                    done();

                }, 0.01);

            }
        }, 0.01);
    });


    it("should exit design mode", function(done) {
        // will increment this for each callback called, should be 2 at the end
        var callbacksCalled = 0;
        // will store the grid name received via the "add" event
        var updatedGridName;
        // to check the grid at the end
        var grid;

        var onStateChange = function() {
            callbacksCalled++;
        };

        var  onExitDesignMode = function(gridName) {
            callbacksCalled++;
            updatedGridName = gridName;
        };

        // add a grid to work on
        var grid = Manipulator.createBaseGrid('foo', 5);
        Actions.addGrid(grid);

        // give some time to let the grid to be added
        setTimeout(function() {
            var grid = Store.getGrid('foo');

            // force it to be in design mode
            Manipulator.addPlaceholders(grid);

            // add some listeners
            Store.addChangeListener(onStateChange);
            Store.on('exitDesignMode', onExitDesignMode);

            try {

                Actions.exitDesignMode('foo');

            } finally {

                // give some time to let the callbacks to be called
                setTimeout(function() {
                    // clean the listeners
                    Store.removeChangeListener(onStateChange);
                    Store.removeListener('exitDesignMode', onExitDesignMode);

                    // check if the callback were called
                    expect(callbacksCalled).toEqual(2);
                    expect(updatedGridName, 'foo');

                    // check if we really have the new grid
                    expect(function() {
                        var grid = Store.getGrid('foo');
                    }).not.toThrowError(Store.Exceptions.GridDoesNotExist);

                    // check if the grid has placeholders
                    var expected =
                        '<grid name="foo" space="5px" type="mainGrid">' +
                            '<content/>' +
                        '</grid>';
                    expect(grid).toEqualXML(expected);

                    // tell jasmine we're done
                    done();

                }, 0.01);

            }
        }, 0.01);
    });

});
