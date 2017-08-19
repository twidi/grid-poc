import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import jasmineReact from 'jasmine-react-helpers';
import Mousetrap from 'br-mousetrap';
import Hammer from 'hammerjs';

import { Actions } from '../../../app/Grid/Actions';
import { Manipulator } from '../../../app/Grid/Manipulator';
import { Store } from '../../../app/Grid/Store';

import { MainGrid, screenModes } from '../../../app/Grid/Components/MainGrid';
import { Row } from '../../../app/Grid/Components/Row';

import { componentUtils } from './Utils';
import { TestDocumentEventsMixin } from '../../Utils/ReactMixins/DocumentEvents';
import { Utils } from '../../Utils';


describe('Grid.Components.MainGrid', () => {

    // main grid defined in beforeEach
    let testGrid;

    beforeEach((done) => {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        Utils.mockUniqueId();

        // reset the modules cache for every test
        componentUtils.clearModulesCache();

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();

        setTimeout(done, 0.01);
    });

    afterEach(() => {
        componentUtils.unmountAllComponents();
    });

    it('should manage document events', (done) => {
        Store.getGrid('Test grid');
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);
        TestDocumentEventsMixin(component, done);
    });

    it('should have a grid', () => {
        Store.getGrid('Test grid');
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.props.node).toBe(testGrid);
    });

    it('should have a grid name', () => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.state.gridName).toEqual('Test grid');
    });

    it('should access its own grid as the main grid', () => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getGrid()).toBe(testGrid);
    });

    it('should get its id', () => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getNodeId()).toBe(testGrid.getAttribute('id'));
    });

    it('should get the main grid name', () => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getGridName()).toEqual('Test grid');
    });

    it('should get the design mode step', () => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getDesignModeStep()).toEqual('disabled');

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.getDesignModeStep()).toEqual('enabled');
    });

    it('should know if it\'s in design mode', () => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.isInDesignMode()).toBe(false);

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.isInDesignMode()).toBe(true);
    });

    it('should be able to get its grid rows if no resizers', () => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);
        const rows = component.getRows();
        const expectedRows = _.toArray(testGrid.querySelectorAll(':scope > content > row, :scope > content > resizer'));
        expect(rows).toEqual(expectedRows);
        expect(rows.length).toEqual(2);
        expect(rows[0].tagName).toEqual('row');
        expect(rows[1].tagName).toEqual('row');
    });

    it('should be able to get its grid rows and resizers if any', () => {
        Manipulator.addResizers(testGrid);
        Manipulator.setIds(testGrid);

        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);
        const rows = component.getRows();
        const expectedRows = _.toArray(testGrid.querySelectorAll(':scope > content > row, :scope > content > resizer'));
        expect(rows).toEqual(expectedRows);
        expect(rows.length).toEqual(3);
        expect(rows[0].tagName).toEqual('row');
        expect(rows[1].tagName).toEqual('resizer');
        expect(rows[2].tagName).toEqual('row');
    });


    it('should render a grid', () => {
        const element = React.createElement(MainGrid, { node: testGrid, screenMode: screenModes.multi });
        const component = componentUtils.renderIntoDocument(element);
        const domNode = ReactDOM.findDOMNode(component);
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-component')).toBe(true);
        expect(domNode.classList.contains('grid-component-design-mode')).toBe(false);
        expect(domNode.classList.contains('grid-component-with-placeholders')).toBe(false);
        expect(domNode.classList.contains('grid-component-with-resizers')).toBe(false);
        expect(domNode.childNodes.length).toEqual(2);
        const navDomNode = domNode.children[0];
        expect(navDomNode.tagName).toEqual('NAV');
        expect(navDomNode.classList.contains('grid-toolbar')).toBe(true);
        const gridDomNode = ReactDOM.findDOMNode(component.refs.gridNode);
        expect(gridDomNode.classList.contains('grid')).toBe(true);
        expect(gridDomNode.classList.contains('grid-main')).toBe(true);
        expect(gridDomNode.classList.contains('grid-last-level-with-placeholders')).toBe(false);
        expect(domNode.classList.contains('grid-component-with-resizers')).toBe(false);
        // no specific style defined
        expect(gridDomNode.getAttribute('style')).toBe(null);
    });

    it('should be able to render its rows', () => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);
        const rows = component.renderRows();
        expect(rows.length).toEqual(2);
        _(rows).forEach(row => {
            expect(TestUtils.isElementOfType(row, Row)).toBe(true);
        });
    });

    it('should render sub components', () => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);
        expect(componentUtils.countRows(component)).toEqual(4);
        expect(componentUtils.countModules(component)).toEqual(6);
        expect(componentUtils.countSubGrids(component)).toEqual(1);
    });

    it('should update the grid when a design mode event is triggered', (done) => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);

        spyOn(component, 'forceUpdate').and.returnValue();

        const events = [
            'grid.designMode.enter',
            'grid.designMode.exit',
            'grid.designMode.dragging.start',
            'grid.designMode.dragging.stop',
            'grid.designMode.hovering.start',
            'grid.designMode.hovering.stay',
            'grid.designMode.hovering.stop',
            'grid.designMode.drop',
            'grid.designMode.resizing.start',
            'grid.designMode.resizing.move',
            'grid.designMode.resizing.stop',
            'grid.designMode.module.add',
            'grid.designMode.module.remove',
            'grid.designMode.history.add',
            'grid.designMode.history.back',
            'grid.designMode.history.forward'
        ];

        const notUpdatingEvents = [
            'grid.designMode.resizing.move'
        ];

        const testNextEvent = () => {
            const event = events.shift();
            if (!event) {
                // no more event, tell jasmine we're done, and exit
                done();
                return;
            }
            component.forceUpdate.calls.reset();
            Store.__private.emit(event, 'Test grid');
            setTimeout(() => {
                if (_.includes(notUpdatingEvents, event)) {
                    expect(component.forceUpdate).not.toHaveBeenCalled();
                } else {
                    expect(component.forceUpdate).toHaveBeenCalled();
                }
                testNextEvent();
            }, 0.01);
        };

        testNextEvent();

    });

    it('should change when toggling design mode, managing resizers', (done) => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);
        let domNode = ReactDOM.findDOMNode(component);
        expect(domNode.classList.contains('grid-component-design-mode')).toBe(false);
        expect(domNode.classList.contains('grid-component-with-placeholders')).toBe(false);
        expect(domNode.classList.contains('grid-component-with-resizers')).toBe(false);

        // no resizers at start
        expect(componentUtils.countResizers(component)).toEqual(0);
        expect(componentUtils.countVerticalResizers(component)).toEqual(0);
        expect(componentUtils.countHorizontalResizers(component)).toEqual(0);

        spyOn(component, 'forceUpdate').and.callThrough();
        component.toggleDesignMode();

        // give some time to re-render
        setTimeout(() => {
            expect(component.forceUpdate).toHaveBeenCalled();
            expect(component.forceUpdate.calls.count()).toEqual(1);

            domNode = ReactDOM.findDOMNode(component);
            expect(domNode.classList.contains('grid-component-design-mode')).toBe(true);
            expect(domNode.classList.contains('grid-component-with-placeholders')).toBe(false);
            expect(domNode.classList.contains('grid-component-with-resizers')).toBe(true);

            // should still have the same number of sub components
            expect(componentUtils.countRows(component)).toEqual(4);
            expect(componentUtils.countModules(component)).toEqual(6);
            expect(componentUtils.countSubGrids(component)).toEqual(1);
            // but with some resizers now
            expect(componentUtils.countResizers(component)).toEqual(5);
            expect(componentUtils.countVerticalResizers(component)).toEqual(3);  // 1 group of 2 cells, 1 of 3 => 1 + 2
            expect(componentUtils.countHorizontalResizers(component)).toEqual(2);  // 2 grids of 2 rows => 1+1

            // go back
            component.forceUpdate.calls.reset();
            component.toggleDesignMode();

            // give some time to re-render
            setTimeout(() => {
                expect(component.forceUpdate).toHaveBeenCalled();
                expect(component.forceUpdate.calls.count()).toEqual(1);

                domNode = ReactDOM.findDOMNode(component);
                expect(domNode.classList.contains('grid-component-design-mode')).toBe(false);
                expect(domNode.classList.contains('grid-component-with-placeholders')).toBe(false);
                expect(domNode.classList.contains('grid-component-with-resizers')).toBe(false);

                // should still have the same number of sub components
                expect(componentUtils.countRows(component)).toEqual(4);
                expect(componentUtils.countModules(component)).toEqual(6);
                expect(componentUtils.countSubGrids(component)).toEqual(1);
                // and no resizers anymore
                expect(componentUtils.countResizers(component)).toEqual(0);
                expect(componentUtils.countVerticalResizers(component)).toEqual(0);
                expect(componentUtils.countHorizontalResizers(component)).toEqual(0);

                done();
            }, 0.01);
        }, 0.01);
    });

    it('should have placeholders when going in dragging mode', (done) => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);
        expect(ReactDOM.findDOMNode(component).classList.contains('grid-component-design-mode')).toBe(false);

        component.toggleDesignMode();

        // give some time to re-render
        setTimeout(() => {

            spyOn(component, 'forceUpdate').and.callThrough();

            // simulate going to dragging mode
            Store.__private.changeDesignModeStep('Test grid', 'dragging');
            Store.__private.emit('grid.designMode.dragging.start', 'Test grid');

            // give some time to re-render
            setTimeout(() => {
                expect(component.forceUpdate).toHaveBeenCalled();
                expect(component.forceUpdate.calls.count()).toEqual(1);

                const domNode = ReactDOM.findDOMNode(component);
                expect(domNode.classList.contains('grid-component-design-mode')).toBe(true);
                expect(domNode.classList.contains('grid-component-with-placeholders')).toBe(true);
                expect(domNode.classList.contains('grid-component-with-resizers')).toBe(false);

                // should have placeholders
                // 4 (before each row) + 2 (end of each grid)
                // + 6 ("module") * 2 (per module) + 2 (wrap main grid) + 2 (wrap subgrid)
                expect(componentUtils.countRowPlaceholders(component)).toEqual(22);
                // 6 (1 for each rowPH except module) + 7 (before each cell)
                // + 4 (end of each row) + 6 ("module") * 4 (per module) +  2 (wrap main grid) + 2 (wrap subgrid)
                expect(componentUtils.countCellPlaceholders(component)).toEqual(45);

                // should have more components, as modules are wrapped in subgrids
                // 4 original rows + 22 placeholders + 6 ("module") * 1 (per module)
                // + 1 (wrap main grid) + 1 (wrap subgrid)
                expect(componentUtils.countRows(component)).toEqual(34);
                // 6 original modules
                expect(componentUtils.countModules(component)).toEqual(6);
                // 1 wrap around main grid 1 original + 1 wrap around original + 6 ("module") * 1 (per module)
                expect(componentUtils.countSubGrids(component)).toEqual(9);

                done();
            }, 0.01);

        }, 0.01);
    });

    it('should start/stop listening to dragover/drop event on the document when entering/exiting design mode',
    (done) => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);

        spyOn(component, 'addDocumentListener').and.returnValue(true);
        spyOn(component, 'removeDocumentListener').and.returnValue(true);

        Store.__private.enterDesignMode('Test grid');

        // leave time for the designMode.enter to be caught
        setTimeout(() => {
            expect(component.addDocumentListener.calls.count()).toBe(2);
            expect(component.addDocumentListener.calls.first().args).toEqual(['dragover', 'onDocumentDragOver']);
            expect(component.addDocumentListener.calls.mostRecent().args).toEqual(['drop', 'onDocumentDrop']);

            Store.__private.exitDesignMode('Test grid');

            // leave time for the designMode.exit to be caught
            setTimeout(() => {
                expect(component.removeDocumentListener.calls.count()).toBe(2);
                expect(component.removeDocumentListener.calls.first().args).toEqual(['drop', 'onDocumentDrop']);
                expect(
                    component.removeDocumentListener.calls.mostRecent().args
                ).toEqual(['dragover', 'onDocumentDragOver']);

                // tell jasmine we're done
                done();

            }, 0.01);
        }, 0.01);
    });

    it('should activate/deactivate drop detection when dragging start/stop (or drop occurs)', (done) => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);

        spyOn(component, 'activateDropDetection').and.callThrough();
        spyOn(component, 'deactivateDropDetection').and.callThrough();

        Store.__private.enterDesignMode('Test grid');

        // first shot with start drag + cancel drag
        Store.__private.startDragging('Test grid', testGrid.querySelector('cell[type=module]'));

        // leave time for the designMode.dragging.start to be caught
        setTimeout(() => {
            expect(component.activateDropDetection.calls.count()).toEqual(1);

            Store.__private.cancelDragging('Test grid');

            // leave time for the designMode.dragging.stop to be caught
            setTimeout(() => {
                expect(component.deactivateDropDetection.calls.count()).toEqual(1);

                // now second shot with start drag + drop
                component.activateDropDetection.calls.reset();
                component.deactivateDropDetection.calls.reset();
                Store.__private.startDragging('Test grid', testGrid.querySelector('cell[type=module]'));

                // leave time for the designMode.dragging.start to be caught
                setTimeout(() => {
                    expect(component.activateDropDetection.calls.count()).toEqual(1);

                    Store.__private.drop('Test grid');

                    // leave time for the designMode.drop to be caught
                    setTimeout(() => {
                        expect(component.deactivateDropDetection.calls.count()).toEqual(1);

                        // tell jasmine we're done
                        done();
                    }, 0.01);

                }, 0.01);
            }, 0.01);

        }, 0.01);

    });

    it('should dispatch fakedragend event when dragging stops or drop occurs', (done) => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);

        let fakeDragEndCalled = 0;
        const fakeDragEndCallback = () => {
            fakeDragEndCalled++;
        };

        spyOn(component, 'emitFakeDragEnd').and.callThrough();

        document.addEventListener('fakedragend', fakeDragEndCallback);

        // simulate grid in dragging mode
        Store.__private.enterDesignMode('Test grid');
        Store.__private.startDragging('Test grid', Store.getGrid('Test grid').querySelector('cell[type=module]'));

        // simulate a stopped drag (mouse button release)
        Store.__private.cancelDragging('Test grid');

        // leave time for event to propagate
        setTimeout(() => {
            expect(component.emitFakeDragEnd.calls.count()).toEqual(1);
            expect(fakeDragEndCalled).toEqual(1);

            // go back in dragging mode
            Store.__private.startDragging('Test grid', Store.getGrid('Test grid').querySelector('cell[type=module]'));

            // then simulate a drop
            Store.__private.drop('Test grid');

            // leave time for event to propagate
            setTimeout(() => {
                expect(component.emitFakeDragEnd.calls.count()).toEqual(2);
                expect(fakeDragEndCalled).toEqual(2);

                // go back in dragging mode
                Store.__private.startDragging(
                    'Test grid',
                    Store.getGrid('Test grid').querySelector('cell[type=module]')
                );

                // then simulate a drop on a placeholder
                Store.__private.drop('Test grid', Store.getGrid('Test grid').querySelector('cell[type=placeholder]'));

                // leave time for event to propagate
                setTimeout(() => {
                    expect(component.emitFakeDragEnd.calls.count()).toEqual(3);
                    expect(fakeDragEndCalled).toEqual(3);

                    document.removeEventListener('fakedragend', fakeDragEndCallback);
                    // tell jasmine we're done
                    done();
                }, 0.01);
            }, 0.01);
        }, 0.01);

    });

    it('should react to a mouse move/down event as drop if dragging mode is enabled', (done) => {

        // when fake drop is on a placeholder
        jasmineReact.spyOnClass(MainGrid, 'emitFakeDrop').and.returnValue(true);
        // when fake drop is NOT on a placeholder
        jasmineReact.spyOnClass(MainGrid, 'applyDrop').and.returnValue(true);

        const mainGridProto = jasmineReact.classPrototype(MainGrid);

        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);

        // we need the node to be attached to the document for bubbling
        const domNode = ReactDOM.findDOMNode(component);
        domNode.parentNode.style.display = 'none';
        document.body.appendChild(domNode.parentNode);

        // simulate grid in dragging mode
        Store.__private.enterDesignMode('Test grid');
        const moduleCell = Store.getGrid('Test grid').querySelector('cell[type=module]');

        const startDraggingAndWait = (func) => {
            Store.__private.startDragging('Test grid', moduleCell);
            setTimeout(func, 400);
        };

        const triggerEventAndWait = (node, eventType, func) => {
            if (node) {
                node.dispatchEvent(new Event(eventType, { view: window, bubbles: true }));
            }
            setTimeout(func, 0.01);
        };

        const checkCall = (funcName, count, mostRecentArgs) => {
            const realCount = mainGridProto[funcName].calls.count();
            expect(realCount).toEqual(count);
            if (mostRecentArgs && count && realCount === count) {
                expect(mainGridProto[funcName].calls.mostRecent().args).toEqual(mostRecentArgs);
            }
        };

        startDraggingAndWait(() => {

            triggerEventAndWait(document, 'mousemove', () => {

                checkCall('applyDrop', 1);

                triggerEventAndWait(document, 'mousemove', () => {

                    checkCall('applyDrop', 2);

                    const placeholderDomNode = domNode.querySelector('.grid-cell-placeholder');
                    expect(placeholderDomNode).not.toBe(null);

                    triggerEventAndWait(placeholderDomNode, 'mousemove', () => {

                        checkCall('emitFakeDrop', 1, [placeholderDomNode]);

                        triggerEventAndWait(placeholderDomNode, 'mousemove', () => {

                            checkCall('emitFakeDrop', 2, [placeholderDomNode]);

                            // we're done, remove the component from the dom
                            document.body.removeChild(domNode.parentNode);
                            //  tell jasmine we're done
                            done();

                        });
                    });
                });
            });
        });
    });

    it('should apply a fake drop event if a drop detected by a mouse move/down event occurs on a placeholder',
    (done) => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);

        // we need the node to be attached to the document for bubbling
        const domNode = ReactDOM.findDOMNode(component);
        domNode.parentNode.style.display = 'none';
        document.body.appendChild(domNode.parentNode);

        // will set this to True when the callback is called
        let callbackCalled = false;
        // will store the grid name received via the tested event
        let updatedGridName;

        const callback = gridName => {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // simulate grid in dragging mode
        Store.__private.enterDesignMode('Test grid');
        Store.__private.startDragging('Test grid', Store.getGrid('Test grid').querySelector('cell[type=module]'));

        // leave time to let the start drag events to propagate
        setTimeout(() => {

            // get the placeholder to use to simulate events on it
            // we get the node from the grid and one from the dom, using the fact that `querySelector`
            // will always return the first in the tree, and both tree are similar
            const placeholder = Store.getGrid('Test grid').querySelector('cell[type=placeholder]');
            const placeholderDomNode = domNode.querySelector('.grid-cell-placeholder');

            const draggedCell = Store.__private.grids['Test grid'].nodes.dragging;

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

            setTimeout(() => {
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

    it('should apply drop on (real or fake) drop detected not on a placeholder', (done) => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);

        // we need the node to be attached to the document for bubbling
        const domNode = ReactDOM.findDOMNode(component);
        domNode.parentNode.style.display = 'none';
        document.body.appendChild(domNode.parentNode);

        // will set this to True when the callbacks are called
        let callbackDropCalled = false;
        let callbackStopCalled = false;
        // will store the grid name received via the tested events
        let updatedDropGridName;
        let updatedStopGridName;

        const callbackDrop = gridName => {
            callbackDropCalled = true;
            updatedDropGridName = gridName;
        };

        const callbackStop = gridName => {
            callbackStopCalled = true;
            updatedStopGridName = gridName;
        };

        // simulate grid in dragging mode
        Store.__private.enterDesignMode('Test grid');
        Store.__private.startDragging('Test grid', Store.getGrid('Test grid').querySelector('cell[type=module]'));

        // leave time to let the start drag events to propagate
        setTimeout(() => {

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

            setTimeout(() => {
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

    it('should activate grid navigation when mounting', () => {
        jasmineReact.spyOnClass(MainGrid, 'activateGridNavigation').and.callThrough();

        const element = React.createElement(MainGrid, { node: testGrid });
        componentUtils.renderIntoDocument(element);

        expect(jasmineReact.classPrototype(MainGrid).activateGridNavigation.calls.count()).toEqual(1);
    });

    it('should deactivate/reactivate grid navigation when entering/exiting design mode', (done) => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);

        spyOn(component, 'activateGridNavigation').and.callThrough();
        spyOn(component, 'deactivateGridNavigation').and.callThrough();

        Store.__private.enterDesignMode('Test grid');

        // leave time for the designMode.enter to be caught
        setTimeout(() => {
            expect(component.deactivateGridNavigation.calls.count()).toBe(1);

            Store.__private.exitDesignMode('Test grid');

            // leave time for the designMode.exit to be caught
            setTimeout(() => {
                expect(component.activateGridNavigation.calls.count()).toBe(1);

                // tell jasmine we're done
                done();

            }, 0.01);
        }, 0.01);
    });

    it('should activate/deactivate 4 shortcuts for keyboard navigation', () => {
        const element = React.createElement(MainGrid, { node: testGrid });
        const component = componentUtils.renderIntoDocument(element);

        spyOn(component, 'bindShortcut').and.callThrough();
        spyOn(component, 'unbindShortcut').and.callThrough();

        component.deactivateGridNavigation();
        expect(component.bindShortcut.calls.count()).toBe(0);
        expect(component.unbindShortcut.calls.count()).toBe(4);
        expect(component.unbindShortcut.calls.allArgs()).toEqual([
            ['ctrl+right'],
            ['ctrl+left'],
            ['ctrl+down'],
            ['ctrl+up']
        ]);

        component.activateGridNavigation();
        expect(component.unbindShortcut.calls.count()).toBe(4); // the same
        expect(component.bindShortcut.calls.count()).toBe(4);
        expect(component.bindShortcut.calls.allArgs()).toEqual([
            ['ctrl+right', component.focusRightModuleCell],
            ['ctrl+left', component.focusLeftModuleCell],
            ['ctrl+down', component.focusBottomModuleCell],
            ['ctrl+up', component.focusTopModuleCell]
        ]);
    });

    it('should navigate through module cells', () => {

        const directions = {
            right: 'Right',
            left: 'Left',
            up: 'Top',
            down: 'Bottom'
        };

        let method;

        for (const dir1 in directions) {
            if (directions.hasOwnProperty(dir1)) {
                method = `focus${directions[dir1]}ModuleCell`;
                jasmineReact.spyOnClass(MainGrid, method).and.callThrough();
                spyOn(Actions, method).and.returnValue();
            }
        }

        const mainGridProto = jasmineReact.classPrototype(MainGrid);

        const element = React.createElement(MainGrid, { node: testGrid });
        componentUtils.renderIntoDocument(element);

        for (const dir1 in directions) {
            if (directions.hasOwnProperty(dir1)) {
                // reset spies counters
                for (const dir2 in directions) {
                    if (directions.hasOwnProperty(dir2)) {
                        method = `focus${directions[dir2]}ModuleCell`;
                        mainGridProto[method].calls.reset();
                        Actions[method].calls.reset();
                    }
                }

                // trigger the action
                Mousetrap.trigger(`ctrl+${dir1}`);

                // check calls
                for (const dir2 in directions) {
                    if (directions.hasOwnProperty(dir2)) {
                        method = `focus${directions[dir2]}ModuleCell`;
                        const expected = dir1 === dir2 ? 1 : 0;
                        expect(
                            mainGridProto[method].calls.count()
                        ).toEqual(expected, `ctrl+${dir1}, component.${method}`);
                        expect(
                            Actions[method].calls.count()
                        ).toEqual(expected, `ctrl+${dir1}, action.${method}`);
                    }
                }
            }
        }
    });

    it('should stay in one screen mode if screenMode set to `one`', (done) => {
        const element = React.createElement(MainGrid, { node: testGrid, screenMode: screenModes.one });
        const component = componentUtils.renderIntoDocument(element);
        setTimeout(() => {
            expect(component.state.oneScreenMode).toBe(true);
            component.onResize(10000, 10000);
            setTimeout(() => {
                expect(component.state.oneScreenMode).toBe(true);
                component.onResize(100, 100);
                setTimeout(() => {
                    expect(component.state.oneScreenMode).toBe(true);
                    done();
                }, 0.01);
            }, 0.01);
        }, 0.01);
    });

    it('should avoid one screen mode if screenMode set to `multi`', (done) => {
        const element = React.createElement(MainGrid, { node: testGrid, screenMode: screenModes.multi });
        const component = componentUtils.renderIntoDocument(element);
        setTimeout(() => {
            expect(component.state.oneScreenMode).toBe(false);
            component.onResize(10000, 10000);
            setTimeout(() => {
                expect(component.state.oneScreenMode).toBe(false);
                component.onResize(100, 100);
                setTimeout(() => {
                    expect(component.state.oneScreenMode).toBe(false);
                    done();
                }, 0.01);
            }, 0.01);
        }, 0.01);
    });

    it('should change from and to one screen mode if screenMode set to `default` depending of the size', (done) => {
        const element = React.createElement(MainGrid, { node: testGrid, screenMode: screenModes.default });
        const component = componentUtils.renderIntoDocument(element);
        setTimeout(() => {
            component.onResize(10000, 10000);
            setTimeout(() => {
                expect(component.state.oneScreenMode).toBe(false);
                component.onResize(100, 100);
                setTimeout(() => {
                    expect(component.state.oneScreenMode).toBe(true);
                    done();
                }, 0.01);
            }, 0.01);
        }, 0.01);
    });

    it('should call `onResize` if screenMode set to `default` and the grid size changes', (done) => {
        const element = React.createElement(MainGrid, {
            node: testGrid,
            screenMode: screenModes.default,
            oneScreenWidthThreshold: 100,
            oneScreenHeightThreshold: 400
        });
        const component = componentUtils.renderIntoDocument(element);

        const domNode = ReactDOM.findDOMNode(component);
        // we need the node to be attached to the document to have a size
        domNode.parentNode.style.visibility = 'hidden'; // hide it to avoid visual flashes
        document.body.appendChild(domNode.parentNode);

        // minimal required style for resize-detector
        domNode.style.position = 'relative';

        // both bigger than threshold => multi screens mode
        domNode.style.width = '200px';
        domNode.style.height = '500px';
        component.refs.resizeDetector.handleScroll();
        setTimeout(() => {
            expect(component.state.oneScreenMode).toBe(false);

            // width smaller than threshold and height bigger => one screen mode
            domNode.style.width = '50px';
            component.refs.resizeDetector.handleScroll();
            setTimeout(() => {
                expect(component.state.oneScreenMode).toBe(true);

                // both exactly threshold => multi screens mode
                domNode.style.width = '100px';
                domNode.style.height = '400px';
                component.refs.resizeDetector.handleScroll();
                setTimeout(() => {
                    expect(component.state.oneScreenMode).toBe(false);

                    // width exactly threshold and height smaller => one screen mode
                    domNode.style.height = '300px';
                    component.refs.resizeDetector.handleScroll();
                    setTimeout(() => {
                        expect(component.state.oneScreenMode).toBe(true);

                        // clean dom
                        domNode.parentNode.style.visibility = null;
                        document.body.removeChild(domNode.parentNode);

                        // tell jasmine we're done
                        done();

                    }, 0.01);
                }, 0.01);
            }, 0.01);
        }, 0.01);

    });

    it('should not have transform style in multi screens mode', (done) => {
        const element = React.createElement(MainGrid, { node: testGrid, screenMode: screenModes.multi });
        const component = componentUtils.renderIntoDocument(element);
        const gridNode = ReactDOM.findDOMNode(component).querySelector('.grid-main');

        expect(component.getMainGridStyle()).toEqual({
            transform: null,
            transition: null
        });
        component.updateMainGridStyle();
        setTimeout(() => {
            expect(gridNode.style.transform).toEqual('');
            expect(gridNode.style.transition).toEqual('');

            expect(component.getMainGridStyle('0px')).toEqual({
                transform: null,
                transition: null
            });
            component.updateMainGridStyle();
            setTimeout(() => {
                expect(gridNode.style.transform).toEqual('');
                expect(gridNode.style.transition).toEqual('');

                expect(component.getMainGridStyle('100px')).toEqual({
                    transform: null,
                    transition: null
                });
                component.updateMainGridStyle();
                setTimeout(() => {
                    expect(gridNode.style.transform).toEqual('');
                    expect(gridNode.style.transition).toEqual('');

                    done();
                }, 0.01);
            }, 0.01);
        }, 0.01);
    });

    it('should have transform style in one screen mode', (done) => {
        const element = React.createElement(MainGrid, { node: testGrid, screenMode: screenModes.one });
        const component = componentUtils.renderIntoDocument(element);
        const gridNode = ReactDOM.findDOMNode(component).querySelector('.grid-main');

        // cell index is 0

        // test without deltaX
        expect(component.getMainGridStyle()).toEqual({
            transform: 'translateX(0px)',
            transition: null
        });
        component.updateMainGridStyle();
        setTimeout(() => {
            expect(gridNode.style.transform).toEqual('translateX(0px)');
            expect(gridNode.style.transition).toEqual('');

            // test with deltaX == 0
            expect(component.getMainGridStyle('0px')).toEqual({
                transform: 'translateX(0px)',
                transition: 'none'
            });
            component.updateMainGridStyle('0px');
            setTimeout(() => {
                expect(gridNode.style.transform).toEqual('translateX(0px)');
                expect(gridNode.style.transition).toEqual('none');

                // test with deltaX > 0
                expect(component.getMainGridStyle('150px')).toEqual({
                    transform: 'translateX(150px)',
                    transition: 'none'
                });
                component.updateMainGridStyle('150px');
                setTimeout(() => {
                    expect(gridNode.style.transform).toEqual('translateX(150px)');
                    expect(gridNode.style.transition).toEqual('none');

                    // go to index 2
                    Store.__private.focusNextModuleCellByIndex('Test grid', 2);

                    // test without deltaX
                    expect(component.getMainGridStyle()).toEqual({
                        transform: 'translateX(-200vw)',
                        transition: null
                    });
                    component.updateMainGridStyle();
                    setTimeout(() => {
                        expect(gridNode.style.transform).toEqual('translateX(-200vw)');
                        expect(gridNode.style.transition).toEqual('');

                        // test with deltaX == 0
                        expect(component.getMainGridStyle('0px')).toEqual({
                            transform: 'translateX(-200vw)',
                            transition: 'none'
                        });
                        component.updateMainGridStyle('0px');
                        setTimeout(() => {
                            expect(gridNode.style.transform).toEqual('translateX(-200vw)');
                            expect(gridNode.style.transition).toEqual('none');

                            // test with deltaX > 0
                            expect(component.getMainGridStyle('150px')).toEqual({
                                transform: 'translateX(calc(-200vw + 150px))',
                                transition: 'none'
                            });
                            component.updateMainGridStyle('150px');
                            setTimeout(() => {
                                expect(gridNode.style.transform).toEqual('translateX(calc(-200vw + 150px))');
                                expect(gridNode.style.transition).toEqual('none');

                                done();
                            }, 0.01);
                        }, 0.01);
                    }, 0.01);
                }, 0.01);
            }, 0.01);
        }, 0.01);
    });

    it('should focus left or right when swipe in one screen mode', (done) => {
        const element = React.createElement(MainGrid, { node: testGrid, screenMode: screenModes.one });
        const component = componentUtils.renderIntoDocument(element);

        // swiping right on the leftmost cell does nothing
        component.onSwipe({ direction: Hammer.DIRECTION_RIGHT });
        setTimeout(() => {
            expect(Store.getFocusedModuleCellIndex('Test grid')).toEqual(0);
            // swiping left on the leftmost cell goes right
            component.onSwipe({ direction: Hammer.DIRECTION_LEFT });
            setTimeout(() => {
                expect(Store.getFocusedModuleCellIndex('Test grid')).toEqual(1);

                // going on the rightmost for testing
                Store.__private.focusNextModuleCellByIndex('Test grid', 4);
                setTimeout(() => {
                    expect(Store.getFocusedModuleCellIndex('Test grid')).toEqual(5);

                    // swiping left on the rightmost cell does nothing
                    component.onSwipe({ direction: Hammer.DIRECTION_LEFT });
                    setTimeout(() => {
                        expect(Store.getFocusedModuleCellIndex('Test grid')).toEqual(5);

                        done();
                    }, 0.01);
                }, 0.01);
            }, 0.01);
        }, 0.01);

    });

    it('should move left of right when  panning in one screen mode', (done) => {
        const testGrid2 = componentUtils.makeSimpleTestGrid();
        const element = React.createElement(MainGrid, { node: testGrid2, screenMode: screenModes.one });
        const component = componentUtils.renderIntoDocument(element);
        const domNode = ReactDOM.findDOMNode(component);
        const gridNode = domNode.querySelector('.grid-main');
        domNode.parentNode.style.visibility = 'hidden'; // hide it to avoid visual flashes
        document.body.appendChild(domNode.parentNode);

        // quick way of doing "cards"
        gridNode.style.position = 'absolute';
        domNode.querySelector('.grid-row').style.whiteSpace = 'nowrap';
        _(domNode.querySelectorAll('.grid-cell-module')).forEach(cell => {
            cell.style.display = 'inline-block';
            cell.style.width = '100vw';
        });

        const bodyWidth = document.body.offsetWidth;
        const halfCellWidth = Math.floor(bodyWidth / 2);

        const overflowLeft = domNode.querySelector('.grid-container-scroll-overflow-left');
        const overflowRight = domNode.querySelector('.grid-container-scroll-overflow-right');

        // panning right on the leftmost cell activates left overflow
        let overflow = 150;
        component.onPan({ eventType: Hammer.INPUT_MOVE, deltaX: overflow });
        expect(overflowLeft.classList.contains('on')).toBe(true);
        expect(overflowLeft.classList.contains('going-off')).toBe(false);
        expect(overflowRight.classList.contains('on')).toBe(false);
        expect(overflowRight.classList.contains('going-off')).toBe(false);
        expect(overflowLeft.style.transform).toEqual(
            `translateX(${Math.round(Math.sqrt(Math.abs(overflow % bodyWidth)) * 2)}px)`
        );
        expect(gridNode.style.transform).toEqual('translateX(0px)');
        expect(gridNode.style.transition).toEqual('none');

        // panning left on the leftmost cell deactivates left overflow and move right
        let move = -60;
        component.onPan({ eventType: Hammer.INPUT_MOVE, deltaX: move });
        expect(overflowLeft.classList.contains('on')).toBe(true);
        expect(overflowLeft.classList.contains('going-off')).toBe(true);
        expect(overflowRight.classList.contains('on')).toBe(false);
        expect(overflowRight.classList.contains('going-off')).toBe(false);
        expect(gridNode.style.transform).toEqual(`translateX(${move - overflow}px)`);
        expect(gridNode.style.transition).toEqual('none');

        // wait for overflow to disappear
        setTimeout(() => {
            expect(overflowLeft.classList.contains('on')).toBe(false);
            expect(overflowLeft.classList.contains('going-off')).toBe(false);

            // panning more than half on the right from the first cell and stop should focus on the next cell
            move = -(halfCellWidth + 10);
            component.onPan({ eventType: Hammer.INPUT_MOVE, deltaX: move + overflow });
            component.onPan({ eventType: Hammer.INPUT_END, deltaX: move + overflow });

            // waiting for action to be done
            setTimeout(() => {
                expect(Store.getFocusedModuleCellIndex('Test simple grid')).toEqual(1);

                // panning less than half on the right from the second cell and stop should stay on the second cell
                overflow = 0; // we ended the previous pan so it's a new run
                move = -(halfCellWidth - 10);
                component.onPan({ eventType: Hammer.INPUT_MOVE, deltaX: move + overflow });
                component.onPan({ eventType: Hammer.INPUT_END, deltaX: move + overflow });

                // waiting for action to be done
                setTimeout(() => {
                    expect(Store.getFocusedModuleCellIndex('Test simple grid')).toEqual(1);

                    // panning less than half on the left from the second cell and stop should stay on the second cell
                    move = halfCellWidth - 10;
                    component.onPan({ eventType: Hammer.INPUT_MOVE, deltaX: move + overflow });
                    component.onPan({ eventType: Hammer.INPUT_END, deltaX: move + overflow });

                    // waiting for action to be done
                    setTimeout(() => {
                        expect(Store.getFocusedModuleCellIndex('Test simple grid')).toEqual(1);

                        // panning more than half on the left from the second cell
                        // and stop should focus on the previous cell
                        move = halfCellWidth + 10;
                        component.onPan({ eventType: Hammer.INPUT_MOVE, deltaX: move + overflow });
                        component.onPan({ eventType: Hammer.INPUT_END, deltaX: move + overflow });

                        // waiting for action to be done
                        setTimeout(() => {
                            expect(Store.getFocusedModuleCellIndex('Test simple grid')).toEqual(0);

                            // now focus the last cell
                            Store.__private.focusNextModuleCellByIndex('Test simple grid', 2);

                            // panning left on the rightmost cell activates right overflow
                            overflow = - 150;
                            component.onPan({ eventType: Hammer.INPUT_MOVE, deltaX: overflow });
                            expect(overflowRight.classList.contains('on')).toBe(true);
                            expect(overflowRight.classList.contains('going-off')).toBe(false);
                            expect(overflowLeft.classList.contains('on')).toBe(false);
                            expect(overflowLeft.classList.contains('going-off')).toBe(false);
                            expect(overflowRight.style.transform).toEqual(
                                `translateX(-${Math.round(Math.sqrt(Math.abs(overflow % bodyWidth)) * 2)}px)`
                            );
                             // -2000vw => moved two cards because we are one the third one
                            expect(gridNode.style.transform).toEqual('translateX(-200vw)');
                            expect(gridNode.style.transition).toEqual('none');

                            // panning left on the leftmost cell deactivates left overflow and move right
                            move = 60;
                            component.onPan({ eventType: Hammer.INPUT_MOVE, deltaX: move });
                            expect(overflowRight.classList.contains('on')).toBe(true);
                            expect(overflowRight.classList.contains('going-off')).toBe(true);
                            expect(overflowLeft.classList.contains('on')).toBe(false);
                            expect(overflowLeft.classList.contains('going-off')).toBe(false);
                            expect(gridNode.style.transform).toEqual(`translateX(calc(-200vw + ${move - overflow}px))`);
                            expect(gridNode.style.transition).toEqual('none');

                            // wait for overflow to disappear
                            setTimeout(() => {
                                expect(overflowRight.classList.contains('on')).toBe(false);
                                expect(overflowRight.classList.contains('going-off')).toBe(false);

                                // clean dom
                                domNode.parentNode.style.visibility = null;
                                document.body.removeChild(domNode.parentNode);

                                // tell jasmine we're done
                                done();
                            }, 210);
                        }, 0.01);
                    }, 0.01);
                }, 0.01);
            }, 0.01);
        }, 210);

    });

});
