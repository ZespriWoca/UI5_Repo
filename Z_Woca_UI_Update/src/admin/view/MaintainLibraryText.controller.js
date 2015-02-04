(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });

    jQuery.sap.require("com.zespri.awct.util.CommonHelper");
    jQuery.sap.require("com.zespri.awct.util.Enums");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");

    /**
     * @classdesc This is the view for maintaining and adding library text
     * 
     * @class
     * @name com.zespri.awct.admin.view.MaintainLibraryText
     */

    com.zespri.awct.core.Controller.extend("com.zespri.awct.admin.view.MaintainLibraryText",
    /** @lends com.zespri.awct.admin.view.MaintainLibraryText */
    {

        /**
         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it
         * is displayed, to bind event handlers and do other one-time initialization.
         * 
         * @memberOf com.zespri.awct.admin.view.MaintainLibraryText
         */
        onInit : function() {
            /* START of instance member initialization */
            // Local map to track context paths against corresponding sequence changes
            this._mSequenceChanges = {};
            // Array to track all sap.m.Input controls that the user has changed. During 'save', their values need to be updated according to the
            // OData
            // model.
            this._aChangedSequenceInputs = [];
            // Array to store changed sequence values
            this._aLibraryTextListBatchChanges = [];
            // map to hold invalid sequence values in page
            this._aInValidSequenceChanges = [];
            // Private Instance variable for user authorization
            this._bUserAuthorized = false;
            /* END of instance member initialization */

            var oController = this;
            var oTable = this.byId("LibraryTextMaintenaceTable");
            // Manage NoData Texts , listen for LibraryTextMaintenaceTable update EVENT
            com.zespri.awct.util.CommonHelper.manageNoDataText(oTable);

            // Check if the route is for the MaintainLibraryText view
            this.getRouter().attachRoutePatternMatched(
                    function(oEvent) {
                        if (oEvent.getParameter("name") === "Administration/MaintainLibraryText") {
                            // Check the current user authorizations
                            if (!oController._bUserAuthorized) {
                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));
                                return;
                            }

                            // Check User Authorizations . If user is not allowed to maintain , don't allow to edit sequence input field and set
                            // visible = false for buttons.
                            if (com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Administration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZADM)) {
                                oController.byId("saveButton").setVisible(true);
                                oController.byId("discardButton").setVisible(true);
                                oController.byId("addTextButton").setVisible(true);
                                if (oController.byId("sequenceInput")) {
                                    oController.byId("sequenceInput").setEnabled(true);
                                }
                            }
                            // binding items for table
                            this._refreshTable();
                        }
                    }, this);
        },
        /**
         * This method will be called before rendering the View.
         * 
         * @memberOf com.zespri.awct.admin.view.MaintainLibraryText
         */
        onBeforeRendering : function() {
            // Check User Authorizations
            if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                    com.zespri.awct.util.Enums.AuthorizationObject.Administration, com.zespri.awct.util.Enums.AuthorizationFunctions.ZADM)) {
                if (this.byId("librarytextPage")) {
                    this.byId("librarytextPage").destroy();
                }
                this._bUserAuthorized = false;
            } else {
                this._bUserAuthorized = true;
            }
        },
        /**
         * Private method used to refresh library text table
         * 
         * @private
         * @memberOf com.zespri.awct.admin.view.MaintainLibraryText
         */
        _refreshTable : function() {

            var oTable = this.byId("LibraryTextMaintenaceTable");
            if (oTable.getBinding("items")) {
                oTable.getBinding("items").refresh();
            } else {
                // Create a binding on items for oTable items="{/LibraryTextSet}"
                oTable.bindItems({
                    path : "/LibraryTextSet",
                    template : oTable.getBindingInfo("items") ? oTable.getBindingInfo("items").template : oTable.getItems()[0].clone()
                });
            }
        },
        /**
         * Event handler to handle live changes in 'Sequence Field'.
         * 
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         * @memberOf com.zespri.awct.admin.view.MaintainLibraryText
         */
        handleSequenceLiveChange : function(oEvent) {

            var oSequence = oEvent.getSource();
            var oSequenceEntity = null;
            // current value
            var iCurrentSequenceVal = oSequence.getValue();

            var oSequenceBindingContext = oSequence.getBindingContext();
            var sContextPath = oSequenceBindingContext.getPath();

            // last saved value
            var iLastSeqVal = oSequenceBindingContext.getProperty("Sequence");

            // if last seq val is same as current seq val then there is no user changes in this row, simply return.
            if (iLastSeqVal === iCurrentSequenceVal) {
                // remove valid and invalid entry from map if user enters same value back.
                delete this._mSequenceChanges[sContextPath];
                // remove the sequence filed from array
                var iIndexofSequenceField = this._aInValidSequenceChanges.indexOf(oSequence);
                if (iIndexofSequenceField > -1) {
                    this._aInValidSequenceChanges.splice(iIndexofSequenceField, 1);
                }
                return;
            }
            // if user has changed seq val then excecute below statements.

            // check whether sequence value is a number and it is not empty
            if (!iCurrentSequenceVal || isNaN(iCurrentSequenceVal)) {
                oSequence.setValueState(sap.ui.core.ValueState.Error);
                oSequence.setValueStateText(com.zespri.awct.util.I18NHelper.getText("TXT_ADMINISTARTION_SEQUENCE_ERROR_VALUE_STATE_TEXT"));
                // map for having invalid entries of in table
                this._aInValidSequenceChanges.push(oSequence);

            } else {

                var iIndex = this._aInValidSequenceChanges.indexOf(oSequence);
                if (iIndex > -1) {
                    this._aInValidSequenceChanges.splice(iIndex, 1);
                }
                oSequenceEntity = {
                    "TextName" : oSequenceBindingContext.getProperty("TextName"),
                    "Sequence" : parseInt(iCurrentSequenceVal, 10) + "",
                    "Active" : oSequenceBindingContext.getProperty("Active"),
                    "Text" : oSequenceBindingContext.getProperty("Text")
                };

                oSequence.setValueState(sap.ui.core.ValueState.None);
                // Set 'dirty' state
                this.setHasUnsavedChanges(true);
                // map for having valid entries in table
                this._mSequenceChanges[sContextPath] = oSequenceEntity;
            }
        },
        /**
         * Redefining parent class method. Is invoked whenever 'dirty state' of the view changes.
         * 
         * @memberOf com.zespri.awct.admin.view.MaintainLibraryText
         * @param {Boolean}
         *            bDirty true if the view has unsaved changes, false otherwise
         */
        handleViewDirtyStateChanged : function(bDirty) {
            if (bDirty) {
                this.byId("saveButton").setEnabled(true);
                this.byId("discardButton").setEnabled(true);
            } else {
                this.byId("saveButton").setEnabled(false);
                this.byId("discardButton").setEnabled(false);
            }
        },

        /**
         * Event handler for 'selectionChange' event of the table.
         * 
         * @memberOf com.zespri.awct.admin.view.MaintainLibraryText
         */
        handleSelectedLibraryText : function() {

            var oTable = this.byId("LibraryTextMaintenaceTable");

            // Get Selected row from the Library text maintenance table
            var oTableContext = oTable.getSelectedItem().getBindingContext();
            // if user selects a value from the library text maintenance table then details button is enabled
            if (oTableContext) {
                this.byId("detailsButton").setEnabled(true);
            }
        },

        /**
         * Event handler for 'selectionChange' event of the table.
         * 
         * @memberOf com.zespri.awct.admin.view.MaintainLibraryText
         */
        handleAddLibraryText : function() {
            // if there is any unsaved changes then save and navigate to add text view
            if (Object.keys(this._mSequenceChanges).length > 0 || this._aInValidSequenceChanges.length > 0) {
                var bNavigate = true;
                this._save(bNavigate);
                return;
            }

            this.getRouter().navTo("Administration/MaintainLibraryTextDetail", {
                viewMode : com.zespri.awct.util.Enums.ViewMode.Add
            });
        },
        /**
         * Private function for 'save' functionality to call multiple times
         * 
         * @private
         * @param {boolean}
         *            bNavigate flag to check whether for navigation to detail after save
         * @memberOf com.zespri.awct.admin.view.MaintainLibraryText
         */
        _save : function(bNavigate) {

            var oController = this;

            // if there are any invalid sequence entries on table then inform user and return.
            if (this._aInValidSequenceChanges.length > 0) {
                var sErrorText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMINISTARTION_SEQUENCE_ERROR_VALUE_STATE_TEXT_BEFORE_SAVE_TOAST");
                com.zespri.awct.util.NotificationHelper.showErrorToast(sErrorText);
                return;
            }

            // Loop through all tracked quantity changes and create a batch request.
            var aBatchChanges = [];
            var oModel = this.getView().getModel();
            jQuery.each(this._mSequenceChanges, function(sPath, oEntity) {
                // sPath = The context path of the sequence update (this is the name of the property/key in the map)
                // oEntity = An object with key and sequence properties of 'LibraryText' entity
                var oBatchOperation = oModel.createBatchOperation(sPath, "PUT", oEntity);
                aBatchChanges.push(oBatchOperation);
            });

            // Just before starting the batch update...
            this._setViewBusy(true);

            var oTable = oController.byId("LibraryTextMaintenaceTable");
            var oTableContext = oTable.getSelectedItem().getBindingContext();

            // Private function to call 'fnOnAfterLibraryTextListTableUpdateFinished' for update the library text maintenance table after changes made
            var fnOnAfterLibraryTextListTableUpdateFinished = function() {
                // Navigate to Detail page after changes saved
                oController.getRouter().navTo("Administration/MaintainLibraryTextDetail", {
                    contextPath : oTableContext.getPath().substr(1),
                    viewMode : com.zespri.awct.util.Enums.ViewMode.Modify
                }, false);
                oTable.detachUpdateFinished(fnOnAfterLibraryTextListTableUpdateFinished);
            };

            // Fire this batch request!
            oModel.addBatchChangeOperations(aBatchChanges);
            oModel.submitBatch(function(oData, oResponse, aErrorResponses) {

                // show errors if any
                var bErrorMessageShown = com.zespri.awct.util.NotificationHelper.handleErrorMessage(aErrorResponses);

                jQuery.sap.log.info("Administration : Batch update was successful.");
                // Update dirty state
                oController.setHasUnsavedChanges(false);

                oController._aInValidSequenceChanges = [];
                oController._mSequenceChanges = {};
                oController._setViewBusy(false);

                if (!bErrorMessageShown) {
                    var sSaveSuccessText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMINISTARTION_SUCCESS_SAVE_TOAST");
                    com.zespri.awct.util.NotificationHelper.showSuccessToast(sSaveSuccessText);
                }

                // check whether '_sContextForNavigationAfterSave' has contain value or not. if 'yes' update the table with changes
                if (bNavigate) {
                    oController.byId("LibraryTextMaintenaceTable").attachUpdateFinished(fnOnAfterLibraryTextListTableUpdateFinished);
                }

            }, function(oError) {
                // Error!
                jQuery.sap.log.error("Administration : Batch update failed.");
                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                oController._setViewBusy(false);
            });
        },
        /**
         * Event handler for 'press' event of the 'Save' button
         * 
         * @memberOf com.zespri.awct.admin.view.MaintainLibraryText
         */
        handelSaveChanges : function() {

            // call the save functionality to save the changes to the backend
            var bNavigate = false;
            this._save(bNavigate);

        },

        /**
         * Event handler for 'change' event of the 'Search Field'. It will search the library text maintenance table based on search value
         * 
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         * @memberOf com.zespri.awct.admin.view.MaintainLibraryText
         */
        handleLibraryTextSearch : function(oEvent) {
            // if there is any unsaved changes then show toast to dicard changes
            if (Object.keys(this._mSequenceChanges).length > 0 || this._aInValidSequenceChanges.length > 0) {
                var sSaveSuccessText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMINISTARTION_LIBRARY_TEXT_SEARCH_DISCARD_CHANGES_TOAST");
                com.zespri.awct.util.NotificationHelper.showSuccessToast(sSaveSuccessText);
                return;
            }

            var aFilters = [];
            // get the query entered in the searchField
            var sQuery = oEvent.getSource().getValue();
            if (sQuery && sQuery.length > 0) {
                var oHeaderFilter = new sap.ui.model.Filter("TextName", sap.ui.model.FilterOperator.Contains, sQuery);
                aFilters.push(oHeaderFilter);
            }
            // update table
            this.byId("LibraryTextMaintenaceTable").getBinding("items").filter(aFilters);
        },

        /**
         * Event handler called when the library text table updation of items is finished
         * 
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         * @memberOf com.zespri.awct.admin.view.MaintainLibraryText
         */
        handleLibraryTextTableUpdateFinished : function(oEvent) {
            var oTable = oEvent.getSource();
            var aItems = oTable.getItems();
            if (aItems.length < 0) {
                // disabling details buttons when there is no rows in table
                this.getView().byId("detailsButton").setEnabled(false);
            }
        },

        /**
         * Event handler for 'press' event of the 'Detail' button. It will perform navigation to detail page
         * 
         * @memberOf com.zespri.awct.admin.view.MaintainLibraryText
         */

        handleDeatilPageNavigation : function() {

            var oTable = this.byId("LibraryTextMaintenaceTable");
            var oContext = oTable.getSelectedItem().getBindingContext();
            // if user has unsaved valid or invalid changes, go for save
            if (Object.keys(this._mSequenceChanges).length > 0 || this._aInValidSequenceChanges.length > 0) {
                var bNavigate = true;
                this._save(bNavigate);
            } else {
                this.getRouter().navTo("Administration/MaintainLibraryTextDetail", {
                    contextPath : oContext.getPath().substr(1),
                    viewMode : com.zespri.awct.util.Enums.ViewMode.Modify
                });
            }
        },
        /**
         * Helper to set the view to busy. Footer and view need to both be set to 'busy'
         * 
         * @private
         * @memberOf com.zespri.awct.admin.view.MaintainLibraryText
         * @param {Boolean}
         *            bBusy Indicates whether the view is to be set to busy state
         */
        _setViewBusy : function(bBusy) {
            this.getView().setBusy(bBusy);
            this.byId("librarytextPage").getFooter().setBusy(bBusy);
        },
        /**
         * Event handler for 'press' event of the 'discard changes' button.
         * 
         * @memberOf com.zespri.awct.admin.view.MaintainLibraryText
         */
        handelDiscardChanges : function() {

            // Show confirmation dialog to user before proceeding.
            var sConfirmDialogText = com.zespri.awct.util.I18NHelper.getText("TXT_ADMINISTRATION_LIBRARY_TEXT_CONFIRM_DELETE");

            // called when user confirms delete action
            var fnOnDeleteConfirmed = function() {
                // refresh the library text table
                this._refreshTable();
                // clear maps
                this._aInValidSequenceChanges = [];
                this._mSequenceChanges = {};
                // set dirty state as cleaned
                this.setHasUnsavedChanges(false);
            };
            com.zespri.awct.util.NotificationHelper.showConfirmDialog(sConfirmDialogText, $.proxy(fnOnDeleteConfirmed, this));
        }
    });
})();
