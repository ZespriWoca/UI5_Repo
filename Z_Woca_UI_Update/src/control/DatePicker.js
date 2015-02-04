(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.control.DatePicker");
    jQuery.sap.require("sap.ui.commons.DatePicker");

    /**
     * @classdesc The DatePicker field is extended so that we can have a non-editable date picker field in the Search form, the control is rendered as a read
     * only. Hence a new Custom Control has been created for it.
     * @class 
     * @name com.zespri.awct.control.Datepicker
     * @extends sap.ui.commons.DatePicker
     */
    sap.ui.commons.DatePicker.extend("com.zespri.awct.control.DatePicker",
    /** @lends com.zespri.awct.control.Datepicker */
    {
        renderer : "sap.ui.commons.DatePickerRenderer",

        init : function() {
            sap.ui.commons.DatePicker.prototype.init.apply(this);
        },

        onAfterRendering : function() {
            sap.ui.commons.DatePicker.prototype.onAfterRendering.apply(this);
            // change the css property of the DatePicker input field to read-only. For mobile devices, this causes the date picker popup to not open.
            if (!sap.ui.Device.browser.mobile) {
                this.$().find(".sapUiTfInner").attr("readOnly", "readOnly");
            }
        }
    });
})();