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
    jQuery.sap.require("com.zespri.awct.util.TableRowActionsExtension");
    jQuery.sap.require("sap.ui.commons.layout.HorizontalLayout");

    /**
     * @classdesc The purpose of this page is to allow the Administrator to show the detail of schedule rate and update. This page displays the
     *            schedule lines along with rates and administrator can create schedule lines.
     * 
     * @class
     * @name com.zespri.awct.admin.view.ScheduleRatesDetail
     */
    com.zespri.awct.core.Controller.extend("com.zespri.awct.admin.view.ScheduleRatesDetail", /** @lends com.zespri.awct.admin.view.ScheduleRatesDetail */
    {
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it
         * is displayed, to bind event handlers and do other one-time initialization.
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */

        onInit : function() {
            /* START of instance member initialization */
            // Private instance for Action Sheet
            this._oActionSheet = null;
            // Private variable for schedule rate line Context
            this._oScheduleRateContext = null;
            // Private variable for add new schedule line dialog
            this._oAddScheduleLineDialog = null;
            // Stores the instance of the TableRowActionsExtension for the table
            this._oRowActionsExtension = null;
            // Private instance to store the context path
            this._sContextPath = null;
            // Private Instance variable for user authorization
            this._bUserAuthorized = false;
            /* END of instance member initialization */

            var oController = this;
            var oView = this.getView();
            // Attach the 'TableRowActionsExtension' functionality to the table in this view. This handles the row-level actions that
            // are visible
            var oTable = this.byId("scheduleLineTable");
            // Manage NoData Texts , listen for scheduleLineTable update EVENT
            com.zespri.awct.util.CommonHelper.manageNoDataText(oTable);

            this._oRowActionsExtension = new com.zespri.awct.util.TableRowActionsExtension({
                table : oTable,
                actionsContent : this._getTableRowActionsContent()
            });

            // To make sure the user doesn't accidentally navigate away with unsaved changes...
            this.getRouter().attachOnBeforeNavigationWithUnsavedChanges(this.handleNavigationWithUnsavedChanges, this);

            /*
             * Check the incoming Route. This part is tricky. If the user reached this view from the 'ScheduleRate' view, the details about the
             * current schedule rate record will already be available in the model and oModel.getProperty() is enough to get this information.
             * However, if the user reaches this page by directly pasting the link in the address bar, the model will be empty and .getProperty() will
             * fail. In such a case, we need to read the current schedule rate record from the backend, using the context path available in the URL.
             */
            this.getRouter().attachRoutePatternMatched(
                    function(oEvent) {

                        if (oEvent.getParameter("name") === "Administration/ScheduleRatesDetail") {

                            // Check the current user authorizations
                            if (!oController._bUserAuthorized) {
                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));
                                return;
                            }
                            this._sContextPath = oEvent.getParameter("arguments").contextPath;

                            // disable save button
                            oController.byId('scheduleRateSaveButton').setEnabled(false);

                            // If the current user authorization is Maintain , show add button and footer
                            if (com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Administration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZADM)) {

                                oController.byId('addScheduleRates').setVisible(true);
                                oController.byId('scheduleRateSaveButton').setVisible(true);
                                if (oController.byId('rowActionsButton')) {
                                    oController.byId('rowActionsButton').setVisible(true);
                                }

                                oController.byId('textScheduleName').setEnabled(true);
                                oController.byId('textDeliveryPallet').setEnabled(true);
                            }

                            this._oScheduleRateContext = new sap.ui.model.Context(oView.getModel(), '/' + this._sContextPath);
                            // key value to check whether the schedule rate record is already available in the model when the user navigates from
                            // schedule
                            // screen.
                            var sScheduleRateName = this._oScheduleRateContext.getProperty('ScheduleName');
                            // boolean flag to indicate whether user is reaching screen from direct url
                            var bIsBookmarkUrl = false;

                            if (sScheduleRateName) {
                                oController._setFormData(this._sContextPath, bIsBookmarkUrl);

                            } else {
                                bIsBookmarkUrl = true;
                                oController._setViewBusy(true);
                                // Need to get schedule based rate details from the backend.
                                this._readScheduleDetails(this._sContextPath, bIsBookmarkUrl);
                            }
                        }
                    }, this);

        },
        /**
         * This method will be called before rendering the View.
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        onBeforeRendering : function() {
            // Check User Authorizations
            if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                    com.zespri.awct.util.Enums.AuthorizationObject.Administration, com.zespri.awct.util.Enums.AuthorizationFunctions.ZADM)) {
                if (this.byId("pageScheduleRatesDetail")) {
                    this.byId("pageScheduleRatesDetail").destroy();
                }
                this._bUserAuthorized = false;
            } else {
                this._bUserAuthorized = true;
            }
        },
        /**
         * Returns the control to be used for the 'actionsContent' of the TableRowActionsExtension instance for this controller.
         * 
         * @private
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        _getTableRowActionsContent : function() {
            var oI18NModel = sap.ui.getCore().getRootComponent().getModel("i18n");
            return new sap.ui.commons.layout.HorizontalLayout({
                content : [new sap.m.Button({
                    icon : "sap-icon://sys-minus",
                    tooltip : "{i18n>TXT_ADMIN_SCHEDULE_LINE_ACTION_TOOLTIP_DELETE}",
                    press : [this.handleScheduleLineDelete, this]
                })]
            }).setModel(oI18NModel, "i18n");
        },

        /**
         * This method is called when the delete button is clicked from the action sheet
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        handleScheduleLineDelete : function() {

            var oController = this;
            // model which has data of all the schedule rate records.
            var oModel = sap.ui.getCore().getRootComponent().getModel();

            // Hide the row actions
            this._oRowActionsExtension.hideRowActions();

            // Get Selected row from the schedule line table
            this._oSelectedRowContext = this.getView().byId("scheduleLineTable").getSelectedItem().getBindingContext();

            var sContextPath = this._oSelectedRowContext.getPath();

            // if user has reached the page directly from bookmark url, then prepare context path for delete using json model.
            if (this._oScheduleRateContext.getModel() !== oModel) {
                var sSelectedRowPath = this._oSelectedRowContext.getPath();
                var oSelectedScheduleLine = this._oSelectedRowContext.getObject(sSelectedRowPath);

                var sUri = oSelectedScheduleLine.__metadata.uri;
                var aURISplit = sUri.split("/");
                if (aURISplit.length) {
                    // Get the last string from the split array which will contain the schedule line context
                    sContextPath = '/' + aURISplit[aURISplit.length - 1];
                }
            }

            // Show confirmation dialog to user before proceeding.
            var sConfirmDialogText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_SCHEDULE_LINE_ACTION_CONFIRM_DELETE");

            // Success Call back Event handler for ODATA 'Delete' Operation
            var fnSaveSuccess = function() {
                // Done!
                var sMessageText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_SCHEDULE_LINE_ACTION_DELETE_SUCCESS");
                com.zespri.awct.util.NotificationHelper.showSuccessToast(sMessageText);

                // Read the data again , since the table is bound with JSON model . standard refresh method will not work .
                oController._readScheduleDetails(oController._sContextPath, true);
                oController.setHasUnsavedChanges(false);
                // Deactivate busy indicator
                oController._setViewBusy(false);
            };

            // Error Call back Event handler for ODATA 'Delete' Operation
            var fnSaveError = function(oError) {
                // Error
                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                // Deactivate busy
                oController._setViewBusy(false);
            };

            // called when user confirms delete action
            var fnOnDeleteConfirmed = function() {

                // Activate busy indicator
                oController._setViewBusy(true);

                // Firing ODATA remove to delete schedule line record.
                oModel.remove(sContextPath, {
                    success : fnSaveSuccess,
                    error : fnSaveError
                });
            };

            com.zespri.awct.util.NotificationHelper.showConfirmDialog(sConfirmDialogText, $.proxy(fnOnDeleteConfirmed, this));

        },

        /**
         * Event handler for the 'row actions' button.
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        handleRowActionsPress : function(oEvent) {
            this._oRowActionsExtension.showRowActions(oEvent.getSource().getBindingContext());
        },

        /**
         * This method to used to fire the odata call for schedule.
         * 
         * @private
         * @param{string} sContextPath - context path of schedule.
         * @param{boolean} bIsBookmarkUrl - is it a book mark url.
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        _readScheduleDetails : function(sContextPath, bIsBookmarkUrl) {

            var oController = this;
            // success handler
            var fnReadSuccess = function(oJSONModel) {
                oController._oScheduleRateContext = new sap.ui.model.Context(oJSONModel, '/result');
                // fill form data
                oController._setFormData(sContextPath, bIsBookmarkUrl);
                // remove busy indicator
                oController._setViewBusy(false);
            };

            // Error handler
            var fnReadError = function(oError) {
                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
            };

            // Trigger the read
            com.zespri.awct.util.ModelHelper.getJSONModelForRead(sContextPath, {
                urlParameters : {
                    "$expand" : "ScheduleLineSet"
                }
            }, fnReadSuccess, fnReadError);
        },

        /**
         * This method to used to set the data for all the controls in the form.
         * 
         * @private
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        _setFormData : function(sContextPath, bIsBookmarkUrl) {
            // binding schedule line context to the view
            this.getView().setModel(this._oScheduleRateContext.getModel()).setBindingContext(this._oScheduleRateContext);

            var sKey = this._oScheduleRateContext.getProperty('ScheduleType');
            var oControl = this.byId('textDeliveryPallet');
            oControl.setSelectedKey(sKey);

            // binding items to schedule line table
            var oScheduleLineTable = this.byId('scheduleLineTable');
            var sPath = '';
            // setting items binding path for schedule line table
            if (bIsBookmarkUrl) {
                sPath = "ScheduleLineSet/results";
            } else {
                sPath = "/" + sContextPath + "/ScheduleLineSet";
            }
            oScheduleLineTable.bindItems({
                path : sPath,
                template : oScheduleLineTable.getBindingInfo("items") ? oScheduleLineTable.getBindingInfo("items").template : oScheduleLineTable
                        .getItems()[0].clone()
            });
        },

        /**
         * This method is called when the add button in the schedule line table toolbar is clicked. On click of this button the add new schedule line
         * dialog is opened.
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        handleAddScheduleLinePress : function() {
            // Getting the View Settings Dialog
            if (!this._oAddScheduleLineDialog) {
                this._oAddScheduleLineDialog = sap.ui.xmlfragment("AddScheduleLineFragement", "com.zespri.awct.admin.fragment.AddScheduleLineDialog",
                        this);
                this.getView().addDependent(this._oAddScheduleLineDialog);
            }

            // get the controls
            var oDaysFromLoading = sap.ui.core.Fragment.byId("AddScheduleLineFragement", "daysFromLoadingInput");
            var oStandardRate = sap.ui.core.Fragment.byId("AddScheduleLineFragement", "standardRateInput");
            var oShortNoticeRate = sap.ui.core.Fragment.byId("AddScheduleLineFragement", "shortNoticeRateInput");
            var oCurrencyInput = sap.ui.core.Fragment.byId("AddScheduleLineFragement", "currencyInput");
            // clear values before opening
            oDaysFromLoading.setValue('');
            oStandardRate.setValue('');
            oShortNoticeRate.setValue('');
            oCurrencyInput.setValue('');
            // Remove currency CustomData
            if (this._getCustomDataForKey(oCurrencyInput, "currency")) {
                oCurrencyInput.removeCustomData(this._getCustomDataForKey(oCurrencyInput, "currency"));
            }

            // Reset the value state
            oDaysFromLoading.setValueState(sap.ui.core.ValueState.None);
            oStandardRate.setValueState(sap.ui.core.ValueState.None);
            oShortNoticeRate.setValueState(sap.ui.core.ValueState.None);
            oCurrencyInput.setValueState(sap.ui.core.ValueState.None);

            this._oAddScheduleLineDialog.open();

        },

        /**
         * This method is used for F4 help for currency values in the add schedule line dialog
         * 
         * @param {sap.ui.base.Event}
         *            oEvent The Event object
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        handleCurrencyValueHelpPress : function(oEvent) {
            var oCurrencyInputField = oEvent.getSource();

            // create value help dialog only once
            if (!this._oCurrencyDialog) {
                this._oCurrencyDialog = new sap.ui.xmlfragment("currencyDialog", "com.zespri.awct.admin.fragment.SearchFieldSelectionDialog", this);
                this.getView().addDependent(this._oCurrencyDialog);
            }
            // Make the dialog as single select
            this._oCurrencyDialog.setMultiSelect(false);

            // Title for the dialog
            this._oCurrencyDialog.setTitle(com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_SCHEDULE_LINE_CURRENCY_DIALOG_TITLE"));
            // Hide the label in the table select dialog
            sap.ui.core.Fragment.byId("currencyDialog", "searchFieldLabel").setVisible(false);

            // Bind Currency values to the table select dialog
            this._bindCurrency(oCurrencyInputField);

            // Open the dialog
            this._oCurrencyDialog.open();

        },

        /**
         * This method is used to load the currency values to the table select dialog
         * 
         * @private
         * @param {sap.ui.core.Control}
         *            oCurrencyInput Input field for currency
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        _bindCurrency : function(oCurrencyInput) {
            var oController = this;
            // Remove existing items
            this._oCurrencyDialog.destroyItems();

            this._oCurrencyDialog._dialog.setBusy(true);
            this._oCurrencyDialog._dialog.setBusyIndicatorDelay(0);

            // Read currency values
            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GenericSearchSet", {
                urlParameters : {
                    "$filter" : "Scenario eq 'CURRENCY'"

                }
            }, function(oModel) {
                // Success
                oController._oCurrencyDialog.setModel(oModel);

                oController._oCurrencyDialog.bindItems({
                    path : "/results",
                    factory : function(sId, oContext) {
                        var sText = oContext.getProperty("Key") + " - " + oContext.getProperty("Value");
                        return new sap.m.ColumnListItem({
                            cells : [new sap.m.Text({
                                text : sText
                            })]
                        });
                    }
                });

                // Set growing threshold to the number of results so that preselection can be done
                oController._oCurrencyDialog.setGrowingThreshold(oModel.getData().results.length);

                // Preselect the values that the user had selected when the dialog was opened the previous time
                // 1. Read the value in the textbox
                // 2. Loop through the items bound to the dialog box
                // 3. If the values are same, set it as selected
                var sSearchFieldValue = oCurrencyInput.getValue();

                for ( var i = 0; i < oController._oCurrencyDialog.getItems().length; i++) {
                    if (sSearchFieldValue === oController._oCurrencyDialog.getItems()[i].getCells()[0].getText()) {
                        oController._oCurrencyDialog.getItems()[i].setSelected(true);
                    }
                }

                oController._oCurrencyDialog._dialog.setBusy(false);

            }, function(oError) {
                // Error
                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                oController._oCurrencyDialog._dialog.setBusy(false);
                oController._oCurrencyDialog._dialog.close();
            });

        },

        /**
         * This method is used for search in the currency table select dialog
         * 
         * @param {sap.ui.base.Event}
         *            oEvent The Event object
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        handleValueHelpDialogSearch : function(oEvent) {

            var sValue = oEvent.getParameter("value");
            var sFilterKey = "Key";

            var oFilter = new sap.ui.model.Filter(sFilterKey, sap.ui.model.FilterOperator.Contains, sValue);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },

        /**
         * This method is called when a currency value is selected from the table select dialog
         * 
         * @param {sap.ui.base.Event}
         *            oEvent The Event object
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        handleValueHelpDialogOKPress : function(oEvent) {
            var oSelectedContext = oEvent.getParameter("selectedContexts")[0];
            var oCurrencyInput = sap.ui.core.Fragment.byId("AddScheduleLineFragement", "currencyInput");
            oCurrencyInput.setValue(oSelectedContext.getProperty("Key") + " - " + oSelectedContext.getProperty("Value"));

            // Remove previously existing customdata
            if (this._getCustomDataForKey(oCurrencyInput, "currency")) {
                oCurrencyInput.removeCustomData(this._getCustomDataForKey(oCurrencyInput, "currency"));
            }

            // Add selected key to custom data
            oCurrencyInput.addCustomData(new sap.ui.core.CustomData({
                key : "currency",
                value : oSelectedContext.getProperty("Key")
            }));

            // Remove value state
            oCurrencyInput.setValueState(sap.ui.core.ValueState.None);
        },

        /**
         * This method is called when the close button on the add schedule line dialog is pressed
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        handleAddScheduleLineDialogClosePress : function() {
            this._oAddScheduleLineDialog.close();
        },

        /**
         * Private method to get the context path of schedule rate.
         * 
         * @private
         * @returns {string} - sContextPath - context path of schedule rate
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        _getContextPath : function() {

            // model which has data of all the schedule rate records.
            var oModel = sap.ui.getCore().getRootComponent().getModel();

            var sContextPath = this._oScheduleRateContext.getPath().substr(1);
            // Check the model of "_oScheduleRateContext" .
            // If the context is from application model , get the contextPath from "_oScheduleRateContext"
            // if the context is not from application model (i.e. from JSON model) , get the contextPath using the metadata URI string
            if (this._oScheduleRateContext.getModel() !== oModel) {
                var oScheduleRateResult = this._oScheduleRateContext.getModel().getData().result;
                var sUri = oScheduleRateResult.__metadata.uri;
                var aURISplit = sUri.split("/");
                if (aURISplit.length) {
                    // Get the last string from the split array which will contain the schedule rate context
                    sContextPath = aURISplit[aURISplit.length - 1];
                }
            }

            return sContextPath;
        },

        /**
         * This method is used to get data from the FORM
         * 
         * @private
         * @returns {object} returns data object which has all form input fields or else return null if there is an validation error in page.
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        _getScheduleLineDialogFormData : function() {

            // get the controls
            var oDaysFromLoading = sap.ui.core.Fragment.byId("AddScheduleLineFragement", "daysFromLoadingInput");
            var oStandardRate = sap.ui.core.Fragment.byId("AddScheduleLineFragement", "standardRateInput");
            var oShortNoticeRate = sap.ui.core.Fragment.byId("AddScheduleLineFragement", "shortNoticeRateInput");
            var oCurrencyInput = sap.ui.core.Fragment.byId("AddScheduleLineFragement", "currencyInput");

            // get the control values
            var sDaysFromLoading = oDaysFromLoading.getValue();
            var iDaysFromLoading = parseInt(sDaysFromLoading, 10);
            var iStandardRate = oStandardRate.getValue();
            var iShortNoticeRate = oShortNoticeRate.getValue();
            var oCurrencyCustomData = this._getCustomDataForKey(oCurrencyInput, "currency");
            var bHasErrorInPage = false;

            // check whether days from loading is an integer or not
            if (isNaN(sDaysFromLoading) || (Math.round(sDaysFromLoading) !== parseFloat(sDaysFromLoading)) || (Math.round(sDaysFromLoading) < 0)) {
                oDaysFromLoading.setValueState(sap.ui.core.ValueState.Error);
                oDaysFromLoading.setValueStateText(com.zespri.awct.util.I18NHelper
                        .getText("TXT_ADMIN_SCHEDULE_LINE_DIALOG_DAYS_FROM_LOADING_ERROR_VALUE_STATE_TEXT"));
                bHasErrorInPage = true;
            } else {
                oDaysFromLoading.setValueState(sap.ui.core.ValueState.None);
            }

            if (!iStandardRate || isNaN(iStandardRate)) {
                oStandardRate.setValueState(sap.ui.core.ValueState.Error);
                oStandardRate.setValueStateText(com.zespri.awct.util.I18NHelper
                        .getText("TXT_ADMIN_SCHEDULE_LINE_DIALOG_STANDARD_RATE_ERROR_VALUE_STATE_TEXT"));
                bHasErrorInPage = true;
            } else {
                oStandardRate.setValueState(sap.ui.core.ValueState.None);
            }

            if (!iShortNoticeRate || isNaN(iShortNoticeRate)) {
                oShortNoticeRate.setValueState(sap.ui.core.ValueState.Error);
                oShortNoticeRate.setValueStateText(com.zespri.awct.util.I18NHelper
                        .getText("TXT_ADMIN_SCHEDULE_LINE_DIALOG_SHORT_NOTICE_RATE_ERROR_VALUE_STATE_TEXT"));
                bHasErrorInPage = true;
            } else {
                oShortNoticeRate.setValueState(sap.ui.core.ValueState.None);
            }

            if (!oCurrencyCustomData) {
                oCurrencyInput.setValueState(sap.ui.core.ValueState.Error);
                oCurrencyInput.setValueStateText(com.zespri.awct.util.I18NHelper
                        .getText("TXT_ADMIN_SCHEDULE_LINE_DIALOG_CURRENCY_ERROR_VALUE_STATE_TEXT"));
                bHasErrorInPage = true;
            } else {
                oCurrencyInput.setValueState(sap.ui.core.ValueState.None);
            }

            // If there is an error in page. Return back
            if (bHasErrorInPage) {
                return null;
            }

            var oScheduleLineDialogFormData = {};

            oScheduleLineDialogFormData.ScheduleName = this._oScheduleRateContext.getProperty('ScheduleName');
            oScheduleLineDialogFormData.DaysFromLoading = iDaysFromLoading;
            oScheduleLineDialogFormData.StandardRate = iStandardRate;
            oScheduleLineDialogFormData.ShortNoticeRate = iShortNoticeRate;
            oScheduleLineDialogFormData.Currency = oCurrencyCustomData.getValue();

            return oScheduleLineDialogFormData;
        },

        /**
         * Event handler for 'press' event of the 'Save' button
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        handleAddScheduleLineDialogSavePress : function() {

            var oController = this;

            // model which has data of all the schedule rate records.
            var oModel = sap.ui.getCore().getRootComponent().getModel();

            var sContextPath = this._getContextPath();

            // get the user data from the FORM
            var oData = this._getScheduleLineDialogFormData();

            // If there is no data. Do not save
            if (!oData) {
                return;
            }

            // Success Call back Event handler for ODATA 'Save' Operation
            var fnSaveSuccess = function() {
                // Done!
                var sMessageText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_ADD_SCHEDULE_LINE_DIALOG_SAVE_SUCCESS");
                com.zespri.awct.util.NotificationHelper.showSuccessToast(sMessageText);

                oController.setHasUnsavedChanges(false);

                // Deactivate busy indicator
                oController._oAddScheduleLineDialog.setBusy(false);
                // close the dialog
                oController._oAddScheduleLineDialog.close();
                oController._refreshScheduleLines(sContextPath);
            };

            var fnSaveError = function(oError) {
                // Error
                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                // Deactivate busy indicator
                oController._oAddScheduleLineDialog.setBusy(false);
            };

            // Activate busy indicator
            this._oAddScheduleLineDialog.setBusy(true);

            // firing ODATA update call with data to be saved.
            oModel.create("/ScheduleLineSet", oData, {
                success : fnSaveSuccess,
                error : fnSaveError,
                async : true
            });
        },

        /**
         * This method is used to get data from the FORM
         * 
         * @private
         * @returns {object} returns data object which has all form input fields or else return null if there is an validation error in page.
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        _getFormData : function() {

            var oScheduleName = this.byId('textScheduleName');
            var oScheduleType = this.byId('textDeliveryPallet');

            // get the control values
            var sScheduleName = oScheduleName.getValue();
            var sScheduleType = oScheduleType.getSelectedKey();

            var bHasErrorInPage = false;

            if (!sScheduleName) {
                oScheduleName.setValueState(sap.ui.core.ValueState.Error);
                oScheduleName.setValueStateText(com.zespri.awct.util.I18NHelper
                        .getText("TXT_ADMIN_SCHEDULE_RATE_DIALOG_SCHEDULE_NAME_ERROR_VALUE_STATE_TEXT"));
                bHasErrorInPage = true;
            } else {
                oScheduleName.setValueState(sap.ui.core.ValueState.None);
            }

            // If there is an error in page. Return back
            if (bHasErrorInPage) {
                return null;
            }

            var oFormData = {};

            oFormData.ScheduleName = sScheduleName;
            oFormData.ScheduleType = sScheduleType;

            return oFormData;
        },

        /**
         * Event handler for 'press' event of the 'Save' button
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        handleScheduleRateDetailSavePress : function() {

            var oController = this;
            // model which has data of all the schedule rate records.
            var oModel = sap.ui.getCore().getRootComponent().getModel();

            var sContextPath = this._getContextPath();

            // get the user data from the FORM
            var oData = this._getFormData();
            // If there is no data. Do not save
            if (!oData) {
                return;
            }

            // Success Call back Event handler for ODATA 'Save' Operation
            var fnSaveSuccess = function() {
                // Done!
                var sMessageText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_SCHEDULE_RATE_SAVE_SUCCESS");
                com.zespri.awct.util.NotificationHelper.showSuccessToast(sMessageText);

                oController.setHasUnsavedChanges(false);

                // Deactivate busy indicator
                oController._setViewBusy(false);
            };

            var fnSaveError = function(oError) {
                // Error
                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                // Deactivate busy indicator
                oController._setViewBusy(false);
            };

            // Activate busy indicator
            this._setViewBusy(true);

            // firing ODATA update call with data to be saved.
            oModel.update(sContextPath, oData, {
                success : fnSaveSuccess,
                error : fnSaveError,
                merge : true
            });
        },

        /**
         * Event handler for 'press' event of the 'Cancel' button
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        handleScheduleRateDetailCancelPress : function() {
            this.getRouter().navBack();
        },

        /**
         * Event handler for the 'OnBeforeNavigationWithUnsavedChanges' event that the custom router fires if the user tries to navigate away from the
         * view while there are unsaved changes.
         * 
         * @param {sap.ui.base.Event}
         *            oEvent The event object. The event object contains a parameter which contains a callback that should be invoked if the
         *            navigation should be allowed. If this callback is never invoked, the navigation stays cancelled.
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        handleNavigationWithUnsavedChanges : function(oEvent) {
            // Get the callback to be invoked to allow this navigation
            var fnAllowNavigation = oEvent.getParameter("fnAllowNavigation");
            var oController = this;

            // What to do if the user is OK with data loss?
            var fnOnUserConfirmDataLoss = function() {
                oController.setHasUnsavedChanges(false);
                fnAllowNavigation();
            };

            // Show confirmation dialog
            var sText = com.zespri.awct.util.I18NHelper.getText("TXT_GENERIC_NAVIGATION_DATA_LOSS_MESSAGE");
            com.zespri.awct.util.NotificationHelper.showConfirmDialog(sText, fnOnUserConfirmDataLoss);
        },

        /**
         * Event handler triggered on input change on the screen.
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        handleInputChange : function() {
            // Update dirty state for the page
            this.setHasUnsavedChanges(true);
            // Enable save button
            this.byId('scheduleRateSaveButton').setEnabled(true);
        },

        /**
         * Helper to set the view to busy. Footer and view need to both be set to 'busy'
         * 
         * @private
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         * @param {Boolean}
         *            bBusy Indicates whether the view is to be set to busy state
         */
        _setViewBusy : function(bBusy) {
            this.getView().setBusy(bBusy);
            if (this.byId("pageScheduleRatesDetail").getFooter()) {
                this.byId("pageScheduleRatesDetail").getFooter().setBusy(bBusy);
            }
        },

        /**
         * Helper to refresh schedule rate details
         * 
         * @private
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         * @param {string}
         *            sContextPath - context path of schedule.
         */
        _refreshScheduleLines : function(sContextPath) {

            // model which has data of all the schedule rate records.
            var oModel = sap.ui.getCore().getRootComponent().getModel();

            var oScheduleLineTable = this.byId('scheduleLineTable');

            // if user has reached from book mark url
            if (this._oScheduleRateContext.getModel() !== oModel) {
                this._setViewBusy(true);
                this._readScheduleDetails(sContextPath, true);
            } else {
                // refresh schedule line table
                oScheduleLineTable.getBinding("items").refresh();
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
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
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
         * This method will be triggered when overflow icon in the footer bar is clicked . This method will open an action sheet which contains 2
         * actions 1. View Time Based Rates 2. View Exception Based Rates
         * 
         * @param {sap.ui.base.Event}
         *            oEvent The Event object
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        handleScheduleRateActionSheetOpen : function(oEvent) {

            var oMoreActionsButton = oEvent.getSource();

            // create action sheet only once
            if (!this._oActionSheet) {
                this._oActionSheet = sap.ui.xmlfragment("scheduleDetailsActionSheetFragment",
                        "com.zespri.awct.admin.fragment.ScheduleDetailsActionSheet", this);
                this.getView().addDependent(this._oActionSheet);
            }

            if (this._oActionSheet.isOpen()) {
                // Toggle Effect
                this._oActionSheet.close();
            } else {
                // Open the Action Sheet
                this._oActionSheet.openBy(oMoreActionsButton);
            }
        },
        /**
         * This method will navigate to the corresponding view based on the action sheet button clicked.
         * 
         * @param {sap.ui.base.Event}
         *            oEvent The Event object
         * @memberOf com.zespri.awct.admin.view.ScheduleRatesDetail
         */
        handleNavToRatesView : function(oEvent) {
            var oSource = oEvent.getSource();
            var oViewTimeBasedRates = sap.ui.core.Fragment.byId("scheduleDetailsActionSheetFragment", "viewTimeBasedRatesButton");
            var oViewExceptionBasedRates = sap.ui.core.Fragment.byId("scheduleDetailsActionSheetFragment", "viewExceptionBasedRatesButton");
            // Get the ScheduleName from the context
            var sScheduleName = this._oScheduleRateContext.getProperty("ScheduleName");
            
            // If the viewTimeBasedRates action button is clicked, navigate to timeBasedRates view with scheduleName
            if (oSource === oViewTimeBasedRates) {
                this.getRouter().navTo("Administration/TimeBasedRateMaintenance", {
                    customData : {
                        ScheduleName : sScheduleName
                    }
                });
            } 
            // If the viewExceptionBasedRates action button is clicked, navigate to exceptionBasedRates view with scheduleName
            else if (oSource === oViewExceptionBasedRates) {
                this.getRouter().navTo("Administration/ExceptionRateMaintenance", {
                    customData : {
                        ScheduleName : sScheduleName
                    }
                });
            } else {
                return;
            }
        }
    });
})();
