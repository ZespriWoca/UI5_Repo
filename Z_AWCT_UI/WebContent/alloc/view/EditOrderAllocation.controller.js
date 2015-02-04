(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });
    jQuery.sap.require("com.zespri.awct.util.CommonHelper");
    jQuery.sap.require("com.zespri.awct.util.Enums");
    jQuery.sap.require("com.zespri.awct.util.CommonFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");
    jQuery.sap.require("com.zespri.awct.util.TableRowActionsExtension");
    jQuery.sap.require("sap.ui.commons.layout.HorizontalLayout");

    /**
     * @classdesc The 'Edit Order Allocation' view is for ZESPRI users to create/change allocations to suppliers within delivery lines for a chosen
     *            delivery. The user navigates to this view after selecting a delivery from the Delivery Worklist view. The view contains a facet
     *            filter, an object header (for showing details about the selected delivery) and a table that shows delivery lines and allocation
     *            lines. The facet filter can be used to filter the table if there are no unsaved changes. If there are unsaved changes, these must be
     *            saved or discarded first.
     * 
     * The available filters (in the facet filter) and columns (in the table) depend on the shipment type (Charter or Container) of the selected
     * delivery. {@see private method _initTableConfiguration}
     * 
     * @class
     * @name com.zespri.awct.alloc.view.EditOrderAllocation
     */
    com.zespri.awct.core.Controller
            .extend(
                    "com.zespri.awct.alloc.view.EditOrderAllocation",
                    /** @lends com.zespri.awct.alloc.view.EditOrderAllocation */
                    {
                        // Private enum for charge codes
                        _ChargeCodes : {
                            NonChargeTotal : "NCT",
                            NonChargeSubTotal : "NCS",
                            AdministrativeCharges : "Z-CSO-A"
                        },
                        // private enum for delivery additional info keys
                        _DeliveryAdditionalInfoKey : {
                            DemandGTSupply : "03",
                            BCNotMaintained : "01"
                        },

                        // Private enum for shipment type (container / charter)
                        _ShipmentType : {
                            Container : "02",
                            Charter : "01"
                        },

                        // Private enum for 'Maintain Batch Characteristics' 'business action' header values
                        _MaintainBCBusinessAction : {
                            Update : "UPDATE",
                            Overwrite : "OVERWRITE"
                        },
                        _MaintainBCOperation : {
                            Include : "I",
                            Exclude : "E",
                            Delete : "D"
                        },

                        // Private enum for available macros
                        _AllocationMacro : {
                            ProRata : "ProRata",
                            Zero : "Zero"
                        },

                        /**
                         * Lifecycle hook called by the framework when the view is destroyed. Cleanup tasks are done here.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        onExit : function() {
                            if (this._oRowActionsExtension) {
                                this._oRowActionsExtension.destroy();
                            }
                            if (this._oLockedDeliverySaveDialog) {
                                this._oLockedDeliverySaveDialog.destroy();
                            }
                        },

                        /**
                         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify
                         * the View before it is displayed, to bind event handlers and do other one-time initialization.
                         * 
                         * On load of this view, the delivery header context passed from Delivery detail view is fetched.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        onInit : function() {
                            /* START of instance member initialization */
                            // Private variable for Unlock delivery dialog
                            this._oUnlockDeliveryDialog = null;
                            // Private variable for Reason of demand change in unlock delivery
                            this._sReason = "";
                            // Private variable for Maintain Line Text
                            this._oDialogMaintainLineText = null;
                            // Private variable for Maintain Header Text
                            this._oDialogMaintainHeaderText = null;
                            // Private variable for Add Supplier dialog
                            this._oDialogAddSupplier = null;
                            // Private variable for Market Info dialog
                            this._oMarketInfoDialog = null;
                            // Private variable for Delivery Header Context
                            this._oDeliveryHeaderContext = null;
                            // Private variable for Release dialog
                            this._oReleaseDeliveryDialog = null;
                            // Stores the instance of the TableRowActionsExtension for the allocation table
                            this._oRowActionsExtension = null;
                            // Local map to track context paths against corresponding allocation quantity changes
                            this._mAllocationQuantityChanges = {};
                            // Array to track the Inputs (for allocation quantity) that have an error state.
                            this._aInvalidAllocationQuantityInputs = [];
                            // Array to track all sap.m.Input controls that the user has changed. During 'discard', their values need to be updated
                            // according to the
                            // OData model.
                            this._aChangedInputs = [];
                            // This counter is used in the factory for the allocation table. This is used as a prefix in the factory function for the
                            // 'items'
                            // aggregation of the table.
                            this._iUniqueStringCounter = 0;
                            // Dialog for 'Maintain batch characteristics'
                            this._oMaintainBatchCharacteristicsDialog = null;
                            // Dialog for Maintain BC -> Values F4 help
                            this._oMaintainBatchCharacteristicsSearchHelpDialog = null;
                            // Dialog for Maintain BC -> 'Propagate to lines' F4 help
                            this._oMaintainBatchCharacteristicsPropagateToLinesDialog = null;
                            // Local JSON model for 'Maintain Batch Characteristics'
                            this._oMaintainBatchCharacteristicsModel = null;
                            // Local JSON model for storing view state
                            this._oViewStateModel = null;
                            // Flag to indicate whether a macro simulation is on-going.
                            this._bSimulatingMacro = false;
                            // Map that stores a DeliveryAllocationID <-> UI5 input field mapping, used for displaying macro simulation results. This
                            // map is filled
                            // only when the table is rendered while _bSimulatingMacro flag is true.
                            this._mMacroSimulationTargets = {};
                            // Action sheet fragment for macros
                            this._oMacrosActionSheet = null;
                            // Busy dialog (used for macro simulation)
                            this._oBusyDialog = new sap.m.BusyDialog();
                            // private variable for add suppliers to container dialog
                            this._oAddSuppliersToContainerDialog = null;
                            // private variable for search input field
                            this._oAddSuppliersToContainerSearchInputField = null;
                            // private variable for search help dialog
                            this._oAddSuppliersToContainerSearchHelpDialog = null;
                            // Private Instance variable for add supplier orw actions button
                            this._oAddSupplierButton = null;
                            // Private Instance variable for user authorization
                            this._bUserAuthorized = false;
                            // Private variable for locaked delivery save dialog
                            this._oLockedDeliverySaveDialog = null;
                            /* END of instance member initialization */

                            // To make sure the user doesn't accidentally navigate away with unsaved changes...
                            var oController = this;
                            var oView = this.getView();

                            // Initialize the 'view state' model. Currently this is only used for binding the 'enabled' property of quantity input
                            // fields, to enable/disable them based on delivery status.
                            this._oViewStateModel = new sap.ui.model.json.JSONModel({
                                allowAllocationChange : false
                            });
                            this.getView().setModel(this._oViewStateModel, "viewState");

                            // Attach the 'TableRowActionsExtension' functionality to the table in this view. This handles the row-level actions that
                            // are visible
                            var oTable = this.byId("allocationTable");

                            // Enable / Disable facet filter based on table loading
                            var oFacetFilter = this.byId("facetFilterAllocation");
                            com.zespri.awct.util.CommonHelper.manageFacetFilterState(oTable, oFacetFilter);

                            // Manage NoData Texts , listen for list update EVENT
                            com.zespri.awct.util.CommonHelper.manageNoDataText(oTable);

                            this._oRowActionsExtension = new com.zespri.awct.util.TableRowActionsExtension({
                                table : oTable,
                                actionsContent : this._getTableRowActionsContent()
                            });

                            // Attach event listener for the row actions extension. Set color to the Delivery Line Text button, if the text exists
                            this._oRowActionsExtension.attachOnBeforeActionsVisible(this._handleOnBeforeActionsVisible, this);

                            // Check the incoming Route. This part is tricky. If the user reached this view from the 'DeliveryWorklist' view, the
                            // details about the
                            // current delivery will already be available in the model and oModel.getProperty() is enough to get this information.
                            // However, if the
                            // user reaches this page by directly pasting the link in the address bar, the model will be empty and .getProperty() will
                            // fail. In such a
                            // case, we need to read the current delivery from the backend, using the context path available in the URL.
                            //
                            // Thus, in one scenario (user reaches from Delivery Worklist) the context is already available, whereas in another
                            // scenario (user uses
                            // address bar to reach) the context needs to be fetched asynchronously. In either case, the inline function
                            // fnOnDeliveryHeaderContextAvailable is invoked only after the context is available. Code inside that function can assume
                            // that delivery
                            // header context is available.
                            var fnRoutePatternMatchedHandler = function(oEvent) {
                                // Check if the route is for the EditOrderAllocation view
                                if (oEvent.getParameter("name") === "Allocation/EditOrderAllocation") {
                                    // Check the current user authorizations
                                    if (!oController._bUserAuthorized) {
                                        com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                                .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));
                                        return;
                                    }

                                    // To make sure the user doesn't accidentally navigate away with unsaved changes...
                                    oController.getRouter().attachOnBeforeNavigationWithUnsavedChanges(this.handleNavigationWithUnsavedChanges, this);

                                    // Get context from URL route
                                    var sContextPath = oEvent.getParameter("arguments").contextPath;
                                    this._oDeliveryHeaderContext = new sap.ui.model.Context(oView.getModel(), '/' + sContextPath);

                                    // Is the URL context available in the model already? If not, trigger a read to get it.
                                    this._setViewBusy(true);
                                    var sDeliveryID = this._oDeliveryHeaderContext.getProperty("DeliveryHeaderID");
                                    if (sDeliveryID) {
                                        fnOnDeliveryHeaderContextAvailable();
                                    } else {
                                        // Need to get delivery header details from the backend. Prepare success handler for this read.
                                        var fnReadSuccess = function(oJSONModel) {
                                            oController._oDeliveryHeaderContext = new sap.ui.model.Context(oJSONModel, "/result");
                                            fnOnDeliveryHeaderContextAvailable();
                                        };

                                        // Error handler for this read
                                        var fnReadError = function(oError) {
                                            com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        };

                                        // Trigger the read
                                        com.zespri.awct.util.ModelHelper.getJSONModelForRead(sContextPath, {}, fnReadSuccess, fnReadError);
                                    }
                                } else {
                                    // If the user navigates elsewhere, stop listening for the router's 'onBeforeNavigationWithUnsavedChanges'
                                    // event
                                    oController.getRouter().detachOnBeforeNavigationWithUnsavedChanges(this.handleNavigationWithUnsavedChanges, this);

                                    // If the user navigates elsewhere, delete this view. This is needed because we might removed columns/filters
                                    // based on
                                    // the 'ContainerOrCharter' property, so we need to render the view afresh when we come back to this view for a
                                    // different
                                    // delivery.
                                    // The router caches views that it has already instantiated, so we need to clear its cache too.
                                    this.getRouter().detachRoutePatternMatched(fnRoutePatternMatchedHandler, this);
                                    this.getRouter().removeViewFromCache("com.zespri.awct.alloc.view.EditOrderAllocation");
                                    this.getView().destroy(true);
                                }
                            };

                            // Attach route pattern matched event handler
                            this.getRouter().attachRoutePatternMatched(fnRoutePatternMatchedHandler, this);

                            // What to do once delivery header context is available?
                            var fnOnDeliveryHeaderContextAvailable = function() {
                                if (com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                        com.zespri.awct.util.Enums.AuthorizationObject.Allocation,
                                        com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)) {

                                    oController.byId("maintainHeaderTextButton").setVisible(true);
                                    // If status of delivery is locked, hide the Lock button else hide the Unlock button
                                    if (oController._oDeliveryHeaderContext.getProperty("Status") === com.zespri.awct.util.Enums.DeliveryStatus.Released) {
                                        oController.byId("lockButton").setVisible(true);
                                        oController.byId("unlockButton").setVisible(false);
                                    } else if (oController._oDeliveryHeaderContext.getProperty("Status") === com.zespri.awct.util.Enums.DeliveryStatus.Locked) {
                                        oController.byId("lockButton").setVisible(false);
                                        oController.byId("unlockButton").setVisible(true);
                                    }

                                }

                                // Refresh the table, by passing appropriate filters to the backend.
                                oController._refreshTable();

                                // Update the footer and quantity fields enabled/disabled based on delivery status
                                oController._updateFooter();
                                oController._updateQuantityInputsEnabledState();

                                // Set model and binding context for the ObjectHeader in the view.
                                var oModel = oController._oDeliveryHeaderContext.getModel();
                                oController._setViewBusy(false);
                                oController.byId("deliveryObjectHeader").setModel(oModel).setBindingContext(oController._oDeliveryHeaderContext)
                                        .setBusy(false);

                                // Initialize facet filters (values depend on current delivery header ID, so this can't be done from XML)
                                oController._initFacetFilterLists();

                                // Initialize table configuration (columns). Depends on shipment type
                                oController._initTableConfiguration();
                            };
                        },
                        /**
                         * This method will be called before rendering the View.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        onBeforeRendering : function() {
                            // Check for User authorization
                            if (!com.zespri.awct.util.CommonHelper
                                    .isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                                            com.zespri.awct.util.Enums.AuthorizationObject.Allocation,
                                            com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)) {
                                if (this.byId("pageEditOrderAllocation")) {
                                    this.byId("pageEditOrderAllocation").destroy();
                                }
                                this._bUserAuthorized = false;
                            } else {
                                this._bUserAuthorized = true;
                            }
                        },
                        /**
                         * This is a private method for setting color to the Delivery line text button, if line text is maintained.
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * 
                         */
                        _handleOnBeforeActionsVisible : function(oEvent) {
                            var oContext = oEvent.getParameter("rowContext");
                            if (oContext.getProperty("TextExistsFlag")) {
                                this._oDeliveryLineTextButton.addStyleClass("zAwctDeliveryLineTextButtonBackgroundColor");
                            } else {
                                this._oDeliveryLineTextButton.removeStyleClass("zAwctDeliveryLineTextButtonBackgroundColor");
                            }
                        },

                        /**
                         * Factory function for creating list items for the table. The template for each row is different based on whether it
                         * represents a delivery line (All line) or an allocation line (Supplier order line).
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @param {String}
                         *            sId The unique ID for each list item provided by the framework.
                         * @param {sap.ui.model.Context}
                         *            The context for which a new list item instance is being created by the factory function.
                         */
                        createTableColumnListItem : function(sId, oContext) {
                            // Get the record type for the current context
                            var sRecordType = oContext.getProperty("RecordType");

                            // Since the framework doesn't provide 'sId' to factory functions that are for tables/lists with 'growing=true', we need
                            // to generate our
                            // own unique prefix.
                            var sIdPrefix = "allocationLine" + this._iUniqueStringCounter++;

                            // Instantiate the appropriate fragment depending on whether the line represents delivery line or supplier order line.
                            var oTableListItem;
                            switch (sRecordType) {
                                case com.zespri.awct.util.Enums.AllocationLineRecordType.DeliveryLine :
                                    oTableListItem = sap.ui.xmlfragment(sIdPrefix,
                                            "com.zespri.awct.alloc.fragment.EditAllocationsDeliveryLineTemplate", this);
                                    break;

                                case com.zespri.awct.util.Enums.AllocationLineRecordType.SupplierOrderLine :
                                    oTableListItem = sap.ui.xmlfragment(sIdPrefix,
                                            "com.zespri.awct.alloc.fragment.EditAllocationsSupplierOrderLineTemplate", this);
                                    break;

                                default :
                                    // TODO: Remove this instantiation for prod. Needed for ease of local testing. Doesn't affect behaviour.
                                    oTableListItem = sap.ui.xmlfragment(sIdPrefix,
                                            "com.zespri.awct.alloc.fragment.EditAllocationsDeliveryLineTemplate", this);
                                    jQuery.sap.log.error("Unexpected RecordType (" + sRecordType + ") in /AllocationLineSet");
                            }

                            // If shipment type is charter, we don't want to show the 'ContainerID' and 'ContainerType' columns, so let's remove those
                            // cells.
                            if (this._oDeliveryHeaderContext.getProperty("ContainerOrCharter") === this._ShipmentType.Charter) {
                                // Remove and destroy the cells that aren't needed, from every row
                                oTableListItem.removeCell(sap.ui.core.Fragment.byId(sIdPrefix, "containerIDCell"));
                                sap.ui.core.Fragment.byId(sIdPrefix, "containerIDCell").destroy();

                                oTableListItem.removeCell(sap.ui.core.Fragment.byId(sIdPrefix, "containerTypeCell"));
                                sap.ui.core.Fragment.byId(sIdPrefix, "containerTypeCell").destroy();
                            }

                            // If the table is being rendered because of macro-simulation, then we need to create a map of DeliveryAllocationID <->
                            // UI5 input field.
                            // This is used for displaying the results of the simulation. Only the quantities for allocation lines (recordtype) need
                            // to be updated
                            // with simulation result quantities. So we do not need to add delivery lines to this map.
                            if (this._bSimulatingMacro && (sRecordType === com.zespri.awct.util.Enums.AllocationLineRecordType.SupplierOrderLine)) {
                                var sDeliveryAllocationID = oContext.getProperty("DeliveryAllocationID");
                                var oInput = sap.ui.core.Fragment.byId(sIdPrefix, "allocationQuantityCell");
                                this._mMacroSimulationTargets[sDeliveryAllocationID] = oInput;
                            }

                            // Return the created list item (row)
                            return oTableListItem;
                        },
                        /**
                         * Formatter for the "enabled" property of allocation quantity input field. If user is not allowed to maintain , enabled will
                         * be set to false.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @param {Boolean}
                         *            bEnable The 'bEnable' value will enable / disable based on viewState model
                         */
                        formatAllocationQuantityEnableState : function(bEnable) {
                            // Check User Authorizations . If user is not allowed to maintain , dont allow to edit input field.
                            return !com.zespri.awct.util.CommonHelper
                                    .isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                            com.zespri.awct.util.Enums.AuthorizationObject.Allocation,
                                            com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP) ? false : bEnable;
                        },
                        /**
                         * Formatter for the 'state' property of the <i>sap.m.ObjectNumber</i> control used in the template for Delivery Line
                         * template (for the allocation quantity column).
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @param {Float}
                         *            fAllocationQuantity The 'AllocatedQuantity' property of each delivery line
                         * @param {Float}
                         *            fQuantity The 'Quantity' property of each delivery line
                         * @return {String} A string representing the value state to be set
                         */
                        formatDeliveryLineAllocationQuantityState : function(fAllocationQuantity, fQuantity) {
                            // If allocation quantity < total quantity, the allocated quantity needs to be shown in Red (error state). Otherwise,
                            // Green (success
                            // state).
                            if (fAllocationQuantity === fQuantity) {
                                return sap.ui.core.ValueState.Success;
                            } else {
                                return sap.ui.core.ValueState.Error;
                            }
                        },

                        /**
                         * Event handler for the 'change' event of the 'Allocation Quantity' input field for each allocation line. It updates the
                         * local JSON model that tracks all changes to allocation quantities. This local model is then used to fire a Batch update.
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleAllocationQuantityChange : function(oEvent) {
                            // Get the input field that fired this event, and new value
                            var oSource = oEvent.getSource();
                            var oContext = oSource.getBindingContext();
                            var sValue = oSource.getValue();
                            var iValue;

                            // Validate. Since type="Number", sValue will always be either a string with a number or an empty string.
                            if (sValue === "" || parseInt(sValue, 10) < 0) {
                                // Improper value? Set error value state and add to array that keeps a record of all invalid sap.m.Input instance in
                                // the table. Stop
                                // processing.
                                oSource.setValueState(sap.ui.core.ValueState.Error);
                                this._aInvalidAllocationQuantityInputs.push(oSource);
                                return;
                            } else {
                                // Value is good? Remove value state and remove the Input control from the array of invalid Input controls.
                                iValue = parseInt(sValue, 10);
                                oSource.setValueState(sap.ui.core.ValueState.None);
                                var iIndex = this._aInvalidAllocationQuantityInputs.indexOf(oSource);
                                if (iIndex > -1) {
                                    this._aInvalidAllocationQuantityInputs.splice(iIndex, 1);
                                }
                            }

                            // Get the binding path (map key) and required values like entity keys and allocation quantity (map value). This will
                            // later be used for
                            // triggering an update.
                            var sPath = oContext.getPath();
                            var oAllocationLineEntity = {
                                'DeliveryAllocationID' : oContext.getProperty("DeliveryAllocationID"),
                                'AllocationQuantity' : parseFloat(iValue) + "",
                                'DeliveryLineUpdateTime' : com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(oContext
                                        .getProperty("DeliveryLineUpdateTime"), true),
                                'AllocationUpdateTime' : com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(oContext
                                        .getProperty("AllocationUpdateTime"), true)
                            };

                            // Just in case the user also included decimals, set the value of the Input control again.. without decimals.
                            oSource.setValue(iValue);

                            // Update the local map object that tracks the changed allocation quantities.
                            this._mAllocationQuantityChanges[sPath] = oAllocationLineEntity;
                            this._aChangedInputs.push(oSource);

                            // Set view as 'dirty' (core controller method)
                            this.setHasUnsavedChanges(true);
                        },

                        /**
                         * Event handler for the 'press' event of the 'Text' icon for delivery lines for which 'TextExistsFlag' is true. Opens the
                         * corresponding dialog.
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleDeliveryLineTextPress : function(oEvent) {
                            var oController = this;
                            var $textStandardReadDeferred, $textStandardReadPromise, $lineTextReadDeferred, $lineTextReadPromise;

                            var mParameters = {};
                            // Prevent action if view has unsaved changes.
                            if (oController._stopActionIfViewDirty()) {
                                return;
                            }

                            // Hide the row actions
                            this._oRowActionsExtension.hideRowActions();

                            var oCurrentContext = oEvent.getSource().getBindingContext();

                            // Success function for the JSON Model read '/TextStandardSet' for the selected delivery line
                            var fnSuccessTextStandard = function(oJSONModel) {
                                // Setting the model to the fragment
                                oController._oDialogMaintainLineText.setModel(oJSONModel, "standardTexts");

                                // Indicate as done
                                $textStandardReadDeferred.resolve();
                            };

                            // Create the fragment if it does not exist
                            if (!oController._oDialogMaintainLineText) {
                                oController._oDialogMaintainLineText = new sap.ui.xmlfragment("maintainLineTextFragment",
                                        "com.zespri.awct.alloc.fragment.MaintainLineText", oController);
                                oController._oDialogMaintainLineText.setModel(this.getView().getModel("i18n"), "i18n");
                                this.getView().addDependent(oController._oDialogMaintainLineText);
                            }

                            var oLineTextTable = sap.ui.core.Fragment.byId("maintainLineTextFragment", "maintainLineTextTable");
                            com.zespri.awct.util.CommonHelper.manageNoDataText(oLineTextTable);

                            // Disable the OK button in the fragment. The button is enabled only when there is a change made in the textarea
                            sap.ui.core.Fragment.byId("maintainLineTextFragment", "deliveryLineTextOKButton").setEnabled(false);
                            sap.ui.core.Fragment.byId("maintainLineTextFragment", "maintainLineTextTextArea").attachEventOnce("liveChange",
                                    function() {
                                        sap.ui.core.Fragment.byId("maintainLineTextFragment", "deliveryLineTextOKButton").setEnabled(true);
                                    });

                            // Initializing the Search Field Value.
                            sap.ui.core.Fragment.byId("maintainLineTextFragment", "maintainLineTextSearchField").setValue("");

                            // Initializing the Text Area Value.
                            sap.ui.core.Fragment.byId("maintainLineTextFragment", "maintainLineTextTextArea").setValue("");

                            // JSON model read for 'TextStandardSet'.
                            $textStandardReadDeferred = $.Deferred();
                            $textStandardReadPromise = $textStandardReadDeferred.promise();
                            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/TextStandardSet", {}, fnSuccessTextStandard);

                            // Success and error messages for existing line text read
                            mParameters.success = function(oLineText) {

                                // Setting the existing Line Text to the Text Area
                                var oDeliveryLineTextTextArea = sap.ui.core.Fragment.byId("maintainLineTextFragment", "maintainLineTextTextArea");

                                // Setting the existing Line Text
                                // Need to check whether the path is result or results
                                oDeliveryLineTextTextArea.setValue(oLineText.TextString);

                                $lineTextReadDeferred.resolve();

                            };
                            mParameters.error = function(oError) {
                                // Show the error dialog
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                $lineTextReadDeferred.resolve();
                            };

                            // OData read for existing line text
                            $lineTextReadDeferred = $.Deferred();
                            $lineTextReadPromise = $lineTextReadDeferred.promise();
                            oController.getView().getModel().read(oCurrentContext + "/Text", mParameters);

                            // Opening the fragment
                            oController._oDialogMaintainLineText.setBusy(true);
                            oController._oDialogMaintainLineText.open();

                            // Once both services are done, remove busy state
                            $.when($textStandardReadPromise, $lineTextReadPromise).done(function() {
                                oController._oDialogMaintainLineText.setBusy(false);
                            });
                        },
                        /**
                         * Event handler for the 'press' event of the 'OK' Button in Maintain Line Text Fragment. The method will update the model
                         * with the maintained Line Text.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleDeliveryLineTextOKPress : function() {
                            var oController = this;
                            var oTextSetParameters = {};
                            var mParameters = {};

                            // Getting the Text Area object
                            var oDeliveryLineTextTextArea = sap.ui.core.Fragment.byId("maintainLineTextFragment", "maintainLineTextTextArea");

                            // Getting the Selected context path of the edit order allocation table
                            var oAllocationTableContext = oController.getView().byId("allocationTable").getSelectedItem().getBindingContext();

                            // Storing the parameters that are needed for the update operation
                            // The property name (Label) needs to be updated after metadata is updated with new property for text.
                            oTextSetParameters.TextString = oDeliveryLineTextTextArea.getValue();
                            oTextSetParameters.DeliveryHeaderID = oAllocationTableContext.getProperty('DeliveryHeaderID');
                            oTextSetParameters.DeliveryLineID = oAllocationTableContext.getProperty('DeliveryLineID');

                            // Success function for the update operation
                            mParameters.success = function() {
                                com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_ALLOCATION_MAINTAINLINETEXT_UPDATE_SUCCESS"));

                                // Closing the Fragment
                                oController._oDialogMaintainLineText.setBusy(false);
                                oController._oDialogMaintainLineText.close();
                            };

                            // Error function for the update operation
                            mParameters.error = function(oError) {
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                // Setting the fragment status as not busy
                                oController._oDialogMaintainLineText.setBusy(false);
                            };

                            // Create is synchronous by default.
                            mParameters.async = true;

                            // Setting the status of the fragment to busy
                            oController._oDialogMaintainLineText.setBusy(true);

                            // Creating the Allocation Line text with the updated Line Text
                            oController.getView().getModel().create("/TextSet", oTextSetParameters, mParameters);

                            // Refresh the table
                            oController.getView().byId("allocationTable").getBinding("items").refresh();

                        },
                        /**
                         * Event handler for the 'press' event of the 'Cancel' Button in Maintain Line Text Fragment.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleDeliveryLineTextCancelPress : function() {
                            this._oDialogMaintainLineText.close();
                        },
                        /**
                         * Event handler for the 'LiveChange' event of the 'SearchField' in Maintain Line Text Fragment. The method will do filter
                         * based on the Library Text
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleDeliveryLineTextSearchLiveChange : function(oEvent) {

                            // Getting the search value and filtering it with Value
                            var sLineText = oEvent.getParameter("newValue");
                            var oLineTextFilter = new sap.ui.model.Filter("TextStandardID", sap.ui.model.FilterOperator.Contains, sLineText);
                            var oLineTextBinding = sap.ui.core.Fragment.byId("maintainLineTextFragment", "maintainLineTextTable").getBinding("items");
                            oLineTextBinding.filter([oLineTextFilter]);
                        },
                        /**
                         * Event handler for the 'press' event of the Buttons in Library Text cells in Maintain Line Text Fragment. This method will
                         * append the Line Text of the selected cell to the content in the Text area
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleDeliveryLineTextAddButtonPress : function(oEvent) {
                            // Enable the OK button in the fragment by firing the live change event on the textarea
                            sap.ui.core.Fragment.byId("maintainLineTextFragment", "maintainLineTextTextArea").fireLiveChange();

                            // Getting the current line text of the selected cell
                            var sValue = oEvent.getSource().getBindingContext("standardTexts").getProperty("Value");
                            var oDeliveryLineTextTextArea = sap.ui.core.Fragment.byId("maintainLineTextFragment", "maintainLineTextTextArea");

                            // set the value to the text area as it is else append the value to the existing text area content in a newline
                            var sCurrentValue = oDeliveryLineTextTextArea.getValue();

                            // Appending the Value to the existing value in a new line
                            if (sCurrentValue === "") {
                                oDeliveryLineTextTextArea.setValue(sValue);
                            } else {
                                oDeliveryLineTextTextArea.setValue(sCurrentValue + "\n" + sValue);
                            }

                            // Making the Text area scroll bar to come to the bottom
                            var sDeliveryLineTextTextAreaDom = oDeliveryLineTextTextArea.getFocusDomRef();
                            if (sDeliveryLineTextTextAreaDom.selectionStart === sDeliveryLineTextTextAreaDom.selectionEnd) {
                                sDeliveryLineTextTextAreaDom.scrollTop = sDeliveryLineTextTextAreaDom.scrollHeight;
                            }

                        },
                        /**
                         * Event handler for the 'press' event of the 'Text' icon for delivery lines for which 'TextExistsFlag' is true. Opens the
                         * corresponding dialog.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleDeliveryHeaderTextOpen : function() {
                            var oController = this;
                            var $textStandardReadDeferred, $textStandardReadPromise, $headerTextReadDeferred, $headerTextReadPromise;

                            // Prevent action if view has unsaved changes.
                            if (oController._stopActionIfViewDirty()) {
                                return;
                            }
                            var mParameters = {};
                            // Success function for 'TextStandard' model read. The model is set to the dialog
                            // oJSONModel - JSON Model for '/TextStandardSet'

                            var fnSuccessTextStandard = function(oJSONModel) {

                                // Setting the model to the fragment
                                oController._oDialogMaintainHeaderText.setModel(oJSONModel, "standardTexts");

                                $textStandardReadDeferred.resolve();

                            };

                            // Create the fragment if it does not exist
                            if (!oController._oDialogMaintainHeaderText) {
                                oController._oDialogMaintainHeaderText = new sap.ui.xmlfragment("maintainHeaderTextFragment",
                                        "com.zespri.awct.alloc.fragment.MaintainHeaderText", oController);
                                oController._oDialogMaintainHeaderText.setModel(oController.getView().getModel("i18n"), "i18n");
                                this.getView().addDependent(oController._oDialogMaintainHeaderText);
                            }

                            var oLibraryTextTable = sap.ui.core.Fragment.byId("maintainHeaderTextFragment", "maintainHeaderTextTable");
                            com.zespri.awct.util.CommonHelper.manageNoDataText(oLibraryTextTable);

                            // Disable the OK button in the fragment. The button is enabled only when a change is made in the textarea
                            sap.ui.core.Fragment.byId("maintainHeaderTextFragment", "deliveryHeaderTextOKButton").setEnabled(false);
                            sap.ui.core.Fragment.byId("maintainHeaderTextFragment", "maintainHeaderTextTextArea").attachEventOnce("liveChange",
                                    function() {
                                        sap.ui.core.Fragment.byId("maintainHeaderTextFragment", "deliveryHeaderTextOKButton").setEnabled(true);
                                    });

                            // Initializing the Search Field Value.
                            sap.ui.core.Fragment.byId("maintainHeaderTextFragment", "maintainHeaderTextSearchField").setValue("");

                            // Initializing the Text Area Value.
                            sap.ui.core.Fragment.byId("maintainHeaderTextFragment", "maintainHeaderTextTextArea").setValue("");

                            // Json model read for 'TextStandardSet'.
                            $textStandardReadDeferred = jQuery.Deferred();
                            $textStandardReadPromise = $textStandardReadDeferred.promise();
                            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/TextStandardSet", {}, fnSuccessTextStandard);

                            // Setting the existing Header Text to the Text Area
                            var oDeliveryHeaderTextTextArea = sap.ui.core.Fragment.byId("maintainHeaderTextFragment", "maintainHeaderTextTextArea");

                            // Getting the Delivery Header ID
                            var sDeliveryHeaderId = oController._oDeliveryHeaderContext.getProperty("DeliveryHeaderID");

                            // Success and error function for odata read for the existing header text
                            mParameters.success = function(oHeaderText) {
                                // Setting the Text area with the current Header Text
                                // DeliveryHeaderID should be replaced with the existing header text from the DeliveryHeaderSet in metadata
                                oDeliveryHeaderTextTextArea.setValue(oHeaderText.TextString);

                                // Indicate as done
                                $headerTextReadDeferred.resolve();
                            };
                            mParameters.error = function(oError) {
                                // Show the error dialog
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                // Setting the fragment status to non busy
                                $headerTextReadDeferred.resolve();
                            };
                            // OData read for the existing header text
                            $headerTextReadDeferred = jQuery.Deferred();
                            $headerTextReadPromise = $headerTextReadDeferred.promise();
                            oController.getView().getModel().read("/DeliveryHeaderSet('" + sDeliveryHeaderId + "')/Text", mParameters);

                            // Setting the fragment status to busy
                            // oController._oDialogMaintainHeaderText.setBusy(true);

                            // Opening the fragment
                            oController._oDialogMaintainHeaderText.setBusy(true);
                            oController._oDialogMaintainHeaderText.open();

                            // Set to busy=false once both services are complete
                            $.when($textStandardReadPromise, $headerTextReadPromise).done(function() {
                                oController._oDialogMaintainHeaderText.setBusy(false);
                            });
                        },

                        /**
                         * Event handler for the 'press' event of the Buttons in Library Text cells in Maintain Header Text Fragment. This method will
                         * append the Line Text of the selected cell to the content in the Text area
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleDeliveryHeaderTextAddButtonPress : function(oEvent) {
                            // Enable the OK button in the fragment by firing change event on the text area
                            sap.ui.core.Fragment.byId("maintainHeaderTextFragment", "maintainHeaderTextTextArea").fireLiveChange();

                            // Getting the current header text of the selected cell
                            var sValue = oEvent.getSource().getBindingContext("standardTexts").getProperty("Value");
                            var oDeliveryHeaderTextTextArea = sap.ui.core.Fragment.byId("maintainHeaderTextFragment", "maintainHeaderTextTextArea");

                            // set the value to the text area as it is else append the value to the existing text area content in a newline
                            var sCurrentValue = oDeliveryHeaderTextTextArea.getValue();

                            // Appending the Value to the existing value in a new line
                            if (sCurrentValue === "") {
                                oDeliveryHeaderTextTextArea.setValue(sValue);
                            } else {
                                oDeliveryHeaderTextTextArea.setValue(sCurrentValue + "\n" + sValue);
                            }

                            // Making the Text area scroll bar to come to the bottom
                            var sDeliveryHeaderTextTextAreaDom = oDeliveryHeaderTextTextArea.getFocusDomRef();
                            if (sDeliveryHeaderTextTextAreaDom.selectionStart === sDeliveryHeaderTextTextAreaDom.selectionEnd) {
                                sDeliveryHeaderTextTextAreaDom.scrollTop = sDeliveryHeaderTextTextAreaDom.scrollHeight;
                            }

                        },
                        /**
                         * Event handler for the 'LiveChange' event of the 'SearchField' in Maintain Header Text Fragment. The method will do filter
                         * based on the Library Text
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleDeliveryHeaderTextSearchLiveChange : function(oEvent) {

                            // Getting the search value and filtering it with Value
                            var sHeaderText = oEvent.getParameter("newValue");
                            var oHeaderTextFilter = new sap.ui.model.Filter("TextStandardID", sap.ui.model.FilterOperator.Contains, sHeaderText);
                            var oHeaderTextBinding = sap.ui.core.Fragment.byId("maintainHeaderTextFragment", "maintainHeaderTextTable").getBinding(
                                    "items");
                            oHeaderTextBinding.filter([oHeaderTextFilter]);
                        },
                        /**
                         * Event handler for the 'press' event of the 'OK' Button in Maintain Header Text Fragment. The method will update the model
                         * with the maintained Header Text.
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleDeliveryHeaderTextOKPress : function() {
                            var oController = this;
                            var oTextSetParameters = {};
                            var mParameters = {};

                            // Getting the Text Area object
                            var sDeliveryHeaderID = oController._oDeliveryHeaderContext.getProperty("DeliveryHeaderID");
                            var oDeliveryHeaderTextTextArea = sap.ui.core.Fragment.byId("maintainHeaderTextFragment", "maintainHeaderTextTextArea");

                            // Storing the parameter that are needed for the update operation
                            // The property name (Value) needs to be updated after meta data is updated with new property for text
                            oTextSetParameters.TextString = oDeliveryHeaderTextTextArea.getValue();
                            oTextSetParameters.DeliveryHeaderID = sDeliveryHeaderID;

                            // Success function for the update operation
                            mParameters.success = function() {
                                com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_ALLOCATION_MAINTAINHEADERTEXT_UPDATE_SUCCESS"));

                                // Closing the fragment
                                oController._oDialogMaintainHeaderText.setBusy(false);
                                oController._oDialogMaintainHeaderText.close();
                            };

                            // Error function for the create operation
                            mParameters.error = function(oError) {
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                // Setting the fragment status to not busy
                                oController._oDialogMaintainHeaderText.setBusy(false);

                            };

                            // Create is synchronous by default.
                            mParameters.async = true;

                            // Setting the status of the fragment to busy
                            oController._oDialogMaintainHeaderText.setBusy(true);

                            // Creating the 'DeliveryHeaderSet' with the Header Text
                            oController.getView().getModel().create("/TextSet", oTextSetParameters, mParameters);
                        },
                        /**
                         * Event handler for the 'press' event of the 'Cancel' Button in Maintain Header Text Fragment.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleDeliveryHeaderTextCancelPress : function() {
                            this._oDialogMaintainHeaderText.close();
                        },

                        /**
                         * Event handler for 'press' event of the 'Line actions' button.
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleLineActionsPress : function(oEvent) {
                            var oButton = oEvent.getSource();

                            // create action sheet only once
                            if (!this._oActionSheet) {
                                this._oActionSheet = sap.ui.xmlfragment("allocationActionSheetFragment",
                                        "com.zespri.awct.alloc.fragment.AllocationActionSheet", this);
                                this.getView().addDependent(this._oActionSheet);
                            }

                            this._oActionSheet.openBy(oButton);
                        },

                        /**
                         * Formatter method to return visibility for Action Sheet items only for Suppliers and Administrators
                         * 
                         * @param {Boolean}
                         *            bAdministrator Holds true if the user is an Administrator
                         * @param {Boolean}
                         *            bSupplier Holds true if the user is a Supplier
                         * @returns {Boolean} bPermitted true if the user is an Administrator or Supplier
                         */
                        formatActionSheetVisible : function(bAdministrator, bSupplier) {

                            if (bAdministrator || bSupplier) {
                                return true;
                            } else {
                                return false;
                            }
                        },

                        /**
                         * Returns the control to be used for the 'actionsContent' of the TableRowActionsExtension instance for this controller.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        _getTableRowActionsContent : function() {
                            var oI18NModel = sap.ui.getCore().getRootComponent().getModel("i18n");
                            var oODataModel = sap.ui.getCore().getRootComponent().getModel();

                            this._oDeliveryLineTextButton = new sap.m.Button({
                                icon : "sap-icon://document-text",
                                tooltip : {
                                    path : 'TextExistsFlag',
                                    formatter : this._formatDeliveryLineTextButtonTooltip
                                },
                                visible : false,
                                press : [this.handleDeliveryLineTextPress, this]
                            });

                            this._oAddSupplierButton = new sap.m.Button({
                                icon : "sap-icon://supplier",
                                enabled : "{viewState>/allowAllocationChange}",
                                visible : false,
                                tooltip : "{i18n>TXT_ALLOCATION_EDITALLOCATIONS_ADD_SUPPLIERS_TOOLTIP}",
                                press : [this.handleAddNewSuppliersButtonPress, this]
                            });

                            var oButtonsLayout = new sap.ui.commons.layout.HorizontalLayout({
                                content : [this._oDeliveryLineTextButton, new sap.m.Button({
                                    icon : "sap-icon://dimension",
                                    tooltip : "{i18n>TXT_ALLOCATION_MAINTAIN_BATCH_CHARACTERISTICS_TOOLTIP}",
                                    press : [this.handleMaintainBatchCharacteristicsOpen, this]
                                }), this._oAddSupplierButton, new sap.m.Button({
                                    icon : "sap-icon://order-status",
                                    tooltip : "{i18n>TXT_ALLOCATION_EDITALLOCATIONS_SUPPLY_PLAN_BUTTON_TOOLTIP}",
                                    press : [this.handleSupplyPlanNavigation, this]
                                })]
                            });

                            // Check Authorizations . If user is in Maitain mode , show "Maintain Line text " and "Add Supplier dialog"
                            if (com.zespri.awct.util.CommonHelper
                                    .isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                            com.zespri.awct.util.Enums.AuthorizationObject.Allocation,
                                            com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)) {
                                this._oDeliveryLineTextButton.setVisible(true);
                                this._oAddSupplierButton.setVisible(true);
                            }
                            // Set I18NModel and OData model
                            oButtonsLayout.setModel(oI18NModel, "i18n");
                            oButtonsLayout.setModel(this._oViewStateModel, "viewState");
                            oButtonsLayout.setModel(oODataModel);

                            return oButtonsLayout;
                        },
                        /**
                         * This method will navigate to SupplyPlan view when the user clicks supply plan icon button in the RowActions.
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleSupplyPlanNavigation : function(oEvent) {

                            var sDeliveryLineID = oEvent.getSource().getBindingContext().getProperty("DeliveryLineID");
                            // Navigate to supplyPlan with DeliveryLineID
                            this.getRouter().navTo("Allocation/SupplyPlan", {
                                DeliveryLineID : sDeliveryLineID
                            });
                        },
                        /**
                         * Formatter for tooltip of the 'Text' button for each delivery line
                         * 
                         * @param {Boolean}
                         *            bTextExistsFlag Indicator for Line Text maintained or not
                         * 
                         * @returns {String} The tooltip to be set, depending on the 'TextExistsFlag' of an 'AllocationLine' entity.
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        _formatDeliveryLineTextButtonTooltip : function(bTextExistsFlag) {
                            if (bTextExistsFlag) {
                                return com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_EDITALLOCATIONS_DELIVERY_LINE_TEXT_EXISTS_TOOLTIP");
                            } else {
                                return com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_EDITALLOCATIONS_DELIVERY_LINE_TEXT_TOOLTIP");
                            }
                        },

                        /**
                         * Event handler for the 'row actions' button for Delivery Lines.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleRowActionsPress : function(oEvent) {
                            this._oRowActionsExtension.showRowActions(oEvent.getSource().getBindingContext());
                        },

                        /**
                         * Event handler for 'press' event of the 'Add suppliers' button at delivery line level
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         */
                        handleAddNewSuppliersButtonPress : function(oEvent) {
                            // Prevent action if view has unsaved changes.
                            if (this._stopActionIfViewDirty()) {
                                return;
                            }

                            // Hide the row actions
                            this._oRowActionsExtension.hideRowActions();

                            // Storing the this pointer to oController
                            var oController = this;

                            // Getting the current context
                            var oAddSupplierContext = oEvent.getSource().getBindingContext();
                            var sUOM = oAddSupplierContext.getProperty("UOM");
                            var sDeliveryLineNumber = oAddSupplierContext.getProperty("DeliveryLineNumber");
                            var sDeliveryHeaderID = oAddSupplierContext.getProperty("DeliveryHeaderID");
                            var sDeliveryLineID = oAddSupplierContext.getProperty("DeliveryLineID");
                            var sDeliveryLineUpdateTime = oAddSupplierContext.getProperty("DeliveryLineUpdateTime");

                            // JSON creation success message for the function import '/GetUnassignedSuppliers'.
                            var fnSuccess = function(oJSONModel) {
                                // Checking whether the JSON is empty or not and then setting the no data text according to the context
                                if (oJSONModel.getData().results.length === 0) {
                                    var oUnassignedSuppliersTable = sap.ui.core.Fragment.byId("addSupplierDialog", "addSupplierTable");
                                    // destroy the previous items in the table
                                    oUnassignedSuppliersTable.destroyItems();
                                    oUnassignedSuppliersTable.setProperty("noDataText", com.zespri.awct.util.I18NHelper
                                            .getText("TXT_ALLOCATION_ADDSUPPLIER_TABLE_NO_ADDITIONAL_SUPPLIERS"));
                                    // set the busy state of the table to false
                                    oUnassignedSuppliersTable.setBusy(false);
                                } else {
                                    // Preparing the JSON Model with the unit of measurement, DeliveryAllocationID,AllocationUpdateTime and setting
                                    // the JSON model to
                                    // the fragment
                                    oJSONModel.setProperty("/UOM", sUOM);
                                    oJSONModel.setProperty("/DeliveryLineNumber", sDeliveryLineNumber);
                                    oJSONModel.setProperty("/DeliveryHeaderID", sDeliveryHeaderID);
                                    oJSONModel.setProperty("/DeliveryLineID", sDeliveryLineID);
                                    oJSONModel.setProperty("/DeliveryLineUpdateTime", sDeliveryLineUpdateTime);
                                    oController._oDialogAddSupplier.setModel(oJSONModel, "addSuppliersModel");
                                }
                                oController._oDialogAddSupplier.setBusy(false);
                            };

                            // Getting a JSON containing the suppliers which are not assigned to the current delivery line. This JSON is set to the
                            // 'AddSupplier' fragment
                            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GetUnassignedSuppliers", {
                                urlParameters : {
                                    "DeliveryLineID" : "'" + sDeliveryLineID + "'"
                                }
                            }, fnSuccess);

                            // Check whether the dialog instance already exist.
                            if (!oController._oDialogAddSupplier) {
                                oController._oDialogAddSupplier = new sap.ui.xmlfragment("addSupplierDialog",
                                        "com.zespri.awct.alloc.fragment.AddSupplier", this);
                                oController.getView().addDependent(oController._oDialogAddSupplier);
                            }
                            oController._oDialogAddSupplier.setBusy(true);

                            // Supplier Rel2 Relevant checkbox
                            var oSupplierRel2RelevantCheckbox = sap.ui.core.Fragment.byId("addSupplierDialog", "supplierRel2RelevantCheckbox");
                            oSupplierRel2RelevantCheckbox.setSelected(true);
                            // Checkbox is visible only for locked deliveries
                            if (this._oDeliveryHeaderContext.getProperty("Status") === com.zespri.awct.util.Enums.DeliveryStatus.Locked) {
                                oSupplierRel2RelevantCheckbox.setVisible(true);
                            } else {
                                oSupplierRel2RelevantCheckbox.setVisible(false);
                            }

                            var oSupplierTable = sap.ui.core.Fragment.byId("addSupplierDialog", "addSupplierTable");
                            com.zespri.awct.util.CommonHelper.manageNoDataText(oSupplierTable);

                            // Resetting the old search text from the search field before opening of the fragment 'AddSupplier'
                            sap.ui.core.Fragment.byId("addSupplierDialog", "addSupplierSearchField").setValue("");
                            oController._oDialogAddSupplier.open();
                        },

                        /**
                         * Event handler for 'list close' event of the Facet filter lists.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleFacetListClose : function() {
                            // TODO : Temporary fix : Tell the user that he cannot use the filters before saving/discarding changes. Better solution
                            // would be to not
                            // allow interaction with the filter in the first place.
                            if (this._stopActionIfViewDirty()) {
                                return;
                            }

                            // Refresh the table if the user actually changed any filter selections. We verify this, by checking the custom property
                            // that we have
                            // introduced to our FacetFilter control.
                            if (this.byId("facetFilterAllocation").getFiltersModifiedAfterListOpen()) {
                                this.byId("allocationTable").setBusy(true);
                                this._refreshTable();
                            }
                        },

                        /**
                         * Event handler for 'press' event of the 'Save' button
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleSavePress : function() {
                            // Basic assertions
                            jQuery.sap.assert(this.getHasUnsavedChanges(), "Save was clicked even though there is nothing to be saved!");
                            jQuery.sap.assert(!jQuery.isEmptyObject(this._mAllocationQuantityChanges),
                                    "Save was clicked even though there are no tracked quantity changes!");

                            // If there are invalid inputs, show toast and abort processing.
                            if (this._aInvalidAllocationQuantityInputs.length !== 0) {
                                var sErrorText = com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_EDITALLOCATIONS_ERRORS_BEFORE_SAVE_TOAST");
                                com.zespri.awct.util.NotificationHelper.showErrorToast(sErrorText);
                                return;
                            }

                            // Open dialog fragment for locked delivery
                            if (this._oDeliveryHeaderContext.getProperty("Status") === com.zespri.awct.util.Enums.DeliveryStatus.Locked) {
                                // Creating the instance only once and referring to the same instance every other time
                                if (!this._oLockedDeliverySaveDialog) {
                                    this._oLockedDeliverySaveDialog = new sap.ui.xmlfragment("LockedDeliverySaveFragment",
                                            "com.zespri.awct.alloc.fragment.EditAllocationsLockedDeliverySaveDialog", this);
                                    this.getView().addDependent(this._oLockedDeliverySaveDialog);
                                }
                                // Set selected for the checkbox
                                sap.ui.core.Fragment.byId("LockedDeliverySaveFragment", "supplierRel2RelevantCheckbox").setSelected(true);
                                this._oLockedDeliverySaveDialog.open();
                            } else {
                                this._saveBatchUpdate();
                            }
                        },

                        /**
                         * This method is pressed when the OK button in the dialog on saving a locked delivery.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleEditAllocationsLockedDeliveryOKPress : function() {
                            this._saveBatchUpdate();
                            this._oLockedDeliverySaveDialog.close();
                        },

                        /**
                         * This method is pressed when the close button in the dialog on saving a locked delivery.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleEditAllocationsLockedDeliveryClose : function() {
                            this._oLockedDeliverySaveDialog.close();
                        },

                        /**
                         * This is a private method for calling the batch update for saving a delivery
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        _saveBatchUpdate : function() {
                            // Loop through all tracked quantity changes and create a batch request.
                            var aBatchChanges = [];
                            var oModel = this.getView().getModel();

                            // Add header for locked delivery
                            if (this._oDeliveryHeaderContext.getProperty("Status") === com.zespri.awct.util.Enums.DeliveryStatus.Locked) {
                                // Set Request exemption header
                                oModel.setHeaders({
                                    "REL2-RELEVANT" : sap.ui.core.Fragment.byId("LockedDeliverySaveFragment", "supplierRel2RelevantCheckbox")
                                            .getSelected()
                                });
                            }

                            jQuery.each(this._mAllocationQuantityChanges, function(sPath, oEntity) {
                                // sProperty = The context path of the quantity update (this is the name of the property/key in the map)
                                // oEntity = An object with key and quantity properties of 'AllocationLine' entity
                                var oBatchOperation = oModel.createBatchOperation(sPath, "PATCH", oEntity);
                                aBatchChanges.push(oBatchOperation);
                            });

                            // Just before starting the batch update...
                            this._setViewBusy(true);

                            // Fire this batch request!
                            var oController = this;
                            oModel.addBatchChangeOperations(aBatchChanges);
                            oModel.submitBatch(function(oData, oResponse, aErrorResponses) {
                                oModel.setHeaders(null);
                                // Display Errors if any
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(aErrorResponses);
                                // Erfolg!
                                jQuery.sap.log.info("Allocation : Batch update was successful.");
                                oController._aChangedInputs = [];
                                oController._mAllocationQuantityChanges = {};
                                oController._setViewBusy(false);

                                // Update dirty state
                                oController.setHasUnsavedChanges(false);

                                // Refresh table
                                oController._refreshTable();
                            }, function(oError) {
                                // Error!
                                oModel.setHeaders(null);
                                jQuery.sap.log.error("Allocation : Batch update failed.");
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);

                                oController._setViewBusy(false);
                            });
                        },

                        /**
                         * Helper to set the view to busy. Footer and view need to both be set to 'busy'
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @param {Boolean}
                         *            bBusy Indicates whether the view is to be set to busy state
                         */
                        _setViewBusy : function(bBusy) {
                            this.getView().setBusy(bBusy);
                            this.byId("pageEditOrderAllocation").getFooter().setBusy(bBusy);
                        },

                        /**
                         * Event handler for the 'press' event of the 'Discard Changes' button
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleDiscardChangesPress : function() {
                            // Basic assertions
                            jQuery.sap.assert(this.getHasUnsavedChanges(), "Cancel was clicked even though there is nothing to be saved!");

                            // Inline function for what to do if the user confirms the 'Discard changes' action
                            var oController = this;
                            var fnOnDiscardChangesConfirmed = function() {
                                // Clear the map of tracked quantity changes.
                                oController._mAllocationQuantityChanges = {};

                                // Clear all value states for invalid inputs, and then clear the array
                                jQuery.each(oController._aInvalidAllocationQuantityInputs, function(i, oInput) {
                                    oInput.setValueState(sap.ui.core.ValueState.None);
                                });
                                oController._aInvalidAllocationQuantityInputs = [];

                                // Revert changed inputs to their original values
                                jQuery.each(oController._aChangedInputs, function(i, oInput) {
                                    oInput.getBinding("value").refresh(true);
                                });
                                oController._aChangedInputs = [];

                                // Set dirty = false
                                oController.setHasUnsavedChanges(false);

                                // Done!
                                var sMessageText = com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_EDITALLOCATIONS_CHANGES_DISCARDED_TOAST");
                                com.zespri.awct.util.NotificationHelper.showSuccessToast(sMessageText);
                            };

                            // Show confirmation dialog to user before proceeding.
                            var sConfirmDialogText = com.zespri.awct.util.I18NHelper
                                    .getText("TXT_ALLOCATION_EDITALLOCATIONS_CONFIRM_DISCARD_CHANGES_DIALOG");
                            com.zespri.awct.util.NotificationHelper.showConfirmDialog(sConfirmDialogText, fnOnDiscardChangesConfirmed);
                        },

                        /* -------------- MAINTAIN BATCH CHARACTERISTICS ---------------------- */
                        /**
                         * Event handler for click of the 'Maintain BC' row action
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleMaintainBatchCharacteristicsOpen : function(oEvent) {
                            var $domainValuesReadDeferred, $domainValuesReadPromise, $batchCharacteristicsReadDeferred, $batchCharacteristicsReadPromise;
                            var oController = this;

                            // If view is dirty, tell the user he must first save his changes.
                            if (this._stopActionIfViewDirty()) {
                                return;
                            }

                            // If the delivery is 'Locked' or user is not allowed to Maitain (only display), open 'View Batch Characteristics',
                            // instead of 'Maintain Batch Characteristics'.
                            var sDeliveryLineID = oEvent.getSource().getBindingContext().getProperty("DeliveryLineID");
                            if ((!com.zespri.awct.util.CommonHelper
                                    .isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                            com.zespri.awct.util.Enums.AuthorizationObject.Allocation,
                                            com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)) ||
                                    this._oDeliveryHeaderContext.getProperty("Status") === com.zespri.awct.util.Enums.DeliveryStatus.Released) {
                                this._openViewBatchCharacteristicsDialog(sDeliveryLineID);
                                return;
                            }

                            // Lazy-instantiate the dialog if needed
                            if (!this._oMaintainBatchCharacteristicsDialog) {
                                this._oMaintainBatchCharacteristicsDialog = sap.ui.xmlfragment("maintainBCDialog",
                                        "com.zespri.awct.alloc.fragment.EditAllocationsMaintainBatchCharacteristics", this);
                                this.getView().addDependent(this._oMaintainBatchCharacteristicsDialog);
                            } else {
                                // If it was already instantiated, reset checkbox and 'propagate to lines' input to default state
                                sap.ui.core.Fragment.byId("maintainBCDialog", "propagateToLinesCheckBox").setSelected(false);
                                sap.ui.core.Fragment.byId("maintainBCDialog", "propagateToLinesInput").setEnabled(false);
                                sap.ui.core.Fragment.byId("maintainBCDialog", "propagateUpdateRadioButton").setEnabled(false);
                                sap.ui.core.Fragment.byId("maintainBCDialog", "propagateOverwriteRadioButton").setEnabled(false);
                            }

                            var oBatchCharacteristicsTable = sap.ui.core.Fragment.byId("maintainBCDialog", "maintainBCTable");
                            com.zespri.awct.util.CommonHelper.manageNoDataText(oBatchCharacteristicsTable);

                            // Indicate using customData that this table is being loaded. This is used by CommonHelper.manageNoDataText() to show
                            // 'Loading...' as
                            // required. This is needed here, since is bound to a path in XML, but the data for it is loaded via a READ (not via
                            // ODataModel).. so 2
                            // sets of updateStarted/updateFinished events are fired and there is no other way to determine that data is being
                            // fetched.
                            oBatchCharacteristicsTable.addCustomData(new sap.ui.core.CustomData({
                                key : "loadingData",
                                value : true
                            }));

                            // Prepare the model
                            if (this._oMaintainBatchCharacteristicsModel) {
                                this._oMaintainBatchCharacteristicsModel.destroy();
                            }
                            this._oMaintainBatchCharacteristicsModel = new sap.ui.model.json.JSONModel();
                            this._oMaintainBatchCharacteristicsDialog.setModel(this._oMaintainBatchCharacteristicsModel, "maintainBC");
                            this._oMaintainBatchCharacteristicsModel.setProperty("/isPropagateSelected", false);

                            // Store some additional info in the model : Which DeliveryLineNumber and DeliveryHeaderID are we maintaining BC for?
                            // Needed later
                            // during save and 'Propagate to lines' query.
                            var sDeliveryLineNumber = oEvent.getSource().getBindingContext().getProperty("DeliveryLineNumber");
                            var sDeliveryHeaderID = oEvent.getSource().getBindingContext().getProperty("DeliveryHeaderID");
                            this._oMaintainBatchCharacteristicsModel.setProperty("/CurrentDeliveryLineNumber", sDeliveryLineNumber);
                            this._oMaintainBatchCharacteristicsModel.setProperty("/CurrentDeliveryHeaderID", sDeliveryHeaderID);
                            this._oMaintainBatchCharacteristicsModel.setProperty("/CurrentDeliveryLineID", sDeliveryLineID);

                            // Open the dialog
                            this._oRowActionsExtension.hideRowActions();
                            this._oMaintainBatchCharacteristicsDialog.setBusy(true);
                            this._oMaintainBatchCharacteristicsDialog.open();

                            // Get the existing Batch Characteristics for the selected delivery line
                            $domainValuesReadDeferred = jQuery.Deferred();
                            $domainValuesReadPromise = $domainValuesReadDeferred.promise();

                            this.getView().getModel().read("/BatchCharacteristicsSet", {
                                urlParameters : {
                                    "$filter" : "DeliveryLineID eq '" + sDeliveryLineID + "'",
                                    "$expand" : "BatchCharacteristicsValueSet"
                                },
                                success : function(oData) {
                                    fnBatchCharacteristicsReadSuccess(oData);
                                }
                            });

                            // Get the domain values (allowed values) for 'Batch Characteristics Names'.
                            $batchCharacteristicsReadDeferred = jQuery.Deferred();
                            $batchCharacteristicsReadPromise = $batchCharacteristicsReadDeferred.promise();
                            this.getView().getModel().read("/BatchCharStandardSet", {
                                success : function(oData) {
                                    fnBatchCharacteristicsNameDomainValuesReadSuccess(oData);
                                }
                            });

                            // Once all backend calls are done, remove 'busy' from the dialog.
                            jQuery.when($domainValuesReadPromise, $batchCharacteristicsReadPromise).done(function() {
                                oController._oMaintainBatchCharacteristicsDialog.setBusy(false);
                                oController._updateBatchCharacteristicsItemEnabled();

                                // Remove the 'loading' custom data that we set earlier in this method.
                                oBatchCharacteristicsTable.removeAllCustomData();
                            });

                            // Success handler for getting BC values for the current delivery line. Update the 'maintainBC' model accordingly.
                            var fnBatchCharacteristicsReadSuccess = function(oData) {
                                var aBatchCharacteristics = oData.results;

                                // Add 'editable=false' property for fetched results. Existing BCs cannot be 'edited'. They can be deleted though. Add
                                // 'BCNameSelected=true' to indicate that a Batch Char name has been selected for this row.
                                $.each(aBatchCharacteristics, function(i, oBatchCharacteristic) {
                                    oBatchCharacteristic.editable = false;
                                    oBatchCharacteristic.BCNameSelected = true;

                                    // Existing values come in the 'Value' property of the 'BatchCharacteristicValue' entity, but in /GenericSearchSet
                                    // (F4 values), the value comes in the 'Key' property. To adjust this, we copy 'Value' into a new property called
                                    // 'Key'.
                                    $.each(oBatchCharacteristic.BatchCharacteristicsValueSet.results, function(j, oBCValue) {
                                        oBCValue.Key = oBCValue.Value;
                                    });
                                });

                                // Add an empty row in the end
                                aBatchCharacteristics.push({
                                    BatchCharacteristicsID : "",
                                    BatchCharacteristicsValueSet : {
                                        results : []
                                    },
                                    CharacteristicName : "",
                                    DeliveryLineID : sDeliveryLineID,
                                    BCNameSelected : false,
                                    Operation : oController._MaintainBCOperation.Include
                                });
                                // Add it to the 'maintainBC' model
                                oController._oMaintainBatchCharacteristicsModel.setProperty("/BatchCharacteristics", aBatchCharacteristics);

                                // Resolve (indicates completion of async task)
                                $batchCharacteristicsReadDeferred.resolve();
                            };

                            // Success handler for getting the allowed values for BC name
                            var fnBatchCharacteristicsNameDomainValuesReadSuccess = function(oData) {
                                var aBatchCharacteristicsDomainValues = oData.results;

                                // Add an empty selection
                                aBatchCharacteristicsDomainValues.unshift({
                                    BatchCharName : "",
                                    enabled : false
                                });

                                // Add it to the 'maintainBC' model
                                oController._oMaintainBatchCharacteristicsModel.setProperty("/BatchCharacteristicsDomainValues",
                                        aBatchCharacteristicsDomainValues);

                                $domainValuesReadDeferred.resolve();
                            };
                        },

                        /**
                         * Private function to open the 'View Batch Characteristics' dialog. This is opened instead of 'Maintain BC', if the delivery
                         * has status 'Released'. To maintain Batch Characteristics for a released delivery, it must first be locked.
                         * 
                         * @private
                         * @param {String}
                         *            sDeliveryLineID The delivery line ID for which batch characteristics need to be displayed.
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        _openViewBatchCharacteristicsDialog : function(sDeliveryLineID) {
                            // Lazy-instantiate dialog if needed
                            if (!this._oViewBatchCharacteristicsDialog) {
                                this._oViewBatchCharacteristicsDialog = sap.ui.xmlfragment("viewBCDialog",
                                        "com.zespri.awct.alloc.fragment.ViewBatchCharacteristics", this);
                                this.getView().addDependent(this._oViewBatchCharacteristicsDialog);
                            }

                            // Check Authorizations . If user is in Display mode , setText to toolbar text "Maintain BC is not allowed"
                            if (!com.zespri.awct.util.CommonHelper
                                    .isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                            com.zespri.awct.util.Enums.AuthorizationObject.Allocation,
                                            com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)) {
                                sap.ui.core.Fragment.byId("viewBCDialog", "viewBCToolBar").getContent()[0].setText(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_ALLOCATION_VIEW_BATCH_CHARACTERISTICS_TOOLBAR_NOT_AUTHORIZES_TEXT"));

                            }

                            // Open the dialog
                            this._oViewBatchCharacteristicsDialog.setBusy(true);
                            this._oViewBatchCharacteristicsDialog.open();
                            var oController = this;

                            // Hide row actions
                            this._oRowActionsExtension.hideRowActions();

                            // Get the batch characteristics for the delivery line
                            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/BatchCharacteristicsSet", {
                                urlParameters : {
                                    "$filter" : "DeliveryLineID eq '" + sDeliveryLineID + "'",
                                    "$expand" : "BatchCharacteristicsValueSet"
                                }
                            }, function(oModel) {
                                // Success handler
                                oController._oViewBatchCharacteristicsDialog.setModel(oModel);

                                // Getting the count of batch characteristics and setting it as the table header
                                var iBatchCharacteristicsCount = oModel.getData().results.length;
                                sap.ui.core.Fragment.byId("viewBCDialog", "viewBatchCharacteristicsTableHeader").setText(
                                        com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_VIEW_BATCH_CHARACTERISTICS_TABLE_TITLE",
                                                [iBatchCharacteristicsCount]));
                                oController._oViewBatchCharacteristicsDialog.setBusy(false);
                            });
                        },

                        /**
                         * Event handler for the 'OK' button press in the 'View Batch Characteristics' dialog
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleViewBatchCharacteristicsOKPress : function() {
                            this._oViewBatchCharacteristicsDialog.close();
                        },

                        /**
                         * Event handler for the 'press' event of the 'Maintain BC' dialog's 'Cancel' button.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleMaintainBatchCharacteristicsCancel : function() {
                            this._oMaintainBatchCharacteristicsDialog.close();
                        },

                        /**
                         * Formatter for batch characteristics values
                         * 
                         * @param {Object}
                         *            oBatchCharacteristicsValue Object containing a 'results' array with all selected batch characteristics values
                         *            for a row
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        formatViewBatchCharacteristicsValuesText : function(oBatchCharacteristicsValue) {
                            var fnBatchCharacteristicsValueReturn = function(oBatchCharValue) {
                                return oBatchCharValue.Value;
                            };

                            // Return values separated by ","
                            return oBatchCharacteristicsValue.results.map(fnBatchCharacteristicsValueReturn).join(", ");
                        },

                        /**
                         * Formatter function for the column 'Include/Exclude' in 'ViewBatchCharacteristics' fragment
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @param {String}
                         *            sOperation String of Operations
                         * @returns {String} if sOperation = "E" then 'Exclude' , "I" = 'Include'
                         */
                        formatViewBatchCharacteristicsOptionText : function(sOperation) {
                            // Checking whether the operations is include or exclude

                            if (sOperation === com.zespri.awct.util.Enums.ViewBCOperation.Exclude) {
                                return com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_VIEW_BATCH_CHARACTERISTICS_EXCLUDE");

                            } else if (sOperation === com.zespri.awct.util.Enums.ViewBCOperation.Include) {
                                return com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_VIEW_BATCH_CHARACTERISTICS_INCLUDE");
                            } else {
                                return "";
                            }
                        },

                        /**
                         * Formatter for the 'enabled' property of the 'Copy flag' checkbox on each row of 'Maintain BC' dialog. This is needed, since
                         * the 'enabled' state for these checkboxes depends on two things : 'Propagate To Lines' checkbox must be checked AND a Batch
                         * Char name must be selected for that line.
                         * 
                         * @param {Boolean}
                         *            bIsPropagateSelected True, if the user selected the 'Also apply to lines...' checkbox.
                         * @param {Boolean}
                         *            bIsBCNameSelected True, if the user selected a batch characteristic name (other than empty) for that row.
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocationformatCopyFlagCheckBoxEnabled
                         */
                        formatCopyFlagCheckBoxEnabled : function(bIsPropagateSelected, bIsBCNameSelected) {
                            if (bIsPropagateSelected && bIsBCNameSelected) {
                                return true;
                            } else {
                                return false;
                            }
                        },

                        /**
                         * Event handler for the 'select' event of the 'propagate to lines' checkbox.
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleMaintainBatchCharacteristicsPropagateSelect : function(oEvent) {
                            // If checked, enable the 'propagate To Lines' input.
                            var bChecked = oEvent.getParameter("selected");
                            var oInput = sap.ui.core.Fragment.byId("maintainBCDialog", "propagateToLinesInput");
                            var oUpdateRadioButton = sap.ui.core.Fragment.byId("maintainBCDialog", "propagateUpdateRadioButton");
                            var oOverwriteRadioButton = sap.ui.core.Fragment.byId("maintainBCDialog", "propagateOverwriteRadioButton");
                            if (bChecked) {
                                oInput.setEnabled(true);
                                oUpdateRadioButton.setEnabled(true);
                                oOverwriteRadioButton.setEnabled(true);
                                this._oMaintainBatchCharacteristicsModel.setProperty("/isPropagateSelected", true);
                            } else {
                                oInput.setEnabled(false);
                                oUpdateRadioButton.setEnabled(false);
                                oOverwriteRadioButton.setEnabled(false);
                                this._oMaintainBatchCharacteristicsModel.setProperty("/isPropagateSelected", false);
                            }
                        },

                        /**
                         * Event handler for the 'press' event of the 'Save' button in the 'Maintain Batch Characteristics' dialog.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleMaintainBatchCharacteristicsSave : function() {
                            var oMaintainBCModel = this._oMaintainBatchCharacteristicsDialog.getModel("maintainBC");
                            var bErrorsFound = false;
                            var oController = this;
                            var aBatchCharacteristicsForSave = [];
                            var sMessage = "";

                            // Loop through the /BatchCharacteristics path in the 'Maintain BC' model and transform data to the format suitable for
                            // sending to the backend.
                            // Also simultaneously do error handling => If for a row, a 'Batch Char Name' is selected, but no corresponding values,
                            // the 'values' input field needs to be set to error state.
                            var aBatchCharacteristics = oMaintainBCModel.getProperty("/BatchCharacteristics");
                            var bCopyFlagSelected = false;
                            $.each(aBatchCharacteristics, function(i, oBC) {
                                // If for a row 'BC Name' isn't selected, then ignore it (and proceed to check the next row)
                                if (oBC.CharacteristicName === "") {
                                    return true;
                                }

                                // If BC Name is selected, but there are no values, then this is an error
                                if (oBC.BatchCharacteristicsValueSet.results.length === 0) {
                                    bErrorsFound = true;
                                    oBC.error = true;
                                    return true;
                                }

                                // As we loop through all rows, we check whether at least one 'CopyFlag' is selected. This is used in a subsequent
                                // validation
                                if (oBC.CopyFlag) {
                                    bCopyFlagSelected = true;
                                }

                                // Valid record? Add it to our array of BCs to save.
                                aBatchCharacteristicsForSave.push(oBC);
                            });

                            // If errors were found, the 'error' property for the corresponding rows must have been updated. Update the model (to
                            // refresh bindings for
                            // valueState of 'BC Values' input fields) and abort processing.
                            if (bErrorsFound) {
                                // Update the model
                                oMaintainBCModel.setProperty("/BatchCharacteristics", aBatchCharacteristics);

                                // Show an error toast
                                sMessage = com.zespri.awct.util.I18NHelper
                                        .getText("TXT_ALLOCATION_MAINTAIN_BATCH_CHARACTERISTICS_ERROR_CORRECT_HIGHLIGHTED_FIELDS");
                                com.zespri.awct.util.NotificationHelper.showErrorToast(sMessage);
                                return;
                            }

                            // If 'Also apply to lines...' is selected, but no 'Copy' checkboxes were selected, this is an error.
                            var oPropagateCheckBox = sap.ui.core.Fragment.byId("maintainBCDialog", "propagateToLinesCheckBox");
                            if (!bCopyFlagSelected && oPropagateCheckBox.getSelected()) {
                                sMessage = com.zespri.awct.util.I18NHelper
                                        .getText("TXT_ALLOCATION_MAINTAIN_BATCH_CHARACTERISTICS_ERROR_NO_COPY_FLAG");
                                com.zespri.awct.util.NotificationHelper.showErrorToast(sMessage);
                                return;
                            }

                            // If 'Also apply to lines...' is selected, but no target delivery lines are selected, this is an error.
                            var aPropagateToLines = oMaintainBCModel.getProperty("/PropagateToLines");
                            var oPropagateLinesInput = sap.ui.core.Fragment.byId("maintainBCDialog", "propagateToLinesInput");
                            if (oPropagateCheckBox.getSelected() && oPropagateLinesInput.getValue() === "") {
                                sMessage = com.zespri.awct.util.I18NHelper
                                        .getText("TXT_ALLOCATION_MAINTAIN_BATCH_CHARACTERISTICS_ERROR_NO_TARGET_LINES");
                                com.zespri.awct.util.NotificationHelper.showErrorToast(sMessage);
                                return;
                            }

                            // No errors found, proceed with Save. Set the 'business action' header as required, if 'Update' or 'Overwrite' was
                            // selected.
                            var sBusinessActionHeaderValue;
                            var oUpdateRadioButton = sap.ui.core.Fragment.byId("maintainBCDialog", "propagateUpdateRadioButton");
                            if (oPropagateCheckBox.getSelected()) {
                                if (oUpdateRadioButton.getSelected()) {
                                    sBusinessActionHeaderValue = this._MaintainBCBusinessAction.Update;
                                } else {
                                    sBusinessActionHeaderValue = this._MaintainBCBusinessAction.Overwrite;
                                }
                            }

                            // If necessary (ie, if 'Also apply to lines...' option was chosen), set the 'BusinessAction' request header
                            if (sBusinessActionHeaderValue) {
                                this.getView().getModel().setHeaders({
                                    BusinessAction : sBusinessActionHeaderValue
                                });
                            }

                            // Create the batch CREATE operations (for Batch Characteristics)
                            var aBatchOperations = [];
                            $.each(aBatchCharacteristics, function(i, oBC) {
                                // Ignore empty rows (for which no BC name has been selected)
                                if (oBC.CharacteristicName === "") {
                                    return true;
                                }

                                // Transform the selected values for this BC
                                var aBCValues = [];
                                $.each(oBC.BatchCharacteristicsValueSet.results, function(j, oValue) {
                                    aBCValues.push({
                                        Value : oValue.Key
                                    });
                                });

                                // Form the payload for 1 BC (Along with its values)
                                var oPayload = {
                                    DeliveryLineID : oMaintainBCModel.getProperty("/CurrentDeliveryLineID"),
                                    CharacteristicName : oBC.CharacteristicName,
                                    Operation : oBC.Operation,
                                    BatchCharacteristicsValueSet : aBCValues,
                                    CopyFlag : !oBC.CopyFlag ? false : true
                                };

                                // Create batch operation
                                var oOperation = oController.getView().getModel().createBatchOperation("/BatchCharacteristicsSet", "POST", oPayload);
                                aBatchOperations.push(oOperation);
                            });

                            // Create the batch CREATE operations (for 'copy to' delivery lines) if needed.
                            if (oPropagateCheckBox.getSelected()) {
                                $.each(aPropagateToLines, function(i, oTargetLine) {
                                    // We are only interested in lines that have 'selected=true' (what the user selected)
                                    if (oTargetLine.selected !== true) {
                                        return true;
                                    }

                                    // Create operation payload
                                    var oPayload = {
                                        DeliveryLineID : oTargetLine.DeliveryLineID,
                                        DeliveryLineUpdateTime : com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString(
                                                oTargetLine.DeliveryLineUpdateTime, true)
                                    };

                                    // Create batch operation
                                    var oOperation = oController.getView().getModel().createBatchOperation("/BatchCharacteristicsTargetSet", "POST",
                                            oPayload);
                                    aBatchOperations.push(oOperation);
                                });
                            }

                            // If there are no operations in the batch, just close the dialog. This happens if there are 0 batch characteristics rows
                            // in the dialog (except the last 'empty row' row)
                            if (aBatchOperations.length === 0) {
                                // Remove headers and refresh table
                                oController.getView().getModel().setHeaders(null);
                                oController._refreshTable();

                                // Close
                                oController._oMaintainBatchCharacteristicsDialog.close();
                            } else {
                                // Create and submit the batch request.
                                this.getView().getModel().addBatchChangeOperations(aBatchOperations);
                                this._oMaintainBatchCharacteristicsDialog.setBusy(true);

                                this.getView().getModel().submitBatch(
                                        function(oData, oResponse, aErrorResponses) {
                                            // Display Errors if any
                                            var bErrorMessageShown = com.zespri.awct.util.NotificationHelper.handleErrorMessage(aErrorResponses);
                                            if (!bErrorMessageShown) {
                                                // Batch submit done.
                                                sMessage = com.zespri.awct.util.I18NHelper
                                                        .getText("TXT_ALLOCATION_MAINTAIN_BATCH_CHARACTERISTICS_SAVE_SUCCESS_TOAST");
                                                com.zespri.awct.util.NotificationHelper.showSuccessToast(sMessage);
                                            }
                                            oController._oMaintainBatchCharacteristicsDialog.setBusy(false);
                                            oController._oMaintainBatchCharacteristicsDialog.close();

                                            // Remove the 'BusinessAction' header if set.
                                            oController.getView().getModel().setHeaders(null);

                                            // Refresh the allocation table
                                            oController._refreshTable();
                                        }, function(oError) {
                                            // Error
                                            com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                            oController.getView().getModel().setHeaders(null);

                                            oController._oMaintainBatchCharacteristicsDialog.setBusy(false);
                                            oController._oMaintainBatchCharacteristicsDialog.close();

                                        });
                            }
                        },

                        /**
                         * Event handler for the 'change' event of the sap.m.Select for BC Name.
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleMaintainBatchCharacteristicsNameSelectChange : function(oEvent) {
                            // Get the 'maintainBC' model
                            var oMaintainBCModel = this._oMaintainBatchCharacteristicsDialog.getModel("maintainBC");
                            var oController = this;

                            // Get the index of the row from which this 'select' event came
                            var aContextPathParts = oEvent.getSource().getBindingContext("maintainBC").getPath().split("/");
                            var iCurrentRowIndex = parseInt(aContextPathParts[aContextPathParts.length - 1], 10);

                            // Set the selected item as 'disabled', so that the same BC name cannot be selected in another row.
                            this._updateBatchCharacteristicsItemEnabled();

                            // Clear the BC values selection in the current row
                            oMaintainBCModel.setProperty("/BatchCharacteristics/" + iCurrentRowIndex + "/BatchCharacteristicsValueSet", {
                                results : []
                            });

                            // Was the BC name changed to something other than 'empty'?
                            if (oEvent.getSource().getSelectedKey() !== "") {
                                // Get the total number of BC rows
                                var aBatchCharacteristics = oMaintainBCModel.getProperty("/BatchCharacteristics");
                                var iRowsCount = aBatchCharacteristics.length;
                                var iMaintainBCDialogScrollPosition = null;

                                // If this event came from the last row, then add a new empty row.
                                if (iCurrentRowIndex === (iRowsCount - 1)) {

                                    // Get the Scroll position of the dialog ,
                                    // dialog will be repositioned to the same scroll postion once it has been rerendered after adding new empty row
                                    var maintainBCDomRef = this._oMaintainBatchCharacteristicsDialog.getDomRef();
                                    var maintainBCDoMSection = maintainBCDomRef.getElementsByTagName("section")[0];
                                    // Get the current scroll position
                                    iMaintainBCDialogScrollPosition = maintainBCDoMSection.scrollHeight;

                                    aBatchCharacteristics.push({
                                        BatchCharacteristicsID : "",
                                        BatchCharacteristicsValueSet : {
                                            results : []
                                        },
                                        CharacteristicName : "",
                                        Operation : oController._MaintainBCOperation.Include,
                                        BCNameSelected : false
                                    });
                                }

                                // Get the maintain BC table reference
                                var oMaintainBCTable = sap.ui.core.Fragment.byId("maintainBCDialog", "maintainBCTable");

                                // Event handler for maintain BC table update finished
                                var fnMaintainBCTableUpdateFinished = function() {
                                    // Queue a rerender, so that the dialog is repositioned at the new center of the screen.
                                    oController._oMaintainBatchCharacteristicsDialog.rerender();

                                    // Position the scroll bar to the last select change position
                                    // Since the dialog is rerendered , get the newly rendered dialog-section DOM Reference and update it.
                                    if (iMaintainBCDialogScrollPosition) {
                                        var maintainBCDomRefAfterReRender = oController._oMaintainBatchCharacteristicsDialog.getDomRef();
                                        var maintainBCDoMSectionAfterReRender = maintainBCDomRefAfterReRender.getElementsByTagName("section")[0];
                                        // change the rerendered dialog's scroll position with the position which was stored earlier in
                                        // "iMaintainBCDialogScrollPosition"
                                        maintainBCDoMSectionAfterReRender.scrollTop = iMaintainBCDialogScrollPosition;
                                    }

                                    // Detach the update finished event
                                    oMaintainBCTable.detachUpdateFinished(fnMaintainBCTableUpdateFinished);
                                };
                                // After the table is updated with new data , rerender the dialog and adjust scroll position
                                oMaintainBCTable.attachUpdateFinished(fnMaintainBCTableUpdateFinished);

                                oMaintainBCModel.setProperty("/BatchCharacteristics", aBatchCharacteristics);

                                // Set 'BCNameSelected=true' for the current row, so that I/E/D and Values get enabled.
                                oMaintainBCModel.setProperty("/BatchCharacteristics/" + iCurrentRowIndex + "/BCNameSelected", true);
                            } else {
                                // If "empty" BC name was selected, then disallow I/E/D and Values selection
                                oMaintainBCModel.setProperty("/BatchCharacteristics/" + iCurrentRowIndex + "/BCNameSelected", false);
                            }
                        },

                        /**
                         * Private helper function for 'Maintain Batch Characteristics' dialog. Updates the model to indicate all Batch
                         * Characteristics names that have already been selected, cannot be selected again for a new row.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        _updateBatchCharacteristicsItemEnabled : function() {
                            // Make a list of all BC Names that are already selected, excluding ones that are marked as 'Delete'.
                            var aSelectedBCNames = [];
                            var oMaintainBCModel = this._oMaintainBatchCharacteristicsDialog.getModel("maintainBC");
                            var aBatchCharacteristics = oMaintainBCModel.getProperty("/BatchCharacteristics");
                            $.each(aBatchCharacteristics, function(i, oBC) {
                                // Disregard the last row (empty row)
                                if (oBC.CharacteristicName !== "") {
                                    aSelectedBCNames.push(oBC.CharacteristicName);
                                }
                            });

                            // Mark all the BCs that are selected (aSelectedBCNames) as enabled=false, and others as enabled=true
                            var aDomainValues = oMaintainBCModel.getProperty("/BatchCharacteristicsDomainValues");
                            $.each(aDomainValues, function(i, oValue) {
                                var bFound = false;
                                $.each(aSelectedBCNames, function(j, sSelectedBCName) {
                                    if (oValue.BatchCharName === sSelectedBCName) {
                                        bFound = true;
                                        oValue.enabled = false;
                                        return false;
                                    }
                                });

                                if (!bFound) {
                                    oValue.enabled = true;
                                }
                            });

                            // Small "Hack" to convince the framework that the model values have changed. Will trigger re-render as required.
                            oMaintainBCModel.setProperty("/BatchCharacteristicsDomainValues", null);
                            oMaintainBCModel.setProperty("/BatchCharacteristicsDomainValues", aDomainValues);
                        },

                        /**
                         * Event handler for the 'liveChange' event of the "BC Values" search help dialog.
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleMaintainBatchCharacteristicsValueHelpLiveChange : function(oEvent) {
                            // Get the value that the user typed and form a filter
                            var sSearchTerm = oEvent.getParameter("value");
                            var oFilter = new sap.ui.model.Filter("Key", sap.ui.model.FilterOperator.StartsWith, sSearchTerm);

                            // Apply the filter to the search help's binding
                            this._oMaintainBatchCharacteristicsSearchHelpDialog.getBinding("items").filter(oFilter);
                        },

                        /**
                         * Event handler for F4 for each row in the maintain BC dialog.
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleMaintainBatchCharacteristicsValueHelpOpen : function(oEvent) {
                            // Get the 'maintainBC' model
                            var oMaintainBCModel = this._oMaintainBatchCharacteristicsDialog.getModel("maintainBC");

                            // Lazy-instantiate dialog if needed
                            if (!this._oMaintainBatchCharacteristicsSearchHelpDialog) {

                                // Instantiate and set models
                                this._oMaintainBatchCharacteristicsSearchHelpDialog = sap.ui.xmlfragment(
                                        "com.zespri.awct.alloc.fragment.EditAllocationsMaintainBatchCharacteristicsValuesF4", this);
                                this._oMaintainBatchCharacteristicsSearchHelpDialog._oTable.setGrowing(false);

                                // Set busy indicator delay to 0. We need to do setBusy on a private variable (_dialog) instead of the
                                // TableSelectDialog. UI5 bug?
                                this._oMaintainBatchCharacteristicsSearchHelpDialog._dialog.setBusyIndicatorDelay(0);
                            }

                            // When ManageNoDataText method will be used , Loading text will not be removed if there are 0 records. So this table is
                            // handled manually.
                            var sLoadingText = com.zespri.awct.util.I18NHelper.getText("TXT_LIST_LOADING_LABEL");
                            // Show "Loading..."
                            this._oMaintainBatchCharacteristicsSearchHelpDialog._table.setNoDataText(sLoadingText);

                            // Setting i18n and data models (addDependent() is not sufficient here. TODO : Why?)
                            var oI18NModel = this._oMaintainBatchCharacteristicsDialog.getModel("i18n");
                            this._oMaintainBatchCharacteristicsSearchHelpDialog.setModel(oI18NModel, "i18n");
                            this._oMaintainBatchCharacteristicsSearchHelpDialog.setModel(oMaintainBCModel, "maintainBC");

                            // Open the dialog
                            this._oMaintainBatchCharacteristicsSearchHelpDialog.open();

                            // Clear the filters every time the dialog is opened
                            this._oMaintainBatchCharacteristicsSearchHelpDialog.getBinding("items").filter(null);

                            // Set to busy till data arrives
                            var oController = this;
                            this._oMaintainBatchCharacteristicsSearchHelpDialog._dialog.setBusy(true);

                            // Get the possible values for the current row's Batch Char. name
                            var sBatchCharacteristicName = oEvent.getSource().getBindingContext("maintainBC").getProperty("CharacteristicName");
                            this.getView().getModel().read(
                                    "/GenericSearchSet",
                                    {
                                        urlParameters : {
                                            "$filter" : "Scenario eq '" + sBatchCharacteristicName + "'"
                                        },
                                        success : function(oData) {
                                            var aResults = oData.results;
                                            // Show "No Items are currently available text"
                                            if (!aResults.length) {
                                                oController._oMaintainBatchCharacteristicsSearchHelpDialog._table
                                                        .setNoDataText(com.zespri.awct.util.I18NHelper.getText("TXT_LIST_NO_ITEMS_LABEL"));
                                            }

                                            // We have the results. Now to find out which ones should be pre-selected.
                                            var aBatchCharacteristics = oMaintainBCModel.getProperty("/BatchCharacteristics");
                                            jQuery.each(aBatchCharacteristics, function(i, oBC) {
                                                var aSelectedBCValues = oBC.BatchCharacteristicsValueSet.results;

                                                // Find the selected BC Values for the BC name that we are interested in
                                                if (oBC.CharacteristicName === sBatchCharacteristicName) {
                                                    jQuery.each(aSelectedBCValues, function(j, oBCValue) {
                                                        // Whichever of these are available in the result returned from /GenericSearchSet, mark as
                                                        // pre-selected
                                                        $.each(aResults, function(k, oResult) {
                                                            if (oBCValue.Value === oResult.Key) {
                                                                oResult.selected = true;
                                                                return false;
                                                            }
                                                        });
                                                    });
                                                }
                                            });

                                            // Update the 'maintainBC' model and done.
                                            oMaintainBCModel.setProperty("/SearchHelpValues", aResults);
                                            oMaintainBCModel.setProperty("/SearchHelpBCName", sBatchCharacteristicName);
                                            oController._oMaintainBatchCharacteristicsSearchHelpDialog._dialog.setBusy(false);
                                        }
                                    });
                        },

                        /**
                         * Event handler for the 'confirm' event of the TableSelectDialog used for BC value search help.
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleMaintainBatchCharacteristicsValueHelpConfirm : function(oEvent) {
                            // Get the array to which the 'Maintain BC' table is bound
                            var oMaintainBCModel = this._oMaintainBatchCharacteristicsDialog.getModel("maintainBC");
                            var aBatchCharacteristics = oMaintainBCModel.getProperty("/BatchCharacteristics");

                            // Get the index of the current BC (the one for which search help was opened), so that we can selectively update only the
                            // relevant part in
                            // the maintainBC model.
                            var sBatchCharacteristicName = oMaintainBCModel.getProperty("/SearchHelpBCName");
                            var iCurrentBCIndex;
                            $.each(aBatchCharacteristics, function(i, oBC) {
                                if (oBC.CharacteristicName === sBatchCharacteristicName) {
                                    iCurrentBCIndex = i;
                                    return false;
                                }
                            });

                            // Now form the array that will represent the current state of selected values for this BC. We will set this to the model
                            // in the next
                            // step.
                            var aSelectedContexts = oEvent.getParameter("selectedContexts");
                            var aNewValuesSelection = [];
                            $.each(aSelectedContexts, function(j, oSelectedContext) {
                                aNewValuesSelection.push({
                                    Key : oSelectedContext.getProperty("Key"), // TODO : is Key attribute needed?
                                    Value : oSelectedContext.getProperty("Key")
                                });
                            });

                            // Now that we have updated the 'selected values', we set it back to the model so that the 'maintain BC table' gets
                            // updated.
                            oMaintainBCModel.setProperty("/BatchCharacteristics/" + iCurrentBCIndex + "/BatchCharacteristicsValueSet", {
                                results : aNewValuesSelection
                            });

                            // If there at least 1 value was selected, then remove the error state (error=true when user clicks on 'Save' without
                            // selecting any values
                            // for a BC)
                            if (aNewValuesSelection.length > 0) {
                                oMaintainBCModel.setProperty("/BatchCharacteristics/" + iCurrentBCIndex + "/error", false);
                            }
                        },

                        /**
                         * Event handler for the 'valueHelpRequest' event of the 'Propagate to lines' input.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleMaintainBatchCharacteristicsPropagateLinesValueHelpOpen : function() {
                            // Get the models/data we need
                            var oMaintainBCModel = this._oMaintainBatchCharacteristicsDialog.getModel("maintainBC");
                            var oODataModel = this.getView().getModel();
                            var sCurrentDeliveryLineNumber = oMaintainBCModel.getProperty("/CurrentDeliveryLineNumber");
                            var sCurrentDeliveryHeaderID = oMaintainBCModel.getProperty("/CurrentDeliveryHeaderID");
                            var oController = this;

                            // Lazy-instantiate dialog if needed
                            if (!this._oMaintainBatchCharacteristicsPropagateToLinesDialog) {
                                // Instantiate and set models
                                this._oMaintainBatchCharacteristicsPropagateToLinesDialog = sap.ui.xmlfragment("maintainBCPropagateDialog",
                                        "com.zespri.awct.alloc.fragment.EditAllocationsMaintainBatchCharacteristicsPropagate", this);
                                this._oMaintainBatchCharacteristicsPropagateToLinesDialog._oTable.setGrowing(false);

                                // Using private variable (refer to comment for batch characteristics values F4 open handler)
                                this._oMaintainBatchCharacteristicsPropagateToLinesDialog._dialog.setBusyIndicatorDelay(0);
                            }

                            // When ManageNoDataText method will be used , Loading text will not be removed if there are 0 records. So this table is
                            // handled manually.
                            // Show "Loading..."
                            this._oMaintainBatchCharacteristicsPropagateToLinesDialog._table.setNoDataText(com.zespri.awct.util.I18NHelper
                                    .getText("TXT_LIST_LOADING_LABEL"));

                            // Set i18n and data models (addDependent() doesn't work. TODO : why?)
                            var oI18NModel = this._oMaintainBatchCharacteristicsDialog.getModel("i18n");
                            this._oMaintainBatchCharacteristicsPropagateToLinesDialog.setModel(oI18NModel, "i18n");
                            this._oMaintainBatchCharacteristicsPropagateToLinesDialog.setModel(oMaintainBCModel, "maintainBC");

                            // Open the dialog
                            this._oMaintainBatchCharacteristicsPropagateToLinesDialog.open();

                            // Remove all filters before opening
                            this._oMaintainBatchCharacteristicsPropagateToLinesDialog.getBinding("items").filter(null);

                            // If the model doesn't have data for this dialog, we need to fetch this.
                            var aPropagateLines = oMaintainBCModel.getProperty("/PropagateToLines");
                            if (!aPropagateLines) {
                                this._oMaintainBatchCharacteristicsPropagateToLinesDialog._dialog.setBusy(true);

                                // Get the rows to show in the 'Propagate to lines' dialog..
                                oODataModel.read("/GetDistinctDeliveryLineDetails", {
                                    urlParameters : {
                                        DeliveryNumber : "'" + sCurrentDeliveryHeaderID + "'",
                                        ExcludeDeliveryLineNumber : "'" + sCurrentDeliveryLineNumber + "'"
                                    },
                                    success : function(oData) {
                                        var aResults = oData.results;
                                        // Show "No Items are currently available text"
                                        if (!aResults.length) {
                                            oController._oMaintainBatchCharacteristicsPropagateToLinesDialog._table
                                                    .setNoDataText(com.zespri.awct.util.I18NHelper.getText("TXT_LIST_NO_ITEMS_LABEL"));
                                        }

                                        // This call is made only once (first time) and there are no selections at this stage, so no
                                        // need to do any pre-selections.
                                        oMaintainBCModel.setProperty("/PropagateToLines", aResults);
                                        oController._oMaintainBatchCharacteristicsPropagateToLinesDialog._dialog.setBusy(false);

                                    },
                                    error : function(oError) {
                                        // Show the error dialog
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        oController._oMaintainBatchCharacteristicsPropagateToLinesDialog._dialog.setBusy(false);

                                        // Remove the 'loadingData' custom data
                                        oController._oMaintainBatchCharacteristicsPropagateToLinesDialog._table.removeAllCustomData();
                                    }
                                });
                            } else {
                                // If there are no Delivery lines
                                if (!aPropagateLines.length) {
                                    this._oMaintainBatchCharacteristicsPropagateToLinesDialog._table.setNoDataText(com.zespri.awct.util.I18NHelper
                                            .getText("TXT_LIST_NO_ITEMS_LABEL"));
                                }
                            }
                        },

                        /**
                         * Event handler for the 'confirm' event of the 'Propagate to lines' TableSelectDialog.
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleMaintainBatchCharacteristicsPropagateLinesValueHelpConfirm : function(oEvent) {
                            var oMaintainBCModel = this._oMaintainBatchCharacteristicsDialog.getModel("maintainBC");
                            var aSelectedContexts = oEvent.getParameter("selectedContexts");
                            var aPropagateToLines = oMaintainBCModel.getProperty("/PropagateToLines");

                            // Look for matching contexts in the "/PropagateToLines" path and set "selected=true" and others to "selected=false".
                            $.each(aPropagateToLines, function(i, oLine) {
                                var bFound = false;
                                $.each(aSelectedContexts, function(j, oContext) {
                                    if (oContext.getProperty("DeliveryAllocationID") === oLine.DeliveryAllocationID) {
                                        bFound = true;
                                        oLine.selected = true;
                                    }
                                });

                                if (!bFound) {
                                    oLine.selected = false;
                                }
                            });

                            // Update the model (TODO : Framework doesn't recognize it as a change, so we set it to 'null' first. Better way?)
                            oMaintainBCModel.setProperty("/PropagateToLines", null);
                            oMaintainBCModel.setProperty("/PropagateToLines", aPropagateToLines);
                        },

                        /**
                         * Event handler for the 'liveChange' event of the "Propagate to lines" search help dialog.
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleMaintainBatchCharacteristicsPropagateLinesValueHelpLiveChange : function(oEvent) {
                            // Use the user's input as a filter on all displayed columns
                            var sSearchTerm = oEvent.getParameter("value");
                            var oDeliveryLineNumberFilter = new sap.ui.model.Filter("DeliveryLineNumber", sap.ui.model.FilterOperator.StartsWith,
                                    sSearchTerm);
                            var oMaterialNumberFilter = new sap.ui.model.Filter("MaterialNumber", sap.ui.model.FilterOperator.StartsWith, sSearchTerm);
                            var oBrandFilter = new sap.ui.model.Filter("Brand", sap.ui.model.FilterOperator.StartsWith, sSearchTerm);
                            var oFruitGroupFilter = new sap.ui.model.Filter("FruitGroup", sap.ui.model.FilterOperator.StartsWith, sSearchTerm);
                            var oSizeFilter = new sap.ui.model.Filter("Size", sap.ui.model.FilterOperator.StartsWith, sSearchTerm);
                            var oPackFilter = new sap.ui.model.Filter("Pack", sap.ui.model.FilterOperator.StartsWith, sSearchTerm);
                            var oLabelFilter = new sap.ui.model.Filter("Label", sap.ui.model.FilterOperator.StartsWith, sSearchTerm);

                            // Create the final filter object as an OR of the above filters
                            var oFilter = new sap.ui.model.Filter([oDeliveryLineNumberFilter, oMaterialNumberFilter, oBrandFilter, oFruitGroupFilter,
                                    oSizeFilter, oPackFilter, oLabelFilter], false);

                            // Apply the filter to the search help's binding
                            this._oMaintainBatchCharacteristicsPropagateToLinesDialog.getBinding("items").filter(oFilter);
                        },

                        /**
                         * Formatter for the 'Batch characteristics value' input field in the 'Maintain Batch Characteristics' dialog.
                         * 
                         * @param {Object}
                         *            oBatchCharacteristicsValueSet Object containing an array of batch characteristics values
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        formatBatchCharacteristicsValues : function(oBatchCharacteristicsValueSet) {
                            var fnGetBatchCharacteristicsValue = function(oBatchCharValue) {
                                return oBatchCharValue.Key;
                            };
                            return oBatchCharacteristicsValueSet.results.map(fnGetBatchCharacteristicsValue).join(", ");
                        },

                        /**
                         * Formatter for the 'valueState' property for Batch Characteristis Values input field.
                         * 
                         * @param {Boolean}
                         *            bError True if an error needs to be shown, False if no error needs to be shown. This flag is set to true when
                         *            the user clicks on 'Save' without selecting values for any Batch Characteristic.
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        formatBatchCharacteristicsValuesValueState : function(bError) {
                            if (bError) {
                                return sap.ui.core.ValueState.Error;
                            } else {
                                return sap.ui.core.ValueState.None;
                            }
                        },

                        /**
                         * Formatter for the 'Propagate to lines' input field in the 'Maintain Batch Characteristics' dialog. It returns a comma
                         * separated list of the selected delivery line numbers.
                         * 
                         * @param {Array}
                         *            oPropagateToLines Array with all lines shown in the 'Propagate To Lines' value help.
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        formatBatchCharacteristicsPropagateToLinesText : function(aPropagateToLines) {
                            // aPropagateToLines will be undefined when the 'Maintain BC' dialog is opened.
                            if (!aPropagateToLines) {
                                return "";
                            }

                            // Get the selected delivery line numbers
                            var aSelectedDeliveryLineNumbers = [];
                            $.each(aPropagateToLines, function(i, oLine) {
                                if (oLine.selected) {
                                    aSelectedDeliveryLineNumbers.push(oLine.DeliveryLineNumber);
                                }
                            });

                            // Return a comma separated string
                            return aSelectedDeliveryLineNumbers.join(", ");
                        },
                        /* ----------- end of MAINTAIN BATCH CHARACTERISTICS ------------------ */

                        /* -------------------- start of MACROS -------------------------------- */
                        /**
                         * Triggers the simulation for the specified macro. The backend returns the simulated allocation quantities, which are shown
                         * to the user on the UI. The user can then make further modifications if necessary, and then click on Save/Discard.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @param {String}
                         *            sMacroName The name of the macro to be triggered.
                         * @private
                         */
                        _triggerMacroSimulation : function(sMacroName) {
                            // If view is dirty, tell the user he must first save his changes.
                            if (this._stopActionIfViewDirty()) {
                                return;
                            }

                            // Before triggering the simulation, we first need to refresh the table (without pagination). Once the refresh is
                            // completed, the function
                            // import for macro simulation will be triggered...
                            var oController = this;
                            var sFunctionImportName;
                            var fnHandleTableUpdateFinishedBeforeMacroSimulation = function() {
                                // Which function import needs to be invoked? (Currently only 2 are implemented)
                                if (sMacroName === oController._AllocationMacro.ProRata) {
                                    sFunctionImportName = "SetProRataMacro";
                                } else if (sMacroName === oController._AllocationMacro.Zero) {
                                    sFunctionImportName = "SetZeroMacro";
                                } else {
                                    jQuery.sap.log.error("Unsupported macro '" + sMacroName + "'");
                                    return;
                                }

                                // Call the function import
                                oController.getView().getModel().read("/" + sFunctionImportName, {
                                    urlParameters : {
                                        "DeliveryNumber" : "'" + oController._oDeliveryHeaderContext.getProperty("DeliveryHeaderID") + "'"
                                    },
                                    success : function(oData) {
                                        var aResults = oData.results;
                                        oController._applyMacroSimulationResults(sMacroName, aResults);
                                    },
                                    error : function(oError) {
                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                    }
                                });
                            };

                            // Set the bSimulatingMacro flag to 'true', and initialize the _mMacroSimulationTargets map. This indicates that the
                            // table's factory
                            // function must create a map of DeliveryAllocationID <->
                            // UI5 Input field, which will be used in _applyMacroSimulationResults() to display the simulated values.
                            this._bSimulatingMacro = true;
                            this._mMacroSimulationTargets = {};

                            // Listen (once) for the 'updateFinished' event of the table.
                            var oTable = this.getView().byId("allocationTable");
                            oTable.attachEventOnce("updateFinished", fnHandleTableUpdateFinishedBeforeMacroSimulation);

                            // Refresh.
                            this._oBusyDialog.open();
                            oTable.setGrowing(false);
                            this._refreshTable();
                        },

                        /**
                         * Applies the results of the 'simulate macro' function import to the UI. This is invoked from the success handler for the
                         * READ on the function import.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @private
                         */
                        _applyMacroSimulationResults : function(sMacroName, aSimulationResults) {
                            // 1. The _mMacroSimulationTargets map contains a deliveryAllocationID <-> UI5 control map for all UI5 controls that need
                            // to be updated
                            // with
                            // the results of the simulation function import (oData)
                            // 2. The function import returns a deliveryAllocationID <-> simulated quantity.
                            // --
                            // Use (1) and (2) to update relevant UI5 controls.
                            var oController = this;
                            $.each(aSimulationResults, function(iIndex, oSimulationResult) {
                                // Find the UI5 input field corresponding to each delivery allocation ID
                                var sDeliveryAllocationID = oSimulationResult.DeliveryAllocationID;
                                var fQuantity = oSimulationResult.Quantity;
                                var oInput = oController._mMacroSimulationTargets[sDeliveryAllocationID];

                                if (oInput) {
                                    // Set the simulated quantity as its text
                                    oInput.setValue(fQuantity);

                                    // Trigger a 'change' event, so that it is considered as a 'changed' value, and is added to the 'Values to be
                                    // saved' buffer
                                    // (_mAllocationQuantityChanges)
                                    oInput.fireChange();
                                }
                            });

                            // Clear the _mMacroSimulationTargets map and _bSimulatingMacro flag (we needed it only for displaying the simulation
                            // results, which has
                            // been done above)
                            this._mMacroSimulationTargets = {};
                            this._bSimulatingMacro = false;

                            // Before macro-simulation, the table was set to growing=false (to disable paging). Undo this.
                            var oTable = this.getView().byId("allocationTable");
                            oTable.setGrowing(true);

                            // Simulation is complete. Remove busy state
                            this._oBusyDialog.close();

                            // Show 'Simulation done' toast.
                            var sMessage;
                            if (sMacroName === oController._AllocationMacro.ProRata) {
                                sMessage = com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_EDITALLOCATIONS_PRO_RATA_MACRO_APPLIED_TOAST");
                            } else {
                                sMessage = com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_EDITALLOCATIONS_ZERO_MACRO_APPLIED_TOAST");
                            }
                            com.zespri.awct.util.NotificationHelper.showSuccessToast(sMessage);
                        },

                        /**
                         * Event handler for 'press' event of the 'Pro-Rata macro' button.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleProRataMacroButtonPress : function() {
                            this._triggerMacroSimulation(this._AllocationMacro.ProRata);
                        },

                        /**
                         * Event handler for 'press' event of the 'Zero macro' button.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleZeroMacroButtonPress : function() {
                            this._triggerMacroSimulation(this._AllocationMacro.Zero);
                        },

                        /**
                         * Event handler for 'press' event of the 'Apply Macro...' button. This brings up an action sheet of available macros.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleMacrosButtonPress : function() {
                            if (!this._oMacrosActionSheet) {
                                this._oMacrosActionSheet = new sap.ui.xmlfragment("com.zespri.awct.alloc.fragment.EditAllocationsMacrosActionSheet",
                                        this);
                                this.getView().addDependent(this._oMacrosActionSheet);
                            }

                            if (this._oMacrosActionSheet.isOpen()) {
                                this._oMacrosActionSheet.close();
                            } else {

                                // Open the action sheet
                                var oOpener = this.byId("macrosButton");
                                this._oMacrosActionSheet.openBy(oOpener);
                            }
                        },
                        /* --------------------- end of MACROS -------------------------------- */

                        /**
                         * This method is called when the Market Info button is clicked on the footer toolbar of edit allocations view. It opens the
                         * Market Info dialog box.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleMarketInfoOpen : function() {
                            // Creating the instance only once and referring
                            // to the same instance every other time
                            if (!this._oMarketInfoDialog) {
                                this._oMarketInfoDialog = new sap.ui.xmlfragment("marketInfoFragment",
                                        "com.zespri.awct.alloc.fragment.EditAllocationsMarketInfoDialog", this);
                                this.getView().addDependent(this._oMarketInfoDialog);
                            }

                            this._oMarketInfoDialog.setBindingContext(this._oDeliveryHeaderContext);
                            this._oMarketInfoDialog.open();
                        },

                        /**
                         * This method is called to close the dialog when the Close button on the Market Info dialog is pressed.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleMarketInfoClose : function() {
                            this._oMarketInfoDialog.close();
                        },

                        /**
                         * If 'MarketInfoText' is available for the current delivery, it returns the text. If not available, it returns a message
                         * which says that MarketInfoText is not available.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        formatMarketInfoText : function(sMarketInfoText) {
                            if (sMarketInfoText) {
                                sap.ui.core.Fragment.byId("marketInfoFragment", "marketInfoText").removeStyleClass("zAwctTextGrayItalics");
                                return sMarketInfoText;
                            } else {
                                sap.ui.core.Fragment.byId("marketInfoFragment", "marketInfoText").addStyleClass("zAwctTextGrayItalics");
                                return com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_EDITALLOCATIONS_NO_MARKET_INFO_TEXT");
                            }
                        },

                        /**
                         * Redefining parent class method. Is invoked whenever 'dirty state' of the view changes.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @param {Boolean}
                         *            bDirty true if the view has unsaved changes, false otherwise
                         */
                        handleViewDirtyStateChanged : function(bDirty) {
                            if (bDirty) {
                                this.byId("saveButton").setEnabled(true);
                                this.byId("discardChangesButton").setEnabled(true);
                            } else {
                                this.byId("saveButton").setEnabled(false);
                                this.byId("discardChangesButton").setEnabled(false);
                            }
                        },

                        /**
                         * Event handler for 'title press' event of delivery ObjectHeader
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleObjectHeaderTitlePress : function() {
                            // Toggle between condensed=true and condensed=false here.
                            var oObjectHeader = this.byId("deliveryObjectHeader");
                            var bCondensed = oObjectHeader.getCondensed();
                            oObjectHeader.setCondensed(!bCondensed);
                        },

                        /**
                         * Event handler for the 'reset' event of the facet filter
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleFacetFilterReset : function() {
                            // If view is dirty, tell the user he must first save his changes.
                            if (this._stopActionIfViewDirty()) {
                                return;
                            }

                            // Reset all lists within the facet filter
                            var oFacetFilter = this.byId("facetFilterAllocation");
                            var aFacetFilterLists = oFacetFilter.getLists();

                            jQuery.each(aFacetFilterLists, function(i, oList) {
                                oList.setSelectedKeys();
                            });

                            // Refresh the table
                            this._refreshTable();
                        },

                        /**
                         * Refreshes the delivery header context (by reading it from DB again) and updates the view accordingly if needed. This needs
                         * to be invoked after any backend operation that can change delivery header properties (such as 'Status'). Once the context
                         * is refreshed, this function invokes other functions that might update the UI (such as footer buttons visibility) based on
                         * the newly fetched delivery header info.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @private
                         */
                        _refreshDeliveryHeaderContext : function() {
                            // Set the view to 'busy'
                            this._setViewBusy(true);
                            var oController = this;

                            // Read the 'status' again and update the instance variable '_oDeliveryHeaderContext'. Currently reading only 'Status',
                            // because we don't expect anything else to change.
                            var sDeliveryHeaderURI = "/DeliveryHeaderSet('" + this._oDeliveryHeaderContext.getProperty("DeliveryHeaderID") + "')";
                            this.getView().getModel().read(sDeliveryHeaderURI, {
                                urlParameters : {
                                    "$select" : "Status"
                                },
                                success : function(oData) {
                                    // Update the 'Status' of the delivery header context and update the footer accordingly.
                                    oController._oDeliveryHeaderContext.getObject().Status = oData.Status;
                                    oController._updateFooter();
                                    oController._setViewBusy(false);

                                    // Update enabled/disabled for quantity input fields based on status
                                    oController._updateQuantityInputsEnabledState();
                                }
                            });
                        },

                        /**
                         * Allow/disallow the user to input quantities in the table, based on the delivery status. The 'enabled' property of all
                         * allocation quantity input fields is bound to the 'allowAllocationChange' property in the 'viewState' model. Updating this
                         * property is enough to control the enabled/disabled state of all input fields.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @private
                         */
                        _updateQuantityInputsEnabledState : function() {
                            if (this._oDeliveryHeaderContext.getProperty("Status") === com.zespri.awct.util.Enums.DeliveryStatus.Released) {
                                this._oViewStateModel.setProperty("/allowAllocationChange", false);
                            } else {
                                this._oViewStateModel.setProperty("/allowAllocationChange", true);
                            }
                        },

                        /**
                         * Updates footer bar buttons (visibiliy etc.) based on the context of the view (e.g based on the currently selected
                         * delivery's attributes)
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @private
                         */
                        _updateFooter : function() {
                            // Get the delivery header status
                            var sStatus = this._oDeliveryHeaderContext.getProperty("Status");

                            // Get references to buttons that depend on delivery status
                            var oReleaseButton = this.byId("releaseButton");
                            var oLockButton = this.byId("lockButton");
                            var oUnlockButton = this.byId("unlockButton");
                            var oSaveButton = this.byId("saveButton");
                            var oDiscardChangesButton = this.byId("discardChangesButton");
                            var oMacrosButton = this.byId("macrosButton");
                            var oAddSuppliersToContainerButton = this.byId("addSuppliersToContainerButton");

                            // Hide all status-dependent buttons to begin with...
                            oReleaseButton.setVisible(false);
                            oLockButton.setVisible(false);
                            oUnlockButton.setVisible(false);
                            oSaveButton.setVisible(false);
                            oDiscardChangesButton.setVisible(false);
                            oMacrosButton.setVisible(false);
                            oAddSuppliersToContainerButton.setVisible(false);

                            // Check Authorizations . If user is in Display mode ,set all buttons visible to false (except "Market Info" button)
                            if (com.zespri.awct.util.CommonHelper
                                    .isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                            com.zespri.awct.util.Enums.AuthorizationObject.Allocation,
                                            com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)) {
                                // ...then show the required buttons
                                switch (sStatus) {
                                    // Not Started
                                    case com.zespri.awct.util.Enums.DeliveryStatus.NotStarted :
                                        oReleaseButton.setVisible(true);
                                        oSaveButton.setVisible(true);
                                        oDiscardChangesButton.setVisible(true);
                                        oAddSuppliersToContainerButton.setVisible(true);
                                        break;

                                    // In Progress
                                    case com.zespri.awct.util.Enums.DeliveryStatus.InProgress :
                                        oReleaseButton.setVisible(true);
                                        oSaveButton.setVisible(true);
                                        oDiscardChangesButton.setVisible(true);
                                        oMacrosButton.setVisible(true);
                                        oAddSuppliersToContainerButton.setVisible(true);
                                        break;

                                    // Released
                                    case com.zespri.awct.util.Enums.DeliveryStatus.Released :
                                        oLockButton.setVisible(true);
                                        break;

                                    // Locked
                                    case com.zespri.awct.util.Enums.DeliveryStatus.Locked :
                                        oUnlockButton.setVisible(true);
                                        oSaveButton.setVisible(true);
                                        oDiscardChangesButton.setVisible(true);
                                        oMacrosButton.setVisible(true);
                                        oAddSuppliersToContainerButton.setVisible(true);
                                        break;
                                }

                                // Only for container type shipments, the add suppliers to container button should be visible
                                if (this._oDeliveryHeaderContext.getProperty("ContainerOrCharter") !== this._ShipmentType.Container) {
                                    oAddSuppliersToContainerButton.setVisible(false);
                                }
                            }
                        },

                        /**
                         * This method updates the binding of the "items" aggregation of the Allocation table, and ensures that the correct filters
                         * are also used. The filters that are created, depend on the facet filters that the user has selected and on the delivery
                         * header details of the current delivery.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @private
                         */
                        _refreshTable : function() {
                            // Basic assertions
                            jQuery.sap.assert(!this.getHasUnsavedChanges(), "_refreshTable was called even though view is dirty!");
                            jQuery.sap
                                    .assert(this._oDeliveryHeaderContext, "_refreshTable was called, but delivery header context is not available!");
                            jQuery.sap.assert(this._oDeliveryHeaderContext.getProperty("DeliveryHeaderID"),
                                    "_refreshTable was called, but key DeliveryHeaderID is not available in delivery header context!");

                            // Create the filter for delivery header ID. We only want allocation lines for the current delivery.
                            var sDeliveryHeaderID = this._oDeliveryHeaderContext.getProperty("DeliveryHeaderID");
                            var oDeliveryHeaderIDFilter = new sap.ui.model.Filter("DeliveryHeaderID", "EQ", sDeliveryHeaderID);

                            // Create filters based on facet filter selections
                            // aInnerFilters -> Represents the filters created for each selection WITHIN a facet list. Multiple selections within the
                            // same list need
                            // to be 'OR'ed together.
                            // aOuterFilters -> Represents the filters created for each list. These need to be 'AND'ed together.
                            var aFacetFilterLists = this.byId("facetFilterAllocation").getLists();
                            var aOuterFilters = [];
                            var aBindingFilters = [];
                            $.each(aFacetFilterLists, function(i, oList) {
                                if (oList.getSelectedItems().length > 0) {
                                    var aInnerFilters = [];
                                    $.each(oList.getSelectedItems(), function(j, oSelectedItem) {
                                        aInnerFilters.push(new sap.ui.model.Filter(oList.getKey(), "EQ", oSelectedItem.getKey()));
                                    });
                                    aOuterFilters.push(new sap.ui.model.Filter(aInnerFilters, false)); // 'OR' the selected items.
                                }
                            });

                            // Form the final filter array which will be used for the binding.
                            aBindingFilters.push(oDeliveryHeaderIDFilter);
                            if (aOuterFilters.length > 0) {
                                aBindingFilters.push(new sap.ui.model.Filter(aOuterFilters, true));
                            }

                            // Table configuration is different based on whether shipment type is 'Charter' or 'Container'
                            var aSorters = [];
                            if (this._oDeliveryHeaderContext.getProperty("ContainerOrCharter") === this._ShipmentType.Charter) {
                                // Charter type has mergeDuplicates=true for 'DeliveryLineID' column. So we need 1 sorter.
                                aSorters.push(new sap.ui.model.Sorter("DeliveryLineID", false));
                            } else {
                                // Container type has mergeDuplicates=true for 2 columns : ContainerID and DeliveryLineID. So we need 2 sorters.
                                aSorters.push(new sap.ui.model.Sorter("ContainerID", false));
                                aSorters.push(new sap.ui.model.Sorter("DeliveryLineID", false));
                            }

                            // Update the binding of the 'items' aggregation of the table
                            var oTable = this.byId("allocationTable");
                            var oBindingInfo = {
                                path : '/AllocationLineSet',
                                sorter : aSorters,
                                factory : jQuery.proxy(this.createTableColumnListItem, this),
                                filters : aBindingFilters
                            };

                            oTable.bindItems(oBindingInfo);
                        },

                        /**
                         * Event handler for the 'OnBeforeNavigationWithUnsavedChanges' event that the custom router fires if the user tries to
                         * navigate away from the view while there are unsaved changes.
                         * 
                         * @param {sap.ui.base.Event}
                         *            oEvent The event object. The event object contains a parameter which contains a callback that should be invoked
                         *            if the navigation should be allowed. If this callback is never invoked, the navigation stays cancelled.
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
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
                         * Event handler is for 'change' in 'Quantity' input in AddSupplier fragment. It Checks whether the value entered is in proper
                         * format or not, numbers which are > 0 are only considered
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @param (sap.ui.base.Event)
                         *            oEvent The event triggered for change in 'Quantity' field for 'AddSupplier' fragment
                         */

                        handleAddSupplierInputValueChange : function(oEvent) {

                            // Finding whether the Quantity Value is a positive number or not.

                            if (!(isNaN(oEvent.getSource().getValue()))) {
                                if (parseFloat(oEvent.getSource().getValue()) < 0) {
                                    oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
                                } else {
                                    oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
                                }
                            } else if (oEvent.getSource().getValue() === "") {
                                oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
                            } else {
                                oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
                            }
                        },

                        /**
                         * Event handler is for 'press' event in 'Cancel' Button.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */

                        handleAddSupplierClose : function() {
                            this._oDialogAddSupplier.close();
                        },

                        /**
                         * Event handler is for 'liveChange' event in SearchField of the fragment 'AddSupplier'. It is using model filter for
                         * filtering out the search
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @param (sap.ui.base.Event)
                         *            oEvent The event triggered for search in 'AddSupplier' fragment
                         */

                        handleAddSupplierSearch : function(oEvent) {
                            // Getting the search value and filtering it with SupplierID
                            var sSupplierValue = oEvent.getParameter("newValue");
                            var oSupplierFilter = new sap.ui.model.Filter("Supplier", sap.ui.model.FilterOperator.Contains, sSupplierValue);
                            var oSupplierBinding = sap.ui.core.Fragment.byId("addSupplierDialog", "addSupplierTable").getBinding("items");
                            oSupplierBinding.filter([oSupplierFilter]);
                        },

                        /**
                         * Event handler is for 'press' event in 'OK' Button of the fragment 'AddSupplier'. It will get the items which contain the
                         * 'Quantity' values with are > 0 from the fragment 'AddSupplier' and updated the model with the new supplier data that are
                         * received from the fragment.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */

                        handleAddSuppliersConfirm : function() {
                            var oController = this;
                            var aBatchChanges = [];

                            // Moving the selected line item to 'AllocationLineSet' through batch create
                            var aAddSupplierItems = sap.ui.core.Fragment.byId("addSupplierDialog", "addSupplierTable").getItems();

                            // Checking for any error
                            var bHasInvalidInput = false;
                            if (aAddSupplierItems.length) {
                                aAddSupplierItems.map(function(oListItem) {
                                    // Getting the second column (Quantity column) from the AddSupplier table and then getting the first content of
                                    // the column which
                                    // is the input field to enter the quantity.
                                    if (oListItem.getCells()[1].getContent()[0].getValueState() === sap.ui.core.ValueState.Error) {
                                        bHasInvalidInput = true;
                                    }
                                });
                            }

                            // Enter the creation process only if there is no error in 'Quantity' value
                            if (!bHasInvalidInput) {
                                // Add header for locked delivery
                                if (this._oDeliveryHeaderContext.getProperty("Status") === com.zespri.awct.util.Enums.DeliveryStatus.Locked) {
                                    // Set Request exemption header
                                    this.getView().getModel().setHeaders(
                                            {
                                                "REL2-RELEVANT" : sap.ui.core.Fragment.byId("addSupplierDialog", "supplierRel2RelevantCheckbox")
                                                        .getSelected()
                                            });
                                }
                                aAddSupplierItems.map(function(oListItem) {
                                    // getCells()[1].getContent()[0].getValue() - will give the input field value. This will get the second cell in
                                    // the table then the
                                    // first content of it and will get the value of the input field.
                                    // getBindingContext() was not behaving to the expectation ( UI rendering issues) so used
                                    // getCells()[1].getContent()[0].getValue().
                                    var fQuantity = parseFloat(oListItem.getCells()[1].getContent()[0].getValue());
                                    if (!isNaN(fQuantity) && fQuantity > 0) {
                                        var oAllocationLine = {};
                                        oController._oDialogAddSupplier.setBusy(true);
                                        oAllocationLine.DeliveryLineNumber = oListItem.getBindingContext("addSuppliersModel").getProperty(
                                                "/DeliveryLineNumber");
                                        oAllocationLine.DeliveryHeaderID = oListItem.getBindingContext("addSuppliersModel").getProperty(
                                                "/DeliveryHeaderID");
                                        oAllocationLine.DeliveryLineID = oListItem.getBindingContext("addSuppliersModel").getProperty(
                                                "/DeliveryLineID");
                                        oAllocationLine.SupplierID = oListItem.getBindingContext("addSuppliersModel").getProperty("Supplier");
                                        oAllocationLine.AllocationQuantity = fQuantity + "";
                                        oAllocationLine.DeliveryLineUpdateTime = com.zespri.awct.util.CommonFormatHelper
                                                .formatJSDateToEDMDateTimeString(oListItem.getBindingContext("addSuppliersModel").getProperty(
                                                        "/DeliveryLineUpdateTime"), true);
                                        aBatchChanges.push(oController.getView().getModel().createBatchOperation("AllocationLineSet", "POST",
                                                oAllocationLine));
                                    }
                                });

                                oController.getView().getModel().addBatchChangeOperations(aBatchChanges);

                                // Submitting the batch create request.
                                if (aBatchChanges.length) {
                                    oController._oDialogAddSupplier.setBusy(true);
                                    oController.getView().getModel().submitBatch(
                                            function(oData, oResponse, aErrorResponses) {
                                                oController.getView().getModel().setHeaders(null);
                                                // Display errors if any
                                                var bErrorMessageShown = com.zespri.awct.util.NotificationHelper.handleErrorMessage(aErrorResponses);
                                                // On success, re-read the delivery header status. This is needed because the Status might have
                                                // changed
                                                // (if this was the first allocation, the status will move from 'Not Started' to 'In Progress'),
                                                // and we need
                                                // to adjust the visible footer buttons based on this. (busy state should stay ON till this is
                                                // complete)
                                                oController._setViewBusy(true);
                                                oController._refreshDeliveryHeaderContext();

                                                oController._oDialogAddSupplier.setBusy(false);
                                                if (!bErrorMessageShown) {
                                                    oController._oDialogAddSupplier.close();
                                                    com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper
                                                            .getText("TXT_ALLOCATION_ADDSUPPLIER_CREATE_SUCCESS"));
                                                }
                                                // Refresh table
                                                oController._refreshTable();
                                            }, function(oError) {
                                                oController.getView().getModel().setHeaders(null);
                                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                                oController._oDialogAddSupplier.setBusy(false);
                                            });
                                } else {
                                    com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                            .getText("TXT_ALLOCATION_ADDSUPPLIER_NO_QUANTITY_ERROR_TOAST"));
                                }

                            } else {
                                // if any error in quantity input exist then toast
                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_ALLOCATION_ADDSUPPLIER_INVALID_ENTRY"));
                            }

                        },
                        /**
                         * Helper method used by actions in this view. If there are unsaved changes, most actions need to be prevented. If there are
                         * unsaved changes, it shows an error toast to the user asking him to either save or discard unsaved changes first.
                         * 
                         * @returns {Boolean} Returns true if view is dirty, false otherwise.
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @private
                         */
                        _stopActionIfViewDirty : function() {
                            if (this.getHasUnsavedChanges()) {
                                var sErrorText = com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_EDITALLOCATIONS_SAVE_CHANGES_FIRST_TOAST");
                                com.zespri.awct.util.NotificationHelper.showErrorToast(sErrorText);
                                return true;
                            } else {
                                return false;
                            }
                        },

                        /**
                         * Helper method to initialize the bindings of the facet filter lists. This can't be done (Except container type) from the XML
                         * view, because the binding is dependent on the current delivery header ID. This should only be invoked once delivery header
                         * context is available.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @private
                         */
                        _initFacetFilterLists : function() {
                            // Basic assertion
                            jQuery.sap.assert(this._oDeliveryHeaderContext,
                                    "_initFacetFilterLists() was called even though delivery header context is not yet available!");

                            var oFacetFilter = this.byId("facetFilterAllocation");

                            // 'Container' list (Query on /ContainerSet, with filter on DeliveryID and $select for ContainerID
                            // The reason for not creating a regular binding to the ODataModel, is because we want client-side filtering (as opposed
                            // to filering done
                            // by backend) for the facet lists. (not applicable for Charter shipments)
                            var oContainerList = this.byId("containerFacetList");

                            if (this._oDeliveryHeaderContext.getProperty("ContainerOrCharter") === this._ShipmentType.Charter) {
                                oFacetFilter.removeList(oContainerList);
                                oContainerList.destroyItems();
                            }

                            // 'Container Type' list (not applicable for Charter shipments)
                            // Though we only have static items for this list, client-side filtering will work only if we have a JSON model. Filtering
                            // is not very
                            // useful for a list with 2 items, but this way we stay consistent with the other filter lists.
                            var oContainerTypeList = this.byId("containerTypeFacetList");
                            if (this._oDeliveryHeaderContext.getProperty("ContainerOrCharter") === this._ShipmentType.Charter) {
                                oFacetFilter.removeList(oContainerTypeList);
                                oContainerTypeList.destroyItems();
                            } else {
                                var oContainerTypeListModel = new sap.ui.model.json.JSONModel({
                                    values : [{
                                        ContainerType : "20"
                                    }, {
                                        ContainerType : "40"
                                    }]
                                });
                                oContainerTypeList.setModel(oContainerTypeListModel);
                                oContainerTypeList.bindItems({
                                    path : "/values",
                                    template : oContainerTypeList.getBindingInfo("items") ? oContainerTypeList.getBindingInfo("items").template
                                            : oContainerTypeList.getItems()[0].clone()
                                });
                            }
                        },

                        /**
                         * This method is called when any facet filter list(with drop down values) is opened.
                         * 
                         * On call of this function, JSON Model for the selected facet filter is built and bound to the respective list. The reason
                         * for not creating a regular binding to the ODataModel, is because we want client-side filtering (as opposed to filtering
                         * done by backend) for the facet lists.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @param oEvent
                         */
                        handleFacetListOpen : function(oEvent) {
                            // find the key of selected facet filter list
                            var sSelectedFilterListKey = oEvent.getSource().getKey();
                            var oFilterDetails = {};

                            // We need DeliveryHeaderID and a reference to the facet filter to get started
                            var sDeliveryHeaderID = this._oDeliveryHeaderContext.getProperty("DeliveryHeaderID");

                            // check the filter which is triggered
                            switch (sSelectedFilterListKey) {

                                // For template, we use the template that is part of the current binding if an "items" binding exists (it will not
                                // exist
                                // when this
                                // code is executed for the first time, since have not done it via XML). If a binding doesn't already exist, we clone
                                // the
                                // template
                                // item that we have defined via XML.

                                case "ContainerID" :
                                    // Preparing Container Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("containerFacetList");
                                    oFilterDetails.entitySetName = "ContainerSet";
                                    oFilterDetails.filterString = "DeliveryID eq '" + sDeliveryHeaderID + "'";
                                    oFilterDetails.selectString = "ContainerID";
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "SupplierID" :
                                    // Preparing Supplier Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("supplierFacetList");
                                    oFilterDetails.entitySetName = "GetLinkedSuppliersForDelivery";
                                    oFilterDetails.urlParameter = {
                                        "DeliveryID" : "'" + sDeliveryHeaderID + "'"
                                    };
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;

                                case "MaterialNumber" :
                                    // Preparing material Number Facet Filter List
                                    oFilterDetails.facetListControl = this.byId("materialFacetList");
                                    oFilterDetails.entitySetName = "GetLinkedMaterialsForDelivery";
                                    oFilterDetails.urlParameter = {
                                        "DeliveryID" : "'" + sDeliveryHeaderID + "'"
                                    };
                                    com.zespri.awct.util.CommonHelper.createFacetFilterListItems(oFilterDetails, false);
                                    break;
                            }

                        },

                        /**
                         * Adjusts table configuration (like columns) based on shipment type of the current delivery. 'ContainerID' and
                         * 'ContainerType' columns are removed if the shipment type is Charter.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @private
                         */
                        _initTableConfiguration : function() {
                            var oTable = this.byId("allocationTable");
                            if (this._oDeliveryHeaderContext.getProperty("ContainerOrCharter") === this._ShipmentType.Charter) {
                                // Charter : 'Container ID' and 'Container Type' columns need to be removed.
                                oTable.removeColumn(this.byId("containerIDColumn"));
                                this.byId("containerIDColumn").destroy();

                                oTable.removeColumn(this.byId("containerTypeColumn"));
                                this.byId("containerTypeColumn").destroy();
                            }
                        },

                        /**
                         * This Method is called when release button is clicked and it opens a dialog with releas info
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleDeliveryReleaseDialogOpen : function() {
                            var oController = this;

                            // Prevent action if view has unsaved changes.
                            if (this._stopActionIfViewDirty()) {
                                return;
                            }

                            // Create the instance of the dialog , if its not created yet .
                            if (!this._oReleaseDeliveryDialog) {
                                this._oReleaseDeliveryDialog = new sap.ui.xmlfragment("releaseDeliveryDialog",
                                        "com.zespri.awct.alloc.fragment.EditAllocationsReleaseDialog", this);
                                this.getView().addDependent(this._oReleaseDeliveryDialog);

                                // Charge code table - Use the helper 'manageNoDataText' method. Also, rerender the dialog once the table's data
                                // (variable
                                // height) has been rendered. This will ensure that the dialog is positioned at the center of the screen, and also
                                // that
                                // the footer buttons of the dialog are visible
                                var oChargeCodeTable = sap.ui.core.Fragment.byId("releaseDeliveryDialog", "chargeCodeTable");
                                com.zespri.awct.util.CommonHelper.manageNoDataText(oChargeCodeTable);
                                oChargeCodeTable.attachUpdateFinished(function() {
                                    oController._oReleaseDeliveryDialog.rerender();
                                });
                            }

                            var sDeliveryHeaderID = this._oDeliveryHeaderContext.getProperty("DeliveryHeaderID");

                            // Clear existing values so that they are not visible when dialog is opened.
                            sap.ui.core.Fragment.byId("releaseDeliveryDialog", "commentTextArea").setValue("");
                            sap.ui.core.Fragment.byId("releaseDeliveryDialog", "releaseReasonSelect").getSelectedKey("");

                            // Set the view busy until data is loaded
                            this._setViewBusy(true);

                            // Call checkReleaseDelivery function import to get the details of charges
                            this.getView().getModel().read(
                                    "/GetAdditionalDeliveryInfo",
                                    {
                                        urlParameters : {
                                            "DeliveryID" : "'" + sDeliveryHeaderID + "'"
                                        },
                                        success : function(oData) {
                                            // By default , set noDataText
                                            var sDemandGTSupplyNoDataText = com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_ALLOCATION_EDITALLOCATIONS_RELEASE_DIALOG_DEMAND_GT_SUPPLY_NODATA_TEXT");
                                            var sBatchCharNoDataText = com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_ALLOCATION_EDITALLOCATIONS_RELEASE_DIALOG_BC_NOT_MAINTAINED_NODATA_TEXT");

                                            sap.ui.core.Fragment.byId("releaseDeliveryDialog", "demandGTSupplyText").setText(
                                                    sDemandGTSupplyNoDataText).addStyleClass("zAwctTextGrayItalics");
                                            sap.ui.core.Fragment.byId("releaseDeliveryDialog", "batchCharNTMaintText").setText(sBatchCharNoDataText)
                                                    .addStyleClass("zAwctTextGrayItalics");

                                            // Set shipment and Delivery Number
                                            sap.ui.core.Fragment.byId("releaseDeliveryDialog", "shipmentNumberText").setText(
                                                    oController._oDeliveryHeaderContext.getProperty("ShipmentID"));
                                            sap.ui.core.Fragment.byId("releaseDeliveryDialog", "deliveryNumberText").setText(
                                                    oController._oDeliveryHeaderContext.getProperty("DeliveryHeaderID"));

                                            var oDataCount = oData.results.length;
                                            // update the demand > supply and BC not Maintained texts with results returned from the function import
                                            // Results contain KEY -> Value pairs , set the value to fields in the dialog based on the KEY
                                            for ( var i = 0; i < oDataCount; i++) {
                                                if (oData.results[i].Key === oController._DeliveryAdditionalInfoKey.DemandGTSupply) {
                                                    // Demand > supply
                                                    sap.ui.core.Fragment.byId("releaseDeliveryDialog", "demandGTSupplyText").setText(
                                                            oData.results[i].Value).removeStyleClass("zAwctTextGrayItalics");
                                                } else if (oData.results[i].Key === oController._DeliveryAdditionalInfoKey.BCNotMaintained) {
                                                    // BC not Maintained
                                                    sap.ui.core.Fragment.byId("releaseDeliveryDialog", "batchCharNTMaintText").setText(
                                                            oData.results[i].Value).removeStyleClass("zAwctTextGrayItalics");
                                                }
                                            }

                                            // Get the charge informations
                                            // Call GetChargeCodes function import to get the details of charges
                                            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GetChargeCodesForRelease", {
                                                urlParameters : {
                                                    "DeliveryID" : "'" + sDeliveryHeaderID + "'"
                                                }
                                            }, function(oJSONModel) {
                                                // Get the Charge Codes table
                                                oController._setViewBusy(false);
                                                var oChargeCodeTable = sap.ui.core.Fragment.byId("releaseDeliveryDialog", "chargeCodeTable");
                                                oChargeCodeTable.setModel(oJSONModel);
                                                oChargeCodeTable.bindItems({
                                                    path : "/results",
                                                    factory : jQuery.proxy(oController._createReleaseChargeCodeTableColumnListItem, oController)
                                                });
                                            }, function(oError) {
                                                // Error handler
                                                oController._oReleaseDeliveryDialog.close();
                                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                                oController._setViewBusy(false);
                                            });

                                            // Open the dialog
                                            oController._oReleaseDeliveryDialog.open();
                                        },
                                        error : function(oError) {
                                            // Error handler for GetAdditionalDeliveryInfo
                                            com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                            oController._setViewBusy(false);
                                        }
                                    });
                        },
                        /**
                         * Factory function for charge code table aggregation . This method will return list item and based on charge code , row will
                         * be styled.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @param {String}
                         *            sId The unique ID for each list item provided by the framework.
                         * @param {sap.ui.model.Context}
                         *            oContext The context for which a new list item instance is being created by the factory function.
                         * @returns {sap.m.ColumnListItem}
                         */
                        _createReleaseChargeCodeTableColumnListItem : function(sId, oContext) {
                            // change the row styling based on charge code ....
                            var sChargeCode = oContext.getProperty("ChargeCode");
                            var oChargeCodeTableListItem;

                            // if the charge code is "non charge total" or "non charge sub total" , change the row styling.....
                            if (sChargeCode === this._ChargeCodes.NonChargeTotal || sChargeCode === this._ChargeCodes.NonChargeSubTotal) {
                                oChargeCodeTableListItem = sap.ui.xmlfragment(sId,
                                        "com.zespri.awct.alloc.fragment.EditAllocationsChargeCodeTableTemplate", this).addStyleClass(
                                        "zAwctChargeCodeTableRowStyling");
                            } else {
                                oChargeCodeTableListItem = sap.ui.xmlfragment(sId,
                                        "com.zespri.awct.alloc.fragment.EditAllocationsChargeCodeTableTemplate", this);
                            }

                            // colum list item texts are set here , to set text based on chargecodes....
                            // if the charge code is noncharsub total , quantity , rate and delivery line no should be displayed as empty string
                            // since we are setting the texts here , binding is removed for corresponding columns
                            // Due to conflicts between frgament xml binding and this factory function set Text , we are doing set Text alone here and
                            // binding is removed from factory
                            if (sChargeCode === this._ChargeCodes.NonChargeSubTotal) {
                                // set text to charge code , if charge code is "NCS"(non charge subtotal) , set text to "Total of ZESPRI charges"
                                sap.ui.core.Fragment.byId(sId, "quantityText").setText("");
                                sap.ui.core.Fragment.byId(sId, "rateText").setText("");
                                sap.ui.core.Fragment.byId(sId, "deliveryNumberText").setText("");
                                sap.ui.core.Fragment.byId(sId, "chargeCodeText").setText(
                                        com.zespri.awct.util.I18NHelper
                                                .getText("TXT_ALLOCATION_EDITALLOCATIONS_CHARGE_CODE_TABLE_NCS_CHARGE_CODE_TEXT"));
                            } else {
                                // other than NCS charge code , set texts with data coming from backend
                                var sQuantity = com.zespri.awct.util.LocaleFormatHelper.formatQuantity(oContext.getProperty("Quantity"));
                                var sRate = com.zespri.awct.util.LocaleFormatHelper.formatAmount(oContext.getProperty("Rate"), oContext
                                        .getProperty("Currency"));
                                sap.ui.core.Fragment.byId(sId, "rateText").setText(sRate);
                                sap.ui.core.Fragment.byId(sId, "chargeCodeText").setText(sChargeCode);

                                // Delivery number & quantity should be shown only for non administrative charges
                                if (sChargeCode !== this._ChargeCodes.AdministrativeCharges) {
                                    sap.ui.core.Fragment.byId(sId, "deliveryNumberText").setText(oContext.getProperty("DeliveryLineNumber"));
                                    sap.ui.core.Fragment.byId(sId, "quantityText").setText(sQuantity + " " + oContext.getProperty("UoM"));
                                }
                            }
                            return oChargeCodeTableListItem;
                        },

                        /**
                         * Factory function for charge code table aggregation . This method will return list item and based on charge code , row will
                         * be styled.
                         * 
                         * @private
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @param {String}
                         *            sId The unique ID for each list item provided by the framework.
                         * @param {sap.ui.model.Context}
                         *            oContext The context for which a new list item instance is being created by the factory function.
                         * @returns {sap.m.ColumnListItem}
                         */
                        _createUnlockChargeCodeTableColumnListItem : function(sId, oContext) {
                            // change the row styling based on charge code ....
                            var sChargeCode = oContext.getProperty("ChargeCode");
                            var oChargeCodeTableListItem;

                            // if the charge code is "non charge total" or "non charge sub total" , change the row styling.....
                            if (sChargeCode === this._ChargeCodes.NonChargeTotal || sChargeCode === this._ChargeCodes.NonChargeSubTotal) {
                                oChargeCodeTableListItem = sap.ui.xmlfragment(sId,
                                        "com.zespri.awct.alloc.fragment.EditAllocationsChargeCodeTableTemplate", this).addStyleClass(
                                        "zAwctChargeCodeTableRowStyling");
                            } else {
                                oChargeCodeTableListItem = sap.ui.xmlfragment(sId,
                                        "com.zespri.awct.alloc.fragment.EditAllocationsChargeCodeTableTemplate", this);
                            }

                            // colum list item texts are set here , to set text based on chargecodes....
                            // if the charge code is noncharsub total , quantity , rate and delivery line no should be displayed as empty string
                            // since we are setting the texts here , binding is removed for corresponding columns
                            // Due to conflicts between frgament xml binding and this factory function set Text , we are doing set Text alone here and
                            // binding is removed from factory

                            // set text to charge code , if charge code is "NCT"(non charge total) , set text to "Total of ZESPRI charges"
                            if (sChargeCode === this._ChargeCodes.NonChargeTotal) {
                                sap.ui.core.Fragment.byId(sId, "quantityText").setText("");
                                sap.ui.core.Fragment.byId(sId, "rateText").setText("");
                                sap.ui.core.Fragment.byId(sId, "deliveryNumberText").setText("");
                                sap.ui.core.Fragment.byId(sId, "chargeCodeText").setText(
                                        com.zespri.awct.util.I18NHelper
                                                .getText("TXT_ALLOCATION_EDITALLOCATIONS_CHARGE_CODE_TABLE_NCT_CHARGE_CODE_TEXT"));

                            } else if (sChargeCode === this._ChargeCodes.NonChargeSubTotal) {
                                // NCS
                                sap.ui.core.Fragment.byId(sId, "quantityText").setText("");
                                sap.ui.core.Fragment.byId(sId, "rateText").setText("");
                                sap.ui.core.Fragment.byId(sId, "deliveryNumberText").setText("");
                                sap.ui.core.Fragment.byId(sId, "chargeCodeText").setText(
                                        com.zespri.awct.util.I18NHelper
                                                .getText("TXT_ALLOCATION_EDITALLOCATIONS_CHARGE_CODE_TABLE_NCS_EXCLUDING_CHARGE_CODE_TEXT"));
                            } else {
                                // other than NCT charge code , set texts with data coming from backend
                                var sQuantity = com.zespri.awct.util.LocaleFormatHelper.formatQuantity(oContext.getProperty("Quantity"));
                                var sRate = com.zespri.awct.util.LocaleFormatHelper.formatAmount(oContext.getProperty("Rate"), oContext
                                        .getProperty("Currency"));
                                sap.ui.core.Fragment.byId(sId, "rateText").setText(sRate);
                                sap.ui.core.Fragment.byId(sId, "chargeCodeText").setText(sChargeCode);

                                // Delivery number & quantity should be shown only for non administrative charges
                                if (sChargeCode !== this._ChargeCodes.AdministrativeCharges) {
                                    sap.ui.core.Fragment.byId(sId, "quantityText").setText(sQuantity + " " + oContext.getProperty("UoM"));
                                    sap.ui.core.Fragment.byId(sId, "deliveryNumberText").setText(oContext.getProperty("DeliveryLineNumber"));
                                }
                            }

                            return oChargeCodeTableListItem;
                        },
                        /**
                         * This method will be called when release button is clicked in the dialog . It handles delivery release .
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleDeliveryRelease : function() {
                            var oController = this;

                            // Get data to pass Parameters for ReleaseDelivery fnImport
                            var sDeliveryHeaderID = this._oDeliveryHeaderContext.getProperty("DeliveryHeaderID");
                            var sComment = sap.ui.core.Fragment.byId("releaseDeliveryDialog", "commentTextArea").getValue();
                            var sReason = sap.ui.core.Fragment.byId("releaseDeliveryDialog", "releaseReasonSelect").getSelectedKey();

                            // Set the dialog busy until data is loaded
                            this._oReleaseDeliveryDialog.setBusy(true);

                            // Call the ReleaseDelivery function import to release the delivery
                            this.getView().getModel().read(
                                    "/ReleaseDelivery",
                                    {
                                        urlParameters : {
                                            "DeliveryID" : "'" + sDeliveryHeaderID + "'",
                                            "Comment" : "'" + sComment + "'",
                                            "Reason" : "'" + sReason + "'"
                                        },
                                        success : function() {
                                            // Get the contextPath from the currentContext .
                                            // subStr(1) is used to get deliveryHeader path after "/", it will remove "/" from path
                                            var sContextPath = oController._oDeliveryHeaderContext.getPath().substr(1);

                                            // Check the model of "_oDeliveryHeaderContext" .
                                            // If the context is from application model , get the contextPath from "_oDeliveryHeaderContext"
                                            // if the context is not from application model (i.e. from JSON model) , get the contextPath using the
                                            // metadata URI string
                                            if (oController._oDeliveryHeaderContext.getModel() !== oController.getView().getModel()) {
                                                var oDeliveryHeaderResult = oController._oDeliveryHeaderContext.getModel().getData().result;
                                                var sUri = oDeliveryHeaderResult.__metadata.uri;
                                                var aURISplit = sUri.split("/");
                                                if (aURISplit.length) {
                                                    // Get the last string from the split array which will contain the delivery header context
                                                    sContextPath = aURISplit[aURISplit.length - 1];
                                                }
                                            }
                                            oController._oReleaseDeliveryDialog.setBusy(false);
                                            oController._oReleaseDeliveryDialog.close();

                                            // Navigate to DeliveryWorkList with contextPath as released deliveryHeaderID
                                            oController.getRouter().navTo("Allocation/DeliveryWorkList/Detail", {
                                                contextPath : sContextPath
                                            });

                                            // delay the toast to allow navigation animation first and then show the success toast
                                            window.setTimeout(function() {
                                                var sSuccessText = com.zespri.awct.util.I18NHelper.getText(
                                                        "TXT_ALLOCATION_EDITALLOCATIONS_RELEASE_DELIVERY_SUCCESS", [sDeliveryHeaderID]);
                                                com.zespri.awct.util.NotificationHelper.showSuccessToast(sSuccessText);
                                            }, 500);

                                        },
                                        error : function(oError) {
                                            // Handle release error
                                            com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                            oController._oReleaseDeliveryDialog.setBusy(false);
                                        }
                                    });
                        },

                        /**
                         * This method will be triggered when cancel button is clicked in the release dialog.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleDeliveryReleaseCancel : function() {
                            this._oReleaseDeliveryDialog.close();
                        },

                        /**
                         * This method will be triggered when Unlock button is clicked.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleDeliveryUnLockPress : function() {
                            var oController = this;

                            // Prevent action if view has unsaved changes.
                            if (this._stopActionIfViewDirty()) {
                                return;
                            }

                            // Create the instance of the dialog , if its not created already
                            if (!this._oUnlockDeliveryDialog) {
                                this._oUnlockDeliveryDialog = new sap.ui.xmlfragment("unlockDeliveryFragment",
                                        "com.zespri.awct.alloc.fragment.EditAllocationsUnlockDialog", this);
                                this.getView().addDependent(this._oUnlockDeliveryDialog);

                                // Charge code table - Use the helper 'manageNoDataText' method. Also, rerender the dialog once the table's data
                                // (variable
                                // height) has been rendered. This will ensure that the dialog is positioned at the center of the screen, and also
                                // that
                                // the footer buttons of the dialog are visible
                                var oChargeCodeTable = sap.ui.core.Fragment.byId("unlockDeliveryFragment", "chargeCodeTable");
                                com.zespri.awct.util.CommonHelper.manageNoDataText(oChargeCodeTable);
                                oChargeCodeTable.attachUpdateFinished(function() {
                                    oController._oUnlockDeliveryDialog.rerender();
                                });
                            }

                            var sDeliveryHeaderID = this._oDeliveryHeaderContext.getProperty("DeliveryHeaderID");
                            // Clear existing values so that they are not visible when dialog is opened.
                            sap.ui.core.Fragment.byId("unlockDeliveryFragment", "selectDemandChangeReason").getSelectedKey("");

                            // Set the view busy until data is loaded
                            this._setViewBusy(true);

                            // Call GetAdditionalDeliveryInfo function import
                            this.getView().getModel().read(
                                    "/GetAdditionalDeliveryInfo",
                                    {
                                        urlParameters : {
                                            "DeliveryID" : "'" + sDeliveryHeaderID + "'"
                                        },
                                        success : function(oData) {
                                            // By default , set noDataText
                                            var sDemandGTSupplyNoDataText = com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_ALLOCATION_EDITALLOCATIONS_UNLOCK_DIALOG_DEMAND_GT_SUPPLY_NODATA_TEXT");
                                            var sBatchCharNoDataText = com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_ALLOCATION_EDITALLOCATIONS_UNLOCK_DIALOG_BC_NOT_MAINTAINED_NODATA_TEXT");

                                            sap.ui.core.Fragment.byId("unlockDeliveryFragment", "demandGTSupplyText").setText(
                                                    sDemandGTSupplyNoDataText).addStyleClass("zAwctTextGrayItalics");
                                            sap.ui.core.Fragment.byId("unlockDeliveryFragment", "batchCharNTMaintText").setText(sBatchCharNoDataText)
                                                    .addStyleClass("zAwctTextGrayItalics");

                                            // Set Shipment and Delivery Number
                                            sap.ui.core.Fragment.byId("unlockDeliveryFragment", "shipmentNumberText").setText(
                                                    oController._oDeliveryHeaderContext.getProperty("ShipmentID"));
                                            sap.ui.core.Fragment.byId("unlockDeliveryFragment", "deliveryNumberText").setText(
                                                    oController._oDeliveryHeaderContext.getProperty("DeliveryHeaderID"));

                                            var oDataCount = oData.results.length;
                                            // update the demand > supply and BC not Maintained texts with results returned from the function import
                                            // Results contain KEY -> Value pairs , set the value to fields in the dialog based on the KEY
                                            for ( var i = 0; i < oDataCount; i++) {
                                                // Demand > Supply
                                                if (oData.results[i].Key === oController._DeliveryAdditionalInfoKey.DemandGTSupply) {
                                                    sap.ui.core.Fragment.byId("unlockDeliveryFragment", "demandGTSupplyText").setText(
                                                            oData.results[i].Value).removeStyleClass("zAwctTextGrayItalics");
                                                } else if (oData.results[i].Key === oController._DeliveryAdditionalInfoKey.BCNotMaintained) {
                                                    // BC not Maintained
                                                    sap.ui.core.Fragment.byId("unlockDeliveryFragment", "batchCharNTMaintText").setText(
                                                            oData.results[i].Value).removeStyleClass("zAwctTextGrayItalics");
                                                }
                                            }

                                            // Get the charge informations
                                            // Call GetChargeCodes function import to get the details of charges
                                            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GetChargeCodesForUnlock", {
                                                urlParameters : {
                                                    "DeliveryID" : "'" + sDeliveryHeaderID + "'"
                                                }
                                            }, function(oJSONModel) {
                                                // Get the Charge Codes table
                                                oController._setViewBusy(false);
                                                var oChargeCodeTable = sap.ui.core.Fragment.byId("unlockDeliveryFragment", "chargeCodeTable");
                                                oChargeCodeTable.setModel(oJSONModel);
                                                oChargeCodeTable.bindItems({
                                                    path : "/results",
                                                    factory : jQuery.proxy(oController._createUnlockChargeCodeTableColumnListItem, oController)
                                                });
                                            }, function(oError) {
                                                // Error handler for charge code function import var oChargeCodeFetchErrorResponse
                                                oController._oUnlockDeliveryDialog.close();
                                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                                oController._setViewBusy(false);
                                            });

                                            // Open the dialog
                                            oController._oUnlockDeliveryDialog.open();
                                        },
                                        error : function(oError) {
                                            // Error handler for GetAdditionalDeliveryInfo
                                            com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                            oController._setViewBusy(false);
                                        }
                                    });

                        },

                        /**
                         * This method is called when the Continue button in the Unlock delivery dialog is pressed to unlock the delivery.
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleUnlockContinuePress : function() {

                            var oController = this;
                            // Get data to pass Parameters for UnlockDelivery fnImport
                            var sDeliveryHeaderID = this._oDeliveryHeaderContext.getProperty("DeliveryHeaderID");
                            // Reason is stored and passed during second confirm unlock call also.
                            this._sReason = sap.ui.core.Fragment.byId("unlockDeliveryFragment", "selectDemandChangeReason").getSelectedKey();
                            // Set the dialog busy until data is loaded
                            this._oUnlockDeliveryDialog.setBusy(true);

                            // Call the UnlockDelivery function import to unlock the delivery. Confirm parameter is passed as false, indicating call
                            // from first unlock
                            // dialog and not the confirm dialog
                            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/UnlockDelivery", {
                                urlParameters : {
                                    "DeliveryID" : "'" + sDeliveryHeaderID + "'",
                                    "Reason" : "'" + this._sReason + "'",
                                    "Confirm" : false
                                }
                            }, function() {
                                // Success
                                oController._oUnlockDeliveryDialog.setBusy(false);
                                oController._oUnlockDeliveryDialog.close();
                                var sSuccessText = com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_EDITALLOCATIONS_UNLOCK_DELIVERY_SUCCESS",
                                        [sDeliveryHeaderID]);
                                com.zespri.awct.util.NotificationHelper.showSuccessToast(sSuccessText);

                                // On successful unlock, re-read the delivery header and adjust the view accordingly if needed.
                                oController._refreshDeliveryHeaderContext();
                            }, function(oError) {
                                // Error Handler
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                oController._oUnlockDeliveryDialog.setBusy(false);
                            });
                        },

                        /**
                         * This method is called when the Cancel button in the Unlock delivery dialog is pressed to close the dialog
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleUnlockCancelPress : function() {
                            this._oUnlockDeliveryDialog.close();
                        },

                        /**
                         * Event handler for 'press' event of the 'Lock' button
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleDeliveryLockPress : function() {
                            // Prevent action if view has unsaved changes.
                            if (this._stopActionIfViewDirty()) {
                                return;
                            }

                            // Set view to busy
                            this._setViewBusy(true);
                            var oController = this;

                            // Lock the delivery!
                            var sDeliveryHeaderID = this._oDeliveryHeaderContext.getProperty("DeliveryHeaderID");
                            this.getView().getModel().read("/LockDelivery", {
                                urlParameters : {
                                    DeliveryID : "'" + sDeliveryHeaderID + "'"
                                },
                                success : function() {
                                    // Show toast
                                    var sMessage = com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_EDITALLOCATIONS_LOCK_SUCCESS");
                                    com.zespri.awct.util.NotificationHelper.showSuccessToast(sMessage);

                                    // Delivery's status has changed. Re-read delivery and adjust UI (e.g footer buttons) as required
                                    oController._refreshDeliveryHeaderContext();
                                },
                                error : function(oError) {
                                    // Show error and remove busy state
                                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                    oController._setViewBusy(false);
                                }
                            });
                        },

                        /* Add Suppliers to Container */

                        /**
                         * Event handler for 'press' event of the 'Add Suppliers to Container' button
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleAddSuppliersToContainerOpen : function() {

                            var oController = this;
                            // Create dialog only once
                            if (!this._oAddSuppliersToContainerDialog) {
                                this._oAddSuppliersToContainerDialog = new sap.ui.xmlfragment("addSuppliersToContainerFragment",
                                        "com.zespri.awct.alloc.fragment.AddSuppliersToContainer", this);
                                this.getView().addDependent(this._oAddSuppliersToContainerDialog);
                            }

                            // Remove previous selections for suppliers
                            var oSupplierInput = sap.ui.core.Fragment.byId("addSuppliersToContainerFragment", "supplierIDInput");
                            oSupplierInput.setValue("");
                            if (this._getCustomDataForKey(oSupplierInput, "supplierList")) {
                                oSupplierInput.removeCustomData(this._getCustomDataForKey(oSupplierInput, "supplierList"));
                            }

                            this._oAddSuppliersToContainerDialog.setBindingContext(this._oDeliveryHeaderContext);
                            this._oAddSuppliersToContainerDialog.setBusy(true);
                            this._oAddSuppliersToContainerDialog.open();

                            com.zespri.awct.util.ModelHelper.getJSONModelForRead("ContainerSet", {
                                urlParameters : {
                                    "$filter" : "DeliveryID eq '" + oController._oDeliveryHeaderContext.getProperty("DeliveryHeaderID") + "'"
                                }
                            }, function(JSONModel) {
                                // Success
                                var oContainerSelect = sap.ui.core.Fragment.byId("addSuppliersToContainerFragment", "containerSelect");
                                oContainerSelect.setModel(JSONModel);
                                oContainerSelect.bindItems({
                                    path : "/results",
                                    template : oContainerSelect.getBindingInfo("items") ? oContainerSelect.getBindingInfo("items").template
                                            : oContainerSelect.getItems()[0].clone()
                                });

                                oController._oAddSuppliersToContainerDialog.setBusy(false);
                            }, function(oError) {
                                // Error
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                oController._oAddSuppliersToContainerDialog.setBusy(false);
                                oController._oAddSuppliersToContainerDialog.close();
                            });
                        },

                        /**
                         * Event handler for 'press' event of the close button in Add Suppliers to Container dialog
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleAddSuppliersToContainerCancelPress : function() {
                            this._oAddSuppliersToContainerDialog.close();
                        },

                        /**
                         * This method is called when the value help is pressed for suppliers input field
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleValueHelpPress : function(oEvent) {

                            this._oAddSuppliersToContainerSearchInputField = oEvent.getSource();

                            // create value help dialog only once
                            if (!this._oAddSuppliersToContainerSearchHelpDialog) {
                                this._oAddSuppliersToContainerSearchHelpDialog = new sap.ui.xmlfragment("supplierListDialog",
                                        "com.zespri.awct.collab.fragment.SearchFieldSelectionDialog", this);
                                this.getView().addDependent(this._oAddSuppliersToContainerSearchHelpDialog);
                            }

                            // Open the dialog
                            this._oAddSuppliersToContainerSearchHelpDialog.setTitle(this._getCustomDataForKey(
                                    this._oAddSuppliersToContainerSearchInputField, "label").getValue());

                            // No data text
                            com.zespri.awct.util.CommonHelper.manageNoDataText(this._oAddSuppliersToContainerSearchHelpDialog._table);

                            // Set appropriate binding to the table select dialog
                            this.bindTableSelectDialog(this._oAddSuppliersToContainerSearchInputField);

                        },

                        /**
                         * This method is a helper method that returns the CustomData that matches the value of the key
                         * 
                         * @param {sap.ui.core.Control}
                         *            Search field Input control
                         * @param {String}
                         *            sKey key of the CustomData to be found
                         * @returns CustomData that matches the key. If no key is matched, returns ""
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
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
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @param {Object}
                         *            oSearchField The search field for which the binding has to be done
                         */
                        bindTableSelectDialog : function(oSearchField) {

                            var oView = this.getView();
                            var oController = this;
                            var sBindingPathForItems = oController._getCustomDataForKey(oSearchField, "entitySet").getValue();
                            var sListItemRelativeBindingPath = oController._getCustomDataForKey(oSearchField, "filterKey").getValue();

                            sap.ui.core.Fragment.byId("supplierListDialog", "searchFieldLabel").setText(
                                    com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_SEARCH_FORM_VALUE_HELP_DIALOG_ALL_LABEL"));

                            // Success method for getJSONModelForRead call
                            var fnSuccess = function(oJSON) {

                                // Set growing threshold to the number of results so that preselection can be done
                                oController._oAddSuppliersToContainerSearchHelpDialog.setGrowingThreshold(oJSON.getData().results.length);

                                oController._oAddSuppliersToContainerSearchHelpDialog.setModel(oJSON);

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

                                oController._oAddSuppliersToContainerSearchHelpDialog.bindItems(oBindingInfo);

                                // Preselect the values that the user had selected when the dialog was opened the previous time
                                // 1. Read the value in the textbox
                                // 2. Loop through the items bound to the dialog box
                                // 3. If the values are same, set it as selected
                                var aSearchFieldValue = oSearchField.getValue().split(', ');

                                // Value from textbox
                                for ( var i = 0; i < aSearchFieldValue.length; i++) {
                                    // Items in dialog box
                                    for ( var j = 0; j < oController._oAddSuppliersToContainerSearchHelpDialog.getItems().length; j++) {
                                        // Prevent selection of blank rows
                                        if (aSearchFieldValue[i] &&
                                                (aSearchFieldValue[i] === oController._oAddSuppliersToContainerSearchHelpDialog.getItems()[j]
                                                        .getCells()[0].getText())) {
                                            oController._oAddSuppliersToContainerSearchHelpDialog.getItems()[j].setSelected(true);
                                        }
                                    }
                                }
                                oController._oAddSuppliersToContainerSearchHelpDialog._dialog.setBusy(false);

                            };

                            // destroy items before opening
                            this._oAddSuppliersToContainerSearchHelpDialog.destroyItems();

                            // Event handler for backend read has been defined now.
                            // Trigger the read. On success, the fnSuccess method is called
                            this._oAddSuppliersToContainerSearchHelpDialog.open();

                            this._oAddSuppliersToContainerSearchHelpDialog._dialog.setBusy(true);
                            this._oAddSuppliersToContainerSearchHelpDialog._dialog.setBusyIndicatorDelay(0);

                            // For dependent fields, set the filter separately. For other fields, filter gets set in the default case.

                            var sUserID = oView.getModel("currentUserDetails").getProperty("/UserID");

                            com.zespri.awct.util.ModelHelper.getJSONModelForRead(sBindingPathForItems, {
                                urlParameters : {
                                    "$select" : "SupplierID",
                                    "$filter" : "UserID eq '" + sUserID + "'"
                                }
                            }, fnSuccess, function(oError) {
                                // Error
                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                oController._oAddSuppliersToContainerSearchHelpDialog._dialog.setBusy(false);
                                oController._oAddSuppliersToContainerSearchHelpDialog._dialog.close();
                            });

                        },

                        /**
                         * This method is called when the search button is pressed in the table select dialog fragment
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @param {sap.ui.base.Event}
                         *            oEvent The Event object
                         */
                        handleValueHelpDialogSearch : function(oEvent) {

                            var sValue = oEvent.getParameter("value");
                            var sFilterKey = this.getView().getController()._getCustomDataForKey(this._oAddSuppliersToContainerSearchInputField,
                                    "filterKey").getValue();

                            var oFilter = new sap.ui.model.Filter(sFilterKey, sap.ui.model.FilterOperator.Contains, sValue);
                            var oBinding = oEvent.getSource().getBinding("items");
                            oBinding.filter([oFilter]);
                        },

                        /**
                         * This method is called when the OK button is pressed in the table select dialog fragment
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         * @param {sap.ui.base.Event}
                         *            oEvent The Event object
                         */
                        handleValueHelpDialogOKPress : function(oEvent) {

                            var sFilterKey = this._getCustomDataForKey(this._oAddSuppliersToContainerSearchInputField, "filterKey").getValue();

                            // List of selected items
                            var aContexts = oEvent.getParameter("selectedContexts");

                            // Array of selected values from the list of items
                            var aSelectedValues = aContexts.map(function(oContext) {
                                return oContext.getProperty(sFilterKey);
                            });

                            // Set the value for the textbox
                            this._oAddSuppliersToContainerSearchInputField.setValue(aSelectedValues.join(", "));

                            // Remove previously added custom data
                            if (this._getCustomDataForKey(this._oAddSuppliersToContainerSearchInputField, "supplierList")) {
                                this._oAddSuppliersToContainerSearchInputField.removeCustomData(this._getCustomDataForKey(
                                        this._oAddSuppliersToContainerSearchInputField, "supplierList"));
                            }
                            // If a new item is selected, add new custom data
                            if (aSelectedValues.length > 0) {
                                this._oAddSuppliersToContainerSearchInputField.addCustomData(new sap.ui.core.CustomData({
                                    "key" : "supplierList",
                                    "value" : aSelectedValues
                                }));
                            }
                        },

                        /**
                         * This method is called when the OK button is called in the add suppliers to container dialog
                         * 
                         * @memberOf com.zespri.awct.alloc.view.EditOrderAllocation
                         */
                        handleAddSuppliersToContainerOKPress : function() {
                            var oController = this;
                            var sDeliveryID = this._oAddSuppliersToContainerDialog.getBindingContext().getProperty("DeliveryHeaderID");
                            var sContainerID = sap.ui.core.Fragment.byId("addSuppliersToContainerFragment", "containerSelect").getSelectedKey();
                            var oSupplierInput = sap.ui.core.Fragment.byId("addSuppliersToContainerFragment", "supplierIDInput");
                            var aSelectedSuppliers = [];
                            if (this._getCustomDataForKey(oSupplierInput, "supplierList")) {
                                aSelectedSuppliers = this._getCustomDataForKey(oSupplierInput, "supplierList").getValue();
                            }

                            // If both container and suppliers are selected
                            if (aSelectedSuppliers.length && sContainerID) {
                                this._oAddSuppliersToContainerDialog.setBusy(true);
                                // Call function import
                                sap.ui.getCore().getRootComponent().getModel().read(
                                        "/AddSuppliersToContainer",
                                        {
                                            urlParameters : {
                                                "DeliveryNumber" : "'" + sDeliveryID + "'",
                                                "ContainerID" : "'" + sContainerID + "'",
                                                "SupplierList" : "'" + aSelectedSuppliers.join(",") + "'"
                                            },
                                            success : function() {
                                                // Success
                                                oController._oAddSuppliersToContainerDialog.setBusy(false);
                                                oController._oAddSuppliersToContainerDialog.close();
                                                com.zespri.awct.util.NotificationHelper.showSuccessToast(com.zespri.awct.util.I18NHelper
                                                        .getText("TXT_ALLOCATION_EDITALLOCATIONS_ADDSUPPLIERSTOCONTAINER_SUCCESS_MESSAGE"));
                                                // Refresh the table
                                                oController.byId("allocationTable").getBinding("items").refresh();
                                            },
                                            error : function(oError) {
                                                // Error
                                                oController._oAddSuppliersToContainerDialog.setBusy(false);
                                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                            }
                                        });

                            } else {
                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_ALLOCATION_EDITALLOCATIONS_ADDSUPPLIERSTOCONTAINER_ERROR_MESSAGE"));
                            }
                        }
                    });
})();
