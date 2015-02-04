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
    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");

    /**
     * @classdesc This screen allows the user to narrow down on a set of orders using the provided filters, and then download the result set as either
     *            a PDF file or a CSV file.
     * 
     * @class
     * @name com.zespri.awct.collab.view.PrintOrders
     */
    com.zespri.awct.core.Controller.extend("com.zespri.awct.collab.view.PrintOrders", /** @lends com.zespri.awct.collab.view.PrintOrders */
    {

        // Private Enum for File types
        _FileType : {
            PDF : "PDF"
        },
        // Enum for Business Actions
        _BusinessAction : {
            DOWNLOAD : "Download"
        },

        // Enum for Report codes
        _ReportCode : {
            PRINT_ORDER : "ZPRO"
        },
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it
         * is displayed, to bind event handlers and do other one-time initialization.
         * 
         * @memberOf com.zespri.awct.collab.view.PrintOrders
         */
        onInit : function() {
            /* Start of instance member initialization */
            // Private Instance variable for user authorization
            this._bUserAuthorized = false;
            // Private instance variable for search input fields
            this._oSearchInputField = null;
            // Busy dialog
            this._oBusyDialog = new sap.m.BusyDialog();
            /* End of instance member initialization */

            var oController = this;
            this.getRouter().attachRoutePatternMatched(
                    function(oEvent) {
                        // Check if the route is for the TrackOrders view
                        if (oEvent.getParameter("name") === "Collaboration/PrintOrders") {
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
         * @memberOf com.zespri.awct.collab.view.PrintOrders
         */
        onBeforeRendering : function() {
            // Check User Authorizations
            if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration, com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP)) {
                if (this.byId("pagePrintOrders")) {
                    this.byId("pagePrintOrders").destroy();
                }
                this._bUserAuthorized = false;
            } else {
                // If user is authorized
                this._bUserAuthorized = true;
                var oSelectSeason = this.byId("selectSeason");
                var oController = this;

                this._oSearchHelpDialog = null;
                this._oSearchInputField = null;

                // Set view to busy state
                this._setViewBusy(true);

                // Read Season
                com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GenericSearchSet", {
                    urlParameters : {
                        "$filter" : "Scenario eq 'SEASON'"
                    }
                }, function(oModel) {
                    // Success
                    oSelectSeason.setModel(oModel);
                    oSelectSeason.bindItems({
                        path : "/results",
                        template : oSelectSeason.getBindingInfo("items") ? oSelectSeason.getBindingInfo("items").template
                                : oSelectSeason.getItems()[0].clone()
                    });
                    oController._setViewBusy(false);
                }, function(oError) {
                    // Error
                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                    oController._setViewBusy(false);
                });
            }
        },
        /**
         * This method is called when the F4 help is pressed for the search help input fields
         * 
         * @param {sap.ui.base.Event}
         *            oEvent The Event object
         * 
         * @memberOf com.zespri.awct.collab.view.PrintOrders
         */
        handleValueHelpPress : function(oEvent) {
            this._oSearchInputField = oEvent.getSource();

            // create value help dialog only once
            if (!this._oSearchHelpDialog) {
                this._oSearchHelpDialog = new sap.ui.xmlfragment("printOrdersFormDialog",
                        "com.zespri.awct.collab.fragment.SearchFieldSelectionDialog", this);
                this.getView().addDependent(this._oSearchHelpDialog);
            }

            var sLabel = this._getCustomDataForKey(this._oSearchInputField, "label").getValue();
            this._oSearchHelpDialog.setTitle(sLabel);

            sap.ui.core.Fragment.byId("printOrdersFormDialog", "searchFieldLabel").setText(sLabel);

            // Single select
            this._oSearchHelpDialog.setMultiSelect(false);

            // Manage no data text
            com.zespri.awct.util.CommonHelper.manageNoDataText(this._oSearchHelpDialog._table);

            // Set appropriate binding to the table select dialog
            this.bindTableSelectDialog(this._oSearchInputField);

        },

        /**
         * This method is used to bind the list of results to the table select dialog
         * 
         * @param {sap.ui.core.Control}
         *            oSearchField The input field for which the binding has to be done
         * 
         * @memberOf com.zespri.awct.collab.view.PrintOrders
         */
        bindTableSelectDialog : function(oSearchField) {

            var oController = this;
            var sListItemRelativeBindingPath = oController._getCustomDataForKey(oSearchField, "bindingKey").getValue();

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
                var sSearchFieldValue = oSearchField.getValue();

                // Items in dialog box
                for ( var i = 0; i < oController._oSearchHelpDialog.getItems().length; i++) {
                    if (sSearchFieldValue === oController._oSearchHelpDialog.getItems()[i].getCells()[0].getText()) {
                        oController._oSearchHelpDialog.getItems()[i].setSelected(true);
                    }
                }

                oController._oSearchHelpDialog._dialog.setBusy(false);

            };

            var sKey = this._getCustomDataForKey(oSearchField, "valueHelpKey").getValue();

            // destroy items before opening
            this._oSearchHelpDialog.destroyItems();

            // Event handler for backend read has been defined now.
            // Trigger the read. On success, the fnSuccess method is called
            this._oSearchHelpDialog.open();

            this._oSearchHelpDialog._dialog.setBusy(true);
            this._oSearchHelpDialog._dialog.setBusyIndicatorDelay(0);

            switch (sKey) {
                case "ShipmentNumber" :
                    var oSeason = this.byId("selectSeason");
                    com.zespri.awct.util.ModelHelper.getJSONModelForRead("/ShipmentSet", {
                        urlParameters : {
                            "$select" : "ShipmentID",
                            "$filter" : "Season eq '" + oSeason.getSelectedKey() + "'"
                        }
                    }, fnSuccess, function(oError) {
                        // Error
                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                        oController._oSearchHelpDialog._dialog.setBusy(false);
                    });
                    break;
                case "Delivery" :

                    var oShipmentValueHelp = this.byId("selectShipmentNumber");
                    var aShipmentIdValues = [];
                    if (oController._getCustomDataForKey(oShipmentValueHelp, "selectedValue")) {
                        aShipmentIdValues = oController._getCustomDataForKey(oShipmentValueHelp, "selectedValue").getValue();
                    }

                    var sDeliveryFilter = "";
                    if (aShipmentIdValues.length === 1) {
                        sDeliveryFilter = "ShipmentID eq '" + aShipmentIdValues[0] + "'";
                    } else if (aShipmentIdValues.length > 1) {
                        var aDeliveryFilterString = [];
                        for ( var iShipmentIDIterator = 0; iShipmentIDIterator < aShipmentIdValues.length; iShipmentIDIterator++) {
                            aDeliveryFilterString[iShipmentIDIterator] = "ShipmentID eq '" + aShipmentIdValues[iShipmentIDIterator] + "'";
                        }
                        sDeliveryFilter = sDeliveryFilter + " and (" + aDeliveryFilterString.join(" or ") + ")";
                    }
                    com.zespri.awct.util.ModelHelper.getJSONModelForRead("/DeliveryHeaderSet", {
                        urlParameters : {
                            "$select" : "DeliveryHeaderID",
                            "$filter" : sDeliveryFilter
                        }
                    }, fnSuccess, function(oError) {
                        // Error
                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                        oController._oSearchHelpDialog._dialog.setBusy(false);
                    });
                    break;

                default :
                    break;
            }
        },

        /**
         * This method is called when the OK button is pressed in the table select dialog fragment
         * 
         * @memberOf com.zespri.awct.collab.view.PrintOrders
         * @param {sap.ui.base.Event}
         *            oEvent The Event object
         */
        handleValueHelpDialogOKPress : function(oEvent) {
            var oController = this;
            var sFilterKey = this._getCustomDataForKey(this._oSearchInputField, "bindingKey").getValue();

            // List of selected items
            var sSelectedValue = oEvent.getParameter("selectedContexts")[0].getProperty(sFilterKey);

            // Set the value for the textbox
            this._oSearchInputField.setValueState(sap.ui.core.ValueState.None);
            this._oSearchInputField.setValue(sSelectedValue);

            // Remove previously added custom data
            if (this._getCustomDataForKey(this._oSearchInputField, "selectedValue")) {
                this._oSearchInputField.removeCustomData(this._getCustomDataForKey(this._oSearchInputField, "selectedValue"));
            }
            // If a new item is selected, add new custom data
            if (sSelectedValue) {
                this._oSearchInputField.addCustomData(new sap.ui.core.CustomData({
                    "key" : "selectedValue",
                    "value" : [sSelectedValue]
                }));
            }

            // Clear Dependent fields
            var oDeliveryInput = this.byId("selectDelivery");
            var oSelectSupplier = this.byId("selectSupplier");

            // Clear dependent input fields
            if (this._oSearchInputField.getId() === this.createId("selectShipmentNumber")) {
                oDeliveryInput.setValue("");
                if (this._getCustomDataForKey(oDeliveryInput, "selectedValue")) {
                    oDeliveryInput.removeCustomData(this._getCustomDataForKey(oDeliveryInput, "selectedValue"));
                }
            }

            if (this._oSearchInputField.getId() === this.createId("selectDelivery") ||
                    this._oSearchInputField.getId() === this.createId("selectShipmentNumber")) {
                // If delivery Search help is selected
                var sDeliveryID = oDeliveryInput.getValue();
                if (!sDeliveryID) {
                    sDeliveryID = "";
                }
                
                // Get the shipment number , if shipment is selected else pass empty string .
                var sShipmentID = this.byId("selectShipmentNumber").getValue();
                if (!sShipmentID) {
                    sShipmentID = "";
                }

                oController._setViewBusy(true);

                // Read Supplier
                com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GetSuppliersForPrintOrder", {
                    urlParameters : {
                        "DeliveryID" : "'" + sDeliveryID + "'",
                        "ShipmentID" : "'" + sShipmentID + "'"
                    }
                }, function(oJSONModel) {
                    // Success
                    oSelectSupplier.setModel(oJSONModel);
                    oSelectSupplier.bindItems({
                        path : "/results",
                        factory : function(sId, oContext) {
                            var sText = oContext.getProperty("Supplier");
                            return new sap.ui.core.Item({
                                key : sText,
                                text : sText
                            });
                        }
                    });

                    // Enable the select Field
                    oSelectSupplier.setEnabled(true);
                    oController._setViewBusy(false);
                }, function(oError) {
                    // Error
                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                    oController._setViewBusy(false);
                });
            }
        },

        /**
         * This method is called when the search button is pressed in the table select dialog fragment
         * 
         * @memberOf com.zespri.awct.collab.view.PrintOrders
         * @param {sap.ui.base.Event}
         *            oEvent The Event object
         */
        handleValueHelpDialogSearch : function(oEvent) {

            var sValue = oEvent.getParameter("value");
            var sFilterKey = this._getCustomDataForKey(this._oSearchInputField, "bindingKey").getValue();

            var oFilter = new sap.ui.model.Filter(sFilterKey, sap.ui.model.FilterOperator.Contains, sValue);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },

        /**
         * Private method to get the form data entered by user.
         * 
         * @private
         * @returns {object} oData - form data
         * @memberOf com.zespri.awct.collab.view.PrintOrders
         */
        _getFormData : function() {

            var oData = {};

            // Season
            oData.Season = "'" + this.byId('selectSeason').getSelectedItem().getKey() + "'";

            // Shipment number
            // If custom data has any selected shipment numbers, read from the custom data, else shipment number is blank
            if (this._getCustomDataForKey(this.byId('selectShipmentNumber'), "selectedValue")) {
                oData.ShipmentID = "'" + this._getCustomDataForKey(this.byId('selectShipmentNumber'), "selectedValue").getValue()[0] + "'";
            } else {
                oData.ShipmentID = null;
            }

            // Delivery
            // If custom data has any selected deliveries, read from the custom data, else delivery is blank
            if (this._getCustomDataForKey(this.byId('selectDelivery'), "selectedValue")) {
                oData.DeliveryID = "'" + this._getCustomDataForKey(this.byId('selectDelivery'), "selectedValue").getValue()[0] + "'";
            } else {
                oData.DeliveryID = null;
            }

            // SupplierID
            if (this.byId('selectSupplier').getSelectedItem()) {
                oData.SupplierID = "'" + this.byId('selectSupplier').getSelectedItem().getKey() + "'";
            } else {
                oData.SupplierID = null;
            }

            return oData;
        },
        /**
         * Event Handler called on press of download CSV button.Triggers the download of a CSV file with delivery instructions for the selected
         * supplier, shipment and delivery number.
         * 
         * @memberOf com.zespri.awct.collab.view.PrintOrders
         */
        handleDownloadPress : function() {

            var aSearchFilter = [];
            var aInputFieldIDs = ["selectSeason", "selectShipmentNumber", "selectDelivery", "selectSupplier"];
            var i = 0;
            var bError = false;
            var oDeliveryInput = this.byId("selectDelivery");

            // Read the values selected by the user
            var oData = this._getFormData();

            // Validate Supplier and season - if no suppliers or season are selected, custom data is empty
            // Either Shipment or Delivery Id should be selected and Season is also mandatory
            if (!(oData.ShipmentID || oData.DeliveryID) || (!oData.Season) || (!oData.SupplierID)) {
                bError = true;
            }

            if (bError) {
                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                        .getText("TXT_COLLABORATION_PRINT_ORDERS_DOWNLOAD_ERROR_TOAST_MESSAGE"));
            } else {

                oDeliveryInput.setValueState(sap.ui.core.ValueState.None);

                // Loop through all search fields
                while (i < aInputFieldIDs.length) {

                    var oInputField = this.getView().byId(aInputFieldIDs[i]);
                    var aFilter = [];

                    if (aInputFieldIDs[i] === "selectSupplier" && this.byId('selectSupplier').getSelectedItem()) {
                        var oSupplierFilter = "(Supplier eq '" + this.byId('selectSupplier').getSelectedItem().getKey() + "')";
                        aSearchFilter.push(oSupplierFilter);
                    } else if (aInputFieldIDs[i] === "selectSeason" && this.byId('selectSeason').getSelectedItem()) {
                        var oSeasonFilter = "(Season eq '" + this.byId('selectSeason').getSelectedItem().getKey() + "')";
                        aSearchFilter.push(oSeasonFilter);
                    } else {
                        // Get FilterKey
                        var sFilterKeyString = "";
                        if (this._getCustomDataForKey(oInputField, "downloadKey")) {
                            sFilterKeyString = this._getCustomDataForKey(oInputField, "downloadKey").getValue();
                        }

                        if (this._getCustomDataForKey(oInputField, "selectedValue")) {
                            // Get Filter values
                            var aCustomDataArray = this._getCustomDataForKey(oInputField, "selectedValue").getValue();

                            for ( var iCustomDataIndex in aCustomDataArray) {
                                var oFilter = sFilterKeyString + " eq '" + aCustomDataArray[iCustomDataIndex] + "'";
                                aFilter.push(oFilter);
                            }
                            // OR for filtering values for same filter
                            var oEachFilter = "(" + aFilter.join(" or ") + ")";
                            aSearchFilter.push(oEachFilter);
                        }
                    }

                    i = i + 1;
                }

                aSearchFilter.push("(ReportCode eq '" + this._ReportCode.PRINT_ORDER + "')");

                var sFilterString = aSearchFilter.join(" and ");
                // Set headers
                var oModel = this.getView().getModel();
                oModel.setHeaders({
                    "BusinessAction" : this._BusinessAction.DOWNLOAD,
                    "FileType" : this._FileType.PDF
                });

                // Show busy dialog
                this._oBusyDialog.open();
                var oController = this;
                // Read
                com.zespri.awct.util.ModelHelper.getJSONModelForRead("/ReportSet", {
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
                            .getText("TXT_COLLABORATION_PRINT_ORDERS_STARTING_DOWNLOAD_TOAST_MESSAGE"));

                    // Start download
                    window.location.href = window.location.protocol + "//" + window.location.host +
                            "/sap/opu/odata/sap/Z_AWCT_SRV/FileDownloadSet('" + sFileGuid + "')/$value";

                }, function(oError) {
                    // Error
                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                    oModel.setHeaders(null);
                    oController._oBusyDialog.close();
                });
            }
        },
        /**
         * Event Handler called on press of RFI ALL button.Triggers the generation of Delivery Instruction response files for the selected supplier
         * and all current shipments
         * 
         * @memberOf com.zespri.awct.collab.view.PrintOrders
         */
        handleRFIAllPress : function() {
            // Trigger generation of Delivery Instruction response files for the selected supplier and all current shipments

            // Remove value state for Shipment Number and Delivery
            this.byId("selectDelivery").setValueState(sap.ui.core.ValueState.None);

            // Read the values selected by the user
            var oData = this._getFormData();

            // Pass Delivery, Shipment as blank
            oData.DeliveryID = "''";
            oData.ShipmentID = "''";

            var oController = this;
            this._setViewBusy(true);

            // Call SendRFI function import
            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/SendRFI", {
                urlParameters : oData
            }, function() {
                // Success
                oController._setViewBusy(false);
                com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper
                        .getText("TXT_COLLABORATION_PRINT_ORDERS_RFI_SUCCESS_TOAST_MESSAGE"));

            }, function(oError) {
                // Error
                oController._setViewBusy(false);
                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
            });
        },
        /**
         * Event Handler called on press of RFI button.Triggers the generation of Delivery Instruction response files for the selected supplier,
         * shipment/delivery. If neither a Shipment nor a Delivery Number has been selected, an error is shown.
         * 
         * @memberOf com.zespri.awct.collab.view.PrintOrders
         */
        handleRFIPress : function() {
            /*
             * Triggers the generation of Delivery Instruction response files for the selected supplier, shipment/delivery. If neither a Shipment nor
             * a Delivery Number has been selected, an error is shown.(By default first option in shipment and delivery is selected) If there are no
             * delivery instructions for the supplier for the selected deliveries, an error is shown.
             */
            var bError = false;
            var oDeliveryInput = this.byId("selectDelivery");
            oDeliveryInput.setValueState(sap.ui.core.ValueState.None);

            // Read the values selected by the user
            var oData = this._getFormData();

            if (!oData.ShipmentID) {
                oData.ShipmentID = "''";
            }
            // Validate Supplier and season - if no suppliers or season are selected, custom data is empty
            if (!oData.SupplierID || !oData.Season) {
                bError = true;
            }

            // Validate delivery - if no deliveries are selected, custom data is empty
            if (!oData.DeliveryID) {
                oDeliveryInput.setValueState(sap.ui.core.ValueState.Error);
                oDeliveryInput.setValueStateText(com.zespri.awct.util.I18NHelper
                        .getText("TXT_COLLABORATION_PRINT_ORDERS_DELIVERY_NOT_SELECTED_ERROR_MESSAGE"));
                bError = true;
            }

            // If no errors
            if (!bError) {
                oDeliveryInput.setValueState(sap.ui.core.ValueState.None);

                var oController = this;
                this._setViewBusy(true);

                // Call SendRFI function import
                com.zespri.awct.util.ModelHelper.getJSONModelForRead("/SendRFI", {
                    urlParameters : oData
                }, function() {
                    // Success
                    oController._setViewBusy(false);
                    com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper
                            .getText("TXT_COLLABORATION_PRINT_ORDERS_RFI_SUCCESS_TOAST_MESSAGE"));

                }, function(oError) {
                    // Error
                    oController._setViewBusy(false);
                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                });
            } else {
                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                        .getText("TXT_COLLABORATION_PRINT_ORDERS_DOWNLOAD_ERROR_TOAST_MESSAGE"));
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
         * @returns CustomData that matches the key. If no key is matched, returns ""
         * 
         * @memberOf com.zespri.awct.collab.view.PrintOrders
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
         * Helper to set the view to busy. Footer and view need to both be set to 'busy'
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.PrintOrders
         * @param {Boolean}
         *            bBusy Indicates whether the view is to be set to busy state
         */
        _setViewBusy : function(bBusy) {
            this.getView().setBusy(bBusy);
            if (this.byId("pagePrintOrders").getFooter()) {
                this.byId("pagePrintOrders").getFooter().setBusy(bBusy);
            }
        },
        /**
         * This method will be called when RESET button is clicked in the footer bar . This method will reset the fields to initial state .
         * 
         * @memberOf com.zespri.awct.collab.view.PrintOrders
         */
        handleFilterResetPress : function() {
            // Clear Shipment number & Delivery number
            var oController = this;
            jQuery.each(["selectShipmentNumber", "selectDelivery"], function(i, eachId) {
                var oSearchField = oController.byId(eachId);
                oSearchField.setValue("");

                if (oController._getCustomDataForKey(oController.byId(eachId), "selectedValue")) {
                    oSearchField.removeCustomData(oController._getCustomDataForKey(oController.byId(eachId), "selectedValue"));
                }
            });

            // Supplier Dropdown : Destroy items and disable
            var oSupplier = this.byId("selectSupplier");
            oSupplier.destroyItems();
            oSupplier.setEnabled(false);

            // Set Season Dropdown to first Item
            var oSeason = this.byId("selectSeason");
            oSeason.setSelectedKey(oSeason.getItems()[0]);
        }

    });
})();
