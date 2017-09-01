import jasmineReact from 'jasmine-react-helpers';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

import { Actions, Manipulator, Store } from '../../../app/Grid/Data';

import { MainGrid, Resizer } from '../../../app/Grid/Components';

import { componentUtils } from './Utils';
import { Utils } from '../../Utils';


describe('Grid.Components.Resizer', () => {

    // main grid, and the resizers to test defined in beforeEach
    let testGrid;
    let verticalResizer;
    let horizontalResizer;

    beforeEach((done) => {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        Utils.mockUniqueId();

        // reset the modules cache for every test
        componentUtils.clearModulesCache();

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();
        Manipulator.addResizers(testGrid);
        Manipulator.setIds(testGrid);
        verticalResizer = testGrid.querySelector('resizer[type=vertical]');
        horizontalResizer = testGrid.querySelector('resizer[type=horizontal]');

        setTimeout(done, 0.01);
    });

    afterEach(() => {
        componentUtils.unmountAllComponents();
    });

    it('should access its main grid', () => {
        const element = React.createElement(Resizer, { node: verticalResizer });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getGrid()).toBe(testGrid);
    });

    it('should get its id', () => {
        const element = React.createElement(Resizer, { node: verticalResizer });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getNodeId()).toBe(verticalResizer.getAttribute('id'));
    });

    it('should get the main grid name', () => {
        const element = React.createElement(Resizer, { node: verticalResizer });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getGridName()).toEqual('Test grid');
    });

    it('should get the design mode step', () => {
        const element = React.createElement(Resizer, { node: verticalResizer });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getDesignModeStep()).toEqual('disabled');

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.getDesignModeStep()).toEqual('enabled');
    });

    it('should know if it\'s in design mode', () => {
        const element = React.createElement(Resizer, { node: verticalResizer });
        const component = componentUtils.renderIntoDocument(element);
        expect(component.isInDesignMode()).toBe(false);

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.isInDesignMode()).toBe(true);
    });

    it('should know if it\'s a vertical or horizontal placeholder', () => {
        let element = React.createElement(Resizer, { node: verticalResizer });
        let component = componentUtils.renderIntoDocument(element);
        expect(component.isVertical()).toBe(true);
        expect(component.isHorizontal()).toBe(false);

        element = React.createElement(Resizer, { node: horizontalResizer });
        component = componentUtils.renderIntoDocument(element);
        expect(component.isVertical()).toBe(false);
        expect(component.isHorizontal()).toBe(true);
    });

    it('should render a vertical resizer', () => {
        const element = React.createElement(Resizer, { node: verticalResizer });
        const component = componentUtils.renderIntoDocument(element);
        const domNode = ReactDOM.findDOMNode(component);
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-resizer')).toBe(true);
        expect(domNode.classList.contains('grid-resizer-vertical')).toBe(true);
        expect(domNode.classList.contains('grid-resizer-horizontal')).toBe(false);
    });

    it('should render a horizontal resizer', () => {
        const element = React.createElement(Resizer, { node: horizontalResizer });
        const component = componentUtils.renderIntoDocument(element);
        const domNode = ReactDOM.findDOMNode(component);
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-resizer')).toBe(true);
        expect(domNode.classList.contains('grid-resizer-vertical')).toBe(false);
        expect(domNode.classList.contains('grid-resizer-horizontal')).toBe(true);
    });

    it('should handle mouse down event in design mode', (done) => {
        jasmineReact.spyOnClass(Resizer, 'onMouseDown').and.returnValue();
        const resizerProto = jasmineReact.classPrototype(Resizer);

        const element = React.createElement(Resizer, { node: horizontalResizer });
        const component = componentUtils.renderIntoDocument(element);
        const domNode = ReactDOM.findDOMNode(component);

        // we are not in design mode..,
        expect(component.getRenderAttrs()).toEqual({});

        // now, click
        TestUtils.Simulate.mouseDown(domNode);

        // leave time for the event to propagate
        setTimeout(() => {
            // not in design mode, no action called
            expect(resizerProto.onMouseDown).not.toHaveBeenCalled();

            // now simulate design mode
            spyOn(component, 'getDesignModeStep').and.returnValue('enabled');

            expect(component.getRenderAttrs()).toEqual({ onMouseDown: component.onMouseDown });
            component.forceUpdate();

            // now, click
            TestUtils.Simulate.mouseDown(domNode);

            // leave time for the event to propagate
            setTimeout(() => {
                // not in design mode, no action called
                expect(resizerProto.onMouseDown).toHaveBeenCalled();

                // tell jasmine we're done
                done();
            }, 0.01);
        }, 0.01);

    });

    it('should activate/deactivate document resize detection on mouse down/up', (done) => {
        jasmineReact.spyOnClass(Resizer, 'activateResizingDetection').and.callThrough();
        jasmineReact.spyOnClass(Resizer, 'deactivateResizingDetection').and.callThrough();
        const resizerProto = jasmineReact.classPrototype(Resizer);
        spyOn(Actions, 'startResizing').and.returnValue();
        spyOn(Actions, 'stopResizing').and.returnValue();

        // go in design mode
        Store.__private.changeDesignModeStep('Test grid', 'enabled', true);

        // render the full grid, we'll need elements around the resizer
        const gridElement = React.createElement(MainGrid, { node: testGrid, screenMode: MainGrid.screenModes.multi });
        const gridComponent = componentUtils.renderIntoDocument(gridElement);

        // we need the node to be attached to the document for bubbling
        const gridDomNode = ReactDOM.findDOMNode(gridComponent);
        gridDomNode.parentNode.style.display = 'none';
        document.body.appendChild(gridDomNode.parentNode);

        // mouse down on a resizer
        TestUtils.Simulate.mouseDown(gridDomNode.querySelector('.grid-resizer'));

        // leave time for the event to propagate
        setTimeout(() => {
            // not in design mode, no action called
            expect(resizerProto.activateResizingDetection.calls.count()).toEqual(1);
            expect(resizerProto.deactivateResizingDetection).not.toHaveBeenCalled();

            resizerProto.activateResizingDetection.calls.reset();

            // now release mouse to check if events are deactivated
            document.dispatchEvent(new Event('mouseup', { view: window, bubbles: true }));

            // leave time for the event to propagate
            setTimeout(() => {
                // not in design mode, no action called
                expect(resizerProto.activateResizingDetection).not.toHaveBeenCalled();
                expect(resizerProto.deactivateResizingDetection.calls.count()).toEqual(1);

                // we're done, remove the component from the dom
                document.body.removeChild(gridDomNode.parentNode);

                // tell jasmine we're done
                done();
            }, 0.01);
        }, 0.01);
    });

    it('should activate resizing on mouse down', (done) => {
        spyOn(Actions, 'startResizing').and.returnValue();
        jasmineReact.spyOnClass(Resizer, 'getDomNodeSize').and.returnValue(150);

        // go in design mode
        Store.__private.changeDesignModeStep('Test grid', 'enabled', true);

        // render the full grid, we'll need elements around the resizer
        const gridElement = React.createElement(MainGrid, { node: testGrid, screenMode: MainGrid.screenModes.multi });
        const gridComponent = componentUtils.renderIntoDocument(gridElement);
        const gridDomNode = ReactDOM.findDOMNode(gridComponent);

        // mouse down on a resizer
        TestUtils.Simulate.mouseDown(
            gridDomNode.querySelector('.grid-resizer-vertical'),
            { screenX: 100, screenY: 200 }
        );

        // leave time for the event to propagate
        setTimeout(() => {

            expect(Actions.startResizing.calls.count()).toEqual(1);
            expect(Actions.startResizing.calls.first().args).toEqual([
                'Test grid',
                testGrid.querySelector('resizer[type=vertical]'), // the first one, as we used the first one in the dom,
                300, // twice the value returned by `returnValue` on the `getDomNodeSize` spy
                100 // defined in the event call
            ]);

            // tell jasmine we're done
            done();
        }, 0.01);
    });

    it('should continue resizing on mouse move', (done) => {
        spyOn(Actions, 'resize').and.returnValue();
        jasmineReact.spyOnClass(Resizer, 'getDomNodeSize').and.returnValue(150);

        // go in design mode
        Store.__private.changeDesignModeStep('Test grid', 'enabled', true);

        // render the full grid, we'll need elements around the resizer
        const gridElement = React.createElement(MainGrid, { node: testGrid, screenMode: MainGrid.screenModes.multi });
        const gridComponent = componentUtils.renderIntoDocument(gridElement);

        // we need the node to be attached to the document for bubbling
        const gridDomNode = ReactDOM.findDOMNode(gridComponent);
        gridDomNode.parentNode.style.display = 'none';
        document.body.appendChild(gridDomNode.parentNode);

        // mouse down on a resizer
        TestUtils.Simulate.mouseDown(
            gridDomNode.querySelector('.grid-resizer-vertical'),
            { screenX: 100, screenY: 200 }
        );

        // leave time for the event to propagate
        setTimeout(() => {

            // now move the mouse to move the resizer
            document.dispatchEvent(
                new MouseEvent('mousemove', { view: window, bubbles: true, screenX: 150, screenY: 250 })
            );

            // leave time for the event to propagate
            setTimeout(() => {

                expect(Actions.resize.calls.count()).toEqual(1);
                expect(Actions.resize.calls.first().args).toEqual([
                    'Test grid',
                    150 // defined in the event call
                ]);

                // we're done, remove the component from the dom
                document.body.removeChild(gridDomNode.parentNode);

                // tell jasmine we're done
                done();
            }, 0.01);
        }, 0.01);
    });

    it('should stop resizing on mouse up', (done) => {
        spyOn(Actions, 'stopResizing').and.returnValue();
        jasmineReact.spyOnClass(Resizer, 'getDomNodeSize').and.returnValue(150);

        // go in design mode
        Store.__private.changeDesignModeStep('Test grid', 'enabled', true);

        // render the full grid, we'll need elements around the resizer
        const gridElement = React.createElement(MainGrid, { node: testGrid, screenMode: MainGrid.screenModes.multi });
        const gridComponent = componentUtils.renderIntoDocument(gridElement);

        // we need the node to be attached to the document for bubbling
        const gridDomNode = ReactDOM.findDOMNode(gridComponent);
        gridDomNode.parentNode.style.display = 'none';
        document.body.appendChild(gridDomNode.parentNode);

        // mouse down on a resizer
        TestUtils.Simulate.mouseDown(
            gridDomNode.querySelector('.grid-resizer-vertical'),
            { screenX: 100, screenY: 200 }
        );

        // leave time for the event to propagate
        setTimeout(() => {

            // now release mouse to stop the resizing
            document.dispatchEvent(new Event('mouseup', { view: window, bubbles: true }));

            // leave time for the event to propagate
            setTimeout(() => {

                expect(Actions.stopResizing.calls.count()).toEqual(1);
                expect(Actions.stopResizing.calls.first().args).toEqual([
                    'Test grid'
                ]);

                // we're done, remove the component from the dom
                document.body.removeChild(gridDomNode.parentNode);

                // tell jasmine we're done
                done();
            }, 0.01);
        }, 0.01);
    });

    it('should resize elements around', (done) => {
        jasmineReact.spyOnClass(Resizer, 'onResizingMove').and.callThrough();
        jasmineReact.spyOnClass(Resizer, 'setDomNodeRelativeSize').and.returnValue();
        const resizerProto = jasmineReact.classPrototype(Resizer);
        jasmineReact.spyOnClass(Resizer, 'getDomNodeSize').and.returnValue(150);

        // go in design mode
        Store.__private.changeDesignModeStep('Test grid', 'enabled', true);

        // render the full grid, we'll need elements around the resizer
        const gridElement = React.createElement(MainGrid, { node: testGrid, screenMode: MainGrid.screenModes.multi });
        const gridComponent = componentUtils.renderIntoDocument(gridElement);

        // we need the node to be attached to the document for bubbling
        const gridDomNode = ReactDOM.findDOMNode(gridComponent);
        gridDomNode.parentNode.style.display = 'none';
        document.body.appendChild(gridDomNode.parentNode);

        // get the first resizer component (should match the first resizer in the grid)
        const resizerComponent = TestUtils.scryRenderedComponentsWithType(gridComponent, Resizer)[0];

        // get the resizer and its elements to resize
        const resizerDomNode = ReactDOM.findDOMNode(resizerComponent);
        const previous = resizerDomNode.previousSibling;
        const next = resizerDomNode.nextSibling;

        // mouse down on a resizer
        TestUtils.Simulate.mouseDown(
            gridDomNode.querySelector('.grid-resizer-vertical'),
            { screenX: 100, screenY: 200 }
        );

        // leave time for the event to propagate
        setTimeout(() => {

            // now move the mouse to move the resizer
            document.dispatchEvent(
                new MouseEvent('mousemove', { view: window, bubbles: true, screenX: 150, screenY: 250 })
            );

            // leave time for the event to propagate
            setTimeout(() => {

                expect(resizerProto.onResizingMove).toHaveBeenCalled(); // called for each resizer
                expect(resizerProto.setDomNodeRelativeSize.calls.count()).toEqual(2);
                expect(resizerProto.setDomNodeRelativeSize.calls.first().args[0]).toBe(previous);
                expect(resizerProto.setDomNodeRelativeSize.calls.mostRecent().args[0]).toBe(next);

                // we're done, remove the component from the dom
                document.body.removeChild(gridDomNode.parentNode);

                // tell jasmine we're done
                done();
            }, 0.01);
        }, 0.01);
    });

});
