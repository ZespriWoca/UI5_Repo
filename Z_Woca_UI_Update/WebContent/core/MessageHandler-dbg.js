/*----------------------------------------------------------------------* 
 * Copyright  (c) 2014 SAP SE. All rights reserved	
 * Author       : SAP Custom Development 
 *----------------------------------------------------------------------*/ 
	(function() {
    "use strict";
    jQuery.sap.declare("com.zespri.awct.core.MessageHandler");
    jQuery.sap.require("com.zespri.awct.util.Constants");

    /**
     * The helper class provides utility methods for common functionality that are not classified among other helper classes
     * 
     * @name com.zespri.awct.util.CommonHelper
     */
    com.zespri.awct.util.MessageHandler = {};
    
    /**
     * This method is used to retrieve the CSRF token and return the same.
     * 
     * @returns {String} CSRF Token that needs to be sent along with the request header
     * @static
     * @memberOf com.zespri.awct.util.CommonHelper
     */
    com.zespri.awct.core.MessageHandler.handleMessage = function(oError, bDisplay) {
    	if((oError || null) !== null){
    		if((oError.response || null) !== null){
    			try{
    				var iStatus = parseInt(oError.response.statuscode);    				
    				//For application errors, log to the error log and display a toast
    				//For other errors, display a toast and revert to the previous state    				
    				switch (iStatus){
    				case 400:
    					break;
    				case 500:
    					break;
    				default:
    					//do nothing
    					break;
    				}
    				

    			} catch (e){
    				jQuery.sap.log.warning("Handle Error Message failed", e.message, "com.zespri.awct.core.MessageHandler.handleMessage");
    			}    			
    		}
    	}
    };
    
    com.zespri.awct.core.MessageHandler._transformErrorResponse = function(oError){
    	
    };    
    
    com.zespri.awct.core.MessageHandler._showDialog = function(oError){
    	//TODO: message mapping
    	var oMessage = JSON.parse(oError.response.body);
    	var oContent = new sap.m.Text();
    	oContent.setText(oMessage.error.message.value);
    	
    	
		//Todo : On close, get the function to revert the state to original
		var oDialog = new sap.m.Dialog({ 
			state : sap.ui.core.ValueState.Error, //TODO: use the severity for the same
			title : "Notification",		//TODO: i18n 
			type: sap.m.DialogType.Message, 
			icon: "sap-icon://notification" 
		}); 
		
		oDialog.addContent(oContent);
		oDialog.open();    				
		    
    };    
    

    /**
     * This method is used to retrieve the CSRF token and return the same.
     * 
     * @returns {String} CSRF Token that needs to be sent along with the request header
     * @static
     * @memberOf com.zespri.awct.util.CommonHelper
     */
    com.zespri.awct.core.MessageHandler.getCSRFToken = function() {

    };

})();