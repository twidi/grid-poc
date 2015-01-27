var _ = require('lodash');
var jasmineReact = require('jasmine-react-helpers');
var React = require('react/addons');  // react + addons
var TestUtils = React.addons.TestUtils;

var Actions = require('../../../app/Grid/Actions.js');
var Manipulator = require('../../../app/Grid/Manipulator.js');
var Store = require('../../../app/Grid/Store.js');

var MainGrid = require('../../../app/Grid/Components/MainGrid.jsx');
var Row = require('../../../app/Grid/Components/Row.jsx');

var componentUtils = require('./Utils.js');
var TestDocumentEventsMixin = require('../../Utils/ReactMixins/DocumentEvents.js');
var Utils = require('../../Utils.js');


describe("Grid.Components.MainGrid", function() {
    var uniqueIdMock;

    // main grid defined in beforeEach
    var testGrid;

    beforeEach(function(done) {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        uniqueIdMock = Utils.mockUniqueId();

        // reset the modules cache for every test
        componentUtils.clearModulesCache();

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();

        setTimeout(done, 0.01);
    });

    afterEach(function() {
        componentUtils.unmountAllComponents();
    });

    it("should manage document events", function(done) {
        var grid = Store.getGrid('Test grid');
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);
        TestDocumentEventsMixin(component, done);
    });

    it("should have a grid", function() {
        var grid = Store.getGrid('Test grid');
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.props.node).toBe(testGrid);
    });

    it("should have a grid name", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.state.gridName).toEqual('Test grid');
    });

    it("should access its own grid as the main grid", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getGrid()).toBe(testGrid);
    });

    it("should get its id", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getNodeId()).toBe(testGrid.getAttribute('id'));
    });

    it("should get the main grid name", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getGridName()).toEqual('Test grid');
    });

    it("should get the design mode step", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getDesignModeStep()).toEqual('disabled');

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.getDesignModeStep()).toEqual('enabled');
    });

    it("should know if it's in design mode", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.isInDesignMode()).toBe(false);

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.isInDesignMode()).toBe(true);
    });

    it("should be able to get its grid rows", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);
        var rows =component.getRows();
        var expectedRows = _.toArray(testGrid.querySelectorAll(':scope > content > rows'));
        expect(rows).toEqual(expectedRows);
    });

    it("should render a grid", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);
        var domNode = component.getDOMNode();
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-container')).toBe(true);
        expect(domNode.classList.contains('grid-container-design-mode')).toBe(false);
        expect(domNode.classList.contains('grid-container-with-placeholders')).toBe(false);
        expect(domNode.childNodes.length).toEqual(2);
        var navDomNode = domNode.childNodes[0];
        expect(navDomNode.tagName).toEqual('NAV');
        expect(navDomNode.classList.contains('grid-toolbar')).toBe(true);
        var gridDomNode = domNode.childNodes[1];
        expect(gridDomNode.classList.contains('grid')).toBe(true);
        expect(gridDomNode.classList.contains('grid-main')).toBe(true);
        expect(gridDomNode.classList.contains('grid-last-level-with-placeholders')).toBe(false);
    });

    it("should be able to render its rows", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);
        var rows = component.renderRows();
        expect(rows.length).toEqual(2);
        _(rows).forEach(function(row) {
            expect(TestUtils.isElementOfType(row, Row)).toBe(true);
        });
    });

    it("should render sub components", function() {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);
        expect(componentUtils.countRows(component)).toEqual(4);
        expect(componentUtils.countModules(component)).toEqual(6);
        expect(componentUtils.countSubGrids(component)).toEqual(1);
    });

    it("should change when toggling design mode", function(done) {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);
        var domNode = component.getDOMNode();
        expect(domNode.classList.contains('grid-container-design-mode')).toBe(false);
        expect(domNode.classList.contains('grid-container-with-placeholders')).toBe(false);

        spyOn(component, 'forceUpdate').and.callThrough();
        component.toggleDesignMode();

        // give some time to re-render
        setTimeout(function() {
            expect(component.forceUpdate).toHaveBeenCalled();
            expect(component.forceUpdate.calls.count()).toEqual(1);

            var domNode = component.getDOMNode();
            expect(domNode.classList.contains('grid-container-design-mode')).toBe(true);
            expect(domNode.classList.contains('grid-container-with-placeholders')).toBe(false);

            // should still have the same number of sub components
            expect(componentUtils.countRows(component)).toEqual(4);
            expect(componentUtils.countModules(component)).toEqual(6);
            expect(componentUtils.countSubGrids(component)).toEqual(1);

            done();
        }, 0.01);
    });

    it("should have placeholders when going in dragging mode", function(done) {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getDOMNode().classList.contains('grid-container-design-mode')).toBe(false);

        component.toggleDesignMode();

        // give some time to re-render
        setTimeout(function() {

            spyOn(component, 'forceUpdate').and.callThrough();

            // simulate going to dragging mode
            Store.__private.changeDesignModeStep('Test grid', 'dragging');
            Store.__private.emit('grid.designMode.dragging.start', 'Test grid');

            // give some time to re-render
            setTimeout(function() {
                expect(component.forceUpdate).toHaveBeenCalled();
                expect(component.forceUpdate.calls.count()).toEqual(1);

                var domNode = component.getDOMNode();
                expect(domNode.classList.contains('grid-container-design-mode')).toBe(true);
                expect(domNode.classList.contains('grid-container-with-placeholders')).toBe(true);

                // should have placeholders
                // 4 (before each row) + 2 (end of each grid) + 6 ("module") * 2 (per module) + 2 (wrap maingrid) + 2 (wrap subgrid)
                expect(componentUtils.countRowPlaceholders(component)).toEqual(22);
                // 6 (1 for each rowPH except module) + 7 (before each cell) + 4 (end of each row) + 6 ("module") * 4 (per module) +  2 (wrap maingrid) + 2 (wrap subgrid)
                expect(componentUtils.countCellPlaceholders(component)).toEqual(45);

                // should have more components, as modules are wrapped in subgrids
                // 4 original rows + 22 placeholders + 6 ("module") * 1 (per module) + 1 (wrap maingrid) + 1 (wrap subgrid)
                expect(componentUtils.countRows(component)).toEqual(34);
                // 6 original modules
                expect(componentUtils.countModules(component)).toEqual(6);
                // 1 wrap arround main grid 1 original + 1 wrap arround original + 6 ("module") * 1 (per module)
                expect(componentUtils.countSubGrids(component)).toEqual(9);

                done();
            }, 0.01);

        }, 0.01);
    });

    it("should start/stop listening to dragover/drop event on the document when entering/exiting design mode", function(done) {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);

        spyOn(component, 'addDocumentListener').and.returnValue(true);
        spyOn(component, 'removeDocumentListener').and.returnValue(true);

        Store.__private.enterDesignMode('Test grid');

        // leave time for the designMode.enter to be catched
        setTimeout(function() {
            expect(component.addDocumentListener.calls.count()).toBe(2);
            expect(component.addDocumentListener.calls.first().args).toEqual(['dragover', 'onDocumentDragOver']);
            expect(component.addDocumentListener.calls.mostRecent().args).toEqual(['drop', 'onDocumentDrop']);

            Store.__private.exitDesignMode('Test grid');

            // leave time for the designMode.exit to be catched
            setTimeout(function() {
                expect(component.removeDocumentListener.calls.count()).toBe(2);
                expect(component.removeDocumentListener.calls.first().args).toEqual(['drop', 'onDocumentDrop']);
                expect(component.removeDocumentListener.calls.mostRecent().args).toEqual(['dragover', 'onDocumentDragOver']);

                // tell jasmine we're done
                done();

            }, 0.01);
        }, 0.01);
    });

    it("should activate/deactivate drop detection when dragging start/stop (or drop occurs)", function(done) {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);

        spyOn(component, 'activateDropDetection').and.callThrough();
        spyOn(component, 'deactivateDropDetection').and.callThrough();

        Store.__private.enterDesignMode('Test grid');

        // first shot with start drag + cancel drag
        Store.__private.startDragging('Test grid', testGrid.querySelector('cells[type=module]'));

        // leave time for the designMode.dragging.start to be catched
        setTimeout(function() {
            expect(component.activateDropDetection.calls.count()).toEqual(1);

            Store.__private.cancelDragging('Test grid');

            // leave time for the designMode.dragging.stop to be catched
            setTimeout(function() {
                expect(component.deactivateDropDetection.calls.count()).toEqual(1);

                // now second show sith start drag + drop
                component.activateDropDetection.calls.reset();
                component.deactivateDropDetection.calls.reset();
                Store.__private.startDragging('Test grid', testGrid.querySelector('cells[type=module]'));

                // leave time for the designMode.dragging.start to be catched
                setTimeout(function() {
                    expect(component.activateDropDetection.calls.count()).toEqual(1);

                    Store.__private.drop('Test grid');

                    // leave time for the designMode.drop to be catched
                    setTimeout(function() {
                        expect(component.deactivateDropDetection.calls.count()).toEqual(1);

                        // tell jasmine we're done
                        done();
                    }, 0.01);

                }, 0.01);
            }, 0.01);

        }, 0.01);

    });

    it("should dispatch fakedragend event when dragging stops or drop occurs", function(done) {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);

        var fakeDragEndCalled = 0;
        var fakeDragEndCallback = function() {
            fakeDragEndCalled++;
        };

        spyOn(component, 'emitFakeDragEnd').and.callThrough();

        document.addEventListener('fakedragend', fakeDragEndCallback);

        // simulate grid in dragging mode
        Store.__private.enterDesignMode('Test grid');
        Store.__private.startDragging('Test grid', Store.getGrid('Test grid').querySelector('cells[type=module]'));

        // simulate a stopped drag (mouse button release)
        Store.__private.cancelDragging('Test grid');

        // leave time for event to propagate
        setTimeout(function() {
            expect(component.emitFakeDragEnd.calls.count()).toEqual(1);
            expect(fakeDragEndCalled).toEqual(1);

            // go back in dragging mode
            Store.__private.startDragging('Test grid', Store.getGrid('Test grid').querySelector('cells[type=module]'));

            // then simulate a drop
            Store.__private.drop('Test grid');

            // leave time for event to propagate
            setTimeout(function() {
                expect(component.emitFakeDragEnd.calls.count()).toEqual(2);
                expect(fakeDragEndCalled).toEqual(2);

                // go back in dragging mode
                Store.__private.startDragging('Test grid', Store.getGrid('Test grid').querySelector('cells[type=module]'));

                // then simulate a drop on a placeholder
                Store.__private.drop('Test grid', Store.getGrid('Test grid').querySelector('cells[type=placeholder]'));

                // leave time for event to propagate
                setTimeout(function() {
                    expect(component.emitFakeDragEnd.calls.count()).toEqual(3);
                    expect(fakeDragEndCalled).toEqual(3);

                    document.removeEventListener('fakedragend', fakeDragEndCallback);
                    // tell jasmine we're done
                    done();
                }, 0.01);
            }, 0.01);
        }, 0.01);

    });

    it("should react to a mouse move/down event as drop if dragging mode is enabled", function(done) {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);

        // we need the node to be attached to the document for bubbling
        var domNode = component.getDOMNode();
        domNode.parentNode.style.display = 'none';
        document.body.appendChild(domNode.parentNode);

        // when fake drop is on a placeholder
        spyOn(component, 'emitFakeDrop').and.returnValue(true);
        // when fake drop is NOT on a placeholder
        spyOn(component, 'applyDrop').and.returnValue(true);

        // simulate grid in dragging mode
        Store.__private.enterDesignMode('Test grid');
        Store.__private.startDragging('Test grid', Store.getGrid('Test grid').querySelector('cells[type=module]'));

        // leave time to let the start drag events to propagate
        setTimeout(function() {

            // simulate a mousemove on the document
            document.dispatchEvent(new Event('mousemove', {view: window, bubbles: true}));

            // leave time to mousemove event to propagate
            setTimeout(function() {

                // method used if fake drop not on a placeholder should be called
                expect(component.applyDrop.calls.count()).toEqual(1);

                // simulate a mousemdown on the document
                document.dispatchEvent(new Event('mousedown', {view: window, bubbles: true}));

                // leave time to mousedown event to propagate
                setTimeout(function() {

                    // method used if fake drop not on a placeholder should be called
                    expect(component.applyDrop.calls.count()).toEqual(2);

                    // get the placeholder to use to simulate events on it
                    var placeholderDomNode = domNode.querySelector('.grid-cell-placeholder');

                    // simulate a mousemove on the placeholder
                    placeholderDomNode.dispatchEvent(new Event('mousemove', {view: window, bubbles: true}));

                    // leave time to mousemove event to propagate
                    setTimeout(function() {

                        // method used if fake drop on a placeholder should be called
                        expect(component.emitFakeDrop.calls.count()).toEqual(1);
                        expect(component.emitFakeDrop.calls.first().args).toEqual([placeholderDomNode]);

                        // simulate a mousemdown on the placeholder
                        placeholderDomNode.dispatchEvent(new Event('mousedown', {view: window, bubbles: true}));

                        // leave time to mousedown event to propagate
                        setTimeout(function() {

                            // method used if fake drop not on a placeholder should be called
                            expect(component.emitFakeDrop.calls.count()).toEqual(2);
                            expect(component.emitFakeDrop.calls.mostRecent().args).toEqual([placeholderDomNode]);

                            // we're done, remove the component from the dom
                            document.body.removeChild(domNode.parentNode);

                            // tell jasmine we're done
                            done();

                        }, 0.01);
                    }, 0.01);
                }, 0.01);
            }, 0.01);
        }, 0.01);
    });

    it("should apply a fake drop event if a drop detected by a mouse move/down event occurs on a placeholder", function(done) {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);

        // we need the node to be attached to the document for bubbling
        var domNode = component.getDOMNode();
        domNode.parentNode.style.display = 'none';
        document.body.appendChild(domNode.parentNode);

        // will set this to True when the callback is called
        var callbackCalled = false;
        // will store the grid name received via the tested event
        var updatedGridName;

        var callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // simulate grid in dragging mode
        Store.__private.enterDesignMode('Test grid');
        Store.__private.startDragging('Test grid', Store.getGrid('Test grid').querySelector('cells[type=module]'));

        // leave time to let the start drag events to propagate
        setTimeout(function() {

            // get the placeholder to use to simulate events on it
            // we get the node from the grid and one from the dom, using the fact that `querySelector`
            // will always return the first in the tree, and both tree are similars
            var placeholder = Store.getGrid('Test grid').querySelector('cells[type=placeholder]');
            var placeholderDomNode = domNode.querySelector('.grid-cell-placeholder');

            var draggedCell = Store.__private.grids['Test grid'].nodes.dragging;

            // listen that the design mode drop event is fired at the end
            Store.on('grid.designMode.drop', callback);

            // we'll catch some function calls to be sure that everything happens correctly

            // we ask the store to drop
            spyOn(Actions, 'drop').and.callThrough();
            // as we didn't hover before, the drop method will force the hover
            spyOn(Store.__private, 'startHovering').and.callThrough();
            // and the dragged cell will me moved on the placeholder (effective drop)
            spyOn(Manipulator, 'moveContentToPlaceholder').and.callThrough();

            // simulate a fake drop on the placeholder
            component.emitFakeDrop(placeholderDomNode);

            setTimeout(function() {
                Store.off('grid.designMode.drop', callback);

                expect(callbackCalled).toBe(true);
                expect(updatedGridName).toBe('Test grid');

                expect(Actions.drop.calls.count()).toEqual(1);
                expect(Actions.drop.calls.first().args).toEqual(['Test grid', placeholder]);

                expect(Store.__private.startHovering.calls.count()).toEqual(1);
                expect(Store.__private.startHovering.calls.first().args).toEqual(['Test grid', placeholder]);

                expect(Manipulator.moveContentToPlaceholder.calls.count()).toEqual(1);
                expect(Manipulator.moveContentToPlaceholder.calls.first().args).toEqual([draggedCell, placeholder]);

                // we're done, remove the component from the dom
                document.body.removeChild(domNode.parentNode);

                // tell jasmine we're done
                done();

            }, 0.01);
        }, 0.01);
    });

    it("should apply drop on (real or fake) drop detected not on a placeholder", function(done) {
        var element = React.createElement(MainGrid, {node: testGrid});
        var component = componentUtils.renderIntoDocument(element);

        // we need the node to be attached to the document for bubbling
        var domNode = component.getDOMNode();
        domNode.parentNode.style.display = 'none';
        document.body.appendChild(domNode.parentNode);

        // will set this to True when the callbacks are called
        var callbackDropCalled = false;
        var callbackStopCalled = false;
        // will store the grid name received via the tested events
        var updatedDropGridName;
        var updatedStopGridName;

        var callbackDrop = function(gridName) {
            callbackDropCalled = true;
            updatedDropGridName = gridName;
        };

        var callbackStop = function(gridName) {
            callbackStopCalled = true;
            updatedStopGridName = gridName;
        };

        // simulate grid in dragging mode
        Store.__private.enterDesignMode('Test grid');
        Store.__private.startDragging('Test grid', Store.getGrid('Test grid').querySelector('cells[type=module]'));

        // leave time to let the start drag events to propagate
        setTimeout(function() {

            var draggedCell = Store.__private.grids['Test grid'].nodes.dragging;

            // listen that the design mode drop event is fired at the end
            Store.on('grid.designMode.drop', callbackDrop);
            Store.on('grid.designMode.dragging.stop', callbackStop);

            // we'll catch some function calls to be sure that everything happens correctly

            // we ask the store to drop
            spyOn(Actions, 'drop').and.callThrough();
            // as we didn't hover before, the drop method will force the hover
            spyOn(Store.__private, 'cancelDragging').and.callThrough();

            // simulate a fake drop on the placeholder
            component.applyDrop();

            setTimeout(function() {
                Store.off('grid.designMode.drop', callbackDrop);
                Store.off('grid.designMode.dragging.stop', callbackStop);

                expect(callbackDropCalled).toBe(false);
                expect(updatedDropGridName).toBe(undefined);

                expect(callbackStopCalled).toBe(true);
                expect(updatedStopGridName).toBe('Test grid');

                expect(Actions.drop.calls.count()).toEqual(1);
                expect(Actions.drop.calls.first().args).toEqual(['Test grid']);

                expect(Store.__private.cancelDragging.calls.count()).toEqual(1);
                expect(Store.__private.cancelDragging.calls.first().args).toEqual(['Test grid']);

                // we're done, remove the component from the dom
                document.body.removeChild(domNode.parentNode);

                // tell jasmine we're done
                done();

            }, 0.01);
        }, 0.01);
    });

});
