(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });
    jQuery.sap.require("com.zespri.awct.control.SearchHelpInput");
    jQuery.sap.require("com.zespri.awct.util.Enums");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");

    /**
     * @classdesc This is the controller for Order History search form that enables the user to provide the parameters for searching through the order
     *            history listing.
     * 
     * @class
     * @name com.zespri.awct.collab.view.TradeOpportunities
     */
    com.zespri.awct.core.Controller
            .extend(
                    "com.zespri.awct.collab.view.TrackOrdersSearchForm",
                    /** @lends com.zespri.awct.collab.view.TrackOrdersSearchForm */
                    {

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
                         * This method is called when the view is first created. All the Input field IDs are saved in a private array
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrdersSearchForm
                         */
                        onInit : function() {

                            /* START of instance member initialization */
                            // Private variable for Search help dialog
                            this._oSearchHelpDialog = null;
                            // Private Instance variable for user authorization
                            this._bUserAuthorized = false;
                            // Private array for Input field IDs
                            this._aSearchInputIDs = ["seasonInput", "shipmentNumberInput", "deliveryNumberInput", "containerIDInput",
                                    "lineNumberInput", "supplierInput", "fromDateInput", "toDateInput", "userInput", "brandInput", "varietyInput",
                                    "classInput", "growingMethodInput", "palletInput", "deliveryStatusInput", "exemptionStatusInput", "stackInput",
                                    "packStyleInput", "sizeInput", "labelInput"];
                            /* END of instance member initialization */

                            var oController = this;
                            this.getRouter().attachRoutePatternMatched(
                                    function(oEvent) {
                                        // Check if the route is for the TradeOpportunities view
                                        if (oEvent.getParameter("name") === "Collaboration/TrackOrdersSearchForm") {
                                            // Check the current user authorizations
                                            if (!oController._bUserAuthorized) {
                                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                                        .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));
                                                return;
                                            }
                                        }
                                    });
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
                                if (this.byId("pageOrderHistorySearchForm")) {
                                    this.byId("pageOrderHistorySearchForm").destroy();
                                }
                                this._bUserAuthorized = false;
                            } else {
                                // If current user is authorized
                                this._bUserAuthorized = true;
                                this._setCurrentSeasonSelected();
                            }
                        },
                        /**
                         * This method is a helper method that returns the CustomData that matches the value of the key
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrdersSearchForm
                         * @param {sap.ui.core.Control}
                         *            Search field Input control
                         * @param {String}
                         *            sKey key of the CustomData to be found
                         * @returns {sap.ui.core.CustomData} CustomData that matches the key. If no key is matched, returns ""
                         */
                        _getCustomDataForKey : function(oControl, sKey) {
                            var aCustomData = oControl.getCustomData();
                            if (aCustomData.length) {
                                for ( var iCustomData = 0; iCustomData < aCustomData.length; iCustomData++) {
                                    if (aCustomData[iCustomData].getKey() === sKey) {
                                        return aCustomData[iCustomData];
                                    }
                                }
                            }
                            return "";
                        },

                        /**
                         * This method returns a string from the selected fields to be shown in the toolbar of the track orders view
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.TrackOrdersSearchForm
                         * 
                         * @returns {String} Filter string in toolbar of track orders view
                         */
                        _getFilterString : function() {
                            var oController = this;
                            var oView = this.getView();
                            var aFilterStringArray = [];
                            // Loop through all search fields
                            jQuery.each(this._aSearchInputIDs,
                                    function(i, eachId) {
                                        var oSearchField = oView.byId(eachId);
                                        if (oSearchField.getValue()) {
                                            var sTempStr;
                                            switch (oController._getCustomDataForKey(oSearchField, "label").getValue()) {
                                                // From date
                                                case "From Date" :
                                                    sTempStr = com.zespri.awct.util.I18NHelper
                                                            .getText("TXT_COLLABORATION_ORDERHISTORY_TOOLBAR_FROM_DATE_TEXT") +
                                                            " (" + oSearchField.getValue() + ")";
                                                    break;
                                                // To date
                                                case "To Date" :
                                                    sTempStr = com.zespri.awct.util.I18NHelper
                                                            .getText("TXT_COLLABORATION_ORDERHISTORY_TOOLBAR_TO_DATE_TEXT") +
                                                            " (" + oSearchField.getValue() + ")";
                                                    break;
                                                // All other fields
                                                default :
                                                    sTempStr = oController._getCustomDataForKey(oSearchField, "label").getValue() + " (" +
                                                            oSearchField.getValue() + ")";
                                                    break;
                                            }
                                            aFilterStringArray.push(sTempStr);
                                        }
                                    });
                            // Concatenate with comma and return the string
                            return aFilterStringArray.join(", ");
                        },

                        /**
                         * This method returns a string from the selected fields which is used when downloading from the track orders view
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.TrackOrdersSearchForm
                         * 
                         * @returns {String} Filter string for download
                         */
                        _getDownloadFilterString : function() {
                            var i = 0;
                            var aDownloadSearchFilter = [];
                            var oFromDate = this.getView().byId("fromDateInput");
                            var oToDate = this.getView().byId("toDateInput");

                            // Loop through all search fields
                            while (i < this._aSearchInputIDs.length) {

                                var oSearchField = this.getView().byId(this._aSearchInputIDs[i]);
                                var aFilter = [];

                                // Get FilterKey
                                var sFilterKeyString = "";
                                if (this._getCustomDataForKey(oSearchField, "filterButtonKey")) {
                                    sFilterKeyString = this._getCustomDataForKey(oSearchField, "filterButtonKey").getValue();
                                }

                                if (this._getCustomDataForKey(oSearchField, "filterValue")) {
                                    // Get Filter values
                                    var aCustomDataArray = this._getCustomDataForKey(oSearchField, "filterValue").getValue();

                                    for ( var iCustomDataIndex in aCustomDataArray) {
                                        var oFilter = sFilterKeyString + " eq '" + aCustomDataArray[iCustomDataIndex] + "'";
                                        aFilter.push(oFilter);
                                    }
                                    // OR for filtering values for same filter
                                    var oEachFilter = "(" + aFilter.join(" or ") + ")";
                                    aDownloadSearchFilter.push(oEachFilter);
                                }
                                i = i + 1;
                            }

                            // From date
                            if (oFromDate.getValue()) {
                                var oFromFilter = "(" + this._getCustomDataForKey(oFromDate, "filterButtonKey").getValue() + " eq " +
                                        this._getExternalFormatValue(oFromDate.getYyyymmdd(), true) + ")";
                                aDownloadSearchFilter.push(oFromFilter);
                            }

                            // To date
                            if (oToDate.getValue()) {
                                var oToFilter = "(" + this._getCustomDataForKey(oToDate, "filterButtonKey").getValue() + " eq " +
                                        this._getExternalFormatValue(oToDate.getYyyymmdd(), true) + ")";
                                aDownloadSearchFilter.push(oToFilter);
                            }

                            return aDownloadSearchFilter.join(" and ");

                        },

                        /**
                         * This method is called for binding the corresponding values to the table select dialog
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrdersSearchForm
                         * @param {Object}
                         *            oSearchField The search field for which the binding has to be done
                         */
                        bindTableSelectDialog : function(oSearchField) {

                            var oView = this.getView();
                            var oController = this;

                            var sBindingPathForItems = oController._getCustomDataForKey(oSearchField, "entitySet").getValue();
                            var sListItemRelativeBindingPath = oController._getCustomDataForKey(oSearchField, "BindingKey").getValue();
                            var sFilter = "";
                            var sFilterString = "";
                            if (oController._getCustomDataForKey(oSearchField, "filter")) {
                                sFilter = oController._getCustomDataForKey(oSearchField, "filter").getValue();
                            }

                            var fnSuccess = function(oJSON) {

                                // Set growing threshold to the number of results so that preselection can be done
                                oController._oSearchHelpDialog.setGrowingThreshold(oJSON.getData().results.length);

                                // Set the model
                                oController._oSearchHelpDialog.setModel(oJSON);

                                var oBindingInfo = {
                                    path : "/results",
                                    factory : function(sId, oContext) {
                                        var sText = oContext.getProperty(sListItemRelativeBindingPath);
                                        return new sap.m.ColumnListItem({
                                            cells : [new sap.m.Text({
                                                text : sText
                                            })]
                                        });
                                    }
                                };

                                // Bind the items to the TableSelectDialog
                                oController._oSearchHelpDialog.bindItems(oBindingInfo);

                                // Preselect the values that the user had selected when the dialog was opened the previous time
                                // 1. Read the value in the textbox
                                // 2. Loop through the items bound to the dialog box
                                // 3. If the values are same, set it as selected
                                var aSearchFieldValue = oSearchField.getValue().split(', ');

                                // Value from textbox
                                for ( var iSearchFieldValueCount = 0; iSearchFieldValueCount < aSearchFieldValue.length; iSearchFieldValueCount++) {
                                    // Items in dialog box
                                    for ( var iSearchHelpDialogItemCount = 0; iSearchHelpDialogItemCount < oController._oSearchHelpDialog.getItems().length; iSearchHelpDialogItemCount++) {
                                        // Prevent selection of blank values
                                        if (aSearchFieldValue[iSearchFieldValueCount] &&
                                                (aSearchFieldValue[iSearchFieldValueCount] === oController._oSearchHelpDialog.getItems()[iSearchHelpDialogItemCount]
                                                        .getCells()[0].getText())) {
                                            oController._oSearchHelpDialog.getItems()[iSearchHelpDialogItemCount].setSelected(true);
                                        }
                                    }
                                }
                                oController._oSearchHelpDialog._dialog.setBusy(false);
                            };

                            // destroy items before opening
                            this._oSearchHelpDialog.destroyItems();

                            this._oSearchHelpDialog._dialog.setBusy(true);
                            this._oSearchHelpDialog._dialog.setBusyIndicatorDelay(0);

                            // Create the required filter string parameter
                            var sFilterButtonKey = oController._getCustomDataForKey(oSearchField, "filterButtonKey").getValue();
                            switch (sFilterButtonKey) {
                                // Shipment Number depends on the selected season
                                case "ShipmentID" :
                                    var oSeasonInput = oView.byId("seasonInput");
                                    var aSeasonId = [];
                                    if (oController._getCustomDataForKey(oSeasonInput, "filterValue")) {
                                        aSeasonId = oController._getCustomDataForKey(oSeasonInput, "filterValue").getValue();
                                    }

                                    // By default, if will show shipments for the current season
                                    var sShipmentFilter = "Season eq '" +
                                            sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason + "'";

                                    // If only one shipment ID is selected
                                    if (aSeasonId.length === 1) {
                                        sShipmentFilter = "Season eq '" + aSeasonId[0] + "'";
                                    }
                                    // If multiple Shipment IDs are selected, combine them using OR
                                    else if (aSeasonId.length > 1) {
                                        var aShipmentFilterString = [];
                                        for ( var iSeasonIndex = 0; iSeasonIndex < aSeasonId.length; iSeasonIndex++) {
                                            aShipmentFilterString[iSeasonIndex] = "ShipmentID eq '" + aSeasonId[iSeasonIndex] + "'";
                                        }
                                        sShipmentFilter = "(" + aShipmentFilterString.join(" or ") + ")";
                                    }
                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead(sBindingPathForItems, {
                                        urlParameters : {
                                            "$select" : sListItemRelativeBindingPath,
                                            "$filter" : sShipmentFilter
                                        }
                                    }, fnSuccess, function(oError) {
                                        // Error
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        oController._oSearchHelpDialog._dialog.setBusy(false);
                                        oController._oSearchHelpDialog._dialog.close();
                                    });
                                    break;

                                // Delivery Number depends on the selected shipment number
                                case "DeliveryID" :
                                    var oShipmentInput = oView.byId("shipmentNumberInput");
                                    var aShipmentId = [];
                                    if (oController._getCustomDataForKey(oShipmentInput, "filterValue")) {
                                        aShipmentId = oController._getCustomDataForKey(oShipmentInput, "filterValue").getValue();
                                    }
                                    var sDeliveryNumberFilter = "";
                                    // If only one shipment ID is selected
                                    if (aShipmentId.length === 1) {
                                        sDeliveryNumberFilter = "ShipmentID eq '" + aShipmentId[0] + "'";
                                    }
                                    // If multiple Shipment IDs are selected, combine them using OR
                                    else if (aShipmentId.length > 1) {
                                        var aDeliveryNumberFilterString = [];
                                        for ( var i = 0; i < aShipmentId.length; i++) {
                                            aDeliveryNumberFilterString[i] = "ShipmentID eq '" + aShipmentId[i] + "'";
                                        }
                                        sDeliveryNumberFilter = "(" + aDeliveryNumberFilterString.join(" or ") + ")";
                                    }
                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead(sBindingPathForItems, {
                                        urlParameters : {
                                            "$select" : sListItemRelativeBindingPath,
                                            "$filter" : sDeliveryNumberFilter
                                        }
                                    }, fnSuccess, function(oError) {
                                        // Error
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        oController._oSearchHelpDialog._dialog.setBusy(false);
                                        oController._oSearchHelpDialog._dialog.close();
                                    });
                                    break;

                                // Supplier ID
                                case "SupplierID" :

                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead(sBindingPathForItems, {
                                        urlParameters : {
                                            "$filter" : "UserID eq '" + oController.getView().getModel("currentUserDetails").getProperty("/UserID") +
                                                    "'"
                                        }
                                    }, fnSuccess, function(oError) {
                                        // Error
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        oController._oSearchHelpDialog._dialog.setBusy(false);
                                        oController._oSearchHelpDialog._dialog.close();
                                    });
                                    break;

                                case "ContainerID" :
                                    // Container ID depends on Shipments selected.

                                    var oShipmentIDInput = oView.byId("shipmentNumberInput");
                                    var aShipmentIDs = [];

                                    if (oController._getCustomDataForKey(oShipmentIDInput, "filterValue")) {
                                        aShipmentIDs = oController._getCustomDataForKey(oShipmentIDInput, "filterValue").getValue();
                                    }

                                    // If a Shipment ID is selected, add it to the filter
                                    if (oController._getCustomDataForKey(oShipmentIDInput, "filterValue")) {
                                        var sShipmentFilterString = "";
                                        // If there are multiple ShipmentIds, combine them by OR
                                        if (aShipmentIDs.length === 1) {
                                            sShipmentFilterString = "ShipmentID eq '" + aShipmentIDs[0] + "'";
                                        } else if (aShipmentIDs.length > 1) {
                                            var aMultipleShipmentString = [];
                                            for ( var iShipmentIdIndex = 0; iShipmentIdIndex < aShipmentIDs.length; iShipmentIdIndex++) {

                                                aMultipleShipmentString.push("ShipmentID eq '" + aShipmentIDs[iShipmentIdIndex] + "'");
                                            }
                                            sShipmentFilterString = "(" + aMultipleShipmentString.join(" or ") + ")";
                                        }
                                        sFilterString = sShipmentFilterString;
                                    }

                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead(sBindingPathForItems, {
                                        urlParameters : {
                                            "$filter" : sFilterString
                                        }
                                    }, fnSuccess, function(oError) {
                                        // Error
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        oController._oSearchHelpDialog._dialog.setBusy(false);
                                        oController._oSearchHelpDialog._dialog.close();
                                    });

                                    break;

                                case "DeliveryLineNumber" :
                                    // Line number depends on selected Delivery IDs

                                    var oDeliveryIDInput = oView.byId("deliveryNumberInput");
                                    var aDeliveryIDs = [];

                                    if (oController._getCustomDataForKey(oDeliveryIDInput, "filterValue")) {
                                        aDeliveryIDs = oController._getCustomDataForKey(oDeliveryIDInput, "filterValue").getValue();
                                    }

                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GetLineNumbersForDelivery", {
                                        urlParameters : {
                                            "DeliveryID" : "'" + aDeliveryIDs[0] + "'"
                                        }
                                    }, fnSuccess, function(oError) {
                                        // Error
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        oController._oSearchHelpDialog._dialog.setBusy(false);
                                        oController._oSearchHelpDialog._dialog.close();
                                    });

                                    break;

                                // For all other fields, filter is created from what is mentioned in the XML file
                                default :
                                    sFilterString = "";
                                    if (sFilter) {
                                        var oFilterObject = JSON.parse(sFilter);
                                        sFilterString = oFilterObject.path + " " + oFilterObject.operator + " '" + oFilterObject.value1 + "'";
                                    }
                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead(sBindingPathForItems, {
                                        urlParameters : {
                                            "$filter" : sFilterString
                                        }
                                    }, fnSuccess, function(oError) {
                                        // Error
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        oController._oSearchHelpDialog._dialog.setBusy(false);
                                        oController._oSearchHelpDialog._dialog.close();
                                    });
                                    break;

                            }
                        },

                        /**
                         * This method is called when the value help button for the Exemption Status is pressed. A separate method is required because
                         * the values for Exemption status are not read from any entity set, but are coded from the private enum used
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrdersSearchForm
                         * @param oEvent
                         */
                        handleValueHelpExemptionStatusPress : function(oEvent) {
                            this._oSearchInputField = oEvent.getSource();

                            // create value help dialog only once
                            if (!this._oSearchHelpDialog) {
                                this._oSearchHelpDialog = new sap.ui.xmlfragment("trackOrdersSearchFormDialog",
                                        "com.zespri.awct.collab.fragment.SearchFieldSelectionDialog", this);
                                this.getView().addDependent(this._oSearchHelpDialog);
                            }

                            // Get the label for the dialog
                            var sLabel = this._getCustomDataForKey(this._oSearchInputField, "label").getValue();
                            this._oSearchHelpDialog.setTitle(sLabel);
                            sap.ui.core.Fragment.byId("trackOrdersSearchFormDialog", "searchFieldLabel").setText(
                                    com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_HISTORY_SEARCH_FORM_VALUE_HELP_DIALOG_ALL_LABEL"));

                            // Binding data to the table to be done here
                            var oBindItems = {
                                "ExemptionStatusSet" : [{
                                    "key" : com.zespri.awct.util.Enums.ExemptionStatus.NONE,
                                    "value" : "NONE"
                                }, {
                                    "key" : com.zespri.awct.util.Enums.ExemptionStatus.PENDING,
                                    "value" : "PENDING"
                                }, {
                                    "key" : com.zespri.awct.util.Enums.ExemptionStatus.COMPLETE,
                                    "value" : "COMPLETE"
                                }]
                            };

                            // Create JSON model for the bind items
                            var oExemptionJSONModel = new sap.ui.model.json.JSONModel(oBindItems);
                            // set the model to the dialog
                            this._oSearchHelpDialog.setModel(oExemptionJSONModel, "ExemptionStatus");
                            var oBindingInfo = {
                                path : "ExemptionStatus>/ExemptionStatusSet",
                                factory : function(sId, oContext) {
                                    var sText = oContext.getProperty("value");
                                    return new sap.m.ColumnListItem({
                                        cells : [new sap.m.Text({
                                            text : sText
                                        })]
                                    });
                                }
                            };

                            // bind items to the dialog
                            this._oSearchHelpDialog.bindItems(oBindingInfo);

                            // Preselect the values that the user had selected when the dialog was opened the previous time
                            // 1. Read the value in the textbox
                            // 2. Loop through the items bound to the dialog box
                            // 3. If the values are same, set it as selected
                            var aSearchFieldValue = this._oSearchInputField.getValue().split(', ');
                            // Value from textbox
                            for ( var iExemptionStatusFieldValueCount = 0; iExemptionStatusFieldValueCount < aSearchFieldValue.length; iExemptionStatusFieldValueCount++) {
                                // Items in dialog box
                                for ( var iSearchHelpDialogItemCount = 0; iSearchHelpDialogItemCount < this._oSearchHelpDialog.getItems().length; iSearchHelpDialogItemCount++) {
                                    if (aSearchFieldValue[iExemptionStatusFieldValueCount] === this._oSearchHelpDialog.getItems()[iSearchHelpDialogItemCount]
                                            .getCells()[0].getText()) {
                                        this._oSearchHelpDialog.getItems()[iSearchHelpDialogItemCount].setSelected(true);
                                    }
                                }
                            }
                            // Open the dialog
                            this._oSearchHelpDialog.open();
                        },

                        /**
                         * This method is called when the value help button for the Delivery Status is pressed. A separate method is required because
                         * the values for Delivery status are not read from any entity set, but are coded from the private enum used
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrdersSearchForm
                         * @param oEvent
                         */
                        handleValueHelpDeliveryStatusPress : function(oEvent) {
                            this._oSearchInputField = oEvent.getSource();

                            // create value help dialog only once
                            if (!this._oSearchHelpDialog) {
                                this._oSearchHelpDialog = new sap.ui.xmlfragment("trackOrdersSearchFormDialog",
                                        "com.zespri.awct.collab.fragment.SearchFieldSelectionDialog", this);
                                this.getView().addDependent(this._oSearchHelpDialog);
                            }

                            // Get the label for the dialog
                            var sLabel = this._getCustomDataForKey(this._oSearchInputField, "label").getValue();
                            this._oSearchHelpDialog.setTitle(sLabel);
                            sap.ui.core.Fragment.byId("trackOrdersSearchFormDialog", "searchFieldLabel").setText(
                                    com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_HISTORY_SEARCH_FORM_VALUE_HELP_DIALOG_ALL_LABEL"));

                            // Binding data to the table to be done here
                            var oBindItems = {
                                "DeliveryStatusSet" : [
                                        {
                                            "key" : this._DeliveryStatus.BeforeRelease,
                                            "value" : com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_HISTORY_SEARCH_FORM_DELIVERY_STATUS_BEFORE_RELEASE_TEXT")
                                        },
                                        {
                                            "key" : this._DeliveryStatus.DeliveryRelease,
                                            "value" : com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_HISTORY_SEARCH_FORM_DELIVERY_STATUS_DELIVERY_RELEASE_TEXT")
                                        },
                                        {
                                            "key" : this._DeliveryStatus.DeliveryLock,
                                            "value" : com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_HISTORY_SEARCH_FORM_DELIVERY_STATUS_DELIVERY_LOCK_TEXT")
                                        },
                                        {
                                            "key" : this._DeliveryStatus.DeliveryUnock,
                                            "value" : com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_HISTORY_SEARCH_FORM_DELIVERY_STATUS_DELIVERY_UNLOCK_TEXT")
                                        },
                                        {
                                            "key" : this._DeliveryStatus.ChangesDuringLock,
                                            "value" : com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_HISTORY_SEARCH_FORM_DELIVERY_STATUS_CHANGES_DURING_LOCK_TEXT")
                                        },
                                        {
                                            "key" : this._DeliveryStatus.OnUnlockDIFOTIS,
                                            "value" : com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_HISTORY_SEARCH_FORM_DELIVERY_STATUS_ON_UNLOCK_TEXT")
                                        }]
                            };

                            // Create JSON model for the bind items
                            var oDeliveryStatusJSONModel = new sap.ui.model.json.JSONModel(oBindItems);
                            // set the model to the dialog
                            this._oSearchHelpDialog.setModel(oDeliveryStatusJSONModel, "DeliveryStatus");
                            var oBindingInfo = {
                                path : "DeliveryStatus>/DeliveryStatusSet",
                                factory : function(sId, oContext) {
                                    var sText = oContext.getProperty("value");
                                    return new sap.m.ColumnListItem({
                                        cells : [new sap.m.Text({
                                            text : sText
                                        })]
                                    });
                                }
                            };

                            // bind items to the dialog
                            this._oSearchHelpDialog.bindItems(oBindingInfo);

                            // Preselect the values that the user had selected when the dialog was opened the previous time
                            // 1. Read the value in the textbox
                            // 2. Loop through the items bound to the dialog box
                            // 3. If the values are same, set it as selected
                            var aSearchFieldValue = this._oSearchInputField.getValue().split(', ');
                            // Value from textbox
                            for ( var iDeliveryStatusFieldValueCount = 0; iDeliveryStatusFieldValueCount < aSearchFieldValue.length; iDeliveryStatusFieldValueCount++) {
                                // Items in dialog box
                                for ( var iSearchHelpDialogItemCount = 0; iSearchHelpDialogItemCount < this._oSearchHelpDialog.getItems().length; iSearchHelpDialogItemCount++) {
                                    if (aSearchFieldValue[iDeliveryStatusFieldValueCount] === this._oSearchHelpDialog.getItems()[iSearchHelpDialogItemCount]
                                            .getCells()[0].getText()) {
                                        this._oSearchHelpDialog.getItems()[iSearchHelpDialogItemCount].setSelected(true);
                                    }
                                }
                            }
                            // Open the dialog
                            this._oSearchHelpDialog.open();
                        },

                        /**
                         * This method is called when the search help button of any of the input fields in the search form is pressed.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrdersSearchForm
                         * @param {sap.ui.base.Event}
                         *            oEvent The Event object
                         */
                        handleValueHelpPress : function(oEvent) {

                            this._oSearchInputField = oEvent.getSource();

                            // create value help dialog only once
                            if (!this._oSearchHelpDialog) {
                                this._oSearchHelpDialog = new sap.ui.xmlfragment("trackOrdersSearchFormDialog",
                                        "com.zespri.awct.collab.fragment.SearchFieldSelectionDialog", this);
                                this.getView().addDependent(this._oSearchHelpDialog);
                            }

                            // Get the label for the dialog
                            var sLabel = this._getCustomDataForKey(this._oSearchInputField, "label").getValue();
                            this._oSearchHelpDialog.setTitle(sLabel);

                            if (this._oSearchInputField.getId() === this.createId("deliveryNumberInput")) {
                                this._oSearchHelpDialog.setMultiSelect(false);
                                sap.ui.core.Fragment.byId("trackOrdersSearchFormDialog", "searchFieldLabel").setVisible(false);
                            } else {
                                this._oSearchHelpDialog.setMultiSelect(true);
                                sap.ui.core.Fragment.byId("trackOrdersSearchFormDialog", "searchFieldLabel").setText(
                                        com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_HISTORY_SEARCH_FORM_VALUE_HELP_DIALOG_ALL_LABEL"));
                                sap.ui.core.Fragment.byId("trackOrdersSearchFormDialog", "searchFieldLabel").setVisible(true);
                            }

                            // No data text
                            com.zespri.awct.util.CommonHelper.manageNoDataText(this._oSearchHelpDialog._table);

                            // Binding data to the table to be done here
                            this.bindTableSelectDialog(this._oSearchInputField);

                            // Open the dialog
                            this._oSearchHelpDialog.open();
                        },

                        /**
                         * This method is called when the search button is pressed in the table select dialog fragment
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrdersSearchForm
                         * @param {sap.ui.base.Event}
                         *            oEvent The Event object
                         */
                        handleValueHelpDialogSearch : function(oEvent) {

                            var sValue = oEvent.getParameter("value");
                            var sFilterKey = this.getView().getController()._getCustomDataForKey(this._oSearchInputField, "filterKey").getValue();

                            var oFilter = new sap.ui.model.Filter(sFilterKey, sap.ui.model.FilterOperator.Contains, sValue);
                            var oBinding = oEvent.getSource().getBinding("items");
                            oBinding.filter([oFilter]);
                        },

                        /**
                         * This method is called when the OK button is pressed in the table select dialog fragment
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrdersSearchForm
                         * @param {sap.ui.base.Event}
                         *            oEvent The Event object
                         */
                        handleValueHelpDialogOKPress : function(oEvent) {

                            var sFilterKey = this._getCustomDataForKey(this._oSearchInputField, "filterKey").getValue();
                            var sBindingKey = this._getCustomDataForKey(this._oSearchInputField, "BindingKey").getValue();

                            // List of selected items
                            var aContexts = oEvent.getParameter("selectedContexts");

                            // Array of selected keys from the list of items
                            var aSelectedKeys = aContexts.map(function(oContext) {
                                return oContext.getProperty(sFilterKey);
                            });

                            // Array of selected values from the list of items
                            var aSelectedValues = aContexts.map(function(oContext) {
                                return oContext.getProperty(sBindingKey);
                            });

                            // Set the value for the textbox
                            this._oSearchInputField.setValue(aSelectedValues.join(", "));

                            // Remove previously added custom data
                            if (this._getCustomDataForKey(this._oSearchInputField, "filterValue")) {
                                this._oSearchInputField.removeCustomData(this._getCustomDataForKey(this._oSearchInputField, "filterValue"));
                            }

                            // If a new item is selected, add new custom data
                            if (aSelectedKeys.length > 0) {
                                this._oSearchInputField.addCustomData(new sap.ui.core.CustomData({
                                    "key" : "filterValue",
                                    "value" : aSelectedKeys
                                }));
                            }

                            // If no season is selected, select current season
                            if (!this._getCustomDataForKey(this.byId("seasonInput"), "filterValue")) {
                                this._setCurrentSeasonSelected();
                            }

                            var oShipmentNumberInput = this.getView().byId("shipmentNumberInput");
                            var oDeliveryNumberInput = this.getView().byId("deliveryNumberInput");
                            var oContainerIDInput = this.getView().byId("containerIDInput");
                            var oLineNumberInput = this.getView().byId("lineNumberInput");

                            // Clear dependent fields
                            // When season is changed, shipment number is cleared, and remove the custom data.
                            if (this._oSearchInputField.getId() === this.createId("seasonInput")) {
                                oShipmentNumberInput.setValue("");
                                if (this._getCustomDataForKey(oShipmentNumberInput, "filterValue")) {
                                    oShipmentNumberInput.removeCustomData(this._getCustomDataForKey(oShipmentNumberInput, "filterValue"));
                                }
                            }

                            // When shipment number is changed, delivery number, container and line number are cleared, and remove the custom data.
                            if (this._oSearchInputField.getId() === this.createId("shipmentNumberInput")) {
                                oDeliveryNumberInput.setValue("");
                                if (this._getCustomDataForKey(oDeliveryNumberInput, "filterValue")) {
                                    oDeliveryNumberInput.removeCustomData(this._getCustomDataForKey(oDeliveryNumberInput, "filterValue"));
                                }

                                oContainerIDInput.setValue("");
                                if (this._getCustomDataForKey(oContainerIDInput, "filterValue")) {
                                    oContainerIDInput.removeCustomData(this._getCustomDataForKey(oContainerIDInput, "filterValue"));
                                }

                                oLineNumberInput.setValue("");
                                if (this._getCustomDataForKey(oLineNumberInput, "filterValue")) {
                                    oLineNumberInput.removeCustomData(this._getCustomDataForKey(oLineNumberInput, "filterValue"));
                                }
                            }

                            // When Delivery ID is changed, clear line number
                            if (this._oSearchInputField.getId() === this.createId("deliveryNumberInput")) {
                                oLineNumberInput.setValue("");
                                if (this._getCustomDataForKey(oLineNumberInput, "filterValue")) {
                                    oLineNumberInput.removeCustomData(this._getCustomDataForKey(oLineNumberInput, "filterValue"));
                                }
                            }
                        },

                        /**
                         * This method is called when the filter button is pressed in the search form. This is a wrapper method for the _applyFilterr
                         * method. This is needed, because for mobile devices we need to first remove focus from the DatePicker control (not part of
                         * sap.m) and then apply filters.
                         * 
                         * If this is not done, then the following is observed : Use the date picker... immediately next, click on 'Filter'... the
                         * selected date is not applied.
                         * 
                         * Solution : Remove focus from the form, and then form the filter string and filter object.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrdersSearchView
                         */
                        handleFilterPress : function() {
                            if (jQuery.device.is.desktop) {
                                this._applyFilter();
                            } else {
                                this.byId("continueButton").focus();
                                window.setTimeout(this._applyFilter.bind(this), 0);
                            }
                        },

                        /**
                         * Forms the filter object and filter string, and triggers a navigation to the table view
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrdersSearchView
                         */
                        _applyFilter : function() {

                            var aSearchFilter = [];
                            var i = 0;

                            // Loop through all search fields
                            while (i < this._aSearchInputIDs.length) {

                                var oSearchField = this.getView().byId(this._aSearchInputIDs[i]);
                                var aFilter = [];

                                // If exemption status
                                if (this._aSearchInputIDs[i] === "exemptionStatusInput") {

                                    // Get FilterKey
                                    var sFilterKey = "";
                                    if (this._getCustomDataForKey(oSearchField, "filterButtonKey")) {
                                        sFilterKey = this._getCustomDataForKey(oSearchField, "filterButtonKey").getValue();
                                    }

                                    if (this._getCustomDataForKey(oSearchField, "filterValue")) {
                                        // Get Filter values
                                        var aCustomData = this._getCustomDataForKey(oSearchField, "filterValue").getValue();

                                        for ( var iCustomData in aCustomData) {
                                            var oExemptionStatusFilter = null;
                                            switch (aCustomData[iCustomData]) {
                                                case com.zespri.awct.util.Enums.ExemptionStatus.NONE :
                                                    oExemptionStatusFilter = new sap.ui.model.Filter(sFilterKey, "EQ",
                                                            com.zespri.awct.util.Enums.ExemptionStatus.NONE);
                                                    break;
                                                case com.zespri.awct.util.Enums.ExemptionStatus.PENDING :
                                                    oExemptionStatusFilter = new sap.ui.model.Filter(sFilterKey, "EQ",
                                                            com.zespri.awct.util.Enums.ExemptionStatus.PENDING);
                                                    break;
                                                case com.zespri.awct.util.Enums.ExemptionStatus.COMPLETE :
                                                    oExemptionStatusFilter = new sap.ui.model.Filter(sFilterKey, "EQ",
                                                            com.zespri.awct.util.Enums.ExemptionStatus.COMPLETE);
                                                    break;
                                            }
                                            aFilter.push(oExemptionStatusFilter);
                                        }
                                        // OR for filtering values for same filter
                                        var oEachExemptionStatusFilter = new sap.ui.model.Filter(aFilter, false);
                                        aSearchFilter.push(oEachExemptionStatusFilter);
                                    }
                                } else {

                                    // Get FilterKey
                                    var sFilterKeyString = "";
                                    if (this._getCustomDataForKey(oSearchField, "filterButtonKey")) {
                                        sFilterKeyString = this._getCustomDataForKey(oSearchField, "filterButtonKey").getValue();
                                    }

                                    if (this._getCustomDataForKey(oSearchField, "filterValue")) {
                                        // Get Filter values
                                        var aCustomDataArray = this._getCustomDataForKey(oSearchField, "filterValue").getValue();

                                        for ( var iCustomDataIndex in aCustomDataArray) {
                                            var oFilter = new sap.ui.model.Filter(sFilterKeyString, "EQ", aCustomDataArray[iCustomDataIndex]);
                                            aFilter.push(oFilter);
                                        }
                                        // OR for filtering values for same filter
                                        var oEachFilter = new sap.ui.model.Filter(aFilter, false);
                                        aSearchFilter.push(oEachFilter);
                                    }
                                }
                                i = i + 1;
                            }

                            // From date
                            var oFromDate = this.getView().byId("fromDateInput");
                            if (oFromDate.getValue()) {
                                var oDateFilter1 = new sap.ui.model.Filter(this._getCustomDataForKey(oFromDate, "filterButtonKey").getValue(), "EQ",
                                        this._getExternalFormatValue(oFromDate.getYyyymmdd(), false));
                                aSearchFilter.push(oDateFilter1);
                            }

                            // To date
                            var oToDate = this.getView().byId("toDateInput");
                            if (oToDate.getValue()) {
                                var oDateFilter2 = new sap.ui.model.Filter(this._getCustomDataForKey(oToDate, "filterButtonKey").getValue(), "EQ",
                                        this._getExternalFormatValue(oToDate.getYyyymmdd(), false));
                                aSearchFilter.push(oDateFilter2);
                            }

                            // AND all filters
                            var oCompleteFilter = new sap.ui.model.Filter(aSearchFilter, true);

                            // Create concatenated Filter string
                            var sFilterString = com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_ORDERHISTORY_FILTER_TOOLBAR_TEXT") +
                                    this._getFilterString();

                            var sDownloadFilterString = this._getDownloadFilterString();

                            // If no filters are selected
                            if (!oCompleteFilter.aFilters.length) {
                                oCompleteFilter = null;
                                sFilterString = com.zespri.awct.util.I18NHelper
                                        .getText("TXT_COLLABORATION_ORDERHISTORY_FILTER_TOOLBAR_NO_FILTER_TEXT");
                            }

                            // Send filter to supplier orders screen
                            this.getRouter().navTo("Collaboration/TrackOrders", {
                                customData : {
                                    searchFormFilterObject : oCompleteFilter,
                                    searchFormFilterString : sFilterString,
                                    downloadFilterString : sDownloadFilterString
                                }
                            });
                        },

                        /**
                         * This method is called when the reset button is pressed in the search form
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrdersSearchForm
                         */
                        handleResetPress : function() {
                            var oView = this.getView();
                            jQuery.each(this._aSearchInputIDs, function(i, eachId) {
                                var oSearchField = oView.byId(eachId);
                                // Reset the value of the field
                                oSearchField.setValue("");

                                // Remove Custom Data
                                if (oView.getController()._getCustomDataForKey(oSearchField, "filterValue")) {
                                    oSearchField.removeCustomData(oView.getController()._getCustomDataForKey(oSearchField, "filterValue"));
                                }
                            });

                            // Select current season
                            this._setCurrentSeasonSelected();
                        },

                        /**
                         * This method is called to eselect the current season, when no seasons are selected.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.TrackOrdersSearchForm
                         */
                        _setCurrentSeasonSelected : function() {
                            var oSeasonInput = this.byId("seasonInput");
                            // Get the current season
                            var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;

                            // preselect the current season by setting the input field value and adding it to custom data
                            oSeasonInput.setValue(sCurrentSeason);
                            oSeasonInput.addCustomData(new sap.ui.core.CustomData({
                                key : "filterValue",
                                value : [sCurrentSeason]
                            }));
                        },

                        /**
                         * This method converts a YYYYMMDD string into its corresponding datetime'YYYY-mm-ddT00:00:00' representation. (e.g
                         * datetime'2000-12-25T00:00:00')
                         * 
                         * @private
                         * 
                         * @memberOf com.zespri.awct.collab.view.TrackOrdersSearchForm
                         * @param {String}
                         *            sDateValue contains the date in yyyymmdd format
                         * @param {Boolean}
                         *            bIsDownload True -> If call is from Download FilterString, we manually form the filter string with "dateTime", 
                         *                        False -> For filter objects , framework will take care of adding dateTime
                         */
                        _getExternalFormatValue : function(sDateValue, bIsDownload) {
                            var sYear = sDateValue.substring(0, 4);
                            var sMonth = sDateValue.substring(4, 6);
                            var sDate = sDateValue.substring(6, 8);
                            // For download we manually form $filter string, so datetime'..' is needed.
                            // For filter objects, framework will take care of adding datetime''
                            if (bIsDownload) {
                                return "datetime'" + sYear + "-" + sMonth + "-" + sDate + "T00:00:00'";
                            } else {
                                return sYear + "-" + sMonth + "-" + sDate;
                            }

                        }
                    });
})();
