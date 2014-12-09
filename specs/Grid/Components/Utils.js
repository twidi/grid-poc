var Actions = require('../../../app/Grid/Actions.js');
var Manipulator = require('../../../app/Grid/Manipulator.js');


var componentUtils = {
    makeTestGrid: function() {
        var testGrid = Manipulator.XMLStringToXMLGrid(
            '<grid name="Test grid" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module"><content component="Module.Test1" text="test 1-1"/></cells>' +
                        '<cells type="grid">' +
                            '<content>' +
                                '<rows>' +
                                    '<cells type="module"><content component="Module.Test2" text="test 2-1"/></cells>' +
                                '</rows>' +
                                '<rows>' +
                                    '<cells type="module"><content component="Module.Test1" text="test 1-2"/></cells>' +
                                '</rows>' +
                            '</content>' +
                        '</cells>' +
                    '</rows>' +
                    '<rows>' +
                        '<cells type="module"><content component="Module.Test1" text="test 1-3"/></cells>' +
                        '<cells type="module"><content component="Module.Test2" text="test 2-2"/></cells>' +
                        '<cells type="module"><content component="Module.Test2" text="test 2-3"/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>');

        Actions.addGrid(testGrid);
        Manipulator.setIds(testGrid);

        return testGrid;
    },

    countRows: function(component) {
        try {
            return this.getTextContent(component).match(/Row with cells/g).length;
        } catch(e) {
            return 0;
        };
    },
    countSubGrids: function(component) {
        try {
            return this.getTextContent(component).match(/Subgrid:/g).length;
        } catch(e) {
            return 0;
        };
    },
    countModules: function(component) {
        try {
            return this.getTextContent(component).match(/Module./g).length;
        } catch(e) {
            return 0;
        };
    },
    countRowPlaceholders: function(component) {
        try {
            return this.getTextContent(component).match(/Row \(placeholder\)/g).length;
        } catch(e) {
            return 0;
        };
    },
    countCellPlaceholders: function(component) {
        try {
            return this.getTextContent(component).match(/\(cell placeholder\)/g).length;
        } catch(e) {
            return 0;
        };
    },

    clearModulesCache: function() {
        var Cell = require('../../../app/Grid/Components/Cell.jsx');
        Cell._modulesHolderCache = {};
    },
}

componentUtils.getTextContent = function(component) {
    return component.getDOMNode().textContent;
};

module.exports = componentUtils;
