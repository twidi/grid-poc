import { Actions } from '../../app/Grid/Actions';
import { Manipulator } from '../../app/Grid/Manipulator';
import { Store } from '../../app/Grid/Store';

import { customMatchers } from './custom-matchers';
import { Utils } from '../Utils';


describe('Grid.Actions', function() {
    let uniqueIdMock;
    const defaultHoveringDelay = Store.__private.hoveringDelay;
    const hoveringDelay = 10;

    let createSimpleGrid = function() {
        // create a grid with two cells (one we'll drag)
        const grid = Manipulator.XMLStringToXMLGrid(
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
        let callbackCalled = false;
        // will store the grid name received via the "add" event
        let addedGridName;

        const callback = function(gridName) {
            callbackCalled = true;
            addedGridName = gridName;
        };

        const grid = Manipulator.createBaseGrid('foo', 5);

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
                let addedGrid;
                expect(function() {
                    addedGrid = Store.getGrid('foo');
                }).not.toThrowError(Store.Exceptions.GridDoesNotExist);

                // and if it is valid
                const expected =
                    '<grid name="foo" space="5px" type="mainGrid" id="grid-1">' +
                        '<content id="content-2"/>' +
                    '</grid>';
                expect(addedGrid).toEqualXML(expected);

                // and is in the history
                const gridEntry = Store.__private.getGridEntry('foo');
                expect(gridEntry.history.length).toBe(1);
                expect(gridEntry.history[0]).toBe(grid);

                // tell jasmine we're done
                done();

            }, 0.01);

        }
    });

    it('should enter design mode', function(done) {
        // will set this to True when the callback is called
        let callbackCalled = false;
        // will store the grid name received via the tested event
        let updatedGridName;

        const callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        const grid = Manipulator.createBaseGrid('foo', 5);
        Actions.addGrid(grid);

        // listen to the tested event
        Store.on('grid.designMode.enter', callback);

        try {
            Actions.enterDesignMode('foo');
        } finally {

            // give some time to let the callbacks to be called
            setTimeout(function() {
                const newGrid = Store.getGrid('foo');

                // clean the listener
                Store.off('grid.designMode.enter', callback);

                // check if the callback were called
                expect(callbackCalled).toBe(true);
                expect(updatedGridName).toEqual('foo');

                // check the new designMode step
                expect(Store.getDesignModeStep('foo')).toEqual('enabled');

                // check if the grid is still the same
                const expected =
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
        let callbackCalled = false;
        // will store the grid name received via the tested event
        let updatedGridName;

        const callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        const grid = createSimpleGrid();

        // listen to the tested event
        Store.on('grid.designMode.module.add', callback);

        try {
            Actions.addModule('foo', 'Module.Test1', {text: 'test text'});
        } finally {

            // give some time to let the callbacks to be called
            setTimeout(function() {
                const newGrid = Store.getGrid('foo');

                // clean the listener
                Store.off('grid.designMode.module.add', callback);

                // check if the callback were called
                expect(callbackCalled).toBe(true);
                expect(updatedGridName).toEqual('foo');

                // check that we are still in design mode
                expect(Store.getDesignModeStep('foo')).toEqual('enabled');

                // check if the grid has a new row with the module
                const expected =
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
                const gridEntry = Store.__private.getGridEntry('foo');
                expect(gridEntry.history.length).toBe(2);
                expect(gridEntry.history[1]).toEqualXML(newGrid);

                // tell jasmine we're done
                done();

            }, 0.01);

        }
    });

    it('should remove a module', function(done) {
        // will set this to True when the callback is called
        let callbackCalled = false;
        // will store the grid name received via the tested event
        let updatedGridName;

        const callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        const grid = createSimpleGrid();

        // listen to the tested event
        Store.on('grid.designMode.module.remove', callback);

        try {
            // remove the first module
            Actions.removeModule('foo', grid.querySelector('cell[type=module]'));
        } finally {

            // give some time to let the callbacks to be called
            setTimeout(function() {
                const newGrid = Store.getGrid('foo');

                // clean the listener
                Store.off('grid.designMode.module.remove', callback);

                // check if the callback were called
                expect(callbackCalled).toBe(true);
                expect(updatedGridName).toEqual('foo');

                // check that we are still in design mode
                expect(Store.getDesignModeStep('foo')).toEqual('enabled');

                // check if the grid has a new row with the module
                const expected =
                    '<grid name="foo" space="5px" type="mainGrid" id="grid-1">' +
                        '<content id="content-2">' +
                            '<row id="row-3">' +
                                '<cell type="module" id="cell-6"><content id="content-7"/></cell>' +
                            '</row>' +
                        '</content>' +
                    '</grid>';
                expect(newGrid).toEqualXML(expected);

                // check that the grid with the removed module is in the history
                const gridEntry = Store.__private.getGridEntry('foo');
                expect(gridEntry.history.length).toBe(2);
                expect(gridEntry.history[1]).toEqualXML(newGrid);

                // tell jasmine we're done
                done();

            }, 0.01);

        }
    });

    it('should start dragging', function(done) {
        // will set this to True when the callback is called
        let callbackCalled = false;
        // will store the grid name received via the tested event
        let updatedGridName;

        const callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        const grid = createSimpleGrid();

        // listen to the tested event
        Store.on('grid.designMode.dragging.start', callback);

        try {

            Actions.startDragging('foo', grid.querySelector('#cell-4'));

        } finally {

            // give some time to let the callbacks to be called
            setTimeout(function() {
                const newGrid = Store.getGrid('foo');

                // clean the listener
                Store.off('grid.designMode.dragging.start', callback);

                // check if the callback were called
                expect(callbackCalled).toBe(true);
                expect(updatedGridName).toEqual('foo');

                // check the new designMode step
                expect(Store.getDesignModeStep('foo')).toEqual('dragging');

                // check if the grid the dragged cell removed, and has placeholders
                const expected =
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
        let callbackCalled = false;
        // will store the grid name received via the tested event
        let updatedGridName;

        const callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        const grid = createSimpleGrid();

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
        let callbackCalled = false;
        // will store the grid name received via the tested event
        let updatedGridName;

        const callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        const grid = createSimpleGrid();

        // go to dragging mode
        Actions.startDragging('foo', grid.querySelector('#cell-4'));

        // leave some time to go in dragging mode
        setTimeout(function() {

            // listen to the tested event
            Store.on('grid.designMode.dragging.stop', callback);

            try {

                Actions.cancelDragging('foo', grid.querySelector('#cell-4'));

            } finally {


                // give some time to let the callbacks to be called
                setTimeout(function() {
                    const newGrid = Store.getGrid('foo');
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
                    const expected =
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
        let callbackCalled = false;
        // will store the grid name received via the tested event
        let updatedGridName;

        const callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // we'll check if stay-hovering is called
        spyOn(Store.__private, 'stayHovering').and.callThrough();

        // add a grid to work on
        const grid = createSimpleGrid();

        // go to dragging mode
        Actions.startDragging('foo', grid.querySelector('#cell-4'));

        // leave some time to go in dragging mode
        setTimeout(function() {

            // listen to the tested event
            Store.on('grid.designMode.hovering.start', callback);

            try {

                Actions.startHovering('foo', Store.getGrid('foo').querySelector('#cell-16'));

            } finally {

                // give some time to let the callbacks to be called
                setTimeout(function() {
                    const newGrid = Store.getGrid('foo');

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
                    const expected =
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
                        const newGrid = Store.getGrid('foo');

                        // clean the listener
                        Store.off('grid.designMode.hovering.stay', callback);

                        // check if the callback were called
                        expect(callbackCalled).toBe(true);
                        expect(updatedGridName).toEqual('foo');

                        expect(Store.getDesignModeStep('foo')).toEqual('hovering');

                        // we should be in "stay" mode
                        expect(Store.__private.stayHovering).toHaveBeenCalled();

                        // check if the grid the dragged cell moved
                        const expected =
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
        let callbackCalled1 = false;
        let callbackCalled2 = false;
        // will store the grid name received via the tested events
        let updatedGridName1;
        let updatedGridName2;

        const callback1 = function(gridName) {
            callbackCalled1 = true;
            updatedGridName1 = gridName;
        };

        const callback2 = function(gridName) {
            callbackCalled2 = true;
            updatedGridName2 = gridName;
        };

        // add a grid to work on
        const grid = createSimpleGrid();

        // go to dragging mode
        Actions.startDragging('foo', grid.querySelector('#cell-4'));

        // leave some time to go in dragging mode
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
        let callbackCalled = false;

        const callback = function(gridName) {
            callbackCalled = true;
        };

        // add a grid to work on
        const grid = createSimpleGrid();

        // go to dragging mode
        Actions.startDragging('foo', grid.querySelector('#cell-4'));

        // leave some time to go in dragging mode
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
        let callbackCalled = false;

        const callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        const grid = createSimpleGrid();

        // go to dragging mode
        Actions.startDragging('foo', grid.querySelector('#cell-4'));

        // listen to the tested event
        Store.on('grid.designMode.hovering.start', callback);

        // we'll check if clearHoveringTimeout is called, it should NOT
        spyOn(Store.__private, 'clearHoveringTimeout').and.callThrough();

        // leave some time to go in dragging mode
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

    let itShouldStopHovering = function(text, delay, stayCalled) {

        it(text, function(done) {
            // will set this to True when the callback is called
            let callbackCalled = false;
            // will store the grid name received via the tested event
            let updatedGridName;

            const callback = function(gridName) {
                callbackCalled = true;
                updatedGridName = gridName;
            };

            // we'll check if stay-hovering is called
            spyOn(Store.__private, 'stayHovering').and.callThrough();

            // add a grid to work on
            const grid = createSimpleGrid();

            // go to dragging mode
            Actions.startDragging('foo', grid.querySelector('#cell-4'));

            // leave some time to go in dragging mode
            setTimeout(function() {
                // keep a reference of the grid in dragging mode to compare to it later
                const dragGrid = Store.getGrid('foo');

                // go to hovering mode
                Actions.startHovering('foo', Store.getGrid('foo').querySelector('#cell-16'));

                // leave some time to go in hovering mode
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
                            const newGrid = Store.getGrid('foo');
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
                            const expected =
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

    let itShouldDrop = function(text, delay, stayCalled, otherPlaceholder) {

        it(text, function(done) {
            // will set this to True when the callback is called
            let callbackCalled = false;
            // will store the grid name received via the tested event
            let updatedGridName;

            const callback = function(gridName) {
                callbackCalled = true;
                updatedGridName = gridName;
            };

            // we'll check if drop is called
            spyOn(Actions, 'drop').and.callThrough();
            // and stay-hovering
            spyOn(Store.__private, 'stayHovering').and.callThrough();

            // add a grid to work on
            const grid = createSimpleGrid();

            // go to dragging mode
            Actions.startDragging('foo', grid.querySelector('#cell-4'));

            // leave some time to go in dragging mode
            setTimeout(function() {

                // go to hovering mode

                Actions.startHovering('foo', Store.getGrid('foo').querySelector('#cell-11'));

                // listen to the tested event
                Store.on('grid.designMode.drop', callback);

                // leave some time to go in hovering mode
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
                            const newGrid = Store.getGrid('foo');

                            // clean the listener
                            Store.off('grid.designMode.drop', callback);

                            // check if the callback were called
                            expect(callbackCalled).toBe(true);
                            expect(updatedGridName).toEqual('foo');

                            expect(Actions.drop).toHaveBeenCalled();

                            // check the new designMode step
                            expect(Store.getDesignModeStep('foo')).toEqual('enabled');

                            // check if the grid the dragged cell moved
                            const expected = otherPlaceholder ?
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
                            const gridEntry = Store.__private.getGridEntry('foo');
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
        let callbackCalled = false;

        const callback = function(gridName) {
            callbackCalled = true;
        };

        // add a grid to work on
        const grid = createSimpleGrid();

        // go to dragging mode
        Actions.startDragging('foo', grid.querySelector('#cell-4'));

        // leave some time to go in dragging mode
        setTimeout(function() {

            // go to hovering mode
            Actions.startHovering('foo', Store.getGrid('foo').querySelector('#cell-16'));

            // leave some time to go in hovering mode
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
        let callbackCalled = false;
        // will store the grid name received via the tested event
        let updatedGridName;


        const callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        const grid = createSimpleGrid();

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
                const expected =
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
        let callbackCalled = false;
        // will store the grid name received via the tested event
        let updatedGridName;

        const callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        const grid = createSimpleGrid();
        Manipulator.addResizers(grid);
        const resizer = grid.querySelector('resizer[type=vertical]');

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
                const gridEntry = Store.__private.getGridEntry('foo');
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
        let callbackCalled = false;
        // will store the grid name received via the tested event
        let updatedGridName;
        // will store event callback additional data
        let callbackData;

        const callback = function(gridName, data) {
            callbackCalled = true;
            updatedGridName = gridName;
            callbackData = data;
        };

        // add a grid to work on
        const grid = createSimpleGrid();
        Manipulator.addResizers(grid);
        const resizer = grid.querySelector('resizer[type=vertical]');
        // nodes around the resizer that will be resized
        const previous = resizer.previousSibling;
        const next = resizer.nextSibling;

        // start by going in resizing mode
        Actions.startResizing('foo', resizer, 200, 100);

        // leave some time to go in resizing mode
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
                    const gridEntry = Store.__private.getGridEntry('foo');
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
        let callbackCalled = false;
        const callback = function(gridName) {
            callbackCalled = true;
        };

        // add a grid to work on
        const grid = createSimpleGrid();
        Manipulator.addResizers(grid);
        const resizer = grid.querySelector('resizer[type=vertical]');
        // nodes around the resizer that will not be resized in this case
        const previous = resizer.previousSibling;
        const next = resizer.nextSibling;

        // start by going in resizing mode
        Actions.startResizing('foo', resizer, 200, 100);

        // leave some time to go in resizing mode
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
        let callbackCalled = false;
        // will store the grid name received via the tested event
        let updatedGridName;

        const callback = function(gridName, data) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // add a grid to work on
        const grid = createSimpleGrid();
        Manipulator.addResizers(grid);
        const resizer = grid.querySelector('resizer[type=vertical]');
        // nodes around the resizer that will be resized
        const previous = resizer.previousSibling;
        const next = resizer.nextSibling;

        // start by going in resizing mode
        Actions.startResizing('foo', resizer, 200, 100);

        // leave some time to go in resizing mode
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
                        const newGrid = Store.getGrid('foo');

                        // clean the listener
                        Store.off('grid.designMode.resizing.stop', callback);

                        // check if the callback were called
                        expect(callbackCalled).toBe(true);
                        expect(updatedGridName).toEqual('foo');

                        // check the new designMode step, now "enabled"
                        expect(Store.getDesignModeStep('foo')).toEqual('enabled');

                        // check that we don't have resizing data anymore
                        let gridEntry = Store.__private.getGridEntry('foo');
                        expect(gridEntry.nodes.resizing).toBe(undefined);
                        expect(gridEntry.resizing).toEqual({});

                        // check that the nodes are still updated in the grid
                        expect(previous.getAttribute('relativeSize')).toEqual('1.5');
                        expect(next.getAttribute('relativeSize')).toEqual('0.5');

                        // check that the grid with the resizing done is in the history
                        gridEntry = Store.__private.getGridEntry('foo');
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
        let addCallbackCalled = false;
        let backCallbackCalled = false;
        let forwardCallbackCalled = false;
        // will store the grid name received via the tested events
        let addUpdatedGridName;
        let backUpdatedGridName;
        let forwardUpdatedGridName;

        const addCallback = function(gridName) {
            addCallbackCalled = true;
            addUpdatedGridName = gridName;
        };
        const backCallback = function(gridName) {
            backCallbackCalled = true;
            backUpdatedGridName = gridName;
        };
        const forwardCallback = function(gridName) {
            forwardCallbackCalled = true;
            forwardUpdatedGridName = gridName;
        };

        // add a grid to work on, which is set in history
        const grid = createSimpleGrid();

        // listen to the tested events
        Store.on('grid.designMode.history.back', backCallback);
        Store.on('grid.designMode.history.add', addCallback);
        Store.on('grid.designMode.history.forward', forwardCallback);

        // we should have one entry in the history
        const gridEntry = Store.__private.getGridEntry('foo');
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

            // leave some time to update the history
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

                // leave some time to update the history
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

    it('should focus a module cell', function(done) {
        let grid = Manipulator.XMLStringToXMLGrid(
            '<grid name="bar" space="5px" type="mainGrid">' +
                '<content>' +
                    '<row>' +
                        '<cell type="module" id="c1"><content/></cell>' +
                        '<cell type="grid">' +
                            '<content>' +
                                '<row>' +
                                    '<cell type="module" id="c2"><content/></cell>' +
                                    '<cell type="module" id="c3"><content/></cell>' +
                                '</row>' +
                                '<row>' +
                                    '<cell type="module" id="c4"><content/></cell>' +
                                    '<cell type="module" id="c5"><content/></cell>' +
                                    '<cell type="module" id="c6"><content/></cell>' +
                                '</row>' +
                            '</content>' +
                        '</cell>' +
                        '<cell type="grid">' +
                            '<content>' +
                                '<row>' +
                                    '<cell type="module" id="c7"><content/></cell>' +
                                '</row>' +
                                '<row>' +
                                    '<cell type="module" id="c8"><content/></cell>' +
                                '</row>' +
                                '<row>' +
                                    '<cell type="module" id="c9"><content/></cell>' +
                                '</row>' +
                            '</content>' +
                        '</cell>' +
                    '</row>' +
                '</content>' +
            '</grid>');

        Manipulator.setIds(grid);
        Store.__private.addGrid(grid);
        grid = Store.getGrid('bar');

        // will set this to True when the callbacks are called
        let offCallbackCalled = false;
        let onCallbackCalled = false;
        // will store the grid name received via the tested events
        let offUpdatedGridName;
        let onUpdatedGridName;
        // and the module cell id focused/unfocused
        let offCellId;
        let onCellId;

        const offCallback = function(gridName, cellId) {
            offCallbackCalled = true;
            offUpdatedGridName = gridName;
            offCellId = cellId;
        };
        const onCallback = function(gridName, cellId) {
            onCallbackCalled = true;
            onUpdatedGridName = gridName;
            onCellId = cellId;
        };

        Store.on('grid.navigate.focus.off', offCallback);
        Store.on('grid.navigate.focus.on', onCallback);

        const resetCallbacks = function() {
            offCallbackCalled = false;
            offUpdatedGridName = null;
            offCellId = null;
            onCallbackCalled = false;
            onUpdatedGridName = null;
            onCellId = null;
        };

        // start by focusing a cell, without any focused before that
        Actions.focusModuleCell('bar', null, true);

        // leave some time to focus the new node
        setTimeout(function() {
            expect(Store.__private.grids.bar.focusedModuleCellId).toEqual('c1');
            expect(offCallbackCalled).toBe(false);
            expect(onCallbackCalled).toBe(true);
            expect(onUpdatedGridName).toEqual('bar');
            expect(onCellId).toEqual('c1');

            // now focus another node
            resetCallbacks();
            Actions.focusModuleCell('bar', grid.querySelector('#c2'));

            // leave some time to focus the new node
            setTimeout(function() {
                expect(Store.__private.grids.bar.focusedModuleCellId).toEqual('c2');
                expect(offCallbackCalled).toBe(true);
                expect(offUpdatedGridName).toEqual('bar');
                expect(offCellId).toEqual('c1');
                expect(onCallbackCalled).toBe(true);
                expect(onUpdatedGridName).toEqual('bar');
                expect(onCellId).toEqual('c2');

                // and now test navigation
                const tests = [
                    // base-cell, exected top, expected bottom, expected left, expected right
                    ['#c1', undefined, undefined, undefined, '#c2'],
                    ['#c2', undefined, '#c4', '#c1', '#c3'],
                    ['#c3', undefined, '#c6', '#c2', '#c7'],
                    ['#c4', '#c2', undefined, '#c1', '#c5'],
                    ['#c5', '#c2', undefined, '#c4', '#c6'],
                    ['#c6', '#c3', undefined, '#c5', '#c9'],
                    ['#c7', undefined, '#c8', '#c3', undefined],
                    ['#c8', '#c7', '#c9', '#c3', undefined],
                    ['#c9', '#c8', undefined, '#c6', undefined],
                ];

                const finalTests = [];
                for (let numTest = 0; numTest < tests.length; numTest++) {
                    const test = tests[numTest];
                    finalTests.push([test[0], 'Top', test[1]]);
                    finalTests.push([test[0], 'Bottom', test[2]]);
                    finalTests.push([test[0], 'Left', test[3]]);
                    finalTests.push([test[0], 'Right', test[4]]);
                }

                const doTest = function(test) {
                    resetCallbacks();

                    const baseId = test[0].substring(1);
                    Store.__private.grids.bar.focusedModuleCellId = baseId;
                    Actions['focus' + test[1] + 'ModuleCell']('bar');
                    // leave some time to focus the new node
                    setTimeout(function() {
                        // if undefined, the focused didn't change, else we use the target
                        const expectedId = (test[2] || test[0]).substring(1);
                        expect(Store.__private.grids.bar.focusedModuleCellId).toEqual(expectedId, test[1] + ' ' + test[0]);

                        // callbacks are called only if the focused cell changes
                        if (test[2]) {
                            expect(offCallbackCalled).toBe(true);
                            expect(offUpdatedGridName).toEqual('bar');
                            expect(offCellId).toEqual(baseId);
                            expect(onCallbackCalled).toBe(true);
                            expect(onUpdatedGridName).toEqual('bar');
                            expect(onCellId).toEqual(expectedId);
                        } else {
                            expect(offCallbackCalled).toBe(false);
                            expect(onCallbackCalled).toBe(false);
                        }

                        if (!finalTests.length) {
                            // no more test, we are done
                            Store.off('grid.navigate.focus.off', offCallback);
                            Store.off('grid.navigate.focus.on', onCallback);
                            done();
                        } else {
                            // continue on the next available test
                            doTest(finalTests.shift());
                        }
                    }, 0.01);
                };

                doTest(finalTests.shift());
            }, 0.01);
        }, 0.01);

    });

});
