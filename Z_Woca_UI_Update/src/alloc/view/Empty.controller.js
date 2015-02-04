(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    
    /**
     * @classdesc This Empty controller will be used for no items available in the DeliveryWorkList with message.
     * 
     * @class
     * @name com.zespri.awct.alloc.view.Empty
     */
    com.zespri.awct.core.Controller.extend("com.zespri.awct.alloc.view.Empty", /** @lends com.zespri.awct.shell.view.Empty */
    {
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created.
         * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
         * 
         * @memberOf com.zespri.awct.alloc.view.Empty
         */

        onInit : function() {
            // Check the incoming Route 
            this.getRouter().attachRoutePatternMatched(function(oEvent) {
                if (oEvent.getParameter("name") === "Allocation/DeliveryWorkList/NoResults") {
                    var oArguments = oEvent.getParameter("arguments");
                    this.setTitleAndMessage(oArguments.viewTitle, oArguments.infoText);
                }
            }, this);

        },
        
        /**
         * 
         * This method will set the title and message in the empty view .
         * 
         * @memberOf com.zespri.awct.alloc.view.Empty
         * @param {String}
         *        sViewTitle Title for the Page Header
         * @param {String}
         *        sInfoText  Text information to be displayed in the view 
         */

        setTitleAndMessage : function(sViewTitle, sInfoText) {
            var oPage = this.byId("emptyViewPage");
            if (sViewTitle) {
                oPage.setTitle(sViewTitle);
            } else {
                oPage.setTitle(com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_DELIVERYWORKLIST_EMPTY_VIEW_TITLE"));
            }
            var oLabel = this.byId("emptyLabel");
            if (sInfoText) {
                oLabel.setText(sInfoText);
            } else {
                oLabel.setText(com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_DELIVERYWORKLIST_EMPTY_INFO_TEXT"));
            }
        }
    });
})();
