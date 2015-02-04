(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });
    jQuery.sap.require("com.zespri.awct.util.Constants");
    jQuery.sap.require("com.zespri.awct.util.CommonFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.Enums");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");

    /**
     * @classdesc The purpose of this page is to display the details of time rate for view and edit.
     * 
     * This Page is able to behave in two modes. First one is Add mode where we can add new Time based rate. Secondly Edit mode where it shows the
     * detail of each time rate line selection and allows to modify. Actions available : Save, Delete and Cancel
     * 
     * @class
     * @name com.zespri.awct.admin.view.TimeBasedRateDetail
     */
    com.zespri.awct.core.Controller
            .extend("com.zespri.awct.admin.view.TimeBasedRateDetail",
                    /** @lends com.zespri.awct.admin.view.TimeBasedRateDetail */
                    {
                        /**
                         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify
                         * the View before it is displayed, to bind event handlers and do other one-time initialization.
                         * 
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRateDetail
                         */

                        onInit : function() {
                            /* START of instance member initialization */
                            // Private variable for view mode
                            this._sViewStatus = null;
                            // Private variable for time rate line Context
                            this._oTimeRateContext = null;
                            // Private Instance variable for user authorization
                            this._bUserAuthorized = false;
                            /* END of instance member initialization */

                            var oController = this;

                            this.getRouter().attachRoutePatternMatched(
                                    function(oEvent) {

                                        if (oEvent.getParameter("name") === "Administration/TimeRateDetail") {
                                            // Check the current user authorizations
                                            if (!oController._bUserAuthorized) {
                                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                                        .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));
                                            } else {

                                                var sContextPath = oEvent.getParameter("arguments").contextPath;
                                                this._sViewStatus = oEvent.getParameter("arguments").viewMode;

                                                // disable save button
                                                oController.byId('saveTimeRateButton').setEnabled(false);

                                                // Initialize the view with data
                                                oController._initializeView(sContextPath);
                                            }

                                            // To make sure the user doesn't accidentally navigate away with unsaved changes...
                                            oController.getRouter().attachOnBeforeNavigationWithUnsavedChanges(
                                                    this.handleNavigationWithUnsavedChanges, this);
                                        } else {
                                            // If the user navigates elsewhere, stop listening for the router's 'onBeforeNavigationWithUnsavedChanges'
                                            // event
                                            oController.getRouter().detachOnBeforeNavigationWithUnsavedChanges(
                                                    this.handleNavigationWithUnsavedChanges, this);
                                        }
                                    }, this);

                        },
                        /**
                         * This method will be called before rendering the View.
                         * 
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRateDetail
                         */
                        onBeforeRendering : function() {
                            // Check User Authorizations
                            if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Administration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZADM)) {
                                if (this.byId("pageTimeRateDetail")) {
                                    this.byId("pageTimeRateDetail").destroy();
                                }
                                this._bUserAuthorized = false;
                            } else {
                                this._bUserAuthorized = true;
                            }
                        },
                        /**
                         * This is a private method to disable all the form fields
                         * 
                         * @private
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRateDetail
                         */
                        _disableForm : function() {

                            this.byId('selectVariety').setEnabled(false);
                            this.byId('selectClass').setEnabled(false);
                            this.byId('selectGrowingMethod').setEnabled(false);
                            this.byId('selectPackStyle').setEnabled(false);
                            this.byId('selectCountry').setEnabled(false);
                            this.byId('selectShipmentType').setEnabled(false);
                            this.byId('selectChargeCode').setEnabled(false);
                            this.byId('selectSchedule').setEnabled(false);
                            this.byId('selectPriority').setEnabled(false);
                            this.byId('selectSize').setEnabled(false);
                            this.byId('selectActiveFlag').setEnabled(false);
                            this.byId('switchShortNotice').setState(false);

                            var oDateValidFrom = this.byId('dateValidFrom');
                            var oDateValidTo = this.byId('dateValidTo');

                            oDateValidFrom.setEnabled(false);
                            oDateValidTo.setEnabled(false);

                            // This styling is added because disabling the datepicker resizes the control
                            oDateValidFrom.addStyleClass("zAwctDisabledDatepicker");
                            oDateValidTo.addStyleClass("zAwctDisabledDatepicker");
                        },

                        /**
                         * Private method to clear the form.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRateDetail
                         */

                        _clearForm : function() {

                            var oSelectVariety = this.byId('selectVariety');
                            var oSelectClass = this.byId('selectClass');
                            var oSelectGrowingMethod = this.byId('selectGrowingMethod');
                            var oSelectPackStyle = this.byId('selectPackStyle');
                            var oSelectCountry = this.byId('selectCountry');
                            var oSelectShipmentType = this.byId('selectShipmentType');
                            var oSelectChargeCode = this.byId('selectChargeCode');
                            var oSelectSchedule = this.byId('selectSchedule');
                            var oDateValidFrom = this.byId('dateValidFrom');
                            var oDateValidTo = this.byId('dateValidTo');
                            var oSelectPriority = this.byId('selectPriority');
                            var oSelectSize = this.byId('selectSize');
                            var oSelectActiveFlag = this.byId("selectActiveFlag");
                            var oSwitchShortNotice = this.byId("switchShortNotice");

                            oSelectVariety.setSelectedKey("");
                            oSelectClass.setSelectedKey("");
                            oSelectGrowingMethod.setSelectedKey("");
                            oSelectPackStyle.setSelectedKey("");
                            oSelectCountry.setSelectedKey("");
                            oSelectShipmentType.setSelectedKey("");
                            oSelectChargeCode.setSelectedKey("");
                            oSelectSchedule.setSelectedKey("");
                            oDateValidFrom.setValue("");
                            oDateValidTo.setValue("");
                            oSelectPriority.setSelectedKey("10");
                            oSelectSize.setSelectedKey("");
                            oSelectActiveFlag.setState(true);
                            oSwitchShortNotice.setState(false);
                        },

                        /**
                         * Private method to set the selected item in all the dropdowns from the time rate context.
                         * 
                         * @private
                         * @param {string}
                         *            sControlID - ID of the select control.
                         * @param {string}
                         *            sProperty - Property in time rate context model
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRateDetail
                         */

                        _setSelectedItem : function(sControlID, sProperty) {

                            var sKey = this._oTimeRateContext.getProperty(sProperty);
                            var oControl = this.byId(sControlID);
                            oControl.setSelectedKey(sKey);
                        },

                        /**
                         * Private method to set all the date fields from the time rate context.
                         * 
                         * @private
                         * @param {string}
                         *            sControlID - ID of the select control.
                         * @param {string}
                         *            sProperty - Property in time rate context model
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRateDetail
                         */

                        _setDateFields : function(sControlID, sProperty) {

                            var sKey = this._oTimeRateContext.getProperty(sProperty);
                            var oControl = this.byId(sControlID);
                            oControl.setValue(sKey);
                        },

                        /**
                         * This method to used to set the data for all the controls in the form.
                         * 
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRateDetail
                         */
                        setFormData : function() {

                            var oController = this;
                            // map of controls id and binding property from time rate context used inside form.
                            var mInputSelectFields = {
                                'selectVariety' : 'Characteristic/Variety',
                                'selectClass' : 'Characteristic/Class',
                                'selectGrowingMethod' : 'Characteristic/GrowingMethod',
                                'selectCountry' : 'Country',
                                'selectPackStyle' : 'Characteristic/PackStyle',
                                'selectSize' : 'Characteristic/Size',
                                'selectShipmentType' : 'ShipmentType',
                                'selectChargeCode' : 'ChargeCode',
                                'selectSchedule' : 'ScheduleName',
                                'selectPriority' : 'Priority'
                            };

                            var mDateFields = {
                                'dateValidFrom' : 'ValidFrom',
                                'dateValidTo' : 'ValidTo'
                            };

                            $.each(mInputSelectFields, function(sControlID, sProperty) {
                                oController._setSelectedItem(sControlID, sProperty);
                            });

                            $.each(mDateFields, function(sControlID, sProperty) {
                                oController._setDateFields(sControlID, sProperty);
                            });

                            // Active flag selection
                            var sKey = this._oTimeRateContext.getProperty("Active");
                            this.byId("selectActiveFlag").setState(sKey);

                            // Short notice flag selection
                            var bShortNoticeFlag = this._oTimeRateContext.getProperty("ShortNoticeFlag");
                            this.byId('switchShortNotice').setState(bShortNoticeFlag);
                        },

                        /**
                         * Private method to get the context path of time rate.
                         * 
                         * @private
                         * @returns {string} - sContextPath - context path of time rate
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRateDetail
                         */
                        _getContextPath : function() {

                            // model which has data of all the time rate records.
                            var oModel = this.getView().getModel();

                            var sContextPath = this._oTimeRateContext.getPath().substr(1);
                            // Check the model of "_oTimeRateContext" .
                            // If the context is from application model , get the contextPath from "_oTimeRateContext"
                            // if the context is not from application model (i.e. from JSON model) , get the contextPath using the metadata URI string
                            if (this._oTimeRateContext.getModel() !== oModel) {
                                var oTimeRateResult = this._oTimeRateContext.getModel().getData().result;
                                var sUri = oTimeRateResult.__metadata.uri;
                                var aURISplit = sUri.split("/");
                                if (aURISplit.length) {
                                    // Get the last string from the split array which will contain the time rate context
                                    sContextPath = aURISplit[aURISplit.length - 1];
                                }
                            }

                            return sContextPath;
                        },

                        /**
                         * Event handler for 'press' event of the 'Save' button
                         * 
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRateDetail
                         */
                        handleSavePress : function() {

                            var oController = this;
                            // model which has data of all the time based rate records.
                            var oModel = this.getView().getModel();

                            // Success Call back Event handler for ODATA 'Save' Operation
                            var fnSaveSuccess = function() {
                                // Done!
                                var sMessageText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_TIME_RATES_SAVE_SUCCESS");
                                com.zespri.awct.util.NotificationHelper.showSuccessToast(sMessageText);

                                oController.setHasUnsavedChanges(false);

                                // disable save button after transaction is successful
                                oController.byId('saveTimeRateButton').setEnabled(false);

                                // Deactivate busy indicator
                                oController.getView().setBusy(false);

                                // Navigate to the table screen.
                                // Do not refresh the table, because a read would be made by the framework after the create is successful.
                                oController.getRouter().navTo("Administration/TimeBasedRateMaintenance", {
                                    customData : {
                                        noTableRefresh : true
                                    }
                                });
                            };

                            var fnSaveError = function(oError) {
                                // Error
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                // Deactivate busy indicator
                                oController.getView().setBusy(false);

                            };

                            var oSelectChargeCode = this.byId('selectChargeCode');
                            var oSelectSchedule = this.byId('selectSchedule');
                            var oSelectPriority = this.byId('selectPriority');
                            var oDateValidFrom = this.byId('dateValidFrom');
                            var oDateValidTo = this.byId('dateValidTo');

                            // Mandatory fields - if Charge Code, Schedule, Valid From, Valid To, Priority are not selected, throw an error
                            if ((!oSelectChargeCode.getSelectedItem().getKey()) || (!oSelectSchedule.getSelectedItem().getKey()) ||
                                    (!oSelectPriority.getSelectedItem().getKey()) || (!oDateValidFrom.getValue()) || (!oDateValidTo.getValue())) {
                                com.zespri.awct.util.NotificationHelper.showErrorDialog(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_ADMIN_TIME_RATES_DETAILS_MANDATORY_FIELDS_ERROR_MESSAGE"));
                            }
                            // Mandatory Fields selected
                            else {

                                // If FromDate is greater than ToDate, throw an error
                                if ((new Date(oDateValidFrom.getValue())) > (new Date(oDateValidTo.getValue()))) {
                                    com.zespri.awct.util.NotificationHelper.showErrorDialog(com.zespri.awct.util.I18NHelper
                                            .getText("TXT_ADMIN_TIME_RATES_DETAILS_FROMDATE_GREATER_THAN_TODATE_ERROR_MESSAGE"));
                                } else {

                                    // get the user data from the FORM
                                    var oDataToBeSaved = this.getFormData();

                                    // activate busy indicator
                                    this.getView().setBusy(true);

                                    if (this._sViewStatus === com.zespri.awct.util.Enums.ViewMode.Add) {

                                        // If new rate is created, create a new entry
                                        oModel.create("/TimeBasedRateSet", oDataToBeSaved, {
                                            success : fnSaveSuccess,
                                            error : fnSaveError,
                                            async : true
                                        });

                                    } else {

                                        var sContextPath = this._getContextPath();

                                        // firing ODATA update call with data to be saved.
                                        oModel.update(sContextPath, oDataToBeSaved, {
                                            success : fnSaveSuccess,
                                            error : fnSaveError,
                                            merge : true
                                        });
                                    }
                                }
                            }
                        },

                        /**
                         * Event handler for 'press' event of the 'Delete' button
                         * 
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRateDetail
                         */
                        handleDeletePress : function() {

                            var oController = this;

                            var sContextPath = this._getContextPath();

                            // Show confirmation dialog to user before proceeding.
                            var sConfirmDialogText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_TIME_RATES_CONFIRM_DELETE");

                            // Success Call back Event handler for ODATA 'Delete' Operation
                            var fnSaveSuccess = function() {
                                // Done!
                                var sMessageText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_TIME_RATES_DELETE_SUCCESS");
                                com.zespri.awct.util.NotificationHelper.showSuccessToast(sMessageText);

                                oController.setHasUnsavedChanges(false);

                                // Deactivate busy indicator
                                oController.getView().setBusy(false);

                                oController.getRouter().navBack();
                            };

                            // Error Call back Event handler for ODATA 'Delete' Operation
                            var fnSaveError = function(oError) {
                                // Error
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                // Deactivate busy indicator
                                oController.getView().setBusy(false);
                            };

                            // called when user confirms delete action
                            var fnOnDeleteConfirmed = function() {

                                var oModel = oController.getView().getModel();

                                // activate busy indicator
                                oController.getView().setBusy(true);

                                // Firing ODATA remove to delete time record.
                                oModel.remove(sContextPath, {
                                    success : fnSaveSuccess,
                                    error : fnSaveError
                                });
                            };

                            com.zespri.awct.util.NotificationHelper.showConfirmDialog(sConfirmDialogText, fnOnDeleteConfirmed);
                        },

                        /**
                         * This method is used to get data from the FORM
                         * 
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRateDetail
                         */
                        getFormData : function() {

                            var oSelectVariety = this.byId('selectVariety');
                            var oSelectClass = this.byId('selectClass');
                            var oSelectGrowingMethod = this.byId('selectGrowingMethod');
                            var oSelectPackStyle = this.byId('selectPackStyle');
                            var oSelectSize = this.byId('selectSize');
                            var oSelectCountry = this.byId('selectCountry');
                            var oSelectShipmentType = this.byId('selectShipmentType');
                            var oSelectChargeCode = this.byId('selectChargeCode');
                            var oSelectSchedule = this.byId('selectSchedule');
                            var oDateValidFrom = this.byId('dateValidFrom');
                            var oDateValidTo = this.byId('dateValidTo');
                            var oSelectPriority = this.byId('selectPriority');
                            var oSelectActiveFlag = this.byId("selectActiveFlag");
                            var oSwtichShortNotice = this.byId("switchShortNotice");

                            var oFormData = {
                                Characteristic : {}
                            };

                            oFormData.Characteristic.Variety = oSelectVariety.getSelectedItem().getKey();
                            oFormData.Characteristic.Class = oSelectClass.getSelectedItem().getKey();
                            oFormData.Characteristic.GrowingMethod = oSelectGrowingMethod.getSelectedItem().getKey();
                            oFormData.Characteristic.PackStyle = oSelectPackStyle.getSelectedItem().getKey();
                            oFormData.Characteristic.Size = oSelectSize.getSelectedItem().getKey();
                            oFormData.Country = oSelectCountry.getSelectedItem().getKey();
                            oFormData.ShipmentType = oSelectShipmentType.getSelectedItem().getKey();
                            oFormData.ChargeCode = oSelectChargeCode.getSelectedItem().getKey();
                            oFormData.ScheduleName = oSelectSchedule.getSelectedItem().getKey();
                            oFormData.Active = oSelectActiveFlag.getState();
                            if (oDateValidFrom.getValue()) {
                                oFormData.ValidFrom = this._getExternalFormatValue(oDateValidFrom);
                            }
                            if (oDateValidTo.getValue()) {
                                oFormData.ValidTo = this._getExternalFormatValue(oDateValidTo);
                            }
                            oFormData.Priority = parseInt(oSelectPriority.getSelectedItem().getKey(), 10);
                            oFormData.ShortNoticeFlag = oSwtichShortNotice.getState();

                            // CurrentSeason
                            oFormData.Season = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;

                            return oFormData;

                        },

                        /**
                         * Event handler for 'press' event of the 'Cancel' button
                         * 
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRateDetail
                         */
                        handleCancelPress : function() {
                            this.getRouter().navBack();

                            // this.getRouter().navTo("Administration/TimeBasedRateMaintenance", true,
                            // sap.ui.core.routing.HistoryDirection.Backwards);

                        },

                        /**
                         * Event handler for the 'OnBeforeNavigationWithUnsavedChanges' event that the custom router fires if the user tries to
                         * navigate away from the view while there are unsaved changes.
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object. The event object contains a parameter which contains a callback that should be invoked
                         *            if the navigation should be allowed. If this callback is never invoked, the navigation stays cancelled.
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRateDetail
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
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRateDetail
                         */
                        handleInputChange : function() {
                            // Update dirty state for the page
                            this.setHasUnsavedChanges(true);
                            // Enable save button
                            this.byId('saveTimeRateButton').setEnabled(true);
                        },

                        /**
                         * This private method initializes the dropdowns in the view with data (if available)
                         * 
                         * @param {String}
                         *            sContextPath The context path of the row selected from the table
                         * 
                         * @private
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRateDetail
                         */
                        _initializeView : function(sContextPath) {

                            var oController = this;
                            var $batchReadDeferred = $.Deferred();
                            var $batchReadPromise = $batchReadDeferred.promise();

                            // Set busy state to the view
                            this.getView().setBusy(true);

                            // Success handler for batch read
                            var fnBatchReadSuccess = function(oData, oResponse, aErrorResponses) {
                                var aResults = oResponse.data.__batchResponses;
                                var oJSONModel = new sap.ui.model.json.JSONModel();

                                // Set sizeLimit on JSONModel (used for list bindings) to the same as the OData model. This is to overide the default
                                // of 100
                                oJSONModel.setSizeLimit(com.zespri.awct.util.Constants.C_ODATA_MODEL_SIZE_LIMIT);

                                // Add an empty value to the dropdown list
                                var oEmptyObject = {
                                    "Key" : "",
                                    "Value" : ""
                                };

                                // For each of the dropdowns, add an empty item as the first item
                                aResults[0].data.results.unshift(oEmptyObject);
                                aResults[1].data.results.unshift(oEmptyObject);
                                aResults[2].data.results.unshift(oEmptyObject);
                                aResults[3].data.results.unshift(oEmptyObject);
                                aResults[4].data.results.unshift(oEmptyObject);
                                // Shipment types and countries are returned from function imports and not from the GenericSearch. Hence oEmptyObject
                                // is not added.
                                aResults[5].data.results.unshift({
                                    "ShipmentTypeID" : ""
                                });
                                aResults[6].data.results.unshift(oEmptyObject);
                                aResults[7].data.results.unshift({
                                    "CountryCode" : ""
                                });
                                aResults[8].data.results.unshift(oEmptyObject);

                                oJSONModel.setProperty("/Varieties", aResults[0].data.results);
                                oJSONModel.setProperty("/Classes", aResults[1].data.results);
                                oJSONModel.setProperty("/GrowingMethods", aResults[2].data.results);
                                oJSONModel.setProperty("/PackStyles", aResults[3].data.results);
                                oJSONModel.setProperty("/Sizes", aResults[4].data.results);
                                oJSONModel.setProperty("/ShipmentTypes", aResults[5].data.results);
                                oJSONModel.setProperty("/Schedules", aResults[6].data.results);
                                oJSONModel.setProperty("/Countries", aResults[7].data.results);
                                oJSONModel.setProperty("/ChargeCodes", aResults[8].data.results);

                                oController.getView().setModel(oJSONModel, "domainValues");

                                // Show errors if any
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(aErrorResponses);
                                // Resolve the promise for batch read
                                $batchReadDeferred.resolve();

                            };

                            var fnBatchReadError = function(oError) {
                                // Error handler for batch read
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                            };

                            var oModel = this.getView().getModel();
                            var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;

                            // Requests
                            var oBatchOperationForVariety = oModel.createBatchOperation("GenericSearchSet?$filter=Scenario%20eq%20%27VARIETY%27",
                                    "GET");
                            var oBatchOperationForClass = oModel.createBatchOperation("GenericSearchSet?$filter=Scenario%20eq%20%27CLASS%27", "GET");
                            var oBatchOperationForGrowingMethod = oModel.createBatchOperation(
                                    "GenericSearchSet?$filter=Scenario%20eq%20%27GROWING_METHOD%27", "GET");
                            var oBatchOperationForPackStyle = oModel.createBatchOperation(
                                    "GenericSearchSet?$filter=Scenario%20eq%20%27PACK_STYLE%27", "GET");
                            var oBatchOperationForSize = oModel.createBatchOperation("GenericSearchSet?$filter=Scenario%20eq%20%27SIZE%27", "GET");
                            var oBatchOperationForShipmentType = oModel.createBatchOperation("GetShipmentTypesForDifotis?Season=%27" +
                                    sCurrentSeason + "%27", "GET");
                            var oBatchOperationForSchedule = oModel.createBatchOperation("ScheduleSet", "GET");
                            var oBatchOperationForCountries = oModel.createBatchOperation(
                                    "GetCountriesForSeason?Season=%27" + sCurrentSeason + "%27", "GET");
                            var oBatchOperationForChargeCodes = oModel.createBatchOperation(
                                    "GenericSearchSet?$filter=Scenario%20eq%20%27CHARGECODE%27", "GET");

                            // Create batch request
                            var aBatchRequest = [oBatchOperationForVariety, oBatchOperationForClass, oBatchOperationForGrowingMethod,
                                    oBatchOperationForPackStyle, oBatchOperationForSize, oBatchOperationForShipmentType, oBatchOperationForSchedule,
                                    oBatchOperationForCountries, oBatchOperationForChargeCodes];

                            oModel.addBatchReadOperations(aBatchRequest);
                            oModel.submitBatch(fnBatchReadSuccess, fnBatchReadError);

                            // For time based rates

                            var $readTimeBasedRatesDeferred = $.Deferred();
                            var $readTimeBasedRatesPromise = $readTimeBasedRatesDeferred.promise();

                            // If coming from Add
                            this.getView().byId("pageTimeRateDetail").setTitle(
                                    com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_TIME_RATES_DETAIL_PAGE_TITLE_ADD"));

                            if (this._sViewStatus === com.zespri.awct.util.Enums.ViewMode.Add) {
                                oController._clearForm();
                                // hide delete button
                                oController.byId('deleteTimeRateButton').setVisible(false);
                                // No read from context... so just resolve the promise
                                $readTimeBasedRatesDeferred.resolve();
                            } else {
                                // Edit
                                this.getView().byId("pageTimeRateDetail").setTitle(
                                        com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_TIME_RATES_DETAIL_PAGE_TITLE"));

                                /*
                                 * Check the incoming Route. This part is tricky. If the user reached this view from the 'TimeBasedRateMaintenance'
                                 * view, the details about the current time rate record will already be available in the model and
                                 * oModel.getProperty() is enough to get this information. However, if the user reaches this page by directly pasting
                                 * the link in the address bar, the model will be empty and .getProperty() will fail. In such a case, we need to read
                                 * the current time rate record from the backend, using the context path available in the URL.
                                 */

                                oController.byId('deleteTimeRateButton').setVisible(true);

                                oController._oTimeRateContext = new sap.ui.model.Context(oController.getView().getModel(), '/' + sContextPath);
                                // key value to check whether the time rate record is already available in the model when the user navigates from time
                                // based screen.
                                var sTimeBasedRateID = oController._oTimeRateContext.getProperty('TimeBasedRateID');

                                if (sTimeBasedRateID) {
                                    oController.setFormData();
                                    // Resolve the promise made
                                    $readTimeBasedRatesDeferred.resolve();
                                } else { // Need to get time based rate details from the backend. Prepare success handler for this read.

                                    // Need to get time based rate details from the backend. Prepare success handler for this read.
                                    var fnReadSuccess = function(oJSONModel) {
                                        oController._oTimeRateContext = new sap.ui.model.Context(oJSONModel, "/result");
                                        oController.setFormData();

                                        // Resolve the promise made
                                        $readTimeBasedRatesDeferred.resolve();
                                    };

                                    // Error handler for this read
                                    var fnReadError = function(oError) {
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                    };

                                    // Trigger the read
                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead(sContextPath, {}, fnReadSuccess, fnReadError);
                                }
                            }

                            // Wait for both the promises to be resolved. Then set the busy state of the view to false
                            $.when($batchReadPromise, $readTimeBasedRatesPromise).done(function() {
                                oController.getView().setBusy(false);
                            });

                        },

                        /**
                         * This method returns the value of the date in its corresponding YYYY-MM-DDT00:00:00 representation. (e.g
                         * '2000-12-25T00:00:00')
                         * 
                         * @private
                         * 
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRatesDetail
                         * @param {sap.ui.commons.DatePicker}
                         *            oDate Datepicker reference
                         * @returns {String} formatter date string
                         */
                        _getExternalFormatValue : function(oDatePicker) {

                            var sDateValue = oDatePicker.getYyyymmdd();

                            var sYear = sDateValue.substring(0, 4);
                            var sMonth = sDateValue.substring(4, 6);
                            var sDate = sDateValue.substring(6, 8);

                            // Return formatted string
                            var sResult = sYear + "-" + sMonth + "-" + sDate + "T00:00:00";

                            return sResult;
                        },

                        /**
                         * This method returns the formatted text for the select field based on the key and value .
                         * 
                         * @memberOf com.zespri.awct.admin.view.TimeBasedRatesDetail
                         * @param {String}
                         *            sKey Domain Key for select control Item
                         * @param {String}
                         *            sValue Domain value for the select control Item
                         * @returns {String} Formatted select control text
                         */
                        formatSelectItems : function(sKey, sValue) {
                            if (!sKey && !sValue) {
                                return "";
                            } else {
                                return sKey + " - " + sValue;
                            }
                        }

                    });
})();
