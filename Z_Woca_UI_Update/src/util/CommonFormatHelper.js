(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.util.CommonFormatHelper");

    /**
     * @classdesc A helper class providing static methods for commonly used reusable formatters which are independent of the Locale. Locale dependent formatters
     * are present in the LocaleFormatHelper class. (@see {@link com.zespri.awct.util.LocaleFormatHelper})
     * @class
     * @name com.zespri.awct.util.CommonFormatHelper
     */
    com.zespri.awct.util.CommonFormatHelper = {};

    /**
     * This method is used to format a quantity (float) as a whole number (integer).
     * 
     * @param {float}
     *            fQuantity Quantity value as a float value
     * @returns {Integer} Quantity value as an integer
     * @static
     * @memberOf com.zespri.awct.util.CommonFormatHelper
     */
    com.zespri.awct.util.CommonFormatHelper.formatQuantityAsInteger = function(fQuantity) {
        if (fQuantity) {
            var iQuantity = parseInt(fQuantity, 10);
            return iQuantity;
        } else {
            return "";
        }
    };

    /**
     * Formatter method for formatting quantity with a comma and 2 decimal places
     * 
     * @param {Float}
     *            fQuantity Quantity
     * @returns {Float} Formatted Quantity
     * 
     * @memberOf com.zespri.awct.util.CommonFormatHelper
     */
    com.zespri.awct.util.CommonFormatHelper.formatQuantityWithDecimals = function(fQuantity) {
        if (fQuantity !== null && fQuantity !== undefined) {
            var oFormat = sap.ui.core.format.NumberFormat.getIntegerInstance({
                maxFractionDigits : 2,
                minFractionDigits : 2,
                groupingEnabled : true
            }, new sap.ui.core.Locale("en-NZ"));

            return oFormat.format(fQuantity);
        } else {
            return "";
        }
    };

    /**
     * Formatter for username. Currently returns the "FirstName LastName" format. If needed in the future, it can be enhanced to format based on, e.g,
     * the user's preferences.
     * 
     * @param {String}
     *            sFirstName The first name
     * @param {String}
     *            sLastName The last name
     */
    com.zespri.awct.util.CommonFormatHelper.formatUserName = function(sFirstName, sLastName) {
        // Check for null and undefined first, because otherwise concatenation will use "null" and "undefined" as strings!
        if (sFirstName == null) {
            sFirstName = "";
        }

        if (sLastName == null) {
            sLastName = "";
        }

        return sFirstName + " " + sLastName;
    };

    /**
     * This method is used to format a Javascript date object into YYYY-MM-DDThh:mm:ss format string.
     * 
     * @param {Object}
     *            oDateValue the date object
     * @param {Boolean}
     *            bWithoutDateTimeSyntax If true, the datetime' ' wrapping is not used.
     * @returns {String} String in YYYY-MM-DDThh:mm:ss format
     * @static
     * @memberOf com.zespri.awct.util.CommonFormatHelper
     */
    com.zespri.awct.util.CommonFormatHelper.formatJSDateToEDMDateTimeString = function(oDateValue, bWithoutDateTimeSyntax) {
        if (oDateValue) {
            // Adjust for timezone before creating timestamp, so that our final timestamp represents GMT.
            var oDate = new Date(oDateValue.valueOf());
            var iTimezoneOffset = oDate.getTimezoneOffset();
            oDate.setMinutes(oDate.getMinutes() + iTimezoneOffset);

            // Get year
            var sYear = oDate.getFullYear();

            // Get month
            var iMonth = oDate.getMonth() + 1;
            var sMonth = iMonth > 9 ? iMonth : "0" + iMonth;

            // Get date
            var iDate = oDate.getDate();
            var sDate = iDate > 9 ? iDate : "0" + iDate;

            // Get hours
            var iHours = oDate.getHours();
            var sHours = iHours > 9 ? iHours : "0" + iHours;

            // Get minutes
            var iMinutes = oDate.getMinutes();
            var sMinutes = iMinutes > 9 ? iMinutes : "0" + iMinutes;

            // Get seconds
            var iSeconds = oDate.getSeconds();
            var sSeconds = iSeconds > 9 ? iSeconds : "0" + iSeconds;

            // Return formatted string
            var sResult = sYear + "-" + sMonth + "-" + sDate + "T" + sHours + ":" + sMinutes + ":" + sSeconds;
            if (bWithoutDateTimeSyntax) {
                return sResult;
            } else {
                return "datetime'" + sResult + "'";
            }

        } else {
            return "";
        }
    };
})();
