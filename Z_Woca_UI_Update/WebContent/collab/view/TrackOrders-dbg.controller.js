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
    jQuery.sap.require("com.zespri.awct.control.FacetFilterDateInputList");
    jQuery.sap.require("com.zespri.awct.util.CommonHelper");
    jQuery.sap.require("com.zespri.awct.util.Enums");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.CommonFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");
    jQuery.sap.require("com.zespri.awct.util.TableRowActionsExtension");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");
    jQuery.sap.require("sap.ui.commons.layout.HorizontalLayout");

    /**
     * @classdesc The Order History view allows users to view how orders have changed over a period of time. The details shown on this view are of an
     *            order that is created and/or edited.
     * 
     * ZESPRI users can Grant Exemptions and Suppliers can Request for exemptions for penalty charges due to posting shortages. ZESPRI Users can
     * review and accept the exemption requests made by the suppliers.
     * 
     * The facet filter allows for filtering the number of rows in the table.
     * 
     * @class
     * @name com.zespri.awct.collab.view.TrackOrders
     * 
     */
    com.zespri.awct.core.Controller
            .extend(
                    "com.zespri.awct.collab.view.TrackOrders",
                    /** @lends com.zespri.awct.collab.view.TrackOrders */
                    {
                        // Private enum for record type
                        _AllocationLineRecordType : {
                            DeliveryLine : "D",
                            SupplierOrderLine : "A"
                        },

                        // Private enum for Business Action
                        _BusinessAction : {
                            REQUEST : "Request",
                            APPROVE : "Approve",
                            DOWNLOAD : "Download"
                        },

                        // Private enum for file type
                        _FileType : {
                            CSV : "CSV"
                        },

                        // Private enum for Delivery status
                        _DeliveryStatus : {
                            BeforeRelease : "B4REL",
                            DeliveryRelease : "REL",
                            DeliveryLock : "LOCK",
                            DeliveryUnlock : "UNLCK",
                            ChangesDuringLock : "COLK",
                            OnUnlockDIFOTIS : "COULK"
                        },

                        /**
                         * This method is called when the view is first created.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        onInit : function() {
                            /* START of instance member initialization */
                            // Private Boolean Instance to indicate , whether to update selected context array on UpdateFinished event or not
                            this._bSubmitBatchCalled = false;
                            // Private instance for Action Sheet
                            this._oActionSheet = null;
                            // Private array for storing contexts of the selected rows from track orders table
                            this._aSelectedTrackOrderRowContexts = [];
                            // Private array for storing contexts of the selected rows from track lines table
                            this._aSelectedSupplierLinesRowContexts = [];
                            // Private variable for Grant Exemption Dialog
                            this._oGrantExemptionDialog = null;
                            // Private variable for Batch Grant Exemption
                            this._oBatchGrantExemptionDialog = null;
                            // Private variable for Request Exemption Dialog
                            this._oRequestExemptionDialog = null;
                            // Private variable for Batch Request Exemption Dialog
                            this._oBatchRequestExemptionDialog = null;
                            // Private variable for Settings dialog
                            this._oSortOrderHistoryTableDialog = null;
                            // Private variable for reason code popover
                            this._oReasonCodeDescriptionPopover = null;
                            // Private variable to store the selected sort item from the settings dialog
                            this._mParams = null;
                            // Private filter object. This stores the current filter that is applied on the table.
                            // It is required because the filter can be formed from the facet filter and the search form, and it is applied to the
                            // table while
                            // switching between tabs
                            this._oFilter = null;
                            // Default track lines filter
                            this._oTrackLinesDefaultFilter = new sap.ui.model.Filter("RecordType", "EQ", "D");
                            // Default supplier lines filter
                            this._oSupplierLinesDefaultFilter = new sap.ui.model.Filter("RecordType", "EQ", "A");
                            // Row actions extension for track lines
                            this._oTrackLinesRowActionsExtension = null;
                            // Row actions extension for supplier lines
                            this._oSupplierLinesRowActionsExtension = null;
                            // Row actions comments button
                            this._oRowActionsCommentsButton = null;
                            // Private variable for comments dialog
                            this._oOrderHistoryCommentsDialog = null;
                            // Private variable for reject exemption dialog
                            this._oRejectExemptionDialog = null;
                            // Default Sorter - By creation timestamp in descending order
                            this._oOrderHistoryDefaultSorter = new sap.ui.model.Sorter("CreationTimestamp", true);
                            // Busy dialog
                            this._oBusyDialog = new sap.m.BusyDialog();
                            // Download filter string
                            this._sDownloadFilterString = null;
                            /* END of instance member initialization */

                            // if not an administrator, delete the User filter
                            if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)) {
                                var oFacetFilter = this.byId("facetFilterOrderHistory");
                                var oUserFilterList = this.byId("facetFilterListOrderHistoryUser");
                                oFacetFilter.removeList(oUserFilterList);
                            }

                            // Delivery Status filter
                            var oDeliveryStatusFilterList = this.byId("facetFilterListOrderHistoryDeliveryStatus");
                            // Prepare model for Delivery Status facet filter
                            var oStatusListModel = new sap.ui.model.json.JSONModel({
                                values : [
                                        {
                                            DeliveryStatusKey : this._DeliveryStatus.BeforeRelease,
                                            DeliveryStatusValue : com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_ORDERHISTORY_COLUMN_TEXT_DELIVERY_STATUS_BEFORE_RELEASE")

                                        },
                                        {
                                            DeliveryStatusKey : this._DeliveryStatus.DeliveryRelease,
                                            DeliveryStatusValue : com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_ORDERHISTORY_COLUMN_TEXT_DELIVERY_STATUS_DELIVERY_RELEASE")
                                        },
                                        {
                                            DeliveryStatusKey : this._DeliveryStatus.DeliveryLock,
                                            DeliveryStatusValue : com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_ORDERHISTORY_COLUMN_TEXT_DELIVERY_STATUS_DELIVERY_LOCK")
                                        },
                                        {
                                            DeliveryStatusKey : this._DeliveryStatus.DeliveryUnlock,
                                            DeliveryStatusValue : com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_ORDERHISTORY_COLUMN_TEXT_DELIVERY_STATUS_DELIVERY_UNLOCK")
                                        },
                                        {
                                            DeliveryStatusKey : this._DeliveryStatus.ChangesDuringLock,
                                            DeliveryStatusValue : com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_ORDERHISTORY_COLUMN_TEXT_DELIVERY_STATUS_CHANGES_DURING_LOCK")
                                        },
                                        {
                                            DeliveryStatusKey : this._DeliveryStatus.OnUnlockDIFOTIS,
                                            DeliveryStatusValue : com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_ORDERHISTORY_COLUMN_TEXT_DELIVERY_STATUS_CHANGED_DURING_UNLOCK")
                                        }]
                            });
                            // Bind the model
                            oDeliveryStatusFilterList.setModel(oStatusListModel);
                            oDeliveryStatusFilterList
                                    .bindItems({
                                        path : "/values",
                                        template : oDeliveryStatusFilterList.getBindingInfo("items") ? oDeliveryStatusFilterList
                                                .getBindingInfo("items").template : oDeliveryStatusFilterList.getItems()[0].clone()
                                    });

                            // Exemption status filter
                            var oExemptionStatusFilterList = this.byId("facetFilterListOrderHistoryExemptionStatus");
                            // Prepare model for Exemption Status facet filter
                            var oExemptionListModel = new sap.ui.model.json.JSONModel({
                                values : [
                                        {
                                            ExemptionStatusKey : com.zespri.awct.util.Enums.ExemptionStatus.NONE,
                                            ExemptionStatusValue : com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_ORDERHISTORY_FILTER_EXEMPTION_STATUS_NONE")
                                        },
                                        {
                                            ExemptionStatusKey : com.zespri.awct.util.Enums.ExemptionStatus.PENDING,
                                            ExemptionStatusValue : com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_ORDERHISTORY_FILTER_EXEMPTION_STATUS_PENDING")
                                        },
                                        {
                                            ExemptionStatusKey : com.zespri.awct.util.Enums.ExemptionStatus.COMPLETE,
                                            ExemptionStatusValue : com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_ORDERHISTORY_FILTER_EXEMPTION_STATUS_COMPLETE")
                                        }]
                            });
                            // Bind the model
                            oExemptionStatusFilterList.setModel(oExemptionListModel);
                            oExemptionStatusFilterList
                                    .bindItems({
                                        path : "/values",
                                        template : oExemptionStatusFilterList.getBindingInfo("items") ? oExemptionStatusFilterList
                                                .getBindingInfo("items").template : oExemptionStatusFilterList.getItems()[0].clone()
                                    });

                            var oController = this;
                            var oTrackLinesTable = oController.byId("trackLinesTable");
                            var oSupplierLinesTable = oController.byId("supplierLinesTable");

                            // iOS Adjustment - Make the tablse look good on iPads by reducing cell padding
                            if (sap.ui.Device.os.ios) {
                                oTrackLinesTable.addStyleClass("zAwctTableIOS");
                                oSupplierLinesTable.addStyleClass("zAwctTableIOS");
                            }

                            // Track lines row actions extension
                            this._oTrackLinesRowActionsExtension = new com.zespri.awct.util.TableRowActionsExtension({
                                table : oTrackLinesTable,
                                actionsContent : this._getTableRowActionsContent()
                            });
                            // Supplier lines row actions extension
                            this._oSupplierLinesRowActionsExtension = new com.zespri.awct.util.TableRowActionsExtension({
                                table : oSupplierLinesTable,
                                actionsContent : this._getTableRowActionsContent()
                            });

                            // Enable / Disable facet filter based on table loading
                            com.zespri.awct.util.CommonHelper.manageFacetFilterState(oTrackLinesTable, this.byId("facetFilterOrderHistory"));
                            com.zespri.awct.util.CommonHelper.manageFacetFilterState(oSupplierLinesTable, this.byId("facetFilterOrderHistory"));

                            // Manage NoData Texts , listen for table update EVENT
                            com.zespri.awct.util.CommonHelper.manageNoDataText(oTrackLinesTable);
                            com.zespri.awct.util.CommonHelper.manageNoDataText(oSupplierLinesTable);

                            // Listen for the Track lines table update finish event , and update the selectedContext array.
                            oTrackLinesTable.attachUpdateFinished(function() {
                                // If no item is selected or call is from submit batch, just return
                                if (oController._bSubmitBatchCalled || oController._aSelectedTrackOrderRowContexts.length <= 0) {
                                    oController._bSubmitBatchCalled = false;
                                    return;
                                }

                                // Local Array instance to keep track of selected table contexts exists in current table items.
                                var aExistingSelectedContextInTableItems = [];

                                // Get the current table items
                                var aTrackLinesTableItems = oTrackLinesTable.getItems();

                                // Loop through the current table items and find selected contexts exists in the table items , if it doesnt exist
                                // remove it from the selected context array
                                for ( var i = 0; i < oController._aSelectedTrackOrderRowContexts.length; i++) {
                                    for ( var j = 0; j < aTrackLinesTableItems.length; j++) {
                                        if (oController._aSelectedTrackOrderRowContexts[i].getProperty("OrderHistoryID") === aTrackLinesTableItems[j]
                                                .getBindingContext().getProperty("OrderHistoryID")) {
                                            aExistingSelectedContextInTableItems.push(oController._aSelectedTrackOrderRowContexts[i]);
                                        }
                                    }
                                }

                                // Copy the existing context visible (in listed table items) to the Global array _aSelectedTrackOrderRowContexts
                                oController._aSelectedTrackOrderRowContexts = aExistingSelectedContextInTableItems;

                            });

                            // Listen for the Supplier lines table update finish event , and update the selectedContext array.
                            oSupplierLinesTable
                                    .attachUpdateFinished(function() {
                                        // If no item is selected or call is from submit batch , just return
                                        if (oController._bSubmitBatchCalled || oController._aSelectedSupplierLinesRowContexts.length <= 0) {
                                            oController._bSubmitBatchCalled = false;
                                            return;
                                        }

                                        // Local Array instance to keep track of selected table contexts exists in current table items.
                                        var aExistingSelectedContextInTableItems = [];

                                        // Get the current table items
                                        var aSupplierLinesTableItems = oSupplierLinesTable.getItems();

                                        // Loop through the current table items and find selected contexts exists in the table items , if it doesnt
                                        // exist
                                        // remove it from the selected context array
                                        for ( var i = 0; i < oController._aSelectedSupplierLinesRowContexts.length; i++) {
                                            for ( var j = 0; j < aSupplierLinesTableItems.length; j++) {
                                                if (oController._aSelectedSupplierLinesRowContexts[i].getProperty("OrderHistoryID") === aSupplierLinesTableItems[j]
                                                        .getBindingContext().getProperty("OrderHistoryID")) {
                                                    aExistingSelectedContextInTableItems.push(oController._aSelectedSupplierLinesRowContexts[i]);
                                                }
                                            }
                                        }

                                        // Copy the existing context visible (in listed table items) to the Global array _aSelectedTrackOrderRowContexts
                                        oController._aSelectedSupplierLinesRowContexts = aExistingSelectedContextInTableItems;
                                    });

                            this.getRouter().attachRoutePatternMatched(
                                    function(oEvent) {
                                        // Check if the route is for the TrackOrders view
                                        if (oEvent.getParameter("name") === "Collaboration/TrackOrders") {
                                            // Check the current user authorizations
                                            if (!this._bUserAuthorized) {
                                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                                        .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));
                                            } else {

                                                // Update footer
                                                oController._updateFooter();
                                                var oFacetFilter = this.byId("facetFilterOrderHistory");
                                                var oSearchInfoToolbar = oController.byId("toolbarFilterString");
                                                var oFilterText = oController.byId("textFilter");

                                                // Get the parameters passed
                                                var oCustomData = oEvent.getParameter("arguments").customData;
                                                if (oCustomData) {
                                                    // If navigating from the search form
                                                    var sFilterString = oCustomData.searchFormFilterString;
                                                    var oFilter = oCustomData.searchFormFilterObject;
                                                    this._sDownloadFilterString = oCustomData.downloadFilterString;

                                                    // If the filterString is available in the url, hide the facet filter and display the search
                                                    // string in the
                                                    // toolbar.
                                                    // If the filter is available, store it and apply it to table after rendering of view
                                                    oSearchInfoToolbar.setVisible(true);
                                                    oFilterText.setText(sFilterString);
                                                    oFilterText.setTooltip(sFilterString);
                                                    oFacetFilter.setVisible(false);

                                                    // Store the filter passed from the search form. The filter will be applied when navigating
                                                    // between the
                                                    // tabs

                                                    oController._oFilter = oFilter;
                                                    this._bindTableWithFilterAndSorter();
                                                }
                                                // Show the facet filter
                                                else {

                                                    // Navigation was not from search form
                                                    this._sDownloadFilterString = null;

                                                    // If FacetFilter is not already visible (e.g last nav to this view was from Search Form), then
                                                    // clear the
                                                    // filter and remove filters from table.
                                                    if (!oFacetFilter.getVisible()) {
                                                        oFacetFilter.fireReset();
                                                        oController._oFilter = null;
                                                    } else {
                                                        // If FacetFilter is already visible, then any applied filters are also still available.. so
                                                        // just refresh
                                                        // the table to preserve applied filters

                                                        // If the view is loaded for the first time
                                                        if ((!oTrackLinesTable.getBinding("items")) && (!oSupplierLinesTable.getBinding("items"))) {

                                                            // Disable the delivery line number facet filter
                                                            this.byId("facetFilterListOrderHistoryLineNumber").setEnabled(false);

                                                            this._bindItemsToSeasonFacetList();

                                                        } else {
                                                            // Get current table
                                                            var oTable = null;
                                                            switch (oController.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                                                case "TrackLines" :
                                                                    oTable = oTrackLinesTable;
                                                                    break;
                                                                case "SupplierLines" :
                                                                    oTable = oSupplierLinesTable;
                                                                    break;
                                                            }
                                                            // Refresh the table
                                                            oTable.getBinding("items").refresh(true);
                                                        }
                                                    }

                                                    oSearchInfoToolbar.setVisible(false);
                                                    oFacetFilter.setVisible(true);
                                                }
                                            }
                                        }
                                    }, this);

                        },
                        /**
                         * This method will be called before rendering the View.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        onBeforeRendering : function() {
                            // Check User Authorizations
                            if (!(com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP) || (com.zespri.awct.util.CommonHelper.isUserAuthorized(
                                    com.zespri.awct.util.Enums.AuthorizationMode.Display,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)))) {
                                if (this.byId("pageOrderHistory")) {
                                    this.byId("pageOrderHistory").destroy();
                                }
                                this._bUserAuthorized = false;
                            } else {
                                this._bUserAuthorized = true;
                            }
                        },
                        /**
                         * Private method for creating order history table rows
                         * 
                         * @private
                         * @returns {sap.ui.xmlfragment} Order history table Row
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        _createOrderHistoryTableRow : function() {
                            var oOrderHistoryTableRow = null;
                            switch (this.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                case "TrackLines" :
                                    oOrderHistoryTableRow = new sap.ui.xmlfragment("OrderHistoryTrackLinesTableRow",
                                            "com.zespri.awct.collab.fragment.OrderHistoryTrackLinesTableRowTemplate", this);
                                    break;
                                case "SupplierLines" :
                                    oOrderHistoryTableRow = new sap.ui.xmlfragment("OrderHistorySupplierLinesTableRow",
                                            "com.zespri.awct.collab.fragment.OrderHistorySupplierLinesTableRowTemplate", this);
                                    break;
                            }
                            return oOrderHistoryTableRow;
                        },

                        /**
                         * This method will bind items to the season list during onInit and set the current season as selected by default.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.DeliverySwapListing
                         */
                        _bindItemsToSeasonFacetList : function() {

                            // Current season
                            var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;
                            var oController = this;

                            var oCurrentTable = null;

                            // Preparing Season Facet Filter List
                            var oSeasonList = this.byId("facetFilterListOrderHistorySeason");
                            oSeasonList.setBusy(true);
                            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GenericSearchSet", {
                                urlParameters : {
                                    "$filter" : "Scenario eq 'SEASON'"
                                }
                            }, function(oModel) {
                                // Success
                                oSeasonList.setModel(oModel);

                                // Bind Items to season List
                                oSeasonList.bindItems({
                                    path : "/results",
                                    template : oSeasonList.getBindingInfo("items") ? oSeasonList.getBindingInfo("items").template : oSeasonList
                                            .getItems()[0].clone()
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

                                // Default record type filter
                                var oDefaultRecordTypeFilter = null;
                                switch (oController.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                    case "TrackLines" :
                                        oCurrentTable = oController.byId("trackLinesTable");
                                        oDefaultRecordTypeFilter = oController._oTrackLinesDefaultFilter;
                                        break;
                                    case "SupplierLines" :
                                        oCurrentTable = oController.byId("supplierLinesTable");
                                        oDefaultRecordTypeFilter = oController._oSupplierLinesDefaultFilter;
                                        break;
                                }

                                // Bind track orders table
                                oCurrentTable.bindAggregation("items", {
                                    path : "/OrderHistorySet",
                                    factory : jQuery.proxy(oController._createOrderHistoryTableRow, oController),
                                    sorter : oController._oOrderHistoryDefaultSorter,
                                    filters : [new sap.ui.model.Filter([oDefaultRecordTypeFilter, oController._oFilter], true)]
                                });

                            }, function(oError) {
                                // Error
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                            });
                        },

                        /**
                         * This method is called when the user navigates from one tab to the other
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleNavigateToAnotherTab : function() {
                            // Update the footer buttons
                            this._updateFooter();

                            this._bindTableWithFilterAndSorter();
                        },

                        /**
                         * This method is called when the show more actions button is pressed. It opens the action sheet and shows buttons for actions
                         * that can be performed on each row.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleOrderHistoryActionSheetOpen : function(oEvent) {

                            var oMoreActionsButton = oEvent.getSource();

                            // create action sheet only once
                            if (!this._oActionSheet) {
                                this._oActionSheet = sap.ui.xmlfragment("trackOrdersActionSheetFragment",
                                        "com.zespri.awct.collab.fragment.TrackOrdersActionSheet", this);
                                this.getView().addDependent(this._oActionSheet);
                            }

                            if (this._oActionSheet.isOpen()) {
                                this._oActionSheet.close();
                            } else {
                                this._oActionSheet.openBy(oMoreActionsButton);
                            }

                            // Update the footer
                            this._updateFooter();
                        },

                        /**
                         * Event handler for the 'row actions' button.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleRowActionsPress : function(oEvent) {
                            switch (this.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                case "TrackLines" :
                                    this._oTrackLinesRowActionsExtension.showRowActions(oEvent.getSource().getBindingContext());
                                    break;
                                case "SupplierLines" :
                                    this._oSupplierLinesRowActionsExtension.showRowActions(oEvent.getSource().getBindingContext());
                                    break;
                            }
                        },

                        /**
                         * Returns the control to be used for the 'actionsContent' of the TableRowActionsExtension instance for this controller.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        _getTableRowActionsContent : function() {
                            var oI18NModel = sap.ui.getCore().getRootComponent().getModel("i18n");
                            var oODataModel = sap.ui.getCore().getRootComponent().getModel();

                            this._oRowActionsCommentsButton = new sap.m.Button({
                                icon : "sap-icon://comment",
                                tooltip : "{i18n>TXT_GENERIC_COMMENTS}",
                                press : [this.handleCommentsDialogOpen, this]
                            });

                            var oButtonsLayout = new sap.ui.commons.layout.HorizontalLayout({
                                content : [
                                // Comments button
                                this._oRowActionsCommentsButton]
                            });
                            // Set I18NModel and OData model
                            oButtonsLayout.setModel(oI18NModel, "i18n");
                            oButtonsLayout.setModel(oODataModel);
                            return oButtonsLayout;
                        },

                        /**
                         * This method is called when the comments button is pressed in the row actions extension
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleCommentsDialogOpen : function() {
                            var oSelectedRowContext = null;
                            switch (this.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                case "TrackLines" :
                                    oSelectedRowContext = this.getView().byId("trackLinesTable").getSelectedItem().getBindingContext();
                                    this._oTrackLinesRowActionsExtension.hideRowActions();
                                    break;
                                case "SupplierLines" :
                                    oSelectedRowContext = this.getView().byId("supplierLinesTable").getSelectedItem().getBindingContext();
                                    this._oSupplierLinesRowActionsExtension.hideRowActions();
                                    break;
                            }

                            if (oSelectedRowContext) {
                                // Creating the instance only once and referring to the same instance every other time
                                if (!this._oOrderHistoryCommentsDialog) {
                                    this._oOrderHistoryCommentsDialog = new sap.ui.xmlfragment("orderHistoryCommentsFragment",
                                            "com.zespri.awct.collab.fragment.OrderHistoryCommentsDialog", this);
                                    this.getView().addDependent(this._oOrderHistoryCommentsDialog);
                                }

                                var oZespriCommentsText = sap.ui.core.Fragment.byId("orderHistoryCommentsFragment", "zespriCommentsText");
                                var oSupplierCommentsText = sap.ui.core.Fragment.byId("orderHistoryCommentsFragment", "supplierCommentsText");

                                // If both Approval comments and Delivery Release comments present or only approval comment exists, show approval
                                // comments
                                if ((oSelectedRowContext.getProperty("ApprovalComment") && oSelectedRowContext.getProperty("DeliveryReleaseComment")) ||
                                        oSelectedRowContext.getProperty("ApprovalComment")) {
                                    oZespriCommentsText.setText(oSelectedRowContext.getProperty("ApprovalComment"));
                                    oZespriCommentsText.removeStyleClass("zAwctTextGrayItalics");
                                }
                                // If only Delivery Release comment exists
                                else if (oSelectedRowContext.getProperty("DeliveryReleaseComment")) {
                                    oZespriCommentsText.setText(oSelectedRowContext.getProperty("DeliveryReleaseComment"));
                                    oZespriCommentsText.removeStyleClass("zAwctTextGrayItalics");
                                } else {

                                    oZespriCommentsText.setText(com.zespri.awct.util.I18NHelper
                                            .getText("TXT_COLLABORATION_ORDERHISTORY_COMMENTS_DIALOG_NO_COMMENTS_TEXT"));
                                    oZespriCommentsText.addStyleClass("zAwctTextGrayItalics");
                                }

                                // Request comments
                                if (oSelectedRowContext.getProperty("RequestComment")) {
                                    oSupplierCommentsText.setText(oSelectedRowContext.getProperty("RequestComment"));
                                    oSupplierCommentsText.removeStyleClass("zAwctTextGrayItalics");
                                } else {
                                    oSupplierCommentsText.setText(com.zespri.awct.util.I18NHelper
                                            .getText("TXT_COLLABORATION_ORDERHISTORY_COMMENTS_DIALOG_NO_COMMENTS_TEXT"));
                                    oSupplierCommentsText.addStyleClass("zAwctTextGrayItalics");
                                }

                                this._oOrderHistoryCommentsDialog.setBindingContext(oSelectedRowContext);

                                this._oOrderHistoryCommentsDialog.open();

                            }
                        },

                        /**
                         * This method is called when the OK button is pressed in the comments dialog
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleOrderHistoryCommentsOKPress : function() {
                            this._oOrderHistoryCommentsDialog.close();
                        },

                        /**
                         * This method is used to apply the filter on either the track orders or track lines table, depending on the current selected
                         * tab
                         * 
                         * @private
                         * @param {sap.ui.model.Filter}
                         *            oFilter the filter object that has to be applied on the currently showing table
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        _applyFilter : function(oFilter) {
                            var oIconTabBar = this.byId("orderHistoryIconTabBar");
                            var oTable = "";
                            var oTableFilter = "";
                            switch (oIconTabBar.getSelectedKey()) {
                                case "TrackLines" :
                                    oTable = this.byId("trackLinesTable");
                                    // If filter is empty, apply empty array as filter (track orders table)
                                    if (!oFilter) {
                                        oFilter = this._oTrackLinesDefaultFilter;
                                    }
                                    oTableFilter = new sap.ui.model.Filter([oFilter, this._oTrackLinesDefaultFilter], true);
                                    break;
                                case "SupplierLines" :
                                    oTable = this.byId("supplierLinesTable");
                                    // If filter is empty, apply default filter (track lines table)
                                    if (!oFilter) {
                                        oFilter = this._oSupplierLinesDefaultFilter;
                                    }
                                    oTableFilter = new sap.ui.model.Filter([oFilter, this._oSupplierLinesDefaultFilter], true);
                                    break;
                            }

                            // Apply filter
                            oTable.getBinding("items").filter(oTableFilter, sap.ui.model.FilterType.Application);

                            // Store the applied filter
                            this._oFilter = oFilter;
                        },

                        /**
                         * This method creates a filter from the selected fields in the facet filter
                         * 
                         * @private
                         * @returns {sap.ui.model.Filter} filter object
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        _getFacetFilterObject : function() {
                            var oFacetFilter = this.byId("facetFilterOrderHistory");
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

                            return oFilter;
                        },

                        /**
                         * This is a private method used to apply the facet filter for the current table
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         * 
                         */
                        _applyFacetFilters : function() {

                            // Get facet filter object
                            var oFilter = this._getFacetFilterObject();

                            // Apply the filter to the table
                            this._applyFilter(oFilter);

                        },

                        /**
                         * This is a private method used to apply the view settings sort parameters to the current table
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        _applyViewSettingsSorting : function() {
                            this.handleOrderHistorySettingsDialogOKPress();
                        },

                        /**
                         * This is a private method to apply the filter and sorter to the table
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        _bindTableWithFilterAndSorter : function() {

                            // Get current table
                            var oCurrentTable = null;
                            switch (this.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                case "TrackLines" :
                                    oCurrentTable = this.byId("trackLinesTable");
                                    break;
                                case "SupplierLines" :
                                    oCurrentTable = this.byId("supplierLinesTable");
                                    break;
                            }

                            // Binding items
                            var oBindingItems = {
                                path : "/OrderHistorySet",
                                factory : jQuery.proxy(this._createOrderHistoryTableRow, this)
                            };

                            if (this.byId("facetFilterOrderHistory").getVisible()) {
                                // Get filter object with selected fields from facet filter
                                this._oFilter = this._getFacetFilterObject();
                            }

                            // Add filter based on the table
                            if (this.byId("orderHistoryIconTabBar").getSelectedKey() === "SupplierLines") {
                                // Default filter for track lines table
                                oBindingItems.filters = [this._oSupplierLinesDefaultFilter];
                                if (this._oFilter) {
                                    oBindingItems.filters = [new sap.ui.model.Filter([this._oSupplierLinesDefaultFilter, this._oFilter], true)];
                                }
                            }
                            // Track Orders table
                            else if (this.byId("orderHistoryIconTabBar").getSelectedKey() === "TrackLines") {
                                oBindingItems.filters = [this._oTrackLinesDefaultFilter];
                                if (this._oFilter) {
                                    oBindingItems.filters = [new sap.ui.model.Filter([this._oTrackLinesDefaultFilter, this._oFilter], true)];
                                }
                            }
                            // Add default sorter
                            oBindingItems.sorter = this._oOrderHistoryDefaultSorter;

                            // Add sorter to the binding items
                            if (this._mParams && this._mParams.sortItem) {
                                var sPath = this._mParams.sortItem.getKey();
                                var bDescending = this._mParams.sortDescending;
                                oBindingItems.sorter = [new sap.ui.model.Sorter(sPath, bDescending), this._oOrderHistoryDefaultSorter];
                            }

                            // Bind items to the table
                            oCurrentTable.bindAggregation("items", oBindingItems);
                        },
                        /**
                         * This method is called when a Facet filter item is pressed
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The Event object
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleListOpen : function(oEvent) {
                            var sSelectedFilterListKey = oEvent.getSource().getKey();
                            var oController = this;
                            var oFilterDetails = {};

                            switch (sSelectedFilterListKey) {
                                case "Season" :
                                    // Preparing Brand Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListOrderHistorySeason");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'SEASON'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "SupplierID" :
                                    // Preparing Supplier Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListOrderHistorySupplier");
                                    oFilterDetails.entitySetName = "SupplierSet";
                                    oFilterDetails.filterString = "UserID eq '" +
                                            oController.getView().getModel("currentUserDetails").getProperty("/UserID") + "'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "ExemptionUserID" :
                                    // Preparing User Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListOrderHistoryUser");
                                    oFilterDetails.entitySetName = "UserSet";
                                    oFilterDetails.selectString = "UserID";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristics/Brand" :
                                    // Preparing Brand Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListOrderHistoryBrand");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'BRAND'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristics/Variety" :
                                    // Preparing Variety Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListOrderHistoryVariety");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'VARIETY'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristics/Class" :
                                    // Preparing Class Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListOrderHistoryClass");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'CLASS'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristics/GrowingMethod" :
                                    // Preparing Growing Method Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListOrderHistoryGrowingMethod");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'GROWING_METHOD'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristics/PalletBase" :
                                    // Preparing Pallet Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListOrderHistoryPallet");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'PALLET_BASE'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristics/Stack" :
                                    // Preparing Stack Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListOrderHistoryStack");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'STACKING_CONFIGURATION'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristics/PackStyle" :
                                    // Preparing Pack style Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListOrderHistoryPackStyle");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'PACK_STYLE'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristics/Size" :
                                    // Preparing Size Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListOrderHistorySize");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'SIZE'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristics/Label" :
                                    // Preparing Class Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListOrderHistoryLabel");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'LABELLING'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;
                            }
                        },
                        /**
                         * This method is called when the Face filter list is closed.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         * @param {sap.ui.base.Event}
                         *            oEvent The Event object
                         */
                        handleListClose : function(oEvent) {

                            // If season facet filter
                            if (oEvent.getSource().getId() === this.createId("facetFilterListOrderHistorySeason")) {
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

                            // Delivery number facet filter
                            // If no delivery numbers are selected, disable the delivery line number facet filter
                            var oDeliveryNumberFacetFilterList = this.byId("facetFilterListOrderHistoryDeliveryNumber");
                            var oDeliveryLineNumberFacetFilterList = this.byId("facetFilterListOrderHistoryLineNumber");
                            if (oDeliveryNumberFacetFilterList.getSelectedItems().length) {
                                oDeliveryLineNumberFacetFilterList.setEnabled(true);
                            } else {
                                oDeliveryLineNumberFacetFilterList.setEnabled(false);
                            }

                            var oFacetFilter = this.byId("facetFilterOrderHistory");
                            if (oFacetFilter.getFiltersModifiedAfterListOpen()) {
                                this._applyFacetFilters();
                            }
                        },

                        /**
                         * This method is called to open the facet filter list for the fields that are dependent on other selected fields
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         * @param {sap.ui.base.Event}
                         *            oEvent The Event object
                         */
                        handleDependentListOpen : function(oEvent) {
                            var sSelectedFilterListKey = oEvent.getSource().getKey();
                            var oFilterDetails = {};

                            var oSeasonFFL = this.getView().byId("facetFilterListOrderHistorySeason");
                            var oShipmentFFL = this.getView().byId("facetFilterListOrderHistoryShipment");
                            var oDeliveryIDFFL = this.getView().byId("facetFilterListOrderHistoryDeliveryNumber");

                            switch (sSelectedFilterListKey) {

                                case "ShipmentID" :
                                    // ShipmentNumber depends on the selected season
                                    var sShipmentNumberFilter = "";
                                    // Selected Seasons
                                    var aSelectedSeasons = Object.getOwnPropertyNames(oSeasonFFL.getSelectedKeys());
                                    if (aSelectedSeasons.length) {
                                        // Create filter string for each season and join them with OR
                                        var aShipmentNumberFilterString = [];
                                        jQuery.each(aSelectedSeasons, function(index, sSeason) {
                                            aShipmentNumberFilterString.push("Season eq '" + sSeason + "'");
                                        });
                                        sShipmentNumberFilter = aShipmentNumberFilterString.join(" or ");
                                    }
                                    // If no seasons are selected, shipments are filtered by current season
                                    else {
                                        var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;
                                        sShipmentNumberFilter = "Season eq '" + sCurrentSeason + "'";
                                    }

                                    oFilterDetails.facetListControl = this.byId("facetFilterListOrderHistoryShipment");
                                    oFilterDetails.entitySetName = "ShipmentSet";
                                    oFilterDetails.filterString = sShipmentNumberFilter;
                                    oFilterDetails.selectString = "ShipmentID";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, true);
                                    break;

                                case "DeliveryID" :
                                    // Delivery Number has to be filtered based on selected shipment id

                                    var sDeliveryNumberFilter = "";

                                    // Selected Shipments
                                    var aSelectedShipments = Object.getOwnPropertyNames(oShipmentFFL.getSelectedKeys());
                                    if (aSelectedShipments.length) {
                                        // Create filter string for each shipment and join them with OR
                                        var aDeliveryNumberFilterString = [];
                                        jQuery.each(aSelectedShipments, function(index, sShipment) {
                                            aDeliveryNumberFilterString.push("ShipmentID eq '" + sShipment + "'");
                                        });
                                        sDeliveryNumberFilter = aDeliveryNumberFilterString.join(" or ");
                                    }

                                    oFilterDetails.facetListControl = this.byId("facetFilterListOrderHistoryDeliveryNumber");
                                    oFilterDetails.entitySetName = "DeliveryHeaderSet";
                                    oFilterDetails.filterString = sDeliveryNumberFilter;
                                    oFilterDetails.selectString = "DeliveryHeaderID";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, true);
                                    break;

                                case "ContainerID" :
                                    // Container ID has to be filtered based on selected shipment ids

                                    var sContainerIDFilter = "";
                                    var aContainerFilterString = [];

                                    // Selected Shipments
                                    var aSelectedShipmentIDs = Object.getOwnPropertyNames(oShipmentFFL.getSelectedKeys());
                                    if (aSelectedShipmentIDs.length) {
                                        // Create filter string for each shipment and join them with OR
                                        var aContainerIDShipmentFilterString = [];
                                        jQuery.each(aSelectedShipmentIDs, function(index, sShipment) {
                                            aContainerIDShipmentFilterString.push("ShipmentID eq '" + sShipment + "'");
                                        });
                                        sContainerIDFilter = aContainerIDShipmentFilterString.join(" or ");
                                        aContainerFilterString.push(sContainerIDFilter);
                                    }

                                    oFilterDetails.facetListControl = this.byId("facetFilterListOrderHistoryContainerID");
                                    oFilterDetails.entitySetName = "ContainerSet";
                                    oFilterDetails.filterString = sContainerIDFilter;
                                    oFilterDetails.selectString = "ContainerID";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, true);
                                    break;

                                case "DeliveryLineNumber" :
                                    // Delivery line number depends on Delivery ID
                                    oFilterDetails.facetListControl = this.byId("facetFilterListOrderHistoryLineNumber");
                                    oFilterDetails.entitySetName = "GetLineNumbersForDelivery";
                                    oFilterDetails.urlParameter = {
                                        "DeliveryID" : "'" + Object.getOwnPropertyNames(oDeliveryIDFFL.getSelectedKeys()) + "'"
                                    };
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, true);
                                    break;
                            }
                        },
                        /**
                         * This method is called when any selection of a facet filter list, having dependents, is changed.
                         * 
                         * When selected item(s) of a facet filter is changed, all its dependent filters are reset.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * 
                         */
                        handleFilterListSelectionChanged : function(oEvent) {

                            // find the key of selected facet filter list
                            var sSelectedFilterListKey = oEvent.getSource().getKey();

                            // Fetch the dependent facet filter lists
                            var oDeliveryIDFFL = this.getView().byId("facetFilterListOrderHistoryDeliveryNumber");
                            var oContainerIDFFL = this.getView().byId("facetFilterListOrderHistoryContainerID");
                            var oDeliveryNumberFFL = this.getView().byId("facetFilterListOrderHistoryLineNumber");

                            // Dependent filters should be reset when filters on which they are dependent are changed.
                            switch (sSelectedFilterListKey) {
                                case "ShipmentID" :
                                    oDeliveryIDFFL.setSelectedKeys();
                                    oContainerIDFFL.setSelectedKeys();
                                    oDeliveryNumberFFL.setSelectedKeys();
                                    break;

                                case "DeliveryID" :
                                    oContainerIDFFL.setSelectedKeys();
                                    oDeliveryNumberFFL.setSelectedKeys();
                                    break;
                            }

                        },

                        /**
                         * This method is called when the Reset button of the facet filter is pressed
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleFacetFilterReset : function() {
                            var oFacetFilter = this.byId("facetFilterOrderHistory");
                            var aFacetFilterLists = oFacetFilter.getLists();

                            // Reset the facet filter
                            for ( var i = 0; i < aFacetFilterLists.length; i++) {
                                aFacetFilterLists[i].setSelectedKeys();
                            }

                            var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;
                            var oSeasonList = this.byId("facetFilterListOrderHistorySeason");
                            var oCurrentSeasonKey = {};
                            oCurrentSeasonKey[sCurrentSeason] = sCurrentSeason;
                            // Select the current season in the facet filter
                            if (oSeasonList.getItems().length) {
                                oSeasonList.setSelectedKeys(oCurrentSeasonKey);
                            }
                            // Get facet filter object
                            this._oFilter = this._getFacetFilterObject();

                            // apply facet filter object for track orders table
                            this._applyFilter(this._oFilter);

                            // Disable the delivery line number facet filter
                            this.byId("facetFilterListOrderHistoryLineNumber").setEnabled(false);
                        },

                        /* Batch Request exemption */

                        /**
                         * This method is called when the request exemption button is pressed in the Batch Request Exemption Dialog
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleOrderHistoryBatchRequestExemptionPress : function() {

                            var oController = this;
                            var oModel = this.getView().getModel();
                            var aBatchRequests = [];
                            var aCurrentTableSelectedContexts = [];
                            switch (this.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                case "TrackLines" :
                                    aCurrentTableSelectedContexts = this._aSelectedTrackOrderRowContexts;
                                    break;
                                case "SupplierLines" :
                                    aCurrentTableSelectedContexts = this._aSelectedSupplierLinesRowContexts;
                                    break;
                            }

                            // Add parameters for Batch Request Exemption

                            var oReasonCodeSelect = sap.ui.core.Fragment.byId("batchRequestExemptionFragment", "requestExemptionReasonSelect");
                            var sSelectedReasonCode = oReasonCodeSelect.getSelectedKey();
                            var sComments = sap.ui.core.Fragment.byId("batchRequestExemptionFragment", "commentsTextArea").getValue();

                            jQuery.each(aCurrentTableSelectedContexts, function(sId, oContext) {
                                // Get the key to use for UPDATE (OrderHistoryID is the key)
                                var sEntityKey = oContext.getProperty("OrderHistoryID");

                                // Form the payload
                                var oPayload = {};
                                oPayload.OrderHistoryID = sEntityKey;
                                oPayload.ExemptionRequested = parseFloat(oContext.getProperty("ChargeQuantity")) + "";
                                oPayload.ReasonCode = sSelectedReasonCode;
                                oPayload.RequestComment = sComments;
                                oPayload.ChargeTimestamp = com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(oContext
                                        .getProperty("ChargeTimestamp"), true);

                                // Create a new operation
                                var sEntityURI = "OrderHistorySet('" + sEntityKey + "')";
                                var oBatchOperation = oModel.createBatchOperation(sEntityURI, "PATCH", oPayload);
                                aBatchRequests.push(oBatchOperation);
                            });

                            oModel.addBatchChangeOperations(aBatchRequests);
                            this._oBatchRequestExemptionDialog.setBusy(true);

                            // Set Request exemption header
                            oModel.setHeaders({
                                "BusinessAction" : this._BusinessAction.REQUEST
                            });

                            // Do not update the selected context array
                            oController._bSubmitBatchCalled = true;

                            oModel.submitBatch(function(oData, oResponse, aErrorResponses) {
                                // Success
                                var bErrorMessageShown = com.zespri.awct.util.NotificationHelper.handleErrorMessage(aErrorResponses);
                                // Remove headers
                                oModel.setHeaders(null);

                                oController._oBatchRequestExemptionDialog.setBusy(false);
                                oController._oBatchRequestExemptionDialog.close();
                                if (!bErrorMessageShown) {
                                    com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper
                                            .getText("TXT_COLLABORATION_ORDERHISTORY_BATCH_REQUEST_EXEMPTION_SUCCESS_TOAST"));
                                }
                                // After success, the checkboxes get deselected
                                oController._aSelectedTrackOrderRowContexts = [];
                                oController._aSelectedSupplierLinesRowContexts = [];
                            }, function(oError) {
                                // Error
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                oController._oBatchRequestExemptionDialog.setBusy(false);
                                oController._oBatchRequestExemptionDialog.close();
                            });
                        },

                        /**
                         * This method is called when the close button is pressed in the Batch Request Exemption Dialog
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleOrderHistoryBatchRequestExemptionDialogClose : function() {
                            this._oBatchRequestExemptionDialog.close();
                        },

                        /* Request Exemption */

                        /**
                         * This method is called when the Request Exemption button is pressed in the Request Exemption Dialog (when a single row is
                         * selected from the table)
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleOrderHistoryRequestExemptionPress : function() {

                            var oController = this;
                            var oModel = this.getView().getModel();
                            var aCurrentTableSelectedContexts = [];
                            switch (this.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                case "TrackLines" :
                                    aCurrentTableSelectedContexts = this._aSelectedTrackOrderRowContexts;
                                    break;
                                case "SupplierLines" :
                                    aCurrentTableSelectedContexts = this._aSelectedSupplierLinesRowContexts;
                                    break;
                            }

                            // Exemption requested quantity should be less than charge quantity
                            var oChargeQuantityInput = sap.ui.core.Fragment.byId("requestExemptionFragment", "chargeQuantityInput");
                            var oExemptionRequestedQuantityInput = sap.ui.core.Fragment.byId("requestExemptionFragment",
                                    "exemptionRequestedQuantityInput");

                            var iExemptionRequestedQuantity = parseInt(oExemptionRequestedQuantityInput.getValue(), 10);
                            var iChargeQuantity = parseInt(oChargeQuantityInput.getBindingContext().getProperty("ChargeQuantity"), 10);

                            // If exemption requested quantity is not an integer or greater than charge quantity, then set error state
                            if (!(!isNaN(iExemptionRequestedQuantity) && (Math.round(iExemptionRequestedQuantity) === parseFloat(iExemptionRequestedQuantity))) ||
                                    (iExemptionRequestedQuantity > Math.abs(iChargeQuantity)) || (iExemptionRequestedQuantity < 0)) {

                                oExemptionRequestedQuantityInput.setValueState(sap.ui.core.ValueState.Error);
                                oExemptionRequestedQuantityInput
                                        .setValueStateText(com.zespri.awct.util.I18NHelper
                                                .getText("TXT_COLLABORATION_ORDERHISTORY_REQUEST_EXEMPTION_DIALOG_REQUEST_EXEMPTION_QUANTITY_ERROR_VALUE_STATE_TEXT_MESSAGE"));

                            } else {

                                // Form the payload
                                var oPayload = {};
                                var sEntityKey = aCurrentTableSelectedContexts[0].getProperty("OrderHistoryID");

                                var oRequestExemptionReasonCodeSelect = sap.ui.core.Fragment.byId("requestExemptionFragment",
                                        "requestExemptionReasonSelect");
                                var sSelectedReasonCode = oRequestExemptionReasonCodeSelect.getSelectedKey();
                                var sRequestExemptionComments = sap.ui.core.Fragment.byId("requestExemptionFragment", "commentsTextArea").getValue();

                                // Add parameters for Request Exemption (Single row)
                                oPayload.OrderHistoryID = sEntityKey;
                                oPayload.ExemptionRequested = parseFloat(iExemptionRequestedQuantity) + "";
                                oPayload.ReasonCode = sSelectedReasonCode;
                                oPayload.RequestComment = sRequestExemptionComments;
                                oPayload.ChargeTimestamp = com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(
                                        aCurrentTableSelectedContexts[0].getProperty("ChargeTimestamp"), true);

                                // Create a new operation
                                var sEntityURI = "OrderHistorySet('" + sEntityKey + "')";

                                var oBatchOperation = oModel.createBatchOperation(sEntityURI, "PATCH", oPayload);

                                oModel.addBatchChangeOperations([oBatchOperation]);
                                this._oRequestExemptionDialog.setBusy(true);

                                // Set Request exemption header
                                oModel.setHeaders({
                                    "BusinessAction" : this._BusinessAction.REQUEST
                                });

                                // Do not update the selected context array
                                oController._bSubmitBatchCalled = true;

                                oModel.submitBatch(function(oData, oResponse, aErrorResponses) {
                                    // Success
                                    var bErrorMessageShown = com.zespri.awct.util.NotificationHelper.handleErrorMessage(aErrorResponses);
                                    // Remove headers
                                    oModel.setHeaders(null);

                                    oController._oRequestExemptionDialog.setBusy(false);
                                    oController._oRequestExemptionDialog.close();
                                    if (!bErrorMessageShown) {
                                        com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper
                                                .getText("TXT_COLLABORATION_ORDERHISTORY_REQUEST_EXEMPTION_SUCCESS_TOAST"));
                                    }
                                    // After success, the checkboxes get deselected
                                    oController._aSelectedTrackOrderRowContexts = [];
                                    oController._aSelectedSupplierLinesRowContexts = [];
                                }, function(oError) {
                                    // Error
                                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                    // Remove headers
                                    oModel.setHeaders(null);

                                    oController._oRequestExemptionDialog.setBusy(false);
                                    oController._oRequestExemptionDialog.close();
                                });
                            }
                        },

                        /**
                         * This method is called when the Close button is pressed in the Request Exemption Dialog (when a single row is selected from
                         * the table)
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleOrderHistoryRequestExemptionDialogClose : function() {
                            this._oRequestExemptionDialog.close();
                        },

                        /**
                         * This method is called when the Request exemption button is pressed from the Action sheet.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleRequestExemptionDialogOpen : function() {

                            var aTableSelectedItems = null;
                            switch (this.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                case "TrackLines" :
                                    aTableSelectedItems = this._aSelectedTrackOrderRowContexts;
                                    break;
                                case "SupplierLines" :
                                    aTableSelectedItems = this._aSelectedSupplierLinesRowContexts;
                                    break;
                            }

                            // If a single row is selected from the table
                            if (aTableSelectedItems.length === 1) {
                                var oSelectedRowContext = aTableSelectedItems[0];

                                if (!this._oRequestExemptionDialog) {
                                    this._oRequestExemptionDialog = new sap.ui.xmlfragment("requestExemptionFragment",
                                            "com.zespri.awct.collab.fragment.RequestExemptionDialog", this);
                                    this.getView().addDependent(this._oRequestExemptionDialog);
                                }
                                this._oRequestExemptionDialog.setBindingContext(oSelectedRowContext);
                                this._oRequestExemptionDialog.open();

                                var oExemptionRequestedQuantityInput = sap.ui.core.Fragment.byId("requestExemptionFragment",
                                        "exemptionRequestedQuantityInput");
                                oExemptionRequestedQuantityInput.setValue(parseInt(Math.abs(oSelectedRowContext.getProperty("ChargeQuantity")), 10));
                                oExemptionRequestedQuantityInput.setValueState(sap.ui.core.ValueState.None);

                                // Clear the comments box
                                sap.ui.core.Fragment.byId("requestExemptionFragment", "commentsTextArea").setValue("");
                            }
                            // If multiple rows are selected from the table
                            else if (aTableSelectedItems.length > 1) {

                                if (!this._oBatchRequestExemptionDialog) {
                                    this._oBatchRequestExemptionDialog = new sap.ui.xmlfragment("batchRequestExemptionFragment",
                                            "com.zespri.awct.collab.fragment.BatchRequestExemptionDialog", this);
                                    this.getView().addDependent(this._oBatchRequestExemptionDialog);
                                }
                                this._oBatchRequestExemptionDialog.open();

                                // Clear the comments box
                                sap.ui.core.Fragment.byId("batchRequestExemptionFragment", "commentsTextArea").setValue("");

                            }
                            // If no rows are selected from the table
                            else {
                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_COLLABORATION_ORDERHISTORY_REQUEST_EXEMPTION_ERROR_MESSAGE"));
                            }
                        },

                        /* Grant Exemption */

                        /**
                         * This method is called when the Grant Exemption button is pressed from the Action sheet
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */

                        handleGrantExemptionDialogOpen : function() {

                            var aTableSelectedItems = null;
                            switch (this.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                case "TrackLines" :
                                    aTableSelectedItems = this._aSelectedTrackOrderRowContexts;
                                    break;
                                case "SupplierLines" :
                                    aTableSelectedItems = this._aSelectedSupplierLinesRowContexts;
                                    break;
                            }

                            // If single row is selected from the table
                            if (aTableSelectedItems.length === 1) {

                                var oSelectedRowContext = aTableSelectedItems[0];

                                if (!this._oGrantExemptionDialog) {
                                    this._oGrantExemptionDialog = new sap.ui.xmlfragment("grantExemptionFragment",
                                            "com.zespri.awct.collab.fragment.GrantExemptionDialog", this);
                                    this.getView().addDependent(this._oGrantExemptionDialog);
                                }

                                this._oGrantExemptionDialog.setBindingContext(oSelectedRowContext);

                                // Reset Exemption acceptance quantity
                                sap.ui.core.Fragment.byId("grantExemptionFragment", "exemptionAcceptanceQuantityInput").setValueState(
                                        sap.ui.core.ValueState.None);
                                sap.ui.core.Fragment.byId("grantExemptionFragment", "exemptionAcceptanceQuantityInput").setValue(
                                        Math.abs(oSelectedRowContext.getProperty("ExemptionRequested")));

                                // Clear the comments textbox
                                sap.ui.core.Fragment.byId("grantExemptionFragment", "commentsTextArea").setValue("");

                                this._oGrantExemptionDialog.open();

                            }
                            // If multiple rows are selected from the table
                            else if (aTableSelectedItems.length > 1) {

                                // Create batch grant exemption dialog only once
                                if (!this._oBatchGrantExemptionDialog) {
                                    this._oBatchGrantExemptionDialog = new sap.ui.xmlfragment("batchGrantExemptionFragment",
                                            "com.zespri.awct.collab.fragment.BatchGrantExemptionDialog", this);
                                    this.getView().addDependent(this._oBatchGrantExemptionDialog);
                                }
                                // Clear the comments textarea
                                sap.ui.core.Fragment.byId("batchGrantExemptionFragment", "commentsTextArea").setValue("");

                                this._oBatchGrantExemptionDialog.open();

                            }
                            // If no rows are selected from the table
                            else {
                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_COLLABORATION_ORDERHISTORY_GRANT_EXEMPTION_ERROR_MESSAGE"));
                            }
                        },

                        /* Batch Grant exemption */

                        /**
                         * This method is called when Batch Grant Exemption is triggerred from the batch grant exemption fragment
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleOrderHistoryBatchGrantExemptionPress : function() {

                            var oController = this;
                            var oModel = this.getView().getModel();
                            var aBatchRequest = [];
                            var aCurrentTableSelectedContexts = [];
                            var sComments = sap.ui.core.Fragment.byId("batchGrantExemptionFragment", "commentsTextArea").getValue();
                            switch (this.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                case "TrackLines" :
                                    aCurrentTableSelectedContexts = this._aSelectedTrackOrderRowContexts;
                                    break;
                                case "SupplierLines" :
                                    aCurrentTableSelectedContexts = this._aSelectedSupplierLinesRowContexts;
                                    break;
                            }

                            // Add parameters for Batch Grant Exemption

                            jQuery.each(aCurrentTableSelectedContexts, function(sId, oContext) {
                                // Form the payload
                                var oPayload = {};

                                var sEntityKey = oContext.getProperty("OrderHistoryID");
                                oPayload.OrderHistoryID = sEntityKey;
                                oPayload.ExemptionAccepted = parseFloat(oContext.getProperty("ExemptionRequested")) + "";
                                oPayload.ChargeTimestamp = com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(oContext
                                        .getProperty("ChargeTimestamp"), true);
                                oPayload.ApprovalComment = sComments;

                                // Create new operation
                                var sEntityURI = "OrderHistorySet('" + sEntityKey + "')";
                                var oBatchOperation = oModel.createBatchOperation(sEntityURI, "PATCH", oPayload);
                                aBatchRequest.push(oBatchOperation);
                            });

                            oModel.addBatchChangeOperations(aBatchRequest);

                            // Set Request exemption header
                            oModel.setHeaders({
                                "BusinessAction" : this._BusinessAction.APPROVE
                            });
                            this._oBatchGrantExemptionDialog.setBusy(true);

                            // Do not update the selected context array
                            oController._bSubmitBatchCalled = true;

                            oModel.submitBatch(function(oData, oResponse, aErrorResponses) {
                                // Success
                                var bErrorMessageShown = com.zespri.awct.util.NotificationHelper.handleErrorMessage(aErrorResponses);
                                // Remove headers
                                oModel.setHeaders(null);
                                oController._oBatchGrantExemptionDialog.setBusy(false);
                                oController._oBatchGrantExemptionDialog.close();
                                if (!bErrorMessageShown) {
                                    com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper
                                            .getText("TXT_COLLABORATION_ORDERHISTORY_BATCH_GRANT_EXEMPTION_SUCCESS_TOAST"));
                                }
                                // After success, the checkboxes get deselected
                                oController._aSelectedTrackOrderRowContexts = [];
                                oController._aSelectedSupplierLinesRowContexts = [];
                            }, function(oError) {
                                // Error
                                oController._oBatchGrantExemptionDialog.setBusy(false);
                                // Remove headers
                                oModel.setHeaders(null);

                                oController._oBatchGrantExemptionDialog.close();
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                            });
                        },

                        /**
                         * This method is called when the Batch grant exemption dialog is closed
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleOrderHistoryBatchGrantExemptionDialogClose : function() {
                            this._oBatchGrantExemptionDialog.close();
                        },

                        /* Grant Exemption */

                        /**
                         * This method is called when the Grant Exemption button is pressed in the Grant exemption dialog
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleOrderHistoryGrantExemptionPress : function() {
                            var oController = this;
                            var oExemptionAcceptanceQuantityInput = sap.ui.core.Fragment.byId("grantExemptionFragment",
                                    "exemptionAcceptanceQuantityInput");
                            var oChargeQuantityInput = sap.ui.core.Fragment.byId("grantExemptionFragment", "chargeQuantityInput");
                            var sComments = sap.ui.core.Fragment.byId("grantExemptionFragment", "commentsTextArea").getValue();

                            var iExemptionAcceptanceQuantity = parseInt(oExemptionAcceptanceQuantityInput.getValue(), 10);
                            var iChargeQuantity = parseInt(oChargeQuantityInput.getBindingContext().getProperty("ChargeQuantity"), 10);

                            // If exemption acceptance quantity is not an integer or greater than charge quantity, then set error state
                            if (!(!isNaN(iExemptionAcceptanceQuantity) && (Math.round(iExemptionAcceptanceQuantity) === parseFloat(iExemptionAcceptanceQuantity))) ||
                                    (iExemptionAcceptanceQuantity > Math.abs(iChargeQuantity)) || (iExemptionAcceptanceQuantity <= 0)) {
                                oExemptionAcceptanceQuantityInput.setValueState(sap.ui.core.ValueState.Error);
                                oExemptionAcceptanceQuantityInput
                                        .setValueStateText(com.zespri.awct.util.I18NHelper
                                                .getText("TXT_COLLABORATION_ORDERHISTORY_GRANT_EXEMPTION_DIALOG_GRANT_EXEMPTION_ERROR_VALUE_STATE_TEXT_MESSAGE"));
                            } else {
                                oExemptionAcceptanceQuantityInput.setValueState(sap.ui.core.ValueState.None);

                                var oModel = this.getView().getModel();
                                var aCurrentTableSelectedContexts = [];
                                switch (this.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                    case "TrackLines" :
                                        aCurrentTableSelectedContexts = this._aSelectedTrackOrderRowContexts;
                                        break;
                                    case "SupplierLines" :
                                        aCurrentTableSelectedContexts = this._aSelectedSupplierLinesRowContexts;
                                        break;
                                }

                                // Form the payload
                                var oPayload = {};

                                var sEntityKey = aCurrentTableSelectedContexts[0].getProperty("OrderHistoryID");

                                // Add parameters for Grant Exemption (Single row)

                                oPayload.OrderHistoryID = sEntityKey;
                                oPayload.ExemptionAccepted = parseFloat(oExemptionAcceptanceQuantityInput.getValue()) + "";
                                oPayload.ApprovalComment = sComments;
                                oPayload.ChargeTimestamp = com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(
                                        aCurrentTableSelectedContexts[0].getProperty("ChargeTimestamp"), true);

                                // Create new operation
                                var sEntityURI = "OrderHistorySet('" + sEntityKey + "')";
                                var oBatchOperation = oModel.createBatchOperation(sEntityURI, "PATCH", oPayload);

                                oModel.addBatchChangeOperations([oBatchOperation]);
                                this._oGrantExemptionDialog.setBusy(true);

                                // Set Request exemption header
                                oModel.setHeaders({
                                    "BusinessAction" : this._BusinessAction.APPROVE
                                });

                                // Do not update the selected context array
                                oController._bSubmitBatchCalled = true;

                                oModel.submitBatch(function(oData, oResponse, aErrorResponses) {
                                    // Success
                                    var bErrorMessageShown = com.zespri.awct.util.NotificationHelper.handleErrorMessage(aErrorResponses);
                                    // Remove headers
                                    oModel.setHeaders(null);

                                    oController._oGrantExemptionDialog.setBusy(false);
                                    oController._oGrantExemptionDialog.close();
                                    if (!bErrorMessageShown) {
                                        com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper
                                                .getText("TXT_COLLABORATION_ORDERHISTORY_GRANT_EXEMPTION_SUCCESS_TOAST"));
                                    }
                                    // After success, the checkboxes get deselected
                                    oController._aSelectedTrackOrderRowContexts = [];
                                    oController._aSelectedSupplierLinesRowContexts = [];
                                }, function(oError) {
                                    // Error
                                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                    // Remove headers
                                    oModel.setHeaders(null);

                                    oController._oGrantExemptionDialog.setBusy(false);
                                    oController._oGrantExemptionDialog.close();
                                });
                            }
                        },

                        /* Reject Exemption */

                        /**
                         * This method is called when Reject exemption button is pressed in the action sheet
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleRejectExemptionDialogOpen : function() {

                            var aTableSelectedItems = null;
                            var bOpenDialog = true;
                            switch (this.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                case "TrackLines" :
                                    aTableSelectedItems = this._aSelectedTrackOrderRowContexts;
                                    break;
                                case "SupplierLines" :
                                    aTableSelectedItems = this._aSelectedSupplierLinesRowContexts;
                                    break;
                            }

                            // Loop through the selected items and check whether all itesm have status pending and requested exemption qty > 0, else
                            // dont open the dialog
                            jQuery.each(aTableSelectedItems, function(iIndex, oSelectedItemContext) {
                                var sExemptionStatus = oSelectedItemContext.getProperty("ExemptionStatus");
                                if (sExemptionStatus !== com.zespri.awct.util.Enums.ExemptionStatus.PENDING ||
                                        oSelectedItemContext.getProperty("ExemptionRequested") <= 0) {
                                    bOpenDialog = false;
                                }
                            });

                            if (aTableSelectedItems.length) {
                                if (!bOpenDialog) {
                                    com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                            .getText("TXT_COLLABORATION_ORDERHISTORY_REJECT_EXEMPTION_CONDITIONS_NOT_SATISFIED_ERROR_MESSAGE"));
                                    return;
                                }
                                // Create reject exemption dialog only once
                                if (!this._oRejectExemptionDialog) {
                                    this._oRejectExemptionDialog = new sap.ui.xmlfragment("rejectExemptionFragment",
                                            "com.zespri.awct.collab.fragment.OrderHistoryRejectExemptionDialog", this);
                                    this.getView().addDependent(this._oRejectExemptionDialog);
                                }
                                // Clear the comments textarea
                                sap.ui.core.Fragment.byId("rejectExemptionFragment", "commentsTextArea").setValue("");

                                this._oRejectExemptionDialog.open();
                            } else {
                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_COLLABORATION_ORDERHISTORY_REJECT_EXEMPTION_ERROR_MESSAGE"));
                            }
                        },

                        /**
                         * This method is called when OK button is pressed in reject exemption dialog
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleOrderHistoryRejectExemptionOKPress : function() {

                            var oController = this;
                            var oModel = this.getView().getModel();
                            var aBatchRequest = [];
                            var aCurrentTableSelectedContexts = [];
                            var sComments = sap.ui.core.Fragment.byId("rejectExemptionFragment", "commentsTextArea").getValue();
                            switch (this.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                case "TrackLines" :
                                    aCurrentTableSelectedContexts = this._aSelectedTrackOrderRowContexts;
                                    break;
                                case "SupplierLines" :
                                    aCurrentTableSelectedContexts = this._aSelectedSupplierLinesRowContexts;
                                    break;
                            }

                            // Add parameters for rejecting Exemption
                            jQuery.each(aCurrentTableSelectedContexts, function(sId, oContext) {
                                // Form the payload
                                var oPayload = {};
                                var sEntityKey = oContext.getProperty("OrderHistoryID");
                                oPayload.OrderHistoryID = sEntityKey;
                                // Exemptionaccepted quantity is 0 for reject exemption
                                oPayload.ExemptionAccepted = "0";
                                oPayload.ChargeTimestamp = com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(oContext
                                        .getProperty("ChargeTimestamp"), true);
                                oPayload.ApprovalComment = sComments;

                                // Create new operation
                                var sEntityURI = "OrderHistorySet('" + sEntityKey + "')";
                                var oBatchOperation = oModel.createBatchOperation(sEntityURI, "PATCH", oPayload);
                                aBatchRequest.push(oBatchOperation);
                            });

                            oModel.addBatchChangeOperations(aBatchRequest);

                            // Set Request exemption header
                            oModel.setHeaders({
                                "BusinessAction" : this._BusinessAction.APPROVE
                            });
                            this._oRejectExemptionDialog.setBusy(true);
                            // Do not update the selected context array
                            oController._bSubmitBatchCalled = true;

                            oModel.submitBatch(function(oData, oResponse, aErrorResponses) {
                                // Success
                                var bErrorMessageShown = com.zespri.awct.util.NotificationHelper.handleErrorMessage(aErrorResponses);
                                // Remove headers
                                oModel.setHeaders(null);
                                oController._oRejectExemptionDialog.setBusy(false);
                                oController._oRejectExemptionDialog.close();

                                // Show different messages if single row/multiple rows are selected for rejecting exemption
                                var iSelectedRowCount = 0;
                                switch (oController.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                    case "TrackLines" :
                                        iSelectedRowCount = oController._aSelectedTrackOrderRowContexts.length;
                                        break;
                                    case "SupplierLines" :
                                        iSelectedRowCount = oController._aSelectedSupplierLinesRowContexts.length;
                                        break;
                                }
                                if (!bErrorMessageShown) {
                                    var sRejectExemptionSuccessMessage = "";
                                    if (iSelectedRowCount === 1) {
                                        sRejectExemptionSuccessMessage = com.zespri.awct.util.I18NHelper
                                                .getText("TXT_COLLABORATION_ORDERHISTORY_SINGLE_ROW_REJECT_EXEMPTION_SUCCESS_TOAST");
                                    } else {
                                        sRejectExemptionSuccessMessage = com.zespri.awct.util.I18NHelper
                                                .getText("TXT_COLLABORATION_ORDERHISTORY_MULTIPLE_ROWS_REJECT_EXEMPTION_SUCCESS_TOAST");
                                    }

                                    // Show success message
                                    com.zespri.awct.util.NotificationHelper.showSuccessToast(sRejectExemptionSuccessMessage);
                                }
                                // After success, the checkboxes get deselected
                                oController._aSelectedTrackOrderRowContexts = [];
                                oController._aSelectedSupplierLinesRowContexts = [];
                            }, function(oError) {
                                // Error
                                oController._oRejectExemptionDialog.setBusy(false);
                                // Remove headers
                                oModel.setHeaders(null);

                                oController._oRejectExemptionDialog.close();
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                            });

                        },

                        /**
                         * This method is called when Close button in the reject exemption dialog is pressed
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleOrderHistoryRejectExemptionClosePress : function() {
                            this._oRejectExemptionDialog.close();
                        },

                        /**
                         * This method is called when the Close button is pressed in the Grant Exemption Dialog
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleOrderHistoryGrantExemptionDialogClose : function() {
                            this._oGrantExemptionDialog.close();
                        },

                        /**
                         * This method is called when Export as CSV button is pressed.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleExportAsCSVButtonPressed : function() {

                            var sFilterString = "";
                            // If navigating from search form
                            if (this._sDownloadFilterString) {
                                sFilterString = this._sDownloadFilterString;
                            } else {
                                sFilterString = this._createFilterString();
                            }

                            // Record type filter is based on the tab selected
                            var sRecordType = "";
                            if (this.byId("orderHistoryIconTabBar").getSelectedKey() === "TrackLines") {
                                sRecordType = com.zespri.awct.util.Enums.AllocationLineRecordType.DeliveryLine;
                            } else {
                                sRecordType = com.zespri.awct.util.Enums.AllocationLineRecordType.SupplierOrderLine;
                            }
                            sFilterString = sFilterString + " and (RecordType eq '" + sRecordType + "')";

                            // Set headers
                            var oModel = this.getView().getModel();
                            oModel.setHeaders({
                                "BusinessAction" : this._BusinessAction.DOWNLOAD,
                                "FileType" : this._FileType.CSV
                            });

                            // Show busy dialog
                            this._oBusyDialog.open();
                            var oController = this;

                            // Read
                            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/OrderHistorySet", {
                                urlParameters : {
                                    "$filter" : sFilterString
                                }
                            }, function(oJSON) {
                                // Success
                                oModel.setHeaders(null);
                                oController._oBusyDialog.close();

                                // File guid
                                var sFileGuid = oJSON.getData().results[0].FileGuid;

                                // If file Guid is string of zero , then show "No Matching results found"
                                if (parseInt(sFileGuid, 10) === 0 && (!isNaN(sFileGuid))) {
                                    // Toast to show "No Matching results found"
                                    com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper
                                            .getText("TXT_GENERIC_DOWNLOAD_NO_MATCHING_RESULTS_FOUND_MESSAGE"));
                                    return;
                                }
                                // Toast to show start of download
                                com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_REPORTS_GENERATE_FORM_STARTING_DOWNLOAD_TOAST_MESSAGE"));

                                // Start download
                                window.location.href = window.location.protocol + "//" + window.location.host +
                                        "/sap/opu/odata/sap/Z_AWCT_SRV/FileDownloadSet('" + sFileGuid + "')/$value";

                            }, function(oError) {
                                // Error
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                oModel.setHeaders(null);
                                oController._oBusyDialog.close();
                            });
                        },

                        /**
                         * This method is used to concatenate all the parameters with hyphen and return the string
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         * @param {String}
                         *            sBrand Brand
                         * @param {String}
                         *            sVariety Variety
                         * @param {String}
                         *            sClass Class
                         * @param {String}
                         *            sGrowingMethod Growing method
                         * @param {String}
                         *            sSize Size
                         * @param {String}
                         *            sPalletBase Pallet base
                         * @param {String}
                         *            sStack Stacking Configuration
                         * @param {String}
                         *            sPackStyle Pack Style
                         * @param {String}
                         *            sLabel Label
                         * @returns {String} the concatenated string
                         */
                        formatProductName : function(sBrand, sVariety, sClass, sGrowingMethod, sSize, sPalletBase, sStack, sPackStyle, sLabel) {
                            return sBrand + '-' + sVariety + '-' + sClass + '-' + sGrowingMethod + '-' + sSize + '-' + sPalletBase + '-' + sStack +
                                    '-' + sPackStyle + '-' + sLabel;
                        },

                        /**
                         * This method is used to find the position of the item id in the list of items
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         * @param {String}
                         *            sId the Order History ID
                         * @param {Array}
                         *            aArray the array in which the Order History ID index has to be determined
                         * @returns {Number} Index of the Order History item in the array
                         */
                        _findIndexInArray : function(sId, aArray) {
                            var iRequiredPosition = -1;
                            jQuery.each(aArray, function(iIndex, oEachContext) {
                                if (oEachContext.getProperty("OrderHistoryID") === sId) {
                                    iRequiredPosition = iIndex;
                                }
                            });
                            return iRequiredPosition;
                        },

                        /**
                         * This method is called when the Checkbox in a row is toggled.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         * @param {sap.ui.base.Event}
                         *            oEvent The Event object
                         */
                        handleChangeCheckboxSelection : function(oEvent) {
                            var oSelectedRowContext = oEvent.getSource().getBindingContext();
                            var sSelectedOrderHistoryId = "";
                            var iIndex = 0;
                            // Check current table
                            switch (this.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                case "TrackLines" :
                                    // If checkbox is selected
                                    if (oEvent.getSource().getSelected()) {
                                        // add selected row context to the array
                                        this._aSelectedTrackOrderRowContexts.push(oSelectedRowContext);
                                    } else {
                                        // Id of the deselected row
                                        sSelectedOrderHistoryId = oSelectedRowContext.getProperty("OrderHistoryID");
                                        // Find position of the id in the array
                                        iIndex = this._findIndexInArray(sSelectedOrderHistoryId, this._aSelectedTrackOrderRowContexts);
                                        // Remove the item from the array
                                        this._aSelectedTrackOrderRowContexts.splice(iIndex, 1);
                                    }
                                    break;
                                case "SupplierLines" :
                                    // If checkbox is selected
                                    if (oEvent.getSource().getSelected()) {
                                        // add selected row context to the array
                                        this._aSelectedSupplierLinesRowContexts.push(oSelectedRowContext);
                                    } else {
                                        // Id of the deselected row
                                        sSelectedOrderHistoryId = oSelectedRowContext.getProperty("OrderHistoryID");
                                        // Find position of the id in the array
                                        iIndex = this._findIndexInArray(sSelectedOrderHistoryId, this._aSelectedSupplierLinesRowContexts);
                                        // remove the item from the array
                                        this._aSelectedSupplierLinesRowContexts.splice(iIndex, 1);
                                    }
                                    break;
                            }

                        },

                        /**
                         * Show checkbox for request exemption for supplier for charge quantity greater than 0. Show checkbox for grant exemption for
                         * ZESPRI user for exemption status = Pending
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         * @param {String}
                         *            sChargeQuantity charge quantity of the row
                         * @returns {Boolean} true for supplier if charge quantity is positive and true for ZESPRI user if exemption status is Pending
                         */
                        formatCheckBoxVisible : function(sChargeQuantity, sChargeAmount, sRecordType) {
                            var bSupplier = com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP);

                            var bZespriUser = com.zespri.awct.util.CommonHelper.isUserAuthorized(
                                    com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP);

                            var fChargeAmount = parseFloat(sChargeAmount);
                            var fChargeQuantity = parseFloat(sChargeQuantity);

                            // If the user has both 'Supplier' and 'Zespri' roles, then let's treat it as just 'Zespri'.
                            if (bSupplier && bZespriUser) {
                                bSupplier = false;
                            }

                            if ((bSupplier && (fChargeQuantity !== 0) && (fChargeAmount !== 0) && (sRecordType === this._AllocationLineRecordType.SupplierOrderLine)) ||
                                    (bZespriUser && (fChargeQuantity !== 0) && (fChargeAmount !== 0))) {
                                return true;
                            } else {
                                return false;
                            }
                        },

                        /**
                         * This method is called when the settings button in the table is pressed for selecting sorting options
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleSortTrackOrdersTableButtonPressed : function() {
                            // Open the Settings Dialog for the table
                            if (!this._oSortOrderHistoryTableDialog) {
                                this._oSortOrderHistoryTableDialog = sap.ui.xmlfragment("com.zespri.awct.collab.fragment.TrackOrdersSettingsDialog",
                                        this);
                                this.getView().addDependent(this._oSortOrderHistoryTableDialog);
                            }
                            this._oSortOrderHistoryTableDialog.open();
                        },

                        /**
                         * This method is called when the OK button is pressed in the settings dialog for sort options
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         * @param {sap.ui.base.Event}
                         *            oEvent The Event object
                         */
                        handleOrderHistorySettingsDialogOKPress : function(oEvent) {

                            var oCurrentTable = null;
                            // Check current selected tab
                            switch (this.byId("orderHistoryIconTabBar").getSelectedKey()) {
                                case "TrackLines" :
                                    oCurrentTable = this.byId("trackLinesTable");
                                    break;
                                case "SupplierLines" :
                                    oCurrentTable = this.byId("supplierLinesTable");
                                    break;
                            }
                            // Get binding of the current table
                            var oBinding = oCurrentTable.getBinding("items");
                            var mParams = null;
                            if (oEvent) {
                                // get sort parameters and store it
                                mParams = oEvent.getParameters();
                                this._mParams = mParams;
                            } else {
                                mParams = this._mParams;
                            }

                            // Get the Sorting Items
                            var aSorters = [];
                            if (mParams && mParams.sortItem) {
                                var sPath = mParams.sortItem.getKey();
                                var bDescending = mParams.sortDescending;
                                aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
                            }

                            // Add default sorter
                            aSorters.push(this._oOrderHistoryDefaultSorter);

                            // apply sorter to binding
                            oBinding.sort(aSorters);
                        },

                        /**
                         * This method is called when the toolbar, displaying applied filters information, is clicked. It navigates back to the track
                         * orders search form.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        handleToolbarPress : function() {
                            this.getRouter().navBack();
                        },

                        /**
                         * Helper method to format IsConsumed flag.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         * @param {Boolean}
                         *            bConsumed Consumed Flag to be formatted.
                         * @returns {String} sCons If bCons is true , return Yes. Else return with No .
                         * 
                         */
                        formatIsConsumed : function(bConsumed) {

                            if (bConsumed) {
                                return com.zespri.awct.util.I18NHelper.getText("TXT_GENERIC_YES");
                            } else {
                                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_ORDERHISTORY_COLUMN_TEXT_IS_CONSUMED_NO");
                            }
                        },

                        /**
                         * This is a helper method to format the Delivery status field in the order history table
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        formatDeliveryStatus : function(sDeliveryStatus) {
                            if (sDeliveryStatus === this._DeliveryStatus.BeforeRelease) {
                                return com.zespri.awct.util.I18NHelper
                                        .getText("TXT_COLLABORATION_ORDERHISTORY_COLUMN_TEXT_DELIVERY_STATUS_BEFORE_RELEASE");
                            } else if (sDeliveryStatus === this._DeliveryStatus.DeliveryRelease) {
                                return com.zespri.awct.util.I18NHelper
                                        .getText("TXT_COLLABORATION_ORDERHISTORY_COLUMN_TEXT_DELIVERY_STATUS_DELIVERY_RELEASE");
                            } else if (sDeliveryStatus === this._DeliveryStatus.DeliveryLock) {
                                return com.zespri.awct.util.I18NHelper
                                        .getText("TXT_COLLABORATION_ORDERHISTORY_COLUMN_TEXT_DELIVERY_STATUS_DELIVERY_LOCK");
                            } else if (sDeliveryStatus === this._DeliveryStatus.DeliveryUnlock) {
                                return com.zespri.awct.util.I18NHelper
                                        .getText("TXT_COLLABORATION_ORDERHISTORY_COLUMN_TEXT_DELIVERY_STATUS_DELIVERY_UNLOCK");
                            } else if (sDeliveryStatus === this._DeliveryStatus.ChangesDuringLock) {
                                return com.zespri.awct.util.I18NHelper
                                        .getText("TXT_COLLABORATION_ORDERHISTORY_COLUMN_TEXT_DELIVERY_STATUS_CHANGES_DURING_LOCK");
                            } else if (sDeliveryStatus === this._DeliveryStatus.OnUnlockDIFOTIS) {
                                return com.zespri.awct.util.I18NHelper
                                        .getText("TXT_COLLABORATION_ORDERHISTORY_COLUMN_TEXT_DELIVERY_STATUS_CHANGED_DURING_UNLOCK");
                            } else {
                                return "";
                            }
                        },

                        /**
                         * This method is used to show the popover (with the reason code description) when the reason code link is clicked
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         */
                        handleShowReasonCodeDescriptionPopover : function(oEvent) {
                            var oLink = oEvent.getSource();
                            var oBindingContext = oLink.getBindingContext();

                            // Create the popover only once
                            if (!this._oReasonCodeDescriptionPopover) {
                                this._oReasonCodeDescriptionPopover = new sap.m.Popover({
                                    placement : sap.m.PlacementType.Vertical,
                                    contentWidth : "250px",
                                    title : "{ReasonCode}",
                                    // Content for the popover
                                    content : [new sap.m.Text({
                                        text : {
                                            path : 'ReasonCodeDescription',
                                            formatter : this._formatReasonCodeDescription
                                        }
                                    })]
                                }).addStyleClass("zAwctPopoverPadding");

                                // Add the popover as a dependent to the view
                                this.getView().addDependent(this._oReasonCodeDescriptionPopover);
                            }

                            // Bind the context to the reason code description popover
                            this._oReasonCodeDescriptionPopover.setBindingContext(oBindingContext);

                            // If reason code text is not maintained, show the text in grey and italics
                            var oPopoverContentText = this._oReasonCodeDescriptionPopover.getContent()[0];
                            if (!oBindingContext.getProperty("ReasonCodeDescription")) {
                                oPopoverContentText.addStyleClass("zAwctTextGrayItalics");
                            } else {
                                oPopoverContentText.removeStyleClass("zAwctTextGrayItalics");
                            }

                            // Open the popover
                            this._oReasonCodeDescriptionPopover.openBy(oLink);
                        },

                        /**
                         * This method is used to format the reason code description in the popover. If reason code description is not maintained, it
                         * returns a string indicating that the reason code description is not maintained for the order
                         * 
                         * @private
                         * @param {String}
                         *            sReasonCodeDescription Reason code description text
                         * @returns Formatted reason code description
                         */
                        _formatReasonCodeDescription : function(sReasonCodeDescription) {
                            if (sReasonCodeDescription) {
                                return sReasonCodeDescription;
                            } else {
                                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_ORDERHISTORY_REASON_CODE_DESCRIPTION_NO_TEXT");
                            }
                        },

                        /**
                         * This private method is used to update the footer butons based on the current user and current selected tab
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         */
                        _updateFooter : function() {
                            // Get the current Selected ICON Tab
                            var sCurrentSelectedTab = this.byId("orderHistoryIconTabBar").getSelectedKey();

                            // If user is authorized for the view, show the action sheet button
                            if (!(com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP) || (com.zespri.awct.util.CommonHelper.isUserAuthorized(
                                    com.zespri.awct.util.Enums.AuthorizationMode.Display,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)))) {
                                this.byId("orderHistoryActionSheetButton").setVisible(false);
                                this.byId("orderHistoryExportAsCSVButton").setVisible(false);
                                // Remove footer
                                if (this.byId("pageOrderHistory").getFooter()) {
                                    this.byId("pageOrderHistory").getFooter().destroy();
                                }
                            } else {
                                // Authorized
                                // If user is ADMIN user , show action sheet
                                if (com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                        com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                        com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)) {
                                    this.byId("orderHistoryActionSheetButton").setVisible(true);
                                } else {
                                    // If User is Supplier and Current tab is TracLines, hide the action sheet
                                    if (sCurrentSelectedTab === "TrackLines" &&
                                            com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP)) {
                                        this.byId("orderHistoryActionSheetButton").setVisible(false);
                                    } else {
                                        this.byId("orderHistoryActionSheetButton").setVisible(true);
                                    }
                                }
                                this.byId("orderHistoryExportAsCSVButton").setVisible(true);
                            }

                            if (this._oActionSheet) {

                                // By Default, set all action buttons visibility in the action sheet to false
                                sap.ui.core.Fragment.byId("trackOrdersActionSheetFragment", "rejectExemptionButton").setVisible(false);
                                sap.ui.core.Fragment.byId("trackOrdersActionSheetFragment", "grantExemptionButton").setVisible(false);
                                sap.ui.core.Fragment.byId("trackOrdersActionSheetFragment", "requestExemptionButton").setVisible(false);

                                // If zespri user has no maintain permissions, hide 'Grant exemption' button and 'Reject exemption' button
                                if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                        com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                        com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)) {
                                    sap.ui.core.Fragment.byId("trackOrdersActionSheetFragment", "grantExemptionButton").setVisible(false);
                                    sap.ui.core.Fragment.byId("trackOrdersActionSheetFragment", "rejectExemptionButton").setVisible(false);
                                } else {
                                    sap.ui.core.Fragment.byId("trackOrdersActionSheetFragment", "grantExemptionButton").setVisible(true);
                                    // If selected tab is supplier Lines
                                    if (sCurrentSelectedTab !== "TrackLines") {
                                        sap.ui.core.Fragment.byId("trackOrdersActionSheetFragment", "rejectExemptionButton").setVisible(true);
                                    }
                                }

                                // If supplier user (and not zespri user) has maintain permissions, show 'request exemption' button
                                if (com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                        com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                        com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP) &&
                                        (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                                com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                                com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP))) {
                                    // If selected tab is supplier Lines
                                    if (sCurrentSelectedTab !== "TrackLines") {
                                        sap.ui.core.Fragment.byId("trackOrdersActionSheetFragment", "requestExemptionButton").setVisible(true);
                                    }
                                }
                            }
                        },

                        /**
                         * This method will form the filter string based on the selected filterList items from the facet filter.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.TrackOrders returns sFilterString Filter string to be used for download
                         */
                        _createFilterString : function() {
                            var oFacetFilter = this.byId("facetFilterOrderHistory");

                            // Create filters based on facet filter selections
                            var aFacetFilterLists = oFacetFilter.getLists();
                            var sFilterString = "";

                            // Boolean to indicate "and" to the each filter lists which is selected.
                            var bIsOuterFilterApplied = true;

                            // Loop through the facetFilters to form the filter string
                            $.each(aFacetFilterLists, function(i, oList) {
                                if (oList.getSelectedItems().length > 0) {
                                    // Get the Filter list key
                                    var oListKey = oList.getKey();

                                    // For date fields
                                    var bDateField = oList instanceof com.zespri.awct.control.FacetFilterDateInputList;

                                    // Loop through each FilterList and form filterString
                                    $.each(oList.getSelectedItems(), function(j, oSelectedItem) {
                                        // get the selectedItem inside the filter list
                                        var oSelectedItemKey = oSelectedItem.getKey();

                                        // For date fields, add datetime, else surround with ''
                                        if (bDateField) {
                                            oSelectedItemKey = "datetime'" + oSelectedItemKey + "T00:00:00'";
                                        } else {
                                            oSelectedItemKey = "'" + oSelectedItemKey + "'";
                                        }

                                        if (sFilterString && !bIsOuterFilterApplied) {
                                            // if FilterString has initialised (multi select)
                                            // Represents the filters created for each selection WITHIN a facet list. Multiple selections within the
                                            // same list need
                                            // to be 'OR'ed together.

                                            // Checking whether the Filter String already contains brackets
                                            if (sFilterString[sFilterString.length - 1] !== ")") {
                                                // Getting the index after 'and '
                                                var iFilterStringTillAnd = sFilterString.lastIndexOf("and") + 4;

                                                // Check whether 'and' exist in the string or not
                                                if (sFilterString.lastIndexOf("and") !== -1) {
                                                    // Appending the braces to the string. After the last 'and' and then closing with the closing
                                                    // braces
                                                    sFilterString = sFilterString.substring(0, iFilterStringTillAnd) + "(" +
                                                            sFilterString.substring(iFilterStringTillAnd, sFilterString.length);
                                                    sFilterString = sFilterString + " or " + oListKey + " eq " + oSelectedItemKey + ")";

                                                } else {
                                                    // If 'and' is not existing
                                                    sFilterString = sFilterString + " or " + oListKey + " eq " + oSelectedItemKey;
                                                }
                                            } else {
                                                // If the filter string already contains braces then remove the ending braces and add the ending
                                                // braces after
                                                // concatenating with the new string
                                                sFilterString = sFilterString.substring(0, sFilterString.length - 1);
                                                sFilterString = sFilterString + " or " + oListKey + " eq " + oSelectedItemKey + ")";
                                            }
                                        } else if (sFilterString && bIsOuterFilterApplied) {
                                            // if FilterString has initialised(contains filters ) and
                                            // "AND" should be applied for grouping different facet filter list selection.

                                            sFilterString = sFilterString + " and " + oListKey + " eq " + oSelectedItemKey;
                                            bIsOuterFilterApplied = false;
                                        } else {
                                            // if FilterString has not been initialised (no filters , for the first time)
                                            sFilterString = oListKey + " eq " + oSelectedItemKey;
                                            bIsOuterFilterApplied = false;
                                        }
                                    });

                                    // If FilterString contains filters , it should be "And" ed together
                                    if (sFilterString) {
                                        // "AND" should be used to group multiple facet filter lists
                                        bIsOuterFilterApplied = true;
                                    }
                                }
                            });
                            return sFilterString;
                        },
                        /**
                         * This method is used to format a quantity (float) as a absolute whole number (integer).
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrders
                         * @param {float}
                         *            fQuantity Quantity value as a float value
                         * @returns {Integer} Quantity value as an absoulte integer
                         */
                        formatQuantityAsAbsoluteInteger : function(fQuantity) {
                            if (fQuantity) {
                                var iQuantity = parseInt(fQuantity, 10);
                                return Math.abs(iQuantity);
                            } else {
                                return "";
                            }
                        }
                    });
})();
