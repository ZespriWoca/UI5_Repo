(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });
    jQuery.sap.require("com.zespri.awct.util.Enums");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");

    /**
     * @classdesc This is the view for see details of library text and for create new library text
     * 
     * @class
     * @name com.zespri.awct.admin.view.LibraryTextDetails
     */

    com.zespri.awct.core.Controller.extend("com.zespri.awct.admin.view.LibraryTextDetails",
    /** @lends com.zespri.awct.admin.view.LibraryTextDetails */
    {

        /**
         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it
         * is displayed, to bind event handlers and do other one-time initialization.
         * 
         * @memberOf com.zespri.awct.admin.view.LibraryTextDetails
         */
        onInit : function() {
            /* START of instance member initialization */
            // Private variable to get context path of selected row from table
            this._oMaintainLibraryTextContext = null;
            // private instance to store the view mode
            this._sViewStatus = null;
            // Private Instance variable for user authorization
            this._bUserAuthorized = false;
            /* END of instance member initialization */

            var oController = this;
            // To make sure the user doesn't accidentally navigate away with unsaved changes...
            this.getRouter().attachOnBeforeNavigationWithUnsavedChanges(this.handleNavigationWithUnsavedChanges, this);

            this.getRouter()
                    .attachRoutePatternMatched(
                            function(oEvent) {
                                // Check if the route is for the Administration /Details view to see the details
                                if (oEvent.getParameter("name") === "Administration/MaintainLibraryTextDetail") {
                                    // Check the current user authorizations
                                    if (!oController._bUserAuthorized) {
                                        com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                                .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));
                                        return;
                                    }
                                    this._sViewStatus = oEvent.getParameter("arguments").viewMode;
                                    this._clearFormData();

                                    // Check User Authorizations . If user is not allowed to maintain , don't allow to edit input fields
                                    if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                            com.zespri.awct.util.Enums.AuthorizationObject.Administration,
                                            com.zespri.awct.util.Enums.AuthorizationFunctions.ZADM)) {

                                        if (oController.byId("libraryTextDetailPage").getFooter()) {
                                            oController.byId("libraryTextDetailPage").getFooter().destroy();
                                        }
                                    } else {
                                        // If user is authorized , allow to edit (In XML , inputs fields are made false )
                                        oController.byId("addLibraryText").setEnabled(true);
                                        oController.byId("addLibraryActive").setEnabled(true);
                                        oController.byId("addLibrarySequence").setEnabled(true);
                                    }

                                    if (this._sViewStatus === com.zespri.awct.util.Enums.ViewMode.Add) {
                                        // Enable header
                                        oController.byId("addLibraryHeaderText").setEnabled(true);
                                        // hide delete button
                                        oController.byId("adminDeleteButton").setVisible(false);
                                        // set page title based on mode: Add
                                        oController.byId("libraryTextDetailPage").setTitle(
                                                com.zespri.awct.util.I18NHelper.getText("TXT_ADMINISTRATION_LIBRARY_TEXT_DETAILS_PAGE_TITLE_ADD"));
                                        return;
                                    }

                                    // Disable header
                                    oController.byId("addLibraryHeaderText").setEnabled(false);
                                    // set page title based on mode : Edit
                                    oController.byId("libraryTextDetailPage").setTitle(
                                            com.zespri.awct.util.I18NHelper.getText("TXT_ADMINISTRATION_LIBRARY_TEXT_DETAILS_PAGE_TITLE_EDIT"));

                                    // getting the selected row data from the table
                                    var sMaintainLibraryTextContextPath = oEvent.getParameter("arguments").contextPath;
                                    this._oMaintainLibraryTextContext = new sap.ui.model.Context(this.getView().getModel(), '/' +
                                            sMaintainLibraryTextContextPath);

                                    // Define what to do once context for the selected text is available.
                                    var fnOnMaintainLibraryTextHeaderContextAvailable = function() {

                                        // form fields
                                        var oHeaderText = oController.byId("addLibraryHeaderText");
                                        var oTextValue = oController.byId("addLibraryText");
                                        var oSequence = oController.byId("addLibrarySequence");
                                        var oActive = oController.byId("addLibraryActive");

                                        // get values from model
                                        var sHeaderTextVal = oController._oMaintainLibraryTextContext.getProperty("TextName");
                                        var sTextVal = oController._oMaintainLibraryTextContext.getProperty("Text");
                                        var iSequenceVal = oController._oMaintainLibraryTextContext.getProperty("Sequence");
                                        var bActive = oController._oMaintainLibraryTextContext.getProperty("Active");

                                        // set form fields with values of model
                                        oHeaderText.setValue(sHeaderTextVal);
                                        oTextValue.setValue(sTextVal);
                                        oSequence.setValue(iSequenceVal);
                                        oActive.setState(bActive);

                                        // clear value states
                                        oHeaderText.setValueState(sap.ui.core.ValueState.None);
                                        oTextValue.setValueState(sap.ui.core.ValueState.None);
                                        oSequence.setValueState(sap.ui.core.ValueState.None);

                                        if (oController.byId("libraryTextDetailPage").getFooter()) {
                                            // enable footer actions
                                            // 'save' button is disabled by default, it is enabled when user start changing the existing library text
                                            // or
                                            // creating new.'Delete' and 'Cancel' button are visible when navigating from library text details view
                                            oController.byId("adminDeleteButton").setVisible(true);
                                            oController.byId("adminSaveButton").setVisible(true);
                                            oController.byId("adminSaveButton").setEnabled(false);
                                            oController.byId("adminCancelButton").setVisible(true);

                                        }

                                        oController._setViewBusy(false);
                                    };

                                    // Is the URL context available in the model already? If not, trigger a read to get it.
                                    var sAddLibraryHeaderText = this._oMaintainLibraryTextContext.getProperty("addLibraryHeaderText");
                                    oController._setViewBusy(true);
                                    if (sAddLibraryHeaderText) {
                                        fnOnMaintainLibraryTextHeaderContextAvailable();
                                    } else {
                                        // Need to get maintain library details from the backend. Prepare success handler for this read.
                                        var fnReadSuccess = function(oJSONModel) {
                                            oController._oMaintainLibraryTextContext = new sap.ui.model.Context(oJSONModel, "/result");
                                            fnOnMaintainLibraryTextHeaderContextAvailable();
                                        };

                                        // Error handler for this read
                                        var fnReadError = function(oError) {
                                            com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);

                                        };

                                        // Trigger the read
                                        com.zespri.awct.util.ModelHelper.getJSONModelForRead(sMaintainLibraryTextContextPath, {}, fnReadSuccess,
                                                fnReadError);
                                    }
                                }

                            }, this);
        },
        /**
         * This method will be called before rendering the View.
         * 
         * @memberOf com.zespri.awct.admin.view.LibrayTextDetails
         */
        onBeforeRendering : function() {
            // Check User Authorizations
            if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                    com.zespri.awct.util.Enums.AuthorizationObject.Administration, com.zespri.awct.util.Enums.AuthorizationFunctions.ZADM)) {
                if (this.byId("libraryTextDetailPage")) {
                    this.byId("libraryTextDetailPage").destroy();
                }
                this._bUserAuthorized = false;
            } else {
                this._bUserAuthorized = true;
            }
        },
        /**
         * This method is called to clear all data in the form
         * 
         * @private
         * @memberOf com.zespri.awct.admin.view.LibrayTextDetails
         */
        _clearFormData : function() {

            // form fields
            var oHeaderText = this.byId("addLibraryHeaderText");
            var oTextValue = this.byId("addLibraryText");
            var oSequence = this.byId("addLibrarySequence");
            var oActive = this.byId("addLibraryActive");

            oHeaderText.setValue('');
            oTextValue.setValue('');
            oActive.setState();
            oSequence.setValue('');

            oHeaderText.setValueState(sap.ui.core.ValueState.None);
            oTextValue.setValueState(sap.ui.core.ValueState.None);
            oSequence.setValueState(sap.ui.core.ValueState.None);

            if (this.byId("libraryTextDetailPage").getFooter()) {
                this.getView().byId("adminSaveButton").setVisible(true);
                this.getView().byId("adminCancelButton").setVisible(true);
            }
        },

        /**
         * Event handler for 'change' event of the 'Header text Field'.
         * 
         * @memberOf com.zespri.awct.admin.view.LibrayTextDetails
         */
        handleTextInputChanges : function() {
            // Update dirty state for the page
            this.setHasUnsavedChanges(true);
            // 'Save' button is enable when user changes in 'HeaderText', 'Text', 'Active' fields
            this.getView().byId("adminSaveButton").setEnabled(true);

        },

        /**
         * Event handler for 'press' event of the 'save' button to add added and edited library text.
         * 
         * @memberOf com.zespri.awct.admin.view.LibrayTextDetails
         */

        handleSavePress : function() {
            var oController = this;
            // form fields
            var oHeaderText = this.byId("addLibraryHeaderText");
            var oTextValue = this.byId("addLibraryText");
            var oSequence = this.byId("addLibrarySequence");
            var oActive = this.byId("addLibraryActive");

            // field values
            var sHeaderTextVal = oHeaderText.getValue();
            var sTextVal = oTextValue.getValue();
            var iSequenceVal = oSequence.getValue();
            var bActive = oActive.getState();
            // flag for switching on when there is an validation error in page
            var bHasErrorInPage = false;

            if (!sHeaderTextVal) {
                oHeaderText.setValueState(sap.ui.core.ValueState.Error);
                oHeaderText.setValueStateText(com.zespri.awct.util.I18NHelper.getText("TXT_ADMINISTARTION_HEADERTEXT_ERROR_STATE"));
                bHasErrorInPage = true;
            } else {
                oHeaderText.setValueState(sap.ui.core.ValueState.None);
            }

            if (!sTextVal) {
                oTextValue.setValueState(sap.ui.core.ValueState.Error);
                bHasErrorInPage = true;
            } else {
                oTextValue.setValueState(sap.ui.core.ValueState.None);
            }

            if (!iSequenceVal || isNaN(iSequenceVal)) {
                oSequence.setValueState(sap.ui.core.ValueState.Error);
                oSequence.setValueStateText(com.zespri.awct.util.I18NHelper.getText("TXT_ADMINISTARTION_SEQUENCE_ERROR_STATE"));
                bHasErrorInPage = true;
            } else {
                oSequence.setValueState(sap.ui.core.ValueState.None);
            }

            // If there is an error in page. Return back
            if (bHasErrorInPage) {
                var sErrorText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMINISTARTION_SEQUENCE_ERROR_VALUE_STATE_TEXT_BEFORE_SAVE_TOAST");
                com.zespri.awct.util.NotificationHelper.showErrorToast(sErrorText);
                return null;
            }

            // get the values of added library text or edited values of exsisting library text
            var oLibraryTextEntity = {
                "TextName" : sHeaderTextVal,
                "Text" : sTextVal,
                "Active" : bActive,
                "Sequence" : iSequenceVal
            };

            var fnSaveSuccess = function() {
                var sSaveSuccessText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMINISTARTION_SAVE_SCUSSESS_TOAST");
                com.zespri.awct.util.NotificationHelper.showSuccessToast(sSaveSuccessText);
                oController._setViewBusy(false);
                oController.byId("adminSaveButton").setEnabled(false);
                oController.setHasUnsavedChanges(false);
                oController.getRouter().navBack();
            };
            var fnSaveError = function(oError) {
                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                oController._setViewBusy(false);
            };

            this._setViewBusy(true);
            var oModel = this.getView().getModel();

            // if the view mode is add , call create .
            if (this._sViewStatus === com.zespri.awct.util.Enums.ViewMode.Add) {
                oModel.create("/LibraryTextSet", oLibraryTextEntity, {
                    success : fnSaveSuccess,
                    error : fnSaveError
                });

            } else if (this._sViewStatus === com.zespri.awct.util.Enums.ViewMode.Modify) {
                // if the view mode is edit , call update
                oModel.update("/LibraryTextSet('" + sHeaderTextVal + "')", oLibraryTextEntity, {
                    success : fnSaveSuccess,
                    error : fnSaveError,
                    async : true
                });
            }
        },
        /**
         * Event handler for 'press' event of the 'Delete' button to delete the exsisting library text.
         * 
         * @memberOf com.zespri.awct.admin.view.LibrayTextDetails
         */
        handleDeletePress : function() {
            var oController = this;
            // Getting the data which is coming form the selected library text list for deleting
            var oDeleteUpdatedEntity = {
                "TextName" : this._oMaintainLibraryTextContext.getProperty("TextName")
            };
            // function to check whether library text is successfully deleted
            var fnDeleteSuccess = function() {
                var sDeleteSuccessText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMINISTARTION_DELETE_SCUSSESS_TOAST");
                com.zespri.awct.util.NotificationHelper.showSuccessToast(sDeleteSuccessText);
                oController.getView().setBusy(false);
                // Navigate back to Library text maintenance details page after save
                oController.getRouter().navBack();
            };

            // function to perform to check error status of deleted library text
            var fnDeleteError = function(oError) {
                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                oController.getView().setBusy(false);
            };
            // local function to delete selected librarytext when user clicks in 'Yes' on the confirmation dialog
            var fnUserConfirmed = function() {
                // Remove data from the backend
                var sPathToDelete = "/LibraryTextSet('" + oController._oMaintainLibraryTextContext.getProperty("TextName") + "')";
                oController.getView().setBusy(true);
                oController.getView().getModel().remove(sPathToDelete, {
                    success : fnDeleteSuccess,
                    error : fnDeleteError
                });

            };
            // local function to close confirmation dialog when user clicks 'cancel' to stay on the same page
            var fnUserCancelled = function() {
            };

            // when data is there to delete, then this will call. and ask confirmation to user.

            if (oDeleteUpdatedEntity) {
                var sConfirmationText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMINISTRATION_LIBRARY_TEXT_DELETE_CONFIRMATION");
                com.zespri.awct.util.NotificationHelper.showConfirmDialog(sConfirmationText, fnUserConfirmed, fnUserCancelled);
            }

        },

        /**
         * Event handler for 'press' event of the 'Cancel' button to navigate back to library textlist view.
         * 
         * @memberOf com.zespri.awct.admin.view.LibrayTextDetails
         */
        handleCancelPress : function() {
            // Navigate back to Library text maintenance details page when click on Cancel
            this.getRouter().navBack();
        },

        /**
         * Helper to set the view to busy. Footer and view need to both be set to 'busy'
         * 
         * @private
         * @memberOf com.zespri.awct.admin.view.LibrayTextDetails
         * @param {Boolean}
         *            bBusy Indicates whether the view is to be set to busy state
         */
        _setViewBusy : function(bBusy) {
            this.getView().setBusyIndicatorDelay(0);
            this.getView().setBusy(bBusy);
            if (this.byId("libraryTextDetailPage").getFooter()) {
                this.byId("libraryTextDetailPage").getFooter().setBusy(bBusy);
            }

        },

        /**
         * Event handler for the 'OnBeforeNavigationWithUnsavedChanges' event that the custom router fires if the user tries to navigate away from the
         * view while there are unsaved changes.
         * 
         * @param {sap.ui.base.Event}
         *            oEvent The event object. The event object contains a parameter which contains a callback that should be invoked if the
         *            navigation should be allowed. If this callback is never invoked, the navigation stays cancelled.
         * @memberOf com.zespri.awct.admin.view.LibrayTextDetails
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
        }

    });

})();
