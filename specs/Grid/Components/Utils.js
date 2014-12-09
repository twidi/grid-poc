var Actions = require('../../../app/Grid/Actions.js');
var Manipulator = require('../../../app/Grid/Manipulator.js');


var componentUtils = {
    makeTestGrid: function() {
        var testGrid = Manipulator.XMLStringToXMLGrid(
            '<grid name="Test grid" space="5px" type="mainGrid">' +
                '<content>' +
                    '<rows>' +
                        '<cells type="module"><content path="path.to.module.1"/></cells>' +
                        '<cells type="grid">' +
                            '<content>' +
                                '<rows>' +
                                    '<cells type="module"><content path="path.to.module.2"/></cells>' +
                                '</rows>' +
                                '<rows>' +
                                    '<cells type="module"><content path="path.to.module.3"/></cells>' +
                                '</rows>' +
                            '</content>' +
                        '</cells>' +
                    '</rows>' +
                    '<rows>' +
                        '<cells type="module"><content path="path.to.module.4"/></cells>' +
                        '<cells type="module"><content path="path.to.module.5"/></cells>' +
                        '<cells type="module"><content path="path.to.module.6"/></cells>' +
                    '</rows>' +
                '</content>' +
            '</grid>');

        Actions.addGrid(testGrid);
        Manipulator.setIds(testGrid);

        return testGrid;
    },

    countRows: function(component) {
        return this.getTextContent(component).match(/Row with cells/g).length;
    },
    countSubGrids: function(component) {
        return this.getTextContent(component).match(/Subgrid:/g).length;
    },
    countModules: function(component) {
        return this.getTextContent(component).match(/module\.\.\./g).length;
    },
    countRowPlaceholders: function(component) {
        return this.getTextContent(component).match(/Row \(placeholder\)/g).length;
    },
    countCellPlaceholders: function(component) {
        return this.getTextContent(component).match(/\(cell placeholder\)/g).length;
    },
}

componentUtils.getTextContent = function(component) {
    return component.getDOMNode().textContent;
};

module.exports = componentUtils;
