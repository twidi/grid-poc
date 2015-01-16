var _ = require('lodash');
var jasmineReact = require('jasmine-react-helpers');
var React = require('react/addons');  // react + addons
var stringify = require('json-stable-stringify');
var TestUtils = React.addons.TestUtils;

var Manipulator = require('../../../app/Grid/Manipulator.js');
var Modules = require('../../../app/Grid/Modules.js');
var Store = require('../../../app/Grid/Store.js');

var ModulesCache = require('../../../app/Grid/Components/ModulesCache.js');
var ModuleHolder = require('../../../app/Grid/Components/ModuleHolder.jsx');

var Utils = require('../../Utils.js');
var componentUtils = require('./Utils.js');


describe("Grid.Components.ModuleHolder", function() {
    var uniqueIdMock;

    // main grid, the module cell we need, and cache stuff, defined in beforeEach
    var testGrid;
    var moduleGridCell;
    var attributes;
    var cacheKey;

    beforeEach(function(done) {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        uniqueIdMock = Utils.mockUniqueId();

        // reset the modules cache for every test
        componentUtils.clearModulesCache();

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();
        moduleGridCell = testGrid.querySelector('cells[type=module]');
        attributes = ModulesCache._extractAttributes(moduleGridCell.querySelector(':scope > content'));
        cacheKey = stringify(attributes);

        setTimeout(done, 0.01);
    });

    afterEach(function() {
        componentUtils.unmountAllComponents();
    });

    var createCacheEntry = function() {
        // create the module element to store it manually in cache
        var moduleElement = React.createElement(Modules.Test1, attributes);

        // create the holder element we want to test
        var holderElement = React.createElement(ModuleHolder, {
            uniqueKey: cacheKey,
            gridName: 'Test grid',
            gridCell: moduleGridCell,
        });

        // create the cache entry
        ModulesCache._cache[cacheKey] = {
            gridName: 'Test grid',
            gridCell: moduleGridCell,
            moduleElement: moduleElement,
            holderElement: holderElement,
        };

        return ModulesCache._cache[cacheKey];
    };

    it("should render a component with a cover and a module", function(done) {
        var element = createCacheEntry().holderElement;
        var component = componentUtils.renderIntoDocument(element);

        // leave some time to render the component
        setTimeout(function() {
            var domNode = component.getDOMNode();
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


    it("should attach the module component after being mounted", function(done) {
        jasmineReact.spyOnClass(ModuleHolder, '_attachExternalNode').and.callThrough();
        jasmineReact.spyOnClass(ModuleHolder, '_detachExternalNode').and.callThrough();

        var element = createCacheEntry().holderElement;
        var component = componentUtils.renderIntoDocument(element);

        // leave some time to render the component
        setTimeout(function() {
            var ModuleHolderProto = jasmineReact.classPrototype(ModuleHolder)
            expect(ModuleHolderProto._attachExternalNode.calls.count()).toEqual(1);
            expect(ModuleHolderProto._attachExternalNode.calls.argsFor(0)[1]).toEqual('module-container');
            expect(ModuleHolderProto._detachExternalNode.calls.count()).toEqual(0);
            done();
        }, 0.01);
    });


    it("should detach/attach the module component during update", function(done) {
        jasmineReact.spyOnClass(ModuleHolder, '_attachExternalNode').and.callThrough();
        jasmineReact.spyOnClass(ModuleHolder, '_detachExternalNode').and.callThrough();

        var element = createCacheEntry().holderElement;
        var component = componentUtils.renderIntoDocument(element);

        // leave some time to render the component
        setTimeout(function() {

            component.forceUpdate();

            // leave some time to update the component
            setTimeout(function() {
                var ModuleHolderProto = jasmineReact.classPrototype(ModuleHolder)
                expect(ModuleHolderProto._attachExternalNode.calls.count()).toEqual(2);  // includes initial
                expect(ModuleHolderProto._attachExternalNode.calls.argsFor(0)[1]).toEqual('module-container');
                expect(ModuleHolderProto._attachExternalNode.calls.argsFor(1)[1]).toEqual('module-container');
                expect(ModuleHolderProto._detachExternalNode.calls.count()).toEqual(1);
                expect(ModuleHolderProto._detachExternalNode.calls.argsFor(0)[0].classList.contains('module-container')).toBe(true);

                done();

            }, 0.01);

        }, 0.01);
    });

    it("should always accept to attach a module", function() {
        var element = createCacheEntry().holderElement;
        var component = componentUtils.renderIntoDocument(element);
        expect(component.canHoldExternalNodes()).toBe(true);
    });

    it("should always return the module to attach", function() {
        var element = createCacheEntry().holderElement;
        var component = componentUtils.renderIntoDocument(element);

        var moduleContainer = component.getExternalNode(ModulesCache.moduleContainerClassName);
        expect(moduleContainer.tagName).toEqual('DIV');
        expect(moduleContainer.className).toEqual('module-container');
        expect(moduleContainer.children.length).toEqual(1);
        expect(moduleContainer.children[0].tagName).toEqual('DIV');
        expect(moduleContainer.children[0].className).toEqual('module');
    });


    it("should not return a module to attach if it's not a valid className", function() {
        var element = createCacheEntry().holderElement;
        var component = componentUtils.renderIntoDocument(element);

        var container = component.getExternalNode('foo');
        expect(container).toBe(undefined);

        container = component.getExternalNode(null);
        expect(container).toBe(undefined);

        container = component.getExternalNode();
        expect(container).toBe(undefined);
    });

    it("should start the dragging", function(done) {

        // dragging is only valid in design mode
        Store.__private.setDesignModeStep('Test grid', 'enabled');

        var element = createCacheEntry().holderElement;
        var component = componentUtils.renderIntoDocument(element);

        // will set this to True when the callback is called
        var callbackCalled = false;
        // will store the grid name received via the tested event
        var updatedGridName;

        var callback = function(gridName) {
            callbackCalled = true;
            updatedGridName = gridName;
        };

        // listen to the tested event
        Store.on('grid.designMode.dragging.start', callback);

        // simulate the startDrag event
        React.addons.TestUtils.Simulate.dragStart(component.getDOMNode(), {dataTransfer: {setData: function(){}}});

        // leave some time to render the component
        setTimeout(function() {
            // stop listening
            Store.off('grid.designMode.dragging.start', callback);

            // check if the callback were called
            expect(callbackCalled).toBe(true);
            expect(updatedGridName).toEqual('Test grid');

            done();

        }, 0.01);
    });

});