(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.control.FacetFilterCheckboxListRenderer");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");

    /**
     * @classdesc The renderer for the custom control <i>com.zespri.awct.control.FacetFilterCheckboxList</i>.
     * @class
     * @name com.zespri.awct.control.FacetFilterCheckboxListRenderer
     */
    com.zespri.awct.control.FacetFilterCheckboxListRenderer = {};

    /**
     * The standard render method.
     * 
     * @param {Object}
     *            oRm The render manager.
     * @param {sap.ui.core.Control}
     *            oControl The corresponding control instance reference
     */
    com.zespri.awct.control.FacetFilterCheckboxListRenderer.render = function(oRm, oControl) {
        // Create the individual controls
        var oMainLayout = new sap.ui.layout.VerticalLayout().addStyleClass("zAwctFacetFilterInputListVerticalLayoutMargin");
        var oInnerLayout = new sap.ui.layout.HorizontalLayout({
            width : "100%"
        }).addStyleClass("zAwctFacetFilterInputListHorizontalLayoutAdjustment");

        // Get this control instance's associated date input control (association)
        var oCheckboxInput = sap.ui.getCore().byId(oControl.getCheckboxInput());

        // Add content to layout
        oInnerLayout.addContent(oCheckboxInput);
        oMainLayout.addContent(oInnerLayout);

        // Render!
        oRm.renderControl(oMainLayout);
    };
})();
