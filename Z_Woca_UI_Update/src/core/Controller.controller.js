(function() {
    "use strict";
    jQuery.sap.declare({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });
    jQuery.sap.require("sap.ui.core.mvc.Controller");

    /**
     * @classdesc This is the application's custom MVC Controller. All controllers in the application are expected to extend this class. It introduces helper
     * methods and the 'dirty flag' that is used across the application.
     * 
     * @class
     * @name com.zespri.awct.core.Controller
     */
    sap.ui.core.mvc.Controller.extend("com.zespri.awct.core.Controller", /** @lends com.zespri.awct.core.Controller */
    {
        /**
         * Flag that indicates whether the view might have unsaved changes
         */
        bHasUnsavedChanges : false,

        /**
         * A helper method that returns an instance of the application component's router.
         * 
         * @memberOf com.zespri.awct.core.Controller
         * @returns {com.zespri.awct.core.Router}
         */
        getRouter : function() {
            return sap.ui.getCore().getRootComponent().getRouter();
        },

        /**
         * Setter for the <i>bHasUnsavedChanges</i> property.
         * 
         * @memberOf com.zespri.awct.core.Controller
         * @param {Boolean}
         *            bHasUnsavedChanges The value to set for the <i>bHasUnsavedChanges</i> member attribute.
         */
        setHasUnsavedChanges : function(bHasUnsavedChanges) {
            this.bHasUnsavedChanges = bHasUnsavedChanges;
            this.handleViewDirtyStateChanged(bHasUnsavedChanges);
        },

        /**
         * Getter for the <i>bHasUnsavedChanges</i> property.
         * 
         * @memberOf com.zespri.awct.core.Controller
         * @returns {Boolean}
         */
        getHasUnsavedChanges : function() {
            return this.bHasUnsavedChanges;
        },

        /**
         * Hook method that should be overridden by subclasses. Is called if the 'hasUnsavedChanges' property changes.
         * 
         * @param {Boolean}
         *            bDirty True if the view has unsaved changes, False if the view does not have unsaved changes.
         */
        handleViewDirtyStateChanged : function() {
            // Method stub. To be redefined by subclasses.
        }
    });
})();
