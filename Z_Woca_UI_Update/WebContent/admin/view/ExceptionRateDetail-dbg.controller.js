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
    jQuery.sap.require("com.zespri.awct.util.Constants");
    jQuery.sap.require("com.zespri.awct.util.Enums");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");

    /**
     * @class
     * @name com.zespri.awct.admin.view.ExceptionRateDetail
     * @classdesc The purpose of this page is to display the details of exception rate for view and edit.
     * 
     * This Page is able to behave in two modes. First one is Add mode where we can add new Exception based rate. Secondly Edit mode where it shows
     * the detail of each exception rate line selection and allows to modify. Actions available : Save, Delete and Cancel
     * 
     */
    com.zespri.awct.core.Controller
            .extend("com.zespri.awct.admin.view.ExceptionRateDetail",
                    /** @lends com.zespri.awct.admin.view.ExceptionRateDetail */
                    {
                        /**
                         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify
                         * the View before it is displayed, to bind event handlers and do other one-time initialization.
                         * 
                         * @memberOf com.zespri.awct.admin.view.ExceptionRateDetail
                         */

                        onInit : function() {
                            /* START of instance member initialization */
                            this._sViewStatus = null;
                            // Private variable for exception rate line Context
                            this._oExceptionRateContext = null;
                            // Private Instance variable for user authorization
                            this._bUserAuthorized = false;
                            /* END of instance member initialization */

                            var oController = this;

                            this.getRouter().attachRoutePatternMatched(
                                    function(oEvent) {

                                        if (oEvent.getParameter("name") === "Administration/ExceptionRateDetail") {

                                            // Check the current user authorizations
                                            if (!oController._bUserAuthorized) {
                                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                                        .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));
                                            } else {

                                                var sContextPath = oEvent.getParameter("arguments").contextPath;
                                                oController._sViewStatus = oEvent.getParameter("arguments").viewMode;

                                                // disable save button
                                                oController.byId('saveExceptionRateButton').setEnabled(false);

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
                         * @memberOf com.zespri.awct.admin.view.ExceptionRateDetail
                         */
                        onBeforeRendering : function() {
                            // Check User Authorizations
                            if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Administration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZADM)) {
                                if (this.byId("pageExceptionRateDetail")) {
                                    this.byId("pageExceptionRateDetail").destroy();
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
                         * @memberOf com.zespri.awct.admin.view.ExceptionRateDetail
                         */
                        _disableForm : function() {

                            this.byId('selectVariety').setEnabled(false);
                            this.byId('selectClass').setEnabled(false);
                            this.byId('selectGrowingMethod').setEnabled(false);
                            this.byId('selectPackStyle').setEnabled(false);
                            this.byId('selectDeliveryID').setEnabled(false);
                            this.byId('selectShipmentType').setEnabled(false);
                            this.byId('selectChargeCode').setEnabled(false);
                            this.byId('selectSchedule').setEnabled(false);
                            this.byId('selectPriority').setEnabled(false);
                            this.byId('selectSize').setEnabled(false);
                            this.byId('switchShortNotice').setEnabled(false);
                            this.byId('switchActiveFlag').setEnabled(false);
                            this.byId('selectShipmentNumber').setEnabled(false);
                        },

                        /**
                         * Private method to clear the form.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.admin.view.ExceptionRateDetail
                         */

                        _clearForm : function() {

                            var oSelectVariety = this.byId('selectVariety');
                            var oSelectClass = this.byId('selectClass');
                            var oSelectGrowingMethod = this.byId('selectGrowingMethod');
                            var oSelectPackStyle = this.byId('selectPackStyle');
                            var oSelectDeliveryID = this.byId('selectDeliveryID');
                            var oSelectShipmentType = this.byId('selectShipmentType');
                            var oSelectChargeCode = this.byId('selectChargeCode');
                            var oSelectSchedule = this.byId('selectSchedule');
                            var oSelectPriority = this.byId('selectPriority');
                            var oSelectSize = this.byId('selectSize');
                            var oSwitchShortNotice = this.byId('switchShortNotice');
                            var oSwitchActiveFlag = this.byId('switchActiveFlag');
                            var oShipmentNumber = this.byId('selectShipmentNumber');

                            oSelectVariety.setSelectedKey("");
                            oSelectClass.setSelectedKey("");
                            oSelectGrowingMethod.setSelectedKey("");
                            oSelectPackStyle.setSelectedKey("");
                            oSelectDeliveryID.setSelectedKey("");
                            oSelectShipmentType.setSelectedKey("");
                            oSelectChargeCode.setSelectedKey("");
                            oSelectSchedule.setSelectedKey("");
                            oSelectPriority.setSelectedKey("10");
                            oSelectSize.setSelectedKey("");
                            oShipmentNumber.setSelectedKey("");
                            oSwitchShortNotice.setState(false);
                            oSwitchActiveFlag.setState(true);
                        },

                        /**
                         * Private method to set the selected item of all the dropdowns from the exception context.
                         * 
                         * @private
                         * @param {string}
                         *            sControlID - ID of the select control.
                         * @param {string}
                         *            sProperty - Property in exception context model
                         * @memberOf com.zespri.awct.admin.view.ExceptionRateDetail
                         */

                        _setSelectedItem : function(sControlID, sProperty) {

                            var sKey = this._oExceptionRateContext.getProperty(sProperty);
                            var oControl = this.byId(sControlID);
                            oControl.setSelectedKey(sKey);
                        },

                        /**
                         * This method to used to set the data for all the controls in the form.
                         * 
                         * @param {jQuery.Deferred}
                         *            $readExceptionRatesDeferred Deferred Object to be resolved based on shipment Number Selection
                         * @memberOf com.zespri.awct.admin.view.ExceptionRateDetail
                         */
                        setFormData : function($readExceptionRatesDeferred) {

                            var oController = this;
                            // map of controls id and binding property from exception rate context used inside form.
                            var mInputSelectFields = {
                                'selectVariety' : 'Characteristic/Variety',
                                'selectClass' : 'Characteristic/Class',
                                'selectGrowingMethod' : 'Characteristic/GrowingMethod',
                                'selectPackStyle' : 'Characteristic/PackStyle',
                                'selectSize' : 'Characteristic/Size',
                                'selectDeliveryID' : 'DeliveryID',
                                'selectShipmentType' : 'ShipmentType',
                                'selectChargeCode' : 'ChargeCode',
                                'selectSchedule' : 'ScheduleName',
                                'selectPriority' : 'Priority',
                                'selectShipmentNumber' : 'ShipmentID'
                            };

                            // In Edit Mode, If shipment Number is selected / passed from exception rates view . Query Delivery Header Set for
                            // selected ShipmentNumber
                            var sShipmentKey = oController._oExceptionRateContext.getProperty("ShipmentID");
                            if (sShipmentKey) {
                                var oDeliveryNumber = this.byId("selectDeliveryID");
                                var sDeliveryFilter = "ShipmentID eq '" + sShipmentKey + "'";

                                com.zespri.awct.util.ModelHelper.getJSONModelForRead("/DeliveryHeaderSet", {
                                    urlParameters : {
                                        "$select" : "DeliveryHeaderID",
                                        "$orderby" : "DeliveryHeaderID",
                                        "$filter" : sDeliveryFilter
                                    }
                                }, function(oJSONModel) {

                                    // Add an empty value to the dropdown list
                                    var oEmptyObject = {
                                        "Key" : "",
                                        "Value" : ""
                                    };
                                    oJSONModel.oData.results.unshift(oEmptyObject);
                                    oJSONModel.setSizeLimit(oJSONModel.oData.results.length);
                                    oJSONModel.setProperty("/DeliveryNumbers", oJSONModel.oData.results);
                                    oDeliveryNumber.setModel(oJSONModel, "domainValues");
                                    // Success Handler
                                    var oBindingInfo = {
                                        path : "domainValues>/DeliveryNumbers",
                                        template : oDeliveryNumber.getBindingInfo("items") ? oDeliveryNumber.getBindingInfo("items").template
                                                : oDeliveryNumber.getItems()[0].clone()
                                    };

                                    oDeliveryNumber.bindItems(oBindingInfo);
                                    // Resolve the deferred Object
                                    $readExceptionRatesDeferred.resolve();
                                }, function(oError) {
                                    // Error
                                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                    // Resolve the deferred Object
                                    $readExceptionRatesDeferred.resolve();
                                });
                            } else {
                                // Resolve the deferred Object , if shipmentNumber Key is empty
                                $readExceptionRatesDeferred.resolve();
                            }

                            $.each(mInputSelectFields, function(sControlID, sProperty) {
                                oController._setSelectedItem(sControlID, sProperty);
                            });

                            // Select value for Short Notice Flag
                            var oShortNoticeSwitch = this.byId("switchShortNotice");
                            var bShortNotice = this._oExceptionRateContext.getProperty("ShortNoticeFlag");
                            oShortNoticeSwitch.setState(bShortNotice);

                            // Select value for Active flag
                            var oActiveFlagSwitch = this.byId("switchActiveFlag");
                            var bActiveFlag = this._oExceptionRateContext.getProperty("Active");
                            oActiveFlagSwitch.setState(bActiveFlag);
                        },

                        /**
                         * Private method to get the context path of exception rate.
                         * 
                         * @private
                         * @returns {string} - sContextPath - context path of exception rate
                         * @memberOf com.zespri.awct.admin.view.ExceptionRateDetail
                         */
                        _getContextPath : function() {

                            // model which has data of all the Exception based rate records.
                            var oModel = this.getView().getModel();

                            var sContextPath = this._oExceptionRateContext.getPath().substr(1);
                            // Check the model of "_oExceptionRateContext" .
                            // If the context is from application model , get the contextPath from "_oExceptionRateContext"
                            // if the context is not from application model (i.e. from JSON model) , get the contextPath using the metadata URI string
                            if (this._oExceptionRateContext.getModel() !== oModel) {
                                var oExceptionRateResult = this._oExceptionRateContext.getModel().getData().result;
                                var sUri = oExceptionRateResult.__metadata.uri;
                                var aURISplit = sUri.split("/");
                                if (aURISplit.length) {
                                    // Get the last string from the split array which will contain the exception rate context
                                    sContextPath = aURISplit[aURISplit.length - 1];
                                }
                            }

                            return sContextPath;
                        },

                        /**
                         * Event handler for 'press' event of the 'Save' button
                         * 
                         * @memberOf com.zespri.awct.admin.view.ExceptionRateDetail
                         */
                        handleSavePress : function() {

                            var oController = this;
                            // model which has data of all the Exception based rate records.
                            var oModel = this.getView().getModel();

                            // Success Call back Event handler for ODATA 'Save' Operation
                            var fnSaveSuccess = function() {
                                // Done!
                                var sMessageText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_EXCEPTION_RATES_SAVE_SUCCESS");
                                com.zespri.awct.util.NotificationHelper.showSuccessToast(sMessageText);

                                oController.setHasUnsavedChanges(false);

                                // Deactivate busy indicator
                                oController.getView().setBusy(false);

                                // disable save button after transaction is successful
                                oController.byId('saveExceptionRateButton').setEnabled(false);

                                // Navigate back to previous screen
                                oController.getRouter().navTo("Administration/ExceptionRateMaintenance", {
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

                            var oSelectDeliveryID = this.byId('selectDeliveryID');
                            var oSelectShipmentNumber = this.byId("selectShipmentNumber");
                            var oSelectChargeCode = this.byId('selectChargeCode');
                            var oSelectSchedule = this.byId('selectSchedule');
                            var oSelectPriority = this.byId('selectPriority');

                            // Mandatory fields : If none of them are selected, throw an error
                            // For Delivery ID and Shipment ID, at least one of them should be selected
                            if ((!oSelectChargeCode.getSelectedItem().getKey()) ||
                                    (!(oSelectDeliveryID.getSelectedItem().getKey() || oSelectShipmentNumber.getSelectedKey())) ||
                                    (!oSelectSchedule.getSelectedItem().getKey()) || ((!oSelectPriority.getSelectedItem().getKey()))) {
                                com.zespri.awct.util.NotificationHelper.showErrorDialog(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_ADMIN_EXCEPTION_RATES_DETAILS_MANDATORY_FIELDS_ERROR_MESSAGE"));
                            }
                            // If at least one of the mandatory fields is selected
                            else {

                                // get the user data from the FORM
                                var oDataToBeSaved = this.getFormData();

                                // Activate busy indicator
                                this.getView().setBusy(true);

                                if (this._sViewStatus === com.zespri.awct.util.Enums.ViewMode.Add) {

                                    // If new rate is created, create a new entry
                                    oModel.create("/ExceptionRateSet", oDataToBeSaved, {
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
                        },

                        /**
                         * Event handler for 'press' event of the 'Delete' button
                         * 
                         * @memberOf com.zespri.awct.admin.view.ExceptionRateDetail
                         */
                        handleDeletePress : function() {

                            var oController = this;

                            var sContextPath = this._getContextPath();

                            // Show confirmation dialog to user before proceeding.
                            var sConfirmDialogText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_EXCEPTION_RATES_CONFIRM_DELETE");

                            // Success Call back Event handler for ODATA 'Delete' Operation
                            var fnSaveSuccess = function() {
                                // Done!
                                var sMessageText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_EXCEPTION_RATES_DELETE_SUCCESS");
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

                                var oModel = this.getView().getModel();

                                // Activate busy indicator
                                oController.getView().setBusy(true);

                                // Firing ODATA remove to delete Exception record.
                                oModel.remove(sContextPath, {
                                    success : fnSaveSuccess,
                                    error : fnSaveError
                                });
                            };

                            com.zespri.awct.util.NotificationHelper.showConfirmDialog(sConfirmDialogText, $.proxy(fnOnDeleteConfirmed, this));
                        },

                        /**
                         * This method is used to get data from the FORM
                         * 
                         * @memberOf com.zespri.awct.admin.view.ExceptionRateDetail
                         */
                        getFormData : function() {

                            var oSelectVariety = this.byId('selectVariety');
                            var oSelectClass = this.byId('selectClass');
                            var oSelectGrowingMethod = this.byId('selectGrowingMethod');
                            var oSelectPackStyle = this.byId('selectPackStyle');
                            var oSelectDeliveryID = this.byId('selectDeliveryID');
                            var oSelectSize = this.byId('selectSize');
                            var oSelectShipmentType = this.byId('selectShipmentType');
                            var oSelectChargeCode = this.byId('selectChargeCode');
                            var oSelectSchedule = this.byId('selectSchedule');
                            var oSelectPriority = this.byId('selectPriority');
                            var oSelectShipmentNumber = this.byId('selectShipmentNumber');
                            var oSwitchShortNotice = this.byId("switchShortNotice");
                            var oSwitchActiveFlag = this.byId("switchActiveFlag");

                            var oFormData = {
                                Characteristic : {}
                            };

                            oFormData.Characteristic.Variety = oSelectVariety.getSelectedItem().getKey();
                            oFormData.Characteristic.Class = oSelectClass.getSelectedItem().getKey();
                            oFormData.Characteristic.GrowingMethod = oSelectGrowingMethod.getSelectedItem().getKey();
                            oFormData.Characteristic.Size = oSelectSize.getSelectedItem().getKey();
                            oFormData.Characteristic.PackStyle = oSelectPackStyle.getSelectedItem().getKey();
                            oFormData.DeliveryID = oSelectDeliveryID.getSelectedItem().getKey();
                            oFormData.ShipmentType = oSelectShipmentType.getSelectedItem().getKey();
                            oFormData.ChargeCode = oSelectChargeCode.getSelectedItem().getKey();
                            oFormData.ScheduleName = oSelectSchedule.getSelectedItem().getKey();
                            oFormData.Priority = parseInt(oSelectPriority.getSelectedItem().getKey(), 10);
                            oFormData.ShipmentID = oSelectShipmentNumber.getSelectedItem().getKey();
                            oFormData.ShortNoticeFlag = oSwitchShortNotice.getState();
                            oFormData.Active = oSwitchActiveFlag.getState();

                            // CurrentSeason
                            oFormData.Season = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;

                            return oFormData;
                        },

                        /**
                         * Event handler for 'press' event of the 'Cancel' button
                         * 
                         * @memberOf com.zespri.awct.admin.view.ExceptionRateDetail
                         */
                        handleCancelPress : function() {
                            this.getRouter().navBack();
                        },

                        /**
                         * Event handler for the 'OnBeforeNavigationWithUnsavedChanges' event that the custom router fires if the user tries to
                         * navigate away from the view while there are unsaved changes.
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object. The event object contains a parameter which contains a callback that should be invoked
                         *            if the navigation should be allowed. If this callback is never invoked, the navigation stays cancelled.
                         * @memberOf com.zespri.awct.admin.view.ExceptionRateDetail
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
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.admin.view.ExceptionRateDetail
                         */
                        handleInputChange : function(oEvent) {
                            var oController = this;

                            // Update dirty state for the page
                            this.setHasUnsavedChanges(true);
                            // Enable save button
                            this.byId('saveExceptionRateButton').setEnabled(true);

                            // If ShipmentNumber field is changed , change DeliveryNumber select field.
                            if (oEvent.getSource() === this.byId("selectShipmentNumber")) {
                                // Set the view Busy
                                this.getView().setBusy(true);

                                var oDeliveryNumber = this.byId("selectDeliveryID");
                                var oUrlParamters = {};

                                if (this.byId("selectShipmentNumber").getSelectedKey()) {
                                    var sDeliveryFilter = "ShipmentID eq '" + this.byId("selectShipmentNumber").getSelectedKey() + "'";
                                    oUrlParamters = {
                                        "$select" : "DeliveryHeaderID",
                                        "$orderby" : "DeliveryHeaderID",
                                        "$filter" : sDeliveryFilter
                                    };
                                } else {
                                    oUrlParamters = {
                                        "$select" : "DeliveryHeaderID",
                                        "$orderby" : "DeliveryHeaderID"
                                    };
                                }
                                com.zespri.awct.util.ModelHelper.getJSONModelForRead("/DeliveryHeaderSet", {
                                    urlParameters : oUrlParamters
                                }, function(oJSONModel) {

                                    // Add an empty value to the dropdown list
                                    var oEmptyObject = {
                                        "Key" : "",
                                        "Value" : ""
                                    };

                                    oJSONModel.oData.results.unshift(oEmptyObject);
                                    oJSONModel.setProperty("/DeliveryNumbers", oJSONModel.oData.results);
                                    oJSONModel.setSizeLimit(oJSONModel.oData.results.length);
                                    oDeliveryNumber.setModel(oJSONModel, "domainValues");
                                    // Success Handler
                                    var oBindingInfo = {
                                        path : "domainValues>/DeliveryNumbers",
                                        template : oDeliveryNumber.getBindingInfo("items") ? oDeliveryNumber.getBindingInfo("items").template
                                                : oDeliveryNumber.getItems()[0].clone()
                                    };

                                    oDeliveryNumber.bindItems(oBindingInfo);

                                    oController.getView().setBusy(false);
                                }, function(oError) {
                                    // Error
                                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                    oController.getView().setBusy(false);
                                });
                            }
                        },

                        /**
                         * This is a private method to initialize the dropdowns in the screen with data (if available)
                         * 
                         * @private
                         * @memberOf com.zespri.awct.admin.view.ExceptionRateDetail
                         */
                        _initializeView : function(sContextPath) {
                            var $batchReadDeferred = $.Deferred();
                            var $batchReadPromise = $batchReadDeferred.promise();
                            this.getView().setBusy(true);
                            var oController = this;

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

                                // For each of the dropdowns, add an empty item as the first item.
                                aResults[0].data.results.unshift(oEmptyObject);
                                aResults[1].data.results.unshift(oEmptyObject);
                                aResults[2].data.results.unshift(oEmptyObject);
                                aResults[3].data.results.unshift(oEmptyObject);
                                aResults[4].data.results.unshift(oEmptyObject);
                                aResults[5].data.results.unshift(oEmptyObject);
                                // ShipmentTypes comes from a function import and not Generic Search. Hence oEmptyObject is not added.
                                aResults[6].data.results.unshift({
                                    "ShipmentTypeID" : ""
                                });
                                aResults[7].data.results.unshift(oEmptyObject);
                                aResults[8].data.results.unshift(oEmptyObject);
                                aResults[9].data.results.unshift(oEmptyObject);

                                oJSONModel.setProperty("/Varieties", aResults[0].data.results);
                                oJSONModel.setProperty("/Classes", aResults[1].data.results);
                                oJSONModel.setProperty("/GrowingMethods", aResults[2].data.results);
                                oJSONModel.setProperty("/PackStyles", aResults[3].data.results);
                                oJSONModel.setProperty("/Sizes", aResults[4].data.results);
                                oJSONModel.setProperty("/DeliveryNumbers", aResults[5].data.results);
                                oJSONModel.setProperty("/ShipmentTypes", aResults[6].data.results);
                                oJSONModel.setProperty("/Schedules", aResults[7].data.results);
                                oJSONModel.setProperty("/ChargeCodes", aResults[8].data.results);
                                oJSONModel.setProperty("/ShipmentNumbers", aResults[9].data.results);

                                oController.getView().setModel(oJSONModel, "domainValues");
                                // Delivery ID field depends on Shipment List , so setting the model explicitly to bind the new modelitems while
                                // navigating .
                                oController.byId("selectDeliveryID").setModel(oJSONModel, "domainValues");

                                // Show errors if any
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(aErrorResponses);
                                $batchReadDeferred.resolve();

                                // For exception based rates
                                var $readExceptionRatesDeferred = $.Deferred();
                                var $readExceptionRatesPromise = $readExceptionRatesDeferred.promise();

                                if (oController._sViewStatus === com.zespri.awct.util.Enums.ViewMode.Add) {
                                    oController.getView().byId("pageExceptionRateDetail").setTitle(
                                            com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_EXCEPTION_RATES_DETAIL_PAGE_TITLE_ADD"));
                                    // hide delete button
                                    oController.byId('deleteExceptionRateButton').setVisible(false);
                                    oController._clearForm();

                                    $readExceptionRatesDeferred.resolve();

                                } else {
                                    oController.getView().byId("pageExceptionRateDetail").setTitle(
                                            com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_EXCEPTION_RATES_DETAIL_PAGE_TITLE"));
                                    // Edit
                                    /*
                                     * Check the incoming Route. This part is tricky. If the user reached this view from the
                                     * 'ExceptionRateMaintenance' view, the details about the current exception rate record will already be available
                                     * in the model and oModel.getProperty() is enough to get this information. However, if the user reaches this page
                                     * by directly pasting the link in the address bar, the model will be empty and .getProperty() will fail. In such
                                     * a case, we need to read the current exception rate record from the backend, using the context path available in
                                     * the URL.
                                     */

                                    // show delete button
                                    oController.byId('deleteExceptionRateButton').setVisible(true);
                                    oController._oExceptionRateContext = new sap.ui.model.Context(oController.getView().getModel(), '/' +
                                            sContextPath);
                                    // key value to check whether the Exception rate record is already available in the model when the user
                                    // navigates from Exception based screen.
                                    var sExceptionBasedRateID = oController._oExceptionRateContext.getProperty('ExceptionRateID');

                                    if (sExceptionBasedRateID) {
                                        oController.setFormData($readExceptionRatesDeferred);
                                    } else {
                                        // Need to get Exception based rate details from the backend. Prepare success handler for this read.
                                        var fnReadSuccess = function(oJSONModel) {
                                            oController._oExceptionRateContext = new sap.ui.model.Context(oJSONModel, '/result');
                                            oController.setFormData($readExceptionRatesDeferred);
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
                                $.when($batchReadPromise, $readExceptionRatesPromise).done(function() {
                                    oController.getView().setBusy(false);
                                });

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
                            var oBatchOperationForDeliveryNumber = oModel.createBatchOperation(
                                    "DeliveryHeaderSet?$select=DeliveryHeaderID&$orderby=DeliveryHeaderID", "GET");
                            var oBatchOperationForShipmentType = oModel.createBatchOperation("GetShipmentTypesForDifotis?Season=%27" +
                                    sCurrentSeason + "%27", "GET");
                            var oBatchOperationForSchedule = oModel.createBatchOperation("ScheduleSet", "GET");
                            var oBatchOperationForChargeCodes = oModel.createBatchOperation(
                                    "GenericSearchSet?$filter=Scenario%20eq%20%27CHARGECODE%27", "GET");
                            var oBatchOperationForShipmentNumber = oModel.createBatchOperation(
                                    "ShipmentSet?$select=ShipmentID&$orderby=ShipmentID&$filter=Season%20eq%20%27" + sCurrentSeason + "%27", "GET");

                            // Create batch request
                            var aBatchRequest = [oBatchOperationForVariety, oBatchOperationForClass, oBatchOperationForGrowingMethod,
                                    oBatchOperationForPackStyle, oBatchOperationForSize, oBatchOperationForDeliveryNumber,
                                    oBatchOperationForShipmentType, oBatchOperationForSchedule, oBatchOperationForChargeCodes,
                                    oBatchOperationForShipmentNumber];

                            oModel.addBatchReadOperations(aBatchRequest);

                            oModel.submitBatch(fnBatchReadSuccess, fnBatchReadError);
                        },
                        /**
                         * This method returns the formatted text for the select field based on the key and value .
                         * 
                         * @memberOf com.zespri.awct.admin.view.ExceptionRateDetail
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
