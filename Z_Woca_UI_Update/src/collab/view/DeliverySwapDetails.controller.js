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

    jQuery.sap.require("sap.ui.core.format.NumberFormat");

    jQuery.sap.require("com.zespri.awct.util.ModelHelper");

    /**
     * This the view controller for DeliverySwapDetails , it will show the details of the selected delivery swap . Zespri users can either accept or
     * reject the swap .
     * 
     * @class
     * @name com.zespri.awct.collab.view.DeliverySwapDetails
     */
    com.zespri.awct.core.Controller.extend("com.zespri.awct.collab.view.DeliverySwapDetails",
    /** @lends com.zespri.awct.collab.view.DeliverySwapDetails */
    {
        // Private variable for storing the context from the delivery swap listings .
        _oDeliverySwapListingContext : null,

        // Private enum for record type
        _DeliverySwapRecordType : {
            DeliveryLine : "D",
            SupplierOrderLine : "A"
        },
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it
         * is displayed, to bind event handlers and do other one-time initialization.
         * 
         * @memberOf com.zespri.awct.collab.view.DeliverySwapDetails
         */
        onInit : function() {

            var oController = this;
            var oView = this.getView();

            // Check the incoming Route
            this.getRouter().attachRoutePatternMatched(function(oEvent) {
                if (oEvent.getParameter("name") === "Collaboration/DeliverySwapDetails") {
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
                            oController.getView().setBusy(false);
                            var sErrorText = com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_DETAILS_ERROR_MESSAGE");
                            com.zespri.awct.util.NotificationHelper.showErrorDialog(sErrorText);
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
         * This method will bind the items to the table and form . This method also enable/disbale the footer buttons (Accept / Reject) based on the
         * User role
         * 
         * @private
         * @param {String}
         *          sContextPath The Path from the delivery Swap Listing 
         * @param {Boolean}
         *          bIsBookmarkUrl Boolean to indicate whether user come directly to deliverySwap detail page
         * @memberOf com.zespri.awct.collab.view.DeliverySwapDetails
         */
        _bindDeliverySwapLineItems : function(sContextPath, bIsBookmarkUrl) {

            var oTable = this.byId("deliverySwapDetailsTable");
            var sPath = '';
            // binding schedule line context to the view
            this.getView().setModel(this._oDeliverySwapListingContext.getModel()).setBindingContext(this._oDeliverySwapListingContext);

            // setting items binding path for schedule line table
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
         * @memberOf com.zespri.awct.collab.view.DeliverySwapDetails
         */
        formatIsSupplierLine : function(sSupplierID, sRecordType) {

            if (sRecordType === this._DeliverySwapRecordType.DeliveryLine) {
                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_DELIVERYSWAP_COLUMN_SUPPLIER_ID_ALL");
            } else {
                return sSupplierID;
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
         * @memberOf com.zespri.awct.collab.view.DeliverySwapDetails
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
         * @memberOf com.zespri.awct.collab.view.DeliverySwapDetails
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
        }
    });
})();
