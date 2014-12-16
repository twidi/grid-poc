var Actions = require('../../app/Grid/Actions.js');
var Manipulator = require('../../app/Grid/Manipulator.js');
var Store = require('../../app/Grid/Store.js');

var customMatchers = require('./custom-matchers.js');
var Utils = require('../Utils.js');


describe("Grid.Actions", function() {
    var uniqueIdMock;
    var defaultHoveringDelay = Store.__private.hoveringDelay;
    var hoveringDelay = 10;

    beforeEach(function() {
        jasmine.addMatchers(customMatchers);

        // we mock the uniqueId function of lodash to know the value to expect
        uniqueIdMock = Utils.mockUniqueId();

        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // short hovering delay in tests
        Store.__private.hoveringDelay = hoveringDelay - 2;

    });

    afterEach(function() {
        // restore hovering delay
        Store.__private.hoveringDelay = defaultHoveringDelay;
    });


    it("should add a grid", function(done) {
        // will set this to True when the callback is called
        var callbackCalled = false;
        // will store the grid name received via the "add" event
        var addedGridName;

        var callback = function(gridName) {
            callbackCalled = true;
            addedGridName = gridName;
        };

        var grid = Manipulator.createBaseGrid('foo', 5);

        // listen to the tested event
        Store.on('grid.add', callback);

        try {
            Actions.addGrid(grid);
        } finally {

            // give some time to let the callbacks to be called
            setTimeout(function() {
                // clean the listener
                Store.off('addGrid', callback);

                // check if the callback were called
                expect(callbackCalled).toBe(true);
                expect(addedGridName, 'foo');

                // check if we really have the new grid
                expect(function() {
                    var grid = Store.getGrid('foo');
                }).not.toThrowError(Store.Exceptions.GridDoesNotExist);

                // and if it is valid
                var expected =
                    '<grid name="foo" space="5px" type="mainGrid" id="grid-1">' +
                        '<content id="content-2"/>' +
                    '</grid>';
                expect(grid).toEqualXML(expected);

                // tell jasmine we're done
                done();

            }, 0.01);

        }
    });

    it("should enter design mode", function(done) {
        // will set this to True when the callback is called
        var callbackCalled = false;
        // will store the grid name received via the tested event
        var updatedGridName;

        var callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        var grid = Manipulator.createBaseGrid('foo', 5);
        Actions.addGrid(grid);

        // listen to the tested event
        Store.on('grid.designMode.enter', callback);

        try {
            Actions.enterDesignMode('foo');
        } finally {

            // give some time to let the callbacks to be called
            setTimeout(function() {
                // clean the listener
                Store.off('grid.designMode.enter', callback);

                // check if the callback were called
                expect(callbackCalled).toBe(true);
                expect(updatedGridName, 'foo');

                // check the new designMode step
                expect(Store.getDesignModeStep('foo')).toEqual('enabled');

                // check if the grid is still the same
                var expected =
                    '<grid name="foo" space="5px" type="mainGrid" id="grid-1">' +
                        '<content id="content-2"/>' +
                    '</grid>';
                expect(grid).toEqualXML(expected);

                // tell jasmine we're done
                done();

            }, 0.01);

        }
    });


    it("should start dragging", function(done) {
        // will set this to True when the callback is called
        var callbackCalled = false;
        // will store the grid name received via the tested event
        var updatedGridName;

        var callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        var grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module"><content/></cells>' +
                        '<cells type="module"><content/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>');
        Manipulator.setIds(grid);
        Store.__private.addGrid(grid);

        // force it to be in design mode
        Store.__private.grids['foo'].designModeStep = 'enabled'

        // listen to the tested event
        Store.on('grid.designMode.dragging.start', callback);

        try {

            Actions.startDragging('foo', grid.querySelector('#cells-4'));

        } finally {

            // give some time to let the callbacks to be called
            setTimeout(function() {
                var newGrid = Store.getGrid('foo');

                // clean the listener
                Store.off('grid.designMode.dragging.start', callback);

                // check if the callback were called
                expect(callbackCalled).toBe(true);
                expect(updatedGridName, 'foo');

                // check the new designMode step
                expect(Store.getDesignModeStep('foo')).toEqual('dragging');

                // check if the grid the dragged cell removed, and has placeholders
                var expected =
                    '<grid name="foo" space="5px" type="mainGrid" id="grid-1" hasPlaceholders="true">' +
                        '<content id="content-2">' +
                            '<rows type="placeholder" id="rows-8"><cells type="placeholder" id="cells-9"><content id="content-10"/></cells></rows>' +
                            '<rows id="rows-3">' +
                                '<cells type="placeholder" id="cells-11"><content id="content-12"/></cells>' +
                                '<cells type="grid" id="cells-6">' +
                                    '<content id="content-13">' +
                                        '<rows type="placeholder" id="rows-14">' +
                                            '<cells type="placeholder" id="cells-15"><content id="content-16"/></cells>' +
                                        '</rows>' +
                                        '<rows id="rows-17">' +
                                            '<cells type="placeholder" id="cells-18"><content id="content-19"/></cells>' +
                                            '<cells type="module" id="cells-20"><content id="content-7"/></cells>' +
                                            '<cells type="placeholder" id="cells-21"><content id="content-22"/></cells>' +
                                        '</rows>' +
                                        '<rows type="placeholder" id="rows-23">' +
                                            '<cells type="placeholder" id="cells-24"><content id="content-25"/></cells>' +
                                        '</rows>' +
                                    '</content>' +
                                '</cells>' +
                                '<cells type="placeholder" id="cells-26"><content id="content-27"/></cells>' +
                            '</rows>' +
                            '<rows type="placeholder" id="rows-28"><cells type="placeholder" id="cells-29"><content id="content-30"/></cells></rows>' +
                        '</content>' +
                    '</grid>';
                expect(newGrid).toEqualXML(expected);

                // tell jasmine we're done
                done();

            }, 0.01);

        }
    });


    it("should cancel dragging", function(done) {
        // will set this to True when the callback is called
        var callbackCalled = false;
        // will store the grid name received via the tested event
        var updatedGridName;

        var callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        var grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module"><content/></cells>' +
                        '<cells type="module"><content/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>');
        Manipulator.setIds(grid);
        Store.__private.addGrid(grid);

        // force it to be in design mode
        Store.__private.grids['foo'].designModeStep = 'enabled';

        // go to dragging mode
        Actions.startDragging('foo', grid.querySelector('#cells-4'));

        // leave some time the go in dragging mode
        setTimeout(function() {

            // listen to the tested event
            Store.on('grid.designMode.dragging.stop', callback);

            try {

                Actions.cancelDragging('foo', grid.querySelector('#cells-4'));

            } finally {


                // give some time to let the callbacks to be called
                setTimeout(function() {
                    var newGrid = Store.getGrid('foo');
                    // it should be the original grid
                    expect(newGrid).toBe(grid);

                    // clean the listener
                    Store.off('grid.designMode.dragging.stop', callback);

                    // check if the callback were called
                    expect(callbackCalled).toBe(true);
                    expect(updatedGridName, 'foo');

                    // check the new designMode step
                    expect(Store.getDesignModeStep('foo')).toEqual('enabled');

                    // check if the grid is the original one
                    var expected =
                        '<grid name="foo" space="5px" type="mainGrid" id="grid-1">' +
                            '<content id="content-2">' +
                                '<rows id="rows-3">' +
                                    '<cells type="module" id="cells-4"><content id="content-5"/></cells>' +
                                    '<cells type="module" id="cells-6"><content id="content-7"/></cells>' +
                                '</rows>' +
                            '</content>' +
                        '</grid>';
                    expect(newGrid).toEqualXML(expected);

                    // tell jasmine we're done
                    done();

                }, 0.01);

            }
        }, 0.01);

    });

    it("should start hovering then stay", function(done) {
        // will set this to True when the callback is called
        var callbackCalled = false;
        // will store the grid name received via the tested event
        var updatedGridName;

        var callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // we'll check if stay-hovering is called
        spyOn(Store.__private, 'stayHovering').and.callThrough();

        // add a grid to work on
        var grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module"><content/></cells>' +
                        '<cells type="module"><content/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>');
        Manipulator.setIds(grid);
        Store.__private.addGrid(grid);

        // force it to be in design mode
        Store.__private.grids['foo'].designModeStep = 'enabled';

        // go to dragging mode
        Actions.startDragging('foo', grid.querySelector('#cells-4'));

        // leave some time the go in dragging mode
        setTimeout(function() {

            // listen to the tested event
            Store.on('grid.designMode.hovering.start', callback);

            try {

                Actions.startHovering('foo', Store.getGrid('foo').querySelector('#cells-29'));

            } finally {

                // give some time to let the callbacks to be called
                setTimeout(function() {
                    var newGrid = Store.getGrid('foo');

                    // clean the listener
                    Store.off('grid.designMode.hovering.start', callback);

                    // check if the callback were called
                    expect(callbackCalled).toBe(true);
                    expect(updatedGridName, 'foo');

                    // check the new designMode step
                    expect(Store.getDesignModeStep('foo')).toEqual('prehovering');

                    // we should not be in "stay" mode yet
                    expect(Store.__private.stayHovering).not.toHaveBeenCalled();

                    // check if the grid the dragged cell removed, and has placeholders
                    var expected =
                        '<grid name="foo" space="5px" type="mainGrid" id="grid-1" hasPlaceholders="true">' +
                            '<content id="content-2">' +
                                '<rows type="placeholder" id="rows-8"><cells type="placeholder" id="cells-9"><content id="content-10"/></cells></rows>' +
                                '<rows id="rows-3">' +
                                    '<cells type="placeholder" id="cells-11"><content id="content-12"/></cells>' +
                                    '<cells type="grid" id="cells-6">' +
                                        '<content id="content-13">' +
                                            '<rows type="placeholder" id="rows-14">' +
                                                '<cells type="placeholder" id="cells-15"><content id="content-16"/></cells>' +
                                            '</rows>' +
                                            '<rows id="rows-17">' +
                                                '<cells type="placeholder" id="cells-18"><content id="content-19"/></cells>' +
                                                '<cells type="module" id="cells-20"><content id="content-7"/></cells>' +
                                                '<cells type="placeholder" id="cells-21"><content id="content-22"/></cells>' +
                                            '</rows>' +
                                            '<rows type="placeholder" id="rows-23">' +
                                                '<cells type="placeholder" id="cells-24"><content id="content-25"/></cells>' +
                                            '</rows>' +
                                        '</content>' +
                                    '</cells>' +
                                    '<cells type="placeholder" id="cells-26"><content id="content-27"/></cells>' +
                                '</rows>' +
                                '<rows type="placeholder" id="rows-28"><cells type="placeholder" id="cells-29"><content id="content-30"/></cells></rows>' +
                            '</content>' +
                        '</grid>';
                    expect(newGrid).toEqualXML(expected);

                    // now we'll check the "stay-hovering" status
                    callbackCalled = false;
                    updatedGridName = null;

                    Store.on('grid.designMode.hovering.stay', callback);

                    // wait to enter in real hovering mode
                    setTimeout(function() {
                        var newGrid = Store.getGrid('foo');

                        // clean the listener
                        Store.off('grid.designMode.hovering.stay', callback);

                        // check if the callback were called
                        expect(callbackCalled).toBe(true);
                        expect(updatedGridName, 'foo');

                        expect(Store.getDesignModeStep('foo')).toEqual('hovering');

                        // we should be in "stay" mode
                        expect(Store.__private.stayHovering).toHaveBeenCalled();

                        // check if the grid the dragged cell moved
                        var expected =
                            '<grid name="foo" space="5px" type="mainGrid" id="grid-1">' +
                                '<content id="content-2">' +
                                    '<rows id="rows-3">' +
                                        '<cells type="module" id="cells-6"><content id="content-7"/></cells>' +
                                    '</rows>' +
                                    '<rows id="rows-28">' +
                                        '<cells type="module" id="cells-29"><content id="content-5"/></cells>' +
                                    '</rows>' +
                                '</content>' +
                            '</grid>';
                        expect(newGrid).toEqualXML(expected);

                        // tell jasmine we're done
                        done();

                    }, hoveringDelay);

                }, 0.01);

            }
        }, 0.01);
    });


    var itShouldStopHovering = function(text, delay, stayCalled) {

        it(text, function(done) {
            // will set this to True when the callback is called
            var callbackCalled = false;
            // will store the grid name received via the tested event
            var updatedGridName;

            var callback = function(gridName) {
                callbackCalled = true;
                updatedGridName = gridName;
            };

            // we'll check if stay-hovering is called
            spyOn(Store.__private, 'stayHovering').and.callThrough();

            // add a grid to work on
            var grid = Manipulator.XMLStringToXMLGrid(
                '<grid name="foo" space="5px" type="mainGrid">' +
                    '<content>' +
                        '<rows>' +
                            '<cells type="module"><content/></cells>' +
                            '<cells type="module"><content/></cells>' +
                        '</rows>' +
                    '</content>' +
                '</grid>');
            Manipulator.setIds(grid);
            Store.__private.addGrid(grid);

            // force it to be in design mode
            Store.__private.grids['foo'].designModeStep = 'enabled';

            // go to dragging mode
            Actions.startDragging('foo', grid.querySelector('#cells-4'));

            // leave some time the go in dragging mode
            setTimeout(function() {
                // keep a reference of the grid in dragging mode to compare to it later
                var dragGrid = Store.getGrid('foo');

                // go to hovering mode
                Actions.startHovering('foo', Store.getGrid('foo').querySelector('#cells-29'));

                // leave some time the go in hovering mode
                setTimeout(function() {

                    if (stayCalled) {
                        expect(Store.__private.stayHovering).toHaveBeenCalled();
                    } else {
                        expect(Store.__private.stayHovering).not.toHaveBeenCalled();
                    }

                    // listen to the tested event
                    Store.on('grid.designMode.hovering.stop', callback);

                    try {

                        Actions.stopHovering('foo');

                    } finally {

                        // give some time to let the callbacks to be called
                        setTimeout(function() {
                            var newGrid = Store.getGrid('foo');
                            // it should be the grid in dragging mode
                            expect(newGrid).toBe(dragGrid);

                            // clean the listener
                            Store.off('grid.designMode.hovering.stop', callback);

                            // check if the callback were called
                            expect(callbackCalled).toBe(true);
                            expect(updatedGridName, 'foo');

                            // check the new designMode step
                            expect(Store.getDesignModeStep('foo')).toEqual('dragging');

                            // check if the grid the dragged cell removed, and has placeholders
                            var expected =
                                '<grid name="foo" space="5px" type="mainGrid" id="grid-1" hasPlaceholders="true">' +
                                    '<content id="content-2">' +
                                        '<rows type="placeholder" id="rows-8"><cells type="placeholder" id="cells-9"><content id="content-10"/></cells></rows>' +
                                        '<rows id="rows-3">' +
                                            '<cells type="placeholder" id="cells-11"><content id="content-12"/></cells>' +
                                            '<cells type="grid" id="cells-6">' +
                                                '<content id="content-13">' +
                                                    '<rows type="placeholder" id="rows-14">' +
                                                        '<cells type="placeholder" id="cells-15"><content id="content-16"/></cells>' +
                                                    '</rows>' +
                                                    '<rows id="rows-17">' +
                                                        '<cells type="placeholder" id="cells-18"><content id="content-19"/></cells>' +
                                                        '<cells type="module" id="cells-20"><content id="content-7"/></cells>' +
                                                        '<cells type="placeholder" id="cells-21"><content id="content-22"/></cells>' +
                                                    '</rows>' +
                                                    '<rows type="placeholder" id="rows-23">' +
                                                        '<cells type="placeholder" id="cells-24"><content id="content-25"/></cells>' +
                                                    '</rows>' +
                                                '</content>' +
                                            '</cells>' +
                                            '<cells type="placeholder" id="cells-26"><content id="content-27"/></cells>' +
                                        '</rows>' +
                                        '<rows type="placeholder" id="rows-28"><cells type="placeholder" id="cells-29"><content id="content-30"/></cells></rows>' +
                                    '</content>' +
                                '</grid>';
                            expect(newGrid).toEqualXML(expected);

                            // tell jasmine we're done
                            done();

                        }, 0.01);

                    }
                }, delay);

            }, 0.01);

        });

    };

    itShouldStopHovering("should stop hovering when pre-hovering", 0.01, false);
    itShouldStopHovering("should stop hovering when real (stay) hovering", hoveringDelay, true);

    var itShouldDrop = function(text, delay, stayCalled) {

        it(text, function(done) {
            // will set this to True when the callback is called
            var callbackCalled = false;
            // will store the grid name received via the tested event
            var updatedGridName;

            var callback = function(gridName) {
                callbackCalled = true;
                updatedGridName = gridName;
            };

            // we'll check if stay-hovering is called
            spyOn(Store.__private, 'stayHovering').and.callThrough();

            // add a grid to work on
            var grid = Manipulator.XMLStringToXMLGrid(
                '<grid name="foo" space="5px" type="mainGrid">' +
                    '<content>' +
                        '<rows>' +
                            '<cells type="module"><content/></cells>' +
                            '<cells type="module"><content/></cells>' +
                        '</rows>' +
                    '</content>' +
                '</grid>');
            Manipulator.setIds(grid);
            Store.__private.addGrid(grid);

            // force it to be in design mode
            Store.__private.grids['foo'].designModeStep = 'enabled';

            // go to dragging mode
            Actions.startDragging('foo', grid.querySelector('#cells-4'));

            // leave some time the go in dragging mode
            setTimeout(function() {

                // go to hovering mode
                Actions.startHovering('foo', Store.getGrid('foo').querySelector('#cells-29'));

                // listen to the tested event
                Store.on('grid.designMode.drop', callback);

                // leave some time the go in hovering mode
                setTimeout(function() {

                    if (stayCalled) {
                        expect(Store.__private.stayHovering).toHaveBeenCalled();
                    } else {
                        expect(Store.__private.stayHovering).not.toHaveBeenCalled();
                    }

                    try {

                        Actions.drop('foo', Store.getGrid('foo').querySelector('#cells-29'));

                    } finally {

                        // give some time to let the callbacks to be called
                        setTimeout(function() {
                            var newGrid = Store.getGrid('foo');

                            // clean the listener
                            Store.off('grid.designMode.drop', callback);

                            // check if the callback were called
                            expect(callbackCalled).toBe(true);
                            expect(updatedGridName, 'foo');

                            // check the new designMode step
                            expect(Store.getDesignModeStep('foo')).toEqual('enabled');

                            // check if the grid the dragged cell moved
                            var expected =
                                '<grid name="foo" space="5px" type="mainGrid" id="grid-1">' +
                                    '<content id="content-2">' +
                                        '<rows id="rows-3">' +
                                            '<cells type="module" id="cells-6"><content id="content-7"/></cells>' +
                                        '</rows>' +
                                        '<rows id="rows-28">' +
                                            '<cells type="module" id="cells-29"><content id="content-5"/></cells>' +
                                        '</rows>' +
                                    '</content>' +
                                '</grid>';
                            expect(newGrid).toEqualXML(expected);

                            // tell jasmine we're done
                            done();

                        }, 0.01);

                    }
                }, delay);
            }, 0.01);

        });

    };

    itShouldDrop("should drop module in placeholder when pre-hovering", 0.01, false);
    itShouldDrop("should drop module in placeholder when real (stay) hovering", hoveringDelay, true);

    it("should exit design mode", function(done) {
        // will set this to True when the callback is called
        var callbackCalled = false;
        // will store the grid name received via the tested event
        var updatedGridName;


        var callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        var grid = Manipulator.createBaseGrid('foo', 5);
        Store.__private.addGrid(grid);

        // force it to be in design mode
        Store.__private.grids['foo'].designModeStep = 'enabled'

        // listen to the tested event
        Store.on('grid.designMode.exit', callback);

        try {

            Actions.exitDesignMode('foo');

        } finally {

            // give some time to let the callbacks to be called
            setTimeout(function() {
                // clean the listener
                Store.off('grid.designMode.exit', callback);

                // check if the callback were called
                expect(callbackCalled).toBe(true);
                expect(updatedGridName, 'foo');

                // check the new designMode step
                expect(Store.getDesignModeStep('foo')).toEqual('disabled');

                // check if the grid has no placeholders
                var expected =
                    '<grid name="foo" space="5px" type="mainGrid" id="grid-1">' +
                        '<content id="content-2"/>' +
                    '</grid>';
                expect(grid).toEqualXML(expected);

                // tell jasmine we're done
                done();

            }, 0.01);

        }
    });


});
