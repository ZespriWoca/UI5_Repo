(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });
    jQuery.sap.require("com.zespri.awct.util.CommonHelper");
    jQuery.sap.require("com.zespri.awct.util.Enums");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");

    /**
     * @classdesc This TimeBasedRateMaintenance controller will be used to allow administrator to maintain rates for charges. These rates are used for
     *            all DIFOTIS calculations
     * 
     * @class
     * @name com.zespri.awct.admin.view.TimeBasedRateMaintenance
     */
    com.zespri.awct.core.Controller.extend("com.zespri.awct.admin.view.TimeBasedRateMaintenance", /** @lends com.zespri.awct.admin.view.TimeBasedRateMaintenance */
    {

        // Enum for Active Status
        _ActiveStatus : {
            Active : "Active",
            Inactive : "Inactive"
        },
        /**
         * This method is called when the view is first loaded.
         * 
         * @memberOf com.zespri.awct.admin.view.TimeBasedRateMaintenance
         */
        onInit : function() {
            /* START of instance member initialization */
            // Private variable for filter object
            this._oFilter = null;
            // Private Instance variable for user authorization
            this._bUserAuthorized = false;
            /* END of instance member initialization */

            var oController = this;
            var oTable = this.byId("timeBasedRateTable");

            // Enable / Disable facet filter based on table loading
            var oFacetFilter = this.byId("facetFilterTimeRateMaintenance");
            com.zespri.awct.util.CommonHelper.manageFacetFilterState(oTable, oFacetFilter);

            // Manage NoData Texts , listen for timeBasedRateTable update EVENT
            com.zespri.awct.util.CommonHelper.manageNoDataText(oTable);

            var oActiveList = this.byId("activeFacetList");
            // Prepare the Status facet filter
            var oActiveListModel = new sap.ui.model.json.JSONModel({
                values : [{
                    ActiveKey : oController._ActiveStatus.Active,
                    ActiveValue : com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_TIME_BASED_RATES_MAINTENANCE_FACET_FILTER_ITEM_ACTIVE")

                }, {
                    ActiveKey : oController._ActiveStatus.Inactive,
                    ActiveValue : com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_TIME_BASED_RATES_MAINTENANCE_FACET_FILTER_ITEM_INACTIVE")
                }]
            });
            oActiveList.setModel(oActiveListModel);
            oActiveList.bindItems({
                path : "/values",
                template : oActiveList.getBindingInfo("items") ? oActiveList.getBindingInfo("items").template : oActiveList.getItems()[0].clone()
            });

            this.getRouter().attachRoutePatternMatched(
                    function(oEvent) {
                        // Check if the route is for time based rate maintenance view
                        if (oEvent.getParameter("name") === "Administration/TimeBasedRateMaintenance") {
                            // Check the current user authorizations
                            if (!oController._bUserAuthorized) {
                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));
                            } else {
                                // Get the customData
                                var oCustomData = oEvent.getParameter("arguments").customData;
                                if (oCustomData) {
                                    // CustomData has scheduleName passed from ScheuldeRatesDetail
                                    if (oCustomData.ScheduleName) {
                                        var oScheduleName = {};
                                        oScheduleName[oCustomData.ScheduleName] = oCustomData.ScheduleName;

                                        // Set the ScheduleName facet filter key
                                        oController.byId("scheduleNameFacetList").setSelectedKeys(oScheduleName);
                                        // Select current season and bind items to the table
                                        oController._bindItemsToSeasonFacetList();
                                    } else {

                                        var bNoTableRefresh = oEvent.getParameter("arguments").customData.noTableRefresh;
                                        if (!bNoTableRefresh) {
                                            oTable.getBinding("items").refresh(true);
                                        }

                                    }
                                } else {
                                    // If coming to the view for the first time
                                    if (!oTable.getBinding("items")) {
                                        // Select current season and bind items to the table
                                        oController._bindItemsToSeasonFacetList();
                                    }
                                }
                            }
                        }
                    });
        },
        /**
         * This method will be called before rendering the View.
         * 
         * @memberOf com.zespri.awct.admin.view.TimeBasedRateMaintenance
         */
        onBeforeRendering : function() {
            // Check User Authorizations
            if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                    com.zespri.awct.util.Enums.AuthorizationObject.Administration, com.zespri.awct.util.Enums.AuthorizationFunctions.ZADM)) {
                if (this.byId("pageTimeBasedRates")) {
                    this.byId("pageTimeBasedRates").destroy();
                }
                this._bUserAuthorized = false;
            } else {
                this._bUserAuthorized = true;
            }
        },
        /**
         * This method will bind items to the season list during onInit and set the current season as selected by default.
         * 
         * @private
         * @memberOf com.zespri.awct.admin.view.TimeBasedRateMaintenance
         */
        _bindItemsToSeasonFacetList : function() {

            // Current season
            var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;
            var oController = this;
            var oTable = oController.byId("timeBasedRateTable");
            oTable.setBusy(true);

            // Preparing Season Facet Filter List
            var oSeasonList = this.byId("seasonFacetList");
            oSeasonList.setBusy(true);
            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GenericSearchSet", {
                urlParameters : {
                    "$filter" : "Scenario eq 'SEASON'"
                }
            }, function(oModel) {
                // Success
                oSeasonList.setModel(oModel);
                oSeasonList.bindItems({
                    path : "/results",
                    template : oSeasonList.getBindingInfo("items") ? oSeasonList.getBindingInfo("items").template : oSeasonList.getItems()[0].clone()
                });

                // Create the object with current Season to be selected
                var oCurrentSeasonKey = {};
                oCurrentSeasonKey[sCurrentSeason] = sCurrentSeason;
                if (oSeasonList.getItems().length) {
                    oSeasonList.setSelectedKeys(oCurrentSeasonKey);
                }
                oSeasonList.setBusy(false);

                // Get filter object from facet filter
                oController._oFilter = oController._getFacetFilterObject();
                // Bind items to table
                oTable.bindAggregation("items", {
                    path : "/TimeBasedRateSet",
                    filters : [oController._oFilter],
                    template : oTable.getBindingInfo("items") ? oTable.getBindingInfo("items").template : oTable.getItems()[0].clone()
                });

                // Reset busy state of table
                oTable.setBusy(false);

            }, function(oError) {
                // Error Handler
                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
            });

        },

        /**
         * This is a private method which will create a filter object from the selected fields in the facet filter
         * 
         * @private
         * @returns {sap.ui.model.Filter} oFilter filter object
         */
        _getFacetFilterObject : function() {
            var oController = this;
            var oFacetFilter = this.byId("facetFilterTimeRateMaintenance");
            var aFacetFilterLists = oFacetFilter.getLists().filter(function(oList) {
                return oList.getActive() && oList.getSelectedItems().length;
            });

            // Build the nested filter with ORs between the values of each group and
            // ANDs inside each group
            var oFilter = new sap.ui.model.Filter(aFacetFilterLists.map(function(oList) {
                return new sap.ui.model.Filter(oList.getSelectedItems().map(function(oItem) {

                    var sSelectedFilterKey = oList.getKey();
                    var sItemValue = oItem.getKey();
                    var oFilter = null;
                    switch (sSelectedFilterKey) {

                        case "Active" :
                            if (oItem.getKey() === oController._ActiveStatus.Active) {
                                sItemValue = true;
                            } else {
                                sItemValue = false;
                            }
                            oFilter = new sap.ui.model.Filter(sSelectedFilterKey, "EQ", sItemValue);
                            break;

                        default :
                            oFilter = new sap.ui.model.Filter(sSelectedFilterKey, "EQ", sItemValue);
                            break;
                    }
                    return oFilter;
                }), false);
            }), true);

            return oFilter;
        },

        /**
         * Event Handler for "add" button in the time based rates maintenance page footer bar . Used to navigate to "Time based rate" details page
         * 
         * @memberOf com.zespri.awct.admin.view.TimeBasedRateMaintenance
         */
        handleAddTimeRatePress : function() {

            this.getRouter().navTo("Administration/TimeRateDetail", {
                viewMode : com.zespri.awct.util.Enums.ViewMode.Add
            });
        },

        /**
         * This method is called on click of reset button of facet filter. This clears all the selected filters.
         * 
         * @memberOf com.zespri.awct.admin.view.TimeBasedRateMaintenance
         */

        handleFacetFilterReset : function() {
            var oFacetFilter = this.byId("facetFilterTimeRateMaintenance");
            var aFacetFilterLists = oFacetFilter.getLists();

            for ( var i = 0; i < aFacetFilterLists.length; i++) {
                aFacetFilterLists[i].setSelectedKeys();
            }

            var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;
            var oSeasonList = this.byId("seasonFacetList");
            var oCurrentSeasonKey = {};
            oCurrentSeasonKey[sCurrentSeason] = sCurrentSeason;
            // Select the current season in the facet filter
            if (oSeasonList.getItems().length) {
                oSeasonList.setSelectedKeys(oCurrentSeasonKey);
            }
            // Get facet filter object
            var oFilter = this._getFacetFilterObject();

            // apply facet filter object for track orders table
            this._applyFilter(oFilter);
        },

        /**
         * This method is called after closing of facet filter list or on reset of filters This filters the table data based on the filter passed as
         * parameter.
         * 
         * @private
         * @memberOf com.zespri.awct.admin.view.TimeBasedRateMaintenance
         * @param {sap.ui.model.Filter}
         *            oFilter The filter object
         */
        _applyFilter : function(oFilter) {

            var oTable = this.byId("timeBasedRateTable");
            // Set busy state
            oTable.setBusy(true);
            // apply the filter
            oTable.getBinding("items").filter(oFilter, sap.ui.model.FilterType.Application);
            // remove busy state
            oTable.setBusy(false);
            // store the applied filter object
            this._oFilter = oFilter;
        },

        /**
         * This method is called when any facet filter list is closed. This groups all the selected filter criteria and passes to apply filter
         * function
         * 
         * @param {sap.ui.base.Event}
         *            oEvent The Event object
         * 
         * @memberOf com.zespri.awct.admin.view.TimeBasedRateMaintenance
         * 
         */
        handleFacetListClose : function(oEvent) {

            // If season facet filter
            if (oEvent.getSource().getId() === this.createId("seasonFacetList")) {
                var oSeasonFacetFilter = oEvent.getSource();
                // Number of selected fields in season facet filter
                var iSeasonFacetListSelectedCount = oSeasonFacetFilter.getSelectedItems().length;
                // If no season is selected, then make the current season as selected by default
                if (!iSeasonFacetListSelectedCount) {
                    var oCurrentSeasonKey = {};
                    var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;
                    oCurrentSeasonKey[sCurrentSeason] = sCurrentSeason;
                    oSeasonFacetFilter.setSelectedKeys(oCurrentSeasonKey);
                }
            }

            // Get the Facet Filter lists and construct a (nested) filter for the binding
            var oFacetFilter = this.byId("facetFilterTimeRateMaintenance");

            // check for filter modified state
            if (oFacetFilter.getFiltersModifiedAfterListOpen()) {
                // Get filter object from facet filter selected fields
                var oFilter = this._getFacetFilterObject();
                this._applyFilter(oFilter);
            }
        },
        /**
         * This method is called when any facet filter list(with drop down values) is opened.
         * 
         * On call of this function, JSON Model for the selected facet filter is built and bound to the respective list. The reason for not creating a
         * regular binding to the ODataModel, is because we want client-side filtering (as opposed to filtering done by backend) for the facet lists.
         * 
         * 
         * @memberOf com.zespri.awct.admin.view.TimeBasedRateMaintenance
         */
        handleListOpen : function(oEvent) {

            // find the key of selected facet filter list
            var sSelectedFilterListKey = oEvent.getSource().getKey();
            var oFilterDetails = {};

            // check the filter which is triggered
            var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;
            switch (sSelectedFilterListKey) {

                case "ShipmentType" :
                    // Preparing Shipment Type Facet Filter List
                    oFilterDetails.facetListControl = this.byId("shipmentTypeFacetList");
                    oFilterDetails.entitySetName = "GetShipmentTypesForDifotis";
                    oFilterDetails.urlParameter = {
                        "Season" : "'" + sCurrentSeason + "'"
                    };
                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                    break;

                case "Characteristic/Variety" :
                    // Preparing Variety Facet Filter List
                    oFilterDetails.facetListControl = this.byId("varietyFacetList");
                    oFilterDetails.entitySetName = "GenericSearchSet";
                    oFilterDetails.filterString = "Scenario eq 'VARIETY'";
                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                    break;

                case "Characteristic/Class" :
                    // Preparing Class Facet Filter List
                    oFilterDetails.facetListControl = this.byId("classFacetList");
                    oFilterDetails.entitySetName = "GenericSearchSet";
                    oFilterDetails.filterString = "Scenario eq 'CLASS'";
                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                    break;

                case "Characteristic/GrowingMethod" :
                    // Preparing Growing Method Facet Filter List
                    oFilterDetails.facetListControl = this.byId("growingMethodFacetList");
                    oFilterDetails.entitySetName = "GenericSearchSet";
                    oFilterDetails.filterString = "Scenario eq 'GROWING_METHOD'";
                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                    break;

                case "Season" :
                    // Preparing Shipment season Facet Filter List
                    oFilterDetails.facetListControl = this.byId("seasonFacetList");
                    oFilterDetails.entitySetName = "GenericSearchSet";
                    oFilterDetails.filterString = "Scenario eq 'SEASON'";
                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                    break;

                case "Country" :
                    // Preparing Country Facet Filter List
                    oFilterDetails.facetListControl = this.byId("countryFacetList");
                    oFilterDetails.entitySetName = "GetCountriesForSeason";
                    oFilterDetails.urlParameter = {
                        "Season" : "'" + sCurrentSeason + "'"
                    };
                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                    break;

                case "ChargeCode" :
                    // Preparing charge code Facet Filter List
                    oFilterDetails.facetListControl = this.byId("chargeCodeFacetList");
                    oFilterDetails.entitySetName = "GenericSearchSet";
                    oFilterDetails.filterString = "Scenario eq 'CHARGECODE'";
                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                    break;

                case "ScheduleName" :
                    // Preparing schedule id Facet Filter List
                    oFilterDetails.facetListControl = this.byId("scheduleNameFacetList");
                    oFilterDetails.entitySetName = "ScheduleSet";
                    oFilterDetails.selectString = "ScheduleName";
                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                    break;
            }
        },

        /**
         * This method is called when any record in the time based rate table is selected
         * 
         * @memberOf com.zespri.awct.admin.view.TimeBasedRateMaintenance
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        handleTimeRatePress : function(oEvent) {

            var oSelectedItem = oEvent.getSource().getSelectedItem();
            var sPath = oSelectedItem.getBindingContextPath();

            // Navigate to detail of time based rate line
            // subStr(1) is used to get time rate path after "/", it will remove "/" from path
            this.getRouter().navTo("Administration/TimeRateDetail", {
                contextPath : sPath.substr(1),
                viewMode : com.zespri.awct.util.Enums.ViewMode.Modify
            });
        },

        /**
         * Formatter for the 'Short Notice Flag' column values
         * 
         * @param {Boolean}
         *            bShortNoticeFlag Value of the short notice flag
         * @returns {String} Yes or No
         * @memberOf com.zespri.awct.admin.view.TimeBasedRateMaintenance
         */
        formatShortNoticeFlagValue : function(bShortNoticeFlag) {
            if (bShortNoticeFlag) {
                return com.zespri.awct.util.I18NHelper.getText("TXT_GENERIC_YES");
            } else {
                return com.zespri.awct.util.I18NHelper.getText("TXT_GENERIC_NO");
            }
        }

    });
})();
