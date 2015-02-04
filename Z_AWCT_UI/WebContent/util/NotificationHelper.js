(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.util.NotificationHelper");
    jQuery.sap.require("com.zespri.awct.util.Constants");
    jQuery.sap.require("com.zespri.awct.util.Enums");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("sap.m.MessageToast");

    /**
     * @classdesc This helper class provides functions that are used throughout the application for displaying messages to the user.
     * @class
     * @name com.zespri.awct.util.NotificationHelper
     */
    com.zespri.awct.util.NotificationHelper = {

        /**
         * Displays an error message to the user as a toast.
         * 
         * @param {String}
         *            sText The message to be shown as an error.
         * @static
         * @memberOf com.zespri.awct.util.NotificationHelper
         */
        showErrorToast : function(sText) {
            var err = new Error();
            sap.m.MessageToast.show(sText);
            jQuery.sap.log.error("Error shown to user : " + sText + "\n -- STACK TRACE --" + err.stack);
        },

        /**
         * Display an error message to the user as a Dialog.
         * 
         * @param {String}
         *            sText The message to be shown as an error.
         * @param {Function}
         *            fnDialogClosed (Optional) The callback to be invoked once the user closes the error dialog.
         * @static
         * @memberOf com.zespri.awct.util.NotificationHelper
         */
        showErrorDialog : function(sText, fnDialogClosed) {
            var oUIError = {};
            oUIError.message = sText;
            oUIError.type = com.zespri.awct.util.Enums.NotificationType.None;

            this._showDialog(oUIError, fnDialogClosed);
        },

        /**
         * Displays a success message to the user as a toast.
         * 
         * @param {String}
         *            sText The text to be shown as a toast.
         * @static
         * @memberOf com.zespri.awct.util.NotificationHelper
         */
        showSuccessToast : function(sText) {
            sap.m.MessageToast.show(sText);
            jQuery.sap.log.info("Success message shown to user : " + sText);
        },

        /**
         * Show a 'Confirmation' dialog to the user with a message, a 'Yes' button and a 'Cancel' button. Based on which button the user presses, one
         * of the callbacks passed as parameter is invoked
         * 
         * @param {String}
         *            sText The text to be shown in the dialog
         * @param {Function}
         *            fnUserConfirmed This callback is invoked if the user presses the 'Yes' button
         * @param {Function}
         *            fnUserCancelled This callback is invoked if the user presses the 'Cancel' button
         * @static
         * @memberOf com.zespri.awct.util.NotificationHelper
         */
        showConfirmDialog : function(sText, fnUserConfirmed, fnUserCancelled) {
            // Do what when the user clicks on 'Yes'?
            var fnHandleDialogYes = function() {
                oDialog.close();
                if (fnUserConfirmed && (typeof fnUserConfirmed === "function")) {
                    fnUserConfirmed();
                }
            };

            // Do what when the user clicks on 'Cancel'?
            var fnHandleDialogCancel = function() {
                oDialog.close();
                if (fnUserCancelled && (typeof fnUserCancelled === "function")) {
                    fnUserCancelled();
                }
            };

            // Create and show a dialog instance
            var oDialog = new sap.m.Dialog({
                title : com.zespri.awct.util.I18NHelper.getText("TXT_SHELL_CONFIRM_DIALOG_TITLE"),
                type : sap.m.DialogType.Message,
                icon : "sap-icon://error",
                content : new sap.m.Text({
                    text : sText
                }),
                beginButton : new sap.m.Button({
                    text : com.zespri.awct.util.I18NHelper.getText("TXT_GENERIC_OK"),
                    press : [fnHandleDialogYes, this]
                }),
                endButton : new sap.m.Button({
                    text : com.zespri.awct.util.I18NHelper.getText("TXT_GENERIC_CANCEL"),
                    press : [fnHandleDialogCancel, this]
                })
            });

            // Show the dialog
            oDialog.open();
        },

        /**
         * This method is used to retrieve the CSRF token and return the same.
         * 
         * @param {object}
         *            oError - Standard error object returned by the ajax framework
         * @param {boolean}
         *            bDisplay - if true, the error dialog is displayed. Set to true by default
         * @returns {Boolean} true if an error message is displayed, else false
         * @static
         * @memberOf com.zespri.awct.util.NotificationHelper
         */
        handleErrorMessage : function(oError, fnDialogClosed, bDisplay) {

            if (bDisplay || null === null) {
                bDisplay = true;
            }

            // In case of Batch request , error response will be in array of error objects
            if (oError instanceof Array) {
                // Get the first error object (In batch request , if an error occurs then pending requests in a batch will be cancelled . So only one
                // error response object would come at a time)
                oError = oError[0];
            }

            if ((oError || null) !== null) {
                if ((oError.response || null) !== null) {
                    try {
                        var iStatus = parseInt(oError.response.statusCode, 10);
                        // For application errors, log to the error log and display a toast
                        // For other errors, display a toast and revert to the previous state
                        switch (iStatus) {
                            /*
                             * 400 : Bad Request - The request had bad syntax or was inherently impossible to be satisfied. 401 : Unauthorized .
                             * 403 : Forbidden - The request is for something forbidden. Authorization will not help. 202 : Batch Request
                             * success(Accepted) 500 : Business Exception (Internal Server Error)
                             */
                            case 202 :
                            case 400 :
                            case 401 :
                            case 403 :
                            case 500 :
                                var oUIError = this._transformErrorResponse(oError.response);
                                // If the UI error object is null then do not display the dialog
                                if (bDisplay && (oUIError || null !== null)) {
                                    this._showDialog(oUIError);
                                }
                                return true;
                            default :
                                // do nothing
                                break;
                        }

                    } catch (e) {
                        jQuery.sap.log.warning("Handle Error Message failed", e.message, "com.zespri.awct.util.MessageHandler.handleMessage");
                    }
                    return false;
                }
            }
        },

        /**
         * This method transforms the standard error response object to a UI Error object. This object would then be used for further processing.
         * 
         * @param {object}
         *            oErrorResponse - Standard HTTP response object returned by the ajax framework
         * @returns {object} returns the UI Error object
         * @static
         * @memberOf com.zespri.awct.util.NotificationHelper
         */
        _transformErrorResponse : function(oErrorResponse) {
            var oUIError = null;
            var oMessage = null;

            // try to parse the error response body. If it succeeds then proceed with the transformation
            try {
                oMessage = JSON.parse(oErrorResponse.body);
            } catch (e) {
                oMessage = null;
            }

            if (oMessage !== null) {
                oUIError = {
                    "type" : com.zespri.awct.util.Enums.NotificationType.None, // None corresponds to Notification
                    "message" : "",
                    "innerTable" : []
                };
                oUIError.message = oMessage.error.message.value;
                if ((oMessage.error.innererror.errordetails || null !== null) && (oMessage.error.innererror.errordetails.length > 0)) {
                    $.each(oMessage.error.innererror.errordetails, function(i, value) {
                        var oInnerError = {};
                        oInnerError.severity = value.severity;
                        oInnerError.message = value.message;
                        oUIError.innerTable.push(oInnerError);

                        // If oUIError type is "error" then do not update anything
                        if (oUIError.type !== com.zespri.awct.util.Enums.NotificationType.Error) {
                            if (value.severity === com.zespri.awct.util.Constants.C_SEVERITY_ERROR) {
                                oUIError.type = com.zespri.awct.util.Enums.NotificationType.Error;
                            } else if ((oUIError.type !== com.zespri.awct.util.Enums.NotificationType.Warning) &&
                                    (value.severity === com.zespri.awct.util.Constants.C_SEVERITY_WARNING)) {
                                oUIError.type = com.zespri.awct.util.Enums.NotificationType.Warning;
                            }
                        }
                    });
                }
            }

            return oUIError;
        },

        /**
         * This method transforms the standard error response object to a UI Error object. This object would then be used for further processing.
         * 
         * @private
         * @param {object}
         *            oUIError - UI Error object that is used for display
         * @static
         * @memberOf com.zespri.awct.util.NotificationHelper
         */
        _showDialog : function(oUIError, fnDialogClosed) {
            var sTitle = "";
            var sIcon = "";
            var oContent = new sap.m.Text();
            var oBtnClose = null;
            var eState = sap.ui.core.ValueState.None;

            // Decide if you want to show a toast or dialog. If no appropriate message then show generic toast
            if (oUIError.message.length <= 0) {
                // Show toast
                this.showErrorToast(com.zespri.awct.util.I18NHelper.getText("TXT_NOTIFICATION_GENERIC_ERROR"));
            } else {
                jQuery.sap.require("sap.m.Dialog");

                oContent.setText(oUIError.message);
                oBtnClose = new sap.m.Button({
                    text : com.zespri.awct.util.I18NHelper.getText("TXT_GENERIC_CLOSE"),
                    visible : true,
                    press : function(oEvent) {
                        var oDialog = oEvent.getSource().getParent();
                        oDialog.close();
                        oDialog.destroy();
                        if (fnDialogClosed && (typeof fnDialogClosed === "function")) {
                            fnDialogClosed();
                        }
                    }
                });

                switch (oUIError.type) {
                    case com.zespri.awct.util.Enums.NotificationType.Error :
                        sTitle = com.zespri.awct.util.I18NHelper.getText("TXT_NOTIFICATION_ERROR_HEAD");
                        eState = sap.ui.core.ValueState.Error;
                        sIcon = "sap-icon://error";
                        break;
                    case com.zespri.awct.util.Enums.NotificationType.Warning :
                        sTitle = com.zespri.awct.util.I18NHelper.getText("TXT_NOTIFICATION_WARNING_HEAD");
                        eState = sap.ui.core.ValueState.Warning;
                        sIcon = "sap-icon://warning2";
                        break;
                    default : // For NotificationType.Info, NotificationType.Success and NotificationType.None
                        sTitle = com.zespri.awct.util.I18NHelper.getText("TXT_NOTIFICATION_DEFAULT_HEAD");
                        eState = sap.ui.core.ValueState.None;
                        sIcon = "sap-icon://notification";
                        break;
                }

                var oDialog = new sap.m.Dialog({
                    state : eState,
                    title : sTitle,
                    type : sap.m.DialogType.Message,
                    icon : sIcon
                });

                oDialog.addContent(oContent);
                oDialog.setAggregation("endButton", oBtnClose);
                oDialog.open();
            }
        }
    };
})();
