import _ from 'lodash';
import jasmineReact from 'jasmine-react-helpers-hotfix-0.14';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

import { Manipulator } from '../../../app/Grid/Manipulator';
import { Store } from '../../../app/Grid/Store';

import { Cell } from '../../../app/Grid/Components/Cell';
import { ModulesCache } from '../../../app/Grid/Components/ModulesCache';
import { Placeholder } from '../../../app/Grid/Components/Placeholder';
import { SubGrid } from '../../../app/Grid/Components/SubGrid';

import { Utils } from '../../Utils';
import { componentUtils } from './Utils';

describe('Grid.Components.Cell', function() {
    let uniqueIdMock;

    // main grid and some cells, defined in beforeEach
    let testGrid;
    let moduleGridCell;
    let subGridCell;

    beforeEach(function(done) {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        uniqueIdMock = Utils.mockUniqueId();

        // reset the modules cache for every test
        componentUtils.clearModulesCache();

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();
        moduleGridCell = testGrid.querySelector('cell[type=module]');
        subGridCell = testGrid.querySelector('cell[type=grid]');

        setTimeout(done, 0.01);
    });

    afterEach(function() {
        componentUtils.unmountAllComponents();
    });

    it('should access its main grid', function() {
        const element = React.createElement(Cell, {node: subGridCell});
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getGrid()).toBe(testGrid);
    });

    it('should get its id', function() {
        const element = React.createElement(Cell, {node: subGridCell});
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getNodeId()).toBe(subGridCell.getAttribute('id'));
    });

    it('should get the main grid name', function() {
        const element = React.createElement(Cell, {node: subGridCell});
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getGridName()).toEqual('Test grid');
    });

    it('should get the design mode step', function() {
        const element = React.createElement(Cell, {node: subGridCell});
        const component = componentUtils.renderIntoDocument(element);
        expect(component.getDesignModeStep()).toEqual('disabled');

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.getDesignModeStep()).toEqual('enabled');
    });

    it('should know if it\'s in design mode', function() {
        const element = React.createElement(Cell, {node: subGridCell});
        const component = componentUtils.renderIntoDocument(element);
        expect(component.isInDesignMode()).toBe(false);

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.isInDesignMode()).toBe(true);
    });

    it('should get the type of a cell', function() {
        let element = React.createElement(Cell, {node: subGridCell});
        let component = componentUtils.renderIntoDocument(element);

        expect(component.getType()).toEqual('grid');
        expect(component.isSubGrid()).toBe(true);
        expect(component.isModule()).toBe(false);
        expect(component.isPlaceholder()).toBe(false);

        element = React.createElement(Cell, {node: moduleGridCell});
        component = componentUtils.renderIntoDocument(element);

        expect(component.getType()).toEqual('module');
        expect(component.isSubGrid()).toBe(false);
        expect(component.isModule()).toBe(true);
        expect(component.isPlaceholder()).toBe(false);

        Manipulator.addPlaceholders(testGrid);
        Manipulator.setIds(testGrid);

        const gridCell = testGrid.querySelector('cell[type=placeholder]');
        element = React.createElement(Cell, {node: gridCell});
        component = componentUtils.renderIntoDocument(element);

        expect(component.getType()).toEqual('placeholder');
        expect(component.isSubGrid()).toBe(false);
        expect(component.isModule()).toBe(false);
        expect(component.isPlaceholder()).toBe(true);

    });

    it('should render a subgrid', function() {
        jasmineReact.spyOnClass(Cell, 'renderAsSubGrid').and.callThrough();

        const element = React.createElement(Cell, {node: subGridCell});
        const component = componentUtils.renderIntoDocument(element);
        expect(jasmineReact.classPrototype(Cell).renderAsSubGrid.calls.count()).toEqual(1);

        // default relative size => flex-grow=1
        expect(ReactDOM.findDOMNode(component).getAttribute('style')).toMatch(/\bflex-grow\s*:\s*1\b/);

        const subGrid = component.renderAsSubGrid();
        expect(TestUtils.isElementOfType(subGrid, SubGrid)).toBe(true);
        expect(subGrid.props.node).toBe(subGridCell);
    });

    it('should render a module in normal mode', function() {
        jasmineReact.spyOnClass(Cell, 'renderAsModule').and.callThrough();

        const element = React.createElement(Cell, {node: moduleGridCell});
        const component = componentUtils.renderIntoDocument(element);
        const domNode = ReactDOM.findDOMNode(component);

        expect(jasmineReact.classPrototype(Cell).renderAsModule.calls.count()).toEqual(1);

        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-cell')).toBe(true);
        expect(domNode.classList.contains('grid-cell-module')).toBe(true);
        expect(domNode.classList.contains('grid-cell-module-dragging')).toBe(false);

        const moduleContainer = domNode.children[0];
        expect(moduleContainer.tagName).toEqual('DIV');
        expect(moduleContainer.className).toEqual('module-container');
        expect(moduleContainer.children.length).toEqual(1);
        expect(moduleContainer.children[0].tagName).toEqual('DIV');
        expect(moduleContainer.children[0].className).toEqual('module');

        // default relative size => flex-grow=1
        expect(domNode.getAttribute('style')).toMatch(/\bflex-grow\s*:\s*1\b/);

        // update the relativeSize to see if it's taken into account
        moduleGridCell.setAttribute('relativeSize', 2);
        component.forceUpdate();
        // new relative size of the node, check the rendered div
        expect(domNode.getAttribute('style')).toMatch(/\bflex-grow\s*:\s*2\b/);

        const module = component.renderAsModule();
        expect(module.type).toBe('div');
    });

    it('should render a module in design mode', function() {
        Store.__private.setDesignModeStep('Test grid', 'enabled');
        const element = React.createElement(Cell, {node: moduleGridCell});
        const component = componentUtils.renderIntoDocument(element);
        const domNode = ReactDOM.findDOMNode(component);

        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-cell')).toBe(true);
        expect(domNode.classList.contains('grid-cell-module')).toBe(true);
        expect(domNode.classList.contains('grid-cell-module-dragging')).toBe(false);

        const moduleContainer = domNode.children[0];
        expect(moduleContainer.tagName).toEqual('DIV');
        expect(moduleContainer.className).toEqual('module-holder-container');
        expect(moduleContainer.children.length).toEqual(1);
        expect(moduleContainer.children[0].tagName).toEqual('DIV');
        expect(moduleContainer.children[0].className).toEqual('module-holder');
        expect(moduleContainer.children[0].children[0].tagName).toEqual('DIV');
        expect(moduleContainer.children[0].children[0].className).toEqual('module-cover');
        expect(moduleContainer.children[0].children[1].tagName).toEqual('DIV');
        expect(moduleContainer.children[0].children[1].className).toEqual('module-container');
        expect(moduleContainer.children[0].children[1].children[0].tagName).toEqual('DIV');
        expect(moduleContainer.children[0].children[1].children[0].className).toEqual('module');

        // default relative size => flex-grow=1
        expect(domNode.getAttribute('style')).toMatch(/\bflex-grow\s*:\s*1\b/);

        // update the relativeSize to see if it's taken into account
        moduleGridCell.setAttribute('relativeSize', 2);
        component.forceUpdate();
        // new relative size of the node, check the rendered div
        expect(domNode.getAttribute('style')).toMatch(/\bflex-grow\s*:\s*2\b/);
    });

    it('should render a placeholder', function() {
        jasmineReact.spyOnClass(Cell, 'renderAsPlaceholder').and.callThrough();

        Manipulator.addPlaceholders(testGrid);
        const placeholderGridCell = testGrid.querySelector('cell[type=placeholder]');
        const element = React.createElement(Cell, {node: placeholderGridCell});
        const component = componentUtils.renderIntoDocument(element);
        const domNode = ReactDOM.findDOMNode(component);

        expect(jasmineReact.classPrototype(Cell).renderAsPlaceholder.calls.count()).toEqual(1);

        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-cell')).toBe(true);
        expect(domNode.classList.contains('grid-cell-placeholder')).toBe(true);
        expect(domNode.classList.contains('grid-cell-module-dragging')).toBe(false);

        // no specific style defined
        expect(domNode.getAttribute('style')).toBe(null);

        const placeholder = component.renderAsPlaceholder();
        expect(TestUtils.isElementOfType(placeholder, Placeholder)).toBe(true);
        expect(placeholder.props.node).toBe(placeholderGridCell);
    });

    it('should attach the module component after being mounted', function(done) {
        jasmineReact.spyOnClass(Cell, '_attachExternalNode').and.callThrough();
        jasmineReact.spyOnClass(Cell, '_detachExternalNode').and.callThrough();

        const element = React.createElement(Cell, {node: moduleGridCell});
        const component = componentUtils.renderIntoDocument(element);

        // leave some time to render the component
        setTimeout(function() {
            expect(_.keys(ModulesCache._cache).length).toEqual(1);
            const cellProto = jasmineReact.classPrototype(Cell);
            expect(cellProto._attachExternalNode.calls.count()).toEqual(1);
            expect(cellProto._attachExternalNode.calls.argsFor(0)[1]).toEqual('module-container');
            expect(cellProto._detachExternalNode.calls.count()).toEqual(0);

            done();
        }, 0.01);
    });

    it('should detach/attach the module component during update', function(done) {
        jasmineReact.spyOnClass(Cell, '_attachExternalNode').and.callThrough();
        jasmineReact.spyOnClass(Cell, '_detachExternalNode').and.callThrough();

        const element = React.createElement(Cell, {node: moduleGridCell});
        const component = componentUtils.renderIntoDocument(element);

        // leave some time to render the component
        setTimeout(function() {

            component.forceUpdate();

            // leave some time to update the component
            setTimeout(function() {
                expect(_.keys(ModulesCache._cache).length).toEqual(1);
                const cellProto = jasmineReact.classPrototype(Cell);
                expect(cellProto._attachExternalNode.calls.count()).toEqual(2);  // includes initial
                expect(cellProto._attachExternalNode.calls.argsFor(0)[1]).toEqual('module-container');
                expect(cellProto._attachExternalNode.calls.argsFor(1)[1]).toEqual('module-container');
                expect(cellProto._detachExternalNode.calls.count()).toEqual(1);
                expect(cellProto._detachExternalNode.calls.argsFor(0)[0].classList.contains('module-container')).toBe(true);

                done();

            }, 0.01);

        }, 0.01);
    });

    it('should accept to attach a module only if it\'s a module cell', function() {
        let element = React.createElement(Cell, {node: moduleGridCell});
        let component = componentUtils.renderIntoDocument(element);
        expect(component.canHoldExternalNodes()).toBe(true);

        element = React.createElement(Cell, {node: subGridCell});
        component = componentUtils.renderIntoDocument(element);
        expect(component.canHoldExternalNodes()).toBe(false);

        Manipulator.addPlaceholders(testGrid);
        Manipulator.setIds(testGrid);
        const gridCell = testGrid.querySelector('cell[type=placeholder]');
        element = React.createElement(Cell, {node: gridCell});
        component = componentUtils.renderIntoDocument(element);
        expect(component.canHoldExternalNodes()).toBe(false);
    });

    it('should only return the module to attach when not in design mode', function() {
        const element = React.createElement(Cell, {node: moduleGridCell});
        const component = componentUtils.renderIntoDocument(element);

        // not in design mode, we should get a module
        let moduleContainer = component.getExternalNode(ModulesCache.moduleContainerClassName);
        expect(moduleContainer.tagName).toEqual('DIV');
        expect(moduleContainer.className).toEqual('module-container');
        expect(moduleContainer.children.length).toEqual(1);
        expect(moduleContainer.children[0].tagName).toEqual('DIV');
        expect(moduleContainer.children[0].className).toEqual('module');

        // faking going to design mode
        spyOn(component, 'isInDesignMode').and.returnValue('true');

        // in design mode, we should get nothing when asking for the module
        moduleContainer = component.getExternalNode(ModulesCache.moduleContainerClassName);
        expect(moduleContainer).toBe(undefined);

    });

    it('should only return the module holder to attach when in design mode', function() {
        const element = React.createElement(Cell, {node: moduleGridCell});
        const component = componentUtils.renderIntoDocument(element);

        // not in design mode, we should get a module
        let holderContainer = component.getExternalNode(ModulesCache.holderContainerClassName);
        expect(holderContainer).toBe(undefined);

        // faking going to design mode
        spyOn(component, 'isInDesignMode').and.returnValue('true');

        // in design mode, we should get nothing when asking for the module
        holderContainer = component.getExternalNode(ModulesCache.holderContainerClassName);
        expect(holderContainer.tagName).toEqual('DIV');
        expect(holderContainer.className).toEqual('module-holder-container');
        expect(holderContainer.children.length).toEqual(1);
        expect(holderContainer.children[0].tagName).toEqual('DIV');
        expect(holderContainer.children[0].className).toEqual('module-holder');
        expect(holderContainer.children[0].children[0].tagName).toEqual('DIV');
        expect(holderContainer.children[0].children[0].className).toEqual('module-cover');
        expect(holderContainer.children[0].children[1].tagName).toEqual('DIV');
        expect(holderContainer.children[0].children[1].className).toEqual('module-container');
        expect(holderContainer.children[0].children[1].children[0].tagName).toEqual('DIV');
        expect(holderContainer.children[0].children[1].children[0].className).toEqual('module');

    });

    it('should not return a node to attach if it\'s not a module grid', function() {
        let element = React.createElement(Cell, {node: subGridCell});
        let component = componentUtils.renderIntoDocument(element);

        let container = component.getExternalNode(ModulesCache.moduleContainerClassName);
        expect(container).toBe(undefined);
        container = component.getExternalNode(ModulesCache.holderContainerClassName);
        expect(container).toBe(undefined);

        Manipulator.addPlaceholders(testGrid);
        Manipulator.setIds(testGrid);
        const gridCell = testGrid.querySelector('cell[type=placeholder]');
        element = React.createElement(Cell, {node: gridCell});
        component = componentUtils.renderIntoDocument(element);

        container = component.getExternalNode(ModulesCache.moduleContainerClassName);
        expect(container).toBe(undefined);
        container = component.getExternalNode(ModulesCache.holderContainerClassName);
        expect(container).toBe(undefined);

    });

    it('should not return a node to attach if it\'s not a valid className', function() {
        const element = React.createElement(Cell, {node: moduleGridCell});
        const component = componentUtils.renderIntoDocument(element);

        let container = component.getExternalNode('foo');
        expect(container).toBe(undefined);

        container = component.getExternalNode(null);
        expect(container).toBe(undefined);

        container = component.getExternalNode();
        expect(container).toBe(undefined);
    });

});
