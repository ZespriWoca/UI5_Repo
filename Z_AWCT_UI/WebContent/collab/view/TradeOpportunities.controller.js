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
     * @classdesc This is the controller for TradeOpportunities view which displays Inbound and Outbound trades for the supplier in two tabs. On
     *            selecting any trade in the table, the user navigates to a details page for that trade opportunity.
     * 
     * @class
     * @name com.zespri.awct.collab.view.TradeOpportunities
     */
    com.zespri.awct.core.Controller.extend("com.zespri.awct.collab.view.TradeOpportunities",
    /** @lends com.zespri.awct.collab.view.TradeOpportunities */
    {

        /**
         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it
         * is displayed, to bind event handlers and do other one-time initialization.
         * 
         * On load of this view, the trade opportunities table fragment is initialized and inserted into the content of tab bar. Count for all the
         * types of trades is also fetched. And status facet filter list items are also prepared.
         * 
         * @memberOf com.zespri.awct.collab.view.TradeOpportunities
         */
        onInit : function() {
            /* START of instance member initialization */
            // Private instance for view settings dialog
            this._oSettingsDialog = null;
            // Private variable for status filter
            this._oStatusFilter = null;
            // Private instance object for default Status Filter
            this._oDefaultStatusFilter = {};
            // Private variable for Icon Tab Bar
            this._oTabBar = null;
            // Private variable for Trade Opportunity Table
            this._oTradeOpportunitiesTable = null;
            // Private variable to store sort options
            this._mSortParams = null;
            // Private Instance variable for user authorization
            this._bUserAuthorized = false;
            /* END of instance member initialization */

            this._oTabBar = this.byId("tabBarTrade");

            var oStatusList = this.byId("facetFilterListStatus");
            // Prepare the Status facet filter
            var oStatusListModel = new sap.ui.model.json.JSONModel({
                values : [{
                    TradeStatusKey : com.zespri.awct.util.Enums.TradeStatus.Initiated,
                    TradeStatusValue : com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_INITIATED")

                }, {
                    TradeStatusKey : com.zespri.awct.util.Enums.TradeStatus.Accepted,
                    TradeStatusValue : com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_ACCEPTED")
                }, {
                    TradeStatusKey : com.zespri.awct.util.Enums.TradeStatus.Rejected,
                    TradeStatusValue : com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_REJECTED")
                }, {
                    TradeStatusKey : com.zespri.awct.util.Enums.TradeStatus.Expired,
                    TradeStatusValue : com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_EXPIRED")
                }, {
                    TradeStatusKey : com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted,
                    TradeStatusValue : com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_PARTIALLY_ACCEPTED")
                }, {
                    TradeStatusKey : com.zespri.awct.util.Enums.TradeStatus.Cancelled,
                    TradeStatusValue : com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_CANCELLED")
                }]
            });
            oStatusList.setModel(oStatusListModel);
            oStatusList.bindItems({
                path : "/values",
                template : oStatusList.getBindingInfo("items") ? oStatusList.getBindingInfo("items").template : oStatusList.getItems()[0].clone()
            });
            // Set the default status as Initiated
            this._oDefaultStatusFilter[com.zespri.awct.util.Enums.TradeStatus.Initiated] = com.zespri.awct.util.I18NHelper
                    .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_INITIATED");
            this._oDefaultStatusFilter[com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted] = com.zespri.awct.util.I18NHelper
                    .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_PARTIALLY_ACCEPTED");
            oStatusList.setSelectedKeys(this._oDefaultStatusFilter);

            var oController = this;

            // Enable / Disable facet filter based on table loading
            var oFacetFilter = this.byId("facetFilterTrades");
            com.zespri.awct.util.CommonHelper.manageFacetFilterState(this.byId("tradeOpportunitiesInboundTradeTable"), oFacetFilter);
            com.zespri.awct.util.CommonHelper.manageFacetFilterState(this.byId("tradeOpportunitiesOutboundTradeTable"), oFacetFilter);
            com.zespri.awct.util.CommonHelper.manageFacetFilterState(this.byId("tradeOpportunitiesOpenTradeTable"), oFacetFilter);

            // Manage NoData Texts , listen for table update EVENT
            com.zespri.awct.util.CommonHelper.manageNoDataText(this.byId("tradeOpportunitiesInboundTradeTable"));
            com.zespri.awct.util.CommonHelper.manageNoDataText(this.byId("tradeOpportunitiesOutboundTradeTable"));
            com.zespri.awct.util.CommonHelper.manageNoDataText(this.byId("tradeOpportunitiesOpenTradeTable"));

            this.getRouter().attachRoutePatternMatched(
                    function(oEvent) {
                        // Check if the route is for the TradeOpportunities view
                        if (oEvent.getParameter("name") === "Collaboration/TradeOpportunities") {
                            // Check authorization
                            // Check the current user authorizations
                            if (!this._bUserAuthorized) {
                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));
                            } else {

                                // Get the custom data if any and apply it to the view (facet filter , icon tab bar and table)
                                if (oEvent.getParameter("arguments").customData) {
                                    // Get the Filters from the custom data
                                    var oCustomDataFilter = oEvent.getParameter("arguments").customData.filters;
                                    // Status Value from the custom data
                                    var sCustomStatus = oCustomDataFilter.Status;
                                    // Type From the custom data
                                    var sCustomType = oCustomDataFilter.Type;
                                    // Status Object Key
                                    var oCustomStatusKey = {};

                                    // Form the Status Object Key
                                    switch (sCustomStatus) {
                                        // Initiated
                                        case com.zespri.awct.util.Enums.TradeStatus.Initiated :
                                            oCustomStatusKey[com.zespri.awct.util.Enums.TradeStatus.Initiated] = com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_INITIATED");
                                            break;

                                        // Accepted
                                        case com.zespri.awct.util.Enums.TradeStatus.Accepted :
                                            oCustomStatusKey[com.zespri.awct.util.Enums.TradeStatus.Accepted] = com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_ACCEPTED");
                                            break;

                                        // Rejected
                                        case com.zespri.awct.util.Enums.TradeStatus.Rejected :
                                            oCustomStatusKey[com.zespri.awct.util.Enums.TradeStatus.Rejected] = com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_REJECTED");
                                            break;

                                        // Expired
                                        case com.zespri.awct.util.Enums.TradeStatus.Expired :
                                            oCustomStatusKey[com.zespri.awct.util.Enums.TradeStatus.Expired] = com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_EXPIRED");
                                            break;

                                        // Partially Accepted
                                        case com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted :
                                            oCustomStatusKey[com.zespri.awct.util.Enums.TradeStatus.Cancelled] = com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_PARTIALLY_ACCEPTED");
                                            break;
                                        // Cancelled
                                        case com.zespri.awct.util.Enums.TradeStatus.Cancelled :
                                            oCustomStatusKey[com.zespri.awct.util.Enums.TradeStatus.Cancelled] = com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_FILTERITEM_CANCELLED");
                                            break;
                                    }

                                    // Select the custom Status Key in the facet list
                                    oStatusList.setSelectedKeys(oCustomStatusKey);
                                    // Select the icon tab based on the type from custom data
                                    oController._oTabBar.setSelectedKey(sCustomType);
                                }

                                switch (oController._oTabBar.getSelectedKey()) {
                                    case "I" :
                                        oController._oTradeOpportunitiesTable = oController.byId("tradeOpportunitiesInboundTradeTable");
                                        break;
                                    case "O" :
                                        oController._oTradeOpportunitiesTable = oController.byId("tradeOpportunitiesOutboundTradeTable");
                                        break;
                                    case "OP" :
                                        oController._oTradeOpportunitiesTable = oController.byId("tradeOpportunitiesOpenTradeTable");
                                        break;
                                }

                                // apply the initial filter for Type as Inbound and Status as Initiated.
                                oController._applyFilter();
                                // Get the count of Inbound, outbound and open trades
                                // TODO:Trades count
                                // oController._getCountforTrades();
                            }
                        }

                    }, this);

        },
        /**
         * This method will be called before rendering the View.
         * 
         * @memberOf com.zespri.awct.collab.view.SupplierOrders
         */
        onBeforeRendering : function() {
            // Check User Authorizations
            if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration, com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP)) {
                if (this.byId("pageTradeOpportunities")) {
                    this.byId("pageTradeOpportunities").destroy();
                }
                this._bUserAuthorized = false;
            } else {
                this._bUserAuthorized = true;
            }
        },
        /**
         * This method is called on click of reset button. This clears all the selected filters. And filters data based on "Initiated" status
         * 
         * @memberOf com.zespri.awct.collab.view.SupplierOrders *
         */

        handleFacetFilterReset : function() {
            var oFacetFilter = this.byId("facetFilterTrades");
            var aFacetFilterLists = oFacetFilter.getLists();

            for ( var i = 0; i < aFacetFilterLists.length; i++) {
                aFacetFilterLists[i].setSelectedKeys();
            }

            // On reset, apply status filter to Initiated
            var oStatusList = this.byId("facetFilterListStatus");
            oStatusList.setSelectedKeys(this._oDefaultStatusFilter);

            // apply the filter for Status as Initiated.
            this._applyFilter();

        },

        /**
         * This method is called when the facet filter list is closed.
         * 
         * @memberOf com.zespri.awct.collab.view.SupplierOrders
         */
        handleListClose : function() {
            var oFacetFilter = this.byId("facetFilterTrades");
            if (oFacetFilter.getFiltersModifiedAfterListOpen()) {
                this._applyFilter();
            }
        },

        /**
         * This method is to filter the trade opportunities table based on the selected tab.
         * 
         * This method creates a filter based on key of selected tab item and applies to the trade opportunities table along with status filter. If no
         * status filter is passed, it creates a filter for "Initiated" status.
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.TradeOpportunities
         */
        _applyFilter : function() {
            // Get the Facet Filter lists and construct a (nested) filter for the binding
            var oFacetFilter = this.byId("facetFilterTrades");

            // Prepare an array of filters which are active and selected.
            // ShowDemandLines filter is by default checked, hence filter is not created for it.
            var aFacetFilterLists = oFacetFilter.getLists().filter(function(oList) {
                return (oList.getActive() && oList.getSelectedItems().length > 0);
            });

            // The status filter has to be saved, so that it can be applied even on switching of tabs

            // Build the nested filter with ORs between the
            // values of each group and
            // ANDs between each group
            if (aFacetFilterLists.length > 0) {
                this._oStatusFilter = new sap.ui.model.Filter(aFacetFilterLists.map(function(oList) {
                    return new sap.ui.model.Filter(oList.getSelectedItems().map(function(oItem) {
                        return (new sap.ui.model.Filter(oList.getKey(), "EQ", oItem.getKey()));
                    }), false);
                }), true);
            } else {
                this._oStatusFilter = null;
            }

            // Filter for type of trades based on selected tab
            var sSelectedKey = this._oTabBar.getSelectedKey();

            var oFinalFilter = null;
            var oTradeTypeFilter = new sap.ui.model.Filter("Type", "EQ", sSelectedKey);

            // If both status and trade type filters are present, create a filter with AND of both filters
            if (this._oStatusFilter && oTradeTypeFilter) {
                // Create a final filter with AND of Status and Type filters.
                oFinalFilter = new sap.ui.model.Filter([this._oStatusFilter, oTradeTypeFilter], true);
            } else if (oTradeTypeFilter) {
                oFinalFilter = oTradeTypeFilter;
            } else {
                oFinalFilter = this._oStatusFilter;
            }

            // Get current table
            switch (this.byId("tabBarTrade").getSelectedKey()) {
                case "I" :
                    this._oTradeOpportunitiesTable = this.byId("tradeOpportunitiesInboundTradeTable");
                    break;
                case "O" :
                    this._oTradeOpportunitiesTable = this.byId("tradeOpportunitiesOutboundTradeTable");
                    break;
                case "OP" :
                    this._oTradeOpportunitiesTable = this.byId("tradeOpportunitiesOpenTradeTable");
                    break;
            }

            var oBindingItems = {
                path : "/TradeSet",
                factory : jQuery.proxy(this._createTradeOpportunitiesTableRow, this),
                filters : [oFinalFilter]
            };

            // Add sorter to the binding items
            if (this._mSortParams && this._mSortParams.sortItem) {
                var sPath = this._mSortParams.sortItem.getKey();
                var bDescending = this._mSortParams.sortDescending;
                oBindingItems.sorter = new sap.ui.model.Sorter(sPath, bDescending);
            }
            // Bind items
            this._oTradeOpportunitiesTable.bindAggregation("items", oBindingItems);
        },

        /**
         * This method is called when any of the icon tab filter is selected. Based on the selected tab filter, the trade opportunities table results
         * are filtered.
         * 
         * @memberOf com.zespri.awct.collab.view.TradeOpportunities
         * 
         */
        handleIconTabBarSelect : function() {
            this._applyFilter();
            // Get the updated count of Inbound, outbound and open trades
            // TODO:Trades count
            // this._getCountforTrades();
        },

        /**
         * This method is called to get the count of Inbound, Outbound and Open trades
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.TradeOpportunities
         */
        _getCountforTrades : function() {
            var oTabInbound = this.byId("tabInbound");
            var oTabOutbound = this.byId("tabOutbound");
            var oTabOpen = this.byId("tabOpen");
            sap.ui.getCore().getRootComponent().getModel().read("/GetCountForTrade", {
                success : function(oData) {
                    // Success
                    oTabInbound.setCount(oData.GetCountForTrade.InboundTradeCount);
                    oTabOutbound.setCount(oData.GetCountForTrade.OutboundTradeCount);
                    oTabOpen.setCount(oData.GetCountForTrade.OpenTradeCount);
                },
                error : function(oError) {
                    // Error
                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                }
            });
        },
        /**
         * This method is called when any table line item is selected in the trade opportunities table. On selection of any item, user is navigated to
         * its details view.
         * 
         * @memberOf com.zespri.awct.collab.view.TradeOpportunities
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */

        handleItemPress : function(oEvent) {
            var sContextPath = oEvent.getSource().getSelectedItem().getBindingContextPath();
            // Navigate to TradeOpportunities More Details View
            this.getRouter().navTo("Collaboration/TradeOpportunitiesDetails", {
                contextPath : sContextPath.substr(1)
            });
        },

        /**
         * This method is called when the table settings button in the trade opportunities view is clicked.
         * 
         * On click of this button the table settings dialog is opened.
         * 
         * @memberOf com.zespri.awct.collab.view.TradeOpportunities
         */
        handleTableSettingsDialogButtonPress : function() {
            // Getting the table Settings Dialog
            if (!this._oSettingsDialog) {
                this._oSettingsDialog = sap.ui.xmlfragment("com.zespri.awct.collab.fragment.TradeOpportunitiesSettingsDialog", this);
                this.getView().addDependent(this._oSettingsDialog);
            }
            this._oSettingsDialog.open();

        },

        /**
         * This method is called when the Ok button in the table settings dialog is clicked. Based on the selected sort item the trade opportunities
         * table is refreshed.
         * 
         * @memberOf com.zespri.awct.collab.view.TradeOpportunities
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        handleTableSettingsDialogClose : function(oEvent) {
            // On clicking confirm in the TableSettings Dialog

            var oBinding = this._oTradeOpportunitiesTable.getBinding("items");

            var mParams = null;
            if (oEvent) {
                // get sort parameters and store it
                mParams = oEvent.getParameters();
                this._mSortParams = mParams;
            } else {
                mParams = this._mSortParams;
            }

            // Get the Sorting Items
            var aSorters = [];

            if (mParams.sortItem) {
                var sPath = mParams.sortItem.getKey();
                var bDescending = mParams.sortDescending;
                aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
            }
            // apply sorter to binding
            oBinding.sort(aSorters);

        },

        /**
         * Formatter function for the column 'Status' in 'View Trades'
         * 
         * @memberOf com.zespri.awct.collab.view.TradeOpportunities
         * @param {String}
         *            sStatus code for Status
         * @returns {String} Status text corresponding to status code
         */
        formatStatusText : function(sStatus) {

            if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Initiated) {
                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_INITIATED");

            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Accepted) {
                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_ACCEPTED");

            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Rejected) {
                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_REJECTED");

            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Expired) {
                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_EXPIRED");

            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted) {
                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_PARTIALLY_ACCEPTED");

            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Cancelled) {
                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_CANCELLED");
            }
        },

        /**
         * Formatter function for the value state of 'Status' in 'View Trades'
         * 
         * @memberOf com.zespri.awct.collab.view.TradeOpportunities
         * @param {String}
         *            sStatus code for Status
         * @returns {String} Status value state corresponding to status code
         */
        formatStatusState : function(sStatus) {

            if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Initiated) {
                return sap.ui.core.ValueState.None;
            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Accepted) {
                return sap.ui.core.ValueState.Success;
            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Rejected) {
                return sap.ui.core.ValueState.Error;
            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Expired) {
                return sap.ui.core.ValueState.Warning;
            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted) {
                return sap.ui.core.ValueState.None;
            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Cancelled) {
                return sap.ui.core.ValueState.Error;
            }
        },

        /**
         * Private method for creating order history table rows
         * 
         * @private
         * @returns {sap.ui.xmlfragment} Order history table Row
         * 
         * @memberOf com.zespri.awct.collab.view.TradeOpportunities
         */
        _createTradeOpportunitiesTableRow : function() {
            var oTradeOpportunitiesTableRow = null;
            switch (this.byId("tabBarTrade").getSelectedKey()) {
                case com.zespri.awct.util.Enums.TradeType.Inbound :
                    oTradeOpportunitiesTableRow = new sap.ui.xmlfragment("TradeOpportunitiesInboundTradeTableRow",
                            "com.zespri.awct.collab.fragment.TradeOpportunitiesInboundTradeTableRowTemplate", this);
                    break;
                case com.zespri.awct.util.Enums.TradeType.Outbound :
                    oTradeOpportunitiesTableRow = new sap.ui.xmlfragment("TradeOpportunitiesOutboundTradeTableRow",
                            "com.zespri.awct.collab.fragment.TradeOpportunitiesOutboundTradeTableRowTemplate", this);
                    break;
                case com.zespri.awct.util.Enums.TradeType.Open :
                    oTradeOpportunitiesTableRow = new sap.ui.xmlfragment("TradeOpportunitiesOpenTradeTableRow",
                            "com.zespri.awct.collab.fragment.TradeOpportunitiesOpenTradeTableRowTemplate", this);
                    break;
            }
            return oTradeOpportunitiesTableRow;
        },

        /**
         * Formats the visibility of the table cell based on the ParentTradeID. If the ParentTradeID to passed as 0, the cell is hidden.
         * 
         * @param {String}
         *            sParentTradeID ParentTradeID value
         * 
         * @returns {Boolean} true ParentTradeID is not 0,
         * 
         * @memberOf com.zespri.awct.collab.view.TradeOpportunities
         * 
         */
        formatParentTradeIDVisibility : function(sParentTradeID) {

            var iParentTradeID = parseInt(sParentTradeID, 10);
            if (!iParentTradeID) {
                return false;
            } else {
                return true;
            }
        }
    });
})();
