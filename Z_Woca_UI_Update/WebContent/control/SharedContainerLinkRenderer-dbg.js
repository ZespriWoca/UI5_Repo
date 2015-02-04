/*----------------------------------------------------------------------* 
 * Copyright  (c) 2014 SAP SE. All rights reserved	
 * Author       : SAP Custom Development 
 *----------------------------------------------------------------------*/ 
	(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.control.SharedContainerLinkRenderer");
    jQuery.sap.require("sap.m.Link");

    /**
     * @classdesc The renderer function of the custom control com.zespri.awct.control.SharedContainerLink is included
     * 
     * @class 
     * @name com.zespri.awct.control.SharedContainerLink
     * @static
     */
    com.zespri.awct.control.SharedContainerLinkRenderer = {};

    /**
     * Renders the control, using the provided {@link sap.ui.core.RenderManager}
     * 
     * 
     * @param {sap.ui.core.RenderManager}
     *            oRm the RenderManager that can be used for writing to the render output buffer
     * @param {sap.ui.core.Control}
     *            oControl an object representation of the control that should be rendered
     */
    com.zespri.awct.control.SharedContainerLinkRenderer.render = function(oRm, oControl) {
        // Checking whether the Container is shared or not
        var bIsShared = false;
        if (oControl.getBindingContext()) {
            bIsShared = oControl.getBindingContext().getProperty('IsContainerShared');
        }
        // Writing control wrapper DIV
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.write(">");
        // if shared then rendering a Link with a style class and a press event
        if (bIsShared) {
            var oLink = new sap.m.Link({
                text : oControl.getText(),
                press : [oControl.handleLinkPress, oControl],
                tooltip : oControl.getTooltip()
            });
            // Adding style class to the link. Style is used to put dashed line for the Link
            oLink.addStyleClass("zAwctLinkDashedUnderline");

            // rendering the control
            oRm.renderControl(oLink);

        } else {
            // if not shared then a normal Text is rendered.
            oRm.renderControl(new sap.m.Text({
                text : oControl.getText(),
                tooltip : oControl.getTooltip()
            }));
        }

        // End of control wrapper DIV
        oRm.write("</div>");
    };
})();