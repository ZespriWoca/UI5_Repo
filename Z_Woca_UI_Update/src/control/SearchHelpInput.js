(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.control.SearchHelpInput");

    /**
     * @classdesc he Input field is extended so that we can have a non-editable input field in the Search form for Collaboration When the enabled property of
     * the Standard Input control is set to false, the control is rendered as a label and not as a textbox. Hence a new Custom Control has been
     * created for it.
     * 
     * @class
     * @name com.zespri.awct.control.SearchHelpInput
     * @extends sap.m.Input
     */
    sap.m.Input.extend("com.zespri.awct.control.SearchHelpInput", /** @lends com.zespri.awct.control.SearchHelpInput */
    {
        renderer : "sap.m.InputRenderer",

        init : function() {
            this.setShowValueHelp(true);
            this.setShowSuggestion(true);
        },

        onAfterRendering : function() {
            sap.m.Input.prototype.onAfterRendering.apply(this);
            this.$().find(".sapMInputBaseInner").attr("readOnly", "readOnly");
        }
    });
})();