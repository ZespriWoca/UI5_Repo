(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.util.Constants");

    /**
    @classdesc This class lists all the constants that are available in the AWCT application 
    @class
    @name com.zespri.awct.util.Constants
    */
    com.zespri.awct.util.Constants = {
        /* @constant {string} */
        "C_LOGOFF_URL"                  : "/sap/public/bc/icf/logoff",
        /* @constant {string} */
        "C_REDIRECT_URL_PARAM"          : "redirectURL=/sap/bc/ui5_ui5/sap/zawct_uia/index.html",
        /* jshint -W106 */
        /* @constant {boolean} */
        "C_IS_BROWSER_IE"               : (sap.ui.Device.browser.internet_explorer || false),
        /* jshint +W106 */
        /* @constant {string} */
        "C_SEVERITY_ERROR"              : "error",
        /* @constant {string} */
        "C_SEVERITY_WARNING"            : "warning",
        /* @constant {number} */
        "C_ODATA_MODEL_SIZE_LIMIT"      : 10000,
        /* @constant {string} */
        "C_XSRF_TOKEN"                  : "x-csrf-token"
    };
})();