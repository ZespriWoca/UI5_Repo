/*----------------------------------------------------------------------* 
 * Copyright  (c) 2014 SAP SE. All rights reserved	
 * Author       : SAP Custom Development 
 *----------------------------------------------------------------------*/ 
	!function(){"use strict";jQuery.sap.require({modName:"com.zespri.awct.core.Controller",type:"controller"}),com.zespri.awct.core.Controller.extend("com.zespri.awct.alloc.view.DeliveryWorkList",{onInit:function(){if(this._oSplitContainer=null,!this._oSplitContainer){this._oSplitContainer=new sap.ui.xmlfragment("com.zespri.awct.alloc.fragment.DeliveryWorkListSplitContainer",this),this.getView().addDependent(this._oSplitContainer);var a=this.byId("deliveryWorkList");a.addContent(this._oSplitContainer)}}})}();