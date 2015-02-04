(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });
    jQuery.sap.require("com.zespri.awct.util.CommonHelper");
    jQuery.sap.require("com.zespri.awct.util.Enums");

    /**
    * @classdesc This is primary container for the application hosting the unified shell and the entire application
    * @class com.zespri.awct.shell.view.AppContainer
    * @name 
    */
    com.zespri.awct.core.Controller.extend("com.zespri.awct.shell.view.AppContainer", /** @lends com.zespri.awct.shell.view.AppContainer */
    {

        /**
         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it
         * is displayed, to bind event handlers and do other one-time initialization.
         * 
         * On load of this view, the Unified Shell's pane is displayed.
         * 
         * @memberOf com.zespri.awct.alloc.view.AppContainer
         */
        onInit : function() {
            // Private variable for Shell
            this._oShell = this.byId("unifiedShell");

            // Private object to store the ids of standard list item and target view names
            this._mTargetRoutes = {
                "launchPad" : "/",
                "deliveryLines" : "Allocation/DeliveryWorkList",
                "supplierOrderListing" : "Collaboration/SupplierOrders",
                "findOrders" : "Collaboration/SearchForm",
                "trackOrders" : "Collaboration/TrackOrders",
                "trackOrdersSearchForm" : "Collaboration/TrackOrdersSearchForm",
                "tradeListing" : "Collaboration/TradeOpportunities",
                "printOrders" : "Collaboration/PrintOrders",
                "generateReports" : "Reports/GenerateReports",
                "deliverySwapListing" : "Allocation/DeliverySwapListing",
                "generatePerformanceReportsItem" : "Reporting/GeneratePerformanceReports",
                "timeBasedRateMaintenanceItem" : "Administration/TimeBasedRateMaintenance",
                "exceptionRateMaintenanceItem" : "Administration/ExceptionRateMaintenance",
                "maintainSchedulesRatesItem" : "Administration/ScheduleRates",
                "maintainLibraryTextItem" : "Administration/MaintainLibraryText"
            };

            // As this is the parent view, the Root Component is null. Hence, this.getRouter() returns null
            this.getView().getViewData().oComponent.getRouter().attachRoutePatternMatched(function(oEvent) {
                var sTargetRoute = oEvent.getParameter("name");
                var sNavigationItemKey = "launchPad";
                jQuery.each(this._mTargetRoutes, function(key, value) {
                    if (jQuery.sap.startsWith(sTargetRoute, value)) {
                        sNavigationItemKey = key;
                    }
                });
                this.byId(sNavigationItemKey).setSelected(true);
            }, this);

        },

        /**
         * This method is called before rendering the view.
         * 
         * @memberOf com.zespri.awct.alloc.view.AppContainer
         */
        onBeforeRendering : function() {

            // Allocation WorkArea
            if (com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                    com.zespri.awct.util.Enums.AuthorizationObject.Allocation, com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP) ||
                    com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                            com.zespri.awct.util.Enums.AuthorizationObject.Allocation, com.zespri.awct.util.Enums.AuthorizationFunctions.All)) {
                // Allocation
                this.byId("allocationGroupHeader").setVisible(true);
                this.byId("deliveryLines").setVisible(true);
                this.byId("deliverySwapListing").setVisible(true);

                // Collaboration - Supplier orders and track orders
                this.byId("collaborationGroupHeader").setVisible(true);
                this.byId("supplierOrderListing").setVisible(true);
                this.byId("findOrders").setVisible(true);
                this.byId("trackOrders").setVisible(true);
                this.byId("trackOrdersSearchForm").setVisible(true);
            }

            // Collaboration WorkArea
            if (com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration, com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP) ||
                    com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                            com.zespri.awct.util.Enums.AuthorizationObject.Collaboration, com.zespri.awct.util.Enums.AuthorizationFunctions.All)) {
                this.byId("collaborationGroupHeader").setVisible(true);
                this.byId("supplierOrderListing").setVisible(true);
                this.byId("findOrders").setVisible(true);
                this.byId("tradeListing").setVisible(true);
                this.byId("trackOrders").setVisible(true);
                this.byId("trackOrdersSearchForm").setVisible(true);
                this.byId("printOrders").setVisible(true);

            }

            // Administration WorkArea
            if (com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                    com.zespri.awct.util.Enums.AuthorizationObject.Administration, com.zespri.awct.util.Enums.AuthorizationFunctions.ZADM) ||
                    com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                            com.zespri.awct.util.Enums.AuthorizationObject.Administration, com.zespri.awct.util.Enums.AuthorizationFunctions.All)) {
                this.byId("administrationGroupHeader").setVisible(true);
                this.byId("maintainSchedulesRatesItem").setVisible(true);
                this.byId("timeBasedRateMaintenanceItem").setVisible(true);
                this.byId("exceptionRateMaintenanceItem").setVisible(true);
                this.byId("maintainLibraryTextItem").setVisible(true);

            }

            // Reports WorkArea
            if (com.zespri.awct.util.CommonHelper.isUserAuthorized(null, com.zespri.awct.util.Enums.AuthorizationObject.Reports, null)) {
                this.byId("reportGroupHeader").setVisible(true);
                this.byId("generateReports").setVisible(true);
            }
        },
        /**
         * This method is called after rendering the view. The Dashboard is initially selected
         * 
         * @memberOf com.zespri.awct.alloc.view.AppContainer
         */
        onAfterRendering : function() {
            this.byId("launchPad").setSelected(true);
        },

        /**
         * Event handler for the side menu button. Toggles between showing/hiding the Unified Shell's pane.
         * 
         * @memberOf com.zespri.awct.alloc.view.AppContainer
         */
        handleToggleMenu : function() {
            this._oShell.setShowPane(!this._oShell.getShowPane());
        },

        /**
         * Event handler for the back button. Triggers a back-navigation on the Router.
         * 
         * @memberOf com.zespri.awct.alloc.view.AppContainer
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        handleNavigationBack : function() {

            this.getRouter().navBack();
        },

        /**
         * Event handler for the log out button. This method will trigger a navigation to logout service if successful.
         * 
         * @memberOf com.zespri.awct.alloc.view.AppContainer
         */
        handleLogOut : function() {
            var sConfirmDialogText = com.zespri.awct.util.I18NHelper.getText("TXT_SHELL_LOGOUT_CONFIRM");
            var sCancelToast = com.zespri.awct.util.I18NHelper.getText("TXT_SHELL_LOGOUT_CANCEL_TOAST");

            // Check if the current view is dirty.
            var bCurrentViewDirty = sap.ui.getCore().getRootComponent().isCurrentViewDirty() || false;

            // if dirty, then present a confirmation dialog to the user
            if (bCurrentViewDirty) {
                // Perform logoff if the user confirms. Else show a success toast and cancel the logoff process
                com.zespri.awct.util.NotificationHelper.showConfirmDialog(sConfirmDialogText, function() {
                    location.replace(com.zespri.awct.util.CommonHelper.getLogoffURL());
                }, function() {
                    com.zespri.awct.util.NotificationHelper.showSuccessToast(sCancelToast);
                });
            } else {
                // replace the location directly so as to perform an effective logoff.
                // This is required so that the cookies are cleared properly.
                location.replace(com.zespri.awct.util.CommonHelper.getLogoffURL());
            }
        },

        /**
         * Event handler for the list items on the Unified Shell's pane. Triggers a navigation to corresponding view in content area.
         * 
         * @memberOf com.zespri.awct.alloc.view.AppContainer
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        handleListItemPress : function(oEvent) {

            oEvent.getSource().setSelected(true);
            // Get the id of the StandardListItem
            var sSelectedItemKey = oEvent.getSource().getId();
            // Set Dashboard as the default
            var sTarget = "/";

            var oController = this;
            jQuery.each(this._mTargetRoutes, function(key, value) {
                if (oController.createId(key) === sSelectedItemKey) {
                    sTarget = value;
                }
            });

            this.getRouter().navTo(sTarget);
            this.handleToggleMenu();

        }
    });
})();
