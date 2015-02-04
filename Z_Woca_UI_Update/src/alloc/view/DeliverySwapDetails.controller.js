(function() {
    "use strict";
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });
    jQuery.sap.require("com.zespri.awct.util.CommonFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.Enums");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require("com.zespri.awct.util.ModelHelper");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");
    jQuery.sap.require("sap.ui.core.format.NumberFormat");

    /**
     * @classdesc This the view controller for DeliverySwapDetails , it will show the details of the selected delivery swap . Zespri users can either accept or
     * reject the swap .
     * 
     * @class
     * @name com.zespri.awct.alloc.view.DeliverySwapDetails
     */
    com.zespri.awct.core.Controller.extend("com.zespri.awct.alloc.view.DeliverySwapDetails",
    /** @lends com.zespri.awct.alloc.view.DeliverySwapDetails */
    {
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it
         * is displayed, to bind event handlers and do other one-time initialization.
         * 
         * @memberOf com.zespri.awct.alloc.view.DeliverySwapDetails
         */
        onInit : function() {
            /* START of instance member initialization */
            // Private variable for storing the context from the delivery swap listings.
            this._oDeliverySwapListingContext = null;
            // Private Instance for View BC Dialog
            this._oViewBatchCharacteristicsDialog = null;
            // Private Instance variable for user authorization
            this._bUserAuthorized = false;
            /* END of instance member initialization */

            var oController = this;
            var oView = this.getView();

            // Check the incoming Route
            this.getRouter().attachRoutePatternMatched(
                    function(oEvent) {
                        if (oEvent.getParameter("name") === "Allocation/DeliverySwapDetails") {
                            // Check the current user authorizations
                            if (!oController._bUserAuthorized) {
                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                        .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));
                                return;
                            }

                            var sContextPath = oEvent.getParameter("arguments").contextPath;
                            this._oDeliverySwapListingContext = new sap.ui.model.Context(oView.getModel(), '/' + sContextPath);
                            var sDeliverySwapID = this._oDeliverySwapListingContext.getProperty("DeliverySwapID");

                            // boolean flag to indicate whether user is reaching screen from direct url
                            var bIsBookmarkUrl = false;

                            // Check whether delivery swap id is available
                            // It will not be available when user enters the direct URL in address bar.
                            // If Delivery Swap ID is available , bind the context to the form and items to the table .
                            // If delivery swap ID is not available , call getJSONModelForRead method and create the context .
                            if (sDeliverySwapID) {
                                // Bind the items to the table and form .
                                this._bindDeliverySwapLineItems(sContextPath, bIsBookmarkUrl);
                            } else {
                                bIsBookmarkUrl = true;

                                // Success handler
                                var fnReadSuccess = function(oJSONModel) {
                                    // Create the context from JSON Model
                                    oController._oDeliverySwapListingContext = new sap.ui.model.Context(oJSONModel, "/result");
                                    oController._bindDeliverySwapLineItems(sContextPath, bIsBookmarkUrl);
                                    oController.getView().setBusy(false);
                                };

                                // Error handler for this read
                                var fnReadError = function() {
                                    // Error Dialog
                                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                    oController.getView().setBusy(false);
                                };

                                this.getView().setBusy(true);
                                // Trigger the read
                                com.zespri.awct.util.ModelHelper.getJSONModelForRead(sContextPath, {
                                    urlParameters : {
                                        "$expand" : "DeliverySwapLineSet"
                                    }
                                }, fnReadSuccess, fnReadError);
                            }
                        }
                    }, this);
        },
        /**
         * This method will be called before rendering the View.
         * 
         * @memberOf com.zespri.awct.alloc.view.DeliverySwapDetails
         */
        onBeforeRendering : function() {
            // Check User Authorizations
            if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                    com.zespri.awct.util.Enums.AuthorizationObject.Allocation, com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)) {
                if (this.byId("pageSwapDetail")) {
                    this.byId("pageSwapDetail").destroy();
                }
                this._bUserAuthorized = false;
            } else {
                this._bUserAuthorized = true;
            }
        },
        /**
         * This method will bind the items to the table and form . This method also enable/disbale the footer buttons (Accept / Reject) based on the
         * User role
         * 
         * @private
         * @param {String}
         *            sContextPath The Path from the delivery Swap Listing
         * @param {Boolean}
         *            bIsBookmarkUrl Boolean to indicate whether user come directly to deliverySwap detail page
         * @memberOf com.zespri.awct.alloc.view.DeliverySwapDetails
         */
        _bindDeliverySwapLineItems : function(sContextPath, bIsBookmarkUrl) {
            var oTable = this.byId("deliverySwapDetailsTable");
            var sPath = '';

            // Binding schedule line context to the view
            this.getView().setModel(this._oDeliverySwapListingContext.getModel()).setBindingContext(this._oDeliverySwapListingContext);

            // Setting items binding path for schedule line table
            if (bIsBookmarkUrl) {
                sPath = "DeliverySwapLineSet/results";
            } else {
                sPath = "/" + sContextPath + "/DeliverySwapLineSet";
            }

            // Bind items to the table based on the context
            oTable.bindAggregation("items", {
                path : sPath,
                template : oTable.getBindingInfo("items") ? oTable.getBindingInfo("items").template : oTable.getItems()[0].clone()
            });
        },

        /**
         * This formatter is used to change the supplier Text . For Delivery Line , it will return the text "ALL" For Allocation Line , it will return
         * the SUPPLIER ID .
         * 
         * @memberOf com.zespri.awct.alloc.view.DeliverySwapDetails
         */
        formatIsSupplierLine : function(sSupplierID, sRecordType) {
            if (sRecordType === com.zespri.awct.util.Enums.AllocationLineRecordType.DeliveryLine) {
                return com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_DELIVERYSWAP_COLUMN_SUPPLIER_ID_ALL");
            } else {
                return sSupplierID;
            }
        },

        /**
         * This Method is called when the user clicks sourceBC link in the table and it opens a dialog with view batch characteristics
         * 
         * @memberOf com.zespri.awct.alloc.view.DeliverySwapCreate
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        handleViewSourceBatchCharacteristicsOpen : function(oEvent) {
            // Getting the Selected BC from the table
            var sSourceDeliveryLineID = oEvent.getSource().getBindingContext().getProperty("SourceDeliveryLineID");
            this._openViewBatchCharacteristicsDialog(sSourceDeliveryLineID);
        },

        /**
         * This Method is called when the user clicks targetBC link in the table and it opens a dialog with view batch characteristics
         * 
         * @memberOf com.zespri.awct.alloc.view.DeliverySwapCreate
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        handleViewTargetBatchCharacteristicsOpen : function(oEvent) {
            // Getting the Selected BC from the table
            var sTargetDeliveryLineID = oEvent.getSource().getBindingContext().getProperty("TargetDeliveryLineID");
            this._openViewBatchCharacteristicsDialog(sTargetDeliveryLineID);
        },

        /**
         * This Method is used to open a dialog with view batch characteristics based on selected deliveryLineNumber.
         * 
         * @private
         * @memberOf com.zespri.awct.alloc.view.DeliverySwapCreate
         * @param {String}
         *            sDeliveryLineNumber Delivery to be passed as a filter to get the batch characteristics
         */
        _openViewBatchCharacteristicsDialog : function(sDeliveryLineID) {
            // Storing the current instance
            var oController = this;

            // Success function for the model read for BatchCharacteristicSet
            var fnSuccessBatchCharacteristicsRead = function(oBatchCharacteristicsModel) {
                oController._oViewBatchCharacteristicsDialog.setModel(oBatchCharacteristicsModel);

                // Getting the count of batch characteristics and setting it as the table header
                var iBatchCharacteristicsCount = oBatchCharacteristicsModel.getData().results.length;
                sap.ui.core.Fragment.byId("viewBatchCharacteristicsFragment", "viewBatchCharacteristicsTableHeader").setText(
                        com.zespri.awct.util.I18NHelper
                                .getText("TXT_ALLOCATION_VIEW_BATCH_CHARACTERISTICS_TABLE_TITLE", [iBatchCharacteristicsCount]));
                oController._oViewBatchCharacteristicsDialog.setBusy(false);
            };
            var fnErrorBatchCharacteristicsRead = function(oError) {
                // Read Error
                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);

                oController._oViewBatchCharacteristicsDialog.setBusy(false);
            };
            // Create the fragment only if it doesnot exist
            if (!oController._oViewBatchCharacteristicsDialog) {
                oController._oViewBatchCharacteristicsDialog = new sap.ui.xmlfragment("viewBatchCharacteristicsFragment",
                        "com.zespri.awct.alloc.fragment.ViewBatchCharacteristics", this);
                // set the view BC toolbar visibility to false
                sap.ui.core.Fragment.byId("viewBatchCharacteristicsFragment", "viewBCToolBar").setVisible(false);
                oController.getView().addDependent(oController._oViewBatchCharacteristicsDialog);
            }

            // Getting the Batch characteristics that are linked to the selected Delivery Line.
            com.zespri.awct.util.ModelHelper.getJSONModelForRead("/BatchCharacteristicsSet", {
                urlParameters : {
                    "$filter" : "DeliveryLineID eq '" + sDeliveryLineID + "'",
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
         * @memberOf com.zespri.awct.alloc.view.DeliverySwapDetails
         */
        handleViewBatchCharacteristicsOKPress : function() {
            // Close the current fragment
            this._oViewBatchCharacteristicsDialog.close();
        },

        /**
         * Formatter function for the column 'Value' in 'ViewBatchCharacteristics' fragment
         * 
         * @memberOf com.zespri.awct.alloc.view.DeliverySwapDetails
         * @param {Object}
         *            oJsonBatchCharacteristicsValue contains the Batch Characteristics Values
         * @returns {String} returns the the Batch Characteristic Values separated with comma
         */
        formatViewBatchCharacteristicsValuesText : function(oJsonBatchCharacteristicsValue) {
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
         * @memberOf com.zespri.awct.alloc.view.DeliverySwapDetails
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
        }
    });
})();
