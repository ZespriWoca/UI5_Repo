/*----------------------------------------------------------------------* 
 * Copyright  (c) 2014 SAP SE. All rights reserved	
 * Author       : SAP Custom Development 
 *----------------------------------------------------------------------*/ 
	(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.control.FacetFilterNumberInputList");
    jQuery.sap.require("com.zespri.awct.control.FacetFilterList");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");

    /**
     * @classdesc This control is to be used for lists within the com.zespri.awct.control.FacetFilter control that need to get integers as input from the user.
     * 
     * <p>
     * Usage
     * </p>
     * <ul>
     * <li>getSelectedItems() returns an array of exactly one object. This object has a getKey() method which returns the user input as an integer.
     * If there is no input provided, an empty array is returned.</li>
     * <li>To clear the user input, setSelectedKeys() must be invoked without any parameters.</li>
     * </ul>
     * 
     * <p>
     * Known Limitations
     * </p>
     * <ul>
     * <li>There is currently no API for 'setting' (e.g prefilling) a value in the Input control within this list. This is planned to be developed
     * when (and if) the need arises.</li>
     * </ul>
     * 
     * @name com.zespri.awct.control.FacetFilterNumberInputList
     * @class
     */
    com.zespri.awct.control.FacetFilterList.extend("com.zespri.awct.control.FacetFilterNumberInputList",
    /** @lends com.zespri.awct.control.FacetFilterNumberInputList */
    {
        metadata : {
            associations : {
                "numberInput" : {
                    type : "sap.m.Input"
                }
            }
        },
        renderer : "com.zespri.awct.control.FacetFilterNumberInputListRenderer",

        // The last known valid value of the input field
        _iLastValidValue : undefined,

        /**
         * Standard lifecycle init method. Here, a new instance of <i>sap.m.DateTimeInput</i> is created and associated with this control.
         * 
         * @memberOf com.zespri.awct.control.FacetFilterNumberInputList
         */
        init : function() {
            var oControl = this;
            com.zespri.awct.control.FacetFilterList.prototype.init.apply(this);
            this.setNumberInput(new sap.m.Input({
                change : [this._handleInputChange, oControl]
            }));
        },

        /**
         * This method overrides the standard method with the same name. This is done, so that this FacetFilterList control can be consumed in a
         * similar way to standard <i>sap.m.FacetFilterList</i>s. This is invoked without parameters, for resetting the control. When parameters are
         * passed, the value of the 'value' property of the object is set in the FacetFilterList control.
         * 
         * @memberOf com.zespri.awct.control.FacetFilterNumberInputList
         */
        setSelectedKeys : function(aKeys) {
            var oNumberInput = sap.ui.getCore().byId(this.getNumberInput());
            oNumberInput.setValueState(sap.ui.core.ValueState.None);
            if (!aKeys) {
                oNumberInput.setValue(null);
                this._iLastValidValue = undefined;
                
                // Set filterApplied = false, when facet filter is reseted
                this.setProperty("filterApplied", false);
            } else {
                oNumberInput.setValue(aKeys[0].value);
                this._iLastValidValue = aKeys[0].value;
                
                // Set filterApplied = true 
                this.setProperty("filterApplied", true);
            }
            oNumberInput.rerender();
        },

        /**
         * Event handler for press of the 'Clear' button.
         * 
         * @memberOf com.zespri.awct.control.FacetFilterNumberInputList
         * @private
         */
        _handleClearButtonPress : function() {
            this.setSelectedKeys();
            // Set FilterApplied = false , when number input field is cleared
            this.setProperty("filterApplied", false);
        },

        /**
         * Event handler for the 'change' event of the <i>sap.m.Input</i> control
         * 
         * @memberOf com.zespri.awct.control.FacetFilterNumberInputList
         */
        _handleInputChange : function() {
            // If the value is not a valid number, set 'warning' state and set the last known valid value. If there is no last known value, set to
            // empty.
            var oInput = sap.ui.getCore().byId(this.getNumberInput());
            var sInputValue = oInput.getValue();
            if (isNaN(sInputValue) || isNaN(parseInt(sInputValue, 10))) {
                // Set warning state and text
                var sWarningText = com.zespri.awct.util.I18NHelper.getText("TXT_FACET_FILTER_NUMBER_INPUT_WARNING_TEXT");
                oInput.setValueState(sap.ui.core.ValueState.Warning);
                oInput.setValueStateText(sWarningText);

                // Set last known valid value
                if (this._iLastValidValue !== undefined) {
                    oInput.setValue(this._iLastValidValue);
                } else {
                    oInput.setValue(null);
                    
                    // Set FilterApplied = false
                    this.setProperty("filterApplied", false);
                }
            } else {
                // Valid value!
                oInput.setValueState(sap.ui.core.ValueState.None);

                // Set new value as last known valid value
                this._iLastValidValue = parseInt(sInputValue, 10);

                // Inform the associated FacetFilter that the user changed something
                var oFacetFilter = sap.ui.getCore().byId(this.getAssociation("facetFilter"));
                oFacetFilter.setProperty("filtersModifiedAfterListOpen", true, true);
                // Set FilterApplied = true
                this.setProperty("filterApplied", true);
            }
        },

        /**
         * This method overrides the standard method with the same name. This has been done to keep the consumption of this control's APIs as similar
         * as possible to the standard <i>sap.m.FacetFilterList</i>
         * 
         * @return {Array} Returns an array with exactly one object with a 'getKey' method (this is used while consuming this control, to get the
         *         selected number)
         * @memberOf com.zespri.awct.control.FacetFilterNumberInputList
         */
        getSelectedItems : function() {
            // The standard control returns an array of list items, with getKey() being one of each list item's methods. Trying to 'fake' the same
            // thing here to make the control easy to consume.
            if (this._iLastValidValue >= 0) {
                return [{
                    _sKey : this._iLastValidValue,
                    getKey : function() {
                        return this._sKey;
                    }
                }];
            } else {
                return [];
            }
        }
    });

})();
