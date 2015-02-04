(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });

    jQuery.sap.require("com.zespri.awct.util.CommonFormatHelper");

    jQuery.sap.require("com.zespri.awct.util.I18NHelper");

    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");

    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");

    jQuery.sap.require("com.zespri.awct.util.ModelHelper");

    jQuery.sap.require("sap.ui.core.format.NumberFormat");

    /**
     * This the view controller for DeliverySwap Create . This view controller is used to initiate / Create a delivery swap to the system . User can
     * enter the swap quantity based on it , source and target swap quantities will change . validations are performed here based on user's swap
     * quantity input . Once Valid swap is Created , it will recorded in the backend .
     * 
     * @class
     * @name com.zespri.awct.collab.view.DeliverySwapCreate
     */
    com.zespri.awct.core.Controller.extend("com.zespri.awct.collab.view.DeliverySwapCreate",
    /** @lends com.zespri.awct.collab.view.DeliverySwapCreate */
    {

        // Track page scroll position , when table is refreshed (scroll to the last swap qty changed position)
        _iLastScrollPosition : null,

        // Local Map for storing "ALL" swap line for deep create (Map is used to avoid duplicate entry for "ALL" line in deep create entity)
        _mSwapAllLineEntity : {},

        // Local map to track context paths against corresponding Swap quantity changes
        _mSwapQuantityChanges : {},

        // Local map to track valid swap quantities , if invalid entry is there in the table .
        _mSwapQuantityChangesInInvalidState : {},

        // Map to Store ALL line entity
        _mSwapAllLine : {},

        // Array to track the Inputs (for swap quantity) that have an error state
        _aInvalidSwapQuantityInputs : [],

        // Mandatory facet filter list which user should select to view the delivery swap table
        _mMandatoryFilterValuesProvided : {
            DeliveryFrom : false,
            DeliveryTo : false
        },

        // Array to track the changed valid inputs
        _aChangedInputs : [],

        // Local variable for storing selected key of Delivery From. This will be used to check validations.
        _sDeliveryFromSelectedKey : null,

        // Local variable for storing selected key of Delivery To. This will be used to check validations.
        _sDeliveryToSelectedKey : null,

        // Local variable for storing selected key of shipment From. This will be used to check validations.
        _sShipmentFromSelectedKey : null,

        // Local variable for storing selected key of Shipment To. This will be used to check validations.
        _sShipmentToSelectedKey : null,

        // Private enum for record type
        _DeliverySwapRecordType : {
            DeliveryLine : "D",
            AllocationLine : "A"
        },

        /**
         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it
         * is displayed, to bind event handlers and do other one-time initialization.
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         */
        onInit : function() {
            // To make sure the user doesn't accidentally navigate away with unsaved changes...
            this.getRouter().attachOnBeforeNavigationWithUnsavedChanges(this.handleNavigationWithUnsavedChanges, this);
            // Private instance for View Batch Characteristics Dialog
            this._oViewBatchCharacteristicsDialog  =  null;
            
            // Check the incoming Route
            this.getRouter().attachRoutePatternMatched(function(oEvent) {
                if (oEvent.getParameter("name") === "Collaboration/DeliverySwapCreate") {
                    // Reset the view to initial state.
                    this._resetAllValues();
                }
            }, this);
        },
        /**
         * This method will reset all fields , map and table to initial state.
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         */
        _resetAllValues : function() {

            // Reset all lists within the facet filter
            var oFacetFilter = this.byId("facetFilterInitiateSwap");
            var aFacetFilterLists = oFacetFilter.getLists();

            jQuery.each(aFacetFilterLists, function(i, oList) {
                oList.setSelectedKeys();
            });

            // TODO : IS THIS NEEDED ?
            // To reset the facet filters
            this.byId("facetFilterInitiateSwap").rerender();

            // Reset the form and table to initial state .
            this._resetTable();

            // Reset the local variables and maps to initial state .
            this._sDeliveryFromSelectedKey = null;
            this._sDeliveryToSelectedKey = null;
            this._sShipmentFromSelectedKey = null;
            this._sShipmentToSelectedKey = null;
            this._mSwapAllLineEntity = {};
            this._iLastScrollPosition = null;
            this._mSwapQuantityChanges = {};
            this._mSwapQuantityChangesInInvalidState = {};
            this._mSwapAllLine = {};
            this._mMandatoryFilterValuesProvided.DeliveryFrom = false;
            this._mMandatoryFilterValuesProvided.DeliveryTo = false;
            this._aChangedInputs = [];

            // Set dirty = false
            this.setHasUnsavedChanges(false);
        },
        /**
         * Helper to set the view to busy. Footer and view need to both be set to 'busy'
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {Boolean}
         *            bBusy Indicates whether the view is to be set to busy state
         */
        _setViewBusy : function(bBusy) {
            this.getView().setBusy(bBusy);
            this.byId("createSwapPage").getFooter().setBusy(bBusy);
        },
        /**
         * This method will stop an action if current view is dirty and gives user a message about dirty .
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @returns {Boolean}
         */
        _stopActionIfViewDirty : function() {
            if (this.getHasUnsavedChanges()) {
                var sErrorText = com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_SAVE_CHANGES_FIRST_TOAST");
                com.zespri.awct.util.NotificationHelper.showErrorToast(sErrorText);
                return true;
            } else {
                return false;
            }
        },
        /**
         * Redefining parent class method. Is invoked whenever 'dirty state' of the view changes.
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {Boolean}
         *            bDirty true if the view has unsaved changes, false otherwise
         */
        handleViewDirtyStateChanged : function(bDirty) {
            if (bDirty) {
                this.byId("createSwapButton").setEnabled(true);
                this.byId("discardChangesButton").setEnabled(true);
                this.byId("facetFilterInitiateSwap").setEnabled(false);
            } else {
                this.byId("createSwapButton").setEnabled(false);
                this.byId("discardChangesButton").setEnabled(false);
                this.byId("facetFilterInitiateSwap").setEnabled(true);
            }
        },
        /**
         * This method will be triggered when user clicks back navigation button . This method will prompt user with dialog to proceed further. If
         * user clicks ok , it will navigate to corresponding page . Else , current page will stay.
         * 
         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
         * @param {sap.ui.base.Event}
         *            oEvent The event object
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
            var sText = com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_CONFIRM_DATA_LOSS");
            com.zespri.awct.util.NotificationHelper.showConfirmDialog(sText, fnOnUserConfirmDataLoss);
        },
        /**
         * This method will be triggered once user clicks reset icon in the facet filter. This method will change the selected filters to the initial
         * state
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         */
        handleFacetFilterReset : function() {
            // Prevent action if view has unsaved changes.
            if (this._stopActionIfViewDirty()) {
                return;
            }
            this._resetAllValues();
        },
        /**
         * This method will reset both the table
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         */
        _resetTable : function() {
            var oTable = this.byId("deliverySwapCreateTable");
            oTable.destroyItems();
            oTable.setNoDataText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_NO_DATA_TEXT_MANDATORY"));
        },

        /**
         * This method will triggered once user clicks Discard button . This method will prompt the user with dialog about the loss of data . If user
         * clicks ok , entered swap quantities will be removed from the table .
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         */
        handleDiscardChanges : function() {

            // Basic assertions
            jQuery.sap.assert(this.getHasUnsavedChanges(), "Cancel was clicked even though there is nothing to be saved!");

            // Inline function for what to do if the user confirms the 'Discard changes' action
            var oController = this;
            var fnOnDiscardChangesConfirmed = function() {
                // Clear all Line entity
                oController._mSwapAllLineEntity = {};

                // clear the last scroll position
                oController._iLastScrollPosition = null;

                // Clear the map of tracked quantity changes.
                oController._mSwapQuantityChanges = {};

                // Clear the map of tracked quantity changes after invalid input in th table
                oController._mSwapQuantityChangesInInvalidState = {};

                // Clear all value states for invalid inputs, and then clear the array
                jQuery.each(oController._aInvalidSwapQuantityInputs, function(i, oInput) {
                    oInput.setValueState(sap.ui.core.ValueState.None);
                });
                oController._aInvalidSwapQuantityInputs = [];

                // Clear the changed valid inputs back to original value.
                var oModel = oController.getView().getModel("initiateSwapLines");
                jQuery.each(oController._aChangedInputs, function(i, oContext) {
                    oModel.setProperty("/SwapQuantity", 0, oContext);
                    oController._updateDeliveryLine(oContext);
                });
                oController._aChangedInputs = [];

                // Set dirty = false
                oController.setHasUnsavedChanges(false);
                // Done!
                var sMessageText = com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_CHANGES_DISCARDED_TOAST");
                com.zespri.awct.util.NotificationHelper.showSuccessToast(sMessageText);
            };

            // Show confirmation dialog to user before proceeding.
            var sConfirmDialogText = com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_CONFIRM_DISCARD_CHANGES_DIALOG");
            com.zespri.awct.util.NotificationHelper.showConfirmDialog(sConfirmDialogText, fnOnDiscardChangesConfirmed);

        },
        /**
         * This method will be triggered once user clicks Create button. This method will Create the valid changes to the system . If there are any
         * invalid changes in the view, it will show error toast to clear the invalid entry .
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         */
        handleSwapCreate : function() {

            // Basic assertions
            jQuery.sap.assert(this.getHasUnsavedChanges(), "Create Swap was clicked even though there is nothing to be created!");

            jQuery.sap.assert(!jQuery.isEmptyObject(this._mSwapQuantityChanges),
                    "Create Swap was clicked even though there are no tracked quantity changes!");

            var oController = this;
            var oJSONModel = this.getView().getModel("initiateSwapLines");
            var oSwapData = oJSONModel.getData().results;
            var aSwapLineChanges = [];
            var oModel = this.getView().getModel();

            // If there are invalid inputs, show toast and abort processing.
            if (this._aInvalidSwapQuantityInputs.length !== 0) {
                var sInvalidInputErrorText = com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_BEFORE_SAVE_TOAST");
                com.zespri.awct.util.NotificationHelper.showErrorToast(sInvalidInputErrorText);
                return;
            }

            // Show Error toast for no swap quantity changes
            if (jQuery.isEmptyObject(this._mSwapQuantityChanges)) {
                var sErrorText = com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_NO_CHANGES_TOAST");
                com.zespri.awct.util.NotificationHelper.showErrorToast(sErrorText);
                return;
            }

            // check whether all "DeliveryLines (ALL)" swap quantities has been made ZERO .
            if (!jQuery.isEmptyObject(this._mSwapAllLine)) {
                var bAllowCreate = true;
                jQuery.each(this._mSwapAllLine, function(sPath, oSwapAllLineQuantity) {
                    if (Number(oSwapAllLineQuantity.NewQuantity)) {
                        bAllowCreate = false;
                        return;
                    }
                });
                if (!bAllowCreate) {
                    var sSwapQuantityErrorText = com.zespri.awct.util.I18NHelper
                            .getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_ALL_IS_NOT_ZERO_TOAST");
                    com.zespri.awct.util.NotificationHelper.showErrorDialog(sSwapQuantityErrorText);
                    return;
                }
            }

            // Inline function for what to do if the user confirms the 'Create Swap' action
            var fnOnCreateSwapConfirmed = function() {
                oController._setViewBusy(true);
                // Loop through all tracked quantity changes and create a batch request.
                jQuery.each(oController._mSwapQuantityChanges, function(sPath, oSwapEntity) {
                    // sPath = The context path of the quantity update (this is the name of the property/key in the map)
                    // oSwapEntity = An object with key and quantity properties of 'Swap' entity

                    var oSwapEntityDeliveryLineID = oSwapEntity.SourceDeliveryLineID;

                    // Loop through the JSON model and create entry in map for all line (Map is used to avoid duplicate entry)
                    for ( var i = 0; i < oSwapData.length; i++) {

                        if ((oSwapData[i].SourceDeliveryLineID === oSwapEntityDeliveryLineID) && (!Number(oSwapData[i].SourceAllocationLineID))) {

                            // Source and Target allocation / deliveryLine Update Time can be empty . If it is empty , create swapEntity object with
                            // respective update time null.
                            var sSourceAllocationUpdateTime = com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(
                                    oSwapData[i].SourceAllocationUpdateTime, true) !== "" ? com.zespri.awct.util.CommonFormatHelper
                                    .formatJSDateToEDMDateTimeString(oSwapData[i].SourceAllocationUpdateTime, true) : null;

                            var sTargetAllocationUpdateTime = com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(
                                    oSwapData[i].TargetAllocationUpdateTime, true) !== "" ? com.zespri.awct.util.CommonFormatHelper
                                    .formatJSDateToEDMDateTimeString(oSwapData[i].TargetAllocationUpdateTime, true) : null;

                            var sTargetDeliveryLineUpdateTime = com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(
                                    oSwapData[i].TargetDeliveryLineUpdateTime, true) !== "" ? com.zespri.awct.util.CommonFormatHelper
                                    .formatJSDateToEDMDateTimeString(oSwapData[i].TargetDeliveryLineUpdateTime, true) : null;

                            // Create swap entity object for "All" Line
                            var oSwapAllLineEntity = {
                                'RecordType' : oController._DeliverySwapRecordType.DeliveryLine,
                                'SourceDeliveryLineID' : oSwapData[i].SourceDeliveryLineID,
                                'SourceAllocationLineID' : oSwapData[i].SourceAllocationLineID,
                                'SourceDeliveryLineUpdateTime' : com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(
                                        oSwapData[i].SourceDeliveryLineUpdateTime, true),
                                'SourceAllocationUpdateTime' : sSourceAllocationUpdateTime,
                                'TargetDeliveryLineID' : oSwapData[i].TargetDeliveryLineID,
                                'TargetAllocationLineID' : oSwapData[i].TargetAllocationLineID,
                                'TargetDeliveryLineUpdateTime' : sTargetDeliveryLineUpdateTime,
                                'TargetAllocationUpdateTime' : sTargetAllocationUpdateTime,
                                'SwapQuantity' : parseFloat(oSwapData[i].SwapQuantity) + ""
                            };
                            // create path for map
                            var sSwapAllLinePath = oSwapData[i].DeliveryAllocationID;
                            oController._mSwapAllLineEntity[sSwapAllLinePath] = oSwapAllLineEntity;
                        }
                    }

                    // create array of swapLines to be created
                    aSwapLineChanges.push(oSwapEntity);
                });

                // loop through the "ALL" line entity and push it to the array for DEEP create
                jQuery.each(oController._mSwapAllLineEntity, function(sSwapAllLinePath, oSwapAllLineEntity) {
                    aSwapLineChanges.push(oSwapAllLineEntity);
                });
                // create the delivery swap line object for deep create
                var oDeliverySwapLineToCreate = {
                    "SourceShipmentID" : oController._sShipmentFromSelectedKey,
                    "SourceDeliveryNumber" : oController._sDeliveryFromSelectedKey,
                    "TargetShipmentID" : oController._sShipmentToSelectedKey,
                    "TargetDeliveryNumber" : oController._sDeliveryToSelectedKey,
                    "DeliverySwapLineSet" : aSwapLineChanges
                };

                var sPath = "/DeliverySwapSet";
                oModel.create(sPath, oDeliverySwapLineToCreate, {
                    success : function() {
                        oController._setViewBusy(false);
                        jQuery.sap.log.info("Swap : Create was successful.");
                        oController._aChangedInputs = [];
                        // Update dirty state
                        oController.setHasUnsavedChanges(false);
                        oController.getRouter().navTo("Collaboration/DeliverySwapListing");
                        window.setTimeout(function() {
                            var sSuccessText = com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_SUCCESS_CREATE_TOAST");
                            com.zespri.awct.util.NotificationHelper.showSuccessToast(sSuccessText);
                        }, 500);
                    },
                    error : function() {
                        oController._setViewBusy(false);
                        jQuery.sap.log.error("Swap : Create failed.");
                        var sErrorText = com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_ERROR_DURING_CREATE_TOAST");
                        com.zespri.awct.util.NotificationHelper.showErrorDialog(sErrorText);
                    },
                    async : true
                });
            };

            // Show confirmation dialog to user before proceeding.
            var sConfirmDialogText = com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_CONFIRM_CREATE_SWAP_DIALOG", [
                    oController._sDeliveryFromSelectedKey, oController._sDeliveryToSelectedKey]);
            com.zespri.awct.util.NotificationHelper.showConfirmDialog(sConfirmDialogText, fnOnCreateSwapConfirmed);

        },
        /**
         * This method will triggered when user opens the facte filter list . This method will create the JSON Model for each filter and set it . JSON
         * Model will be used for live search .
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        handleListOpen : function(oEvent) {
            // find the key of selected facet filter list
            var sSelectedFilterListKey = oEvent.getSource().getKey();
            var oController = this;

            var sCurrentSeason = sap.ui.getCore().getRootComponent().getApplicationParameters().CurrentSeason;

            // check the filter which is triggered
            switch (sSelectedFilterListKey) {

                case "Supplier" :
                    // Preparing Supplier Facet Filter List
                    var oSupplierList = this.byId("facetFilterListSupplier");
                    if (!oSupplierList.getBinding("items")) {
                        oSupplierList.setBusy(true);
                        com.zespri.awct.util.ModelHelper.getJSONModelForRead("/SupplierSet", {
                            urlParameters : {
                                "$filter" : "UserID eq '" + oController.getView().getModel("currentUserDetails").getProperty("/UserID") + "'"
                            }
                        }, function(oModel) {
                            // Success
                            oController._bindResultOnSuccess(oModel, oSupplierList);
                            oSupplierList.setBusy(false);
                        });
                    } else {
                        oSupplierList.setBusy(false);
                    }

                    break;

                case "SourceShipmentID" :
                    // Preparing Shipment From Facet Filter List
                    var oShipmentIDList = this.byId("facetFilterListShipmentFrom");

                    if (!oShipmentIDList.getBinding("items")) {
                        oShipmentIDList.setBusy(true);
                        com.zespri.awct.util.ModelHelper.getJSONModelForRead("/ShipmentSet", {
                            urlParameters : {
                                "$select" : "ShipmentID",
                                "$filter" : "Season eq '" + sCurrentSeason + "'"
                            }
                        }, function(oModel) {
                            // Success
                            oController._bindResultOnSuccess(oModel, oShipmentIDList);
                            oShipmentIDList.setBusy(false);
                        });
                    } else {
                        oShipmentIDList.setBusy(false);
                    }

                    break;

                case "TargetShipmentID" :
                    // Preparing Shipment To Facet Filter List
                    var oShipmentToIDList = this.byId("facetFilterListShipmentTo");

                    if (!oShipmentToIDList.getBinding("items")) {
                        oShipmentToIDList.setBusy(true);
                        com.zespri.awct.util.ModelHelper.getJSONModelForRead("/ShipmentSet", {
                            urlParameters : {
                                "$select" : "ShipmentID",
                                "$filter" : "Season eq '" + sCurrentSeason + "'"
                            }
                        }, function(oModel) {
                            // Success
                            oController._bindResultOnSuccess(oModel, oShipmentToIDList);
                            oShipmentToIDList.setBusy(false);
                        });
                    } else {
                        oShipmentToIDList.setBusy(false);
                    }
                    break;
                case "SourceContainerID" :
                    // Preparing Container Facet Filter List
                    var oContainerIDList = this.byId("facetFilterListContainerID");

                    if (!oContainerIDList.getBinding("items")) {
                        oContainerIDList.setBusy(true);
                        com.zespri.awct.util.ModelHelper.getJSONModelForRead("/ContainerSet", {
                            urlParameters : {
                                "$select" : "ContainerID"
                            }
                        }, function(oModel) {
                            // Success
                            oController._bindResultOnSuccess(oModel, oContainerIDList);
                            oContainerIDList.setBusy(false);
                        });
                    } else {
                        oContainerIDList.setBusy(false);
                    }

                    break;
                case "Characteristic/Brand" :
                    // Preparing Brand Facet Filter List
                    var oBrandList = this.byId("facetFilterListBrand");

                    if (!oBrandList.getBinding("items")) {
                        oBrandList.setBusy(true);
                        com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GenericSearchSet", {
                            urlParameters : {
                                "$filter" : "Scenario eq 'BRAND'"
                            }
                        }, function(oModel) {
                            // Success
                            oController._bindResultOnSuccess(oModel, oBrandList);
                            oBrandList.setBusy(false);
                        });
                    } else {
                        oBrandList.setBusy(false);
                    }

                    break;

                case "Characteristic/Variety" :
                    // Preparing Variety Facet Filter List
                    var oVarietyList = this.byId("facetFilterListVariety");

                    if (!oVarietyList.getBinding("items")) {
                        oVarietyList.setBusy(true);
                        com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GenericSearchSet", {
                            urlParameters : {
                                "$filter" : "Scenario eq 'VARIETY'"
                            }
                        }, function(oModel) {
                            // Success
                            oController._bindResultOnSuccess(oModel, oVarietyList);
                            oVarietyList.setBusy(false);
                        });

                    } else {
                        oVarietyList.setBusy(false);
                    }
                    break;

                case "Characteristic/Class" :
                    // Preparing Class Facet Filter List
                    var oClassList = this.byId("facetFilterListClass");

                    if (!oClassList.getBinding("items")) {
                        oClassList.setBusy(true);
                        com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GenericSearchSet", {
                            urlParameters : {
                                "$filter" : "Scenario eq 'CLASS'"
                            }
                        }, function(oModel) {
                            // Success
                            oController._bindResultOnSuccess(oModel, oClassList);
                            oClassList.setBusy(false);
                        });

                    } else {
                        oClassList.setBusy(false);
                    }
                    break;

                case "Characteristic/GrowingMethod" :
                    // Preparing Growing Method Facet Filter List
                    var oGrowingMethodList = this.byId("facetFilterListGrowingMethod");

                    if (!oGrowingMethodList.getBinding("items")) {
                        oGrowingMethodList.setBusy(true);
                        com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GenericSearchSet", {
                            urlParameters : {
                                "$filter" : "Scenario eq 'GROWINGMETHOD'"
                            }
                        }, function(oModel) {
                            // Success
                            oController._bindResultOnSuccess(oModel, oGrowingMethodList);
                            oGrowingMethodList.setBusy(false);
                        });
                    } else {
                        oGrowingMethodList.setBusy(false);
                    }

                    break;

                case "Characteristic/Stack" :
                    // Preparing Stack Facet Filter List
                    var oStackList = this.byId("facetFilterListStack");

                    if (!oStackList.getBinding("items")) {
                        oStackList.setBusy(true);
                        com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GenericSearchSet", {
                            urlParameters : {
                                "$filter" : "Scenario eq 'STACK'"
                            }
                        }, function(oModel) {
                            // Success
                            oController._bindResultOnSuccess(oModel, oStackList);
                            oStackList.setBusy(false);
                        });

                    } else {
                        oStackList.setBusy(false);
                    }

                    break;

                case "Characteristic/PackStyle" :
                    // Preparing Pack Style Facet Filter List
                    var oPackList = this.byId("facetFilterListPackStyle");

                    if (!oPackList.getBinding("items")) {
                        oPackList.setBusy(true);
                        com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GenericSearchSet", {
                            urlParameters : {
                                "$filter" : "Scenario eq 'PACK_STYLE'"
                            }
                        }, function(oModel) {
                            // Success
                            oController._bindResultOnSuccess(oModel, oPackList);
                            oPackList.setBusy(false);
                        });

                    } else {
                        oPackList.setBusy(false);
                    }

                    break;

                case "Characteristic/Size" :
                    // Preparing Size Facet Filter List
                    var oSizeList = this.byId("facetFilterListSize");

                    if (!oSizeList.getBinding("items")) {
                        oSizeList.setBusy(true);
                        com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GenericSearchSet", {
                            urlParameters : {
                                "$filter" : "Scenario eq 'SIZE'"
                            }
                        }, function(oModel) {
                            // Success
                            oController._bindResultOnSuccess(oModel, oSizeList);
                            oSizeList.setBusy(false);
                        });

                    } else {
                        oSizeList.setBusy(false);
                    }
                    break;

                case "Characteristic/Label" :
                    // Preparing Label Facet Filter List
                    var oLabelList = this.byId("facetFilterListLabel");

                    if (!oLabelList.getBinding("items")) {
                        oLabelList.setBusy(true);
                        com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GenericSearchSet", {
                            urlParameters : {
                                "$filter" : "Scenario eq 'LABEL'"
                            }
                        }, function(oModel) {
                            // Success
                            oController._bindResultOnSuccess(oModel, oLabelList);
                            oLabelList.setBusy(false);
                        });

                    } else {
                        oLabelList.setBusy(false);
                    }

                    break;
            }
        },
        /**
         * This method will be triggered when dependent lists are opened . This method will check whether shipment list is selected and filter the
         * delivery list , Otherwise no filter will be applied on Delivery HeaderSet
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {sap.ui.base.Event}
         *            oEvent The event Object
         */
        handleDependentListOpen : function(oEvent) {
            var oSource = oEvent.getSource();
            var sSelectedFilterListKey = oEvent.getSource().getKey();
            var oController = this;

            // check the filter which is triggered
            switch (sSelectedFilterListKey) {
                case "SourceDeliveryNumber" :

                    var sSelectedSourceShipment = this.byId("facetFilterListShipmentFrom").getSelectedItem();
                    var fnSuccess = function(oJSONModel) {
                        // Success
                        oController._bindResultOnSuccess(oJSONModel, oSource);
                        oSource.setBusy(false);
                    };
                    oSource.setBusy(true);
                    if (sSelectedSourceShipment) {
                        var sSelectedSourceShipmentKey = sSelectedSourceShipment.getKey();
                        com.zespri.awct.util.ModelHelper.getJSONModelForRead("/DeliveryHeaderSet", {
                            urlParameters : {
                                "$filter" : "ShipmentID eq '" + sSelectedSourceShipmentKey + "'"
                            }
                        }, fnSuccess);
                    } else {
                        com.zespri.awct.util.ModelHelper.getJSONModelForRead("/DeliveryHeaderSet", {}, fnSuccess);
                    }

                    break;
                case "TargetDeliveryNumber" :
                    var sSelectedTargetShipment = this.byId("facetFilterListShipmentTo").getSelectedItem();
                    oSource.setBusy(true);
                    var fnSuccess = function(oJSONModel) {
                        // Success
                        oController._bindResultOnSuccess(oJSONModel, oSource);
                        oSource.setBusy(false);
                    };
                    if (sSelectedTargetShipment) {
                        var sSelectedTargetShipmentKey = sSelectedTargetShipment.getKey();
                        com.zespri.awct.util.ModelHelper.getJSONModelForRead("/DeliveryHeaderSet", {
                            urlParameters : {
                                "$filter" : "ShipmentID eq '" + sSelectedTargetShipmentKey + "'"
                            }
                        }, fnSuccess);
                    } else {
                        com.zespri.awct.util.ModelHelper.getJSONModelForRead("/DeliveryHeaderSet", {}, fnSuccess);
                    }
                    break;
            }
        },
        /**
         * This method is called from the success handler after creating a JSON Model, to bind the result to the Control passed as parameter.
         * 
         * @Private
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {sap.ui.model.json.JSONModel}
         *            oJSONModel The JSONmodel object
         * @param {com.zespri.awct.control.FacetFilterList}
         *            oFacetFilterList The filter list to which result is bound
         * 
         */
        _bindResultOnSuccess : function(oJSONModel, oFacetFilterList) {
            oFacetFilterList.setModel(oJSONModel);
            oFacetFilterList.bindItems({
                path : "/results",
                template : oFacetFilterList.getBindingInfo("items")
                        ? oFacetFilterList.getBindingInfo("items").template
                        : oFacetFilterList.getItems()[0].clone()
            });
        },

        /**
         * This method will be triggered once user close the facet filter . Dependent facet lists will loaded based on the user selections .
         * Validations are performed for same items filter selections amd mandatory filter selections.
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {sap.ui.base.Event}
         *            oEvent The event Object
         */
        handleFacetFilterClose : function(oEvent) {
            var oSource = oEvent.getSource();
            var sSelectedFilterListKey = oEvent.getSource().getKey();
            var oController = this;
            var oFacetFilter = this.byId("facetFilterInitiateSwap");
            var bFacetFilterModified = oFacetFilter.getFiltersModifiedAfterListOpen();

            // if facet filter is not modified ,return .
            if (!bFacetFilterModified) {
                return;
            }
            // check the filter which is triggered
            switch (sSelectedFilterListKey) {

                case "SourceShipmentID" :
                    // if the closed list is shipment From bind the delivery from list

                    if (this._sShipmentFromSelectedKey !== oSource.getSelectedItem().getKey()) {
                        this._sShipmentFromSelectedKey = oSource.getSelectedItem().getKey();
                        var oDeliveryFromFacetFilter = oController.byId("facetFilterListDeliveryFrom");
                        // Remove the selections of dependent lists
                        oDeliveryFromFacetFilter.setSelectedKeys();

                        // Set the corresponding mandatory flags
                        this._mMandatoryFilterValuesProvided.DeliveryFrom = false;
                    }
                    break;
                case "TargetShipmentID" :
                    // if the closed list is shipment To bind the delivery To list

                    if (this._sShipmentToSelectedKey !== oSource.getSelectedItem().getKey()) {
                        this._sShipmentToSelectedKey = oSource.getSelectedItem().getKey();
                        var oDeliveryToFacetFilter = oController.byId("facetFilterListDeliveryTo");
                        // Remove the selections of dependent lists
                        oDeliveryToFacetFilter.setSelectedKeys();

                        // Set the corresponding mandatory flags
                        this._mMandatoryFilterValuesProvided.DeliveryTo = false;
                    }
                    break;

                case "SourceDeliveryNumber" :
                    this._sDeliveryFromSelectedKey = oSource.getSelectedItem().getKey();
                    this._mMandatoryFilterValuesProvided.DeliveryFrom = true;
                    oSource.clearSearchField();
                    break;
                case "TargetDeliveryNumber" :
                    this._sDeliveryToSelectedKey = oSource.getSelectedItem().getKey();
                    this._mMandatoryFilterValuesProvided.DeliveryTo = true;
                    oSource.clearSearchField();
                    break;
            }

            // Check whether delivery from / to and shipment from /To combination is same
            // If yes , then show the error dialog
            if (this._sDeliveryFromSelectedKey && this._sDeliveryToSelectedKey && (this._sDeliveryFromSelectedKey === this._sDeliveryToSelectedKey)) {
                if (oSource === this.byId("facetFilterListDeliveryFrom")) {
                    oSource.setSelectedKeys();
                    this._mMandatoryFilterValuesProvided.DeliveryFrom = false;
                } else if (oSource === this.byId("facetFilterListDeliveryTo")) {
                    oSource.setSelectedKeys();
                    this._mMandatoryFilterValuesProvided.DeliveryTo = false;
                }

                // Show the error toast
                var sErrorText = com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_FACET_FILTER_VALIDATIONS");
                com.zespri.awct.util.NotificationHelper.showErrorToast(sErrorText);
            }

            // Check whether all mandatory facet filter list items are selected ,
            // If yes , the bind the items to table based on facte filter selected items
            // Else , reset the table .
            if (this._mMandatoryFilterValuesProvided.DeliveryFrom && this._mMandatoryFilterValuesProvided.DeliveryTo) {

                var oTable = this.byId("deliverySwapCreateTable");
                oTable.setNoDataText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_NO_DATA_TEXT"));

                this._bindItemsToTable();
            } else {
                this._resetTable();
            }

        },

        /**
         * Factory function for creating list items for the table. The template for each row is different based on whether it represents a delivery
         * line (All line) or an allocation line (Supplier order line).
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {String}
         *            sId The unique ID for each list item provided by the framework.
         * @param {sap.ui.model.Context}
         *            The context for which a new list item instance is being created by the factory function.
         */
        _createTableColumnListItem : function(sId, oContext) {
            var oTableListItem;
            if (oContext.getProperty("RecordType") === this._DeliverySwapRecordType.DeliveryLine) {
                oTableListItem = sap.ui.xmlfragment("com.zespri.awct.collab.fragment.DeliverySwapDeliveryLineTemplate", this).setBindingContext(
                        oContext);
            } else {
                oTableListItem = sap.ui.xmlfragment("com.zespri.awct.collab.fragment.DeliverySwapAllocationLineTemplate", this).setBindingContext(
                        oContext);
            }

            return oTableListItem;
        },
        /**
         * This method will bind the items to the table based on facet filter selected items.
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {sap.ui.model.Filter}
         *            oFacetFilter Filters based on selected filter items
         */
        _bindItemsToTable : function() {

            var oController = this;
            var oTable = this.byId("deliverySwapCreateTable");
            var sFilterString = this._formFilterString();
            // Update the binding of the 'items' aggregation of the table
            // Success handler
            var fnReadSuccess = function(oJSONModel) {
                oJSONModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
                oController.getView().setModel(oJSONModel, "initiateSwapLines");

                // Bind the local json model to the table
                var oBindingInfo = {
                    path : 'initiateSwapLines>/results',
                    factory : jQuery.proxy(oController._createTableColumnListItem, oController)
                };
                oTable.bindItems(oBindingInfo);

                // add ALL line to _mSwapAllLine map
                var oModel = oController.getView().getModel("initiateSwapLines");
                var oModelCount = oModel.getData().results.length;
                var oResults = oModel.getData().results;
                // Loop through the model
                for ( var i = 0; i < oModelCount; i++) {
                    if (oResults[i].SourceDeliveryLineID && !Number(oResults[i].SourceAllocationLineID)
                            && oResults[i].RecordType === oController._DeliverySwapRecordType.DeliveryLine) {
                        // create the path for Map
                        var sPath = oResults[i].SourceDeliveryLineID + oResults[i].SourceAllocationLineID;
                        var oSwapQuantityValues = {
                            "OldQuantity" : oResults[i].SwapQuantity,
                            "NewQuantity" : oResults[i].SwapQuantity
                        };
                        oController._mSwapAllLine[sPath] = oSwapQuantityValues;
                    }
                }

                oTable.setBusy(false);
            };

            // Error handler for this read
            var fnReadError = function() {
                var sErrorText = com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_FACET_FILTER_QUERY_ERROR_MESSAGE");
                com.zespri.awct.util.NotificationHelper.showErrorDialog(sErrorText);
                oTable.setBusy(false);
            };
            oTable.setBusyIndicatorDelay(0);
            oTable.setBusy(true);

            // Trigger the read
            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/SwapOpportunitySet", {
                urlParameters : {
                    "$filter" : sFilterString
                }
            }, fnReadSuccess, fnReadError);

        },
        /**
         * This method will form the filter string based on the selected filterList items from the facet filter.
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate returns sFilterString Filter string to be used in urlParameters for querying
         *           swapOpportunitySet
         */
        _formFilterString : function() {
            var oFacetFilter = this.byId("facetFilterInitiateSwap");
            // Create filters based on facet filter selections
            var aFacetFilterLists = oFacetFilter.getLists();
            var sFilterString = "";
            // boolean to indicate "and" to the each filter lists which is selected.
            var bIsOuterFilterApplied = true;

            // Loop through the facetFilters to form the filter string
            $.each(aFacetFilterLists, function(i, oList) {
                if (oList.getSelectedItems().length > 0) {
                    // Get the Filter list key
                    var oListKey = oList.getKey();
                    // Loop through each FilterList and form firlterString
                    $.each(oList.getSelectedItems(), function(j, oSelectedItem) {
                        // get the selectedItem inside the filter list
                        var oSelectedItemKey = oSelectedItem.getKey();
                        if (sFilterString && !bIsOuterFilterApplied) {
                            // if FilterString has initialised (multi select)
                            // Represents the filters created for each selection WITHIN a facet list. Multiple selections within the same list need
                            // to be 'OR'ed together.

                            // Checking whether the Filter String already contains brackets
                            if (sFilterString[sFilterString.length - 1] !== ")") {
                                // Getting the index after 'and '
                                var iFilterStringTillAnd = sFilterString.lastIndexOf("and") + 4;
                                // Check whether 'and' exist in the string or not
                                if (sFilterString.lastIndexOf("and") !== -1) {
                                    // Appending the braces to the string. After the last 'and' and then closing with the closing braces
                                    sFilterString = sFilterString.substring(0, iFilterStringTillAnd) + "("
                                            + sFilterString.substring(iFilterStringTillAnd, sFilterString.length);
                                    sFilterString = sFilterString + " or " + oListKey + " eq '" + oSelectedItemKey + "')";
                                } else {
                                    // If 'and' is not existing
                                    sFilterString = sFilterString + " or " + oListKey + " eq '" + oSelectedItemKey + "'";
                                }

                            } else {
                                // If the filter string already contains braces then remove the ending braces and add the ending braces after
                                // concatenating with the new string
                                sFilterString = sFilterString.substring(0, sFilterString.length - 1);
                                sFilterString = sFilterString + " or " + oListKey + " eq '" + oSelectedItemKey + "')";
                            }
                        } else if (sFilterString && bIsOuterFilterApplied) {
                            // if FilterString has initialised(contains filters ) and
                            // "AND" should be applied for grouping different facet filter list selection.
                            sFilterString = sFilterString + " and " + oListKey + " eq '" + oSelectedItemKey + "'";
                            bIsOuterFilterApplied = false;
                        } else {
                            // if FilterString has not been initialised (no filters , for the first time)
                            sFilterString = oListKey + " eq '" + oSelectedItemKey + "'";
                            bIsOuterFilterApplied = false;
                        }

                    });

                    // If FilterString contains filters , it should be "And" ed together
                    if (sFilterString) {
                        // "AND" should be used to group multiple facet filter lists
                        bIsOuterFilterApplied = true;
                    }

                }
            });

            return sFilterString;

        },

        /**
         * This method will update the delivery line based on enetered swap quantity.
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {sap.ui.model.Context}
         *            oBindingContext Context of selected Line Item
         */
        _updateDeliveryLine : function(oBindingContext) {
            var oTable = this.byId("deliverySwapCreateTable");
            var sDeliveryLineID = oBindingContext.getProperty("SourceDeliveryLineID");

            // Get the delivery swap JSON Model Object
            var oResults = oBindingContext.getModel().getData().results;
            var iSwapCount = oResults.length;
            var iDeliveryLineIndex = null;
            var iDeliveryAllocationLineSwapQty = null;
            var iSumOfSwapQty = 0;
            var oController = this;
            var sPath;

            // loop the results of JSON model object and update the delivery line
            for ( var i = 0; i < iSwapCount; i++) {

                // Check whether the entry is for DELIVERY LINE (AllocationID should be empty , DeliveryLineID should be equal to selected
                // Delivery line ID).
                // If yes , get the position and quantities.
                if (oResults[i].SourceDeliveryLineID === sDeliveryLineID && (!Number(oResults[i].SourceAllocationLineID))
                        && oResults[i].RecordType === this._DeliverySwapRecordType.DeliveryLine) {
                    iDeliveryLineIndex = i;
                    sPath = oResults[i].SourceDeliveryLineID + oResults[i].SourceAllocationLineID;
                    iDeliveryAllocationLineSwapQty = Number(this._mSwapAllLine[sPath].OldQuantity);
                }

                // if current entry in the loop is selected allocation line , sum up the swap quantity
                if (oResults[i].SourceDeliveryLineID === sDeliveryLineID && Number(oResults[i].SourceAllocationLineID)) {
                    iSumOfSwapQty = iSumOfSwapQty + Number(oResults[i].SwapQuantity);
                }
            }
            if (iDeliveryLineIndex != null) {
                oResults[iDeliveryLineIndex].SwapQuantity = iDeliveryAllocationLineSwapQty + Number(iSumOfSwapQty);
                this._mSwapAllLine[sPath].NewQuantity = Number(oResults[iDeliveryLineIndex].SwapQuantity);
            }

            // refresh the table
            oTable.getBinding("items").refresh(true);

            oTable.attachUpdateFinished(function() {
                if (oController._iLastScrollPosition) {
                    // Scroll to the last swap qty changed position
                    var oPageDom = oController.byId("createSwapPage").getDomRef();
                    var oPageSectionDom = oPageDom.getElementsByTagName("section").item();
                    oPageSectionDom.scrollTop = oController._iLastScrollPosition;
                }
            });
        },

        /**
         * This method will check the entered swap qty and do the validations based on constraints. If all validations are passed , it will push the
         * particular entry into array which has to be Created . else, push the entry into invalid array. This method also updates the source new and
         * target new quantities of allocation line and delivery line.
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {sap.ui.base.Event}
         *            oEvent The event Object
         */
        handleSwapQtyChange : function(oEvent) {
            // Set view as 'dirty' (core controller method)
            this.setHasUnsavedChanges(true);
            var oSource = oEvent.getSource();
            var iSwapQuantity = oEvent.getParameter("value");
            var oModel = this.getView().getModel("initiateSwapLines");
            var oBindingContext = oEvent.getSource().getBindingContext();

            // get the scroll position (to be used when table is getting refreshed)
            var oPageDom = this.byId("createSwapPage").getDomRef();
            var oPageSectionDom = oPageDom.getElementsByTagName("section").item();
            this._iLastScrollPosition = oPageSectionDom.scrollTop;

            // if the entered swap qty is not a number , show error state
            if (isNaN(iSwapQuantity)) {
                oSource.setValueState(sap.ui.core.ValueState.Error);
                oSource.setValueStateText(com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_VALIDATION_ENTER_NUMBER"));

                // Check whether current source exists in the invalid array and push into it.
                this._checkCurrentSourceExistInInvalidInputArray(oSource);

            } else if (!iSwapQuantity || (Number(iSwapQuantity) === 0)) { // If swap qty is number , but not a valid number(EMPTY)
                // this block will be called when user clears the swap input field
                // If invalid input array is not empty
                if (this._aInvalidSwapQuantityInputs.length !== 0) {
                    var iIndex = this._aInvalidSwapQuantityInputs.indexOf(oEvent.getSource());

                    // if current entry was invalid and we are changing to valid entry(empty) , remove it from the invalid array
                    if (iIndex > -1) {
                        this._aInvalidSwapQuantityInputs.splice(iIndex, 1);
                        var sPath = oBindingContext.getPath();
                        // push the entry into valid changes after invalid changes
                        // if we have multiple invalid inputs , and we are clearing it then it will be added to valid inputs after invalid
                        // changes
                        this._mSwapQuantityChangesInInvalidState[sPath] = iSwapQuantity;
                        oSource.setValueState(sap.ui.core.ValueState.None);

                        // check if there is any valid inputs after invalid inputs is entered .
                        this._addValidInputToMapForCreate(oBindingContext);

                        if (this._aInvalidSwapQuantityInputs.length) {
                            // If invalid Inputs are zero , then also add the current entry into valid changes after invalid input
                            this._mSwapQuantityChangesInInvalidState[sPath] = iSwapQuantity;
                        }

                        return;
                    }

                }

                oModel.setProperty("/SwapQuantity", 0, oBindingContext);
                this._updateDeliveryLine(oBindingContext);
                var sPathToDelete = oBindingContext.getPath();
                if (!jQuery.isEmptyObject(this._mSwapQuantityChanges)) {
                    delete this._mSwapQuantityChanges[sPathToDelete];
                }
                return;
            } else {

                if (Number(iSwapQuantity) < 0) {
                    oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
                    oEvent.getSource().setValueStateText(
                            com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_VALIDATION_SWAP_QUANTITY_POSITIVE"));
                    // Check whether current source exists in the invalid array and push into it.
                    this._checkCurrentSourceExistInInvalidInputArray(oSource);
                    return;
                }

                // If the enetered swap qty is a number .
                var iSourceOldQty = parseInt(oBindingContext.getProperty("SourceAllocationQuantity"), 10);

                // check the constraints based on +ve and -ve entry .
                // if enetered value is +ve , then it should be lower than or equal to source old qty.
                // if enetered value is -ve , then it should be lower than or equal to target old qty.
                if ((iSwapQuantity > 0) && (iSwapQuantity <= iSourceOldQty)) {

                    // check other constriants and update the JSON model
                    // If all constraints staisfied , Create the new swap
                    this._checkConstraintsAndUpdateJSONModelForValidInput(oSource, iSwapQuantity);
                } else {
                    // if the above validations are failed , then push it to invalid inputs array
                    this._checkCurrentSourceExistInInvalidInputArray(oSource);
                    oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
                    oEvent.getSource().setValueStateText(
                            com.zespri.awct.util.I18NHelper
                                    .getText("TXT_COLLABORATION_DELIVERYSWAP_CREATE_VALIDATION_SWAP_QUANTITY_LOWER_THAN_NEW_QUANTITY"));
                }

            }
        },
        /**
         * This method will push the valid swap entry after invalid changes in the view to the _mSwapQuantityChanges map for porposing to the backend .
         * This method will check all the constraints and validtions beforing pushing into _mSwapQuantityChanges map
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {sap.ui.model.Context}
         *            oBindingContext The Binding Context of the swap quantity input field.
         */
        _addValidInputToMapForCreate : function(oBindingContext) {
            var oController = this;
            var oModel = this.getView().getModel("initiateSwapLines");

            // Check whether there is no invalid changes in the table and
            // Existing Valid changes after invalid changes have been entered is not empty.

            if (!this._aInvalidSwapQuantityInputs.length && (!jQuery.isEmptyObject(this._mSwapQuantityChangesInInvalidState))) {

                // loop through the valid changes after invalid Change have been cleard from the table
                jQuery.each(this._mSwapQuantityChangesInInvalidState, function(sContextPath, iSwapQtyValue) {
                    // sContextPath = Contextpath of the valid entry
                    // iSwapQtyValue = Entered valid swap qty

                    // Create the context based on context path for changing the model swapQty value
                    var oContextForInput = new sap.ui.model.Context(oController.getView().getModel("initiateSwapLines"), sContextPath);

                    // set the swapQty with iSwapQtyValue
                    oModel.setProperty("/SwapQuantity", Number(iSwapQtyValue), oContextForInput);
                    // update the corresponding delivery line new qty
                    oController._updateDeliveryLine(oContextForInput);
                    // Push the context to the changed valid inputs array.
                    oController._aChangedInputs.push(oContextForInput);

                    if (Number(iSwapQtyValue)) {
                        // Source and Target allocation / deliveryLine Update Time can be empty . If it is empty , create swapEntity object with
                        // respective
                        // update time null.
                        var sSourceAllocationUpdateTime = com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(oBindingContext
                                .getProperty("SourceAllocationUpdateTime"), true) !== "" ? com.zespri.awct.util.CommonFormatHelper
                                .formatJSDateToEDMDateTimeString(oBindingContext.getProperty("SourceAllocationUpdateTime"), true) : null;

                        var sTargetAllocationUpdateTime = com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(oBindingContext
                                .getProperty("TargetAllocationUpdateTime"), true) !== "" ? com.zespri.awct.util.CommonFormatHelper
                                .formatJSDateToEDMDateTimeString(oBindingContext.getProperty("TargetAllocationUpdateTime"), true) : null;

                        var sTargetDeliveryLineUpdateTime = com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(oBindingContext
                                .getProperty("TargetDeliveryLineUpdateTime"), true) !== "" ? com.zespri.awct.util.CommonFormatHelper
                                .formatJSDateToEDMDateTimeString(oBindingContext.getProperty("TargetDeliveryLineUpdateTime"), true) : null;

                        var oSwapEntity = {
                            'RecordType' : oController._DeliverySwapRecordType.AllocationLine,
                            'SourceDeliveryLineID' : oBindingContext.getProperty("SourceDeliveryLineID"),
                            'SourceAllocationLineID' : oBindingContext.getProperty("SourceAllocationLineID"),
                            'SourceDeliveryLineUpdateTime' : com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(oBindingContext
                                    .getProperty("SourceDeliveryLineUpdateTime"), true),
                            'SourceAllocationUpdateTime' : sSourceAllocationUpdateTime,
                            'TargetDeliveryLineID' : oBindingContext.getProperty("TargetDeliveryLineID"),
                            'TargetAllocationLineID' : oBindingContext.getProperty("TargetAllocationLineID"),
                            'TargetDeliveryLineUpdateTime' : sTargetDeliveryLineUpdateTime,
                            'TargetAllocationUpdateTime' : sTargetAllocationUpdateTime,
                            'SwapQuantity' : parseFloat(iSwapQtyValue) + ""
                        };

                        // Update the local map object that tracks the changed allocation quantities.
                        oController._mSwapQuantityChanges[sContextPath] = oSwapEntity;
                    } else {
                        delete oController._mSwapQuantityChanges[sContextPath];
                    }

                });

                // Clear the valid inputs map after invalid changes
                this._mSwapQuantityChangesInInvalidState = {};
            }
        },
        /**
         * This method will check all constraints to Create the new swap and it will update the local JSON model based on the validations.
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {sap.m.Input}
         *            oSource Source of the action (Swap qty input field)
         * @param {Integer}
         *            iSwapQuantity Entered Swap Quantity
         * 
         */
        _checkConstraintsAndUpdateJSONModelForValidInput : function(oSource, iSwapQuantity) {
            var oBindingContext = oSource.getBindingContext();
            var oModel = this.getView().getModel("initiateSwapLines");

            // if there are inValid Inuts
            if (this._aInvalidSwapQuantityInputs.length !== 0) {

                // push the current entry into validChanges after invalid input
                var sPath = oBindingContext.getPath();
                this._mSwapQuantityChangesInInvalidState[sPath] = iSwapQuantity;
                oSource.setValueState(sap.ui.core.ValueState.None);

                var iIndex = this._aInvalidSwapQuantityInputs.indexOf(oSource);
                // if current entry was invalid and we are changing to valid entry , remove it from the invalid array
                if (iIndex > -1) {
                    this._aInvalidSwapQuantityInputs.splice(iIndex, 1);
                    // check if there is any valid inputs after invalid inputs is entered .
                    this._addValidInputToMapForCreate(oBindingContext);
                    return;
                }
            } else {
                // If there are no invalid changes
                // set the current qty to the JSON
                oModel.setProperty("/SwapQuantity", Number(iSwapQuantity), oBindingContext);
                // Update the delivery line
                this._updateDeliveryLine(oBindingContext);
                oSource.setValueState(sap.ui.core.ValueState.None);

                // Source and Target allocation / deliveryLine Update Time can be empty . If it is empty , create swapEntity object with respective
                // update time null.
                var sSourceAllocationUpdateTime = com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(oBindingContext
                        .getProperty("SourceAllocationUpdateTime"), true) !== "" ? com.zespri.awct.util.CommonFormatHelper
                        .formatJSDateToEDMDateTimeString(oBindingContext.getProperty("SourceAllocationUpdateTime"), true) : null;

                var sTargetAllocationUpdateTime = com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(oBindingContext
                        .getProperty("TargetAllocationUpdateTime"), true) !== "" ? com.zespri.awct.util.CommonFormatHelper
                        .formatJSDateToEDMDateTimeString(oBindingContext.getProperty("TargetAllocationUpdateTime"), true) : null;

                var sTargetDeliveryLineUpdateTime = com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(oBindingContext
                        .getProperty("TargetDeliveryLineUpdateTime"), true) !== "" ? com.zespri.awct.util.CommonFormatHelper
                        .formatJSDateToEDMDateTimeString(oBindingContext.getProperty("TargetDeliveryLineUpdateTime"), true) : null;

                var sDeliverySwapLinePath = oBindingContext.getPath();
                var oSwapEntity = {
                    'RecordType' : this._DeliverySwapRecordType.AllocationLine,
                    'SourceDeliveryLineID' : oBindingContext.getProperty("SourceDeliveryLineID"),
                    'SourceAllocationLineID' : oBindingContext.getProperty("SourceAllocationLineID"),
                    'SourceDeliveryLineUpdateTime' : com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(oBindingContext
                            .getProperty("SourceDeliveryLineUpdateTime"), true),
                    'SourceAllocationUpdateTime' : sSourceAllocationUpdateTime,
                    'TargetDeliveryLineID' : oBindingContext.getProperty("TargetDeliveryLineID"),
                    'TargetAllocationLineID' : oBindingContext.getProperty("TargetAllocationLineID"),
                    'TargetDeliveryLineUpdateTime' : sTargetDeliveryLineUpdateTime,
                    'TargetAllocationUpdateTime' : sTargetAllocationUpdateTime,
                    'SwapQuantity' : parseFloat(iSwapQuantity) + ""
                };

                // Update the local map object that tracks the changed allocation quantities.
                this._mSwapQuantityChanges[sDeliverySwapLinePath] = oSwapEntity;
                // Push the current entry into valid inputs array
                this._aChangedInputs.push(oBindingContext);

            }
        },

        /**
         * This method wil check whether the current source already exists in the invalid input array . If no , it will add it to the array . If yes,
         * it will return without adding into the array.
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {sap.m.Input}
         *            oSource Source of the action (Swap qty input field)
         */
        _checkCurrentSourceExistInInvalidInputArray : function(oSource) {
            var iCount = this._aInvalidSwapQuantityInputs.length;
            // If source doesnt exist , return
            if (!oSource) {
                return;
            } else {
                // Lopp throug the invalid swap quantity inputs array and check for the current source entry
                for ( var i = 0; i < iCount; i++) {
                    if (this._aInvalidSwapQuantityInputs[i] === oSource) {
                        return;
                    }
                }
            }

            // If oSource doesnt exist in the array , puch it into the invalid inputs array.
            this._aInvalidSwapQuantityInputs.push(oSource);

        },

        /**
         * This formatter will format the source new quantity based on source old and entered swap quantities.
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {Integer}
         *            iSourceOldQty SourceOld Quantity
         * @param {Integer}
         *            iSwapQuantity Entered Swap Quantity
         */
        formatSourceNewQuantity : function(iSourceOldQty, iSwapQuantity) {

            // If both source old and swap quantity is not empty
            if (!isNaN(iSourceOldQty) && !isNaN(iSwapQuantity)) {
                // calculate new qty
                var iSourceNewQuantity = parseInt(iSourceOldQty, 10) - parseInt(iSwapQuantity, 10);
                // call the fomratter to format the quantity based on locale .
                var iFormattedSourceNewQuanity = com.zespri.awct.util.LocaleFormatHelper.formatQuantity(iSourceNewQuantity);
                return iFormattedSourceNewQuanity;
            } else {
                // if swap qty is empty
                if (!isNaN(iSourceOldQty)) {
                    var iFormattedSourceOldQuanity = com.zespri.awct.util.LocaleFormatHelper.formatQuantity(iSourceOldQty);
                    return iFormattedSourceOldQuanity;
                } else {
                    return "";
                }

            }
        },
        /**
         * This formatter will format the target new quantity based on source old and entered swap quantities.
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {Integer}
         *            iTargetOldQty Target old quantity
         * @param {Integer}
         *            iSwapQuantity entered Swap Qty
         */
        formatTargetNewQuantity : function(iTargetOldQty, iSwapQuantity) {

            // If both target old and swap quantity is not empty
            if (!isNaN(iTargetOldQty) && !isNaN(iSwapQuantity)) {
                var iTargetNewQuantity = parseInt(iTargetOldQty, 10) - parseInt(-1 * (iSwapQuantity), 10);
                // call the fomratter to format the quantity based on locale .
                var iFormattedTargetNewQuanity = com.zespri.awct.util.LocaleFormatHelper.formatQuantity(iTargetNewQuantity);
                return iFormattedTargetNewQuanity;
            } else {
                // if swap qty is empty
                if (!isNaN(iTargetOldQty)) {
                    var iFormattedTargetOldQuanity = com.zespri.awct.util.LocaleFormatHelper.formatQuantity(iTargetOldQty);
                    return iFormattedTargetOldQuanity;
                } else {
                    return "";
                }
            }
        },
        /**
         * This Method is called when the user clicks sourceBC link in the table and it opens a dialog with view batch characteristics
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        handleViewSourceBatchCharacteristicsOpen : function(oEvent) {
            // Getting the Selected BC from the table
            var sSourceDeliveryLineNumber = oEvent.getSource().getBindingContext().getProperty("SourceDeliveryLineNumber");
            this._OpenViewBatchCharacteristicsDialog(sSourceDeliveryLineNumber);
        },
        /**
         * This Method is called when the user clicks targetBC link in the table and it opens a dialog with view batch characteristics
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        handleViewTargetBatchCharacteristicsOpen : function(oEvent) {
            // Getting the Selected BC from the table
            var sTargetDeliveryLineNumber = oEvent.getSource().getBindingContext().getProperty("TargetDeliveryLineNumber");
            this._OpenViewBatchCharacteristicsDialog(sTargetDeliveryLineNumber);
        },
        /**
         * This Method is used to open a dialog with view batch characteristics based on selected deliveryLineNumber.
         * 
         * @private
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {String}
         *            sDeliveryLineNumber Delivery to be passed as a filter to get the batch characteristics
         */
        _OpenViewBatchCharacteristicsDialog : function(sDeliveryLineNumber) {
            // storing the current instance
            var oController = this;

            // Success function for the model read for BatchCharacteristicSet
            var fnSuccessBatchCharacteristicsRead = function(oBatchCharacteristicsModel) {
                oController._oViewBatchCharacteristicsDialog.setModel(oBatchCharacteristicsModel);

                // Getting the count of batch characteristics and setting it as the table header
                var iBatchCharacteristicsCount = oBatchCharacteristicsModel.getData().results.length;
                sap.ui.core.Fragment.byId("viewBatchCharacteristicsFragment", "viewBatchCharacteristicsTableHeader").setText(
                        com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_VIEWBATCHCHARACTERISTICS_TABLE_TITLE",
                                [iBatchCharacteristicsCount]));
                oController._oViewBatchCharacteristicsDialog.setBusy(false);
            };
            var fnErrorBatchCharacteristicsRead = function() {
                var sErrorText = com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_DETAILS_ERROR_MESSAGE");
                com.zespri.awct.util.NotificationHelper.showErrorDialog(sErrorText);

                oController._oViewBatchCharacteristicsDialog.setBusy(false);
            };
            // Create the fragment only if it doesnot exist
            if (!oController._oViewBatchCharacteristicsDialog) {
                oController._oViewBatchCharacteristicsDialog = new sap.ui.xmlfragment("viewBatchCharacteristicsFragment",
                        "com.zespri.awct.collab.fragment.ViewBatchCharacteristics", this);
                oController._oViewBatchCharacteristicsDialog.setModel(oController.getView().getModel("i18n"), "i18n");
            }

            // Getting the Batch characteristics that are linked to the selected Delivery Line.
            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/BatchCharacteristicsSet", {
                urlParameters : {
                    "$filter" : "DeliveryLineNumber eq '" + sDeliveryLineNumber + "'",
                    "$expand" : "BatchCharacteristicsValueSet"
                }
            }, fnSuccessBatchCharacteristicsRead, fnErrorBatchCharacteristicsRead);

            // Open the fragment
            oController._oViewBatchCharacteristicsDialog.setBusy(true);
            oController._oViewBatchCharacteristicsDialog.open();

        },
        /**
         * This Method is called when OK button is clicked in the dialog with view batch characteristics
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapDetails
         */
        handleViewBatchCharacteristicsOKPress : function() {
            // Close the current fragment
            this._oViewBatchCharacteristicsDialog.close();
        },

        /**
         * Formatter function for the column 'Value' in 'ViewBatchCharacteristics' fragment
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {Object}
         *            oJsonBatchCharacteristicsValue contains the Batch Characteristics Values
         * @returns {String} returns the the Batch Characteristic Values separated with comma
         */
        formatBatchCharacteristicsValuesText : function(oJsonBatchCharacteristicsValue) {

            // Function to return the batch characteristics values from the oJsonBatchCharacteristicsValue array
            // oBatchCharValue - Contains the value of each array element
            var fnBatchCharacteristicsValueReturn = function(oBatchCharValue) {
                return oBatchCharValue.Value;
            };
            // Get all the Batch Characteristics Value and seperating each with ', '
            return oJsonBatchCharacteristicsValue.results.map(fnBatchCharacteristicsValueReturn).join(", ");

        },
        /**
         * Formatter function for the column 'Include/Exclude' in 'ViewBatchCharacteristics' fragment
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate
         * @param {Boolean}
         *            bIncludeExclude Flag for Include Exclude
         * @returns {String} if bIncludeExcludeis true then 'Exclude' else 'Include'
         */
        formatExcludeIncludeText : function(bIncludeExclude) {
            // Checking whether the field is include or exclude
            // if true then exclude else include

            if (bIncludeExclude) {
                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_VIEWBATCHCHARACTERISTICS_EXCLUDE");

            } else {
                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_VIEWBATCHCHARACTERISTICS_INCLUDE");
            }
        },
        /*
         * This formatter will change the status of the Swap Quantity field of DELIVERY LINE based on entered swap quantity.
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapCreate @param {Integer} iSwapQuantity Entered Swap Quantity
         */
        formatDeliveryLineSwapQuantityState : function(iSwapQuantity) {
            if (Number(iSwapQuantity) === 0) {
                return "Success";
            } else {
                return "Error";
            }
        }
    });
})();
