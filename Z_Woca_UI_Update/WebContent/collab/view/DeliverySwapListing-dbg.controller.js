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

    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");

    /**
     * This the view controller of delivery Swap Listing.
     * 
     * @class
     * @name com.zespri.awct.collab.view.DeliverySwapListing
     */
    com.zespri.awct.core.Controller.extend("com.zespri.awct.collab.view.DeliverySwapListing",
    /** @lends com.zespri.awct.collab.view.DeliverySwapListing */
    {
        // Reference for View Settings dialog .
        _oViewSettingsDialog : null,
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it
         * is displayed, to bind event handlers and do other one-time initialization.
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapListing
         */
        onInit : function() {
            // create season filter with current season as selected
            this._bindItemsToSeasonFacetList();
        },

        /**
         * This method is used to bind items to the table and called whenever facet filter list item is changed .
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.DeliverySwapListing
         */
        _refreshTable : function() {
            var oTable = this.byId("deliverySwapListTable");
            var aFacetFilterLists = this.byId("facetFilterDeliverySwap").getLists();
            var oController = this;

            // Create filters based on facet filter selections
            // aInnerFilters -> Represents the filters created for each selection WITHIN a facet list. Multiple selections within the same list need
            // to be 'OR'ed together.
            // aOuterFilters -> Represents the filters created for each list. These need to be 'AND'ed together.
            var aOuterFilters = [];
            var aBindingFilters = [];
            $.each(aFacetFilterLists, function(i, oList) {
                if (oList.getSelectedItems().length > 0) {
                    var aInnerFilters = [];
                    $.each(oList.getSelectedItems(), function(j, oSelectedItem) {
                        if (oList === oController.byId("facetFilterListDateWeekFrom")) {
                            aInnerFilters.push(new sap.ui.model.Filter(oList.getKey(), "GT", oSelectedItem.getKey()));
                        } else if (oList === oController.byId("facetFilterListDateWeekTo")) {
                            aInnerFilters.push(new sap.ui.model.Filter(oList.getKey(), "LT", oSelectedItem.getKey()));
                        } else {
                            aInnerFilters.push(new sap.ui.model.Filter(oList.getKey(), "EQ", oSelectedItem.getKey()));
                        }
                    });
                    aOuterFilters.push(new sap.ui.model.Filter(aInnerFilters, false)); // 'OR' the selected items.
                }
            });

            if (aOuterFilters.length > 0) {
                aBindingFilters.push(new sap.ui.model.Filter(aOuterFilters, true));
            }
            // Create the binding object
            var oBindingInfo = {
                path : '/DeliverySwapSet',
                template : oTable.getBindingInfo("items") ? oTable.getBindingInfo("items").template : oTable.getItems()[0].clone(),
                filters : aBindingFilters
            };

            // Bind items to the table based on the binding info object
            oTable.bindItems(oBindingInfo);
        },

        /**
         * This method is used to bind items on facet filter list after successful read from function import .
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.DeliverySwapListing
         * @param {JSON}
         *            oJSONModel
         * @param {sap.m.FacetFilterList}
         *            oFacetFilterList
         */
        _bindResultOnSuccess : function(oJSONModel, oFacetFilterList) {
            // Success
            oFacetFilterList.setModel(oJSONModel);
            oFacetFilterList.bindItems({
                path : "/results",
                template : oFacetFilterList.getBindingInfo("items")
                        ? oFacetFilterList.getBindingInfo("items").template
                        : oFacetFilterList.getItems()[0].clone()
            });
        },

        /**
         * This method will triggered when table row is selected and it will navigate to Swap details page .
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapListing
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        handleTableItemPress : function(oEvent) {
            // Get the selected binding context
            var oSelectedItemContext = oEvent.getSource().getSelectedItem().getBindingContext();
            this.getRouter().navTo("Collaboration/DeliverySwapDetails", {
                contextPath : oSelectedItemContext.getPath().substr(1)
            });

        },

        /**
         * This method will be triggered when Add records is pressed and it will navigate to Initiate Swap.
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapListing
         */
        handeleNavToSwapCreate : function() {
            this.getRouter().navTo("Collaboration/DeliverySwapCreate");
        },

        /**
         * This method will bind items to the season list during onInit and set the current season as selected by default.
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapListing
         */
        _bindItemsToSeasonFacetList : function() {
            var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;
            var oController = this;

            // Preparing Season Facet Filter List
            var oSeasonList = this.byId("facetFilterListSeason");
            oSeasonList.setBusy(true);
            
            // Create the object with current Season to be selected
            var oCurrentSeasonKey = {};
            
            if (!oSeasonList.getBinding("items")) {
                com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GenericSearchSet", {
                    urlParameters : {
                        "$filter" : "Scenario eq 'SEASON'"
                    }
                }, function(oModel) {
                    // Success
                    oController._bindResultOnSuccess(oModel, oSeasonList);
                    oCurrentSeasonKey[sCurrentSeason] = sCurrentSeason;
                    if (oSeasonList.getItems().length) {
                        oSeasonList.setSelectedKeys(oCurrentSeasonKey);
                    }
                    oSeasonList.setBusy(false);
                    // Bind the table with default filters , table items are created in controller to get the default selected filters from the facet
                    // filters
                    oController._refreshTable();
                });   
            }else{
                // this module is called when facet filter reset icon is pressed ....
                oCurrentSeasonKey[sCurrentSeason] = sCurrentSeason;
                if (oSeasonList.getItems().length) {
                    oSeasonList.setSelectedKeys(oCurrentSeasonKey);
                }
                oSeasonList.setBusy(false);   
                // Bind the table with default filters , table items are created in controller to get the default selected filters from the facet
                // filters
                oController._refreshTable();
            }
        },
        /**
         * This will be triggered when facet filter is opened . This method is used to create the JSON Model and bind it to the respective filter
         * lists.
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapListing
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        handleFacetFilterOpen : function(oEvent) {
            // find the key of selected facet filter list
            var sSelectedFilterListKey = oEvent.getSource().getKey();
            var oController = this;
            var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;
            var oSeasonSelectedItem = this.byId("facetFilterListSeason").getSelectedItem();
            var sSelectedSeason;

            if (oSeasonSelectedItem) {
                sSelectedSeason = oSeasonSelectedItem.getKey();
            } else {
                sSelectedSeason = sCurrentSeason;
            }

            // If opened list is season
            if (sSelectedFilterListKey === "SourceShipmentID") {
                // Preparing SourceShipment Facet Filter List
                var oSourceShipmentIDList = this.byId("facetFilterListShipmentFrom");
                oSourceShipmentIDList.setBusy(true);
                // Check whether the list is already binded with the model else create JSON Model and bind it to it.
                if (!oSourceShipmentIDList.getBinding("items")) {
                    oSourceShipmentIDList.setBusy(true);
                    com.zespri.awct.util.ModelHelper.getJSONModelForRead("/ShipmentSet", {
                        urlParameters : {
                            "$select" : "ShipmentID",
                            "$filter" : "Season eq '" + sSelectedSeason + "'"
                        }
                    }, function(oModel) {
                        // Success
                        oController._bindResultOnSuccess(oModel, oSourceShipmentIDList);
                        oSourceShipmentIDList.setBusy(false);
                    });
                } else {
                    oSourceShipmentIDList.setBusy(false);
                }
            } else if (sSelectedFilterListKey === "TargetShipmentID") {
                // Preparing targetShipment Facet Filter List
                var oTargetShipmentIDList = this.byId("facetFilterListShipmentTo");
                oTargetShipmentIDList.setBusy(true);
                // Check whether the list is already binded with the model else create JSON Model and bind it to it.
                if (!oTargetShipmentIDList.getBinding("items")) {
                    oTargetShipmentIDList.setBusy(true);
                    com.zespri.awct.util.ModelHelper.getJSONModelForRead("/ShipmentSet", {
                        urlParameters : {
                            "$select" : "ShipmentID",
                            "$filter" : "Season eq '" + sSelectedSeason + "'"
                        }
                    }, function(oModel) {
                        // Success
                        oController._bindResultOnSuccess(oModel, oTargetShipmentIDList);
                        oTargetShipmentIDList.setBusy(false);
                    });
                } else {
                    oTargetShipmentIDList.setBusy(false);
                }
            }
        },

        /**
         * This method will be triggered when the facet filterList is closed . This method will Create the JSON Model for shipment based on the season
         * filters.
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapListing
         */
        handleFacetFilterClose : function() {
            var oFacetFilter = this.byId("facetFilterDeliverySwap");
            // Get the selected Key
            var bFacetFilterModified = oFacetFilter.getFiltersModifiedAfterListOpen();

            // Check whether the facet filter list is modified .
            // If no , return from the function.
            if (!bFacetFilterModified) {
                return;
            }
            // Filter selections might have changed. Refresh the table.
            this.byId("deliverySwapListTable").setBusy(true);
            this._refreshTable();
        },

        /**
         * This method will triggered when filter reset button is clicked and it will reset the applied filters .
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapListing
         */
        handleFacetFilterReset : function() {
            // Reset all lists within the facet filter
            var oFacetFilter = this.byId("facetFilterDeliverySwap");
            var aFacetFilterLists = oFacetFilter.getLists();
            var oController = this;
            
            jQuery.each(aFacetFilterLists, function(i, oList) {
                if(oList !== oController.byId("facetFilterListSeason")){
                    oList.setSelectedKeys();   
                }
            });
            // For Season List , select the current season after reset and bind items to the table based on current season.
            this._bindItemsToSeasonFacetList();
        },

        /**
         * This method will be triggered when Settings button on the table header is clicked and it will open the sorting dialog to sort the table
         * rows .
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapListing
         */
        handleViewSettingsDialogOpen : function() {
            // Getting the View Settings Dialog
            if (!this._oViewSettingsDialog) {
                this._oViewSettingsDialog = sap.ui.xmlfragment("com.zespri.awct.collab.fragment.DeliverySwapSettingsDialog", this);
                this._oViewSettingsDialog.setModel(this.getView().getModel());
                this._oViewSettingsDialog.setModel(this.getView().getModel("i18n"), "i18n");
            }
            this._oViewSettingsDialog.open();
        },

        /**
         * This method will be triggered when OK button is clicked in the view settings dialog (Sort) . This method will sort the table based on the
         * selected criteria's .
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapListing
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        handleViewSettingsDialogClose : function(oEvent) {
            // On clicking confirm in the ViewSettings Dialog
            var mParams = oEvent.getParameters();
            // Get the Sorting Items
            var aSorters = [];
            if (mParams.sortItem) {
                var sPath = mParams.sortItem.getKey();
                var bDescending = mParams.sortDescending;
                aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));

                // get the table bindings and apply sorters
                var oTable = this.byId("deliverySwapListTable");
                var oBinding = oTable.getBinding("items");
                oBinding.sort(aSorters);
            }

        }
    });
})();