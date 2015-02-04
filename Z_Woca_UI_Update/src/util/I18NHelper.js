(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.util.I18NHelper");

    /**
     * @classdesc This helper class provides a <i>getText</i> helper method to read i18n text.
     * @class
     * @name com.zespri.awct.util.I18NHelper
     */
    com.zespri.awct.util.I18NHelper = {};

    /**
     * Returns I18N text for the provided text key. Placeholders in the text will be replaced by parameters passed to this method.
     * 
     * @param {String}
     *            sTextKey The text key to get I18N text for.
     * @param {Array}
     *            aParameters The array of parameters for the text key.
     * @return {String} The text corresponding to the supplied key and parameters.
     * @static
     * @memberOf com.zespri.awct.util.I18NHelper
     */
    com.zespri.awct.util.I18NHelper.getText = function(sTextKey, aParameters) {
        return sap.ui.getCore().getRootComponent().getModel("i18n").ResourceBundle.getText(sTextKey, aParameters);
    };
})();