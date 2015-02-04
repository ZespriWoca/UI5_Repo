(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.control.SharedContainerLink");
    jQuery.sap.require("com.zespri.awct.util.NotificationHelper");

    /**
     * @classdesc This custom control extends from sap.ui.core.Control. It will give a popover window for the containers which are having shared suppliers. If
     * the container is not shared then a simple <i>Text</i> field is rendered otherwise a <i>Link</i> is rendered with a dashed line. On click of
     * the Link a popover with the list of shared supplier list is opened.
     * 
     * <li> New properties introduced </li>
     * <ul>
     * <li>text : string (default: "") What text to be displayed in the control bar.</li>
     * </ul>
     * 
     * @class
     * @name com.zespri.awct.control.SharedContainerLink
     * @extends sap.ui.core.Control
     */
    sap.ui.core.Control.extend("com.zespri.awct.control.SharedContainerLink", {
        // Private variable for Shared Container Popover
        _oPopover : undefined,
        // metadata for the custom control
        metadata : {
            properties : {
                "text" : {
                    type : "string",
                    defaultValue : ""
                }
            }

        },

        /**
         * Event triggered when OK button in popover is pressed. This function is to close the popover on 'OK' button press
         * 
         * @memberOf com.zespri.awct.control.SharedContainerLink
         */
        handlePopoverOKPress : function() {
            this._oPopover.close();
        },
        /**
         * function to create the popover with 2 labels as contents
         * 
         * @memberOf com.zespri.awct.control.SharedContainerLink
         * @param {sap.ui.core.Control}
         *            oControl oControl an object representation of the control that should be rendered
         */

        createPopover : function() {
            // Creating the Popover with a footer and a content

            this._oPopover = new sap.m.Popover({
                placement : sap.m.PlacementType.Vertical,
                contentWidth : "250px",
                title : "{i18n>TXT_SHARED_CONTAINER_LINK_POPOVER_TITLE}",
                footer : new sap.m.Bar({
                    contentMiddle : [new sap.m.Button({
                        text : '{i18n>TXT_GENERIC_OK}',
                        width : "100%",
                        press : [this.handlePopoverOKPress, this]
                    })]
                }),
                // Content for the popovers
                content : [new sap.m.Label({
                    text : "{i18n>TXT_SHARED_CONTAINER_LINK_POPOVER_LABEL_CONTENT}"
                }), new sap.m.Label({
                    design : "Bold"
                })]
            }).addStyleClass("zAwctPopoverPadding");
            // Setting the i18n Model for the popover
            this._oPopover.setModel(this.getModel("i18n"), "i18n");
        },
        /**
         * Event Handler for 'press' event for Link in renderer. This method is called when a container with shared container is pressed. This method
         * creates a popover and binds the table row context with the popover
         * 
         * @memberOf com.zespri.awct.control.SharedContainerLink
         * @param {sap.ui.base.Event}
         *            oEvent The event object
         */
        handleLinkPress : function(oEvent) {
            // Checks whether the popover exist or not if not existing then create the popover.
            var oController = this;
            if (!oController._oPopover) {
                // Function to create a popover
                oController.createPopover();
            }
            var oCurrentContext = oController.getBindingContext();
            var sDeliveryLineID = oCurrentContext.getProperty("DeliveryLineID");
            var sAllocationLineID = oCurrentContext.getProperty("AllocationID");
            // Opening the popover for the link
            oController._oPopover.openBy(oEvent.getSource());
            // Setting the busy state
            oController._oPopover.setBusy(true);
            // Read function import '/GetSharedSuppliers' which returns the supplier list
            oController.getModel().read(
                    "/GetSharedSuppliers",
                    {
                        urlParameters : {
                            "DeliveryLineID" : sDeliveryLineID,
                            "AllocationLineID" : sAllocationLineID
                        },
                        // On Success of the read. 'oResponse' contain the result of the function import.
                        success : function(oResponse) {
                            // oResponse.results contains result
                            if (oResponse.results.length) {
                                // Setting the Value to the label
                                oController._oPopover.getContent()[1].setText(oResponse.results.map(function(oSharedSupplierValue) {
                                    return oSharedSupplierValue.Supplier;
                                }).join(", "));
                            }
                            // Reseting the busy state
                            oController._oPopover.setBusy(false);

                        },
                        // On error of the read
                        error : function(oError) {
                            // Toasting the error
                            com.zespri.awct.util.NotificationHelper.showErrorToast(com.zespri.awct.util.I18NHelper
                                    .getText("TXT_SHARED_CONTAINER_LINK_ERROR"));
                            oController._oPopover.close();
                            com.zespri.awct.util.NotificationHelper.handleErrorMessage(oError);
                        }
                    });
        },
        // Renderer method for the controller
        renderer : "com.zespri.awct.control.SharedContainerLinkRenderer"

    });
})();
