var _ = require('lodash');
var jasmineReact = require('jasmine-react-helpers-hotfix-0.14');
var React = require('react');
var ReactDOM = require('react-dom');
var TestUtils = require('react-addons-test-utils');

var Actions = require('../../../app/Grid/Actions');
var Manipulator = require('../../../app/Grid/Manipulator');
var Placeholder = require('../../../app/Grid/Components/Placeholder');
var Store = require('../../../app/Grid/Store');


var componentUtils = require('./Utils');
var TestDocumentEventsMixin = require('../../Utils/ReactMixins/DocumentEvents');
var Utils = require('../../Utils');


describe("Grid.Components.Placeholder", function() {
    var uniqueIdMock;

    // main grid, and the placeholder to test defined in beforeEach
    var testGrid;
    var gridPlaceholder;

    beforeEach(function(done) {
        // we want to start each test with a fresh list of grids
        Store.__removeAllGrids();

        // we mock the uniqueId function of lodash to know the value to expect
        uniqueIdMock = Utils.mockUniqueId();

        // reset the modules cache for every test
        componentUtils.clearModulesCache();

        // we add a grid with some content
        testGrid = componentUtils.makeTestGrid();
        Manipulator.addPlaceholders(testGrid);
        Manipulator.setIds(testGrid);
        gridPlaceholder = testGrid.querySelector('cell[type=placeholder]:not([surround])');

        setTimeout(done, 0.01);
    });

    afterEach(function() {
        componentUtils.unmountAllComponents();
    });

    it("should manage document events", function(done) {
        var element = React.createElement(Placeholder, {node: gridPlaceholder});
        var component = componentUtils.renderIntoDocument(element);
        TestDocumentEventsMixin(component, done);
    });

    it("should render a placeholder", function() {
        var element = React.createElement(Placeholder, {node: gridPlaceholder});
        var component = componentUtils.renderIntoDocument(element);
        var domNode = ReactDOM.findDOMNode(component);
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-cell')).toBe(true);
        expect(domNode.classList.contains('grid-cell-placeholder')).toBe(true);
        expect(domNode.classList.contains('grid-cell-placeholder-surround')).toBe(false);
        expect(domNode.classList.contains('grid-cell-placeholder-prehovering')).toBe(false);

        Store.__private.grids['Test grid'].designModeStep = 'prehovering';
        Store.__private.grids['Test grid'].nodes.hovering = gridPlaceholder;
        component.forceUpdate();
        expect(domNode.classList.contains('grid-cell-placeholder-prehovering')).toBe(true);

        var gridPlaceholderSurround = testGrid.querySelector('cell[type=placeholder][surround]');
        element = React.createElement(Placeholder, {node: gridPlaceholderSurround});
        component = componentUtils.renderIntoDocument(element);
        domNode = ReactDOM.findDOMNode(component);
        expect(domNode.tagName).toEqual('DIV');
        expect(domNode.classList.contains('grid-cell')).toBe(true);
        expect(domNode.classList.contains('grid-cell-placeholder')).toBe(true);
        expect(domNode.classList.contains('grid-cell-placeholder-surround')).toBe(true);
        expect(domNode.classList.contains('grid-cell-placeholder-prehovering')).toBe(false);

        Store.__private.grids['Test grid'].nodes.hovering = gridPlaceholderSurround;
        component.forceUpdate();
        expect(domNode.classList.contains('grid-cell-placeholder-prehovering')).toBe(true);
    });

    it("should activate/deactivate drop detection", function() {
        jasmineReact.spyOnClass(Placeholder, 'activateDropDetection').and.callThrough();
        jasmineReact.spyOnClass(Placeholder, 'deactivateDropDetection').and.callThrough();
        var placeholderProto = jasmineReact.classPrototype(Placeholder);

        var element = React.createElement(Placeholder, {node: gridPlaceholder});
        var component = componentUtils.renderIntoDocument(element);

        // should be activated on mount
        expect(placeholderProto.activateDropDetection.calls.count()).toEqual(1);
        expect(placeholderProto.deactivateDropDetection.calls.count()).toEqual(0);

        // we should have two events in cache
        expect(_.size(component._documentEventCache)).toEqual(2);
        expect(_.has(component._documentEventCache, 'onDocumentDetectDrop')).toBe(true);
        expect(_.has(component._documentEventCache, 'onDocumentDragEnd')).toBe(true);

        placeholderProto.activateDropDetection.calls.reset()
        placeholderProto.deactivateDropDetection.calls.reset()

        // an update should deactivate then reactivate
        component.forceUpdate();
        expect(placeholderProto.activateDropDetection.calls.count()).toEqual(1);
        expect(placeholderProto.deactivateDropDetection.calls.count()).toEqual(1);


        placeholderProto.activateDropDetection.calls.reset()
        placeholderProto.deactivateDropDetection.calls.reset()


        // unmouting should deactivate
        componentUtils.unmountComponent(component);
        expect(placeholderProto.activateDropDetection.calls.count()).toEqual(0);
        expect(placeholderProto.deactivateDropDetection.calls.count()).toEqual(1);

    });

    it("should deactivate drop detection when drag is finished", function() {
        jasmineReact.spyOnClass(Placeholder, 'deactivateDropDetection').and.callThrough();
        var placeholderProto = jasmineReact.classPrototype(Placeholder);

        var element = React.createElement(Placeholder, {node: gridPlaceholder});
        var component = componentUtils.renderIntoDocument(element);

        document.dispatchEvent(new Event('fakedragend'));
        expect(placeholderProto.deactivateDropDetection.calls.count()).toEqual(1);

    });

    it("should start hovering on drag enter", function() {
        jasmineReact.spyOnClass(Placeholder, 'onDragEnter').and.callThrough();
        var placeholderProto = jasmineReact.classPrototype(Placeholder);
        spyOn(Actions, 'startHovering').and.returnValue(false);

        var element = React.createElement(Placeholder, {node: gridPlaceholder});
        var component = componentUtils.renderIntoDocument(element);
        var domNode = ReactDOM.findDOMNode(component);

        componentUtils.simulateDragEvent(domNode, 'dragEnter');

        // event callback should have been called
        expect(placeholderProto.onDragEnter.calls.count()).toBe(1);
        // and the event default-prevented
        expect(placeholderProto.onDragEnter.calls.mostRecent().args[0].isDefaultPrevented()).toBe(true);

        // and the action been called too
        expect(Actions.startHovering.calls.count()).toBe(1);
        var args = Actions.startHovering.calls.mostRecent().args;
        expect(args[0]).toEqual('Test grid');
        expect(args[1]).toEqual(gridPlaceholder);
    });

    it("should start hovering on drag over", function() {
        jasmineReact.spyOnClass(Placeholder, 'onDragOver').and.callThrough();
        var placeholderProto = jasmineReact.classPrototype(Placeholder);
        spyOn(Actions, 'startHovering').and.returnValue(false);

        var element = React.createElement(Placeholder, {node: gridPlaceholder});
        var component = componentUtils.renderIntoDocument(element);

        var domNode = ReactDOM.findDOMNode(component);
        componentUtils.simulateDragEvent(domNode, 'dragOver');

        // event callback should have been called
        expect(placeholderProto.onDragOver.calls.count()).toBe(1);
        // and the event default-prevented
        expect(placeholderProto.onDragOver.calls.mostRecent().args[0].isDefaultPrevented()).toBe(true);

        // and the action been called too
        expect(Actions.startHovering.calls.count()).toBe(1);
        var args = Actions.startHovering.calls.mostRecent().args;
        expect(args[0]).toEqual('Test grid');
        expect(args[1]).toEqual(gridPlaceholder);
    });

    it("should stop hovering on drag leave", function() {
        jasmineReact.spyOnClass(Placeholder, 'onDragLeave').and.callThrough();
        var placeholderProto = jasmineReact.classPrototype(Placeholder);
        spyOn(Actions, 'stopHovering').and.returnValue(false);

        var element = React.createElement(Placeholder, {node: gridPlaceholder});
        var component = componentUtils.renderIntoDocument(element);

        var domNode = ReactDOM.findDOMNode(component);
        componentUtils.simulateDragEvent(domNode, 'dragLeave');

        // event callback should have been called
        expect(placeholderProto.onDragLeave.calls.count()).toBe(1);
        // and the event not default-prevented
        expect(placeholderProto.onDragLeave.calls.mostRecent().args[0].isDefaultPrevented()).toBe(false);

        // and the action must not have been called, it was not the currently hovering placeholder
        expect(Actions.stopHovering.calls.count()).toBe(0);

        // now we simulate the fact to be hover
        Store.__private.grids['Test grid'].designModeStep = 'prehovering';
        Store.__private.grids['Test grid'].nodes.hovering = gridPlaceholder;

        // then leave
        componentUtils.simulateDragEvent(domNode, 'dragLeave');

        // the action should have been called
        expect(Actions.stopHovering.calls.count()).toBe(1);
        var args = Actions.stopHovering.calls.mostRecent().args;
        expect(args[0]).toEqual('Test grid');
    });

    it("should drop when a fake drop is triggered", function() {
        jasmineReact.spyOnClass(Placeholder, 'onDocumentDetectDrop').and.callThrough();
        jasmineReact.spyOnClass(Placeholder, 'deactivateDropDetection').and.callThrough();
        var placeholderProto = jasmineReact.classPrototype(Placeholder);
        spyOn(Actions, 'drop').and.returnValue(false);

        var fakeDragEndCalled = 0;
        var fakeDragEndCallback = function() {
            fakeDragEndCalled++;
        };

        document.addEventListener('fakedragend', fakeDragEndCallback);

        var element = React.createElement(Placeholder, {node: gridPlaceholder});
        var component = componentUtils.renderIntoDocument(element);

        var domNode = ReactDOM.findDOMNode(component);
        // we need the node to be attached to the document for bubbling
        domNode.parentNode.style.display = 'none';
        document.body.appendChild(domNode.parentNode);

        try {

             // cannot use react event simulator for fake events
            var fakeDropEvent = new Event('fakedrop', {view: window, bubbles: true, target: domNode, });
            domNode.dispatchEvent(fakeDropEvent);

            // event callback should have been called
            expect(placeholderProto.onDocumentDetectDrop.calls.count()).toBe(1);
            // and the event not default-prevented
            expect(placeholderProto.onDocumentDetectDrop.calls.mostRecent().args[0].defaultPrevented).toBe(false);

            // and the action must not have been called, the grid was not in dragging mode
            expect(Actions.drop.calls.count()).toBe(0);

            // now we simulate the fact to be in dragging mode
            Store.__private.grids['Test grid'].designModeStep = 'dragging';
            Store.__private.grids['Test grid'].nodes.dragging = testGrid.querySelector('cell[type=module] > content');

            // then drop
            var fakeDropEvent = new Event('fakedrop', {view: window, bubbles: true, target: domNode, });
            domNode.dispatchEvent(fakeDropEvent);

            // the action should have been called
            expect(Actions.drop.calls.count()).toBe(1);
            var args = Actions.drop.calls.mostRecent().args;
            expect(args[0]).toEqual('Test grid');
            expect(args[1]).toEqual(gridPlaceholder);

            // other stuff should be called to
            expect(placeholderProto.deactivateDropDetection).toHaveBeenCalled();
            expect(fakeDragEndCalled).toBe(1);

        } finally {
            document.body.removeChild(domNode.parentNode);
        }
    });

});