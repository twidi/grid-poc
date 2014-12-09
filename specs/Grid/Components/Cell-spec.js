var _ = require('lodash');
var jasmineReact = require('jasmine-react-helpers');
var React = require('react/addons');  // react + addons
var stringify = require('json-stable-stringify');
var TestUtils = React.addons.TestUtils;

var Cell = require('../../../app/Grid/Components/Cell.jsx');
var Manipulator = require('../../../app/Grid/Manipulator.js');
var Modules = require('../../../app/Grid/Modules.js');
var Store = require('../../../app/Grid/Store.js');
var SubGrid = require('../../../app/Grid/Components/SubGrid.jsx');

var Utils = require('../../Utils.js');
var componentUtils = require('./Utils.js');


describe("Grid.Components.Cell", function() {
    var uniqueIdMock;

    // main grid and some cells, defined in beforeEach
    var testGrid;
    var moduleGridCell;
    var subGridCell;

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
        subGridCell = testGrid.querySelector('cells[type=grid]');

        setTimeout(done, 0.01);
    });

    it("should access its main grid", function() {
        var element = React.createElement(Cell, {node: subGridCell});
        var component = TestUtils.renderIntoDocument(element);
        expect(component.getGrid()).toBe(testGrid);
    });

    it("should get its id", function() {
        var element = React.createElement(Cell, {node: subGridCell});
        var component = TestUtils.renderIntoDocument(element);
        expect(component.getNodeId()).toBe(subGridCell.getAttribute('id'));
    });

    it("should get the type of a grid cell", function() {
        var element = React.createElement(Cell, {node: subGridCell});
        var component = TestUtils.renderIntoDocument(element);
        expect(component.getType()).toEqual('grid');
    });

    it("should get the type of a module cell", function() {
        var moduleGridCell = testGrid.querySelector('cells[type=module]');
        var element = React.createElement(Cell, {node: moduleGridCell});
        var component = TestUtils.renderIntoDocument(element);
        expect(component.getType()).toEqual('module');
    });

    it("should know if it's a placeolder or no", function() {
        Manipulator.addPlaceholders(testGrid);
        Manipulator.setIds(testGrid);

        var gridCell = testGrid.querySelector('cells[type=placeholder]');
        var element = React.createElement(Cell, {node: gridCell});
        var component = TestUtils.renderIntoDocument(element);
        expect(component.isPlaceholder()).toBe(true);

        var gridCell = testGrid.querySelector('cells:not([type=placeholder])');
        var element = React.createElement(Cell, {node: gridCell});
        var component = TestUtils.renderIntoDocument(element);
        expect(component.isPlaceholder()).toBe(false);
    });

    it("should render a subgrid", function() {
        var element = React.createElement(Cell, {node: subGridCell});
        var component = TestUtils.renderIntoDocument(element);
        var subGrid = component.renderAsSubGrid();
        expect(TestUtils.isElementOfType(subGrid, subGrid)).toBe(true);
        expect(subGrid.props.node).toBe(subGridCell);
    });

    it("should render a module", function() {
        var element = React.createElement(Cell, {node: moduleGridCell});
        var component = TestUtils.renderIntoDocument(element);
        var result = component.renderAsModule();
        expect(TestUtils.isElementOfType(result, React.DOM.div)).toBe(true);
    });

    it("should attach the module component after beeing mounted", function(done) {
        jasmineReact.spyOnClass(Cell, 'attachModule').and.callThrough();
        jasmineReact.spyOnClass(Cell, 'detachModule').and.callThrough();

        var element = React.createElement(Cell, {node: moduleGridCell});
        var component = TestUtils.renderIntoDocument(element);

        // leave some time to render the component
        setTimeout(function() {
            expect(_.keys(Cell._modulesHolderCache).length).toEqual(1);
            expect(jasmineReact.classPrototype(Cell).attachModule.calls.count()).toEqual(1);
            expect(jasmineReact.classPrototype(Cell).detachModule.calls.count()).toEqual(0);

            done();
        }, 0.01);
    });

    it("should detach/attach the module component during update", function(done) {
        jasmineReact.spyOnClass(Cell, 'attachModule').and.callThrough();
        jasmineReact.spyOnClass(Cell, 'detachModule').and.callThrough();

        var element = React.createElement(Cell, {node: moduleGridCell});
        var component = TestUtils.renderIntoDocument(element);

        // leave some time to render the component
        setTimeout(function() {

            component.forceUpdate();

            // leave some time to update the component
            setTimeout(function() {
                expect(jasmineReact.classPrototype(Cell).attachModule.calls.count()).toEqual(2);  // includes initial
                expect(jasmineReact.classPrototype(Cell).detachModule.calls.count()).toEqual(1);

                done();

            }, 0.01);

        }, 0.01);
    });

    it("should cache a module component", function() {
        // fill the cache with a rendered module for the first module cell
        var attributes = {component: "Module.Test1", text: "test 1-1", id: "content-5"};
        var holder = document.createElement('div');
        holder.className = Cell.moduleHolderClassName;
        var moduleComponent = React.render(
            React.createElement(Modules.Test1, attributes),
            holder
        )
        var key = stringify(attributes);
        Cell._modulesHolderCache[key] = holder;

        // now render the component itself
        var element = React.createElement(Cell, {node: moduleGridCell});
        var component = TestUtils.renderIntoDocument(element);

        // there should not be another module in cache
        expect(_.keys(Cell._modulesHolderCache).length).toEqual(1);

        // the module holder should be in the component
        expect(component.getDOMNode().querySelector(':scope > .moduleHolder')).toBe(holder);
    });

});