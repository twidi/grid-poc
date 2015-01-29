var _ = require('lodash');
var React = require('react/addons');  // react + addons
var TestUtils = React.addons.TestUtils;


var Manipulator = require('../../../app/Grid/Manipulator.js');
var Resizer = require('../../../app/Grid/Components/Resizer.jsx');
var Store = require('../../../app/Grid/Store.js');

var Utils = require('../../Utils.js');
var componentUtils = require('./Utils.js');


describe("Grid.Components.Resizer", function() {
    var uniqueIdMock;

    // main grid, and the resizers to test defined in beforeEach
    var testGrid;
    var verticalResizer;
    var horizontalResizer;

    beforeEach(function(done) {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        uniqueIdMock = Utils.mockUniqueId();

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

    afterEach(function() {
        componentUtils.unmountAllComponents();
    });

    it("should access its main grid", function() {
        var element = React.createElement(Resizer, {node: verticalResizer});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getGrid()).toBe(testGrid);
    });

    it("should get its id", function() {
        var element = React.createElement(Resizer, {node: verticalResizer});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getNodeId()).toBe(verticalResizer.getAttribute('id'));
    });

    it("should get the main grid name", function() {
        var element = React.createElement(Resizer, {node: verticalResizer});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getGridName()).toEqual('Test grid');
    });

    it("should get the design mode step", function() {
        var element = React.createElement(Resizer, {node: verticalResizer});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.getDesignModeStep()).toEqual('disabled');

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.getDesignModeStep()).toEqual('enabled');
    });

    it("should know if it's in design mode", function() {
        var element = React.createElement(Resizer, {node: verticalResizer});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.isInDesignMode()).toBe(false);

        Store.__private.setDesignModeStep('Test grid', 'enabled');
        expect(component.isInDesignMode()).toBe(true);
    });

    it("should know if it's a vertical or horizontal placeholder", function() {
        var element = React.createElement(Resizer, {node: verticalResizer});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.isVertical()).toBe(true);
        expect(component.isHorizontal()).toBe(false);

        var element = React.createElement(Resizer, {node: horizontalResizer});
        var component = componentUtils.renderIntoDocument(element);
        expect(component.isVertical()).toBe(false);
        expect(component.isHorizontal()).toBe(true);
    });

    it("should render a vertical resizer", function() {
        var element = React.createElement(Resizer, {node: verticalResizer});
        var component = componentUtils.renderIntoDocument(element);
        var domNode = component.getDOMNode();
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-resizer')).toBe(true);
        expect(domNode.classList.contains('grid-resizer-vertical')).toBe(true);
        expect(domNode.classList.contains('grid-resizer-horizontal')).toBe(false);
    });

    it("should render a horizontal resizer", function() {
        var element = React.createElement(Resizer, {node: horizontalResizer});
        var component = componentUtils.renderIntoDocument(element);
        var domNode = component.getDOMNode();
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-resizer')).toBe(true);
        expect(domNode.classList.contains('grid-resizer-vertical')).toBe(false);
        expect(domNode.classList.contains('grid-resizer-horizontal')).toBe(true);
    });

});