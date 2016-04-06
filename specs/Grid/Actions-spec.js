import { Actions } from '../../app/Grid/Actions';
import { Manipulator } from '../../app/Grid/Manipulator';
import { Store } from '../../app/Grid/Store';

import { customMatchers } from './custom-matchers';
import { Utils } from '../Utils';


describe('Grid.Actions', function() {
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

        return Store.getGrid('foo');
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


    it('should add a grid', function(done) {
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
                var addedGrid;
                expect(function() {
                    addedGrid = Store.getGrid('foo');
                }).not.toThrowError(Store.Exceptions.GridDoesNotExist);

                // and if it is valid
                var expected =
                    '<grid name="foo" space="5px" type="mainGrid" id="grid-1">' +
                        '<content id="content-2"/>' +
                    '</grid>';
                expect(addedGrid).toEqualXML(expected);

                // and is in the history
                var gridEntry = Store.__private.getGridEntry('foo');
                expect(gridEntry.history.length).toBe(1);
                expect(gridEntry.history[0]).toBe(grid);

                // tell jasmine we're done
                done();

            }, 0.01);

        }
    });

    it('should enter design mode', function(done) {
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
                var newGrid = Store.getGrid('foo');

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
                expect(newGrid).toEqualXML(expected);

                // tell jasmine we're done
                done();

            }, 0.01);

        }
    });

    it('should add a module', function(done) {
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
        Store.on('grid.designMode.module.add', callback);

        try {
            Actions.addModule('foo', 'Module.Test1', {text: 'test text'});
        } finally {

            // give some time to let the callbacks to be called
            setTimeout(function() {
                var newGrid = Store.getGrid('foo');

                // clean the listener
                Store.off('grid.designMode.module.add', callback);

                // check if the callback were called
                expect(callbackCalled).toBe(true);
                expect(updatedGridName).toEqual('foo');

                // check that we are still in design mode
                expect(Store.getDesignModeStep('foo')).toEqual('enabled');

                // check if the grid has a new row with the module
                var expected =
                    '<grid name="foo" space="5px" type="mainGrid" id="grid-1">' +
                        '<content id="content-2">' +
                            '<row id="row-8">' +
                                '<cell type="module" id="cell-9"><content component="Module.Test1" text="test text" id="content-10"/></cell>' +
                            '</row>' +
                            '<row id="row-3">' +
                                '<cell type="module" id="cell-4"><content id="content-5"/></cell>' +
                                '<cell type="module" id="cell-6"><content id="content-7"/></cell>' +
                            '</row>' +
                        '</content>' +
                    '</grid>';
                expect(newGrid).toEqualXML(expected);

                // check that the grid with the new module is in the history
                var gridEntry = Store.__private.getGridEntry('foo');
                expect(gridEntry.history.length).toBe(2);
                expect(gridEntry.history[1]).toEqualXML(newGrid);

                // tell jasmine we're done
                done();

            }, 0.01);

        }
    });

    it('should remove a module', function(done) {
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
        Store.on('grid.designMode.module.remove', callback);

        try {
            // remove the first module
            Actions.removeModule('foo', grid.querySelector('cell[type=module]'));
        } finally {

            // give some time to let the callbacks to be called
            setTimeout(function() {
                var newGrid = Store.getGrid('foo');

                // clean the listener
                Store.off('grid.designMode.module.remove', callback);

                // check if the callback were called
                expect(callbackCalled).toBe(true);
                expect(updatedGridName).toEqual('foo');

                // check that we are still in design mode
                expect(Store.getDesignModeStep('foo')).toEqual('enabled');

                // check if the grid has a new row with the module
                var expected =
                    '<grid name="foo" space="5px" type="mainGrid" id="grid-1">' +
                        '<content id="content-2">' +
                            '<row id="row-3">' +
                                '<cell type="module" id="cell-6"><content id="content-7"/></cell>' +
                            '</row>' +
                        '</content>' +
                    '</grid>';
                expect(newGrid).toEqualXML(expected);

                // check that the grid with the removed module is in the history
                var gridEntry = Store.__private.getGridEntry('foo');
                expect(gridEntry.history.length).toBe(2);
                expect(gridEntry.history[1]).toEqualXML(newGrid);

                // tell jasmine we're done
                done();

            }, 0.01);

        }
    });

    it('should start dragging', function(done) {
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

    it('should restore state if startDragging fail', function(done) {
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


    it('should cancel dragging', function(done) {
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

    it('should start hovering then stay', function(done) {
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

    it('should change hovering placeholder', function(done) {

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

    it('should not start hovering if already hovering the same placeholder', function(done) {

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

    it('should not start hovering if no placeholder', function(done) {

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

    itShouldStopHovering('should stop hovering when pre-hovering', 0.01, false);
    itShouldStopHovering('should stop hovering when real (stay) hovering', hoveringDelay, true);

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

                            // check that the grid with the module modev is in the history
                            var gridEntry = Store.__private.getGridEntry('foo');
                            expect(gridEntry.history.length).toBe(2);
                            expect(gridEntry.history[1]).toEqualXML(newGrid);

                            // tell jasmine we're done
                            done();

                        }, 0.01);

                    }
                }, delay);
            }, 0.01);

        });

    };

    itShouldDrop('should drop module in placeholder when pre-hovering', 0.01, false, false);
    itShouldDrop('should drop module in placeholder when real (stay) hovering', hoveringDelay, true, false);
    itShouldDrop('should drop module in forced placeholder when pre-hovering', 0.01, false, true);

    it('should cancel drop if in dragging mode', function(done) {
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

    it('should exit design mode', function(done) {
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

    it('should start resizing', function(done) {
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
        Manipulator.addResizers(grid);
        var resizer = grid.querySelector('resizer[type=vertical]');

        // listen to the tested event
        Store.on('grid.designMode.resizing.start', callback);

        try {

            Actions.startResizing('foo', resizer, 200, 100);

        } finally {
            // give some time to let the callbacks to be called
            setTimeout(function() {

                // clean the listener
                Store.off('grid.designMode.resizing.start', callback);

                // check if the callback were called
                expect(callbackCalled).toBe(true);
                expect(updatedGridName).toEqual('foo');

                // check the new designMode step
                expect(Store.getDesignModeStep('foo')).toEqual('resizing');

                // check that we have resizing data
                var gridEntry = Store.__private.getGridEntry('foo');
                expect(gridEntry.nodes.resizing).toBe(resizer);
                expect(gridEntry.resizing).toEqual({
                    initialPos: 100,
                    previousRelativeSize: 1,
                    nextRelativeSize: 1,
                    sizeRatio: 0.01,  // 2 (total relative size) / 200 (full size)
                });

                // tell jasmine we're done
                done();

            }, 0.01);

        }
    });

    it('should continue resizing', function(done) {
        // will set this to True when the callback is called
        var callbackCalled = false;
        // will store the grid name received via the tested event
        var updatedGridName;
        // will store event callback additional data
        var callbackData;

        var callback = function(gridName, data) {
            callbackCalled = true;
            updatedGridName = gridName;
            callbackData = data;
        };

        // add a grid to work on
        var grid = createSimpleGrid();
        Manipulator.addResizers(grid);
        var resizer = grid.querySelector('resizer[type=vertical]');
        // nodes around the resizer that will be resized
        var previous = resizer.previousSibling;
        var next = resizer.nextSibling;

        // start by going in resizing mode
        Actions.startResizing('foo', resizer, 200, 100);

        // leave some time the go in resizing mode
        setTimeout(function() {

            // listen to the tested event
            Store.on('grid.designMode.resizing.move', callback);

            try {

                Actions.resize('foo', 150);

            } finally {
                // give some time to let the callbacks to be called
                setTimeout(function() {

                    // clean the listener
                    Store.off('grid.designMode.resizing.move', callback);

                    // check if the callback were called
                    expect(callbackCalled).toBe(true);
                    expect(updatedGridName).toEqual('foo');
                    expect(callbackData).toEqual({
                        previousRelativeSize: 1.5,
                        nextRelativeSize: 0.5,
                    });

                    // check the new designMode step, still "resizing"
                    expect(Store.getDesignModeStep('foo')).toEqual('resizing');

                    // check that we still have the same resizing data
                    var gridEntry = Store.__private.getGridEntry('foo');
                    expect(gridEntry.nodes.resizing).toBe(resizer);
                    expect(gridEntry.resizing).toEqual({
                        initialPos: 100,
                        previousRelativeSize: 1,
                        nextRelativeSize: 1,
                        sizeRatio: 0.01,  // 2 (total relative size) / 200 (full size)
                    });

                    // check that the nodes are updated in the grid
                    expect(previous.getAttribute('relativeSize')).toEqual('1.5');
                    expect(next.getAttribute('relativeSize')).toEqual('0.5');

                    // tell jasmine we're done
                    done();

                }, 0.01);

            }
        }, 0.01);
    });

    it('should ignore resizing if out of bound', function(done) {
        // will set this to True when the callback is called
        var callbackCalled = false;
        var callback = function(gridName) {
            callbackCalled = true;
        };

        // add a grid to work on
        var grid = createSimpleGrid();
        Manipulator.addResizers(grid);
        var resizer = grid.querySelector('resizer[type=vertical]');
        // nodes around the resizer that will not be resized in this case
        var previous = resizer.previousSibling;
        var next = resizer.nextSibling;

        // start by going in resizing mode
        Actions.startResizing('foo', resizer, 200, 100);

        // leave some time the go in resizing mode
        setTimeout(function() {

            // listen to the tested event
            Store.on('grid.designMode.resizing.move', callback);

            try {

                Actions.resize('foo', 500);

            } finally {
                // give some time to let the callbacks to be called
                setTimeout(function() {

                    // clean the listener
                    Store.off('grid.designMode.resizing.move', callback);

                    expect(callbackCalled).toBe(false);

                    // check that the nodes are not updated in the grid
                    expect(previous.getAttribute('relativeSize')).toBe(null);
                    expect(next.getAttribute('relativeSize')).toBe(null);

                    // tell jasmine we're done
                    done();

                }, 0.01);

            }
        }, 0.01);
    });

    it('should stop resizing', function(done) {
        // will set this to True when the callback is called
        var callbackCalled = false;
        // will store the grid name received via the tested event
        var updatedGridName;

        var callback = function(gridName, data) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        var grid = createSimpleGrid();
        Manipulator.addResizers(grid);
        var resizer = grid.querySelector('resizer[type=vertical]');
        // nodes around the resizer that will be resized
        var previous = resizer.previousSibling;
        var next = resizer.nextSibling;

        // start by going in resizing mode
        Actions.startResizing('foo', resizer, 200, 100);

        // leave some time the go in resizing mode
        setTimeout(function() {

            // then do a resize
            Actions.resize('foo', 150);

            // leave some time the update the relative sizes
            setTimeout(function() {

                // listen to the tested event
                Store.on('grid.designMode.resizing.stop', callback);

                try {

                    Actions.stopResizing('foo');

                } finally {
                    // give some time to let the callbacks to be called
                    setTimeout(function() {
                        var newGrid = Store.getGrid('foo');

                        // clean the listener
                        Store.off('grid.designMode.resizing.stop', callback);

                        // check if the callback were called
                        expect(callbackCalled).toBe(true);
                        expect(updatedGridName).toEqual('foo');

                        // check the new designMode step, now "enabled"
                        expect(Store.getDesignModeStep('foo')).toEqual('enabled');

                        // check that we don't have resizing data anymore
                        var gridEntry = Store.__private.getGridEntry('foo');
                        expect(gridEntry.nodes.resizing).toBe(undefined);
                        expect(gridEntry.resizing).toEqual({});

                        // check that the nodes are still updated in the grid
                        expect(previous.getAttribute('relativeSize')).toEqual('1.5');
                        expect(next.getAttribute('relativeSize')).toEqual('0.5');

                        // check that the grid with the resizing done is in the history
                        var gridEntry = Store.__private.getGridEntry('foo');
                        expect(gridEntry.history.length).toBe(2);
                        expect(gridEntry.history[1]).toEqualXML(newGrid);

                        // tell jasmine we're done
                        done();

                    }, 0.01);

                }
            }, 0.01);
        }, 0.01);
    });

    it('should go through in history', function(done) {
        // will set this to True when the callbacks are called
        var addCallbackCalled = false;
        var backCallbackCalled = false;
        var forwardCallbackCalled = false;
        // will store the grid name received via the tested events
        var addUpdatedGridName;
        var backUpdatedGridName;
        var forwardUpdatedGridName;

        var addCallback = function(gridName) {
            addCallbackCalled = true;
            addUpdatedGridName = gridName;
        };
        var backCallback = function(gridName) {
            backCallbackCalled = true;
            backUpdatedGridName = gridName;
        };
        var forwardCallback = function(gridName) {
            forwardCallbackCalled = true;
            forwardUpdatedGridName = gridName;
        };

        // add a grid to work on, which is set in history
        var grid = createSimpleGrid();

        // listen to the tested events
        Store.on('grid.designMode.history.back', backCallback);
        Store.on('grid.designMode.history.add', addCallback);
        Store.on('grid.designMode.history.forward', forwardCallback);

        // we should have one entry in the history
        var gridEntry = Store.__private.getGridEntry('foo');
        expect(gridEntry.history.length).toEqual(1);
        // with only one row
        expect(gridEntry.history[0].querySelectorAll(':scope > content > row').length).toEqual(1);
        expect(Store.getGrid('foo').querySelectorAll(':scope > content > row').length).toEqual(1);

        // update the grid
        Manipulator.addRow(grid);

        // add it to the history
        Store.__private.addCurrentGridToHistory('foo');

        // leave some time to update the history
        setTimeout(function() {
            // check if the callback were called
            expect(addCallbackCalled).toBe(true);
            expect(addUpdatedGridName).toEqual('foo');

            // we should be at the second entry in the history
            expect(gridEntry.history.length).toEqual(2);
            expect(gridEntry.currentHistoryIndex).toEqual(1);
            // with two rows
            expect(gridEntry.history[1].querySelectorAll(':scope > content > row').length).toEqual(2);
            expect(Store.getGrid('foo').querySelectorAll(':scope > content > row').length).toEqual(2);

            // ask to go back in history
            Actions.goBackInHistory('foo');

            // leave some time the go update the history
            setTimeout(function() {

                // check if the callback were called
                expect(backCallbackCalled).toBe(true);
                expect(backUpdatedGridName).toEqual('foo');

                // we should be back at the first entry in the history, which has still two entries
                expect(gridEntry.history.length).toEqual(2);
                expect(gridEntry.currentHistoryIndex).toEqual(0);
                // with only one row
                expect(gridEntry.history[0].querySelectorAll(':scope > content > row').length).toEqual(1);
                expect(Store.getGrid('foo').querySelectorAll(':scope > content > row').length).toEqual(1);

                // now go forward in history
                Actions.goForwardInHistory('foo');

                // leave some time the go update the history
                setTimeout(function() {

                    // check if the callback were called
                    expect(forwardCallbackCalled).toBe(true);
                    expect(forwardUpdatedGridName).toEqual('foo');

                    // we should be back at the second entry in the history, which has still two entries
                    expect(gridEntry.history.length).toEqual(2);
                    expect(gridEntry.currentHistoryIndex).toEqual(1);
                    // with two row
                    expect(gridEntry.history[1].querySelectorAll(':scope > content > row').length).toEqual(2);
                    expect(Store.getGrid('foo').querySelectorAll(':scope > content > row').length).toEqual(2);

                    // tell jasmine we're done
                    done();
                }, 0.01);
            }, 0.01);
        }, 0.01);
    });

});
