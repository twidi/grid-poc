var Actions = require('../../app/Grid/Actions.js');
var Manipulator = require('../../app/Grid/Manipulator.js');
var Store = require('../../app/Grid/Store.js');

var customMatchers = require('./custom-matchers.js');
var Utils = require('../Utils.js');


describe("Grid.Actions", function() {
    var uniqueIdMock;
    var defaultHoveringDelay = Store.__private.hoveringDelay;
    var hoveringDelay = 10;

    var createSimpleGrid = function() {
        // create a grid with two cells (one we'll drag)
        var grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="foo" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module"><content/></cell>' +
                        '<cell type="module"><content/></cell>' +
                    '</row>' +
                '</content>' +
            '</grid>');

        Manipulator.setIds(grid);

        Store.__private.addGrid(grid);

        // force it to be in design mode
        Store.__private.grids['foo'].designModeStep = 'enabled';

        return grid;
    };

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
                Store.off('grid.add', callback);

                // check if the callback were called
                expect(callbackCalled).toBe(true);
                expect(addedGridName).toEqual('foo');

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
                expect(updatedGridName).toEqual('foo');

                // check the new designMode step
                expect(Store.getDesignModeStep('foo')).toEqual('enabled');

                // check if the grid is still the same
                var expected =
                    '<grid name="foo" space="5px" type="mainGrid" id="grid-1" hasResizers="true">' +
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
        var grid = createSimpleGrid();

        // listen to the tested event
        Store.on('grid.designMode.dragging.start', callback);

        try {

            Actions.startDragging('foo', grid.querySelector('#cell-4'));

        } finally {

            // give some time to let the callbacks to be called
            setTimeout(function() {
                var newGrid = Store.getGrid('foo');

                // clean the listener
                Store.off('grid.designMode.dragging.start', callback);

                // check if the callback were called
                expect(callbackCalled).toBe(true);
                expect(updatedGridName).toEqual('foo');

                // check the new designMode step
                expect(Store.getDesignModeStep('foo')).toEqual('dragging');

                // check if the grid the dragged cell removed, and has placeholders
                var expected =
                     '<grid name="foo" space="5px" type="mainGrid" id="grid-1" hasPlaceholders="true">' +
                        '<content id="content-2">' +
                            '<row type="placeholder" id="row-8"><cell type="placeholder" id="cell-9"><content id="content-10"/></cell></row>' +
                            '<row id="row-3">' +
                                '<cell type="placeholder" id="cell-11"><content id="content-12"/></cell>' +
                                '<cell type="module" id="cell-6">' +
                                    '<content id="content-7"/>' +
                                '</cell>' +
                                '<cell type="placeholder" id="cell-13"><content id="content-14"/></cell>' +
                            '</row>' +
                            '<row type="placeholder" id="row-15"><cell type="placeholder" id="cell-16"><content id="content-17"/></cell></row>' +
                        '</content>' +
                    '</grid>';

                expect(newGrid).toEqualXML(expected);

                // tell jasmine we're done
                done();

            }, 0.01);

        }
    });

    it("should restore state if startDragging fail", function(done) {
        // will set this to True when the callback is called
        var callbackCalled = false;
        // will store the grid name received via the tested event
        var updatedGridName;

        var callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        var grid = createSimpleGrid();

        // listen to the tested event
        Store.on('grid.designMode.dragging.start', callback);

        // we'll check if restoreGrid is called, in case of failure
        spyOn(Store.__private, 'restoreGrid').and.callThrough();

        try {

            // start dragging a non valid node
            Actions.startDragging('foo', grid);

        } finally {

            // give some time to let the callbacks to be called
            setTimeout(function() {

                // clean the listener
                Store.off('grid.designMode.dragging.start', callback);

                expect(callbackCalled).toBe(false);
                expect(Store.__private.restoreGrid.calls.count()).toEqual(1);
                expect(Store.getDesignModeStep('foo')).toEqual('enabled');

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
        var grid = createSimpleGrid();

        // go to dragging mode
        Actions.startDragging('foo', grid.querySelector('#cell-4'));

        // leave some time the go in dragging mode
        setTimeout(function() {

            // listen to the tested event
            Store.on('grid.designMode.dragging.stop', callback);

            try {

                Actions.cancelDragging('foo', grid.querySelector('#cell-4'));

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
                    expect(updatedGridName).toEqual('foo');

                    // check the new designMode step
                    expect(Store.getDesignModeStep('foo')).toEqual('enabled');

                    // check if the grid is the original one
                    var expected =
                        '<grid name="foo" space="5px" type="mainGrid" id="grid-1">' +
                            '<content id="content-2">' +
                                '<row id="row-3">' +
                                    '<cell type="module" id="cell-4"><content id="content-5"/></cell>' +
                                    '<cell type="module" id="cell-6"><content id="content-7"/></cell>' +
                                '</row>' +
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
        var grid = createSimpleGrid();

        // go to dragging mode
        Actions.startDragging('foo', grid.querySelector('#cell-4'));

        // leave some time the go in dragging mode
        setTimeout(function() {

            // listen to the tested event
            Store.on('grid.designMode.hovering.start', callback);

            try {

                Actions.startHovering('foo', Store.getGrid('foo').querySelector('#cell-16'));

            } finally {

                // give some time to let the callbacks to be called
                setTimeout(function() {
                    var newGrid = Store.getGrid('foo');

                    // clean the listener
                    Store.off('grid.designMode.hovering.start', callback);

                    // check if the callback were called
                    expect(callbackCalled).toBe(true);
                    expect(updatedGridName).toEqual('foo');

                    // check the new designMode step
                    expect(Store.getDesignModeStep('foo')).toEqual('prehovering');

                    // we should not be in "stay" mode yet
                    expect(Store.__private.stayHovering).not.toHaveBeenCalled();

                    // check if the grid the dragged cell removed, and has placeholders
                    var expected =
                        '<grid name="foo" space="5px" type="mainGrid" id="grid-1" hasPlaceholders="true">' +
                            '<content id="content-2">' +
                                '<row type="placeholder" id="row-8"><cell type="placeholder" id="cell-9"><content id="content-10"/></cell></row>' +
                                '<row id="row-3">' +
                                    '<cell type="placeholder" id="cell-11"><content id="content-12"/></cell>' +
                                    '<cell type="module" id="cell-6">' +
                                        '<content id="content-7"/>' +
                                    '</cell>' +
                                    '<cell type="placeholder" id="cell-13"><content id="content-14"/></cell>' +
                                '</row>' +
                                '<row type="placeholder" id="row-15"><cell type="placeholder" id="cell-16"><content id="content-17"/></cell></row>' +
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
                        expect(updatedGridName).toEqual('foo');

                        expect(Store.getDesignModeStep('foo')).toEqual('hovering');

                        // we should be in "stay" mode
                        expect(Store.__private.stayHovering).toHaveBeenCalled();

                        // check if the grid the dragged cell moved
                        var expected =
                            '<grid name="foo" space="5px" type="mainGrid" id="grid-1">' +
                                '<content id="content-2">' +
                                    '<row id="row-3">' +
                                        '<cell type="module" id="cell-6"><content id="content-7"/></cell>' +
                                    '</row>' +
                                    '<row id="row-15">' +
                                        '<cell type="module" id="cell-16"><content id="content-5"/></cell>' +
                                    '</row>' +
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

    it("should change hovering placeholder", function(done) {

        // will set this to True when the callback is called, on hovering.start and stop
        var callbackCalled1 = false;
        var callbackCalled2 = false;
        // will store the grid name received via the tested events
        var updatedGridName1;
        var updatedGridName2;

        var callback1 = function(gridName) {
            callbackCalled1 = true;
            updatedGridName1 = gridName;
        };

        var callback2 = function(gridName) {
            callbackCalled2 = true;
            updatedGridName2 = gridName;
        };

        // add a grid to work on
        var grid = createSimpleGrid();

        // go to dragging mode
        Actions.startDragging('foo', grid.querySelector('#cell-4'));

        // leave some time the go in dragging mode
        setTimeout(function() {

            try {

                Actions.startHovering('foo', Store.getGrid('foo').querySelector('#cell-16'));

            } finally {

                // give some time to let the callbacks to be called
                setTimeout(function() {

                    // listen to the tested event
                    Store.on('grid.designMode.hovering.start', callback1);
                    Store.on('grid.designMode.hovering.stop', callback2);

                    // we'll check if stopHovering is called to reset the previous placeholder
                    spyOn(Store.__private, 'stopHovering').and.callThrough();

                    try {
                        // doing the same hovering call, on the same cell
                        Actions.startHovering('foo', Store.getGrid('foo').querySelector('#cell-9'));

                    } finally {
                        setTimeout(function() {


                            // clean the listeners
                            Store.off('grid.designMode.hovering.start', callback1);
                            Store.off('grid.designMode.hovering.stop', callback2);

                            // not the same placeholder, we should have all callback called
                            expect(callbackCalled1).toBe(true);
                            expect(updatedGridName1).toEqual('foo');
                            expect(callbackCalled2).toBe(true);
                            expect(updatedGridName2).toEqual('foo');

                            // method related to a real startHovering should not have been called
                            expect(Store.__private.stopHovering.calls.count()).toEqual(1);

                            // tell jasmine we're done
                            done();
                        }, 0.01);
                    }

                }, 0.01);
            }
        }, 0.01);
    });

    it("should not start hovering if already hovering the same placeholder", function(done) {

        // here we don't want a fast "hovering delay" to avoid fire the "stayHovering" too fast
        Store.__private.hoveringDelay = defaultHoveringDelay;

        // will set this to True when the callback is called
        var callbackCalled = false;

        var callback = function(gridName) {
            callbackCalled = true;
        };

        // add a grid to work on
        var grid = createSimpleGrid();

        // go to dragging mode
        Actions.startDragging('foo', grid.querySelector('#cell-4'));

        // leave some time the go in dragging mode
        setTimeout(function() {

            try {

                Actions.startHovering('foo', Store.getGrid('foo').querySelector('#cell-16'));

            } finally {

                // give some time to let the callbacks to be called
                setTimeout(function() {

                    // listen to the tested event
                    Store.on('grid.designMode.hovering.start', callback);

                    // we'll check if clearHoveringTimeout is called, it should NOT
                    spyOn(Store.__private, 'clearHoveringTimeout').and.callThrough();

                    try {
                        // doing the same hovering call, on the same cell
                        Actions.startHovering('foo', Store.getGrid('foo').querySelector('#cell-16'));

                    } finally {
                        setTimeout(function() {

                            // clean the listener
                            Store.off('grid.designMode.hovering.start', callback);

                            // no new design mode event
                            expect(callbackCalled).toBe(false);

                            // method related to a real startHovering should not have been called
                            expect(Store.__private.clearHoveringTimeout).not.toHaveBeenCalled();

                            // tell jasmine we're done
                            done();
                        }, 0.01);
                    }

                }, 0.01);
            }
        }, 0.01);
    });

    it("should not start hovering if no placeholder", function(done) {

        // will set this to True when the callback is called
        var callbackCalled = false;

        var callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        var grid = createSimpleGrid();

        // go to dragging mode
        Actions.startDragging('foo', grid.querySelector('#cell-4'));

        // listen to the tested event
        Store.on('grid.designMode.hovering.start', callback);

        // we'll check if clearHoveringTimeout is called, it should NOT
        spyOn(Store.__private, 'clearHoveringTimeout').and.callThrough();

        // leave some time the go in dragging mode
        setTimeout(function() {

            try {

                Actions.startHovering('foo');

            } finally {

                // give some time to let the callbacks to be called
                setTimeout(function() {

                    // clean the listener
                    Store.off('grid.designMode.hovering.start', callback);

                    // no new design mode event
                    expect(callbackCalled).toBe(false);

                    // method related to a real startHovering should not have been called
                    expect(Store.__private.clearHoveringTimeout).not.toHaveBeenCalled();

                    // not in "prehovering" mode
                    expect(Store.getDesignModeStep('foo')).toEqual('dragging');

                    // tell jasmine we're done
                    done();
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
            var grid = createSimpleGrid();

            // go to dragging mode
            Actions.startDragging('foo', grid.querySelector('#cell-4'));

            // leave some time the go in dragging mode
            setTimeout(function() {
                // keep a reference of the grid in dragging mode to compare to it later
                var dragGrid = Store.getGrid('foo');

                // go to hovering mode
                Actions.startHovering('foo', Store.getGrid('foo').querySelector('#cell-16'));

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
                            expect(updatedGridName).toEqual('foo');

                            // check the new designMode step
                            expect(Store.getDesignModeStep('foo')).toEqual('dragging');

                            // check if the grid the dragged cell removed, and has placeholders
                            var expected =
                                '<grid name="foo" space="5px" type="mainGrid" id="grid-1" hasPlaceholders="true">' +
                                    '<content id="content-2">' +
                                        '<row type="placeholder" id="row-8"><cell type="placeholder" id="cell-9"><content id="content-10"/></cell></row>' +
                                        '<row id="row-3">' +
                                            '<cell type="placeholder" id="cell-11"><content id="content-12"/></cell>' +
                                            '<cell type="module" id="cell-6">' +
                                                '<content id="content-7"/>' +
                                            '</cell>' +
                                            '<cell type="placeholder" id="cell-13"><content id="content-14"/></cell>' +
                                        '</row>' +
                                        '<row type="placeholder" id="row-15"><cell type="placeholder" id="cell-16"><content id="content-17"/></cell></row>' +
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

    var itShouldDrop = function(text, delay, stayCalled, otherPlaceholder) {

        it(text, function(done) {
            // will set this to True when the callback is called
            var callbackCalled = false;
            // will store the grid name received via the tested event
            var updatedGridName;

            var callback = function(gridName) {
                callbackCalled = true;
                updatedGridName = gridName;
            };

            // we'll check if drop is called
            spyOn(Actions, 'drop').and.callThrough();
            // and stay-hovering
            spyOn(Store.__private, 'stayHovering').and.callThrough();

            // add a grid to work on
            var grid = createSimpleGrid();

            // go to dragging mode
            Actions.startDragging('foo', grid.querySelector('#cell-4'));

            // leave some time the go in dragging mode
            setTimeout(function() {

                // go to hovering mode

                Actions.startHovering('foo', Store.getGrid('foo').querySelector('#cell-11'));

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

                        Actions.drop('foo', otherPlaceholder ? Store.getGrid('foo').querySelector('#cell-16') : null);

                    } finally {

                        // give some time to let the callbacks to be called
                        setTimeout(function() {
                            var newGrid = Store.getGrid('foo');

                            // clean the listener
                            Store.off('grid.designMode.drop', callback);

                            // check if the callback were called
                            expect(callbackCalled).toBe(true);
                            expect(updatedGridName).toEqual('foo');

                            expect(Actions.drop).toHaveBeenCalled();

                            // check the new designMode step
                            expect(Store.getDesignModeStep('foo')).toEqual('enabled');

                            // check if the grid the dragged cell moved
                            var expected = otherPlaceholder ?
                                '<grid name="foo" space="5px" type="mainGrid" id="grid-1" hasResizers="true">' +
                                    '<content id="content-2">' +
                                        '<row id="row-3">' +
                                            '<cell type="module" id="cell-6">' +
                                                '<content id="content-7"/>' +
                                            '</cell>' +
                                        '</row>' +
                                        '<resizer type="horizontal" id="resizer-18"/>' +
                                        '<row id="row-15">' +
                                            '<cell type="module" id="cell-16">' +
                                                '<content id="content-5"/>' +
                                            '</cell>' +
                                        '</row>' +
                                    '</content>' +
                                '</grid>'

                                :

                                '<grid name="foo" space="5px" type="mainGrid" id="grid-1" hasResizers="true">' +
                                    '<content id="content-2">' +
                                        '<row id="row-3">' +
                                            '<cell type="module" id="cell-11">' +
                                                '<content id="content-5"/>' +
                                            '</cell>' +
                                            '<resizer type="vertical" id="resizer-18"/>' +
                                            '<cell type="module" id="cell-6">' +
                                                '<content id="content-7"/>' +
                                            '</cell>' +
                                        '</row>' +
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

    itShouldDrop("should drop module in placeholder when pre-hovering", 0.01, false, false);
    itShouldDrop("should drop module in placeholder when real (stay) hovering", hoveringDelay, true, false);
    itShouldDrop("should drop module in forced placeholder when pre-hovering", 0.01, false, true);

    it("should cancel drop if in dragging mode", function(done) {
        // will set this to True when the callback is called
        var callbackCalled = false;

        var callback = function(gridName) {
            callbackCalled = true;
        };

        // add a grid to work on
        var grid = createSimpleGrid();

        // go to dragging mode
        Actions.startDragging('foo', grid.querySelector('#cell-4'));

        // leave some time the go in dragging mode
        setTimeout(function() {

            // go to hovering mode
            Actions.startHovering('foo', Store.getGrid('foo').querySelector('#cell-16'));

            // leave some time the go in hovering mode
            setTimeout(function() {

                // exit hovering mode
                Actions.stopHovering('foo');


                // leave some time the exit hovering mode
                setTimeout(function() {

                    // listen to the tested event, should not be called
                    Store.on('grid.designMode.drop', callback);

                    // we'll check if stay-hovering is called, should be called
                    spyOn(Store.__private, 'cancelDragging').and.callThrough();

                    // we'll check that we don't do a clone because we don't really drop
                    spyOn(Manipulator, 'clone').and.callThrough();

                    try {

                        // try q drop now that we are back in simple dragging mode
                        Actions.drop('foo');

                    } finally {

                        // give some time to let the callbacks to be called
                        setTimeout(function() {

                            // clean the listener
                            Store.off('grid.designMode.drop', callback);

                            expect(Store.__private.cancelDragging.calls.count()).toEqual(1);
                            expect(Manipulator.clone).not.toHaveBeenCalled();
                            expect(callbackCalled).toEqual(false);

                            // tell jasmine we're done
                            done();

                        }, 0.01);
                    }

                }, 0.01);
            }, 0.01);
        }, 0.01);

    });

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
        var grid = createSimpleGrid();

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
                expect(updatedGridName).toEqual('foo');

                // check the new designMode step
                expect(Store.getDesignModeStep('foo')).toEqual('disabled');

                // check if the grid has no placeholders
                var expected =
                    '<grid name="foo" space="5px" type="mainGrid" id="grid-1">' +
                        '<content id="content-2">' +
                            '<row id="row-3">' +
                                '<cell type="module" id="cell-4"><content id="content-5"/></cell>' +
                                '<cell type="module" id="cell-6"><content id="content-7"/></cell>' +
                            '</row>' +
                        '</content>' +
                    '</grid>';
                expect(grid).toEqualXML(expected);

                // tell jasmine we're done
                done();

            }, 0.01);

        }
    });


});
