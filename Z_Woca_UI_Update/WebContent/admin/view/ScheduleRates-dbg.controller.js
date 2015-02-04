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
     * @classdesc The purpose of this page is to allow the Administrator to add and update time based rate schedules.
     * 
     * @class
     * @name com.zespri.awct.admin.view.ScheduleRates
     */
    com.zespri.awct.core.Controller.extend("com.zespri.awct.admin.view.ScheduleRates", /** @lends com.zespri.awct.admin.view.ScheduleRates */
    {
        // Private enum for ScheduleType
        _ScheduleType : {
            Delivery : "D",
            Pallet : "P",
            Swap : "S"
        },
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it
         * is displayed, to bind event handlers and do other one-time initialization.
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRates
         */
        onInit : function() {
            /* START of instance member initialization */
            // Private Instance for View Settings Dialog
            this._oAddScheduleRatesDialog = null;
            // Private Instance variable for user authorization
            this._bUserAuthorized = false;
            /* END of instance member initialization */

            var oController = this;
            var oScheduleRatesTable = this.byId("scheduleRateTable");
            // Manage NoData Texts , listen for oScheduleRatesTable update EVENT
            com.zespri.awct.util.CommonHelper.manageNoDataText(oScheduleRatesTable);

            this.getRouter().attachRoutePatternMatched(
                    function(oEvent) {
                        if (oEvent.getParameter("name") === "Administration/ScheduleRates") {

                            // Check the current user authorizations
                            if (!oController._bUserAuthorized) {
                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));
                                return;
                            }
                            
                            // If the current user authorization is Display , hide add button and footer
                            if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Administration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZADM)) {
                                if (oController.byId("scheduleRatesPage").getFooter()) {
                                    oController.byId("scheduleRatesPage").getFooter().destroy();
                                }
                            }
                        }
                    });
        },
        /**
         * This method will be called before rendering the View.
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRates
         */
        onBeforeRendering : function() {
            // Check User Authorizations
            if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                    com.zespri.awct.util.Enums.AuthorizationObject.Administration, com.zespri.awct.util.Enums.AuthorizationFunctions.ZADM)) {
                if (this.byId("scheduleRatesPage")) {
                    this.byId("scheduleRatesPage").destroy();
                }
                this._bUserAuthorized = false;
            } else {
                this._bUserAuthorized = true;
            }
        },
        /**
         * Event Handler for "add" button in the schedule rates page footer bar . Used to navigate to "schedule rate" add new page
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRates
         */
        handleAddScheduleRatePress : function() {
            // Getting the View Settings Dialog
            if (!this._oAddScheduleRatesDialog) {
                this._oAddScheduleRatesDialog = sap.ui.xmlfragment("AddScheduleRatesFragement",
                        "com.zespri.awct.admin.fragment.AddScheduleRatesDialog", this);
                this.getView().addDependent(this._oAddScheduleRatesDialog);
            }

            // clear input fields before opening.
            var oScheduleName = sap.ui.core.Fragment.byId("AddScheduleRatesFragement", "scheduleNameInput");
            var oDeliveryPallete = sap.ui.core.Fragment.byId("AddScheduleRatesFragement", "deliveryPalleteInput");

            oScheduleName.setValue('');
            oDeliveryPallete.setSelectedKey('');

            this._oAddScheduleRatesDialog.open();
        },

        /**
         * This method is called when any record in the schedule rate table is selected
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRates
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        handleScheduleRateTableSelect : function(oEvent) {

            var oSelectedItem = oEvent.getSource().getSelectedItem();
            var sPath = oSelectedItem.getBindingContextPath();

            // Navigate to detail of selected exception rate
            // subStr(1) is used to get exception rate path after "/", it will remove "/" from path
            this.getRouter().navTo("Administration/ScheduleRatesDetail", {
                contextPath : sPath.substr(1)
            });
        },

        /**
         * This method is called when the close button on the add schedule rate dialog is pressed
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRates
         */
        handleAddScheduleRatesClosePress : function() {
            this._oAddScheduleRatesDialog.close();
        },

        /**
         * This method is used to get data from the FORM
         * @private
         * @returns {object} returns data object which has all form input fields or else return null if there is an validation error in page.
         * @memberOf com.zespri.awct.admin.view.ScheduleRates
         */
        _getFormData : function() {

            var oScheduleName = sap.ui.core.Fragment.byId("AddScheduleRatesFragement", "scheduleNameInput");
            var oDeliveryPallete = sap.ui.core.Fragment.byId("AddScheduleRatesFragement", "deliveryPalleteInput");

            // get the control values
            var sScheduleName = oScheduleName.getValue();
            var sScheduleType = oDeliveryPallete.getSelectedKey();

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
         * Event handler for 'press' event of the 'Save' button from create schedule rate dialog
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRates
         */
        handleAddScheduleRatesSavePress : function() {

            var oController = this;

            // model which has data of all the schedule rate records.
            var oModel = this.getView().getModel();

            // get the user data from the FORM
            var oData = this._getFormData();
            // If there is no data. Do not save
            if (!oData) {
                return;
            }

            // Success Call back Event handler for ODATA 'Save' Operation
            var fnSaveSuccess = function() {
                // Done!
                var sMessageText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_ADD_SCHEDULE_RATES_DIALOG_SAVE_SUCCESS");
                com.zespri.awct.util.NotificationHelper.showSuccessToast(sMessageText);

                // Deactivate busy indicator
                oController._oAddScheduleRatesDialog.setBusy(false);

                // close the dialog
                oController._oAddScheduleRatesDialog.close();
            };

            var fnSaveError = function(oError) {
                // Error
                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                // Deactivate busy indicator
                oController._oAddScheduleRatesDialog.setBusy(false);
            };

            // Activate busy indicator
            this._oAddScheduleRatesDialog.setBusy(true);

            // firing ODATA update call with data to be saved.
            oModel.create('ScheduleSet', oData, {
                success : fnSaveSuccess,
                error : fnSaveError,
                async : true
            });
        },

        /**
         * Helper method to format ScheduleType.
         * 
         * @memberOf com.zespri.awct.admin.view.ScheduleRates
         * @param {String}
         *            sScheduleType with possible values of D(delivery),P(Pallet) and S(Swap)
         * @returns {String} sDelPallet If bDeliverPallet is true , return Yes. Else return with No .
         * 
         */
        formatScheduleType : function(sScheduleType) {
            if (sScheduleType === this._ScheduleType.Delivery) {
                return com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_SCHEDULE_RATES_DETAIL_LABEL_SCHEDULE_TYPE_DELIVERY");
            } else if (sScheduleType === this._ScheduleType.Swap) {
                return com.zespri.awct.util.I18NHelper.getText("TXT_ADMIN_SCHEDULE_RATES_DETAIL_LABEL_SCHEDULE_TYPE_SWAP");
            } else if (sScheduleType === this._ScheduleType.Pallet) {
                return com.zespri.awct.util.I18NHelper.getText("TXT_GENERIC_PALLET");
            } else {
                return "";
            }
        }

    });
})();
