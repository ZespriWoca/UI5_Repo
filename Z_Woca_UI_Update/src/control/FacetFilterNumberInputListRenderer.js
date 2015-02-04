(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.control.FacetFilterNumberInputListRenderer");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");

    /**
     * @classdesc The renderer for the custom control <i>com.zespri.awct.control.FacetFilterNumberInputList</i>.
     * @class
     * @name com.zespri.awct.control.FacetFilterNumberInputListRenderer
     */
    com.zespri.awct.control.FacetFilterNumberInputListRenderer = {};

    /**
     * The standard render method.
     * 
     * @param {Object}
     *            oRm The render manager.
     * @param {sap.ui.core.Control}
     *            oControl The corresponding control instance reference.
     */
    com.zespri.awct.control.FacetFilterNumberInputListRenderer.render = function(oRm, oControl) {
        // Create the individual controls
        var oMainLayout = new sap.ui.layout.VerticalLayout().addStyleClass("zAwctFacetFilterInputListVerticalLayoutMargin");
        var oInnerLayout = new sap.ui.layout.HorizontalLayout({
            width : "100%"
        }).addStyleClass("zAwctFacetFilterInputListHorizontalLayoutAdjustment");

        var oLabel = new sap.m.Label({
            text : com.zespri.awct.util.I18NHelper.getText("TXT_FACET_FILTER_NUMBER_INPUT_LIST_LABEL")
        });

        // Get this control instance's associated date input control (association)
        var oNumberInput = sap.ui.getCore().byId(oControl.getNumberInput());
        var oClearButton = new sap.m.Button({
            icon : "sap-icon://sys-cancel",
            tooltip : com.zespri.awct.util.I18NHelper.getText("TXT_FACET_FILTER_NUMBER_INPUT_LIST_CLEAR_TOOLTIP")
        }).attachPress(jQuery.proxy(oControl._handleClearButtonPress, oControl));

        // Add content to layout
        oInnerLayout.addContent(oNumberInput).addContent(oClearButton);
        oMainLayout.addContent(oLabel).addContent(oInnerLayout);

        // Render!
        oRm.renderControl(oMainLayout);
    };
})();