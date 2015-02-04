(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });

    jQuery.sap.require("com.zespri.awct.control.FacetFilterDateInputList");
    jQuery.sap.require("com.zespri.awct.control.FacetFilterNumberInputList");
    jQuery.sap.require("com.zespri.awct.util.CommonFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.CommonHelper");
    jQuery.sap.require("com.zespri.awct.util.Enums");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");
    jQuery.sap.require("com.zespri.awct.util.TableRowActionsExtension");
    jQuery.sap.require("sap.ui.commons.layout.HorizontalLayout");
    jQuery.sap.require("sap.ui.core.format.NumberFormat");

    /**
     * @classdesc This is the controller for Supplier Order listing view that is viewed by the supplier to view all the relevant orders and take
     *            actions on the same. Facet filters are provided to enable the user to filter the records.
     * 
     * @class
     * @name com.zespri.awct.collab.view.SupplierOrders
     */
    com.zespri.awct.core.Controller
            .extend(
                    "com.zespri.awct.collab.view.SupplierOrders",
                    /** @lends com.zespri.awct.collab.view.SupplierOrders */
                    {

                        // Private enum for Brand
                        _Brand : {
                            ZESPRI : "Z"
                        },

                        // Private enum for Business Action
                        _BusinessAction : {
                            DOWNLOAD : "Download"
                        },

                        // Private enum for file type
                        _FileType : {
                            CSV : "CSV"
                        },

                        /**
                         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify
                         * the View before it is displayed, to bind event handlers and do other one-time initialization.
                         * 
                         * On load of this view, the applied search filters passed from Search form view is fetched, if this view is navigated from
                         * search form view.
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        onInit : function() {
                            /* START of instance member initialization */
                            // Private Instance variable for user authorization
                            this._bUserAuthorized = false;
                            // Private variable for Declare Shortage dialog
                            this._oDeclareShortageDialog = null;
                            // Private variable for Confirm Shortage dialog
                            this._oConfirmShortageDialog = null;
                            // Private variable for Declare Surplus dialog
                            this._oDeclareSurplusDialog = null;
                            // Private variable for declare shurplus for delivery line dialog
                            this._oDeclareSurplusDeliveryLineDialog = null;
                            // Stores the instance of the TableRowActionsExtension for the table
                            this._oRowActionsExtension = null;
                            // Private variable for View Settings Dialog
                            this._oSettingsDialog = null;
                            // Private variable for selected row context
                            this._oSelectedRowContext = null;
                            // Private variable for view text and view BC dialog
                            this._oViewTextsAndBatchCharacteristicsDialog = null;
                            // Private variable for Initiate Trade Dialog
                            this._oInitiateTradeDialog = null;
                            // Private variable for row actions surplus button - allocation line
                            this._oRowActionsAllocationSurplusButton = null;
                            // Private variable for row actions surplus button -delivery line
                            this._oRowActionsDeliveryLineSurplusButton = null;
                            // Private variable for row actions shortage button
                            this._oRowActionsShortageButton = null;
                            // Private variable for row actions Initiate trade
                            this._oRowActionsInitiateTradeButton = null;
                            // Unique id for rows
                            this._iUniqueIdCounter = 0;
                            // Busy dialog
                            this._oBusyDialog = new sap.m.BusyDialog();
                            // Download filter string when navigating from search form
                            this._sDownloadFilterString = null;
                            /* END of instance member initialization */

                            var oController = this;

                            // Attach the 'TableRowActionsExtension' functionality to the table in this view. This handles the row-level actions that
                            // are visible
                            var oTable = this.byId("supplierOrdersTable");
                            
                            // Enable / Disable facet filter based on table loading
                            var oFacetFilter = this.byId("facetFilterCollaboration");
                            com.zespri.awct.util.CommonHelper.manageFacetFilterState(oTable, oFacetFilter);

                            // Manage NoData Texts , listen for table update EVENT
                            com.zespri.awct.util.CommonHelper.manageNoDataText(oTable);

                            this._oRowActionsExtension = new com.zespri.awct.util.TableRowActionsExtension({
                                table : oTable,
                                actionsContent : this._getTableRowActionsContent()
                            });

                            // iOS Adjustment - Make the table look good on iPads by reducing cell padding
                            if (sap.ui.Device.os.ios) {
                                oTable.addStyleClass("zAwctTableIOS");
                            }

                            // Attach "onAfterRendering" event to the row actions ,to set Tooltip and enable / disable the buttons based on Status .
                            // Set the tooltip to buttons parent (layout div) , since disabled button by default doesnt allow rendering of any events.
                            // onAfterRendering , buttons DOM will be ready and set the tool tip to layout DIV.
                            this._oRowActionsExtension.getActionsContent().addEventDelegate(
                                    {
                                        "onAfterRendering" : function(oEvent) {
                                            // Get the Status Code
                                            var sStatusCode = oEvent.srcControl.getBindingContext().getProperty("StatusCode");
                                            var sLockedToolTip = com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_SUPPLIERORDERS_COLUMN_ROW_ACTIONS_BUTTON_TOOLTIP_LOCKED");

                                            // If user has no maintain permissions,
                                            if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(
                                                    com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP)) {
                                                oController._oRowActionsDeliveryLineSurplusButton.setVisible(false);
                                            } else {
                                                oController._oRowActionsDeliveryLineSurplusButton.setVisible(true);
                                            }

                                            // If the status is locked , disable the buttons (Surplus, Shortage and initate Trade) and set the ToolTip
                                            if (sStatusCode === com.zespri.awct.util.Enums.DeliveryStatus.Locked) {
                                                // Disable the buttons
                                                oController._oRowActionsAllocationSurplusButton.setEnabled(false);
                                                oController._oRowActionsDeliveryLineSurplusButton.setEnabled(false);
                                                oController._oRowActionsShortageButton.setEnabled(false);
                                                oController._oRowActionsInitiateTradeButton.setEnabled(false);

                                                // Set the tooltip for Disabled Buttons parent - when the button is disabled events will not called by
                                                // default
                                                oController._oRowActionsAllocationSurplusButton.$().parent().attr("title", sLockedToolTip);
                                                oController._oRowActionsDeliveryLineSurplusButton.$().parent().attr("title", sLockedToolTip);
                                                oController._oRowActionsShortageButton.$().parent().attr("title", sLockedToolTip);
                                                oController._oRowActionsInitiateTradeButton.$().parent().attr("title", sLockedToolTip);

                                                // Set the tooltip for Disabled Buttons - In " IE " , Tooltip of the button and button parent DIV attr
                                                // conflicts.
                                                // By default IE shows tooltip even when the button is disabled .
                                                oController._oRowActionsAllocationSurplusButton.setTooltip(sLockedToolTip);
                                                oController._oRowActionsDeliveryLineSurplusButton.setTooltip(sLockedToolTip);
                                                oController._oRowActionsShortageButton.setTooltip(sLockedToolTip);
                                                oController._oRowActionsInitiateTradeButton.setTooltip(sLockedToolTip);

                                                // Rerender the buttons - to make the setEnabled and SetTooltip changes work .
                                                oController._oRowActionsAllocationSurplusButton.rerender();
                                                oController._oRowActionsDeliveryLineSurplusButton.rerender();
                                                oController._oRowActionsShortageButton.rerender();
                                                oController._oRowActionsInitiateTradeButton.rerender();
                                            } else {

                                                // Enable the buttons
                                                oController._oRowActionsAllocationSurplusButton.setEnabled(true);
                                                oController._oRowActionsDeliveryLineSurplusButton.setEnabled(true);
                                                oController._oRowActionsShortageButton.setEnabled(true);
                                                oController._oRowActionsInitiateTradeButton.setEnabled(true);

                                                // ReSet the tooltip for Enabled Buttons parent -Remove the tooltip text to avoid conflicts
                                                oController._oRowActionsAllocationSurplusButton.$().parent().attr("title", "");
                                                oController._oRowActionsDeliveryLineSurplusButton.$().parent().attr("title", "");
                                                oController._oRowActionsShortageButton.$().parent().attr("title", "");
                                                oController._oRowActionsInitiateTradeButton.$().parent().attr("title", "");

                                                // Set the tooltip for enabled Buttons - In " IE " , Tooltip of the button and button parent DIV
                                                // "title" attr conflicts.
                                                // By default IE shows tooltip even when the button is disabled .
                                                oController._oRowActionsAllocationSurplusButton.setTooltip(com.zespri.awct.util.I18NHelper
                                                        .getText("TXT_COLLABORATION_SUPPLIERORDERS_DECLARE_SURPLUS_BUTTON"));
                                                oController._oRowActionsDeliveryLineSurplusButton.setTooltip(com.zespri.awct.util.I18NHelper
                                                        .getText("TXT_COLLABORATION_SUPPLIERORDERS_DECLARE_SURPLUS_BUTTON"));
                                                oController._oRowActionsShortageButton.setTooltip(com.zespri.awct.util.I18NHelper
                                                        .getText("TXT_COLLABORATION_SUPPLIERORDERS_DECLARE_SHORTAGE_BUTTON"));
                                                oController._oRowActionsInitiateTradeButton.setTooltip(com.zespri.awct.util.I18NHelper
                                                        .getText("TXT_COLLABORATION_SUPPLIERORDERS_INITIATE_TRADE_BUTTON"));

                                                // Rerender the buttons - to make the setEnabled and SetTooltip changes work .
                                                oController._oRowActionsAllocationSurplusButton.rerender();
                                                oController._oRowActionsDeliveryLineSurplusButton.rerender();
                                                oController._oRowActionsShortageButton.rerender();
                                                oController._oRowActionsInitiateTradeButton.rerender();

                                            }

                                        }
                                    });

                            // Check the incoming Route. If the user reached this view from the 'SearchForm' view, the
                            // filter passed from it should be applied to the supplier orders table and the filter string passed should be displayed
                            // on a toolbar and facet filter should be hidden.
                            // On click of the toolbar, user should be navigated back to search form.
                            //
                            // However, if the user reaches this page directly from the navigation menu, facet filters should be displayed and toolbar
                            // displaying filters information should be hidden
                            //
                            this.getRouter().attachRoutePatternMatched(
                                    function(oEvent) {
                                        // Check if the route is for the SupplierOrders view
                                        if (oEvent.getParameter("name") === "Collaboration/SupplierOrders") {

                                            // Check the current user authorizations
                                            if (!this._bUserAuthorized) {
                                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                                        .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));
                                            } else {

                                                var oSearchInfoToolbar = oController.byId("toolbarFilterString");
                                                var oFilterText = oController.byId("textFilter");
                                                var oFacetFilter = oController.byId("facetFilterCollaboration");

                                                // Get the parameters passed. 'customData' is available only if we are navigating from the 'Search
                                                // Form' view.
                                                var oCustomData = oEvent.getParameter("arguments").customData;
                                                if (oCustomData) {
                                                    var oFilter = null;
                                                    // If navigating from the dashboard
                                                    if (oCustomData.filters) {
                                                        // If earlier had navigated to the supplier orders screen from search form, the facet filter
                                                        // would not be
                                                        // visible.

                                                        // Hide the toolbar
                                                        oSearchInfoToolbar.setVisible(false);
                                                        // Show the facet filter
                                                        oFacetFilter.setVisible(true);

                                                        // Clear selected facet filters
                                                        oController._clearFacetFilterSelections();

                                                        oController._initializeDashboardFilters(oCustomData.filters);
                                                    }
                                                    // If navigating from the search form
                                                    else {
                                                        var sFilterString = oCustomData.searchFormFilterString;
                                                        oFilter = oCustomData.searchFormFilterObject;
                                                        this._sDownloadFilterString = oCustomData.downloadFilterString;

                                                        // If the filterString is available in the url, hide the facet filter and display the
                                                        // search string in the toolbar.
                                                        // If the filter is available, store it and apply it to table after rendering of view
                                                        oSearchInfoToolbar.setVisible(true);
                                                        oFilterText.setText(sFilterString);
                                                        oFilterText.setTooltip(sFilterString);
                                                        oFacetFilter.setVisible(false);

                                                        // If navigating from search form to supplier orders table for the first time
                                                        if (!oTable.getBinding("items")) {

                                                            var oBindingItems = {
                                                                path : "/CollaborationLineSet",
                                                                factory : jQuery.proxy(oController._createSupplierOrderTableRow, oController),
                                                                sorter : [new sap.ui.model.Sorter({
                                                                    path : "DeliveryLineNumber",
                                                                    descending : false,
                                                                    group : false
                                                                }), new sap.ui.model.Sorter({
                                                                    path : "SupplierID",
                                                                    descending : false,
                                                                    group : false
                                                                })]
                                                            };
                                                            if (oFilter) {
                                                                oBindingItems.filters = [oFilter];
                                                            }

                                                            // Bind items to the table
                                                            oTable.bindAggregation("items", oBindingItems);

                                                        } else {
                                                            oTable.getBinding("items").filter(oFilter, sap.ui.model.FilterType.Application);
                                                        }
                                                    }
                                                } else {

                                                    // Navigation was not from search form
                                                    this._sDownloadFilterString = null;

                                                    // If FacetFilter is not already visible (e.g last nav to this view was from Search Form),
                                                    // then clear the filter and remove filters from table.
                                                    if (!oFacetFilter.getVisible()) {
                                                        oFacetFilter.fireReset();
                                                    } else {

                                                        // If supplier orders table is loaded for first time
                                                        if (!oTable.getBinding("items")) {

                                                            // Bind items to the table
                                                            oTable.bindAggregation("items", {
                                                                path : "/CollaborationLineSet",
                                                                factory : jQuery.proxy(oController._createSupplierOrderTableRow, oController),
                                                                sorter : [new sap.ui.model.Sorter({
                                                                    path : "DeliveryLineNumber",
                                                                    descending : false,
                                                                    group : false
                                                                }), new sap.ui.model.Sorter({
                                                                    path : "SupplierID",
                                                                    descending : false,
                                                                    group : false
                                                                })]

                                                            });
                                                        } else {

                                                            // If FacetFilter is already visible, then any applied filters are also still
                                                            // available.. so just refresh the table to preserve applied filters
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
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        onBeforeRendering : function() {
                            // Check User Authorizations
                            if (!(com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP) || (com.zespri.awct.util.CommonHelper.isUserAuthorized(
                                    com.zespri.awct.util.Enums.AuthorizationMode.Display,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)))) {
                                if (this.byId("pageSupplierOrders")) {
                                    this.byId("pageSupplierOrders").destroy();
                                }
                                this._bUserAuthorized = false;
                            } else {
                                this._bUserAuthorized = true;
                            }
                        },
                        /**
                         * This private method clears all the selected fields from all the lists of the facet filter
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        _clearFacetFilterSelections : function() {
                            var oFacetFilter = this.byId("facetFilterCollaboration");
                            var aFacetFilterLists = oFacetFilter.getLists();
                            for ( var i = 0; i < aFacetFilterLists.length; i++) {
                                aFacetFilterLists[i].setSelectedKeys();
                            }
                        },

                        /**
                         * This is a private method that handles navigation to the supplier orders screen from the dashboard
                         * 
                         * @private
                         * 
                         * @param {Object}
                         *            oParams oCustomData.filters object passed from the dashboard
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        _initializeDashboardFilters : function(oParams) {

                            var oController = this;
                            var $shipmentListReadDeferred, $shipmentListReadPromise;

                            // Shortage
                            if (oParams.Shortage >= 0) {

                                // Prefill shortage value
                                var oShortageGT = {};
                                // FacetFilterNumberInputList getSelectedKeys and setSelectedKeys methods require the shortage to be passed with key
                                // 'value'
                                oShortageGT.value = oParams.Shortage;
                                oController.byId("facetFilterListShortagesGreaterThan").setSelectedKeys([oShortageGT]);
                            }

                            // Surplus
                            if (oParams.Surplus >= 0) {

                                // Prefill surplus value
                                var oSurplusGT = {};
                                // FacetFilterNumberInputList getSelectedKeys and setSelectedKeys methods require the surplus to be passed with key
                                // 'value'
                                oSurplusGT.value = oParams.Surplus;
                                oController.byId("facetFilterListSurplusesGreaterThan").setSelectedKeys([oSurplusGT]);
                            }

                            // CharterOrContainer
                            if (oParams.CharterOrContainer) {
                                // Preselect Charter or Container
                                var oCharterOrContainer = {};
                                oCharterOrContainer[oParams.CharterOrContainer] = oParams.CharterOrContainer;
                                oController.byId("facetFilterListCharterOrContainer").setSelectedKeys(oCharterOrContainer);

                            }

                            // Record Type
                            if (oParams.RecordType) {

                                // Remove checkbox selection
                                var oRecordTypeFacetFilter = this.byId("facetFilterListShowDemandLines");
                                var bRecordTypeCheckboxSelection;
                                switch (oParams.RecordType) {
                                    // For Record type 'A', the checkbox in the facet filter has to be deselected
                                    case com.zespri.awct.util.Enums.AllocationLineRecordType.SupplierOrderLine :
                                        bRecordTypeCheckboxSelection = false;
                                        break;
                                    default :
                                        bRecordTypeCheckboxSelection = true;
                                        break;
                                }
                                // Pass the Selection for the checkbox with key as value
                                oRecordTypeFacetFilter.setSelectedKeys([{
                                    value : bRecordTypeCheckboxSelection
                                }]);
                            }

                            // Create Deferred and promise object for ShipmentList Read
                            $shipmentListReadDeferred = $.Deferred();
                            $shipmentListReadPromise = $shipmentListReadDeferred.promise();

                            // If Supplier orders is navigated from Dashboard's "ShipmentConfirmationDue" tiles
                            if (oParams.ShipmentID) {
                                // If no shipments are passed , return
                                if (oParams.ShipmentID.length <= 0) {
                                    return;
                                }

                                var oShipmentID = {};
                                // Create key Object to set it to the Shipment List
                                for ( var i = 0; i < oParams.ShipmentID.length; i++) {
                                    oShipmentID[oParams.ShipmentID[i]] = oParams.ShipmentID[i];
                                }

                                // Preparing Shipment Number Facet Filter List
                                var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;

                                var oShipmentIDList = oController.byId("facetFilterListShipmentNo");
                                // Binding is done only once.
                                if (!oShipmentIDList.getBinding("items")) {
                                    oShipmentIDList.setBusy(true);
                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead("/ShipmentSet", {
                                        urlParameters : {
                                            "$select" : "ShipmentID",
                                            "$filter" : "Season eq '" + sCurrentSeason + "'"
                                        }
                                    }, function(oJSONModel) {
                                        // Success
                                        oShipmentIDList.setModel(oJSONModel);
                                        oShipmentIDList.bindItems({
                                            path : "/results",
                                            template : oShipmentIDList.getBindingInfo("items") ? oShipmentIDList.getBindingInfo("items").template
                                                    : oShipmentIDList.getItems()[0].clone()
                                        });

                                        oShipmentIDList.setSelectedKeys(oShipmentID);
                                        oShipmentIDList.setBusy(false);
                                        // Resolve the deferred object
                                        $shipmentListReadDeferred.resolve();
                                    }, function(oError) {
                                        // Error
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        // Resolve the deferred object
                                        $shipmentListReadDeferred.resolve();
                                    });
                                } else {
                                    oShipmentIDList.setSelectedKeys(oShipmentID);
                                    oShipmentIDList.setBusy(false);
                                    // Resolve the deferred object
                                    $shipmentListReadDeferred.resolve();
                                }
                            } else {
                                // Resolve the deferred object
                                $shipmentListReadDeferred.resolve();
                            }

                            // When ShipmentList Read is resolved, call apply filters.
                            $.when($shipmentListReadPromise).done(function() {
                                // Apply the selected filters from the facet filter to the supplier orders table
                                oController._applyFacetFilters();
                            });

                        },

                        /**
                         * This private method returns the facet filter object, with the selected fields.
                         * 
                         * @private
                         * @returns {sap.ui.model.Filter} oFilter Facet filter object
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        _getFacetFilterObject : function() {
                            var oFacetFilter = this.byId("facetFilterCollaboration");
                            // Prepare an array of filters which are active and selected.
                            // ShowDemandLines filter is by default checked, hence filter is not created for it.
                            var aFacetFilterLists = oFacetFilter.getLists().filter(
                                    function(oList) {
                                        return (oList.getActive() && oList.getSelectedItems().length && oList.getKey() !== "ShowDemandLines") ||
                                                (oList.getKey() === "ShowDemandLines" && !oList.getSelectedItems()[0].getKey());
                                    });

                            // Build the nested filter with ORs between the
                            // values of each group and
                            // ANDs between each group
                            var oFilter = new sap.ui.model.Filter(aFacetFilterLists.map(function(oList) {
                                return new sap.ui.model.Filter(oList.getSelectedItems().map(function(oItem) {
                                    // handle shortage, surplus and show demand lines differently.

                                    var sSelectedFilterKey = oList.getKey();
                                    var sItemValue = oItem.getKey();
                                    var oFilter = null;
                                    switch (sSelectedFilterKey) {
                                        case "Shortage" :
                                            // For shortage the filter operator is greater than
                                            oFilter = new sap.ui.model.Filter(sSelectedFilterKey, "GT", sItemValue);
                                            break;
                                        case "Surplus" :
                                            // For surplus the filter operator is greater than
                                            oFilter = new sap.ui.model.Filter(sSelectedFilterKey, "GT", sItemValue);
                                            break;
                                        case "ShowDemandLines" :
                                            // If show demand lines is false, prepare a filter for RecordType as Allocation Line
                                            if (!oItem.getKey()) {
                                                sSelectedFilterKey = "RecordType";
                                                oFilter = new sap.ui.model.Filter(sSelectedFilterKey, "EQ", "A");
                                            }
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
                         * This private method applies the facet filter object to the Supplier Orders table
                         * 
                         * @private
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        _applyFacetFilters : function() {

                            // get facet filter object
                            var oFilter = this._getFacetFilterObject();
                            var oController = this;
                            var oTable = this.byId("supplierOrdersTable");

                            // Bind to the table
                            if (!oTable.getBinding("items")) {

                                var oBindingItems = {
                                    path : "/CollaborationLineSet",
                                    factory : jQuery.proxy(oController._createSupplierOrderTableRow, oController),
                                    sorter : [new sap.ui.model.Sorter({
                                        path : "DeliveryLineNumber",
                                        descending : false,
                                        group : false
                                    }), new sap.ui.model.Sorter({
                                        path : "SupplierID",
                                        descending : false,
                                        group : false
                                    })]
                                };

                                if (oFilter) {
                                    oBindingItems.filters = [oFilter];
                                }

                                oTable.bindAggregation("items", oBindingItems);
                            } else {
                                oTable.getBinding("items").filter(oFilter, sap.ui.model.FilterType.Application);
                            }
                        },

                        /**
                         * Private method for creating supplier order table rows
                         * 
                         * @private
                         * @param sId
                         *            Id
                         * @param oContext
                         *            Context
                         * @returns {sap.ui.xmlfragment} Supplier Order table Row
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        _createSupplierOrderTableRow : function(sId, oContext) {
                            var sIdPrefix = "supplierOrdersTableRow" + (this._iUniqueIdCounter++);
                            var oSupplierOrdersTableRow = new sap.ui.xmlfragment(sIdPrefix, "com.zespri.awct.collab.fragment.SupplierOrdersTableRow",
                                    this);

                            // For supplier users, the actions button is visible for all the rows. For Zespri users, the actions button is visible
                            // only for delivery lines
                            if (com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP) ||
                                    (oContext.getProperty("RecordType") === com.zespri.awct.util.Enums.AllocationLineRecordType.DeliveryLine)) {
                                sap.ui.core.Fragment.byId(sIdPrefix, "actionsButton").setVisible(true);
                            } else {
                                sap.ui.core.Fragment.byId(sIdPrefix, "actionsButton").setVisible(false);
                            }
                            // Blue Color for Non Zespri Brand
                            if (oContext.getProperty("Characteristic/Brand") !== this._Brand.ZESPRI) {
                                oSupplierOrdersTableRow.addStyleClass("zAwctColumnListItemNonZespriBrand");
                            }
                            // Yellow color for Delivery Line Zespri Brand
                            else if ((oContext.getProperty("RecordType") === com.zespri.awct.util.Enums.AllocationLineRecordType.DeliveryLine) &&
                                    (oContext.getProperty("Characteristic/Brand") === this._Brand.ZESPRI)) {
                                oSupplierOrdersTableRow.addStyleClass("zAwctColumnListItemDemandLineZespriBrand");
                            }
                            this.getView().addDependent(oSupplierOrdersTableRow);
                            oSupplierOrdersTableRow.setBindingContext(oContext);
                            return oSupplierOrdersTableRow;
                        },

                        /**
                         * Formats the visibility of the table cell based on the quantity . If the quantity is less than or equal to 0 , corresponding
                         * table cell is hidden
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         * @param {Float}
                         *            fQuantity Quantity to be formatted
                         */
                        formatQuantityCellVisibility : function(fQuantity) {
                            var iQuantity = parseInt(fQuantity, 10);
                            if (!iQuantity) {
                                return false;
                            } else {
                                return true;
                            }
                        },
                        /**
                         * Formats visibility of the button in the Row actions table for allocation lines
                         * 
                         * @param {String}
                         *            sRecordType Record type string
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         * @returns {Boolean} true for allocation lines
                         */
                        formatAllocationLineRowActionVisibility : function(sRecordType) {
                            // Record Type should be checked because when the view is first loaded, it would be null
                            if (sRecordType) {
                                if (sRecordType === com.zespri.awct.util.Enums.AllocationLineRecordType.SupplierOrderLine) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                        },

                        /**
                         * Formats visibility of the button in the Row actions table for delivery lines
                         * 
                         * @param {String}
                         *            sRecordType Record type string
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         * 
                         * @returns {Boolean} true for delivery lines
                         */
                        formatDeliveryLineRowActionVisibility : function(sRecordType) {
                            // Record Type should be checked because when the view is first loaded, it would be null
                            if (sRecordType) {
                                if (sRecordType === com.zespri.awct.util.Enums.AllocationLineRecordType.DeliveryLine) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                        },

                        /**
                         * Formatter for the 'Delivery instruction number' cell. If delivery instruction number is 0 , then it will be shown empty.
                         * 
                         * @param {String}
                         *            sDeliveryInstructionNumber The delivery instruction number
                         */
                        formatDeliveryInstructionNumber : function(sDeliveryInstructionNumber) {
                            if (!parseInt(sDeliveryInstructionNumber, 10) && !isNaN(sDeliveryInstructionNumber)) {
                                return "";
                            } else {
                                return sDeliveryInstructionNumber;
                            }
                        },

                        /**
                         * Returns the control to be used for the 'actionsContent' of the TableRowActionsExtension instance for this controller.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        _getTableRowActionsContent : function() {
                            var oI18NModel = sap.ui.getCore().getRootComponent().getModel("i18n");
                            var oODataModel = sap.ui.getCore().getRootComponent().getModel();

                            // Create the row actions button here , to set tooltip and change the enable property based on the StatusCode .
                            // Declare Shortage
                            this._oRowActionsShortageButton = new sap.m.Button({
                                icon : "sap-icon://sys-minus",
                                press : [this.handleDeclareShortageOpen, this],
                                visible : {
                                    path : 'RecordType',
                                    formatter : this.formatAllocationLineRowActionVisibility
                                }
                            });
                            // Declare Surplus Allocation line (A)
                            this._oRowActionsAllocationSurplusButton = new sap.m.Button({
                                icon : "sap-icon://sys-add",
                                press : [this.handleDeclareSurplusDialogOpen, this],
                                visible : {
                                    path : 'RecordType',
                                    formatter : this.formatAllocationLineRowActionVisibility
                                }
                            });
                            // Declare Surplus Delivery Line (D)
                            this._oRowActionsDeliveryLineSurplusButton = new sap.m.Button({
                                icon : "sap-icon://sys-add",
                                press : [this.handleDeclareSurplusDeliveryLineDialogOpen, this],
                                visible : {
                                    path : 'RecordType',
                                    formatter : this.formatDeliveryLineRowActionVisibility
                                }
                            });

                            // Initiate trade
                            this._oRowActionsInitiateTradeButton = new sap.m.Button({
                                icon : "sap-icon://arrow-right",
                                press : [this.handleInitiateTradeDialogOpen, this],
                                visible : {
                                    path : 'RecordType',
                                    formatter : this.formatAllocationLineRowActionVisibility
                                }
                            });

                            var oButtonsLayout = new sap.ui.commons.layout.HorizontalLayout({
                                content : [
                                // Declare Shortage
                                this._oRowActionsShortageButton,
                                // Allocation line - surplus
                                this._oRowActionsAllocationSurplusButton,
                                // Delivery line - surplus
                                this._oRowActionsDeliveryLineSurplusButton,
                                // View batch characteristics
                                new sap.m.Button({
                                    icon : "sap-icon://table-view",
                                    tooltip : "{i18n>TXT_COLLABORATION_SUPPLIERORDERS_VIEW_TEXT_AND_BATCH_CHARACTERISTICS_BUTTON}",
                                    press : [this.handleViewTextsAndBatchCharacteristicsOpen, this],
                                    visible : {
                                        path : 'RecordType',
                                        formatter : this.formatDeliveryLineRowActionVisibility
                                    }
                                }),
                                // Initiate Trade
                                this._oRowActionsInitiateTradeButton]
                            });

                            // Set I18NModel and OData model
                            oButtonsLayout.setModel(oI18NModel, "i18n");
                            oButtonsLayout.setModel(oODataModel);
                            return oButtonsLayout;
                        },

                        /**
                         * Event handler for the 'row actions' button.
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleRowActionsPress : function(oEvent) {
                            this._oRowActionsExtension.showRowActions(oEvent.getSource().getBindingContext());
                        },
                        /**
                         * This method is called when any facet filter list(with drop down values) apart from dependent filters is opened.
                         * 
                         * On call of this function, JSON Model for the selected facet filter is built and bound to the respective list. The reason
                         * for not creating a regular binding to the ODataModel, is because we want client-side filtering (as opposed to filtering
                         * done by backend) for the facet lists.
                         * 
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         */
                        handleListOpen : function(oEvent) {

                            // find the key of selected facet filter list
                            var sSelectedFilterListKey = oEvent.getSource().getKey();
                            var oController = this;
                            var oFilterDetails = {};
                            var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;

                            // check the filter which is triggered
                            switch (sSelectedFilterListKey) {

                                // For template, we use the template that is part of the current binding if an "items" binding exists (it will not
                                // exist
                                // when this
                                // code is executed for the first time, since have not done it via XML). If a binding doesn't already exist, we clone
                                // the
                                // template
                                // item that we have defined via XML.

                                case "SupplierID" :
                                    // Preparing Supplier Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListSupplier");
                                    oFilterDetails.entitySetName = "SupplierSet";
                                    oFilterDetails.filterString = "UserID eq '" +
                                            oController.getView().getModel("currentUserDetails").getProperty("/UserID") + "'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "ShipmentID" :
                                    // Preparing Shipment Number Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListShipmentNo");
                                    oFilterDetails.entitySetName = "ShipmentSet";
                                    oFilterDetails.filterString = "Season eq '" + sCurrentSeason + "'";
                                    oFilterDetails.selectString = "ShipmentID";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "LoadPort" :
                                    // Preparing Load Port Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListLoadPort");
                                    oFilterDetails.entitySetName = "PortSet";
                                    oFilterDetails.filterString = "PortType eq 'L'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "ShipmentName" :
                                    // Preparing Ship Name Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListShipName");
                                    oFilterDetails.entitySetName = "GetShipmentNamesForSeason";
                                    oFilterDetails.urlParameter = {
                                        "Season" : "'" + sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason + "'"
                                    };
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "ShipmentType" :
                                    // Preparing Shipment Type Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListShipmentType");
                                    oFilterDetails.entitySetName = "GetShipmentTypesForSeason";
                                    oFilterDetails.urlParameter = {
                                        "Season" : "'" + sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason + "'"
                                    };
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "MarketAccessArea" :
                                    // Preparing Market Access Area Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListMarketAccessArea");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'MARKET_ACCESS'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Marketer" :
                                    // Preparing Marketer Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListMarketer");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'MARKETER'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristic/Brand" :
                                    // Preparing Brand Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListBrand");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'BRAND'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristic/Variety" :
                                    // Preparing Variety Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListVariety");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'VARIETY'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristic/Class" :
                                    // Preparing Class Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListClass");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'CLASS'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristic/GrowingMethod" :
                                    // Preparing Growing Method Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListGrowingMethod");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'GROWING_METHOD'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristic/Stack" :
                                    // Preparing Stack Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListStack");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'STACKING_CONFIGURATION'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristic/PackStyle" :
                                    // Preparing Pack Style Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListPackStyle");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'PACK_STYLE'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristic/Size" :
                                    // Preparing Size Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListSize");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'SIZE'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "Characteristic/Label" :
                                    // Preparing Label Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("facetFilterListLabel");
                                    oFilterDetails.entitySetName = "GenericSearchSet";
                                    oFilterDetails.filterString = "Scenario eq 'LABELLING'";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;
                            }
                        },

                        /**
                         * This method is called on click of reset button. This clears all the selected filters.
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders *
                         */

                        handleFacetFilterReset : function() {
                            // Clear the facet filter selections
                            this._clearFacetFilterSelections();

                            this.byId("supplierOrdersTable").getBinding("items").filter(null, sap.ui.model.FilterType.Application);
                        },

                        /**
                         * This method is called when any facet filter list is closed. This groups all the selected filter criteria and passes to
                         * apply filter function
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleListClose : function() {
                            // Get the Facet Filter lists and construct a (nested) filter for the binding
                            var oFacetFilter = this.byId("facetFilterCollaboration");
                            if (oFacetFilter.getFiltersModifiedAfterListOpen()) {
                                // Get facet filter object
                                var oFilter = this._getFacetFilterObject();
                                this.byId("supplierOrdersTable").getBinding("items").filter(oFilter, sap.ui.model.FilterType.Application);
                            }
                        },

                        /**
                         * This method is called when any dependent facet filter list is opened. This fetches the data based on the selections of the
                         * filters on which it is dependent.
                         * 
                         * JSON Model for various facet filters are built and bound to the respective lists. The reason for not creating a regular
                         * binding to the ODataModel, is because we want client-side filtering (as opposed to filering done by backend) for the facet
                         * lists.
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         */
                        handleDependentListOpen : function(oEvent) {
                            var oFilterDetails = {};

                            // find the key of selected facet filter list
                            var sSelectedFilterListKey = oEvent.getSource().getKey();
                            // Filter String for selected shipments
                            var sShipmentFilterString = "";

                            // Fetch all the dependent facet filter lists
                            var oShipmentIDFFL = this.getView().byId("facetFilterListShipmentNo");
                            var oDestinationPortFFL = this.getView().byId("facetFilterListDestinationPort");
                            var oDeliveryIDFFL = this.getView().byId("facetFilterListDeliveryNo");
                            var oContainerIDFFL = this.getView().byId("facetFilterListContainerID");

                            // find the selected values (shipment no., destination ports and delivery id) from respective facet filters
                            var sSelectedShipmentId = Object.getOwnPropertyNames(oShipmentIDFFL.getSelectedKeys())[0];
                            var aSelectedDestinationPorts = Object.getOwnPropertyNames(oDestinationPortFFL.getSelectedKeys());
                            var sSelectedDeliveryId = Object.getOwnPropertyNames(oDeliveryIDFFL.getSelectedKeys())[0];

                            jQuery.each(oShipmentIDFFL.getSelectedKeys(), function(sShipmentKey) {
                                if (sShipmentFilterString) {
                                    sShipmentFilterString = sShipmentFilterString + " or ShipmentID eq '" + sShipmentKey + "'";
                                } else {
                                    sShipmentFilterString = "ShipmentID eq '" + sShipmentKey + "'";
                                }

                            });

                            if (sShipmentFilterString) {
                                sShipmentFilterString = "(" + sShipmentFilterString + ")";
                            }

                            // check the filter which is triggered
                            switch (sSelectedFilterListKey) {
                                // For template,used during binding results, we use the template that is part of the current binding if an "items"
                                // binding exists (it will not
                                // exist when this
                                // code is executed for the first time, since have not done it via XML). If a binding doesn't already exist, we
                                // clone the template
                                // item that we have defined via XML.

                                case "DestinationPort" :
                                    // Apart from selected shipment id, port has to be filtered based on PortType(for Destination Ports)
                                    var sDestinationPortFilter = "PortType eq 'D'";
                                    oDestinationPortFFL.clearSearchField();

                                    if (sSelectedShipmentId) {
                                        sDestinationPortFilter += " and " + sShipmentFilterString;
                                    }

                                    oFilterDetails.facetListControl = this.byId("facetFilterListDestinationPort");
                                    oFilterDetails.entitySetName = "PortSet";
                                    oFilterDetails.filterString = sDestinationPortFilter;
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, true);
                                    break;

                                case "DeliveryID" :
                                    // Delivery ID has to be filtered based on selected shipment id

                                    var sDeliveryIDFilter = "";
                                    oDeliveryIDFFL.clearSearchField();
                                    if (sSelectedShipmentId) {
                                        sDeliveryIDFilter = sShipmentFilterString;
                                    }

                                    oFilterDetails.facetListControl = this.byId("facetFilterListDeliveryNo");
                                    oFilterDetails.entitySetName = "DeliveryHeaderSet";
                                    oFilterDetails.filterString = sDeliveryIDFilter;
                                    oFilterDetails.selectString = "DeliveryHeaderID";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, true);
                                    break;

                                case "ContainerID" :

                                    // Destination Port is a multi select facet filter. Loop over the selected items to create an array of filters
                                    var sSelectedDestinationPortFilters = "";
                                    oContainerIDFFL.clearSearchField();
                                    var len = aSelectedDestinationPorts.length;
                                    if (len > 0) {

                                        for ( var i = 0; i < len; i++) {
                                            sSelectedDestinationPortFilters += "PortID eq '" + aSelectedDestinationPorts[i] + "' or ";
                                        }

                                        // Using substring operation to remove the last " or " from the filter string created in the previous loop.
                                        sSelectedDestinationPortFilters = sSelectedDestinationPortFilters.substring(0,
                                                sSelectedDestinationPortFilters.length - 4);
                                    }

                                    // Container ID has to be filtered based on selected shipment id, destination ports and delivery id

                                    var sContainerIDFilter = "";

                                    if (sSelectedShipmentId) {
                                        sContainerIDFilter += sShipmentFilterString;
                                    }

                                    if (sContainerIDFilter && sSelectedDestinationPortFilters) {
                                        sContainerIDFilter += " and ";
                                    }

                                    if (sSelectedDestinationPortFilters) {
                                        sContainerIDFilter += sSelectedDestinationPortFilters;
                                    }

                                    if (sContainerIDFilter && sSelectedDeliveryId) {
                                        sContainerIDFilter += " and ";
                                    }

                                    if (sSelectedDeliveryId) {
                                        sContainerIDFilter += "DeliveryID eq '" + sSelectedDeliveryId + "'";
                                    }

                                    oFilterDetails.facetListControl = this.byId("facetFilterListContainerID");
                                    oFilterDetails.entitySetName = "ContainerSet";
                                    oFilterDetails.filterString = sContainerIDFilter;
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, true);
                                    break;
                            }

                        },
                        /**
                         * This method is called when any selection of a facet filter list, having dependents, is changed.
                         * 
                         * When selected item(s) of a facet filter is changed, all its dependent filters are reset.
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         */
                        handleFilterListSelectionChanged : function(oEvent) {
                            // find the key of selected facet filter list
                            var sSelectedFilterListKey = oEvent.getSource().getKey();

                            // Fetch the dependent facet filter lists
                            var oDestinationPortFFL = this.getView().byId("facetFilterListDestinationPort");
                            var oDeliveryIDFFL = this.getView().byId("facetFilterListDeliveryNo");
                            var oContainerIDFFL = this.getView().byId("facetFilterListContainerID");

                            // Dependent filters should be reset when filters on which they are dependent are changed.
                            switch (sSelectedFilterListKey) {
                                case "ShipmentID" :
                                    oDestinationPortFFL.setSelectedKeys();
                                    oDeliveryIDFFL.setSelectedKeys();
                                    oContainerIDFFL.setSelectedKeys();
                                    break;

                                case "DestinationPort" :
                                    oContainerIDFFL.setSelectedKeys();
                                    break;

                                case "DeliveryID" :
                                    oContainerIDFFL.setSelectedKeys();
                                    break;
                            }

                        },

                        /**
                         * This method is called when the Declare Shortage button is clicked from the action sheet
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleDeclareShortageOpen : function() {
                            // Hide the row actions
                            this._oRowActionsExtension.hideRowActions();

                            // Get Selected row from the Supplier orders table
                            this._oSelectedRowContext = this.getView().byId("supplierOrdersTable").getSelectedItem().getBindingContext();

                            if (this._oSelectedRowContext) {
                                // Creating the instance only once and referring to the same instance every other time
                                if (!this._oDeclareShortageDialog) {
                                    this._oDeclareShortageDialog = new sap.ui.xmlfragment("declareShortageFragment",
                                            "com.zespri.awct.collab.fragment.DeclareShortageDialog", this);
                                    this.getView().addDependent(this._oDeclareShortageDialog);
                                }

                                // Remove the error message for the Shortage textfield in the Declare Shortage dialog
                                var oShortageQuantity = sap.ui.core.Fragment.byId("declareShortageFragment", "shortageQuantityInput");
                                oShortageQuantity.setValueState(sap.ui.core.ValueState.None);

                                this._oDeclareShortageDialog.setBindingContext(this._oSelectedRowContext);

                                // Refresh the binding context of the Input Field before open
                                oShortageQuantity.getBinding("value").refresh(true);

                                this._oDeclareShortageDialog.open();

                            }
                        },

                        /**
                         * This method is called when the Close button on the Declare Shortage dialog is pressed
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleDeclareShortageClose : function() {
                            this._oDeclareShortageDialog.close();
                        },

                        /**
                         * This method is called when the Shortage button on the Declare Shortage dialog is pressed
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleConfirmShortageOpen : function() {

                            var oShortageQuantity = sap.ui.core.Fragment.byId("declareShortageFragment", "shortageQuantityInput");
                            oShortageQuantity.setValueState(sap.ui.core.ValueState.None);
                            var sShortageQuantityValue = oShortageQuantity.getValue();
                            this.iShortageQuantityValue = parseInt(sShortageQuantityValue, 10);

                            // If Shortage quantity entered is more than currently allocated quantity or not an integer, show an error
                            if (isNaN(sShortageQuantityValue) || (Math.round(sShortageQuantityValue) !== parseFloat(sShortageQuantityValue)) ||
                                    (this.iShortageQuantityValue > parseInt(this._oSelectedRowContext.getProperty("Quantity"), 10)) ||
                                    (this.iShortageQuantityValue <= 0)) {
                                oShortageQuantity.setValueState(sap.ui.core.ValueState.Error);
                                oShortageQuantity.setValueStateText(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_COLLABORATION_SUPPLIERORDERS_SHORTAGE_ERROR_VALUE_STATE_TEXT"));
                            } else {

                                if (!this._oConfirmShortageDialog) {
                                    this._oConfirmShortageDialog = new sap.ui.xmlfragment("confirmShortageFragment",
                                            "com.zespri.awct.collab.fragment.ConfirmShortageDialog", this);
                                    this.getView().addDependent(this._oConfirmShortageDialog);
                                }

                                sap.ui.core.Fragment.byId("confirmShortageFragment", "commentsTextArea").setValue("");

                                sap.ui.core.Fragment.byId("confirmShortageFragment", "requestExemptionCheckBox").setSelected(false);
                                sap.ui.core.Fragment.byId("confirmShortageFragment", "requestExemptionForm").setVisible(false);

                                // call to backend service passing the shortage quantity to calculate the penalty
                                var oConfirmShortageDialog = this._oConfirmShortageDialog;
                                var oDeclareShortageDialog = this._oDeclareShortageDialog;
                                oDeclareShortageDialog.setBusy(true);
                                this.getView().getModel().read(
                                        "/SetShortage",
                                        {
                                            urlParameters : {
                                                "ShortageQuantity" : this.iShortageQuantityValue,
                                                "CalculateFlag" : true,
                                                "AcceptPenaltyFlag" : false,
                                                "RequestExemptionFlag" : false,
                                                "ExemptionComment" : "''",
                                                "ExemptionReason" : "''",
                                                "DeliveryLineID" : "'" + this._oSelectedRowContext.getProperty("DeliveryLineID") + "'",
                                                "AllocationID" : "'" + this._oSelectedRowContext.getProperty("AllocationID") + "'",
                                                "AllocationUpdateTime" : com.zespri.awct.util.CommonFormatHelper
                                                        .formatJSDateToEDMDateTimeString(this._oSelectedRowContext
                                                                .getProperty("AllocationUpdateTime")),
                                                "DeliveryLineUpdateTime" : com.zespri.awct.util.CommonFormatHelper
                                                        .formatJSDateToEDMDateTimeString(this._oSelectedRowContext
                                                                .getProperty("DeliveryLineUpdateTime"))
                                            },
                                            success : function(oData) {

                                                // Refresh the reason Select Field in confirm shortage dialog before open
                                                sap.ui.core.Fragment.byId("confirmShortageFragment", "exemptionReasonSelect").setSelectedKey();

                                                oConfirmShortageDialog.open();
                                                var oResponse = oData.SetShortage;
                                                if (oResponse.IsSurplusDeclared) {
                                                    sap.ui.core.Fragment.byId("confirmShortageFragment", "warningMessageBox").setVisible(true);
                                                } else {
                                                    sap.ui.core.Fragment.byId("confirmShortageFragment", "warningMessageBox").setVisible(false);
                                                }
                                                // Set Surplus Shipments
                                                sap.ui.core.Fragment.byId("confirmShortageFragment", "surplusShipmentsText").setText(
                                                        oResponse.SurplusShipmentIDs);
                                                var sPenaltyText = "";

                                                // If the number of days from loading is 1, then the message in the dialog shows 'day', or else it
                                                // shows 'days'. Format all values.
                                                var sChargeAmount = com.zespri.awct.util.LocaleFormatHelper.formatAmount(oResponse.Amount,
                                                        oResponse.Currency);
                                                var sRateAmount = com.zespri.awct.util.LocaleFormatHelper.formatAmount(oResponse.Rate,
                                                        oResponse.Currency);
                                                var sShortageQuantity = com.zespri.awct.util.LocaleFormatHelper.formatQuantity(oResponse.Quantity);
                                                var sDaysFromLoading = com.zespri.awct.util.LocaleFormatHelper
                                                        .formatQuantity(oResponse.DaysFromLoading);
                                                if (oResponse.DaysFromLoading === 1) {
                                                    sPenaltyText = com.zespri.awct.util.I18NHelper.getText(
                                                            "TXT_COLLABORATION_SUPPLIERORDERS_ONE_DAYFROMLOADING_PENALTY_MESSAGE", [sChargeAmount,
                                                                    sDaysFromLoading, sRateAmount, sShortageQuantity]);
                                                } else {
                                                    sPenaltyText = com.zespri.awct.util.I18NHelper.getText(
                                                            "TXT_COLLABORATION_SUPPLIERORDERS_PENALTY_MESSAGE", [sChargeAmount, sDaysFromLoading,
                                                                    sRateAmount, sShortageQuantity]);
                                                }
                                                sap.ui.core.Fragment.byId("confirmShortageFragment", "showPenaltyText").setText(sPenaltyText);

                                                // Set default Exemption Quantity
                                                sap.ui.core.Fragment.byId("confirmShortageFragment", "exemptionQuantityInput").setValue(
                                                        parseInt(oShortageQuantity.getValue(), 10)).setValueState(sap.ui.core.ValueState.None);

                                                // Close declare shortage dialog
                                                oDeclareShortageDialog.setBusy(false);
                                                oDeclareShortageDialog.close();

                                            },
                                            error : function(oError) {
                                                oDeclareShortageDialog.setBusy(false);

                                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);

                                            }
                                        });
                            }
                        },

                        /**
                         * This method is called when the Close button on the Confirm Shortage dialog is clicked
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleConfirmShortageClose : function() {
                            this._oConfirmShortageDialog.close();
                        },

                        /**
                         * This method is called when the Accept penalty button on the Confirm Shortage dialog is clicked.
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleAcceptPenaltyPress : function() {
                            var oTable = this.byId("supplierOrdersTable");

                            // If Request Exemption checkbox is checked, read the data in all the fields of the form
                            if (sap.ui.core.Fragment.byId("confirmShortageFragment", "requestExemptionCheckBox").getSelected()) {
                                var oExemptionQuantity = sap.ui.core.Fragment.byId("confirmShortageFragment", "exemptionQuantityInput");
                                var iExemptionQuantity = oExemptionQuantity.getValue();

                                var sReason = sap.ui.core.Fragment.byId("confirmShortageFragment", "exemptionReasonSelect").getSelectedKey();

                                var sComments = sap.ui.core.Fragment.byId("confirmShortageFragment", "commentsTextArea").getValue();

                                // If exemption quantity is greater than shortage or zero or not an integer, show an error
                                if (isNaN(iExemptionQuantity) ||
                                        (Math.round(iExemptionQuantity) !== parseFloat(iExemptionQuantity)) ||
                                        ((parseInt(iExemptionQuantity, 10) > parseInt(this.iShortageQuantityValue, 10)) || (parseInt(
                                                iExemptionQuantity, 10) <= 0))) {
                                    oExemptionQuantity.setValueState(sap.ui.core.ValueState.Error);
                                    oExemptionQuantity.setValueStateText(com.zespri.awct.util.I18NHelper
                                            .getText("TXT_COLLABORATION_SUPPLIERORDERS_EXEMPT_SHORTAGE_ERROR_VALUE_STATE_TEXT"));
                                } else {

                                    oExemptionQuantity.setValueState(sap.ui.core.ValueState.None);
                                    var oTableObject = this.byId("supplierOrdersTable").getSelectedItem().getBindingContext();

                                    var oConfirmShortageDialog = this._oConfirmShortageDialog;
                                    oConfirmShortageDialog.setBusy(true);

                                    // Call SetShortage when RequestExemption is selected
                                    var oCurrentView = this.getView();

                                    this.getView().getModel().read(
                                            "/SetShortage",
                                            {
                                                urlParameters : {
                                                    "ShortageQuantity" : sap.ui.core.Fragment
                                                            .byId("declareShortageFragment", "shortageQuantityInput").getValue(),
                                                    "CalculateFlag" : true,
                                                    "AcceptPenaltyFlag" : true,
                                                    "RequestExemptionFlag" : true,
                                                    "ExemptionComment" : "'" + sComments + "'",
                                                    "ExemptionReason" : "'" + sReason + "'",
                                                    "DeliveryLineID" : "'" + oTableObject.getProperty("DeliveryLineID") + "'",
                                                    "AllocationID" : "'" + oTableObject.getProperty("AllocationID") + "'",
                                                    "AllocationUpdateTime" : com.zespri.awct.util.CommonFormatHelper
                                                            .formatJSDateToEDMDateTimeString(oTableObject.getProperty("AllocationUpdateTime")),
                                                    "DeliveryLineUpdateTime" : com.zespri.awct.util.CommonFormatHelper
                                                            .formatJSDateToEDMDateTimeString(oTableObject.getProperty("DeliveryLineUpdateTime"))
                                                },
                                                success : function(oData) {

                                                    // Call Request Exemption function import after the SetShortage function import is
                                                    // successful
                                                    // 2 separate function imports are used. SetShortage sets the Shortage quantity, and
                                                    // RequestExemption sets the
                                                    // Exemption quantity
                                                    oCurrentView.getModel().read(
                                                            "/RequestExemption",
                                                            {
                                                                urlParameters : {
                                                                    "DeliveryLineID" : "'" + oTableObject.getProperty("DeliveryLineID") + "'",
                                                                    "AllocationID" : "'" + oTableObject.getProperty("AllocationID") + "'",
                                                                    "ExemptionQuantity" : iExemptionQuantity,
                                                                    "ExemptionReason" : "'" + sReason + "'",
                                                                    "Comment" : "'" + sComments + "'",
                                                                    "ChargeID" : "'" + oData.SetShortage.ChargeID + "'"
                                                                },
                                                                success : function() {
                                                                    oConfirmShortageDialog.setBusy(false);
                                                                    oConfirmShortageDialog.close();
                                                                    var sExemptPenaltyMessage = com.zespri.awct.util.I18NHelper
                                                                            .getText("TXT_COLLABORATION_SUPPLIERORDERS_TOAST_EXEMPT_PENALTY");
                                                                    com.zespri.awct.util.NotificationHelper.showSuccessToast(sExemptPenaltyMessage);
                                                                    oTable.getBinding("items").refresh();
                                                                },
                                                                error : function(oError) {
                                                                    oConfirmShortageDialog.setBusy(false);

                                                                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                                                }
                                                            });
                                                },
                                                error : function(oError) {
                                                    oConfirmShortageDialog.setBusy(false);

                                                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);

                                                }
                                            });
                                }
                            } else {
                                var oConfirmationDialog = this._oConfirmShortageDialog;
                                oConfirmationDialog.setBusy(true);
                                var oController = this;

                                // Call SetShortage when Request Exemption is not selected.
                                this.getView().getModel().read(
                                        "/SetShortage",
                                        {
                                            urlParameters : {
                                                "ShortageQuantity" : parseInt(sap.ui.core.Fragment.byId("declareShortageFragment",
                                                        "shortageQuantityInput").getValue(), 10),
                                                "CalculateFlag" : true,
                                                "AcceptPenaltyFlag" : true,
                                                "RequestExemptionFlag" : false,
                                                "ExemptionComment" : "''",
                                                "ExemptionReason" : "''",
                                                "DeliveryLineID" : "'" + this._oSelectedRowContext.getProperty("DeliveryLineID") + "'",
                                                "AllocationID" : "'" + this._oSelectedRowContext.getProperty("AllocationID") + "'",
                                                "AllocationUpdateTime" : com.zespri.awct.util.CommonFormatHelper
                                                        .formatJSDateToEDMDateTimeString(this._oSelectedRowContext
                                                                .getProperty("AllocationUpdateTime")),
                                                "DeliveryLineUpdateTime" : com.zespri.awct.util.CommonFormatHelper
                                                        .formatJSDateToEDMDateTimeString(this._oSelectedRowContext
                                                                .getProperty("DeliveryLineUpdateTime"))
                                            },
                                            success : function() {
                                                oConfirmationDialog.setBusy(false);
                                                oController._oConfirmShortageDialog.close();
                                                var sPenaltyAcceptedMessage = com.zespri.awct.util.I18NHelper
                                                        .getText("TXT_COLLABORATION_SUPPLIERORDERS_TOAST_PENALTY_ACCEPTED");
                                                com.zespri.awct.util.NotificationHelper.showSuccessToast(sPenaltyAcceptedMessage);
                                                oTable.getBinding("items").refresh();

                                            },
                                            error : function(oError) {
                                                oConfirmationDialog.setBusy(false);

                                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                            }
                                        });
                            }
                        },

                        /**
                         * This method is called when the Request Exemption checkbox is checked/unchecked in the Confirm Shortage dialog
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleRequestExemptionChecked : function() {

                            var oForm = sap.ui.core.Fragment.byId("confirmShortageFragment", "requestExemptionForm");
                            var oRequestExemptionCheckBox = sap.ui.core.Fragment.byId("confirmShortageFragment", "requestExemptionCheckBox");
                            if (oRequestExemptionCheckBox.getSelected()) {
                                oForm.setVisible(true);
                            } else if (!oRequestExemptionCheckBox.getSelected()) {
                                oForm.setVisible(false);
                            }

                            // The height of the dialog changes on clicking the Request exemption checkbox.
                            // The dialog is rerendered so as to reposition it to the center of the window.
                            this._oConfirmShortageDialog.rerender();
                        },

                        /* Declare Surplus fragment */

                        /**
                         * This method is called when the Declare Surplus button is pressed in the action sheet. It opens the Declare surplus dialog
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleDeclareSurplusDialogOpen : function() {
                            // Hide the row actions
                            this._oRowActionsExtension.hideRowActions();

                            var oSelectedRowContext = this.getView().byId("supplierOrdersTable").getSelectedItem().getBindingContext();
                            if (oSelectedRowContext) {

                                // Creating the instance only once and referring to the same instance every other time
                                if (!this._oDeclareSurplusDialog) {
                                    this._oDeclareSurplusDialog = new sap.ui.xmlfragment("declareSurplusFragment",
                                            "com.zespri.awct.collab.fragment.DeclareSurplusDialog", this);
                                    this.getView().addDependent(this._oDeclareSurplusDialog);
                                }

                                var oSurplusQuantityInput = sap.ui.core.Fragment.byId("declareSurplusFragment", "surplusQuantityInput");
                                oSurplusQuantityInput.setValueState(sap.ui.core.ValueState.None);

                                this._oDeclareSurplusDialog.setBindingContext(oSelectedRowContext);

                                // Refresh the binding of input field before opening the dialog
                                oSurplusQuantityInput.getBinding("value").refresh(true);

                                this._oDeclareSurplusDialog.open();
                            }
                        },

                        /**
                         * This method is called when the Declare Surplus button is pressed in the Declare Surplus Dialog
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleDeclareSurplusQuantityPress : function() {

                            var oSurplusQuantity = sap.ui.core.Fragment.byId("declareSurplusFragment", "surplusQuantityInput");
                            var sSurplusQuantity = oSurplusQuantity.getValue();
                            var iSurplusQuantity = parseInt(sSurplusQuantity, 10);

                            // Check if the surplus quantity entered is a positive value or not
                            if (isNaN(sSurplusQuantity) || (Math.round(sSurplusQuantity) !== parseFloat(sSurplusQuantity)) || (iSurplusQuantity < 0)) {
                                oSurplusQuantity.setValueState(sap.ui.core.ValueState.Error);
                                oSurplusQuantity.setValueStateText(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_COLLABORATION_SUPPLIERORDERS_SURPLUS_QUANTITY_ERROR_VALUE_STATE_TEXT"));
                            } else {
                                var oDeclareSurplusDialog = this._oDeclareSurplusDialog;
                                oSurplusQuantity.setValueState(sap.ui.core.ValueState.None);
                                oDeclareSurplusDialog.setBusy(true);
                                var oTable = this.byId("supplierOrdersTable");
                                var sUOM = this.byId("supplierOrdersTable").getSelectedItem().getBindingContext().getProperty("UOM");

                                // A call for setting the Surplus quantity
                                this.getView().getModel().read(
                                        "/SetSurplus",
                                        {
                                            urlParameters : {
                                                "DeliveryLineID" : "'" +
                                                        this.byId("supplierOrdersTable").getSelectedItem().getBindingContext().getProperty(
                                                                "DeliveryLineID") + "'",
                                                "AllocationID" : "'" +
                                                        this.byId("supplierOrdersTable").getSelectedItem().getBindingContext().getProperty(
                                                                "AllocationID") + "'",
                                                "SurplusQuantity" : iSurplusQuantity,
                                                "AllocationUpdateTime" : com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(this
                                                        .byId("supplierOrdersTable").getSelectedItem().getBindingContext().getProperty(
                                                                "AllocationUpdateTime")),
                                                "DeliveryLineUpdateTime" : com.zespri.awct.util.CommonFormatHelper
                                                        .formatJSDateToEDMDateTimeString(this.byId("supplierOrdersTable").getSelectedItem()
                                                                .getBindingContext().getProperty("DeliveryLineUpdateTime"))
                                            },
                                            success : function() {
                                                oDeclareSurplusDialog.setBusy(false);
                                                oDeclareSurplusDialog.close();
                                                var sSurplusPostedMessage = com.zespri.awct.util.I18NHelper.getText(
                                                        "TXT_COLLABORATION_SUPPLIERORDERS_TOAST_SURPLUS_POSTED", [iSurplusQuantity, sUOM]);
                                                com.zespri.awct.util.NotificationHelper.showSuccessToast(sSurplusPostedMessage);
                                                oTable.getBinding("items").refresh();
                                            },
                                            error : function(oError) {
                                                oDeclareSurplusDialog.setBusy(false);

                                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                            }
                                        });
                            }
                        },

                        /**
                         * This method is called when the Close button is pressed in the Declare Surplus dialog
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleDeclareSurplusDialogClose : function() {
                            this._oDeclareSurplusDialog.close();
                        },

                        /**
                         * Helper method to format Supplier ID. If Record Type is of type Allocation, Supplier ID is displayed as 'All'.
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         * @param {String}
                         *            sSupplierID Supplier ID to be formatted.
                         * @param {String}
                         *            sRecordType Record Type based on which Supplier ID is formatted.
                         * @returns {String} If sRecorType is Allocation, return 'All'. Else return Supplier ID .
                         * 
                         */
                        formatSupplierID : function(sSupplierID, sRecordType) {
                            if (sRecordType === com.zespri.awct.util.Enums.AllocationLineRecordType.DeliveryLine) {
                                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_SUPPLIERORDERS_COLUMN_SUPPLIER_ID_ALL");
                            } else {
                                return sSupplierID;
                            }
                        },

                        /**
                         * Formatter for the 'visible' property of the actions button in each row. This triggers the row level action buttons to slide
                         * into the screen.
                         * 
                         * @param {String}
                         *            sRecordType The record type of the row.
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         * 
                         * @returns {Boolean} true if the actions button should be visible, false if it shouldn't.
                         */
                        formatActionsVisible : function(sRecordType) {
                            if (sRecordType === com.zespri.awct.util.Enums.AllocationLineRecordType.DeliveryLine) {
                                return false;
                            } else {
                                return true;
                            }
                        },

                        /**
                         * Helper method to format IsConsumed flag.
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         * @param {Boolean}
                         *            bConsumed Consumed Flag to be formatted.
                         * @returns {String} sCons If bCons is true , return Yes. Else return with No .
                         * 
                         */
                        formatIsConsumed : function(bConsumed) {

                            if (bConsumed) {
                                return com.zespri.awct.util.I18NHelper.getText("TXT_GENERIC_YES");
                            } else {
                                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_SUPPLIERORDERS_COLUMN_TEXT_IS_CONSUMED_NO");
                            }
                        },
                        /**
                         * Formatter method to return visibility for Action Sheet items only for Suppliers and Administrators
                         * 
                         * @param {Boolean}
                         *            bAdministrator Holds true if the user is an Administrator
                         * @param {Boolean}
                         *            bSupplier Holds true if the user is a Supplier
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         * 
                         * @returns {Boolean} bPermitted true if the user is an Administrator or Supplier
                         */
                        formatActionSheetVisible : function(bAdministrator, bSupplier) {

                            if (bAdministrator || bSupplier) {
                                return true;
                            } else {
                                return false;
                            }
                        },

                        /**
                         * This method is called when the settings button in the supplier orders view is clicked On click of this button the view
                         * settings dialog is opened.
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleViewSettingsDialogButtonPressed : function() {
                            // Getting the View Settings Dialog
                            if (!this._oSettingsDialog) {
                                this._oSettingsDialog = sap.ui.xmlfragment("com.zespri.awct.collab.fragment.SupplierOrdersSettingsDialog", this);
                                this.getView().addDependent(this._oSettingsDialog);
                            }
                            this._oSettingsDialog.open();

                        },

                        /**
                         * This method is called when the Ok button in the view settings dialog is clicked. Based on the selected sort item and group
                         * item, the supplier orders table is refreshed.
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         */
                        handleViewSettingsDialogClose : function(oEvent) {
                            // On clicking confirm in the ViewSettings Dialog

                            var oSupplierOrdersTable = this.getView().byId("supplierOrdersTable");

                            var oBinding = oSupplierOrdersTable.getBinding("items");

                            var mParams = oEvent.getParameters();

                            // Get the Sorting Items
                            var aSorters = [];

                            // (grouping comes before sorting)
                            if (mParams.groupItem) {
                                var sGrpPath = mParams.groupItem.getKey();
                                var bGrpDescending = mParams.groupDescending;
                                aSorters.push(new sap.ui.model.Sorter(sGrpPath, bGrpDescending, true));
                            }
                            if (mParams.sortItem) {
                                var sPath = mParams.sortItem.getKey();
                                var bDescending = mParams.sortDescending;
                                aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
                            }
                            // apply sorter to binding
                            oBinding.sort(aSorters);

                        },

                        /* Declare Surplus for Delivery Line */

                        /**
                         * This method is used for opening the declare surplus dialog for a delivery line
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleDeclareSurplusDeliveryLineDialogOpen : function() {
                            // Hide the row actions
                            this._oRowActionsExtension.hideRowActions();

                            var oSelectedRowContext = this.getView().byId("supplierOrdersTable").getSelectedItem().getBindingContext();
                            if (oSelectedRowContext) {

                                // Creating the instance only once and referring to the same instance every other time
                                if (!this._oDeclareSurplusDeliveryLineDialog) {
                                    this._oDeclareSurplusDeliveryLineDialog = new sap.ui.xmlfragment("declareSurplusDeliveryLineFragment",
                                            "com.zespri.awct.collab.fragment.DeclareSurplusForDeliveryLineDialog", this);
                                    this.getView().addDependent(this._oDeclareSurplusDeliveryLineDialog);
                                }

                                var oSurplusQuantityDeliveryLineInput = sap.ui.core.Fragment.byId("declareSurplusDeliveryLineFragment",
                                        "surplusQuantityDeliveryLineInput");
                                oSurplusQuantityDeliveryLineInput.setValueState(sap.ui.core.ValueState.None);

                                this._oDeclareSurplusDeliveryLineDialog.setBindingContext(oSelectedRowContext);

                                // Refresh the binding of input field before opening the dialog
                                oSurplusQuantityDeliveryLineInput.getBinding("value").refresh(true);

                                this._oDeclareSurplusDeliveryLineDialog.open();
                            }
                        },

                        /**
                         * This method closes the declare surplus dialog for a delivery line
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleDeclareSurplusDeliveryLineDialogClose : function() {
                            this._oDeclareSurplusDeliveryLineDialog.close();
                        },

                        /**
                         * This method is called on pressing Declare surplus in the declare surplus dialog for a delivery line
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleDeclareSurplusQuantityDeliveryLinePress : function() {
                            var oSurplusQuantity = sap.ui.core.Fragment
                                    .byId("declareSurplusDeliveryLineFragment", "surplusQuantityDeliveryLineInput");
                            var sSurplusQuantity = oSurplusQuantity.getValue();

                            var oSuppliersSelect = sap.ui.core.Fragment.byId("declareSurplusDeliveryLineFragment", "suppliersDeliveryLineSelect");
                            var sSelectedSupplier = oSuppliersSelect.getSelectedKey();

                            // Check if the surplus quantity entered is a positive value or not
                            if (isNaN(sSurplusQuantity) || (Math.round(sSurplusQuantity) !== parseFloat(sSurplusQuantity)) ||
                                    (parseInt(sSurplusQuantity, 10) < 0)) {
                                oSurplusQuantity.setValueState(sap.ui.core.ValueState.Error);
                                oSurplusQuantity.setValueStateText(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_COLLABORATION_SUPPLIERORDERS_SURPLUS_QUANTITY_ERROR_VALUE_STATE_TEXT"));
                            } else {
                                oSurplusQuantity.setValueState(sap.ui.core.ValueState.None);
                                var oDeclareSurplusDialog = this._oDeclareSurplusDeliveryLineDialog;
                                oDeclareSurplusDialog.setBusy(true);
                                var oTable = this.byId("supplierOrdersTable");
                                var sUOM = this.byId("supplierOrdersTable").getSelectedItem().getBindingContext().getProperty("UOM");

                                // A call for setting the Surplus quantity
                                this.getView().getModel().read(
                                        "/SetSurplusForDeliveryLine",
                                        {
                                            urlParameters : {
                                                "DeliveryLineID" : "'" +
                                                        this.byId("supplierOrdersTable").getSelectedItem().getBindingContext().getProperty(
                                                                "DeliveryLineID") + "'",
                                                "DeliveryLineTimeStamp" : com.zespri.awct.util.CommonFormatHelper
                                                        .formatJSDateToEDMDateTimeString(this.byId("supplierOrdersTable").getSelectedItem()
                                                                .getBindingContext().getProperty("DeliveryLineUpdateTime")),
                                                "Surplus" : parseInt(sSurplusQuantity, 10),
                                                "SupplierID" : "'" + sSelectedSupplier + "'"
                                            },
                                            success : function() {
                                                // Success
                                                oDeclareSurplusDialog.setBusy(false);
                                                oDeclareSurplusDialog.close();
                                                var sSurplusPostedMessage = com.zespri.awct.util.I18NHelper.getText(
                                                        "TXT_COLLABORATION_SUPPLIERORDERS_TOAST_SURPLUS_POSTED", [parseInt(sSurplusQuantity, 10),
                                                                sUOM]);
                                                com.zespri.awct.util.NotificationHelper.showSuccessToast(sSurplusPostedMessage);
                                                oTable.getBinding("items").refresh();
                                            },
                                            error : function(oError) {
                                                // Error
                                                oDeclareSurplusDialog.setBusy(false);
                                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                            }
                                        });
                            }
                        },

                        /**
                         * This Method is called when the user selects view batch characteristics + View text and it opens a dialog with view batch
                         * characteristics
                         * 
                         * @memberOf com.zespri.awct.alloc.view.SupplierOrders
                         */
                        handleViewTextsAndBatchCharacteristicsOpen : function() {
                            // storing the current instance
                            var oController = this;

                            // Hide the row actions
                            this._oRowActionsExtension.hideRowActions();

                            // Create the fragment only if it doesnot exist
                            if (!oController._oViewTextsAndBatchCharacteristicsDialog) {
                                oController._oViewTextsAndBatchCharacteristicsDialog = new sap.ui.xmlfragment(
                                        "viewTextAndBatchCharacteristicsFragment", "com.zespri.awct.collab.fragment.ViewTextAndBatchCharacteristics",
                                        this);
                                oController._oViewTextsAndBatchCharacteristicsDialog.setModel(oController.getView().getModel("i18n"), "i18n");
                            }

                            // START of Batch reads
                            var oModel = this.getView().getModel();
                            // Getting the Selected Line Item from the table
                            var oSupplierOrdersTableBindingContext = oController.getView().byId("supplierOrdersTable").getSelectedItem()
                                    .getBindingContext();
                            var sDeliveryLineID = oSupplierOrdersTableBindingContext.getProperty("DeliveryLineID");

                            // Path for line Text read
                            var sLineTextPath = oSupplierOrdersTableBindingContext + "/Text";

                            // Setting the Delivery Header Text Path
                            var sDeliveryHeaderID = oSupplierOrdersTableBindingContext.getProperty('DeliveryID');
                            var sDeliveryHeaderTextPath = "/DeliveryHeaderSet('" + sDeliveryHeaderID + "')/Text";

                            var fnBatchReadSuccess = function(oData, oResponse, aErrorResponses) {
                                // Show Errors if any
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(aErrorResponses);

                                /** ** Start of Batch characteristics success handler *** */
                                // Set Data to Batch Characteristics table
                                var oDataForBC = oData.__batchResponses[0].data;
                                var oBatchCharacteristicsModel = new sap.ui.model.json.JSONModel();
                                if (oDataForBC) {
                                    oBatchCharacteristicsModel.setData(oDataForBC);
                                }

                                oController._oViewTextsAndBatchCharacteristicsDialog.setModel(oBatchCharacteristicsModel);
                                // Getting the count of batch characteristics and setting it as the table header
                                var iBatchCharacteristicsCount = oBatchCharacteristicsModel.getData().results.length;
                                sap.ui.core.Fragment.byId("viewTextAndBatchCharacteristicsFragment", "viewBatchCharacteristicsTableHeader").setText(
                                        com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TEXT_AND_BATCHCHARACTERISTICS_TABLE_TITLE",
                                                [iBatchCharacteristicsCount]));

                                /** ** End of Batch characteristics success handler **** */

                                /** ** Start of line text read *** */
                                var sLineText = "";
                                if (oData.__batchResponses[1].data) {
                                    sLineText = oData.__batchResponses[1].data.TextString;
                                }

                                // Check whether the line text from the backend has characters (not empty)
                                // If Yes , the display
                                if (sLineText && (sLineText.trim().length !== 0)) {
                                    // Setting the delivery line text to the Text field
                                    sap.ui.core.Fragment.byId("viewTextAndBatchCharacteristicsFragment", "viewItemLineTextText").setText(sLineText)
                                            .removeStyleClass("zAwctTextGrayItalics");

                                } else {

                                    // If returned line text is empty , show "no text" message with styling
                                    sap.ui.core.Fragment.byId("viewTextAndBatchCharacteristicsFragment", "viewItemLineTextText").setText(
                                            com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_LINE_TEXT_EMPTY")).addStyleClass(
                                            "zAwctTextGrayItalics");
                                }

                                /** ** End of line text read *** */

                                /** *** Start of Reading Header Text **** */
                                var sHeaderText = "";
                                if (oData.__batchResponses[2].data) {
                                    sHeaderText = oData.__batchResponses[2].data.TextString;
                                }

                                // Check whether Header text from the backend has characters (not empty)
                                // If Yes , then display
                                if (sHeaderText && (sHeaderText.trim().length !== 0)) {
                                    // Setting the delivery header text to the Text field
                                    sap.ui.core.Fragment.byId("viewTextAndBatchCharacteristicsFragment", "viewItemHeaderTextText").setText(
                                            sHeaderText).removeStyleClass("zAwctTextGrayItalics");
                                } else {

                                    // If returned Header text is empty , show "no text" message with styling
                                    sap.ui.core.Fragment.byId("viewTextAndBatchCharacteristicsFragment", "viewItemHeaderTextText").setText(
                                            com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_HEADER_TEXT_EMPTY")).addStyleClass(
                                            "zAwctTextGrayItalics");
                                }
                                /** ** End of Reading Header Text *** */

                                // Release the busy state
                                oController._oViewTextsAndBatchCharacteristicsDialog.setBusy(false);
                                // Rerender the dilaog , to reset the dialog height for the current content .
                                // Else dialog contains the height of last selected delivery line
                                oController._oViewTextsAndBatchCharacteristicsDialog.rerender();
                            };

                            var fnBatchReadError = function(oError) {
                                // Error handler for line text read
                                // Setting the empty value text to the Text field
                                sap.ui.core.Fragment.byId("viewTextAndBatchCharacteristicsFragment", "viewItemLineTextText").setText(
                                        com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_VIEW_LINE_TEXT_NO_VALUE")).addStyleClass(
                                        "zAwctTextGrayItalics");

                                // Error Handler for header text read
                                // Setting the empty value text to the Text field
                                sap.ui.core.Fragment.byId("viewTextAndBatchCharacteristicsFragment", "viewItemHeaderTextText").setText(
                                        com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_VIEW_HEADER_TEXT_NO_VALUE")).addStyleClass(
                                        "zAwctTextGrayItalics");

                                // Show Error Dialog
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                            };

                            // Batch read for Batch characteristics that are linked to the selected Delivery Line.
                            var oBatchOperationFoBCRead = oModel.createBatchOperation("BatchCharacteristicsSet?%24filter=DeliveryLineID%20eq%20%27" +
                                    sDeliveryLineID + "%27&%24expand=BatchCharacteristicsValueSet", "GET");

                            // Batch read for delivery Line text
                            var oBatchOperationForLineTextRead = oModel.createBatchOperation(sLineTextPath, "GET");

                            // Batch read for delivery header text
                            var oBatchOperationForHeaderTextRead = oModel.createBatchOperation(sDeliveryHeaderTextPath, "GET");

                            var aBatchRequest = [oBatchOperationFoBCRead, oBatchOperationForLineTextRead, oBatchOperationForHeaderTextRead];

                            oModel.addBatchReadOperations(aBatchRequest);
                            oModel.submitBatch(fnBatchReadSuccess, fnBatchReadError);
                            // END of batch reads

                            // Open the fragment
                            oController._oViewTextsAndBatchCharacteristicsDialog.setBusy(true);
                            oController._oViewTextsAndBatchCharacteristicsDialog.open();

                        },
                        /**
                         * This Method is called when OK button is clicked in the dialog with view text and batch characteristics
                         * 
                         * @memberOf com.zespri.awct.alloc.view.SupplierOrders
                         */
                        handleViewTextAndBatchCharacteristicsOKPress : function() {
                            // Close the current fragment
                            this._oViewTextsAndBatchCharacteristicsDialog.close();
                        },

                        /**
                         * This method is called when the toolbar, displaying applied filters information, is clicked. It navigates back to the search
                         * form.
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleToolbarPress : function() {
                            this.getRouter().navBack();
                        },

                        /**
                         * This method is called when the view is destroyed
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        onExit : function() {
                            // Destroy all dependents
                            if (this._oDeclareShortageDialog) {
                                this._oDeclareShortageDialog.destroy();
                            }
                            if (this._oConfirmShortageDialog) {
                                this._oConfirmShortageDialog.destroy();
                            }
                            if (this._oDeclareSurplusDialog) {
                                this._oDeclareSurplusDialog.destroy();
                            }
                            if (this._oSettingsDialog) {
                                this._oSettingsDialog.destroy();
                            }
                            if (this._oRowActionsExtension) {
                                this._oRowActionsExtension.destroy();
                            }
                        },

                        /**
                         * Formatter function for the column 'Value' in 'ViewBatchCharacteristics' fragment
                         * 
                         * @memberOf com.zespri.awct.alloc.view.SupplierOrders
                         * @param {Object}
                         *            oJsonBatchCharacteristicsValue contains the Batch Characteristics Values
                         * @returns {String} returns the the Batch Characteristic Values separated with comma
                         */
                        formatBatchCharacteristicsValuesText : function(oJsonBatchCharacteristicsValue) {

                            // Function to return the batch characteristics values from the oJsonBatchCharacteristicsValue array
                            // oBatchCharValue - Contains the value of each array element
                            var fnBatchCharacteristicsValueReturn = function(oBatchCharValue) {
                                return oBatchCharValue.Value;
                            };
                            // Get all the Batch Characteristics Value and seperating each with ', '
                            return oJsonBatchCharacteristicsValue.results.map(fnBatchCharacteristicsValueReturn).join(", ");

                        },
                        /**
                         * Formatter function for the column 'Include/Exclude' in 'ViewBatchCharacteristics' fragment
                         * 
                         * @memberOf com.zespri.awct.alloc.view.SupplierOrders
                         * @param {String}
                         *            sOperation String of Operations
                         * @returns {String} if sOperation = "E" then 'Exclude' , "I" = 'Include'
                         */
                        formatExcludeIncludeText : function(sOperation) {
                            // Checking whether the operations is include or exclude

                            if (sOperation === com.zespri.awct.util.Enums.ViewBCOperation.Exclude) {
                                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TEXT_AND_BATCHCHARACTERISTICS_EXCLUDE");

                            } else if (sOperation === com.zespri.awct.util.Enums.ViewBCOperation.Include) {
                                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TEXT_AND_BATCHCHARACTERISTICS_INCLUDE");
                            } else {
                                return "";
                            }
                        },
                        /**
                         * This method is called when the Initiate Trade button is pressed in the action sheet and it opens the Initiate Trade dialog.
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleInitiateTradeDialogOpen : function() {
                            // Hide the row actions
                            this._oRowActionsExtension.hideRowActions();
                            var oController = this;

                            // Bind the context of the selected supplier order line to the Initiate Trade dialog.
                            var oTableContext = this.byId("supplierOrdersTable").getSelectedItem().getBindingContext();
                            if (oTableContext) {
                                if (!this._oInitiateTradeDialog) {
                                    this._oInitiateTradeDialog = new sap.ui.xmlfragment("initiateTradeFragment",
                                            "com.zespri.awct.collab.fragment.SupplierOrdersInitiateTradeDialog", this);
                                    this.getView().addDependent(this._oInitiateTradeDialog);
                                }
                                this._oInitiateTradeDialog.setBindingContext(oTableContext);

                                var oTradeSupplierList = sap.ui.core.Fragment.byId("initiateTradeFragment", "tradeSupplierSelect");
                                var oTradeQuantity = sap.ui.core.Fragment.byId("initiateTradeFragment", "tradeQuantityInput");
                                oTradeQuantity.setValueState(sap.ui.core.ValueState.None);
                                // Refresh the binding context of the Input Field before open
                                oTradeQuantity.getBinding("value").refresh(true);
                                oTradeSupplierList.setSelectedKey("");

                                // Open the dialog
                                this._oInitiateTradeDialog.open();
                                this._oInitiateTradeDialog.setBusy(true);

                                // Function Import for preparing Trade Supplier Drop down List. The supplier who is initiating the trade should be
                                // passed (to be excluded from the list).

                                com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GetSuppliersForTrade", {
                                    urlParameters : {
                                        "AllocationID" : "'" + this._oInitiateTradeDialog.getBindingContext().getProperty("AllocationID") + "'"
                                    }
                                }, function(oModel) {
                                    var aSupplierResults = oModel.getProperty("/results");
                                    // insert a blank entry at beginning of the results array and set it back to model before binding to the supplier
                                    // dropdown list
                                    aSupplierResults.unshift({
                                        Supplier : ""
                                    });
                                    oModel.setProperty("/results", aSupplierResults);
                                    // Success
                                    oTradeSupplierList.setModel(oModel);
                                    oTradeSupplierList.bindItems({
                                        path : "/results",
                                        template : oTradeSupplierList.getBindingInfo("items") ? oTradeSupplierList.getBindingInfo("items").template
                                                : oTradeSupplierList.getItems()[0].clone()
                                    });
                                    oController._oInitiateTradeDialog.setBusy(false);
                                }, function(oError) {
                                    // Error
                                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                });

                            }
                        },

                        /**
                         * This method is called when the Trade button in the Initiate Trade dialog is pressed.
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleInitiateTradeOkPress : function() {

                            // Reading the user entered details in the form
                            var oTradeQuantityInput = sap.ui.core.Fragment.byId("initiateTradeFragment", "tradeQuantityInput");
                            var iTradeQuantity = parseInt(oTradeQuantityInput.getValue(), 10);
                            var sTradeSupplier = sap.ui.core.Fragment.byId("initiateTradeFragment", "tradeSupplierSelect").getSelectedKey();
                            var iAllowedQuantity = parseInt(this._oInitiateTradeDialog.getBindingContext().getProperty("Quantity"), 10) -
                                    parseInt(this._oInitiateTradeDialog.getBindingContext().getProperty("TradeQuantity"), 10);
                            var sUOM = this._oInitiateTradeDialog.getBindingContext().getProperty("UOM");

                            var oController = this;

                            // Check if the trade quantity value is a positive number or not
                            if (isNaN(iTradeQuantity) || (iTradeQuantity <= 0)) {
                                oTradeQuantityInput.setValueState(sap.ui.core.ValueState.Error);
                                oTradeQuantityInput.setValueStateText(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_COLLABORATION_SUPPLIERORDERS_INITIATETRADE_TRADEQUANTITY_ERROR_VALUE_STATE_TEXT"));
                            }
                            // Check if trade quantity value is less than or equal to the total quantity minus the already traded quantity or not
                            else if (iTradeQuantity > iAllowedQuantity) {
                                oTradeQuantityInput.setValueState(sap.ui.core.ValueState.Error);
                                oTradeQuantityInput.setValueStateText(com.zespri.awct.util.I18NHelper.getText(
                                        "TXT_COLLABORATION_SUPPLIERORDERS_INITIATETRADE_TRADEQUANTITY_EXCEED_STATE_TEXT", [iAllowedQuantity, sUOM]));
                            } else {
                                var oTradeDialog = this._oInitiateTradeDialog;
                                oTradeDialog.setBusy(true);
                                var oSelectedRow = this.byId("supplierOrdersTable").getSelectedItem().getBindingContext().getObject();
                                var oTrade = {
                                    "ReceivingSupplierID" : sTradeSupplier,
                                    "DeliveryLineID" : oSelectedRow.DeliveryLineID,
                                    "AllocationID" : oSelectedRow.AllocationID,
                                    "TradeQuantity" : iTradeQuantity + ""
                                };

                                // create a new trade
                                sap.ui.getCore().getRootComponent().getModel().create(
                                        "/TradeSet",
                                        oTrade,
                                        {
                                            success : function() {
                                                oTradeDialog.setBusy(false);
                                                oTradeDialog.close();
                                                com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper
                                                        .getText("TXT_COLLABORATION_SUPPLIERORDERS_TOAST_INITIATETRADE_SUCCESS_MESSAGE"));
                                                oController.byId("supplierOrdersTable").getBinding("items").refresh();
                                            },
                                            error : function(oError) {
                                                oTradeDialog.setBusy(false);

                                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                            },
                                            async : true
                                        });
                            }
                        },

                        /**
                         * This method is called when the Cancel button in the Initiate Trade dialog is pressed to close the dialog
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleInitiateTradeCancelPress : function() {
                            this._oInitiateTradeDialog.close();
                        },
                        /**
                         * This method is used to concatenate all the parameters with hyphen and return the string
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
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
                         * This method is used to concatenate the characteristics with hyphen Variety, Class, Growing method are concatenated as one
                         * group and Pallete base, Stack and Pack are concatenated as another group
                         * 
                         * @param {String}
                         *            sParam1 Variety / PalleteBase
                         * @param {String}
                         *            sParam2 Class / Stack
                         * @param {String}
                         *            sParam3 Growing Method / Pack
                         * @returns {String} Concatenated string
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        formatCharacteristics : function(sParam1, sParam2, sParam3) {
                            return sParam1 + sParam2 + sParam3;
                        },

                        /**
                         * This method is called when the download button is pressed
                         * 
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         */
                        handleExportAsCSVPressed : function() {

                            var sFilterString = "";
                            // If navigating from search form
                            if (this._sDownloadFilterString) {
                                sFilterString = this._sDownloadFilterString;
                            } else {
                                sFilterString = this._createFilterString();
                            }

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
                            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/CollaborationLineSet", {
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
                         * This method will form the filter string based on the selected filterList items from the facet filter.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.SupplierOrders
                         * 
                         * returns {String} sFilterString Filter string to be used for download
                         */
                        _createFilterString : function() {
                            var oFacetFilter = this.byId("facetFilterCollaboration");

                            // Create filters based on facet filter selections
                            var aFacetFilterLists = oFacetFilter.getLists();

                            // Variable to skip if record type checkbox is selected
                            var bSkip = false;
                            var aFilterString = [];

                            // Loop through the facetFilters to form the filter string
                            $.each(aFacetFilterLists, function(i, oList) {
                                if (oList.getSelectedItems().length > 0) {
                                    // Get the Filter list key
                                    var oListKey = oList.getKey();

                                    // For date fields
                                    var bDateField = oList instanceof com.zespri.awct.control.FacetFilterDateInputList;
                                    var bNumberField = oList instanceof com.zespri.awct.control.FacetFilterNumberInputList;

                                    var aFacetFilterStringList = [];

                                    // Loop through each FilterList and form filterString
                                    $.each(oList.getSelectedItems(), function(j, oSelectedItem) {
                                        // get the selectedItem inside the filter list
                                        var oSelectedItemKey = oSelectedItem.getKey();

                                        // Show demand lines checkbox - for recordtype
                                        if (oListKey === "ShowDemandLines") {
                                            oListKey = "RecordType";
                                            // Record type checkbox is not checked
                                            if (!oSelectedItemKey) {
                                                oSelectedItemKey = com.zespri.awct.util.Enums.AllocationLineRecordType.SupplierOrderLine;
                                                bSkip = false;
                                            } else {
                                                bSkip = true;
                                            }
                                        }

                                        // For date fields, add datetime, else surround with '' (no '' for number fields)
                                        if (bDateField) {
                                            oSelectedItemKey = "datetime'" + oSelectedItemKey + "T00:00:00'";
                                        } else if (!bNumberField) {
                                            oSelectedItemKey = "'" + oSelectedItemKey + "'";
                                        }

                                        if (!bSkip) {
                                            var sOperator = " eq ";
                                            // For shortage and surplus (number fields), the operator is gt
                                            if (oListKey === "Shortage" || oListKey === "Surplus") {
                                                sOperator = " gt ";
                                            }
                                            var sFilter = oListKey + sOperator + oSelectedItemKey;
                                            aFacetFilterStringList.push(sFilter);
                                        }
                                    });

                                    if (!bSkip) {
                                        aFilterString.push("(" + aFacetFilterStringList.join(" or ") + ")");
                                    }
                                }
                            });
                            return aFilterString.join(" and ");

                        }
                    });
})();
