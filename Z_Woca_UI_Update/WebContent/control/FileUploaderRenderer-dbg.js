/*----------------------------------------------------------------------* 
 * Copyright  (c) 2014 SAP SE. All rights reserved	
 * Author       : SAP Custom Development 
 *----------------------------------------------------------------------*/ 
	(function() {
    jQuery.sap.declare("com.zespri.awct.control.FileUploaderRenderer");

    /**
     * @classdesc This class renders the file upload control that is displayed in the UI.
     * @class
     * @static
     * @name com.zespri.awct.control.FileUploaderRenderer
     */
    com.zespri.awct.control.FileUploaderRenderer = function() {
    };

    /**
     * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
     * 
     * @param {sap.ui.core.RenderManager}
     *            oRenderManager The RenderManager that can be used for writing to the render output buffer.
     * @param {sap.ui.core.Control}
     *            oControl An object representation of the control that should be rendered.
     */
    com.zespri.awct.control.FileUploaderRenderer.render = function(oRenderManager, oFileUploader) {

        var rm = oRenderManager;
        var accessibility = sap.ui.getCore().getConfiguration().getAccessibility();

        // return immediately if control is invisible
        if (!oFileUploader.getVisible()) {
            return;
        }

        rm.write('<div');
        rm.writeControlData(oFileUploader);
        rm.addClass("sapUiFup");
        rm.writeClasses();
        rm.write('>');

        // form
        rm.write('<form style="display:inline-block" encType="multipart/form-data" method="post"');
        rm.writeAttribute('id', oFileUploader.getId() + '-fu_form');
        if (com.zespri.awct.util.Constants.C_IS_BROWSER_IE && sap.ui.Device.browser.version <= 9) {
            rm.writeAttributeEscaped('action', oFileUploader.getUploadUrlX() + '?action=upload_csv');
        } else {
            rm.writeAttributeEscaped('action', oFileUploader.getUploadUrl());
        }
        rm.writeAttribute('target', oFileUploader.getId() + '-frame');
        rm.write('>');

        // the SAPUI5 TextField and Button
        rm.write('<div class="sapUiFupInp"');
        if (accessibility) {
            rm.writeAttribute("role", "textbox");
            rm.writeAttribute("aria-readonly", "true");
        }
        rm.write('>');

        // CUSTOM CODE START ---
        /*
         * Check if the browser is IE 8/9. If yes, revert to the file control directly. Else IE throws an 'Access Denied' error
         */
        if (com.zespri.awct.util.Constants.C_IS_BROWSER_IE && sap.ui.Device.browser.version <= 9) {
            // do nothing
        } else {
            // --- CUSTOM CODE END
            if (!oFileUploader.getButtonOnly()) {
                rm.write('<div class="sapUiFupGroup" border="0" cellPadding="0" cellSpacing="0"><div><div>');
            } else {
                rm.write('<div class="sapUiFupGroup" border="0" cellPadding="0" cellSpacing="0"><div><div style="display:none">');
            }

            rm.renderControl(oFileUploader.oFilePath);
            rm.write('</div><div>'); // -> per style margin
            rm.renderControl(oFileUploader.oBrowse);
            rm.write('</div></div></div>');
        }
        // hidden pure input type file (surrounded by a div which is responsible for giving the input the correct size)
        var sName = oFileUploader.getName() || oFileUploader.getId();

        // CUSTOM CODE START ---
        /*
         * Check if the browser is IE 8/9. If yes, display the file control rather than hide it.
         */
        if (com.zespri.awct.util.Constants.C_IS_BROWSER_IE && sap.ui.Device.browser.version <= 9) {
            rm.write('<div class="zAwctDisplayIEUpload">');
        } else {
            // --- CUSTOM CODE END
            rm.write('<div class="zAwctDisplayIEUpload" style="display:none">');
        }

        rm.write('<input type="hidden" id="slug"');
        rm.writeAttributeEscaped('name', 'slug');
        rm.writeAttributeEscaped('value', "");
        rm.write('>');

        rm.write('<input type="hidden" id="' + com.zespri.awct.util.Constants.C_XSRF_TOKEN + '"');
        rm.writeAttributeEscaped('name', com.zespri.awct.util.Constants.C_XSRF_TOKEN);
        rm.writeAttributeEscaped('value', com.zespri.awct.util.CommonHelper.getCSRFToken() || "");
        rm.write('>');

        /*
         * NOTE: It is important to follow the sequence - (1) File (2) slug and (3) XSRF Token Changing the sequence can lead to unintended
         * consequences
         */
        rm.write('<input type="hidden" name="_charset_">');

        rm.write('<input type="hidden" id="' + oFileUploader.getId() + '-fu_data"');
        rm.writeAttributeEscaped('name', sName + '-data');
        rm.writeAttributeEscaped('value', oFileUploader.getAdditionalData() || "");
        rm.write('>');
        jQuery.each(oFileUploader.getParameters(), function(iIndex, oParam) {
            rm.write('<input type="hidden" ');
            rm.writeAttributeEscaped('name', oParam.getName() || "");
            rm.writeAttributeEscaped('value', oParam.getValue() || "");
            rm.write('>');
        });
        rm.write('</div>');

        rm.write('</div>');
        rm.write('</form>');
        rm.write('</div>');
    };
})();