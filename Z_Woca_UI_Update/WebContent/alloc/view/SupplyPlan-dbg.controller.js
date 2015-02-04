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
    jQuery.sap.require("com.zespri.awct.util.CommonHelper");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.CommonFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");

    /**
     * @classdesc This is the view controller for SupplyPlan. The Supply plan displays the period based and size based 
     * allocations across suppliers / materials based on the selected season and delivery 
     * 
     * @class
     * @name com.zespri.awct.alloc.view.SupplyPlan
     */
    com.zespri.awct.core.Controller
            .extend(
                    "com.zespri.awct.alloc.view.SupplyPlan",
                    /** @lends com.zespri.awct.alloc.view.SupplyPlan */
                    {

                        /**
                         * This method is called when the view is first created.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.SupplyPlan
                         */
                        onInit : function() {
                            /* Start of Instance Member initialization */
                            // Private filter object. This stores the current filter that is applied to the table
                            this._oFilter = null;
                            // Private variable to store DeliveryLine ID
                            this._sDeliveryLineID = null;
                            // Private Variable for delivery lineId filter
                            this.oDeliveryLineIDFilter = null;
                            // Private Instance variable for user authorization
                            this._bUserAuthorized = false;
                            // Private instance for storing last selected icon tab key(byDefult first icon tab bar will be selected)
                            this._sLastSelectedKey = "ViewAllocationShare";
                            /* End of Instance Member initialization */

                            var oController = this;
                            var oViewAllocationShareTable = this.byId("viewAllocationShareTable");
                            var oViewRatioPerSizeTable = this.byId("viewRatioPerSizeTable");

                            // Enable / Disable facet filter based on table loading
                            var oFacetFilter = this.byId("facetFilterSupplyPlan");
                            com.zespri.awct.util.CommonHelper.manageFacetFilterState(oViewAllocationShareTable, oFacetFilter);
                            com.zespri.awct.util.CommonHelper.manageFacetFilterState(oViewRatioPerSizeTable, oFacetFilter);
                            
                            // Manage NoData Texts , listen for table's update EVENT
                            com.zespri.awct.util.CommonHelper.manageNoDataText(oViewAllocationShareTable);
                            com.zespri.awct.util.CommonHelper.manageNoDataText(oViewRatioPerSizeTable);

                            this
                                    .getRouter()
                                    .attachRoutePatternMatched(
                                            function(oEvent) {
                                                // Check if the route is for the TrackOrders view
                                                if (oEvent.getParameter("name") === "Allocation/SupplyPlan") {
                                                    // Check the current user authorizations
                                                    if (!oController._bUserAuthorized) {
                                                        com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                                                .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));

                                                    } else {
                                                        // IF user is authorized .
                                                        var oURLArguments = oEvent.getParameter("arguments");
                                                        if (oURLArguments && oURLArguments.DeliveryLineID) {
                                                            oController.getView().setBusy(false);
                                                            oController._sDeliveryLineID = oURLArguments.DeliveryLineID;
                                                            oController.oDeliveryLineIDFilter = new sap.ui.model.Filter("DeliveryLineID",
                                                                    sap.ui.model.FilterOperator.EQ, oController._sDeliveryLineID);

                                                            // call function import
                                                            sap.ui.getCore().getRootComponent().getModel().read("/GetSupplyPlanParameters", {
                                                                urlParameters : {
                                                                    "DeliveryLineID" : "'" + oController._sDeliveryLineID + "'"

                                                                },
                                                                success : function(oData) {
                                                                    // Success
                                                                    oData.GetSupplyPlanParameters.DeliveryLineID = oController._sDeliveryLineID;
                                                                    var oJSONModel = new sap.ui.model.json.JSONModel();
                                                                    oJSONModel.setData(oData.GetSupplyPlanParameters);
                                                                    oController.byId("supplyPlanObjectHeader").setModel(oJSONModel);
                                                                },
                                                                error : function(oError) {
                                                                    // Error Handler
                                                                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                                                }
                                                            });

                                                            // Get current table
                                                            var oTable = null;
                                                            var oBindingItems = {};
                                                            switch (oController.byId("supplyPlanIconTabBar").getSelectedKey()) {
                                                                case "ViewAllocationShare" :
                                                                    oTable = oViewAllocationShareTable;
                                                                    this.byId("facetFilterListSize").setEnabled(false);
                                                                    this.byId("facetFilterListPeriod").setEnabled(true);
                                                                    oBindingItems = {
                                                                        path : "/SupplyPlanAllocationShareSet",
                                                                        template : oViewAllocationShareTable.getBindingInfo("items") ? oViewAllocationShareTable
                                                                                .getBindingInfo("items").template
                                                                                : oViewAllocationShareTable.getItems()[0].clone(),
                                                                        filters : [this.oDeliveryLineIDFilter]
                                                                    };
                                                                    break;
                                                                case "ViewRatioPerSize" :
                                                                    oTable = oViewRatioPerSizeTable;
                                                                    this.byId("facetFilterListSize").setEnabled(true);
                                                                    this.byId("facetFilterListPeriod").setEnabled(false);
                                                                    oBindingItems = {
                                                                        path : "/SupplyPlanRatioSet",
                                                                        template : oViewRatioPerSizeTable.getBindingInfo("items") ? oViewRatioPerSizeTable
                                                                                .getBindingInfo("items").template
                                                                                : oViewRatioPerSizeTable.getItems()[0].clone(),
                                                                        filters : [this.oDeliveryLineIDFilter]
                                                                    };
                                                                    break;
                                                            }
                                                            // Bind items to the table
                                                            oTable.bindAggregation("items", oBindingItems);

                                                        } else {
                                                            // If page is refreshed , then delivery line id context will not be available . Show error
                                                            // toast
                                                            com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                                                    .getText("TXT_ALLCOATION_SUPPLY_PLAN_NO_DELIVERY_LINE_ID_ERROR_TEXT"));
                                                            oController.getView().setBusy(true);
                                                        }
                                                    }

                                                }
                                            }, this);
                        },
                        /**
                         * This method will be called before rendering the View.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.SupplyPlan
                         */
                        onBeforeRendering : function() {
                            // Check User Authorizations
                            if (!com.zespri.awct.util.CommonHelper
                                    .isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                                            com.zespri.awct.util.Enums.AuthorizationObject.Allocation,
                                            com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)) {
                                if (this.byId("pageSupplyPlan")) {
                                    this.byId("pageSupplyPlan").destroy();
                                }
                                this._bUserAuthorized = false;
                            } else {
                                this._bUserAuthorized = true;
                            }
                        },
                        /**
                         * This method is called when a Facet filter item is pressed
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The Event object
                         * 
                         * @memberOf com.zespri.awct.alloc.view.SupplyPlan
                         */
                        handleListOpen : function(oEvent) {
                            var sSelectedFilterListKey = oEvent.getSource().getKey();
                            var oFilterDetails = {};

                            switch (sSelectedFilterListKey) {
                                case "Season" :
                                    // Preparing Item Group Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListSupplyPlanSeason");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'SEASON'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Supplier" :
                                    // Preparing Supplier Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListSupplyPlanSupplier");
                                    oFilterDetails.entitySetName = "SupplierSet";
                                    oFilterDetails.selectString = "SupplierID";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;
                                case "SizeCode" :
                                    // Preparing Size Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListSize");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'SIZE'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "SupplyPeriod" :
                                    // Preparing SupplyPeriod Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListPeriod");
                                    oFilterDetails.entitySetName = "GetSupplyPeriodsForSeason";
                                    oFilterDetails.urlParameter = {
                                        "Season" : "'" + sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason + "'"
                                    };
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;
                            }
                        },
                        /**
                         * This method is called when any facet filter list is closed. This groups all the selected filter criteria and passes to
                         * apply filter function
                         * 
                         * @memberOf com.zespri.awct.alloc.view.SupplyPlan
                         */
                        handleListClose : function() {
                            var oFacetFilter = this.byId("facetFilterSupplyPlan");
                            if (oFacetFilter.getFiltersModifiedAfterListOpen()) {
                                this._applyFacetFilters(true);
                            }
                        },

                        /**
                         * This method is called when the Reset button of the facet filter is pressed
                         * 
                         * @memberOf com.zespri.awct.alloc.view.SupplyPlan
                         */
                        handleFacetFilterReset : function() {
                            var oFacetFilter = this.byId("facetFilterSupplyPlan");

                            var aFacetFilterLists = oFacetFilter.getLists();

                            for ( var i = 0; i < aFacetFilterLists.length; i++) {
                                aFacetFilterLists[i].setSelectedKeys();
                            }

                            // Get the current table
                            var oTable = this._getCurrentTable();
                            // Remove Filter
                            oTable.getBinding("items").filter([this.oDeliveryLineIDFilter], sap.ui.model.FilterType.Application);
                            this._oFilter = null;
                        },

                        /**
                         * This is a private method which returns the currently shown table, based on the tab selected.
                         * @private
                         * @returns {sap.m.Table} oTable Current table object
                         * @memberOf com.zespri.awct.alloc.view.SupplyPlan
                         */
                        _getCurrentTable : function() {
                            // Get the current table
                            var oTable = null;
                            switch (this.byId("supplyPlanIconTabBar").getSelectedKey()) {
                                case "ViewAllocationShare" :
                                    oTable = this.byId("viewAllocationShareTable");
                                    break;
                                case "ViewRatioPerSize" :
                                    oTable = this.byId("viewRatioPerSizeTable");
                                    break;
                            }
                            return oTable;
                        },

                        /**
                         * This method is called when the user navigates from one tab to the other
                         * 
                         * @memberOf com.zespri.awct.alloc.view.SupplyPlan
                         */
                        handleNavigateToAnotherTab : function() {
                            var oController = this;
                            var oPeriodFilterList = this.byId("facetFilterListPeriod");
                            var oSizeFilterList = this.byId("facetFilterListSize");

                            // If navigating to view ratio per size table
                            if ((oController.byId("supplyPlanIconTabBar").getSelectedKey() === "ViewRatioPerSize") &&
                                    (this._sLastSelectedKey !== "ViewRatioPerSize")) {
                                this._sLastSelectedKey = "ViewRatioPerSize";
                                oSizeFilterList.setEnabled(true);
                                oPeriodFilterList.setEnabled(false);

                                // If navigating for the first time
                                if (!oController.byId("viewRatioPerSizeTable").getBinding("items")) {
                                    // Binding for view ratio per size table
                                    var oBindingItems = {
                                        path : "/SupplyPlanRatioSet",
                                        template : oController.byId("viewRatioPerSizeTable").getBindingInfo("items") ? oController.byId(
                                                "viewRatioPerSizeTable").getBindingInfo("items").template : oController.byId("viewRatioPerSizeTable")
                                                .getItems()[0].clone()
                                    };

                                    this._applyFacetFilters(false);

                                    if (this._oFilter) {
                                        oBindingItems.filters = [this._oFilter];
                                    } else {
                                        oBindingItems.filters = [this.oDeliveryLineIDFilter];
                                    }
                                    // Bind view ratio per size table
                                    oController.byId("viewRatioPerSizeTable").bindAggregation("items", oBindingItems);

                                } else {
                                    this._applyFacetFilters(true);
                                }
                            } else if ((oController.byId("supplyPlanIconTabBar").getSelectedKey() === "ViewAllocationShare") &&
                                    (this._sLastSelectedKey !== "ViewAllocationShare")) {
                                this._sLastSelectedKey = "ViewAllocationShare";
                                oPeriodFilterList.setEnabled(true);
                                oSizeFilterList.setEnabled(false);

                                this._applyFacetFilters(true);
                            } else {
                                return;
                            }
                            this.byId("facetFilterSupplyPlan").rerender();
                        },

                        /**
                         * This is a private method used to apply the facet filter for the current table
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.SupplyPlan
                         * @param {Boolean}
                         *          bApplyFilters Flag to indicate bind filters to the table. 
                         *                        True - bind items to table ,
                         *                        False - Form filters from facet filter and copy it to _oFilter instance variable.
                         */
                        _applyFacetFilters : function(bApplyFilters) {

                            var oTable = this._getCurrentTable();
                            var oController = this;
                            var oFacetFilter = this.byId("facetFilterSupplyPlan");
                            var aFacetFilterLists = oFacetFilter.getLists()
                                    .filter(
                                            function(oList) {
                                                if ((oController.byId("supplyPlanIconTabBar").getSelectedKey() === "ViewRatioPerSize" && oList
                                                        .getKey() !== "SupplyPeriod") ||
                                                        (oController.byId("supplyPlanIconTabBar").getSelectedKey() === "ViewAllocationShare" && oList
                                                                .getKey() !== "SizeCode")) {
                                                    return (oList.getActive() && oList.getSelectedItems().length);
                                                }
                                            });

                            // Create a filter from the selected fields
                            var oFilter = new sap.ui.model.Filter(aFacetFilterLists.map(function(oList) {
                                return new sap.ui.model.Filter(oList.getSelectedItems().map(function(oItem) {
                                    var sSelectedFilterKey = oList.getKey();
                                    var sItemValue = oItem.getKey();
                                    var oFilter = new sap.ui.model.Filter(sSelectedFilterKey, "EQ", sItemValue);
                                    return oFilter;
                                }), false);
                            }), true);

                            // If there are no fields selected in the facet filter, make the facet filter as null
                            var oMultiFilter;
                            if (!(oFilter.aFilters.length)) {
                                oFilter = null;
                                oMultiFilter = this.oDeliveryLineIDFilter;
                            } else {
                                oMultiFilter = new sap.ui.model.Filter([this.oDeliveryLineIDFilter, oFilter], true);
                            }

                            // Apply Filter
                            if (bApplyFilters) {
                                oTable.getBinding("items").filter(oMultiFilter, sap.ui.model.FilterType.Application);
                            }

                            // Store the applied filter
                            this._oFilter = oMultiFilter;
                        },
                        /**
                         * Event handler for 'title press' event of delivery ObjectHeader
                         * 
                         * @memberOf com.zespri.awct.alloc.view.SupplyPlan
                         */
                        handleObjectHeaderTitlePress : function() {
                            // Toggle between condensed=true and condensed=false here.
                            var oObjectHeader = this.byId("supplyPlanObjectHeader");
                            var bCondensed = oObjectHeader.getCondensed();
                            oObjectHeader.setCondensed(!bCondensed);
                        }
                    });
})();