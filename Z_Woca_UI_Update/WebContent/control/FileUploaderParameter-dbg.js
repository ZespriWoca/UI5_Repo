/*----------------------------------------------------------------------* 
 * Copyright  (c) 2014 SAP SE. All rights reserved	
 * Author       : SAP Custom Development 
 *----------------------------------------------------------------------*/ 
	(function() {
    jQuery.sap.declare("com.zespri.awct.control.FileUploaderParameter");
    jQuery.sap.require("sap.ui.core.Element");

    /**
     * @classdesc This class defines the parameters for the file upload control
     * @class
     * @name com.zespri.awct.control.FileUploader
     */
    sap.ui.core.Element.extend("com.zespri.awct.control.FileUploaderParameter", {
        metadata : {
            properties : {
                "name" : {
                    type : "string",
                    group : "Data",
                    defaultValue : null
                },
                "value" : {
                    type : "string",
                    group : "Data",
                    defaultValue : null
                }
            }
        }
    });
})();