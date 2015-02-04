(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });
    jQuery.sap.require("com.zespri.awct.control.SearchHelpInput");
    jQuery.sap.require("com.zespri.awct.util.CommonHelper");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");

    /**
     * @classdesc The Search form provides a form with all search parameters for finding an order in the supplier order listing This is part of the
     *            dual channel approach where the order listing with facet filters is the primary channel and the search form is the secondary channel
     * 
     * @class
     * @name com.zespri.awct.collab.view.SearchForm
     */
    com.zespri.awct.core.Controller
            .extend(
                    "com.zespri.awct.collab.view.SearchForm",
                    /** @lends com.zespri.awct.collab.view.SearchForm */
                    {
                        onInit : function() {
                            /* START of instance member initialization */
                            // Private variable for search field ids
                            this._aSearchInputIDs = ["supplierIDInput", "shipmentIDInput", "destinationPortInput", "deliveryNumberInput",
                                    "containerIDInput", "loadPortInput", "shipmentNameInput", "shipmentTypeInput", "marketAccessAreaInput",
                                    "marketerInput", "daysFromLoadInput", "brandInput", "stackInput", "packStyleInput", "sizeInput", "labelInput"];
                            // Private variable for table select dialog
                            this._oSearchHelpDialog = null;
                            // Private Instance variable for user authorization
                            this._bUserAuthorized = false;
                            /* END of instance member initialization */

                            var oController = this;
                            this.getRouter().attachRoutePatternMatched(
                                    function(oEvent) {
                                        // Check if the route is for the TradeOpportunities view
                                        if (oEvent.getParameter("name") === "Collaboration/SearchForm") {
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
                         * @memberOf com.zespri.awct.collab.view.SearchForm
                         */
                        onBeforeRendering : function() {
                            // Check User Authorizations
                            if (!(com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP) || (com.zespri.awct.util.CommonHelper.isUserAuthorized(
                                    com.zespri.awct.util.Enums.AuthorizationMode.Display,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)))) {
                                if (this.byId("pageSearchForm")) {
                                    this.byId("pageSearchForm").destroy();
                                }
                                this._bUserAuthorized = false;
                            } else {
                                this._bUserAuthorized = true;
                                // Set the season filter for ShipmentID to the current season. This is done only for ShipmentID
                                var oShipmentID = this.byId("shipmentIDInput");
                                this._getCustomDataForKey(oShipmentID, "filter").setValue(JSON.stringify({
                                    "path" : "Season",
                                    "operator" : "EQ",
                                    "value1" : sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason
                                }));
                            }
                        },
                        /**
                         * This method is a helper method that returns the CustomData that matches the value of the key
                         * 
                         * @private
                         * @param {sap.ui.core.Control}
                         *            Search field Input control
                         * @param {String}
                         *            sKey key of the CustomData to be found
                         * @memberOf com.zespri.awct.collab.view.SearchForm
                         * 
                         * @returns CustomData that matches the key. If no key is matched, returns ""
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
                         * This method returns a string from the selected fields to be shown in the toolbar of the supplier orders view
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.SearchForm
                         * @returns {String} Filter string in toolbar of supplier orders view
                         */
                        _getFilterString : function() {
                            var oController = this;
                            var oView = this.getView();
                            var aFilterStringArray = [];
                            jQuery.each(this._aSearchInputIDs, function(i, eachId) {
                                var oSearchField = oView.byId(eachId);
                                if (oSearchField.getValue()) {
                                    var sTempStr = oController._getCustomDataForKey(oSearchField, "label").getValue() + " (" +
                                            oSearchField.getValue() + ")";
                                    aFilterStringArray.push(sTempStr);
                                }
                            });

                            // Fruit group
                            var oFruitGroupInput = this.byId("fruitGroupInput");
                            if (oFruitGroupInput.getValue()) {
                                // Get fruit group object
                                var oFruitGroup = this._parseFruitGroupString(oFruitGroupInput.getValue());

                                // Variety
                                if (oFruitGroup.Variety) {
                                    var sVariety = oController._getCustomDataForKey(oFruitGroupInput, "varietyLabel").getValue() + " (" +
                                            oFruitGroup.Variety + ")";
                                    aFilterStringArray.push(sVariety);
                                }

                                // Class
                                if (oFruitGroup.Class) {
                                    var sClass = oController._getCustomDataForKey(oFruitGroupInput, "classLabel").getValue() + " (" +
                                            oFruitGroup.Class + ")";
                                    aFilterStringArray.push(sClass);
                                }

                                // Growing method
                                if (oFruitGroup.GrowingMethod) {
                                    var sGrowingMethod = oController._getCustomDataForKey(oFruitGroupInput, "growingMethodLabel").getValue() + " (" +
                                            oFruitGroup.GrowingMethod + ")";
                                    aFilterStringArray.push(sGrowingMethod);
                                }
                            }

                            // Load From date
                            var oLoadFromDate = this.byId("searchLoadFromDateInput");
                            if (oLoadFromDate.getValue()) {
                                var sLoadFromDate = oController._getCustomDataForKey(oLoadFromDate, "label").getValue() + " (" +
                                        oLoadFromDate.getValue() + ")";
                                aFilterStringArray.push(sLoadFromDate);
                            }

                            // Load To date
                            var oLoadToDate = this.byId("searchLoadToDateInput");
                            if (oLoadToDate.getValue()) {
                                var sLoadToDate = oController._getCustomDataForKey(oLoadToDate, "label").getValue() + " (" + oLoadToDate.getValue() +
                                        ")";
                                aFilterStringArray.push(sLoadToDate);
                            }

                            // Shortage greater than
                            var oShortageGreaterthan = this.byId("searchShortageGreaterThan");
                            if (oShortageGreaterthan.getValue()) {
                                var sShortageGreaterthan = oController._getCustomDataForKey(oShortageGreaterthan, "label").getValue() + " (" +
                                        oShortageGreaterthan.getValue() + ")";
                                aFilterStringArray.push(sShortageGreaterthan);
                            }

                            // Surplus greater than
                            var oSurplusGreaterthan = this.byId("searchSurplusGreaterThan");
                            if (oSurplusGreaterthan.getValue()) {
                                var sSurplusGreaterthan = oController._getCustomDataForKey(oSurplusGreaterthan, "label").getValue() + " (" +
                                        oSurplusGreaterthan.getValue() + ")";
                                aFilterStringArray.push(sSurplusGreaterthan);
                            }

                            // Show Demand Lines
                            var oShowDemandLinesCheckbox = this.byId("showDemandLinesChekBox");
                            var sShowDemandLines = "";
                            if (oShowDemandLinesCheckbox.getSelected()) {
                                sShowDemandLines = com.zespri.awct.util.I18NHelper.getText("TXT_GENERIC_YES");
                            } else {
                                sShowDemandLines = com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_SEARCH_FORM_SHOW_DEMAND_LINES_NO");
                            }

                            var sShowDemandLinesText = oController._getCustomDataForKey(oShowDemandLinesCheckbox, "label").getValue() + " (" +
                                    sShowDemandLines + ")";
                            aFilterStringArray.push(sShowDemandLinesText);

                            return aFilterStringArray.join(", ");
                        },

                        /**
                         * This method is called for binding the corresponding values to the table select dialog
                         * 
                         * @memberOf com.zespri.awct.collab.view.SearchForm
                         * @param {Object}
                         *            oSearchField The search field for which the binding has to be done
                         */
                        bindTableSelectDialog : function(oSearchField) {

                            var oView = this.getView();
                            var oController = this;
                            var sCompleteFilterKey = oController._getCustomDataForKey(oSearchField, "completeFilterKey").getValue();
                            var sBindingPathForItems = oController._getCustomDataForKey(oSearchField, "entitySet").getValue();
                            var sListItemRelativeBindingPath = oController._getCustomDataForKey(oSearchField, "filterKey").getValue();
                            var sFilter = oController._getCustomDataForKey(oSearchField, "filter").getValue();

                            sap.ui.core.Fragment.byId("searchFormDialog", "searchFieldLabel").setText(
                                    com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_SEARCH_FORM_VALUE_HELP_DIALOG_ALL_LABEL"));

                            // Success method for getJSONModelForRead call
                            var fnSuccess = function(oJSON) {

                                // Set growing threshold to the number of results so that preselection can be done
                                oController._oSearchHelpDialog.setGrowingThreshold(oJSON.getData().results.length);

                                oController._oSearchHelpDialog.setModel(oJSON);

                                // Create the binding for items to the table select dialog
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

                                oController._oSearchHelpDialog.bindItems(oBindingInfo);

                                // Preselect the values that the user had selected when the dialog was opened the previous time
                                // 1. Read the value in the textbox
                                // 2. Loop through the items bound to the dialog box
                                // 3. If the values are same, set it as selected
                                var aSearchFieldValue = oSearchField.getValue().split(', ');

                                // Value from textbox
                                for ( var i = 0; i < aSearchFieldValue.length; i++) {
                                    // Items in dialog box
                                    for ( var j = 0; j < oController._oSearchHelpDialog.getItems().length; j++) {
                                        // Prevent selection of blank rows
                                        if (aSearchFieldValue[i] &&
                                                (aSearchFieldValue[i] === oController._oSearchHelpDialog.getItems()[j].getCells()[0].getText())) {
                                            oController._oSearchHelpDialog.getItems()[j].setSelected(true);
                                        }
                                    }
                                }
                                oController._oSearchHelpDialog._dialog.setBusy(false);

                            };

                            // destroy items before opening
                            this._oSearchHelpDialog.destroyItems();

                            // Event handler for backend read has been defined now.
                            // Trigger the read. On success, the fnSuccess method is called
                            this._oSearchHelpDialog.open();

                            this._oSearchHelpDialog._dialog.setBusy(true);
                            this._oSearchHelpDialog._dialog.setBusyIndicatorDelay(0);

                            // For dependent fields, set the filter separately. For other fields, filter gets set in the default case.
                            switch (sCompleteFilterKey) {
                                // Supplier ID is filtered based on the current user
                                case "SupplierID" :
                                    var sUserID = oView.getModel("currentUserDetails").getProperty("/UserID");

                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead(sBindingPathForItems, {
                                        urlParameters : {
                                            "$select" : "SupplierID",
                                            "$filter" : "UserID eq '" + sUserID + "'"
                                        }
                                    }, fnSuccess, function(oError) {
                                        // Error
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        oController._oSearchHelpDialog._dialog.setBusy(false);
                                        oController._oSearchHelpDialog._dialog.close();
                                    });
                                    break;

                                // ShipmentID is filtered based on the current season
                                case "ShipmentID" :
                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead(sBindingPathForItems, {
                                        urlParameters : {
                                            "$select" : sListItemRelativeBindingPath,
                                            "$filter" : "Season eq '" + sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason +
                                                    "'"
                                        }
                                    }, fnSuccess, function(oError) {
                                        // Error
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        oController._oSearchHelpDialog._dialog.setBusy(false);
                                        oController._oSearchHelpDialog._dialog.close();
                                    });
                                    break;

                                // Shipment Names and Shipment Types are retrieved from a function import
                                case "ShipmentName" :
                                case "ShipmentType" :
                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead(sBindingPathForItems, {
                                        urlParameters : {
                                            "Season" : "'" + sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason + "'"
                                        }
                                    }, fnSuccess, function(oError) {
                                        // Error
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        oController._oSearchHelpDialog._dialog.setBusy(false);
                                        oController._oSearchHelpDialog._dialog.close();
                                    });
                                    break;

                                // Destination port depends on the ShipmentIDs
                                case "DestinationPort" :
                                    var oShipmentInput = oView.byId("shipmentIDInput");
                                    var aShipmentId = [];
                                    if (oController._getCustomDataForKey(oShipmentInput, "filterValue")) {
                                        aShipmentId = oController._getCustomDataForKey(oShipmentInput, "filterValue").getValue();
                                    }

                                    var sPortFilter = "PortType eq 'D'";
                                    // If multiple Shipment IDs are selected, combine them using OR
                                    if (aShipmentId.length === 1) {
                                        sPortFilter = sPortFilter + " and ShipmentID eq '" + aShipmentId[0] + "'";
                                    } else if (aShipmentId.length > 1) {
                                        var aDestinationFilterString = [];
                                        for ( var i = 0; i < aShipmentId.length; i++) {
                                            aDestinationFilterString[i] = "ShipmentID eq '" + aShipmentId[i] + "'";
                                        }
                                        sPortFilter = sPortFilter + " and (" + aDestinationFilterString.join(" or ") + ")";
                                    }
                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead(sBindingPathForItems, {
                                        urlParameters : {
                                            "$select" : sListItemRelativeBindingPath,
                                            "$filter" : sPortFilter
                                        }
                                    }, fnSuccess, function(oError) {
                                        // Error
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        oController._oSearchHelpDialog._dialog.setBusy(false);
                                        oController._oSearchHelpDialog._dialog.close();
                                    });
                                    break;

                                // Delivery number depends on the ShipmentID
                                case "DeliveryID" :
                                    var oShipmentValueHelp = oView.byId("shipmentIDInput");
                                    var aShipmentIdValues = [];
                                    if (oController._getCustomDataForKey(oShipmentValueHelp, "filterValue")) {
                                        aShipmentIdValues = oController._getCustomDataForKey(oShipmentValueHelp, "filterValue").getValue();
                                    }

                                    var sDeliveryFilter = "";
                                    if (aShipmentIdValues.length === 1) {
                                        sDeliveryFilter = "ShipmentID eq '" + aShipmentIdValues[0] + "'";
                                    } else if (aShipmentIdValues.length > 1) {
                                        aDeliveryFilterString = [];
                                        for ( var iShipmentIDIterator = 0; iShipmentIDIterator < aShipmentIdValues.length; iShipmentIDIterator++) {
                                            aDeliveryFilterString[iShipmentIDIterator] = "ShipmentID eq '" + aShipmentIdValues[iShipmentIDIterator] +
                                                    "'";
                                        }
                                        sDeliveryFilter = sDeliveryFilter + " and (" + aDeliveryFilterString.join(" or ") + ")";
                                    }
                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead(sBindingPathForItems, {
                                        urlParameters : {
                                            "$select" : sListItemRelativeBindingPath,
                                            "$filter" : sDeliveryFilter
                                        }
                                    }, fnSuccess, function(oError) {
                                        // Error
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        oController._oSearchHelpDialog._dialog.setBusy(false);
                                        oController._oSearchHelpDialog._dialog.close();
                                    });
                                    break;
                                case "ContainerID" :

                                    var aShipmentIDs = [];
                                    var oShipmentIDInput = oView.byId("shipmentIDInput");
                                    var aDestinationPorts = [];
                                    var oDestinationPortInput = oView.byId("destinationPortInput");
                                    var aDeliveryNumbers = [];
                                    var oDeliveryNumberInput = oView.byId("deliveryNumberInput");
                                    var sFilterString = "";
                                    var aFilterString = [];

                                    if (oController._getCustomDataForKey(oShipmentIDInput, "filterValue")) {
                                        aShipmentIDs = oController._getCustomDataForKey(oShipmentIDInput, "filterValue").getValue();
                                    }
                                    if (oController._getCustomDataForKey(oDestinationPortInput, "filterValue")) {
                                        aDestinationPorts = oController._getCustomDataForKey(oDestinationPortInput, "filterValue").getValue();
                                    }
                                    if (oController._getCustomDataForKey(oDeliveryNumberInput, "filterValue")) {
                                        aDeliveryNumbers = oController._getCustomDataForKey(oDeliveryNumberInput, "filterValue").getValue();
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
                                        aFilterString.push(sShipmentFilterString);
                                    }

                                    // If a Destination Port is selected, add it to the filter
                                    if (oController._getCustomDataForKey(oDestinationPortInput, "filterValue")) {
                                        var sDestinationPortString = "";
                                        // If there are multiple Destination ports, combine them by OR
                                        if (aDestinationPorts.length === 1) {
                                            sDestinationPortString = "PortID eq '" + aDestinationPorts[0] + "'";
                                        } else if (aDestinationPorts.length > 1) {
                                            var aMultipleDestinationPortsString = [];
                                            for ( var iDestinationPortIndex = 0; iDestinationPortIndex < aDestinationPorts.length; iDestinationPortIndex++) {
                                                aMultipleDestinationPortsString.push("PortID eq '" + aDestinationPorts[iDestinationPortIndex] + "'");
                                            }
                                            sDestinationPortString = "(" + aMultipleDestinationPortsString.join(" or ") + ")";
                                        }
                                        aFilterString.push(sDestinationPortString);
                                    }

                                    // If a Delivery number is selected, add it to the filter
                                    if (oController._getCustomDataForKey(oDeliveryNumberInput, "filterValue")) {
                                        var sDeliveryNumberString = "";
                                        // If there are multiple delivery numbers, combine them by OR
                                        if (aDeliveryNumbers.length === 1) {
                                            sDeliveryNumberString = "DeliveryID eq '" + aDeliveryNumbers[0] + "'";
                                        } else if (aDeliveryNumbers.length > 1) {
                                            var aMultipleDeliveryNumbersString = [];
                                            for ( var iDeliveryNumberIndex = 0; iDeliveryNumberIndex < aDeliveryNumbers.length; iDeliveryNumberIndex++) {
                                                aMultipleDeliveryNumbersString.push("DeliveryID eq '" + aDeliveryNumbers[iDeliveryNumberIndex] + "'");
                                            }
                                            sDeliveryNumberString = "(" + aMultipleDeliveryNumberString.join(" or ") + ")";
                                        }
                                        aFilterString.push(sDeliveryNumberString);
                                    }

                                    // Combine all the filters by AND
                                    sFilterString = aFilterString.join(" and ");

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
                                default :
                                    var sDefaultFilterString = "";
                                    if (sFilter) {
                                        var oFilterObject = JSON.parse(sFilter);
                                        sDefaultFilterString = oFilterObject.path + " " + oFilterObject.operator + " '" + oFilterObject.value1 + "'";
                                    }
                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead(sBindingPathForItems, {
                                        urlParameters : {

                                            "$filter" : sDefaultFilterString
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
                         * This method is called when the search help button of any of the input fields in the search form is pressed.
                         * 
                         * @memberOf com.zespri.awct.collab.view.SearchForm
                         * @param {sap.ui.base.Event}
                         *            oEvent The Event object
                         */
                        handleValueHelpPress : function(oEvent) {

                            this._oSearchInputField = oEvent.getSource();

                            // create value help dialog only once
                            if (!this._oSearchHelpDialog) {
                                this._oSearchHelpDialog = new sap.ui.xmlfragment("searchFormDialog",
                                        "com.zespri.awct.collab.fragment.SearchFieldSelectionDialog", this);
                                this.getView().addDependent(this._oSearchHelpDialog);
                            }

                            // Open the dialog
                            this._oSearchHelpDialog.setTitle(this._getCustomDataForKey(this._oSearchInputField, "label").getValue());

                            // No data text
                            com.zespri.awct.util.CommonHelper.manageNoDataText(this._oSearchHelpDialog._table);

                            // Set appropriate binding to the table select dialog
                            this.bindTableSelectDialog(this._oSearchInputField);
                        },

                        /**
                         * This method is called when the search button is pressed in the table select dialog fragment
                         * 
                         * @memberOf com.zespri.awct.collab.view.SearchForm
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
                         * @memberOf com.zespri.awct.collab.view.SearchForm
                         * @param {sap.ui.base.Event}
                         *            oEvent The Event object
                         */
                        handleValueHelpDialogOKPress : function(oEvent) {

                            var sFilterKey = this._getCustomDataForKey(this._oSearchInputField, "filterKey").getValue();

                            // List of selected items
                            var aContexts = oEvent.getParameter("selectedContexts");

                            // Array of selected values from the list of items
                            var aSelectedValues = aContexts.map(function(oContext) {
                                return oContext.getProperty(sFilterKey);
                            });

                            // Set the value for the textbox
                            this._oSearchInputField.setValue(aSelectedValues.join(", "));

                            // Remove previously added custom data
                            if (this._getCustomDataForKey(this._oSearchInputField, "filterValue")) {
                                this._oSearchInputField.removeCustomData(this._getCustomDataForKey(this._oSearchInputField, "filterValue"));
                            }
                            // If a new item is selected, add new custom data
                            if (aSelectedValues.length > 0) {
                                this._oSearchInputField.addCustomData(new sap.ui.core.CustomData({
                                    "key" : "filterValue",
                                    "value" : aSelectedValues
                                }));
                            }

                            var oDestinationPortInput = this.getView().byId("destinationPortInput");
                            var oDeliveryNumberInput = this.getView().byId("deliveryNumberInput");
                            var oContainerIDInput = this.getView().byId("containerIDInput");

                            // Clear dependent fields
                            // When shipmentID is changed, destination port, delivery number and container id fields are cleared
                            // Remove the custom data values as well
                            if (this._oSearchInputField.getId() === this.createId("shipmentIDInput")) {

                                oDestinationPortInput.setValue("");
                                if (this._getCustomDataForKey(oDestinationPortInput, "filterValue")) {
                                    oDestinationPortInput.removeCustomData(this._getCustomDataForKey(oDestinationPortInput, "filterValue"));
                                }

                                oDeliveryNumberInput.setValue("");
                                if (this._getCustomDataForKey(oDeliveryNumberInput, "filterValue")) {
                                    oDeliveryNumberInput.removeCustomData(this._getCustomDataForKey(oDeliveryNumberInput, "filterValue"));
                                }

                                oContainerIDInput.setValue("");
                                if (this._getCustomDataForKey(oContainerIDInput, "filterValue")) {
                                    oContainerIDInput.removeCustomData(this._getCustomDataForKey(oContainerIDInput, "filterValue"));
                                }

                            }
                            // When delivery number is changed, container id field is cleared
                            else if (this._oSearchInputField.getId() === this.createId("deliveryNumberInput")) {
                                oContainerIDInput.setValue("");
                                if (this._getCustomDataForKey(oContainerIDInput, "filterValue")) {
                                    oContainerIDInput.removeCustomData(this._getCustomDataForKey(oContainerIDInput, "filterValue"));
                                }
                            }
                            // When destination port is changed, container id field is cleared
                            else if (this._oSearchInputField.getId() === this.createId("destinationPortInput")) {
                                oContainerIDInput.setValue("");
                                if (this._getCustomDataForKey(oContainerIDInput, "filterValue")) {
                                    oContainerIDInput.removeCustomData(this._getCustomDataForKey(oContainerIDInput, "filterValue"));
                                }
                            }
                        },

                        /**
                         * This method is called when the value of the number fields in the search form is changed.
                         * 
                         * @memberOf com.zespri.awct.collab.view.SearchForm
                         * @param {sap.ui.base.Event}
                         *            oEvent The Event object
                         */
                        handleNumberInputValueChanged : function(oEvent) {

                            this._oSearchInputField = oEvent.getSource();
                            this._oSearchInputField.setValueState(sap.ui.core.ValueState.None);

                            // Remove custom data for the field
                            if (this._getCustomDataForKey(this._oSearchInputField, "filterValue")) {
                                this._oSearchInputField.removeCustomData(this._getCustomDataForKey(this._oSearchInputField, "filterValue"));
                            }

                            // Check if the field is not blank
                            if (this._oSearchInputField.getValue()) {

                                var sInputValue = this._oSearchInputField.getValue();

                                // Check if value is integer or not
                                if (!isNaN(sInputValue) && (Math.round(sInputValue) === parseFloat(sInputValue))) {
                                    // integer
                                    this._oSearchInputField.addCustomData(new sap.ui.core.CustomData({
                                        "key" : "filterValue",
                                        "value" : [parseInt(this._oSearchInputField.getValue(), 10)]
                                    }));
                                } else {
                                    // float or non-numeric string (error)
                                    this._oSearchInputField.setValueState(sap.ui.core.ValueState.Error);
                                    this._oSearchInputField.setValueStateText(com.zespri.awct.util.I18NHelper
                                            .getText("TXT_COLLABORATION_SEARCH_FORM_INPUT_VALUE_STATE_TEXT"));
                                }

                            }

                        },
                        /**
                         * This method converts a YYYYMMDD string into its corresponding Edm.DateTime representation. (e.g datetime'2000-12-25T12:00')
                         * 
                         * @private
                         * 
                         * @memberOf com.zespri.awct.collab.view.SearchForm
                         * @param {String}
                         *            sDateValue contains the date in yyyymmdd format
                         */
                        _getExternalFormatValue : function(sDateValue) {
                            var sYear = sDateValue.substring(0, 4);
                            var sMonth = sDateValue.substring(4, 6);
                            var sDate = sDateValue.substring(6, 8);
                            return sYear + "-" + sMonth + "-" + sDate;
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
                         * @memberOf com.zespri.awct.collab.view.SearchView
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
                         * @private
                         * @memberOf com.zespri.awct.collab.view.SearchView
                         */
                        _applyFilter : function() {
                            var aSearchFilter = [];
                            var i = 0;

                            // Remove error value state for fruit group input
                            this.byId("fruitGroupInput").setValueState(sap.ui.core.ValueState.None);

                            // If any of the numeric fields have an error state, display an error toast
                            if ((this.getView().byId("daysFromLoadInput").getValueState() !== "None") ||
                                    (this.getView().byId("searchShortageGreaterThan").getValueState() !== "None") ||
                                    (this.getView().byId("searchSurplusGreaterThan").getValueState() !== "None")) {

                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_COLLABORATION_SEARCH_FORM_TOAST_FILTER_ERROR_MESSAGE"));
                            } else {

                                // Loop through all search fields
                                while (i < this._aSearchInputIDs.length) {

                                    var oSearchField = this.getView().byId(this._aSearchInputIDs[i]);
                                    var aFilter = [];

                                    // Get FilterKey
                                    var sFilterKey = this._getCustomDataForKey(oSearchField, "completeFilterKey").getValue();

                                    if (this._getCustomDataForKey(oSearchField, "filterValue")) {
                                        // Get Filter values
                                        var aCustomData = this._getCustomDataForKey(oSearchField, "filterValue").getValue();

                                        for ( var iCustomData in aCustomData) {
                                            var oFilter = new sap.ui.model.Filter(sFilterKey, "EQ", aCustomData[iCustomData]);
                                            aFilter.push(oFilter);
                                        }
                                        // OR for filtering values for same filter
                                        var oEachFilter = new sap.ui.model.Filter(aFilter, false);
                                        aSearchFilter.push(oEachFilter);
                                    }
                                    i = i + 1;
                                }

                                // FruitGroup
                                var oFruitGroupInput = this.byId("fruitGroupInput");

                                if (oFruitGroupInput.getValue()) {

                                    var oFruitGroup = this._parseFruitGroupString(oFruitGroupInput.getValue());

                                    if (oFruitGroup.Variety) {
                                        var oVarietyFilter = new sap.ui.model.Filter("Characteristic/Variety", "EQ", oFruitGroup.Variety);
                                        aSearchFilter.push(oVarietyFilter);
                                    }

                                    if (oFruitGroup.Class) {
                                        var oClassFilter = new sap.ui.model.Filter("Characteristic/Class", "EQ", oFruitGroup.Class);
                                        aSearchFilter.push(oClassFilter);
                                    }

                                    if (oFruitGroup.GrowingMethod) {
                                        var oGrowingMethodFilter = new sap.ui.model.Filter("Characteristic/GrowingMethod", "EQ",
                                                oFruitGroup.GrowingMethod);
                                        aSearchFilter.push(oGrowingMethodFilter);
                                    }
                                }

                                // Shortage greater than
                                var oShortageGreaterThan = this.getView().byId("searchShortageGreaterThan");
                                if (oShortageGreaterThan.getValue()) {
                                    var oShortageGreaterThanFilter = new sap.ui.model.Filter(this._getCustomDataForKey(oShortageGreaterThan,
                                            "completeFilterKey").getValue(), "GT", oShortageGreaterThan.getValue());
                                    aSearchFilter.push(oShortageGreaterThanFilter);
                                }

                                // Surplus greater than
                                var oSurplusGreaterThan = this.getView().byId("searchSurplusGreaterThan");
                                if (oSurplusGreaterThan.getValue()) {
                                        var oSurplusGreaterThanFilter = new sap.ui.model.Filter(this._getCustomDataForKey(oSurplusGreaterThan,
                                                "completeFilterKey").getValue(), "GT", oSurplusGreaterThan.getValue());
                                        aSearchFilter.push(oSurplusGreaterThanFilter);
                                }

                                // Load From date
                                var oLoadFromDate = this.getView().byId("searchLoadFromDateInput");
                                if (oLoadFromDate.getValue()) {

                                    // Code change made for datepicker added a function '_getExternalFormatValue' which will return the date in
                                    // DateTime
                                    // yyyy-MM-dd format
                                    var oDateFilter1 = new sap.ui.model.Filter(this._getCustomDataForKey(oLoadFromDate, "completeFilterKey")
                                            .getValue(), "EQ", this._getExternalFormatValue(oLoadFromDate.getYyyymmdd()));
                                    aSearchFilter.push(oDateFilter1);
                                }

                                // Load To date
                                var oLoadToDate = this.getView().byId("searchLoadToDateInput");
                                if (oLoadToDate.getValue()) {

                                    // Code change made for datepicker added a function '_getExternalFormatValue' which will return the date in
                                    // DateTime
                                    // yyyy-MM-dd format
                                    var oDateFilter2 = new sap.ui.model.Filter(
                                            this._getCustomDataForKey(oLoadToDate, "completeFilterKey").getValue(), "EQ", this
                                                    ._getExternalFormatValue(oLoadToDate.getYyyymmdd()));
                                    aSearchFilter.push(oDateFilter2);
                                }

                                // Show demand lines
                                var oShowDemandLines = this.getView().byId("showDemandLinesChekBox");

                                var oShowDemandLinesFilter;
                                if (!oShowDemandLines.getSelected()) {
                                    var oAllocationRecordTypeFilter = new sap.ui.model.Filter("RecordType", "EQ", "A");
                                    oShowDemandLinesFilter = oAllocationRecordTypeFilter;
                                    aSearchFilter.push(oShowDemandLinesFilter);
                                }
                                // AND for filtering from all filters
                                var oCompleteFilter = new sap.ui.model.Filter(aSearchFilter, true);

                                // If there are no filters to apply, we pass null. A filter object with no filters will result in an invalid
                                // "$filter=()"
                                if (!oCompleteFilter.aFilters.length) {
                                    oCompleteFilter = null;
                                }

                                // Create concatenated Filter string
                                var sFilterString = com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_SUPPLIERORDERS_FILTER_TOOLBAR_TEXT") +
                                        this._getFilterString();

                                // Create download filter string
                                var sDownloadFilterString = this._getDownloadFilterString();

                                // Send filter to supplier orders screen
                                this.getRouter().navTo("Collaboration/SupplierOrders", {
                                    customData : {
                                        searchFormFilterObject : oCompleteFilter,
                                        searchFormFilterString : sFilterString,
                                        downloadFilterString : sDownloadFilterString
                                    }
                                });
                            }
                        },

                        /**
                         * This method is called when the reset button is pressed in the search form
                         * 
                         * @memberOf com.zespri.awct.collab.view.SearchForm
                         */
                        handleFilterResetPress : function() {

                            var oView = this.getView();
                            jQuery.each(this._aSearchInputIDs, function(i, eachId) {
                                var oSearchField = oView.byId(eachId);
                                oSearchField.setValue("");

                                if (oView.getController()._getCustomDataForKey(oSearchField, "filterValue")) {
                                    oSearchField.removeCustomData(oView.getController()._getCustomDataForKey(oSearchField, "filterValue"));
                                }
                            });

                            // Clear Fruit group field
                            this.byId("fruitGroupInput").setValue("");
                            // Clear Shortage greater than field
                            this.byId("searchShortageGreaterThan").setValue("");
                            // Clear Surplus greater than field
                            this.byId("searchSurplusGreaterThan").setValue("");
                            // Clear Load From date field
                            this.byId("searchLoadFromDateInput").setValue("");
                            // Clear Load To date field
                            this.byId("searchLoadToDateInput").setValue("");
                            // Select the show demand lines checkbox
                            this.byId("showDemandLinesChekBox").setSelected(true);

                        },

                        /**
                         * This is a private method to parse the fruit group string and returns an object for variety, class and growing method
                         * 
                         * @private
                         * @param {String}
                         *            sFruitGroup Fruit group string
                         * @memberOf com.zespri.awct.collab.view.SearchForm
                         */
                        _parseFruitGroupString : function(sFruitGroup) {
                            // Variety
                            var sVariety = sFruitGroup.substring(0, 2).toUpperCase();
                            if (!sVariety) {
                                sVariety = null;
                            }

                            // Class
                            var sClass = sFruitGroup.substring(2, 3).toUpperCase();
                            if (!sClass) {
                                sClass = null;
                            }

                            // Growing method
                            var sGrowingMethod = sFruitGroup.substring(3, 5).toUpperCase();
                            if (!sGrowingMethod) {
                                sGrowingMethod = null;
                            }

                            var oFruitGroup = {};
                            oFruitGroup.Variety = sVariety;
                            oFruitGroup.Class = sClass;
                            oFruitGroup.GrowingMethod = sGrowingMethod;

                            return oFruitGroup;
                        },

                        /**
                         * This method returns a string from the selected fields which is used when downloading from the track orders view
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.SearchForm
                         * 
                         * @returns {String} Filter string for download
                         */
                        _getDownloadFilterString : function() {
                            var i = 0;
                            var aDownloadSearchFilter = [];
                            var oFromDate = this.getView().byId("searchLoadFromDateInput");
                            var oToDate = this.getView().byId("searchLoadToDateInput");
                            var oFruitGroupInput = this.byId("fruitGroupInput");
                            var oShortageGreaterThan = this.byId("searchShortageGreaterThan");
                            var oSurplusGreaterThan = this.byId("searchSurplusGreaterThan");
                            var oShowDemandLines = this.getView().byId("showDemandLinesChekBox");

                            // Loop through all search fields
                            while (i < this._aSearchInputIDs.length) {

                                var oSearchField = this.getView().byId(this._aSearchInputIDs[i]);
                                var aFilter = [];

                                // Get FilterKey
                                var sFilterKeyString = "";
                                if (this._getCustomDataForKey(oSearchField, "completeFilterKey")) {
                                    sFilterKeyString = this._getCustomDataForKey(oSearchField, "completeFilterKey").getValue();
                                }

                                if (this._getCustomDataForKey(oSearchField, "filterValue")) {
                                    // Get Filter values
                                    var aCustomDataArray = this._getCustomDataForKey(oSearchField, "filterValue").getValue();

                                    for ( var iCustomDataIndex in aCustomDataArray) {
                                        var oFilter;
                                        if (sFilterKeyString === "DaysFromLoad") {
                                            oFilter = sFilterKeyString + " eq " + aCustomDataArray[iCustomDataIndex];
                                        } else {
                                            oFilter = sFilterKeyString + " eq '" + aCustomDataArray[iCustomDataIndex] + "'";
                                        }
                                        aFilter.push(oFilter);
                                    }
                                    // OR for filtering values for same filter
                                    var oEachFilter = "(" + aFilter.join(" or ") + ")";
                                    aDownloadSearchFilter.push(oEachFilter);
                                }
                                i = i + 1;
                            }

                            // FruitGroup
                            if (oFruitGroupInput.getValue()) {

                                var oFruitGroup = this._parseFruitGroupString(oFruitGroupInput.getValue());

                                if (oFruitGroup.Variety) {
                                    var oVarietyFilter = "(Characteristic/Variety eq '" + oFruitGroup.Variety + "')";
                                    aDownloadSearchFilter.push(oVarietyFilter);
                                }

                                if (oFruitGroup.Class) {
                                    var oClassFilter = "(Characteristic/Class eq '" + oFruitGroup.Class + "')";
                                    aDownloadSearchFilter.push(oClassFilter);
                                }

                                if (oFruitGroup.GrowingMethod) {
                                    var oGrowingMethodFilter = "(Characteristic/GrowingMethod eq '" + oFruitGroup.GrowingMethod + "')";
                                    aDownloadSearchFilter.push(oGrowingMethodFilter);
                                }
                            }

                            // From date
                            if (oFromDate.getValue()) {
                                var oFromFilter = "(" + this._getCustomDataForKey(oFromDate, "completeFilterKey").getValue() + " eq datetime'" +
                                        this._getExternalFormatValue(oFromDate.getYyyymmdd()) + "T00:00:00')";
                                aDownloadSearchFilter.push(oFromFilter);
                            }

                            // To date
                            if (oToDate.getValue()) {
                                var oToFilter = "(" + this._getCustomDataForKey(oToDate, "completeFilterKey").getValue() + " eq datetime'" +
                                        this._getExternalFormatValue(oToDate.getYyyymmdd()) + "T00:00:00')";
                                aDownloadSearchFilter.push(oToFilter);
                            }

                            // Shortage greater than
                            if (oShortageGreaterThan.getValue()) {
                                var sShortageGreaterThan = "(" + this._getCustomDataForKey(oShortageGreaterThan, "completeFilterKey").getValue() +
                                        " gt " + oShortageGreaterThan.getValue() + ")";
                                aDownloadSearchFilter.push(sShortageGreaterThan);
                            }

                            // Surplus greater than
                            if (oSurplusGreaterThan.getValue()) {
                                var sSurplusGreaterThan = "(" + this._getCustomDataForKey(oSurplusGreaterThan, "completeFilterKey").getValue() +
                                        " gt " + oSurplusGreaterThan.getValue() + ")";
                                aDownloadSearchFilter.push(sSurplusGreaterThan);
                            }

                            // RecordType
                            if (!oShowDemandLines.getSelected()) {
                                var oAllocationRecordTypeFilter = "(RecordType eq '" +
                                        com.zespri.awct.util.Enums.AllocationLineRecordType.SupplierOrderLine + "')";
                                aDownloadSearchFilter.push(oAllocationRecordTypeFilter);
                            }

                            return aDownloadSearchFilter.join(" and ");
                        }
                    });
})();
