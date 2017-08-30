import _ from 'lodash';
import jasmineReact from 'jasmine-react-helpers';
import React from 'react';
import ReactDOM from 'react-dom';
import stringify from 'json-stable-stringify';
import TestUtils from 'react-dom/test-utils';

import * as Modules from '../../../app/Grid/Modules';
import { Store } from '../../../app/Grid/Data';

import { ModulesCache } from '../../../app/Grid/Components/Utils';
import { ModuleHolder } from '../../../app/Grid/Components';
import { BaseModuleHolder } from '../../../app/Grid/Components/ModuleHolder';

import { Utils } from '../../Utils';
import { componentUtils } from './Utils';


describe('Grid.Components.ModuleHolder', () => {
    // main grid, the module cell we need, and cache stuff, defined in beforeEach
    let testGrid;
    let moduleGridCell;
    let attributes;
    let cacheKey;

    beforeEach((done) => {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        Utils.mockUniqueId();

        // reset the modules cache for every test
        componentUtils.clearModulesCache();

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();
        moduleGridCell = testGrid.querySelector('cell[type=module]');
        attributes = ModulesCache._extractAttributes(moduleGridCell.querySelector(':scope > content'));
        cacheKey = stringify(attributes);

        setTimeout(done, 0.01);
    });

    afterEach(() => {
        componentUtils.unmountAllComponents();
    });

    const createCacheEntry = () => {
        // create the module element to store it manually in cache
        const moduleElement = React.createElement(Modules.Test1, attributes);

        // create the holder element we want to test
        const holderElement = React.createElement(ModuleHolder, {
            uniqueKey: cacheKey,
            gridName: 'Test grid',
            gridCell: moduleGridCell
        });

        // create the cache entry
        ModulesCache._cache[cacheKey] = {
            gridName: 'Test grid',
            gridCell: moduleGridCell,
            moduleElement,
            holderElement
        };

        return ModulesCache._cache[cacheKey];
    };

    it('should render a component with a cover and a module', (done) => {
        jasmineReact.spyOnClass(BaseModuleHolder, 'getRenderAttrs').and.callThrough();

        const element = createCacheEntry().holderElement;
        const component = componentUtils.renderIntoDocument(element);

        // leave some time to render the component
        setTimeout(() => {

            expect(jasmineReact.classPrototype(BaseModuleHolder).getRenderAttrs).toHaveBeenCalled();

            const domNode = ReactDOM.findDOMNode(component);
            expect(domNode.className).toEqual('module-holder');
            expect(domNode.children[0].tagName).toEqual('DIV');
            expect(domNode.children[0].className).toEqual('module-cover');
            expect(domNode.children[1].tagName).toEqual('DIV');
            expect(domNode.children[1].className).toEqual('module-container');
            expect(domNode.children[1].children[0].tagName).toEqual('DIV');
            expect(domNode.children[1].children[0].className).toEqual('module');
            done();
        }, 0.01);
    });

    it('should make the dom node draggable in design mode', () => {
        const element = createCacheEntry().holderElement;
        const component = componentUtils.renderIntoDocument(element).wrappedRef;

        // dragging is only valid in design mode
        Store.__private.setDesignModeStep('Test grid', 'enabled');

        const attrs = component.getRenderAttrs();

        expect(_.size(attrs)).toEqual(2);
        expect(attrs.draggable).toBe(true);
        expect(attrs.onDragStart).toBe(component.onDragStart);
    });

    it('should handle the dragleave event if in dragging mode', () => {
        const element = createCacheEntry().holderElement;
        const component = componentUtils.renderIntoDocument(element).wrappedRef;

        // make the cell the dragging one
        Store.__private.setDesignModeStep('Test grid', 'dragging');
        Store.__private.grids['Test grid'].nodes.dragging = moduleGridCell.querySelector(':scope > content');

        const attrs = component.getRenderAttrs();

        expect(_.size(attrs)).toEqual(1);
        expect(attrs.onDragLeave).toBe(component.onDragLeave);
    });


    it('should attach the module component after being mounted', (done) => {
        jasmineReact.spyOnClass(ModuleHolder, 'attachExternalNode').and.callThrough();
        jasmineReact.spyOnClass(ModuleHolder, 'detachExternalNode').and.callThrough();

        const element = createCacheEntry().holderElement;
        componentUtils.renderIntoDocument(element);

        // leave some time to render the component
        setTimeout(() => {
            const ModuleHolderProto = jasmineReact.classPrototype(ModuleHolder);
            expect(ModuleHolderProto.attachExternalNode.calls.count()).toEqual(1);
            expect(ModuleHolderProto.attachExternalNode.calls.argsFor(0)[1]).toEqual('module-container');
            expect(ModuleHolderProto.detachExternalNode.calls.count()).toEqual(0);
            done();
        }, 0.01);
    });


    it('should detach/attach the module component during update', (done) => {
        jasmineReact.spyOnClass(ModuleHolder, 'attachExternalNode').and.callThrough();
        jasmineReact.spyOnClass(ModuleHolder, 'detachExternalNode').and.callThrough();

        const element = createCacheEntry().holderElement;
        const component = componentUtils.renderIntoDocument(element);

        // leave some time to render the component
        setTimeout(() => {

            component.forceUpdate();

            // leave some time to update the component
            setTimeout(() => {
                const ModuleHolderProto = jasmineReact.classPrototype(ModuleHolder);
                expect(ModuleHolderProto.attachExternalNode.calls.count()).toEqual(2); // includes initial
                expect(ModuleHolderProto.attachExternalNode.calls.argsFor(0)[1]).toEqual('module-container');
                expect(ModuleHolderProto.attachExternalNode.calls.argsFor(1)[1]).toEqual('module-container');
                expect(ModuleHolderProto.detachExternalNode.calls.count()).toEqual(1);
                expect(
                    ModuleHolderProto.detachExternalNode.calls.argsFor(0)[0].classList.contains('module-container')
                ).toBe(true);

                done();

            }, 0.01);

        }, 0.01);
    });

    it('should always accept to attach a module', () => {
        const element = createCacheEntry().holderElement;
        const component = componentUtils.renderIntoDocument(element);
        expect(component.canHoldExternalNodes()).toBe(true);
    });

    it('should always return the module to attach', () => {
        const element = createCacheEntry().holderElement;
        const component = componentUtils.renderIntoDocument(element);

        const moduleContainer = component.getExternalNode(ModulesCache.moduleContainerClassName);
        expect(moduleContainer.tagName).toEqual('DIV');
        expect(moduleContainer.className).toEqual('module-container');
        expect(moduleContainer.children.length).toEqual(1);
        expect(moduleContainer.children[0].tagName).toEqual('DIV');
        expect(moduleContainer.children[0].className).toEqual('module');
    });


    it('should not return a module to attach if it\'s not a valid className', () => {
        const element = createCacheEntry().holderElement;
        const component = componentUtils.renderIntoDocument(element);

        let container = component.getExternalNode('foo');
        expect(container).toBe(undefined);

        container = component.getExternalNode(null);
        expect(container).toBe(undefined);

        container = component.getExternalNode();
        expect(container).toBe(undefined);
    });

    it('should include a delete button in design mode', () => {
        // check in normal mode
        const element = createCacheEntry().holderElement;
        const component = componentUtils.renderIntoDocument(element);
        expect(ReactDOM.findDOMNode(component).querySelectorAll('.module-cover button').length).toEqual(0);

        // check in design mode "enabled"
        Store.__private.setDesignModeStep('Test grid', 'enabled');
        component.forceUpdate();
        expect(ReactDOM.findDOMNode(component).querySelectorAll('.module-cover button').length).toEqual(1);

        // check in design mode "dragging"
        Store.__private.setDesignModeStep('Test grid', 'dragging');
        component.forceUpdate();
        expect(ReactDOM.findDOMNode(component).querySelectorAll('.module-cover button').length).toEqual(0);

        // check in design mode "resizing"
        Store.__private.setDesignModeStep('Test grid', 'resizing');
        component.forceUpdate();
        expect(ReactDOM.findDOMNode(component).querySelectorAll('.module-cover button').length).toEqual(0);

    });

    it('should ask to remove the module when the delete button is clicked', (done) => {
        // removing a module is only valid in design mode
        Store.__private.setDesignModeStep('Test grid', 'enabled');

        const element = createCacheEntry().holderElement;
        const component = componentUtils.renderIntoDocument(element);

        // will set this to True when the callback is called
        let callbackCalled = false;
        // will store the grid name received via the tested event
        let updatedGridName;

        const callback = (gridName) => {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // listen to the tested event
        Store.on('grid.designMode.module.remove', callback);

        // simulate the startDrag event
        TestUtils.Simulate.click(ReactDOM.findDOMNode(component).querySelector('.module-cover button'));

        // leave some time to render the component
        setTimeout(() => {
            // stop listening
            Store.off('grid.designMode.module.remove', callback);

            // check if the callback were called
            expect(callbackCalled).toBe(true);
            expect(updatedGridName).toEqual('Test grid');

            done();

        }, 0.01);

    });

    it('should start the dragging', (done) => {

        // dragging is only valid in design mode
        Store.__private.setDesignModeStep('Test grid', 'enabled');

        const element = createCacheEntry().holderElement;
        const component = componentUtils.renderIntoDocument(element);

        // will set this to True when the callback is called
        let callbackCalled = false;
        // will store the grid name received via the tested event
        let updatedGridName;

        const callback = (gridName) => {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // listen to the tested event
        Store.on('grid.designMode.dragging.start', callback);

        // simulate the startDrag event
        componentUtils.simulateDragEvent(ReactDOM.findDOMNode(component), 'dragStart');

        // leave some time to render the component
        setTimeout(() => {
            // stop listening
            Store.off('grid.designMode.dragging.start', callback);

            // check if the callback were called
            expect(callbackCalled).toBe(true);
            expect(updatedGridName).toEqual('Test grid');

            done();

        }, 0.01);
    });

    it('should stop hovering when leaving the holder', (done) => {
        // when the holder stay a "long time" on a placeholder, the grid goes
        // in "stayhovering" mode and the placeholder is replaced by the holder
        // itself, so moving the mouse out of the holder should stop the hovering
        // stuff

        Store.__private.setDesignModeStep('Test grid', 'hovering');
        Store.__private.grids['Test grid'].nodes.dragging = moduleGridCell.querySelector(':scope > content');

        const element = createCacheEntry().holderElement;
        const component = componentUtils.renderIntoDocument(element);

        // will set this to True when the callback is called
        let callbackCalled = false;
        // will store the grid name received via the tested event
        let updatedGridName;

        const callback = (gridName) => {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // listen to the tested event
        Store.on('grid.designMode.hovering.stop', callback);

        // simulate the startDrag event
        componentUtils.simulateDragEvent(ReactDOM.findDOMNode(component), 'dragLeave');

        // leave some time to render the component
        setTimeout(() => {

            // stop listening
            Store.off('grid.designMode.hovering.stop', callback);

            // check if the callback were called
            expect(callbackCalled).toBe(true);
            expect(updatedGridName).toEqual('Test grid');

            done();

        }, 250);
    });


});
