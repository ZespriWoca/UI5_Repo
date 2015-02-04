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
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");

    // TODO:Documentation
    com.zespri.awct.core.Controller.extend("com.zespri.awct.report.view.SupplyPlan",
    /** @lends com.zespri.awct.report.view.SupplyPlan */
    {

        /**
         * This method is called when the view is first created.
         * 
         * @memberOf com.zespri.awct.report.view.SupplyPlan
         */
        onInit : function() {
            // Private filter object. This stores the current filter that is applied to the table
            this._oFilter = null;

            var oController = this;
            var oViewAllocationShareTable = this.byId("viewAllocationShareTable");
            var oViewRatioPerSizeTable = this.byId("viewRatioPerSizeTable");

            // Manage NoData Texts , listen for table's update EVENT
            com.zespri.awct.util.CommonHelper.manageNoDataText(oViewAllocationShareTable);
            com.zespri.awct.util.CommonHelper.manageNoDataText(oViewRatioPerSizeTable);

            this.getRouter().attachRoutePatternMatched(function(oEvent) {
                // Check if the route is for the TrackOrders view
                if (oEvent.getParameter("name") === "Reports/SupplyPlan") {

                    // If the view is loaded for the first time
                    if ((!oViewAllocationShareTable.getBinding("items")) && (!oViewRatioPerSizeTable.getBinding("items"))) {

                        // Bind view allocation share table
                        // TODO:Change binding path for view allocation share table
                        oViewAllocationShareTable.bindAggregation("items", {
                            path : "/CollaborationLineSet",
                            template : oViewAllocationShareTable.getItems()[0].clone()
                        });
                    } else {
                        // Get current table
                        var oTable = null;
                        switch (oController.byId("supplyPlanIconTabBar").getSelectedKey()) {
                            case "ViewAllocationShare" :
                                oTable = oViewAllocationShareTable;
                                break;
                            case "ViewRatioPerSize" :
                                oTable = oViewRatioPerSizeTable;
                                break;
                        }
                        // Refresh the table
                        oTable.getBinding("items").refresh(true);
                    }
                }
            }, this);
        },
        /**
         * This method is called when a Facet filter item is pressed
         * 
         * @param {sap.ui.base.Event}
         *            oEvent The Event object
         * 
         * @memberOf com.zespri.awct.report.view.SupplyPlan
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

                case "SupplierID" :
                    // Preparing Supplier Facet Filter List
                    oFilterDetails.facetListControl = this.byId("facetFilterListSupplyPlanSupplier");
                    oFilterDetails.entitySetName = "SupplierSet";
                    oFilterDetails.selectString = "SupplierID";
                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                    break;
                case "D3_ItemGroup" :
                    // Preparing Item Group Facet Filter List
                    // TODO:Scenario ITEM GROUP needs to be verified
                    oFilterDetails.facetListControl = this.byId("facetFilterListSupplyPlanItemGroup");
                    oFilterDetails.entitySetName = "GenericSearchSet";
                    oFilterDetails.filterString = "Scenario eq 'ITEM_GROUP'";
                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                    break;

                case "D3_LoadPort" :
                    // Preparing Load Port Facet Filter List
                    oFilterDetails.facetListControl = this.byId("facetFilterListSupplyPlanLoadPort");
                    oFilterDetails.entitySetName = "PortSet";
                    oFilterDetails.filterString = "PortType eq 'L'";
                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                    break;

                case "D3_Origin" :
                    // Preparing Origin Facet Filter List
                    // TODO:Scenario ORIGIN needs to be verified
                    oFilterDetails.facetListControl = this.byId("facetFilterListSupplyPlanOrigin");
                    oFilterDetails.entitySetName = "GenericSearchSet";
                    oFilterDetails.filterString = "Scenario eq 'ORIGIN'";
                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                    break;

                case "D3_Characteristics/Variety" :
                    // Preparing Variety Facet Filter List
                    oFilterDetails.facetListControl = this.byId("facetFilterListSupplyPlanVariety");
                    oFilterDetails.entitySetName = "GenericSearchSet";
                    oFilterDetails.filterString = "Scenario eq 'VARIETY'";
                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                    break;

                case "D3_Characteristics/Class" :
                    // Preparing Class Facet Filter List
                    oFilterDetails.facetListControl = this.byId("facetFilterListSupplyPlanClass");
                    oFilterDetails.entitySetName = "GenericSearchSet";
                    oFilterDetails.filterString = "Scenario eq 'CLASS'";
                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                    break;

                case "D3_Characteristics/GrowingMethod" :
                    // Preparing Growing Method Facet Filter List
                    oFilterDetails.facetListControl = this.byId("facetFilterListSupplyPlanGrowingMethod");
                    oFilterDetails.entitySetName = "GenericSearchSet";
                    oFilterDetails.filterString = "Scenario eq 'GROWING_METHOD'";
                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                    break;
            }
        },
        /**
         * This method is called when any facet filter list is closed. This groups all the selected filter criteria and passes to apply filter
         * function
         * 
         * @memberOf com.zespri.awct.report.view.SupplyPlan
         */
        handleListClose : function() {
            var oFacetFilter = this.byId("facetFilterSupplyPlan");
            if (oFacetFilter.getFiltersModifiedAfterListOpen()) {
                this._applyFacetFilters();
            }
        },

        /**
         * This method is called when the Reset button of the facet filter is pressed
         * 
         * @memberOf com.zespri.awct.report.view.SupplyPlan
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
            oTable.getBinding("items").filter([], sap.ui.model.FilterType.Application);
            this._oFilter = null;
        },

        /**
         * This is a private method which returns the currently shown table, based on the tab selected.
         * 
         * @returns {sap.m.Table} oTable Current table object
         * 
         * @memberOf com.zespri.awct.report.view.SupplyPlan
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
         * @memberOf com.zespri.awct.report.view.SupplyPlan
         */
        handleNavigateToAnotherTab : function() {
            var oController = this;
            // If navigating to view ratio per size table
            if (oController.byId("supplyPlanIconTabBar").getSelectedKey() === "ViewRatioPerSize") {
                // If navigating for the first time
                if (!oController.byId("viewRatioPerSizeTable").getBinding("items")) {
                    // TODO: Change Binding path for view ratio per size table
                    var oBindingItems = {
                        path : "/AllocationLineSet",
                        template : oController.byId("viewRatioPerSizeTable").getItems()[0].clone()
                    };
                    if (this._oFilter) {
                        oBindingItems.filters = [this._oFilter];
                    }

                    // Bind view ratio per size table
                    oController.byId("viewRatioPerSizeTable").bindAggregation("items", oBindingItems);

                } else {
                    this._applyFacetFilters(this._oFilter);
                }
            } else {
                this._applyFacetFilters(this._oFilter);
            }
        },

        /**
         * This is a private method used to apply the facet filter for the current table
         * 
         * @memberOf com.zespri.awct.report.view.SupplyPlan
         * 
         */
        _applyFacetFilters : function(oNavigateFilter) {

            var oTable = this._getCurrentTable();

            // When navigating to the other tab
            if (oNavigateFilter) {
                // Filter
                oTable.getBinding("items").filter(oNavigateFilter, sap.ui.model.FilterType.Application);
            }
            // When selected from facet filter
            else {
                var oFacetFilter = this.byId("facetFilterSupplyPlan");
                var aFacetFilterLists = oFacetFilter.getLists().filter(function(oList) {
                    return (oList.getActive() && oList.getSelectedItems().length);
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
                if (!(oFilter.aFilters.length)) {
                    oFilter = null;
                }

                // Apply Filter
                oTable.getBinding("items").filter(oFilter, sap.ui.model.FilterType.Application);

                // Store the applied filter
                this._oFilter = oFilter;
            }
        }
    });
})();