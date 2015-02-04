(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });

    jQuery.sap.require("com.zespri.awct.util.CommonFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.CommonHelper");
    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");

    /**
     * @classdesc GenerateReports view is used to download reports based on the selected values / inputs.
     * 
     * @class
     * @name com.zespri.awct.report.view.GenerateReports
     */
    com.zespri.awct.core.Controller
            .extend(
                    "com.zespri.awct.report.view.GenerateReports",
                    /** @lends com.zespri.awct.report.view.GenerateReports */
                    {
                        /**
                         * This method is called when the view is first created.
                         * 
                         * @memberOf com.zespri.awct.report.view.GenerateReports
                         */
                        _FileType : {
                            CSV : "CSV"
                        },
                        _BusinessAction : {
                            DOWNLOAD : "Download"
                        },
                        onInit : function() {
                            /* START of instance member initialization */
                            // Private variable for Search help dialog
                            this._oSearchHelpDialog = null;
                            // Private Instance variable for user authorization
                            this._bUserAuthorized = false;
                            // Private array for Input field IDs
                            this._aSearchInputIDs = ["seasonInput", "shipmentNumberInput", "deliveryNumberInput", "loadPortInput", "supplierInput",
                                    "shipmentNameInput", "shipmentTypeInput", "planRegInput", "destinationCountryInput", "destinationPortInput",
                                    "coolStoreInput", "containerIDInput", "brandInput", "varietyInput", "classInput", "growingMethodInput",
                                    "palletInput", "stackInput", "packStyleInput", "sizeInput", "labelInput"];
                            // Busy dialog
                            this._oBusyDialog = new sap.m.BusyDialog();
                            /* END of instance member initialization */

                            var oController = this;
                            this.getRouter().attachRoutePatternMatched(
                                    function(oEvent) {

                                        if (oEvent.getParameter("name") === "Reports/GenerateReports") {

                                            // Check the current user authorizations
                                            if (!oController._bUserAuthorized) {
                                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                                        .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));
                                                return;
                                            }
                                        }

                                    });

                            this._setCurrentSeasonSelected();

                            this._setViewBusy(true);
                            // read report types
                            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GenericSearchSet", {
                                urlParameters : {
                                    "$filter" : "Scenario eq 'Report'"
                                }
                            }, function(oModel) {
                                oController._setViewBusy(false);
                                var oReportTypeSelect = oController.byId("reportTypeSelect");

                                oReportTypeSelect.setModel(oModel);
                                oReportTypeSelect.bindItems({
                                    path : "/results",
                                    template : oReportTypeSelect.getBindingInfo("items") ? oReportTypeSelect.getBindingInfo("items").template
                                            : oReportTypeSelect.getItems()[0].clone()
                                });

                            }, function(oError) {
                                // Error
                                oController._setViewBusy(false);
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                            });
                        },

                        /**
                         * This method will be called before rendering the View.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.DeliverySwapCreate
                         */
                        onBeforeRendering : function() {
                            // Check User Authorizations
                            if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(null, com.zespri.awct.util.Enums.AuthorizationObject.Reports,
                                    null)) {
                                if (this.byId("generateReportsPage")) {
                                    this.byId("generateReportsPage").destroy();
                                }
                                this._bUserAuthorized = false;
                            } else {
                                this._bUserAuthorized = true;
                            }
                        },
                        /**
                         * This method is invoked after the UI rendering
                         * 
                         * @memberOf com.zespri.awct.report.view.GenerateReports
                         */
                        onAfterRendering : function() {
                            // The Class is added for the calender popup in the date picker. JQuery command is added because the div containing the
                            // popover is
                            // coming directly under the body tag which caused difficulty in assigning the style. To get the dom reference of the div
                            // by
                            // the
                            // class name JQuery is used. JQuery command will listen to the 'focus' event of the date picker. Whenever the date picker
                            // is
                            // focused then the style is applied
                            $(".hasDatepicker").focus(function(oElementInfo) {

                                // Finding the width of the date picker input field. Id is found from the focused element
                                var sInputFieldWidth = $("#" + oElementInfo.currentTarget.id).css("width");
                                var iInputFieldWidth = parseInt(sInputFieldWidth, 10);

                                // Substracting the datepicker width from the input field width
                                var iDatePickerLeft = (iInputFieldWidth - 350);
                                $(".ui-datepicker").css("margin-left", iDatePickerLeft.toString() + "px");
                            });

                        },
                        /**
                         * This method is a helper method that returns the CustomData that matches the value of the key
                         * 
                         * @private
                         * @memberOf com.zespri.awct.report.view.GenerateReports
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
                         * This method is called for binding the corresponding values to the table select dialog
                         * 
                         * @memberOf com.zespri.awct.report.view.GenerateReports
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
                                        // blank results are not selected
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
                                    var sSeasonId = "";
                                    if (oController._getCustomDataForKey(oSeasonInput, "filterValue")) {
                                        sSeasonId = oController._getCustomDataForKey(oSeasonInput, "filterValue").getValue();
                                    }

                                    // By default, if will show shipments for the current season
                                    var sShipmentFilter = "Season eq '" +
                                            sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason + "'";

                                    if (sSeasonId) {
                                        sShipmentFilter = "Season eq '" + sSeasonId + "'";
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

                                // Destination country depends on current season
                                case "DestinationCountry" :
                                    // Shipment types depend on season
                                case "ShipmentType" :
                                    // Shipment Name depends on current season
                                case "ShipName" :

                                    var oSeasonValueInput = oView.byId("seasonInput");
                                    var sSeasonIDForCountry = "";
                                    if (oController._getCustomDataForKey(oSeasonValueInput, "filterValue")) {
                                        sSeasonIDForCountry = oController._getCustomDataForKey(oSeasonValueInput, "filterValue").getValue();
                                    }

                                    if (!sSeasonIDForCountry) {
                                        sSeasonIDForCountry = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;
                                    }
                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead(sBindingPathForItems, {
                                        urlParameters : {
                                            "Season" : "'" + sSeasonIDForCountry + "'"
                                        }
                                    }, fnSuccess, function(oError) {
                                        // Error
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        oController._oSearchHelpDialog._dialog.setBusy(false);
                                        oController._oSearchHelpDialog._dialog.close();
                                    });
                                    break;

                                // Delivery Number and Container ID depends on the selected shipment number
                                case "DeliveryNumber" :
                                case "ContainerID" :
                                    var oShipmentInput = oView.byId("shipmentNumberInput");
                                    var sShipmentIdFilter = "";
                                    var aShipmentIdStrings = [];
                                    var aSelectedShipmentIds = [];
                                    if (oController._getCustomDataForKey(oShipmentInput, "filterValue")) {
                                        aSelectedShipmentIds = oController._getCustomDataForKey(oShipmentInput, "filterValue").getValue();
                                    }

                                    // Loop through all the selected shipments and form a filter string
                                    jQuery.each(aSelectedShipmentIds, function(i, sEachShipmentId) {
                                        aShipmentIdStrings.push("ShipmentID eq '" + sEachShipmentId + "'");
                                    });
                                    sShipmentIdFilter = aShipmentIdStrings.join(" or ");

                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead(sBindingPathForItems, {
                                        urlParameters : {
                                            "$select" : sListItemRelativeBindingPath,
                                            "$filter" : sShipmentIdFilter
                                        }
                                    }, fnSuccess, function(oError) {
                                        // Error
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        oController._oSearchHelpDialog._dialog.setBusy(false);
                                        oController._oSearchHelpDialog._dialog.close();
                                    });
                                    break;

                                // Supplier ID
                                case "Supplier" :

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
                         * This method is called when the search help button of any of the input fields in the search form is pressed.
                         * 
                         * @memberOf com.zespri.awct.report.view.GenerateReports
                         * @param {sap.ui.base.Event}
                         *            oEvent The Event object
                         */
                        handleValueHelpPress : function(oEvent) {

                            this._oSearchInputField = oEvent.getSource();

                            // create value help dialog only once
                            if (!this._oSearchHelpDialog) {
                                this._oSearchHelpDialog = new sap.ui.xmlfragment("ReportsSearchFormDialog",
                                        "com.zespri.awct.report.fragment.SearchFieldSelectionDialog", this);
                                this.getView().addDependent(this._oSearchHelpDialog);
                            }

                            // Get the label for the dialog
                            var sLabel = this._getCustomDataForKey(this._oSearchInputField, "label").getValue();
                            this._oSearchHelpDialog.setTitle(sLabel);

                            sap.ui.core.Fragment.byId("ReportsSearchFormDialog", "searchFieldLabel").setText(
                                    com.zespri.awct.util.I18NHelper.getText("TXT_REPORTS_GENERATE_FORM_VALUE_HELP_DIALOG_ALL_LABEL"));

                            // Make dialog for season as single select
                            if (this._oSearchInputField.getId() === this.createId("seasonInput")) {
                                this._oSearchHelpDialog.setMultiSelect(false);
                                sap.ui.core.Fragment.byId("ReportsSearchFormDialog", "searchFieldLabel").setVisible(false);
                            } else {
                                this._oSearchHelpDialog.setMultiSelect(true);
                                sap.ui.core.Fragment.byId("ReportsSearchFormDialog", "searchFieldLabel").setVisible(true);
                            }

                            // Binding data to the table to be done here
                            this.bindTableSelectDialog(this._oSearchInputField);

                            // No data text
                            com.zespri.awct.util.CommonHelper.manageNoDataText(this._oSearchHelpDialog._table);

                            // Open the dialog
                            this._oSearchHelpDialog.open();
                        },

                        /**
                         * This method is called when the search button is pressed in the table select dialog fragment
                         * 
                         * @memberOf com.zespri.awct.report.view.GenerateReports
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
                         * @memberOf com.zespri.awct.report.view.GenerateReports
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
                            }
                        },
                        /**
                         * This method is called when the filter button is pressed in the search form. This is a wrapper method for the _applyFilterr
                         * method. This is needed, because for mobile devices we need to first remove focus from the DatePicker control (not part of
                         * sap.m) and then apply filters.
                         * 
                         * If this is not done, then the following is observed : Use the date picker... immediately next, click on 'Download as
                         * CSV'... the selected date is not applied.
                         * 
                         * Solution : Remove focus from the form, and then proceed
                         * 
                         * @memberOf com.zespri.awct.report.view.GenerateReports
                         */
                        handleDownLoadPress : function() {
                            if (!jQuery.device.is.desktop) {
                                this._trigerDownload();
                            } else {
                                this.byId("downloadAsCSVButton").focus();
                                window.setTimeout(this._trigerDownload.bind(this), 0);
                            }
                        },

                        /**
                         * Triggers the report download
                         * 
                         * @memberOf com.zespri.awct.report.view.GenerateReports
                         */
                        _trigerDownload : function() {
                            var aSearchFilter = [];
                            var i = 0;
                            var oFromDate = this.getView().byId("fromDateInput");
                            var oToDate = this.getView().byId("toDateInput");
                            var oCLoadFromDate = this.getView().byId("cLoadFromDateInput");
                            var oCLoadToDate = this.getView().byId("cLoadDateInput");
                            var bError = false;

                            // Remove error states
                            oFromDate.setValueState(sap.ui.core.ValueState.None);
                            oToDate.setValueState(sap.ui.core.ValueState.None);
                            oCLoadFromDate.setValueState(sap.ui.core.ValueState.None);
                            oCLoadToDate.setValueState(sap.ui.core.ValueState.None);

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
                                    aSearchFilter.push(oEachFilter);
                                }

                                i = i + 1;
                            }

                            // From date
                            if (oFromDate.getValue()) {
                                var oDateFilter1 = "(" + this._getCustomDataForKey(oFromDate, "filterButtonKey").getValue() + " eq " +
                                        this._getExternalFormatValue(oFromDate.getYyyymmdd()) + ")";
                                aSearchFilter.push(oDateFilter1);
                            }
                            // To date
                            if (oToDate.getValue()) {
                                var oDateFilter2 = "(" + this._getCustomDataForKey(oToDate, "filterButtonKey").getValue() + " eq " +
                                        this._getExternalFormatValue(oToDate.getYyyymmdd()) + ")";
                                aSearchFilter.push(oDateFilter2);
                            }
                            // If From date is after To date
                            if (oFromDate.getValue() && oToDate.getValue()) {
                                if (new Date(oFromDate.getValue()) > new Date(oToDate.getValue())) {
                                    oFromDate.setValueState(sap.ui.core.ValueState.Error);
                                    oToDate.setValueState(sap.ui.core.ValueState.Error);
                                    bError = true;
                                }
                            }

                            // C LoadFrom date
                            if (oCLoadFromDate.getValue()) {
                                var oLoadFromFilter = "(" + this._getCustomDataForKey(oCLoadFromDate, "filterButtonKey").getValue() + " eq " +
                                        this._getExternalFormatValue(oCLoadFromDate.getYyyymmdd()) + ")";
                                aSearchFilter.push(oLoadFromFilter);
                            }

                            // C LoadTo date
                            if (oCLoadToDate.getValue()) {
                                var oLoadToFilter = "(" + this._getCustomDataForKey(oCLoadToDate, "filterButtonKey").getValue() + " eq " +
                                        this._getExternalFormatValue(oCLoadToDate.getYyyymmdd()) + ")";
                                aSearchFilter.push(oLoadToFilter);
                            }

                            // If C LoadFrom date is after CLoadTo date
                            if (oCLoadFromDate.getValue() && oCLoadToDate.getValue()) {
                                if (new Date(oCLoadFromDate.getValue()) > new Date(oCLoadToDate.getValue())) {
                                    oCLoadFromDate.setValueState(sap.ui.core.ValueState.Error);
                                    oCLoadToDate.setValueState(sap.ui.core.ValueState.Error);
                                    bError = true;
                                }
                            }

                            if (bError) {
                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_REPORTS_GENERATE_FORM_DOWNLOAD_ERROR_TOAST_MESSAGE"));
                            } else {

                                var sReportType = this.byId("reportTypeSelect").getSelectedKey();
                                aSearchFilter.push("(ReportCode eq '" + sReportType + "')");

                                var sFilterString = aSearchFilter.join(" and ");

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

                            }
                        },
                        /**
                         * This method is called to select the current season, when no seasons are selected.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.report.view.GenerateReports
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
                         * @memberOf com.zespri.awct.report.view.GenerateReports
                         * @param {String}
                         *            sDateValue contains the date in yyyymmdd format
                         */
                        _getExternalFormatValue : function(sDateValue) {
                            var sYear = sDateValue.substring(0, 4);
                            var sMonth = sDateValue.substring(4, 6);
                            var sDate = sDateValue.substring(6, 8);
                            return "datetime'" + sYear + "-" + sMonth + "-" + sDate + "T00:00:00'";
                        },

                        /**
                         * This method is called when the reset button is pressed in the Reports
                         * 
                         * @memberOf com.zespri.awct.report.view.GenerateReports
                         */
                        handleResetPress : function() {

                            var oView = this.getView();
                            jQuery.each(this._aSearchInputIDs, function(i, eachId) {
                                var oSearchField = oView.byId(eachId);
                                oSearchField.setValue("");
                                if (oView.getController()._getCustomDataForKey(oSearchField, "filterValue")) {
                                    oSearchField.removeCustomData(oView.getController()._getCustomDataForKey(oSearchField, "filterValue"));
                                }
                            });

                            var oSeasonInput = this.byId("seasonInput");
                            // Get the current season
                            var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;
                            // preselect the current season by setting the input field value and adding it to custom data
                            oSeasonInput.setValue(sCurrentSeason);
                            oSeasonInput.addCustomData(new sap.ui.core.CustomData({
                                key : "filterValue",
                                value : [sCurrentSeason]
                            }));

                            // Clear DateFrom field
                            this.byId("fromDateInput").setValue("");
                            // Clear DateTo field
                            this.byId("toDateInput").setValue("");
                            // Clear Load from date field
                            this.byId("cLoadFromDateInput").setValue("");
                            // Clear Load to date field
                            this.byId("cLoadDateInput").setValue();
                        },

                        /**
                         * Helper to set the view to busy. Footer and view need to both be set to 'busy'
                         * 
                         * @private
                         * @memberOf com.zespri.awct.report.view.GenerateReports
                         * @param {Boolean}
                         *            bBusy Indicates whether the view is to be set to busy state
                         */
                        _setViewBusy : function(bBusy) {
                            this.getView().setBusy(bBusy);
                            this.byId("generateReportsPage").getFooter().setBusy(bBusy);
                        }
                    });
})();