/*----------------------------------------------------------------------* 
 * Copyright  (c) 2014 SAP SE. All rights reserved	
 * Author       : SAP Custom Development 
 *----------------------------------------------------------------------*/ 
	(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });
    /**
     * @classdesc This is the view controller for master and detail pages .
     * It act as Container for the whole Delivery WorkList process and create the fragment (contains split container) to place it in page control.
     * Fragment is created for splitContainer to assign Fixed target Control ID to the routing configuration.
     *  
     * @class
     * @name com.zespri.awct.alloc.view.DeliveryWorkList 
     */
    com.zespri.awct.core.Controller.extend("com.zespri.awct.alloc.view.DeliveryWorkList", /** @lends com.zespri.awct.shell.view.DeliveryWorkList */
    {

        /**
         * Called when a controller is instantiated and its View controls (if available) are already created.
         * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
         * @memberOf com.zespri.awct.alloc.view.DeliveryWorkList
         */
        onInit : function() {
            /* START of instance member initialization */
            // Private instance for Split Container Fragment
            this._oSplitContainer = null;
            /* END of instance member initialization */
            
            // Creating splitContainer in xml view itself creates runtime ID , mapping to the target control is not possible.
            // So Split Container is created in separate fragment to assign fixed ID for mapping it to the target control in routing.
            if (!this._oSplitContainer) {
                //Create the SplitContainer Fragment and add it to the page
                this._oSplitContainer = new sap.ui.xmlfragment("com.zespri.awct.alloc.fragment.DeliveryWorkListSplitContainer", this);
                this.getView().addDependent(this._oSplitContainer);
                var oPage = this.byId("deliveryWorkList");
                oPage.addContent(this._oSplitContainer);
            }
        }
    });
})();
