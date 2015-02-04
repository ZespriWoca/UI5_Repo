(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.control.FacetFilterCheckboxList");
    jQuery.sap.require("com.zespri.awct.control.FacetFilterList");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");

    /**
     * @classdesc This control is to be used for lists within the com.zespri.awct.control.FacetFilter control that need to get a boolean input (via a checkbox)
     * from the user.
     * 
     * <p>
     * Usage
     * </p>
     * <ul>
     * <li>getSelectedItems() returns an array of exactly one object. This object has a getKey() method which returns 'true' if the user selected the
     * checkbox. If the checkbox isn't selected, getSelectedItems() returns an empty array. </li>
     * <li>To clear the user input, setSelectedKeys() must be invoked without any parameters.</li>
     * </ul>
     * 
     * <p>
     * Known Limitations
     * </p>
     * <ul>
     * <li>There is currently no API for 'setting' (e.g prefilling) the Checkbox control within this list. This is planned to be developed when (and
     * if) the need arises.</li>
     * </ul>
     * @class 
     * @name com.zespri.awct.control.FacetFilterCheckboxList
     * @class
     */
    com.zespri.awct.control.FacetFilterList.extend("com.zespri.awct.control.FacetFilterCheckboxList",
    /** @lends com.zespri.awct.control.FacetFilterCheckboxList */
    {
        metadata : {
            associations : {
                "checkboxInput" : {
                    type : "sap.m.CheckBox"
                }
            }
        },

        renderer : "com.zespri.awct.control.FacetFilterCheckboxListRenderer",

        /**
         * Standard lifecycle init method. Here, a new instance of <i>sap.m.DateTimeInput</i> is created and associated with this control.
         * 
         * @memberOf com.zespri.awct.control.FacetFilterCheckboxList
         */
        init : function() {
            var oControl = this;
            this.setCheckboxInput(new sap.m.CheckBox({
                selected : true,
                select : [this._handleCheckBoxSelect, oControl]
            }));
            com.zespri.awct.control.FacetFilterList.prototype.init.apply(this);
        },

        /**
         * This method overrides the standard method with the same name. This is done, so that this FacetFilterList control can be consumed in a
         * similar way to standard <i>sap.m.FacetFilterList</i>s. This is invoked without parameters, for resetting the control. When parameters are
         * passed, the value of 'value' key of the first object is used to select / deselect the FacetFilterList control.
         * 
         * @memberOf com.zespri.awct.control.FacetFilterCheckboxList
         */
        setSelectedKeys : function(aKeys) {
            var oCheckbox = sap.ui.getCore().byId(this.getCheckboxInput());
            if (!aKeys) {
                oCheckbox.setSelected(true);
                
                // Set Filter Applied to false , check box is reset to initial state (selected = true)  
                this.setProperty("filterApplied", false);
            } else {
                oCheckbox.setSelected(aKeys[0].value);
                
                if(aKeys[0].value){
                    this.setProperty("filterApplied", false);
                }else{
                    this.setProperty("filterApplied", true);   
                }
            }
        },

        /**
         * Event handler for the 'select' event of the CheckBox. This is used to notify the associated FacetFilter control that the user has modified
         * it.
         * 
         * @memberOf com.zespri.awct.control.FacetFilterCheckboxList
         */
        _handleCheckBoxSelect : function(oEvent) {
            var oFacetFilter = sap.ui.getCore().byId(this.getAssociation("facetFilter"));
            oFacetFilter.setProperty("filtersModifiedAfterListOpen", true, true);

            // If check box is selected , make FilterApplied = false (by default, checkbox will be selected)
            // Else , filterApplied = true
            if (oEvent.getParameter("selected")) {
                this.setProperty("filterApplied", false);
            } else {
                this.setProperty("filterApplied", true);
            }
        },

        /**
         * Overriding the standard setter for property 'title' to set the 'text' property of the associated checkbox with the same value.
         * 
         * @param {String}
         *            sTitle The value to set for the 'title' property
         */
        setTitle : function(sTitle) {
            // Set the text of the associated checkbox
            var oCheckbox = sap.ui.getCore().byId(this.getCheckboxInput());
            oCheckbox.setText(sTitle);

            // Call the parent implementation
            com.zespri.awct.control.FacetFilterList.prototype.setTitle.apply(this, [sTitle]);
        },

        /**
         * This method overrides the standard method with the same name. This has been done to keep the consumption of this control's APIs as similar
         * as possible to the standard <i>sap.m.FacetFilterList</i>
         * 
         * @return {Array} Returns an array with exactly one object with a 'getKey' method (this is used while consuming this control, to get whether
         *         the user selected the checkbox)
         * 
         * @memberOf com.zespri.awct.control.FacetFilterCheckboxList
         */
        getSelectedItems : function() {
            // The standard control returns an array of list items, with getKey() being one of each list item's methods. Trying to 'fake' the same
            // thing here to make the control easy to consume.
            var oCheckbox = sap.ui.getCore().byId(this.getCheckboxInput());
            if (oCheckbox && oCheckbox.getSelected()) {
                return [{
                    _sKey : true,
                    getKey : function() {
                        return this._sKey;
                    }
                }];
            } else {
                return [{
                    _sKey : false,
                    getKey : function() {
                        return this._sKey;
                    }
                }];
            }
        }
    });
})();
