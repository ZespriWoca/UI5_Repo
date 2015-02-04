(function() {
    "use strict";

    jQuery.sap.require("com.zespri.awct.util.Enums");
    jQuery.sap.declare("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require({
        modName : "com.zespri.awct.core.Controller",
        type : "controller"
    });
    jQuery.sap.require("com.zespri.awct.control.FileUploaderParameter");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");

    /**
     * @classdesc This is the detail page for the each Delivery WorkList . Its shows the details of the selected WorkList item with shipment Details.
     * 
     * It includes the feature of uploading the CSV file which includes the allocation information of specific delivery and only applicable for "Not
     * Started" Status .
     * 
     * On clicking , Allocate button will navigate to the EditOrderAllocation for the selected Delivery Line (Applicable only for "Not Started " and
     * "InProgress" status)
     * 
     * @class
     * @name com.zespri.awct.alloc.view.DetailDeliveryWorkList
     */

    com.zespri.awct.core.Controller.extend("com.zespri.awct.alloc.view.DetailDeliveryWorkList",
            /** @lends com.zespri.awct.alloc.view.DetailDeliveryWorkList */
            {

                /**
                 * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View
                 * before it is displayed, to bind event handlers and do other one-time initialization.
                 * 
                 * @memberOf com.zespri.awct.alloc.view.DetailDeliveryWorkList
                 */
                onInit : function() {
                    /* START of instance member initialization */
                    this._oUploadDialog = null;
                    // Private Instance variable for user authorization
                    this._bUserAuthorized = false;
                    /* END of instance member initialization */

                    var oView = this.getView();
                    var oController = this;
                    // Check the incoming Route
                    this.getRouter().attachRoutePatternMatched(
                            function(oEvent) {
                                // If the route is for detail pattern , bind the context to this view
                                if (oEvent.getParameter("name") === "Allocation/DeliveryWorkList/Detail") {
                                    // Check the current user authorizations
                                    if (oController._bUserAuthorized) {
                                        oController._oContext = new sap.ui.model.Context(oView.getModel(), '/' +
                                                oEvent.getParameter("arguments").contextPath);

                                        // when the URL is entered directly , check whether the model is ready ?
                                        // If yes , update the footer bar
                                        if (oEvent.getParameter("arguments").customData) {
                                            if (oEvent.getParameter("arguments").customData.ItemClicked) {
                                                oView.setBindingContext(oController._oContext);
                                                // Update the footer bar
                                                oController._updateFooterBar();
                                            }
                                        } else {
                                            // Attach an event for request completion with the function defined above
                                            oView.getModel().attachRequestCompleted(oController._updateFooterOnRequestCompletion, oController);
                                        }
                                    }
                                }
                            }, this);

                },
                /**
                 * This method will be called before rendering the View.
                 * 
                 * @memberOf com.zespri.awct.alloc.view.DetailDeliveryWorkList
                 */
                onBeforeRendering : function() {
                    // Check User Authorizations
                    if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Display,
                            com.zespri.awct.util.Enums.AuthorizationObject.Allocation, com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)) {
                        if (this.byId("detailWorkListPage")) {
                            this.byId("detailWorkListPage").destroy();
                        }
                        this._bUserAuthorized = false;
                    } else {
                        this._bUserAuthorized = true;
                    }
                },
                /**
                 * Event Listener for request completion The function to cal l, when the event occurs. This function will be called once model is
                 * ready .
                 * 
                 * @memberOf com.zespri.awct.alloc.view.DetailDeliveryWorkList
                 * @private
                 * @param {sap.ui.base.Event}
                 *            oEvent The event object
                 */
                _updateFooterOnRequestCompletion : function(oEvent) {
                    // Do not listen for all model read completion, listen only for DeliveryHeaderSet request
                    // completion
                    // Get the URL from the parameters
                    var sUrl = oEvent.mParameters.url;
                    if (sUrl.indexOf("/DeliveryHeaderSet") !== -1) {
                        // If context is still not ready , return
                        if (!this._oContext.getProperty("DeliveryHeaderID")) {
                            return;
                        }
                        this.getView().setBindingContext(this._oContext);
                        // Update the footer bar
                        this._updateFooterBar();
                        // Detach the registered event for request completion
                        this.getView().getModel().detachRequestCompleted(this._updateFooterOnRequestCompletion, this);
                    }
                },
                /**
                 * This method is used to update the detail delivery page footer bar .
                 * 
                 * Allocate button is enabled only if the delivery has not yet been released.
                 * 
                 * Upload button is enabled only if the status of the delivery is "Not Started".
                 * 
                 * @memberOf com.zespri.awct.alloc.view.DetailDeliveryWorkList
                 * @private
                 */
                _updateFooterBar : function() {
                    if (!this._oContext.oModel) {
                        return;
                    }
                    var oUploadBtn = this.getView().byId("uploadButton");
                    // By Default , set upload button visibility to false and set it true based on below if conditions
                    oUploadBtn.setVisible(false);

                    // Check the current user authorizations
                    if (!com.zespri.awct.util.CommonHelper.isUserAuthorized(com.zespri.awct.util.Enums.AuthorizationMode.Maintain,
                            com.zespri.awct.util.Enums.AuthorizationObject.Allocation, com.zespri.awct.util.Enums.AuthorizationFunctions.ZESP)) {
                        return;
                    }

                    // Enable the Upload button, only if the status of the delivery is "Not Started" , "In Progress" and device is desktop
                    if ((this._oContext.getProperty("Status") === com.zespri.awct.util.Enums.DeliveryStatus.NotStarted || this._oContext
                            .getProperty("Status") === com.zespri.awct.util.Enums.DeliveryStatus.InProgress) &&
                            jQuery.device.is.desktop) {
                        oUploadBtn.setVisible(true);
                    }
                },

                /**
                 * 
                 * Handler for Upload Action Button . It opens a Dialog for uploading CSV files. This action is enabled only for "Not Started" Status.
                 * 
                 * @memberOf com.zespri.awct.alloc.view.DetailDeliveryWorkList
                 */
                handleUploadDialogOpen : function() {
                    // Get the context of the selected Delivery list item
                    var oContext = this.getView().getBindingContext();

                    // Lazy-instantiate dialog if needed
                    if (!this._oUploadDialog) {
                        this._oUploadDialog = new sap.ui.xmlfragment("fileUploadDialog",
                                "com.zespri.awct.alloc.fragment.DeliveryWorkListUploadDialog", this);
                        this.getView().addDependent(this._oUploadDialog);
                    }

                    // Show the inProgress warning message
                    // existing allocations will be overwritten
                    var oInprogressUploadLayout = sap.ui.core.Fragment.byId("fileUploadDialog", "inProgressUploadInfoLayout");
                    if (oContext.getProperty("Status") === "E0002") {
                        oInprogressUploadLayout.setVisible(true);
                    } else {
                        oInprogressUploadLayout.setVisible(false);
                    }

                    // Set the 'slug' header to pass delivery number
                    var oFileUploader = sap.ui.core.Fragment.byId("fileUploadDialog", "fileUploader");
                    var oSlugHeaderParameter = new com.zespri.awct.control.FileUploaderParameter({
                        name : "slug",
                        value : this.getView().getBindingContext().getProperty("DeliveryHeaderID")
                    });
                    oFileUploader.removeAllHeaderParameters();
                    oFileUploader.addHeaderParameter(oSlugHeaderParameter);

                    // Set the allowed file types
                    oFileUploader.setFileType(["csv"]);

                    // Open the dialog
                    this._allowStartUpload(false);
                    oFileUploader.setValue("").setValueState(sap.ui.core.ValueState.None);
                    this._oUploadDialog.open();
                },

                /**
                 * Triggers the upload of the file.
                 * 
                 * @memberOf com.zespri.awct.alloc.view.DetailDeliveryWorkList
                 */
                handleUploadPress : function() {
                    // Set dialog to busy
                    this._oUploadDialog.setBusy(true);

                    // Start the upload
                    var oFileUploader = sap.ui.core.Fragment.byId("fileUploadDialog", "fileUploader");
                    oFileUploader.upload();
                },

                /**
                 * Event handler for the 'typeMissmatch' event
                 * 
                 * @memberOf com.zespri.awct.alloc.view.DetailDeliveryWorkList
                 */
                handleFileUploaderTypeMissmatch : function() {
                    this._allowStartUpload(false);
                },

                /**
                 * Event handler for the 'fileAllowed' event
                 * 
                 * @memberOf com.zespri.awct.alloc.view.DetailDeliveryWorkList
                 */
                handleFileUploaderFileAllowed : function() {
                    this._allowStartUpload(true);
                },

                /**
                 * Event handler for the 'uploadComplete' event
                 * 
                 * @param {sap.ui.base.Event}
                 *            oEvent The event object
                 * @memberOf com.zespri.awct.alloc.view.DetailDeliveryWorkList
                 */
                handleFileUploaderUploadComplete : function(oEvent) {
                    // Check if 'status' is of pattern 2xx (ie. success). This is not available for IE9 (IFRAME technique)! For IE9, we need
                    // to get the status
                    // from the response body.
                    var sStatus = oEvent.getParameters().status || "";

                    var sSuccessMessage = com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_DELIVERYWORKLIST_DETAIL_UPLOAD_SUCCESS_TOAST");
                    var sErrorMessage = com.zespri.awct.util.I18NHelper.getText("TXT_ALLOCATION_DELIVERYWORKLIST_DETAIL_UPLOAD_ERROR_TOAST");

                    if (com.zespri.awct.util.Constants.C_IS_BROWSER_IE && sap.ui.Device.browser.version <= 9) {
                        // the status and message would be part of the response
                        var sResponse = oEvent.getParameters().response;
                        var oResponse = {};
                        try {
                            oResponse = JSON.parse(sResponse);
                            if (parseInt(oResponse.status, 10) === 200) {
                                com.zespri.awct.util.NotificationHelper.showSuccessToast(sSuccessMessage);

                                // Navigate to Edit Order Allocation
                                this._navToEditOrderAllocation();
                            } else {
                                $.each(oResponse.result, function(i, v) {
                                    if (v.type === 'E') {
                                        sErrorMessage += ' (' + v.message + ')';
                                    }
                                });
                                com.zespri.awct.util.NotificationHelper.showErrorDialog(sErrorMessage);
                            }
                        } catch (e) {
                            // Error
                            com.zespri.awct.util.NotificationHelper.showErrorDialog(sErrorMessage);
                        }
                    } else {
                        if (jQuery.sap.startsWith(sStatus.toString(), "2")) {
                            // Success
                            com.zespri.awct.util.NotificationHelper.showSuccessToast(sSuccessMessage);

                            // Navigate to Edit Order Allocation
                            this._navToEditOrderAllocation();
                        } else {
                            // Error
                            // Parse the Error Message
                            var sRawResponse = oEvent.getParameters().responseRaw;
                            var $xmlErrorMessage = $.parseXML(sRawResponse).getElementsByTagName("message")[0];
                            sErrorMessage += " (" + $xmlErrorMessage.textContent + ")";

                            com.zespri.awct.util.NotificationHelper.showErrorDialog(sErrorMessage);
                        }
                    }

                    // Remove busy irrespective of success/error
                    this._oUploadDialog.setBusy(false);
                },

                /**
                 * Triggers cancel and close the dialog.
                 * 
                 * @memberOf com.zespri.awct.alloc.view.DetailDeliveryWorkList
                 */
                handleUploadCancel : function() {
                    // Abort any uploads that are in-progress
                    var oFileUploader = sap.ui.core.Fragment.byId("fileUploadDialog", "fileUploader");
                    oFileUploader.abort();

                    // Close the dialog.
                    this._oUploadDialog.setBusy(false);
                    this._oUploadDialog.close();
                },

                /**
                 * Helper method to allow/disallow the user to start the upload
                 * 
                 * @param {Boolean}
                 *            bAllow Whether or not to allow upload
                 * @memberOf com.zespri.awct.alloc.view.DetailDeliveryWorkList
                 * @private
                 */
                _allowStartUpload : function(bAllow) {
                    var oFileUploader = sap.ui.core.Fragment.byId("fileUploadDialog", "fileUploader");
                    var oStartUploadButton = sap.ui.core.Fragment.byId("fileUploadDialog", "startUploadButton");
                    if (bAllow) {
                        oFileUploader.setValueState(sap.ui.core.ValueState.None);
                        oStartUploadButton.setEnabled(true);
                    } else {
                        oFileUploader.setValueState(sap.ui.core.ValueState.Error);
                        oStartUploadButton.setEnabled(false);
                    }
                },
                /**
                 * Event Handler for allocate button in the detail page footer bar . Used to navigate to EditOrderAllocation view with Context path
                 * 
                 * @memberOf com.zespri.awct.alloc.view.DetailDeliveryWorkList
                 */
                handleNavToEditAllocation : function() {
                    this._navToEditOrderAllocation();
                },

                /**
                 * Helper for navigating to the 'Edit Order Allocation' view for the current delivery.
                 * 
                 * @private
                 * @memberOf com.zespri.awct.alloc.view.DetailDeliveryWorkList
                 */
                _navToEditOrderAllocation : function() {
                    var oContext = this.getView().getBindingContext();

                    // Navigate to edit order allocation
                    this.getRouter().navTo("Allocation/EditOrderAllocation", {
                        contextPath : oContext.getPath().substr(1)
                    });
                }
            });

})();
