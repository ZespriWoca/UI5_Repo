(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.util.LocaleFormatHelper");
    jQuery.sap.require("sap.ui.core.format.DateFormat");
    jQuery.sap.require("sap.ui.core.format.NumberFormat");

    /**
     * @classdesc A helper class providing static methods for commonly used reusable locale-dependent formatters.
     * @class
     * @name com.zespri.awct.util.LocaleFormatHelper
     */
    com.zespri.awct.util.LocaleFormatHelper = {};

    /**
     * Formats a Javascript date object to an equivalent string that is suitable for displaying on the UI.
     * 
     * @param {Date}
     *            oDate The Javascript date object to be formatted
     * @return {String} The formatted string for the provided date object.
     * @static
     * @memberOf com.zespri.awct.util.LocaleFormatHelper
     */
    com.zespri.awct.util.LocaleFormatHelper.formatDateObject = function(oDate) {
        if (oDate) {
            var oDateInstance = sap.ui.core.format.DateFormat.getDateInstance(new sap.ui.core.Locale("en-NZ"));
            var sFormattedDate = oDateInstance.format(oDate, false);
            return sFormattedDate;
        } else {
            return "";
        }
    };

    /**
     * Formats a Javascript date object to an equivalent string (date + time) that is suitable for displaying on the UI.
     * 
     * @param {Date}
     *            oDate The Javascript date object to be formatted
     * @return {String} The formatted string for the provided date object.
     * @static
     * @memberOf com.zespri.awct.util.LocaleFormatHelper
     */
    com.zespri.awct.util.LocaleFormatHelper.formatDateTimeObject = function(oDate) {
        if (oDate) {
            var oDateTimeInstance = sap.ui.core.format.DateFormat.getDateTimeInstance(new sap.ui.core.Locale("en-NZ"));
            var sFormattedDate = oDateTimeInstance.format(oDate, false);
            return sFormattedDate;
        } else {
            return "";
        }
    };

    /**
     * Formats a quantity (float) value to a formatted string with grouping and without decimals.
     * 
     * @param {Float}
     *            fQuantity The quantity (float value) to be formatted
     * @return {String} The formatted string
     * @static
     * @memberOf com.zespri.awct.util.LocaleFormatHelper
     */
    com.zespri.awct.util.LocaleFormatHelper.formatQuantity = function(fQuantity) {
        if (fQuantity !== null && fQuantity !== undefined) {
            var oFormat = sap.ui.core.format.NumberFormat.getIntegerInstance({
                maxFractionDigits : 0,
                groupingEnabled : true
            }, new sap.ui.core.Locale("en-NZ"));

            return oFormat.format(fQuantity);
        } else {
            return "";
        }
    };

    /**
     * Formats an amount (float) value to a formatted string with currency, with grouping and with 2 decimals.
     * 
     * @param {Float}
     *            fAmount The amount (float) to be formatted
     * @param {String}
     *            sCurrencyCode The currency code
     * @return {String} The formatted string
     * @static
     * @memberOf com.zespri.awct.util.LocaleFormatHelper
     */
    com.zespri.awct.util.LocaleFormatHelper.formatAmount = function(fAmount, sCurrencyCode) {
        if (!fAmount) {
            fAmount = 0;
        }

        var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
            minFractionDigits : 2,
            maxFractionDigits : 2,
            groupingEnabled : true
        }, new sap.ui.core.Locale("en-NZ"));

        return oFormat.format(fAmount) + " " + sCurrencyCode;
    };
})();
