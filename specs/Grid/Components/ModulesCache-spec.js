var _ = require('lodash');
var jasmineReact = require('jasmine-react-helpers');
var React = require('react/addons');  // react + addons

var Manipulator = require('../../../app/Grid/Manipulator.js');
var Store = require('../../../app/Grid/Store.js');

var Cell = require('../../../app/Grid/Components/Cell.jsx');
var ModuleHolder = require('../../../app/Grid/Components/ModuleHolder.jsx');
var ModulesCache = require('../../../app/Grid/Components/ModulesCache.js');

var Utils = require('../../Utils.js');
var componentUtils = require('./Utils.js');


describe("Grid.Components.ModulesCache", function() {

    // Test grid and cell component, defined in beforeEach
    var testGrid, cellComponent;


    beforeEach(function(done) {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        uniqueIdMock = Utils.mockUniqueId();

        // reset the modules cache for every test
        componentUtils.clearModulesCache();

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();
        var moduleGridCell = testGrid.querySelector('cell[type=module]');
        var cellElement = React.createElement(Cell, {node: moduleGridCell});

        // we don't want the cell to call the ModulesCache
        jasmineReact.spyOnClass(Cell, 'canHoldExternalNodes').and.returnValue(false);
        cellComponent = componentUtils.renderIntoDocument(cellElement);

        setTimeout(done, 0.01);
    });

    afterEach(function() {
        componentUtils.unmountAllComponents();
    });

    var getCacheKey = function() {
        return _.keys(ModulesCache._cache)[0];
    };

    var getCacheEntry = function() {
        var key = getCacheKey();
        return ModulesCache._cache[key];
    };

    var getModuleComponent = function() {
        return getCacheEntry().moduleComponent

    };

    var getHolderComponent = function() {
        return getCacheEntry().holderComponent

    };

    it("should extract attributes from a dom node", function() {
        var domNode = document.createElement('div');
        domNode.setAttribute('foo', 'bar');
        domNode.setAttribute('baz', 'quz');
        var attrs = ModulesCache._extractAttributes(domNode);
        expect(attrs).toEqual({
            foo: 'bar',
            baz: 'quz'
        });
    });

    it("should get a module component", function(done) {
        spyOn(React, 'render').and.callThrough();

        var container = ModulesCache.getModuleComponent(cellComponent);

        // give some time to render the module component
        setTimeout(function() {

            // the module was rendered
            expect(React.render.calls.count()).toEqual(1);

            expect(container.tagName).toEqual('DIV');
            expect(container.className).toEqual('module-container');
            expect(container.children.length).toEqual(1);
            expect(container.children[0].tagName).toEqual('DIV');
            expect(container.children[0].className).toEqual('module');

            done();

        }, 0.01);
    });

    it("should get a module holder component", function(done) {
        spyOn(React, 'render').and.callThrough();

        var container = ModulesCache.getHolderComponent(cellComponent);

        // give some time to render the holder component
        setTimeout(function() {

            // the module holder and the module were rendered
            expect(React.render.calls.count()).toEqual(2);

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

    it("should get a module component from cache if called again with a cell", function(done) {
        var container = ModulesCache.getModuleComponent(cellComponent);
        var component = getModuleComponent();

        // give some time to render the module component
        setTimeout(function() {

            spyOn(React, 'render').and.callThrough();

            var newContainer = ModulesCache.getModuleComponent(cellComponent);

            // nothing was rendered again
            expect(React.render.calls.count()).toEqual(0);

            expect(newContainer).toBe(container);
            expect(component.getDOMNode()).toBe(container.children[0]);

            done();

        }, 0.01);
    });

    it("should get a module holder component from cache if called again with a cell", function(done) {
        var container = ModulesCache.getHolderComponent(cellComponent);
        var component = getHolderComponent();

        // give some time to render
        setTimeout(function() {

            spyOn(React, 'render').and.callThrough();
            spyOn(component, 'forceUpdate').and.callThrough();
            spyOn(component, 'setProps').and.callThrough();

            var newContainer = ModulesCache.getHolderComponent(cellComponent);

            // give some time to render the holder component again
            setTimeout(function() {

                // render was not called again
                expect(React.render.calls.count()).toEqual(0);
                // idem for forceUpdate
                expect(component.forceUpdate.calls.count()).toEqual(0);
                // idem for setProps
                expect(component.setProps.calls.count()).toEqual(0);

                expect(newContainer).toBe(container);
                expect(component.getDOMNode()).toBe(container.children[0]);

                done();

            }, 0.01);

        }, 0.01);
    });

    it("should rerender the holder component if the module was moved elsewhere", function(done) {
        var container = ModulesCache.getHolderComponent(cellComponent);
        var component = getHolderComponent();

        // give some time to render the holder component
        setTimeout(function() {

            // remove the module from the holder
            container.children[0].removeChild(container.children[0].querySelector('.module-container'));

            spyOn(React, 'render').and.callThrough();
            spyOn(component, 'forceUpdate').and.callThrough();
            spyOn(component, 'setProps').and.callThrough();

            var newContainer = ModulesCache.getHolderComponent(cellComponent);

            // give some time to render the holder component again
            setTimeout(function() {

                // render was not called again
                expect(React.render.calls.count()).toEqual(0);
                // idem for setProps
                expect(component.setProps.calls.count()).toEqual(0);
                // but a forceUpdate was called
                expect(component.forceUpdate.calls.count()).toEqual(1);

                expect(newContainer).toBe(container);
                expect(component.getDOMNode()).toBe(container.children[0]);

                done();

            }, 0.01);

        }, 0.01);

    });

    it("should rerender the holder component if the cell props was updated", function(done) {
        var container = ModulesCache.getHolderComponent(cellComponent);
        var component = getHolderComponent();

        // give some time to render the holder component
        setTimeout(function() {

            // change cell props
            var clonedGrid = Manipulator.clone(testGrid);
            var clonedCell = clonedGrid.querySelector('cell[type=module]');
            cellComponent.setProps({node: clonedCell});

            // give some time to propagate the props update
            setTimeout(function() {

                spyOn(React, 'render').and.callThrough();
                spyOn(component, 'forceUpdate').and.callThrough();
                spyOn(component, 'setProps').and.callThrough();

                var newContainer = ModulesCache.getHolderComponent(cellComponent);

                // give some time to render the holder component again
                setTimeout(function() {

                    // render was not called again
                    expect(React.render.calls.count()).toEqual(0);
                    // idem for forceUpdate
                    expect(component.forceUpdate.calls.count()).toEqual(0);
                    // but a setProps was called
                    expect(component.setProps.calls.count()).toEqual(1);

                    expect(newContainer).toBe(container);
                    expect(component.getDOMNode()).toBe(container.children[0]);

                    done();

                }, 0.01);

            }, 0.01);

        }, 0.01);

    });

    it("should get only new props for the holder component", function(done) {
        var container = ModulesCache.getHolderComponent(cellComponent);

        // give some time to render the holder component
        setTimeout(function() {
            // get a new grid cell
            var clonedGrid = Manipulator.clone(testGrid);
            var clonedCell = clonedGrid.querySelector('cell[type=module]');

            // set it in the cache
            var cache = getCacheEntry();
            cache.gridCell = clonedCell;

            // now check
            var newProps = ModulesCache._getNewHolderProps(cache, getHolderComponent().props);
            expect(newProps).toEqual({'gridCell': clonedCell});

            done();
        }, 0.01);
    });

    it("should return a module from cache from a key", function(done) {
        var container = ModulesCache.getModuleComponent(cellComponent);
        var component = getModuleComponent();

        // give some time to render the module component
        setTimeout(function() {

            spyOn(React, 'render').and.callThrough();

            var newContainer = ModulesCache.getModuleComponent(null, getCacheKey());

            // nothing was rendered again
            expect(React.render.calls.count()).toEqual(0);

            expect(newContainer).toBe(container);
            expect(component.getDOMNode()).toBe(container.children[0]);

            done();

        }, 0.01);
    });

    it("should return a module holder from cache from a key", function(done) {
        var container = ModulesCache.getHolderComponent(cellComponent);
        var component = getHolderComponent();

        // give some time to render the module component
        setTimeout(function() {

            spyOn(React, 'render').and.callThrough();

            var newContainer = ModulesCache.getHolderComponent(null, getCacheKey());

            // nothing was rendered again
            expect(React.render.calls.count()).toEqual(0);

            expect(newContainer).toBe(container);
            expect(component.getDOMNode()).toBe(container.children[0]);

            done();

        }, 0.01);
    });

});
