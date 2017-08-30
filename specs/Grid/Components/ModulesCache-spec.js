import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';

import { Manipulator, Store } from '../../../app/Grid/Data';

import { Cell } from '../../../app/Grid/Components';
import { ModulesCache } from '../../../app/Grid/Components/Utils';

import { Utils } from '../../Utils';
import { componentUtils } from './Utils';


describe('Grid.Components.ModulesCache', () => {

    // Test grid and cell component, defined in beforeEach
    let testGrid;
    let cellComponent;
    let updateCellComponentProps;

    const makeCellComponent = (cell, props) => {
        updateCellComponentProps = (newProps) => {
            const cellElement = React.createElement(cell, Object.assign({}, props, newProps));
            cellComponent = componentUtils.renderIntoDocument(cellElement);
            spyOn(cellComponent, 'canHoldExternalNodes').and.returnValue(false);
        };
        updateCellComponentProps({}); // will create the first one
    };

    beforeEach((done) => {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        Utils.mockUniqueId();

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();
        const moduleGridCell = testGrid.querySelector('cell[type=module]');
        makeCellComponent(Cell, { node: moduleGridCell });

        // reset the modules cache for every test
        componentUtils.clearModulesCache();

        setTimeout(done, 0.01);
    });

    afterEach(() => {
        componentUtils.unmountAllComponents();
    });

    const getCacheKey = () => _.keys(ModulesCache._cache)[0];

    const getCacheEntry = () => {
        const key = getCacheKey();
        return ModulesCache._cache[key];
    };

    const getModuleComponent = () => getCacheEntry().moduleComponent;

    const getHolderComponent = () => getCacheEntry().holderComponent;

    it('should extract attributes from a dom node', () => {
        const domNode = document.createElement('div');
        domNode.setAttribute('foo', 'bar');
        domNode.setAttribute('baz', 'quz');
        const attrs = ModulesCache._extractAttributes(domNode);
        expect(attrs).toEqual({
            foo: 'bar',
            baz: 'quz'
        });
    });

    it('should get a module component', (done) => {
        spyOn(ReactDOM, 'render').and.callThrough();

        const container = ModulesCache.getModuleComponent(cellComponent.wrappedRef);

        // give some time to render the module component
        setTimeout(() => {

            // the module was rendered
            expect(ReactDOM.render.calls.count()).toEqual(1);

            expect(container.tagName).toEqual('DIV');
            expect(container.className).toEqual('module-container');
            expect(container.children.length).toEqual(1);
            expect(container.children[0].tagName).toEqual('DIV');
            expect(container.children[0].className).toEqual('module');

            done();

        }, 0.01);
    });

    it('should get a module holder component', (done) => {
        spyOn(ReactDOM, 'render').and.callThrough();

        const container = ModulesCache.getHolderComponent(cellComponent.wrappedRef);

        // give some time to render the holder component
        setTimeout(() => {

            // the module holder and the module were rendered
            expect(ReactDOM.render.calls.count()).toEqual(2);

            expect(container.tagName).toEqual('DIV');
            expect(container.className).toEqual('module-holder-container');
            expect(container.children.length).toEqual(1);
            expect(container.children[0].tagName).toEqual('DIV');
            expect(container.children[0].className).toEqual('module-holder');
            expect(container.children[0].children[0].tagName).toEqual('DIV');
            expect(container.children[0].children[0].className).toEqual('module-cover');
            expect(container.children[0].children[1].tagName).toEqual('DIV');
            expect(container.children[0].children[1].className).toEqual('module-container');
            expect(container.children[0].children[1].children[0].tagName).toEqual('DIV');
            expect(container.children[0].children[1].children[0].className).toEqual('module');

            done();

        }, 0.01);
    });

    it('should get a module component from cache if called again with a cell', (done) => {
        const container = ModulesCache.getModuleComponent(cellComponent.wrappedRef);
        const component = getModuleComponent();

        // give some time to render the module component
        setTimeout(() => {

            spyOn(ReactDOM, 'render').and.callThrough();

            const newContainer = ModulesCache.getModuleComponent(cellComponent.wrappedRef);

            // nothing was rendered again
            expect(ReactDOM.render.calls.count()).toEqual(0);

            expect(newContainer).toBe(container);
            expect(ReactDOM.findDOMNode(component)).toBe(container.children[0]);

            done();

        }, 0.01);
    });

    it('should get a module holder component from cache if called again with a cell', (done) => {
        const container = ModulesCache.getHolderComponent(cellComponent.wrappedRef);
        const component = getHolderComponent();

        // give some time to render
        setTimeout(() => {

            spyOn(ReactDOM, 'render').and.callThrough();
            spyOn(component, 'forceUpdate').and.callThrough();

            const newContainer = ModulesCache.getHolderComponent(cellComponent.wrappedRef);

            // give some time to render the holder component again
            setTimeout(() => {

                // render was not called again
                expect(ReactDOM.render.calls.count()).toEqual(0);
                // idem for forceUpdate
                // see TODO in ModulesCache.getHolderComponent
                // expect(component.forceUpdate.calls.count()).toEqual(0);
                expect(component.forceUpdate.calls.count()).toEqual(1);

                expect(newContainer).toBe(container);
                expect(ReactDOM.findDOMNode(component)).toBe(container.children[0]);

                done();

            }, 0.01);

        }, 0.01);
    });

    it('should rerender the holder component if the module was moved elsewhere', (done) => {
        const container = ModulesCache.getHolderComponent(cellComponent.wrappedRef);
        const component = getHolderComponent();

        // give some time to render the holder component
        setTimeout(() => {

            // remove the module from the holder
            container.children[0].removeChild(container.children[0].querySelector('.module-container'));

            spyOn(ReactDOM, 'render').and.callThrough();
            spyOn(component, 'forceUpdate').and.callThrough();

            const newContainer = ModulesCache.getHolderComponent(cellComponent.wrappedRef);

            // give some time to render the holder component again
            setTimeout(() => {

                // render was not called again
                expect(ReactDOM.render.calls.count()).toEqual(0);
                // but a forceUpdate was called
                expect(component.forceUpdate.calls.count()).toEqual(1);

                expect(newContainer).toBe(container);
                expect(ReactDOM.findDOMNode(component)).toBe(container.children[0]);

                done();

            }, 0.01);

        }, 0.01);

    });

    it('should rerender the holder component if the cell props was updated', (done) => {
        const container = ModulesCache.getHolderComponent(cellComponent.wrappedRef);
        const component = getHolderComponent();

        // give some time to render the holder component
        setTimeout(() => {

            // change cell props
            const clonedGrid = Manipulator.clone(testGrid);
            const clonedCell = clonedGrid.querySelector('cell[type=module]');
            updateCellComponentProps({ node: clonedCell });

            // give some time to propagate the props update
            setTimeout(() => {

                spyOn(ReactDOM, 'render').and.callThrough();
                spyOn(component, 'forceUpdate').and.callThrough();

                const newContainer = ModulesCache.getHolderComponent(cellComponent.wrappedRef);

                // give some time to render the holder component again
                setTimeout(() => {

                    // forceUpdate was not called
                    expect(component.forceUpdate.calls.count()).toEqual(0);
                    // but a setProps was called (createElement + render) was called
                    expect(ReactDOM.render.calls.count()).toEqual(1);

                    expect(newContainer).toBe(container);
                    expect(ReactDOM.findDOMNode(component)).toBe(container.children[0]);

                    done();

                }, 0.01);

            }, 0.01);

        }, 0.01);

    });

    it('should get only new props for the holder component', (done) => {
        ModulesCache.getHolderComponent(cellComponent.wrappedRef);

        // give some time to render the holder component
        setTimeout(() => {
            // get a new grid cell
            const clonedGrid = Manipulator.clone(testGrid);
            const clonedCell = clonedGrid.querySelector('cell[type=module]');

            // set it in the cache
            const cache = getCacheEntry();
            cache.gridCell = clonedCell;

            // now check
            const newProps = ModulesCache._getNewHolderProps(cache, getHolderComponent().props);
            expect(newProps).toEqual({ gridCell: clonedCell });

            done();
        }, 0.01);
    });

    it('should return a module from cache from a key', (done) => {
        const container = ModulesCache.getModuleComponent(cellComponent.wrappedRef);
        const component = getModuleComponent();

        // give some time to render the module component
        setTimeout(() => {

            spyOn(ReactDOM, 'render').and.callThrough();

            const newContainer = ModulesCache.getModuleComponent(null, getCacheKey());

            // nothing was rendered again
            expect(ReactDOM.render.calls.count()).toEqual(0);

            expect(newContainer).toBe(container);
            expect(ReactDOM.findDOMNode(component)).toBe(container.children[0]);

            done();

        }, 0.01);
    });

    it('should return a module holder from cache from a key', (done) => {
        const container = ModulesCache.getHolderComponent(cellComponent.wrappedRef);
        const component = getHolderComponent();

        // give some time to render the module component
        setTimeout(() => {

            spyOn(ReactDOM, 'render').and.callThrough();

            const newContainer = ModulesCache.getHolderComponent(null, getCacheKey());

            // nothing was rendered again
            expect(ReactDOM.render.calls.count()).toEqual(0);

            expect(newContainer).toBe(container);
            expect(ReactDOM.findDOMNode(component)).toBe(container.children[0]);

            done();

        }, 0.01);
    });

});
