(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.control.FacetFilterRenderer");
    jQuery.sap.require("sap.m.FacetFilterRenderer");

    /**
     * @classdesc The code is copied from the standard UI5 implementation of the FacetFilterRenderer, along with modifications that are marked with comments
     * ("CUSTOM CODE START" and "CUSTOM CODE END" comments)
     * 
     * @class 
     * @name com.zespri.awct.control.FacetFilter
     * @static
     */
    com.zespri.awct.control.FacetFilterRenderer = {};

    /**
     * Renders the control, using the provided {@link sap.ui.core.RenderManager}
     * 
     * @param {sap.ui.core.RenderManager}
     *            oRm the RenderManager that can be used for writing to the render output buffer
     * @param {sap.ui.core.Control}
     *            oControl an object representation of the control that should be rendered
     */
    com.zespri.awct.control.FacetFilterRenderer.render = function(oRm, oControl) {
        // Return immediately if control is invisible
        if (!oControl.getVisible()) {
            return;
        }

        switch (oControl.getType()) {
            case sap.m.FacetFilterType.Simple :
                com.zespri.awct.control.FacetFilterRenderer.renderSimpleFlow(oRm, oControl);
                break;
            case sap.m.FacetFilterType.Light :
                com.zespri.awct.control.FacetFilterRenderer.renderSummaryBar(oRm, oControl);
                break;
        }
    };

    /**
     * Renders the control for type 'Simple'
     * 
     * @param {sap.ui.core.RenderManager}
     *            oRm the RenderManager that can be used for writing to the render output buffer
     * @param {sap.ui.core.Control}
     *            oControl an object representation of the control that should be rendered
     */
    com.zespri.awct.control.FacetFilterRenderer.renderSimpleFlow = function(oRm, oControl) {

        oRm.write("<div");
        // ---- CUSTOM CODE START ------------------------------
        // get the disabled info text
        var sDisabledText = oControl.getDisabledText();
        // if control is to be set as disabled, then set the title i.e tooltip for the facet filter.
        if (!oControl.getEnabled()) {
            oRm.writeAttributeEscaped("title", sDisabledText);
        }
        // ---- CUSTOM CODE END ----------------------------------
        oRm.writeControlData(oControl);
        oRm.addClass("sapMFF");

        if (oControl.getShowSummaryBar()) {

            oRm.write(">");
            sap.m.FacetFilterRenderer.renderSummaryBar(oRm, oControl);
        } else {

            if (oControl._lastScrolling) {

                oRm.addClass("sapMFFScrolling");
            } else {

                oRm.addClass("sapMFFNoScrolling");
            }

            if (oControl.getShowReset()) {

                oRm.addClass("sapMFFResetSpacer");
            }
            oRm.writeClasses();
            oRm.write(">");

            if (sap.ui.Device.system.desktop) {
                oRm.renderControl(oControl._getScrollingArrow("left"));
            }

            // Render the div for the carousel
            oRm.write("<div");
            oRm.writeAttribute("id", oControl.getId() + "-head");
            oRm.writeControlData(oControl);
            oRm.addClass("sapMFFHead");
            oRm.writeClasses();
            oRm.write(">");

            var aLists = oControl._getSequencedLists();
            for ( var i = 0; i < aLists.length; i++) {
                // ---- CUSTOM CODE START: The check for the 'showInFacetFilterBar' property has been added.
                if (aLists[i].getShowInFacetFilterBar()) {

                    oRm.renderControl(oControl._getButtonForList(aLists[i]));

                    if (oControl.getShowPersonalization()) {
                        oRm.renderControl(oControl._getFacetRemoveIcon(aLists[i]));
                    }
                }
                // ---- CUSTOM CODE END
            }

            if (oControl.getShowPersonalization()) {
                
                // CUSTOM CODE START ----
                // Get the more filter button reference 
                var oMoreFiltersButton = oControl.getAggregation("addFacetButton");
                // Flag to indicate whether secondary filters applied
                var bSecondaryFiltersActive = false;
                
                $.each(aLists, function(i, oList) {
                    if (oList.getProperty("filterApplied") === true && oList.getProperty("showInFacetFilterBar") === false) {
                        bSecondaryFiltersActive = true;
                        return false;
                    }
                });
                
                // If secondary filters applied , change the style and tooltip of moreFilters Button
                if (bSecondaryFiltersActive) {
                    oMoreFiltersButton.addStyleClass("zAwctSecondaryFiltersApplied");
                    oMoreFiltersButton.setTooltip(com.zespri.awct.util.I18NHelper.getText("TXT_FACET_FILTER_SECONDARY_FILTERS_APPLIED_MORE_BUTTON_TOOLTIP"));
                } else {
                    oMoreFiltersButton.removeStyleClass("zAwctSecondaryFiltersApplied");
                    oMoreFiltersButton.setTooltip(com.zespri.awct.util.I18NHelper.getText("TXT_FACET_FILTER_MORE_TOOLTIP"));
                }
                oRm.renderControl(oMoreFiltersButton);
                
                // ---- CUSTOM CODE END
            }
            oRm.write("</div>"); // Close carousel div

            if (sap.ui.Device.system.desktop) {
                oRm.renderControl(oControl._getScrollingArrow("right"));
            }

            if (oControl.getShowReset()) {

                oRm.write("<div");
                oRm.addClass("sapMFFResetDiv");
                oRm.writeClasses();
                oRm.write(">");
                oRm.renderControl(oControl.getAggregation("resetButton"));
                oRm.write("</div>");
            }
        }
        oRm.write("</div>");
    };

    /**
     * Renders the control for type 'Light'.
     * 
     * @param {sap.ui.core.RenderManager}
     *            oRm the RenderManager that can be used for writing to the render output buffer
     * @param {sap.ui.core.Control}
     *            oControl an object representation of the control that should be rendered
     */
    com.zespri.awct.control.FacetFilterRenderer.renderSummaryBar = function(oRm, oControl) {

        // We cannot just render the toolbar without the parent div. Otherwise it is
        // not possible to switch type from light to simple.
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.addClass("sapMFF");
        oRm.writeClasses();
        oRm.write(">");
        var oSummaryBar = oControl.getAggregation("summaryBar");
        oRm.renderControl(oSummaryBar);
        oRm.write("</div>");
    };
})();