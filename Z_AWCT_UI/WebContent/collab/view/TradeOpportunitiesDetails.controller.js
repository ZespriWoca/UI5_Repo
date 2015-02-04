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
    /**
     * @classdesc This is the controller for TradeOpportunitiesDetails view which displays the details and batch characteristics about a particular
     *            trade selected from the TradeOpportunity view. Accept and Reject options are available for the supplier if the selected trade is of
     *            Inbound type but not for Outbound type.
     * @class
     * @name com.zespri.awct.collab.view.TradeOpportunities
     */
    com.zespri.awct.core.Controller
            .extend(
                    "com.zespri.awct.collab.view.TradeOpportunitiesDetails",
                    /** @lends com.zespri.awct.collab.view.TradeOpportunitiesDetails */
                    {

                        // Private enum for approval status
                        _ApproveStatus : {
                            Accept : "A",
                            Reject : "R"
                        },

                        /**
                         * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify
                         * the View before it is displayed, to bind event handlers and do other one-time initialization.
                         * 
                         * On load of this view, the trade opportunity context passed from Trade Opportunities view is fetched.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TradeOpportunitiesDetails
                         */
                        onInit : function() {
                            /* START of instance member initialization */
                            // Private variable for Trade Opportunity Context
                            this._oTradeOpportuityContext = null;
                            // Private variable for Trade Accept dialog
                            this._oOpenTradeAcceptDialog = null;
                            // Private variable for context path
                            this._sContextPath = null;
                            // Private Instance variable for user authorization
                            this._bUserAuthorized = false;
                            /* END of instance member initialization */

                            var oController = this;
                            var oView = this.getView();

                            // Check the incoming Route. If the user reached this view from the 'TradeOpportunities' view, the details about the
                            // current trade opportunity will already be available in the model and oModel.getProperty() is enough to get this
                            // information. However,
                            // if the
                            // user reaches this page by directly pasting the link in the address bar, the model will be empty and .getProperty() will
                            // fail. In such a
                            // case, we need to read the current trade opportunity from the backend, using the context path available in the URL.
                            //
                            // Thus, in one scenario (user reaches from TradeOpportunities) the context is already available, whereas in another
                            // scenario (user uses
                            // address bar to reach) the context needs to be fetched asynchronously. In either case, the inline function
                            // fnOnTradeOpportunityAvailable is invoked only after the context is available. Code inside that function can assume that
                            // trade
                            // opportunity
                            // context is available.
                            this.getRouter().attachRoutePatternMatched(
                                    function(oEvent) {
                                        // Check if the route is for the TradeOpportunitiesDetails view
                                        if (oEvent.getParameter("name") === "Collaboration/TradeOpportunitiesDetails") {
                                            // Check the current user authorizations
                                            if (!this._bUserAuthorized) {
                                                com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                                        .getText("TXT_USER_NOT_AUTHORIZED_MESSAGE_TEXT"));
                                            } else {

                                                // Get context from URL route
                                                oController._sContextPath = oEvent.getParameter("arguments").contextPath;

                                                // Set the Model from Core , because after refresh on Direct URL , the view model will be set to JSON
                                                // MODEL
                                                var oODataModel = sap.ui.getCore().getRootComponent().getModel();
                                                oView.setModel(oODataModel);
                                                oController._oTradeOpportuityContext = new sap.ui.model.Context(oView.getModel(), '/' +
                                                        oController._sContextPath);

                                                // Set View BC Table busy State to true
                                                var oViewBCTable = oController.byId("batchCharacteristicsTable");
                                                // Manage NoData Texts , listen for table update EVENT
                                                com.zespri.awct.util.CommonHelper.manageNoDataText(oViewBCTable);

                                                // Set loading text and busy state to delivery header text
                                                var sLoadingText = com.zespri.awct.util.I18NHelper.getText("TXT_LIST_LOADING_LABEL");
                                                oController.byId("deliveryHeaderText").setText(sLoadingText);
                                                oController.byId("deliveryHeaderText").setBusy(true);
                                                oController.byId("deliveryHeaderText").setBusyIndicatorDelay(0);

                                                // Set footer to busy
                                                oController.byId("pageTradeOpportunitiesDetails").getFooter().setBusy(true);

                                                // Is the URL context available in the model already? If not, trigger a read to get it.
                                                var sTradeID = oController._oTradeOpportuityContext.getProperty("TradeID");
                                                if (sTradeID) {
                                                    fnOnTradeOpportunityAvailable();
                                                } else {
                                                    // Need to get trade opportunity details from the backend. Prepare success handler for this read.
                                                    var fnReadSuccess = function(oJSONModel) {
                                                        oController._oTradeOpportuityContext = new sap.ui.model.Context(oJSONModel, "/result");
                                                        fnOnTradeOpportunityAvailable();
                                                    };

                                                    // Error handler for this read
                                                    var fnReadError = function(oError) {
                                                        // Error
                                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                                    };

                                                    // Trigger the read
                                                    com.zespri.awct.util.ModelHelper.getJSONModelForRead(oController._sContextPath, {

                                                    }, fnReadSuccess, fnReadError);
                                                }
                                            }
                                        }
                                    }, this);

                            // What to do once trade opportunity context is available?
                            var fnOnTradeOpportunityAvailable = function() {

                                // Update visibility of footer buttons
                                oController._updateFooterButtonsVisibility();
                                oController.byId("pageTradeOpportunitiesDetails").getFooter().setBusy(false);

                                var oModel = oController._oTradeOpportuityContext.getModel();
                                oController.getView().setModel(oModel).setBindingContext(oController._oTradeOpportuityContext);
                                var sStatus = oController._oTradeOpportuityContext.getProperty("Status");
                                if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Initiated) {
                                    oController.byId("statusObject").setText(
                                            com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_INITIATED"));
                                    oController.byId("statusObject").setState(sap.ui.core.ValueState.None);
                                } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Accepted) {
                                    oController.byId("statusObject").setText(
                                            com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_ACCEPTED"));
                                    oController.byId("statusObject").setState(sap.ui.core.ValueState.Success);
                                } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Rejected) {
                                    oController.byId("statusObject").setText(
                                            com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_REJECTED"));
                                    oController.byId("statusObject").setState(sap.ui.core.ValueState.Error);
                                } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Expired) {
                                    oController.byId("statusObject")
                                            .setText(
                                                    com.zespri.awct.util.I18NHelper
                                                            .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_EXPIRED"));
                                    oController.byId("statusObject").setState(sap.ui.core.ValueState.Warning);
                                } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted) {
                                    oController.byId("statusObject").setText(
                                            com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_PARTIALLY_ACCEPTED"));
                                    oController.byId("statusObject").setState(sap.ui.core.ValueState.None);
                                } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Cancelled) {
                                    oController.byId("statusObject").setText(
                                            com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_CANCELLED"));
                                    oController.byId("statusObject").setState(sap.ui.core.ValueState.Error);
                                }

                                // STRAT of Batch READ (View BC + Delivery header text)Operations
                                // Getting the Delivery Header ID
                                var sDeliveryHeaderId = oController._oTradeOpportuityContext.getProperty("DeliveryID");
                                var oCoreModel = sap.ui.getCore().getRootComponent().getModel();

                                var fnBatchReadError = function(oError) {
                                    // Error handler for batch read
                                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                };

                                var fnBatchReadSuccess = function(oData, oResponse, aErrorResponses) {
                                    // Success Handler for batch read
                                    // Set Data to Batch Characteristics table
                                    var oDataForBC = oData.__batchResponses[0].data;
                                    var oJSONModelForBC = new sap.ui.model.json.JSONModel();
                                    oJSONModelForBC.setData(oDataForBC);

                                    // Bind items to BC table
                                    var oBatchCharTable = oController.byId("batchCharacteristicsTable");
                                    oBatchCharTable.setModel(oJSONModelForBC);
                                    oBatchCharTable.bindItems({
                                        path : "/results",
                                        template : oBatchCharTable.getBindingInfo("items") ? oBatchCharTable.getBindingInfo("items").template
                                                : oBatchCharTable.getItems()[0].clone()
                                    });
                                    oBatchCharTable.setBusy(false);

                                    // Set text to delivery HeaderText
                                    var sDeliveryHeaderText = "";
                                    if (oData.__batchResponses[1].data) {
                                        sDeliveryHeaderText = oData.__batchResponses[1].data.TextString;
                                    }

                                    // Setting the Text area with the current Header Text
                                    if (sDeliveryHeaderText) {
                                        oController.byId("deliveryHeaderText").setText(sDeliveryHeaderText).removeStyleClass("zAwctTextGrayItalics");
                                    } else {
                                        // If no delivery header text available , set "NotAvailable" text
                                        oController.byId("deliveryHeaderText").setText(
                                                com.zespri.awct.util.I18NHelper
                                                        .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_DETAILS_DELIVERY_HEADER_TEXT_NOT_AVAILABLE"))
                                                .addStyleClass("zAwctTextGrayItalics");
                                    }

                                    oController.byId("deliveryHeaderText").setBusy(false);

                                    // Show errors, if any
                                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(aErrorResponses);
                                };

                                // Batch read for Batch Characteristics
                                var oBatchOperationFoBCRead = oCoreModel.createBatchOperation(
                                        "BatchCharacteristicsSet?%24filter=DeliveryLineID%20eq%20%27" +
                                                oController._oTradeOpportuityContext.getProperty("DeliveryLineID") +
                                                "%27&%24expand=BatchCharacteristicsValueSet", "GET");

                                // Batch read for delivery header text
                                var oBatchOperationForDeliveryHeaderText = oCoreModel.createBatchOperation("DeliveryHeaderSet('" + sDeliveryHeaderId +
                                        "')/Text", "GET");

                                var aBatchRequest = [oBatchOperationFoBCRead, oBatchOperationForDeliveryHeaderText];

                                oCoreModel.addBatchReadOperations(aBatchRequest);
                                oCoreModel.submitBatch(fnBatchReadSuccess, fnBatchReadError);
                                // END OF BATCH READ
                            };
                        },
                        /**
                         * This method will be called before rendering the View.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TradeOpportunitiesDetails
                         */
                        onBeforeRendering : function() {
                            // Check User Authorizations
                            if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                                    com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                    com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP)) {
                                if (this.byId("pageTradeOpportunitiesDetails")) {
                                    this.byId("pageTradeOpportunitiesDetails").destroy();
                                }
                                this._bUserAuthorized = false;
                            } else {
                                this._bUserAuthorized = true;
                            }
                        },
                        /**
                         * Helper to set the view to busy. Footer and view need to both be set to 'busy'
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.TradeOpportunitiesDetails
                         * @param {Boolean}
                         *            bBusy Indicates whether the view is to be set to busy state
                         */
                        _setViewBusy : function(bBusy) {
                            this.getView().setBusy(bBusy);
                            this.byId("pageTradeOpportunitiesDetails").getFooter().setBusy(bBusy);
                        },

                        /**
                         * This method is called when the Accept button in the trade opportunities details view is clicked.
                         * 
                         * On click of this button the inbound trade opportunity is accepted by the supplier if trade type is Inbound, else a dialog
                         * opens for Open trade type.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TradeOpportunitiesDetails
                         */
                        handleAcceptPress : function() {
                            var oController = this;
                            var sTradeID = this._oTradeOpportuityContext.getProperty("TradeID");
                            if (this._oTradeOpportuityContext.getProperty("Type") === com.zespri.awct.util.Enums.TradeType.Inbound) {
                                this._setViewBusy(true);
                                // Function import for accept of Inbound trades
                                sap.ui
                                        .getCore()
                                        .getRootComponent()
                                        .getModel()
                                        .read(
                                                "/ApproveTrade",
                                                {
                                                    urlParameters : {
                                                        "TradeUpdateTime" : com.zespri.awct.util.CommonFormatHelper
                                                                .formatJSDateToEDMDateTimeString(this._oTradeOpportuityContext
                                                                        .getProperty("TradeUpdateTime")),
                                                        "TargetSupplier" : "''",
                                                        "Status" : "'" + this._ApproveStatus.Accept + "'",
                                                        "TradeID" : "'" + sTradeID + "'",
                                                        "AcceptedQuantity" : 0
                                                    },
                                                    success : function() {
                                                        // Success
                                                        var sSuccessText = com.zespri.awct.util.I18NHelper
                                                                .getText("TXT_COLLABORATION_TRADEOPPORTUNITY_ACCEPT_DELIVERY_SUCCESS");
                                                        com.zespri.awct.util.NotificationHelper.showSuccessToast(sSuccessText);
                                                        // Trigger the read
                                                        com.zespri.awct.util.ModelHelper
                                                                .getJSONModelForRead(
                                                                        oController._sContextPath,
                                                                        {
                                                                            urlParameters : {
                                                                                "$select" : 'Status'
                                                                            }
                                                                        },
                                                                        function(oJSONModel) {
                                                                            var sStatus = oJSONModel.getProperty("/result").Status;
                                                                            if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Initiated) {
                                                                                oController
                                                                                        .byId("statusObject")
                                                                                        .setText(
                                                                                                com.zespri.awct.util.I18NHelper
                                                                                                        .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_INITIATED"));
                                                                                oController.byId("statusObject")
                                                                                        .setState(sap.ui.core.ValueState.None);
                                                                            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Accepted) {
                                                                                oController
                                                                                        .byId("statusObject")
                                                                                        .setText(
                                                                                                com.zespri.awct.util.I18NHelper
                                                                                                        .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_ACCEPTED"));
                                                                                oController.byId("statusObject").setState(
                                                                                        sap.ui.core.ValueState.Success);
                                                                            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Rejected) {
                                                                                oController
                                                                                        .byId("statusObject")
                                                                                        .setText(
                                                                                                com.zespri.awct.util.I18NHelper
                                                                                                        .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_REJECTED"));
                                                                                oController.byId("statusObject").setState(
                                                                                        sap.ui.core.ValueState.Error);
                                                                            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Expired) {
                                                                                oController
                                                                                        .byId("statusObject")
                                                                                        .setText(
                                                                                                com.zespri.awct.util.I18NHelper
                                                                                                        .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_EXPIRED"));
                                                                                oController.byId("statusObject").setState(
                                                                                        sap.ui.core.ValueState.Warning);
                                                                            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted) {
                                                                                oController
                                                                                        .byId("statusObject")
                                                                                        .setText(
                                                                                                com.zespri.awct.util.I18NHelper
                                                                                                        .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_PARTIALLY_ACCEPTED"));
                                                                                oController.byId("statusObject")
                                                                                        .setState(sap.ui.core.ValueState.None);
                                                                            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Cancelled) {
                                                                                oController
                                                                                        .byId("statusObject")
                                                                                        .setText(
                                                                                                com.zespri.awct.util.I18NHelper
                                                                                                        .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_CANCELLED"));
                                                                                oController.byId("statusObject")
                                                                                        .setState(sap.ui.core.ValueState.Error);
                                                                            }

                                                                            oController._setViewBusy(false);

                                                                            // Update status in the context
                                                                            oController._oTradeOpportuityContext.getObject().Status = sStatus;

                                                                            // Update footer buttons
                                                                            oController._updateFooterButtonsVisibility();
                                                                        }, function(oError) {
                                                                            // Error
                                                                            com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                                                        });

                                                    },
                                                    error : function(oError) {
                                                        // Error

                                                        oController._setViewBusy(false);
                                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                                    }
                                                });
                            } else {
                                // For Open Trades, display a dialog for selection of supplier
                                if (!this._oOpenTradeAcceptDialog) {
                                    this._oOpenTradeAcceptDialog = new sap.ui.xmlfragment("openTradeAcceptDialog",
                                            "com.zespri.awct.collab.fragment.TradeOpportunitiesOpenTradeAcceptDialog", this);
                                    this.getView().addDependent(this._oOpenTradeAcceptDialog);
                                }
                                this._oOpenTradeAcceptDialog.setModel(this.getView().getModel());

                                sap.ui.core.Fragment.byId("openTradeAcceptDialog", "tradeQuantityInput").setValue("");
                                sap.ui.core.Fragment.byId("openTradeAcceptDialog", "tradeQuantityInput").setValueState(sap.ui.core.ValueState.None);

                                // Open the dialog
                                this._oOpenTradeAcceptDialog.open();

                                this._oOpenTradeAcceptDialog.setBusy(true);
                                com.zespri.awct.util.ModelHelper.getJSONModelForRead("/GetSuppliersForOpenTrade", {
                                    urlParameters : {
                                        "TradeID" : "'" + oController.getView().getBindingContext().getProperty("TradeID") + "'"

                                    }
                                }, function(oModel) {

                                    var oSupplierListSelect = sap.ui.core.Fragment.byId("openTradeAcceptDialog", "tradeSupplierSelect");

                                    oSupplierListSelect.setModel(oModel);
                                    oSupplierListSelect.bindItems({
                                        path : "/results",
                                        template : oSupplierListSelect.getBindingInfo("items") ? oSupplierListSelect.getBindingInfo("items").template
                                                : oSupplierListSelect.getItems()[0].clone()
                                    });

                                    oController._oOpenTradeAcceptDialog.setBusy(false);

                                }, function(oError) {
                                    // Error

                                    oController._oOpenTradeAcceptDialog.setBusy(false);
                                    oController._oOpenTradeAcceptDialog.close();
                                    com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                });

                            }
                        },

                        /**
                         * This method is called when the Reject button in the trade opportunities details view is clicked.
                         * 
                         * On click of this button the inbound trade opportunity is rejected by the supplier.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TradeOpportunitiesDetails
                         */
                        handleRejectPress : function() {
                            var oController = this;
                            var sTradeID = this._oTradeOpportuityContext.getProperty("TradeID");
                            this._setViewBusy(true);
                            // Function import for reject of Inbound trades
                            sap.ui.getCore().getRootComponent().getModel().read(
                                    "/ApproveTrade",
                                    {
                                        urlParameters : {
                                            "TradeUpdateTime" : com.zespri.awct.util.CommonFormatHelper
                                                    .formatJSDateToEDMDateTimeString(this._oTradeOpportuityContext.getProperty("TradeUpdateTime")),
                                            "TargetSupplier" : "''",
                                            "Status" : "'" + this._ApproveStatus.Reject + "'",
                                            "TradeID" : "'" + sTradeID + "'",
                                            "AcceptedQuantity" : 0

                                        },
                                        success : function() {
                                            // Success
                                            var sSuccessText = com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_TRADEOPPORTUNITY_REJECT_DELIVERY_SUCCESS");
                                            com.zespri.awct.util.NotificationHelper.showSuccessToast(sSuccessText);
                                            // Trigger the read
                                            com.zespri.awct.util.ModelHelper.getJSONModelForRead(oController._sContextPath, {
                                                urlParameters : {
                                                    "$select" : 'Status'
                                                }
                                            }, jQuery.proxy(oController._updateTradeStatus, oController), function(oError) {
                                                // Error
                                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                            });
                                        },
                                        error : function(oError) {
                                            // Error

                                            oController._setViewBusy(false);
                                            com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                        }
                                    });
                        },

                        /**
                         * This is a private method that updates the trade status.
                         * 
                         * @private
                         * @param {Object}
                         *            oJSONModel JSON model with status
                         * 
                         * @memberOf com.zespri.awct.collab.view.TradeOpportunitiesDetails
                         */
                        _updateTradeStatus : function(oJSONModel) {
                            var sStatus = oJSONModel.getProperty("/result").Status;
                            if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Initiated) {
                                this.byId("statusObject").setText(
                                        com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_INITIATED"));
                                this.byId("statusObject").setState(sap.ui.core.ValueState.None);
                            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Accepted) {
                                this.byId("statusObject").setText(
                                        com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_ACCEPTED"));
                                this.byId("statusObject").setState(sap.ui.core.ValueState.Success);
                            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Rejected) {
                                this.byId("statusObject").setText(
                                        com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_REJECTED"));
                                this.byId("statusObject").setState(sap.ui.core.ValueState.Error);
                            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Expired) {
                                this.byId("statusObject").setText(
                                        com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_EXPIRED"));
                                this.byId("statusObject").setState(sap.ui.core.ValueState.Warning);
                            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted) {
                                this.byId("statusObject").setText(
                                        com.zespri.awct.util.I18NHelper
                                                .getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_PARTIALLY_ACCEPTED"));
                                this.byId("statusObject").setState(sap.ui.core.ValueState.None);
                            } else if (sStatus === com.zespri.awct.util.Enums.TradeStatus.Cancelled) {
                                this.byId("statusObject").setText(
                                        com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_COLUMN_STATUSTEXT_CANCELLED"));
                                this.byId("statusObject").setState(sap.ui.core.ValueState.Error);
                            }

                            this._setViewBusy(false);

                            // Update the status in the context
                            this._oTradeOpportuityContext.getObject().Status = sStatus;

                            // Update footer buttons
                            this._updateFooterButtonsVisibility();
                        },

                        /**
                         * This method is called when the Accept button in the accept trade dialog is clicked for open trades.
                         * 
                         * On click of this button the open trade opportunity is accepted by the supplier.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TradeOpportunitiesDetails
                         */
                        handleAcceptContinuePress : function() {
                            var oController = this;
                            // Get data to pass Parameters for Accept fnImport
                            var sTradeID = this._oTradeOpportuityContext.getProperty("TradeID");
                            var sTradeSupplier = sap.ui.core.Fragment.byId("openTradeAcceptDialog", "tradeSupplierSelect").getSelectedKey();
                            // Quantity
                            var sTradeQuantity = sap.ui.core.Fragment.byId("openTradeAcceptDialog", "tradeQuantityInput").getValue();

                            // If quantity is not a positive integer or greater than pending quantity, throw an error
                            if (isNaN(sTradeQuantity) || (Math.round(sTradeQuantity) !== parseFloat(sTradeQuantity)) ||
                                    (parseInt(sTradeQuantity, 10) <= 0) ||
                                    (parseInt(sTradeQuantity, 10) > parseInt(this._oTradeOpportuityContext.getProperty("PendingQuantity"), 10))) {
                                // Error
                                sap.ui.core.Fragment.byId("openTradeAcceptDialog", "tradeQuantityInput").setValueState(sap.ui.core.ValueState.Error);
                                sap.ui.core.Fragment.byId("openTradeAcceptDialog", "tradeQuantityInput").setValueStateText(
                                        com.zespri.awct.util.I18NHelper
                                                .getText("TXT_COLLABORATION_TRADEOPPORTUNITY_ACCEPTDIALOG_QUANTITY_ERROR_VALUESTATETEXT"));
                            } else {
                                sap.ui.core.Fragment.byId("openTradeAcceptDialog", "tradeQuantityInput").setValueState(sap.ui.core.ValueState.None);
                                // Set the dialog busy until data is loaded
                                this._oOpenTradeAcceptDialog.setBusy(true);
                                this._setViewBusy(true);

                                // Call the Accept function import to accept the open trade.
                                sap.ui.getCore().getRootComponent().getModel()
                                        .read(
                                                "/ApproveTrade",
                                                {
                                                    urlParameters : {
                                                        "TradeUpdateTime" : com.zespri.awct.util.CommonFormatHelper
                                                                .formatJSDateToEDMDateTimeString(this._oTradeOpportuityContext
                                                                        .getProperty("TradeUpdateTime")),
                                                        "TargetSupplier" : "'" + sTradeSupplier + "'",
                                                        "Status" : "'" + this._ApproveStatus.Accept + "'",
                                                        "TradeID" : "'" + sTradeID + "'",
                                                        "AcceptedQuantity" : parseInt(sTradeQuantity, 10)
                                                    },
                                                    success : function() {
                                                        // Success

                                                        oController._oOpenTradeAcceptDialog.close();
                                                        var sSuccessText = com.zespri.awct.util.I18NHelper
                                                                .getText("TXT_COLLABORATION_TRADEOPPORTUNITY_ACCEPT_DELIVERY_SUCCESS");
                                                        com.zespri.awct.util.NotificationHelper.showSuccessToast(sSuccessText);
                                                        // Trigger the read
                                                        com.zespri.awct.util.ModelHelper.getJSONModelForRead(oController._sContextPath, {
                                                            urlParameters : {
                                                                "$select" : 'Status'
                                                            }
                                                        }, jQuery.proxy(oController._updateOpenTradeStatus, oController), function(oError) {
                                                            // Error
                                                            com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                                        });
                                                    },
                                                    error : function(oError) {
                                                        // Error

                                                        oController._oOpenTradeAcceptDialog.setBusy(false);
                                                        oController._setViewBusy(false);
                                                        com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                                    }
                                                });
                            }
                        },

                        /**
                         * 
                         * This method is called when an open trade is successfully accepted
                         * 
                         * @private
                         * @param JSONModel
                         *            JSON model
                         * 
                         * @memberOf com.zespri.awct.collab.view.TradeOpportunitiesDetails
                         * 
                         */
                        _updateOpenTradeStatus : function(JSONModel) {
                            // Update trade status
                            this._updateTradeStatus(JSONModel);
                            // Navigate back to view trades page
                            this.getRouter().navBack();
                        },

                        /**
                         * This method is called when the Cancel button in the accept dialog is clicked.
                         * 
                         * On click of this button the dialog closes.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TradeOpportunitiesDetails
                         */
                        handleAcceptCancelPress : function() {
                            this._oOpenTradeAcceptDialog.close();
                        },

                        /**
                         * This is a private method for updating footer buttons visibility based on the status and type
                         * 
                         * @private
                         * @memberOf com.zespri.awct.collab.view.TradeOpportunitiesDetails
                         * 
                         */
                        _updateFooterButtonsVisibility : function() {

                            // Show the footer
                            var oPage = this.byId("pageTradeOpportunitiesDetails");
                            if (!oPage.getShowFooter()) {
                                oPage.setShowFooter(true);
                            }

                            var oAcceptButton = this.getView().byId("tradeAcceptButton");
                            var oRejectButton = this.getView().byId("tradeRejectButton");
                            var oCancelButton = this.getView().byId("tradeDetailCancelButton");

                            // Type
                            var sType = this._oTradeOpportuityContext.getProperty("Type");

                            // Status
                            var sStatus = this._oTradeOpportuityContext.getProperty("Status");

                            // Accept button should be visible for Inbound and Open trade types and if status is initiated and partially accepted.
                            if ((sType === com.zespri.awct.util.Enums.TradeType.Inbound || sType === com.zespri.awct.util.Enums.TradeType.Open) &&
                                    (sStatus === com.zespri.awct.util.Enums.TradeStatus.Initiated || sStatus === com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted) &&
                                    (com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                            com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                            com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP))) {
                                oAcceptButton.setVisible(true);
                            } else {
                                oAcceptButton.setVisible(false);
                            }

                            // Reject button should be visible for Inbound trade typesand if status is initiated.
                            if (sType === com.zespri.awct.util.Enums.TradeType.Inbound &&
                                    sStatus === com.zespri.awct.util.Enums.TradeStatus.Initiated &&
                                    (com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                            com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                            com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP))) {
                                oRejectButton.setVisible(true);
                            } else {
                                oRejectButton.setVisible(false);
                            }

                            // Cancel Button should be visible for Outbound Trade Type and if status is initiated or Partially Accepted.
                            if (sType === com.zespri.awct.util.Enums.TradeType.Outbound &&
                                    (sStatus === com.zespri.awct.util.Enums.TradeStatus.Initiated || sStatus === com.zespri.awct.util.Enums.TradeStatus.PartiallyAccepted) &&
                                    (com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                                            com.zespri.awct.util.Enums.AuthorizationObject.Collaboration,
                                            com.zespri.awct.util.Enums.AuthorizationFunctions.ZSUP))) {
                                oCancelButton.setVisible(true);
                            } else {
                                oCancelButton.setVisible(false);
                            }

                            // If all footer buttons are not visible, hide the footer.
                            if (!oAcceptButton.getVisible() && !oRejectButton.getVisible() && !oCancelButton.getVisible()) {
                                oPage.setShowFooter(false);
                            }

                        },

                        /**
                         * Formatter function for the column 'Value' in 'BatchCharacteristics' table
                         * 
                         * @memberOf com.zespri.awct.collab.view.TradeOpportunitiesDetails
                         * @param {Object}
                         *            oJsonBatchCharacteristicsValue contains the Batch Characteristics Values
                         * @returns {String} returns the the Batch Characteristic Values separated by comma
                         */
                        formatBatchCharacteristicsValuesText : function(oJsonBatchCharacteristicsValue) {

                            // Function to return the batch characteristics values from the oJsonBatchCharacteristicsValue array
                            // oBatchCharValue - Contains the value of each array element
                            var fnBatchCharacteristicsValueReturn = function(oBatchCharValue) {
                                return oBatchCharValue.Value;
                            };
                            if (oJsonBatchCharacteristicsValue) {
                                // Get all the Batch Characteristics Value and seperating each with ', '
                                return oJsonBatchCharacteristicsValue.results.map(fnBatchCharacteristicsValueReturn).join(", ");
                            }

                        },
                        /**
                         * Formatter function for the column 'Include/Exclude' in 'BatchCharacteristics' table
                         * 
                         * @memberOf com.zespri.awct.collab.view.TradeOpportunitiesDetails
                         * @param {String}
                         *            sOperation String of Operations
                         * @returns {String} if sOperation = "E" then 'Exclude' , "I" = 'Include'
                         */
                        formatExcludeIncludeText : function(sOperation) {
                            // Checking whether the operations is include or exclude

                            if (sOperation === com.zespri.awct.util.Enums.ViewBCOperation.Exclude) {
                                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_BATCHCHARACTERISTICS_EXCLUDE");

                            } else if (sOperation === com.zespri.awct.util.Enums.ViewBCOperation.Include) {
                                return com.zespri.awct.util.I18NHelper.getText("TXT_COLLABORATION_TRADEOPPORTUNITIES_BATCHCHARACTERISTICS_INCLUDE");
                            } else {
                                return "";
                            }
                        },
                        /**
                         * This method will be called once cancel button is pressed in the footer bar.
                         * 
                         * @memberOf com.zespri.awct.collab.view.TradeOpportunitiesDetails
                         */
                        handleCancelPress : function() {
                            var oController = this;
                            var sTradeID = this._oTradeOpportuityContext.getProperty("TradeID");
                            oController._setViewBusy(true);

                            this.getView().getModel().read(
                                    "/CancelTrade",
                                    {
                                        urlParameters : {
                                            "TradeID" : "'" + sTradeID + "'",
                                            "TradeUpdateTime" : com.zespri.awct.util.CommonFormatHelper
                                                    .formatJSDateToEDMDateTimeString(this._oTradeOpportuityContext.getProperty("TradeUpdateTime"))
                                        },
                                        success : function() {
                                            // Success
                                            var sSuccessText = com.zespri.awct.util.I18NHelper
                                                    .getText("TXT_COLLABORATION_TRADEOPPORTUNITY_CANCEL_DELIVERY_SUCCESS");
                                            com.zespri.awct.util.NotificationHelper.showSuccessToast(sSuccessText);

                                            // Trigger the read
                                            com.zespri.awct.util.ModelHelper.getJSONModelForRead(oController._sContextPath, {
                                                urlParameters : {
                                                    "$select" : 'Status'
                                                }
                                            }, jQuery.proxy(oController._updateTradeStatus, oController), function(oError) {
                                                // Error
                                                com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                                // Release the Busy State
                                                oController._setViewBusy(false);
                                            });
                                        },
                                        error : function(oError) {
                                            // Error
                                            com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                                            oController._setViewBusy(false);
                                        }
                                    });
                        }

                    });
})();
