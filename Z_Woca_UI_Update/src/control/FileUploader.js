(function() {
    "use strict";

    jQuery.sap.declare("com.zespri.awct.control.FileUploader");
    jQuery.sap.declare("com.zespri.awct.util.Constants");
    jQuery.sap.require("com.zespri.awct.util.I18NHelper");
    jQuery.sap.require("com.zespri.awct.util.CommonHelper");
    jQuery.sap.require("sap.ui.core.Control");

    /**
     * @classdesc This control is used to upload a file to the server. For non IE 9 or less browsers, this uses the XHR to upload
     * the document directly via the Gateway OData services. For IE9, this uses a custom ICF node to upload the file via the 
     * form upload mechanism.
     * @class
     * @name com.zespri.awct.control.FileUploader
     */
    sap.ui.core.Control.extend("com.zespri.awct.control.FileUploader", {
        metadata : {
            publicMethods : [
            // methods
            "upload", "abort"],
            properties : {
                "value" : {
                    type : "string",
                    group : "Data",
                    defaultValue : ''
                },
                "enabled" : {
                    type : "boolean",
                    group : "Behavior",
                    defaultValue : true
                },
                "visible" : {
                    type : "boolean",
                    group : "Behavior",
                    defaultValue : true
                },
                "uploadUrl" : {
                    type : "sap.ui.core.URI",
                    group : "Data",
                    defaultValue : ''
                },
                "uploadUrlX" : {
                    type : "sap.ui.core.URI",
                    group : "Data",
                    defaultValue : ''
                },
                "name" : {
                    type : "string",
                    group : "Data",
                    defaultValue : null
                },
                "width" : {
                    type : "sap.ui.core.CSSSize",
                    group : "Misc",
                    defaultValue : ''
                },
                "uploadOnChange" : {
                    type : "boolean",
                    group : "Behavior",
                    defaultValue : false
                },
                "additionalData" : {
                    type : "string",
                    group : "Data",
                    defaultValue : null
                },
                "sameFilenameAllowed" : {
                    type : "boolean",
                    group : "Behavior",
                    defaultValue : false
                },
                "buttonText" : {
                    type : "string",
                    group : "Misc",
                    defaultValue : null
                },
                "fileType" : {
                    type : "string[]",
                    group : "Data",
                    defaultValue : null
                },
                "multiple" : {
                    type : "boolean",
                    group : "Behavior",
                    defaultValue : false
                },
                "maximumFileSize" : {
                    type : "float",
                    group : "Data",
                    defaultValue : null
                },
                "mimeType" : {
                    type : "string[]",
                    group : "Data",
                    defaultValue : null
                },
                "sendXHR" : {
                    type : "boolean",
                    group : "Behavior",
                    defaultValue : false
                },
                "placeholder" : {
                    type : "string",
                    group : "Appearance",
                    defaultValue : null
                },
                "style" : {
                    type : "string",
                    group : "Appearance",
                    defaultValue : null
                },
                "buttonOnly" : {
                    type : "boolean",
                    group : "Appearance",
                    defaultValue : false
                },
                "useMultipart" : {
                    type : "boolean",
                    group : "Behavior",
                    defaultValue : true
                },
                "maximumFilenameLength" : {
                    type : "int",
                    group : "Data",
                    defaultValue : null
                },
                "valueState" : {
                    type : "sap.ui.core.ValueState",
                    group : "Data",
                    defaultValue : sap.ui.core.ValueState.None
                }
            },
            aggregations : {
                "parameters" : {
                    type : "com.zespri.awct.control.FileUploaderParameter",
                    multiple : true,
                    singularName : "parameter"
                },
                "headerParameters" : {
                    type : "com.zespri.awct.control.FileUploaderParameter",
                    multiple : true,
                    singularName : "headerParameter"
                }
            },
            events : {
                "change" : {},
                "uploadComplete" : {},
                "typeMissmatch" : {},
                "fileSizeExceed" : {},
                "fileAllowed" : {},
                "uploadProgress" : {},
                "uploadAborted" : {},
                "filenameLengthExceed" : {}
            },
            renderer : "com.zespri.awct.control.FileUploaderRenderer"
        }
    });

    com.zespri.awct.control.FileUploader.M_EVENTS = {
        'change' : 'change',
        'uploadComplete' : 'uploadComplete',
        'typeMissmatch' : 'typeMissmatch',
        'fileSizeExceed' : 'fileSizeExceed',
        'fileAllowed' : 'fileAllowed',
        'uploadProgress' : 'uploadProgress',
        'uploadAborted' : 'uploadAborted',
        'filenameLengthExceed' : 'filenameLengthExceed'
    };
    /**
     * Initializes the control. It is called from the constructor.
     * 
     * @private
     */
    com.zespri.awct.control.FileUploader.prototype.init = function() {

        // Instantiate browser-specific UI-Elements (IE8 only):
        // works fine with applySettings() after init() - most things are done in onAfterRendering
        // IE8 should render a native file uploader and the SAPUI5 controls should be exactly behind
        if (!!com.zespri.awct.util.Constants.C_IS_BROWSER_IE && sap.ui.Device.browser.version === 8) {
            this.oFilePath = new sap.ui.commons.TextField(this.getId() + "-fu_input", {
                width : "225px"
            });

            this.oBrowse = new sap.ui.commons.Button({
                enabled : this.getEnabled(),
                text : "Browse..",
                width : "0px",
                height : "0px"
            });
        } else {
            // all other browsers will load the respective UI-Elements from the FileUploaderHelper
            this.oFilePath = com.zespri.awct.control.FileUploaderHelper.createTextField(this.getId() + "-fu_input");
            this.oBrowse = com.zespri.awct.control.FileUploaderHelper.createButton();
        }
        this.oFilePath.setParent(this);
        this.oBrowse.setParent(this);

        this.oFileUpload = null;

        // retrieving the default browse button text from the resource bundle
        this.oBrowse.setText(this.getBrowseText());

        // CUSTOM CODE START ---
        // Attach handler for 'press' event. Open the browser's standard 'select a file' dialog.
        var that = this;
        this.oBrowse.attachPress(function() {
            var $defaultFileUploader = jQuery.sap.byId(that.getId() + "-fu");
            $defaultFileUploader.trigger('click');
        });
        // -- CUSTOM CODE END

        // var that = this;
        // var oDelegate = {
        // onfocusin : function(){
        // var jFO = jQuery.sap.byId(that.getId() + "-fu");
        // if(jFO.length > 0){
        // jFO[0].focus();
        // }
        // }
        // };
        // this.oFilePath.addDelegate(oDelegate);
        // this.oBrowse.addDelegate(oDelegate);

    };

    com.zespri.awct.control.FileUploader.prototype.setButtonText = function(sText) {
        this.oBrowse.setText(sText || this.getBrowseText());
        this.setProperty("buttonText", sText, false);
        return this;
    };

    com.zespri.awct.control.FileUploader.prototype.getIdForLabel = function() {
        return this.oBrowse.getId();
    };

    com.zespri.awct.control.FileUploader.prototype.setFileType = function(vTypes) {
        // Compatibility issue: converting the given types to an array in case it is a string
        var aTypes = this._convertTypesToArray(vTypes);
        this.setProperty("fileType", aTypes, false);
        return this;
    };

    com.zespri.awct.control.FileUploader.prototype.setMimeType = function(vTypes) {
        // Compatibility issue: converting the given types to an array in case it is a string
        var aTypes = this._convertTypesToArray(vTypes);
        this.setProperty("mimeType", aTypes, false);
        return this;
    };

    /**
     * Helper to ensure, that the types (file or mime) are inside an array. The FUP also accepts comma-separated strings for its fileType and mimeType
     * property.
     * 
     * @private
     */
    com.zespri.awct.control.FileUploader.prototype._convertTypesToArray = function(vTypes) {
        if (typeof vTypes === "string") {
            if (vTypes === "") {
                return [];
            } else {
                return vTypes.split(",");
            }
        }
        return vTypes;
    };

    /**
     * Terminates the control when it has been destroyed.
     * 
     * @private
     */
    com.zespri.awct.control.FileUploader.prototype.exit = function() {

        // destroy the nested controls
        this.oFilePath.destroy();
        this.oBrowse.destroy();

        // remove the IFRAME
        if (this.oIFrameRef) {
            jQuery(this.oIFrameRef).unbind();
            sap.ui.getCore().getStaticAreaRef().removeChild(this.oIFrameRef);
            this.oIFrameRef = null;
        }

    };

    /**
     * Clean up event listeners before rendering
     * 
     * @private
     */
    com.zespri.awct.control.FileUploader.prototype.onBeforeRendering = function() {

        // store the file uploader outside in the static area
        var oStaticArea = sap.ui.getCore().getStaticAreaRef();
        jQuery(this.oFileUpload).appendTo(oStaticArea);

        // unbind the custom event handlers in case of IE8
        jQuery(this.oFileUpload).unbind();

    };

    /**
     * Prepare the upload processing, establish the change handler for the pure html input object.
     * 
     * @private
     */
    com.zespri.awct.control.FileUploader.prototype.onAfterRendering = function() {

        // prepare the file upload control and the upload iframe
        this.prepareFileUploadAndIFrame();

        // event listener registration for change event in IE8 because the change
        // event is not bubbling for IE8 => so we do this for all browsers!
        jQuery(this.oFileUpload).change(jQuery.proxy(this.handlechange, this));

        // IE8 should render a native file uploader and don't need the witdh calculation
        if ((!!com.zespri.awct.util.Constants.C_IS_BROWSER_IE && sap.ui.Device.browser.version <= 8)) {
            this.oBrowse.getDomRef().style.padding = "0px";
            this.oBrowse.getDomRef().style.visibility = "hidden";
            this.oFilePath.getDomRef().style.height = "20px";
            this.oFilePath.getDomRef().style.visibility = "hidden";
            jQuery(this.oFilePath.getDomRef()).removeClass('sapUiTfBrd');
        } else {
            this.oFilePath.$().attr("tabindex", "-1");
            // in case of IE9 we prevent the browse button from being focused because the
            // native file uploader requires the focus for catching the keyboard events
            if ((!!com.zespri.awct.util.Constants.C_IS_BROWSER_IE && sap.ui.Device.browser.version === 9)) {
                this.oBrowse.$().attr("tabindex", "-1");
            }
            jQuery.sap.delayedCall(0, this, this._recalculateWidth);
        }

    };

    com.zespri.awct.control.FileUploader.prototype._recalculateWidth = function() {
        // calculation of the width of the overlay for the original file upload
        // !!!com.zespri.awct.util.Constants.C_IS_BROWSER_IE check: only for non IE browsers since there we need
        // the button in front of the fileuploader
        if (this.getWidth()) {
            if (this.getButtonOnly()) {
                this.oBrowse.getDomRef().style.width = this.getWidth();
            } else {
                // Recalculate the textfield width...
                this._resizeDomElements();
            }
        }
    };

    /**
     * Returns the DOM element that should be focused when focus is set onto the control.
     */
    com.zespri.awct.control.FileUploader.prototype.getFocusDomRef = function() {
        return this.$("fu").get(0);
    };

    com.zespri.awct.control.FileUploader.prototype._resizeDomElements = function() {
        var sId = this.getId();
        this._oBrowseDomRef = this.oBrowse.getDomRef();
        var $b = jQuery(this._oBrowseDomRef);
        var _buttonWidth = $b.parent().outerWidth(true);
        this._oFilePathDomRef = this.oFilePath.getDomRef();
        var oDomRef = this._oFilePathDomRef;
        var sWidth = this.getWidth();

        if (sWidth.substr(-1) === "%") {
            // Special case - if the width is not in px, we only change the top element

            // Resize all elements from the input field up to the control element itself.
            while (oDomRef.id !== sId) {
                oDomRef.style.width = "100%";
                oDomRef = oDomRef.parentNode;
            }

            oDomRef.style.width = sWidth;
        } else {
            oDomRef.style.width = sWidth;

            // Now make sure the field including the button has the correct size
            var $fp = jQuery(this._oFilePathDomRef);
            var _newWidth = $fp.outerWidth() - _buttonWidth;
            if (_newWidth < 0) {
                this.oFilePath.getDomRef().style.width = "0px";
                if (!!!com.zespri.awct.util.Constants.C_IS_BROWSER_IE) {
                    this.oFileUpload.style.width = $b.outerWidth(true);
                }
            } else {
                this.oFilePath.getDomRef().style.width = _newWidth + "px";
            }
        }
    };

    com.zespri.awct.control.FileUploader.prototype.onresize = function() {
        this._recalculateWidth();
    };

    com.zespri.awct.control.FileUploader.prototype.onThemeChanged = function() {
        this._recalculateWidth();
    };

    com.zespri.awct.control.FileUploader.prototype.setEnabled = function(bEnabled) {
        this.setProperty("enabled", bEnabled, true);
        this.oFilePath.setEnabled(bEnabled);
        this.oBrowse.setEnabled(bEnabled);
        if (bEnabled) {
            this.$("fu").removeAttr('disabled');
        } else {
            this.$("fu").attr('disabled', 'disabled');
        }
        return this;
    };

    com.zespri.awct.control.FileUploader.prototype.setValueState = function(sValueState) {
        this.setProperty("valueState", sValueState);
        // as of 1.23.1 oFilePath can be a sap.ui.commons.TextField or a sap.m.Input, which both have a valueState
        if (this.oFilePath.setValueState) {
            this.oFilePath.setValueState(sValueState);
        }
        return this;
    };

    com.zespri.awct.control.FileUploader.prototype.setUploadUrl = function(sValue) {
        this.setProperty("uploadUrl", sValue, true);
        var $uploadForm = this.$("fu_form");
        $uploadForm.attr("action", this.getUploadUrl());
        return this;
    };

    com.zespri.awct.control.FileUploader.prototype.setPlaceholder = function(sPlaceholder) {
        this.setProperty("placeholder", sPlaceholder, true);
        this.oFilePath.setPlaceholder(sPlaceholder);
        return this;
    };

    com.zespri.awct.control.FileUploader.prototype.setStyle = function(sStyle) {
        this.setProperty("style", sStyle, true);
        if (sStyle === "Transparent") {
            if (this.oBrowse.setLite) {
                this.oBrowse.setLite(true);
            } else {
                this.oBrowse.setType("Transparent");
            }
        } else {
            if (this.oBrowse.setType) {
                this.oBrowse.setType(sStyle);
            } else {
                if (sStyle === "Emphasized") {
                    sStyle = "Emph";
                }
                this.oBrowse.setStyle(sStyle);
            }
        }
        return this;
    };

    com.zespri.awct.control.FileUploader.prototype.setValue = function(sValue, bFireEvent) {
        var oldValue = this.getValue();
        if ((oldValue !== sValue) || this.getSameFilenameAllowed()) {
            // only upload when a valid value is set
            var bUpload = this.getUploadOnChange() && sValue;
            // when we do not upload we re-render (cause some browsers don't like
            // to change the value of file uploader INPUT elements)
            this.setProperty("value", sValue, bUpload);
            if (this.oFilePath) {
                this.oFilePath.setValue(sValue);
                if (!(!!com.zespri.awct.util.Constants.C_IS_BROWSER_IE && sap.ui.Device.browser.version === 8) && this.oFilePath.getFocusDomRef()) {
                    this.oFilePath.getFocusDomRef().focus();
                }
            }
            var oForm = this.getDomRef("fu_form");
            if (this.oFileUpload && /* is visible: */oForm && !sValue) {
                // some browsers do not allow to clear the value of the fileuploader control
                // therefore we utilize the form and reset the values inside this form and
                // apply the additionalData again afterwards
                oForm.reset();
                if (sap.ui.Device.browser.chrome) {
                    // Chrome needs the value to be cleared this way since the form reset leads
                    // to showing the old value while nothing is uploaded. This specifically
                    // happens when the focus changes due to the change event in between.
                    this.getDomRef("fu_input").value = "";
                }
                this.$("fu_data").val(this.getAdditionalData());
            }
            // only fire event when triggered by user interaction
            if (bFireEvent) {
                this.fireChange({
                    id : this.getId(),
                    newValue : sValue
                });
            }
            if (bUpload) {
                this.upload();
            }
        }
        return this;
    };

    com.zespri.awct.control.FileUploader.prototype.onmouseover = function() {
        jQuery(this.oBrowse.getDomRef()).addClass('sapUiBtnStdHover');
    };

    com.zespri.awct.control.FileUploader.prototype.onmouseout = function() {
        jQuery(this.oBrowse.getDomRef()).removeClass('sapUiBtnStdHover');
    };

    com.zespri.awct.control.FileUploader.prototype.onfocusin = function() {
        jQuery(this.oBrowse.getDomRef()).addClass('sapUiBtnStdHover');
    };

    com.zespri.awct.control.FileUploader.prototype.onfocusout = function() {
        jQuery(this.oBrowse.getDomRef()).removeClass('sapUiBtnStdHover');
    };

    com.zespri.awct.control.FileUploader.prototype.setAdditionalData = function(sAdditionalData) {
        // set the additional data in the hidden input
        this.setProperty("additionalData", sAdditionalData, true);
        var oAdditionalData = this.getDomRef("fu_data");
        if (oAdditionalData) {
            var sAddlData = this.getAdditionalData() || "";
            oAdditionalData.value = sAddlData;
        }
        return this;
    };

    com.zespri.awct.control.FileUploader.prototype.upload = function() {

        var uploadForm = this.getDomRef("fu_form"), that = this;
        var formData;
        try {
            if (uploadForm) {
                this._bUploading = true;
                var oHeaderParams, i, sHeader, sValue;
                if (this.getSendXHR() && window.File) {
                    var oFiles = jQuery.sap.domById(this.getId() + "-fu").files;
                    if (oFiles.length > 0) {
                        // keep a reference on the current upload xhr
                        var xhr = this._uploadXHR = new window.XMLHttpRequest();
                        xhr.upload.addEventListener("progress", function(oProgressEvent) {
                            var oProgressData = {
                                lengthComputable : !!oProgressEvent.lengthComputable,
                                loaded : oProgressEvent.loaded,
                                total : oProgressEvent.total
                            };
                            that.fireUploadProgress(oProgressData);
                        });
                        // relay the abort event, if the xhr was aborted manually
                        xhr.upload.addEventListener("abort", function() {
                            that.fireUploadAborted();
                        });

                        xhr.open("POST", this.getUploadUrl(), true);
                        // get the CSRF token as this is mandatory for the gateway call to succeed
                        xhr.setRequestHeader(com.zespri.awct.util.Constants.C_XSRF_TOKEN, com.zespri.awct.util.CommonHelper.getCSRFToken());
                        if (this.getHeaderParameters()) {
                            oHeaderParams = this.getHeaderParameters();
                            for (i = 0; i < oHeaderParams.length; i++) {
                                sHeader = oHeaderParams[i].getName();
                                sValue = oHeaderParams[i].getValue();
                                xhr.setRequestHeader(sHeader, sValue);
                            }
                        }
                        if (this.getUseMultipart()) {
                            formData = new window.FormData();
                            var name = jQuery.sap.domById(this.getId() + "-fu").name;
                            for ( var j = 0; j < oFiles.length; j++) {
                                formData.append(name, oFiles[j]);
                            }
                            formData.append("_charset_", "UTF-8");
                            var data = jQuery.sap.domById(this.getId() + "-fu_data").name;
                            if (this.getAdditionalData()) {
                                var sData = this.getAdditionalData();
                                formData.append(data, sData);
                            } else {
                                formData.append(data, "");
                            }
                            if (this.getParameters()) {
                                var oParams = this.getParameters();
                                for ( var k = 0; k < oParams.length; k++) {
                                    var sName = oParams[k].getName();
                                    var sParamValue = oParams[k].getValue();
                                    formData.append(sName, sParamValue);
                                }
                            }
                            xhr.send(formData);
                        } else {
                            /**
                             * CUSTOM
                             * 
                             */
                            formData = new window.FormData();
                            formData.append(com.zespri.awct.util.Constants.C_XSRF_TOKEN, com.zespri.awct.util.CommonHelper.getCSRFToken());
                            formData.append('file', oFiles[0]);
                            xhr.send(oFiles[0]);
                        }

                        xhr.onreadystatechange = function() {
                            var sResponse;
                            var sResponseRaw;
                            var mHeaders = {};
                            var sPlainHeader;
                            var aHeaderLines;
                            var iHeaderIdx;
                            var sReadyState = xhr.readyState;
                            var sStatus = xhr.status;
                            if (xhr.readyState === 4) {
                                // this check is needed, because (according to the xhr spec) the readyState is set to OPEN (4)
                                // as soon as the xhr is aborted. Only after the progress events are fired, the state is set to UNSENT (0)
                                if (xhr.responseXML) {
                                    sResponse = xhr.responseXML.documentElement.textContent;
                                }
                                sResponseRaw = xhr.response;

                                // Parse the http-header into a map
                                sPlainHeader = xhr.getAllResponseHeaders();
                                if (sPlainHeader) {
                                    aHeaderLines = sPlainHeader.split("\u000d\u000a");
                                    for ( var i = 0; i < aHeaderLines.length; i++) {
                                        if (aHeaderLines[i]) {
                                            iHeaderIdx = aHeaderLines[i].indexOf("\u003a\u0020");
                                            mHeaders[aHeaderLines[i].substring(0, iHeaderIdx)] = aHeaderLines[i].substring(iHeaderIdx + 2);
                                        }
                                    }
                                }
                                that.fireUploadComplete({
                                    "headers" : mHeaders,
                                    "response" : sResponse,
                                    "responseRaw" : sResponseRaw,
                                    "readyStateXHR" : sReadyState,
                                    "status" : sStatus
                                });
                            }
                            that._bUploading = false;
                        };
                        this._bUploading = false;
                    }
                } else {
                    if (this.getHeaderParameters()) {
                        oHeaderParams = this.getHeaderParameters();
                        for (i = 0; i < oHeaderParams.length; i++) {
                            sHeader = oHeaderParams[i].getName();
                            sValue = oHeaderParams[i].getValue();
                            $(uploadForm).find("#" + sHeader).val(sValue);
                        }
                    }

                    uploadForm.submit();
                }
                jQuery.sap.log.info("File uploading to " + this.getUploadUrl());
                if (this.getSameFilenameAllowed() && this.getUploadOnChange()) {
                    this.setValue("", true);
                }
            }
        } catch (oException) {
            jQuery.sap.log.error("File upload failed:\n" + oException.message);
        }
    };

    /**
     * Aborts the currently running Upload.
     * 
     * @public
     */
    com.zespri.awct.control.FileUploader.prototype.abort = function() {
        if (this._uploadXHR && this._uploadXHR.abort) {
            // fires a progress event 'abort' on the _uploadXHR
            this._uploadXHR.abort();
        }
    };

    com.zespri.awct.control.FileUploader.prototype.onkeypress = function(oEvent) {
        this.onkeydown(oEvent);
    };

    com.zespri.awct.control.FileUploader.prototype.onclick = function() {
        if (this.getSameFilenameAllowed()) {
            this.setValue("", true);
        }
    };

    //
    // Event Handling
    //
    com.zespri.awct.control.FileUploader.prototype.onkeydown = function(oEvent) {
        if (!this.getEnabled()) {
            return;
        }
        if (this.getSameFilenameAllowed()) {
            this.setValue("", true);
        }
        var iKeyCode = oEvent.keyCode, eKC = jQuery.sap.KeyCodes;
        if (iKeyCode === eKC.DELETE || iKeyCode === eKC.BACKSPACE) {
            if (this.oFileUpload) {
                this.setValue("", true);
            }
        } else if (iKeyCode === eKC.SPACE || iKeyCode === eKC.ENTER) {
            // this does not work for IE9 and downwards! TODO: check with IE10/11
            // consider to always put the focus on the hidden file uploader
            // and let the fileuploader manager the keyboard interaction
            if (!(!!com.zespri.awct.util.Constants.C_IS_BROWSER_IE && sap.ui.Device.browser.version <= 9) && this.oFileUpload) {
                this.oFileUpload.click();
                oEvent.preventDefault();
                oEvent.stopPropagation();
            }
        } else if (iKeyCode !== eKC.TAB && iKeyCode !== eKC.SHIFT && iKeyCode !== eKC.F6) {
            oEvent.preventDefault();
            oEvent.stopPropagation();
        }
    };

    /**
     * Helper function to check if the given filename is longer than the specified 'maximumFilenameLength'.
     * 
     * @param {string}
     *            [sFilename] the filename which should be tested
     * @param {boolean}
     *            [bFireEvent] if necessary, this flag triggers that a filenameLengthExceed event is fired
     * @returns {boolean} whether the filename is too long or not
     * @private
     */
    com.zespri.awct.control.FileUploader.prototype._isFilenameTooLong = function(sFilename) {
        var iMaxFilenameLength = this.getMaximumFilenameLength();
        if (iMaxFilenameLength !== 0 && sFilename.length > iMaxFilenameLength) {
            jQuery.sap.log.info("The filename of " + sFilename + " (" + sFilename.length + " characters)  is longer than the maximum of " +
                    iMaxFilenameLength + " characters.");
            return true;
        }

        return false;
    };

    com.zespri.awct.control.FileUploader.prototype.handlechange = function(oEvent) {
        if (this.oFileUpload && this.getEnabled()) {

            var fMaxSize = this.getMaximumFileSize();

            var aFileTypes = this.getFileType();
            var aMimeTypes = this.getMimeType();

            var sFileString = '';

            if (window.File) {
                var oFiles = oEvent.target.files;

                for ( var i = 0; i < oFiles.length; i++) {
                    var sName = oFiles[i].name;
                    var sType = oFiles[i].type;
                    if (!sType) {
                        sType = "unknown";
                    }
                    var fSize = ((oFiles[i].size / 1024) / 1024);
                    if (fMaxSize && (fSize > fMaxSize)) {
                        jQuery.sap.log.info("File: " + sName + " is of size " + fSize + " MB which exceeds the file size limit of " + fMaxSize +
                                " MB.");
                        this.fireFileSizeExceed({
                            fileName : sName,
                            fileSize : fSize
                        });
                        return;
                    }
                    // check if the filename is too long and fire the corresponding event if necessary
                    if (this._isFilenameTooLong(sName)) {
                        this.fireFilenameLengthExceed({
                            fileName : sName
                        });
                        return;
                    }
                    // check allowed mime-types for potential mismatches
                    if (aMimeTypes && aMimeTypes.length > 0) {
                        var bWrongMime = true;
                        for ( var j = 0; j < aMimeTypes.length; j++) {
                            if (sType.match(aMimeTypes[j])) {
                                bWrongMime = false;
                            }
                        }
                        if (bWrongMime) {
                            jQuery.sap.log.info("File: " + sName + " is of type " + sType + ". Allowed types are: " + aMimeTypes + ".");
                            this.fireTypeMissmatch({
                                fileName : sName,
                                mimeType : sType
                            });
                            return;
                        }
                    }
                    // check allowed file-types for potential mismatches
                    if (aFileTypes && aFileTypes.length > 0) {
                        var bWrongType = true;
                        var iIdx = sName.lastIndexOf(".");
                        var sFileEnding = sName.substring(iIdx + 1);
                        for ( var k = 0; k < aFileTypes.length; k++) {
                            if (sFileEnding === aFileTypes[k]) {
                                bWrongType = false;
                            }
                        }
                        if (bWrongType) {
                            jQuery.sap.log.info("File: " + sName + " is of type " + sFileEnding + ". Allowed types are: " + aFileTypes + ".");
                            this.fireTypeMissmatch({
                                fileName : sName,
                                fileType : sFileEnding
                            });
                            return;
                        }
                    }
                    sFileString = sFileString + '"' + oFiles[i].name + '" ';
                }
                if (sFileString) {
                    this.fireFileAllowed();
                }
            } else if (aFileTypes && aFileTypes.length > 0) {
                // This else case is executed if the File-API is not supported by the browser (especially IE8/9).
                // Check if allowed file types match the chosen file from the oFileUpload IFrame Workaround.
                var bWrongTypeE = true;
                var sNamex = this.oFileUpload.value || "";
                var iIdy = sNamex.lastIndexOf(".");
                var sFileEndingx = sNamex.substring(iIdy + 1);
                for ( var l = 0; l < aFileTypes.length; l++) {
                    if (sFileEndingx === aFileTypes[l]) {
                        bWrongTypeE = false;
                    }
                }
                if (bWrongTypeE) {
                    jQuery.sap.log.info("File: " + sNamex + " is of type " + sFileEndingx + ". Allowed types are: " + aFileTypes + ".");
                    this.fireTypeMissmatch({
                        fileName : sNamex,
                        fileType : sFileEndingx
                    });
                    return;
                }
                // check if the filename is too long and fire the corresponding event if necessary
                if (this._isFilenameTooLong(sNamex)) {
                    this.fireFilenameLengthExceed({
                        fileName : sNamex
                    });
                    return;
                }
                if (sNamex) {
                    this.fireFileAllowed();
                }
            }

            // due to new security mechanism modern browsers simply
            // append a fakepath in front of the filename instead of
            // returning the filename only - we strip this path now
            var sValue = this.oFileUpload.value || "";
            var iIndex = sValue.lastIndexOf("\\");
            if (iIndex >= 0) {
                sValue = sValue.substring(iIndex + 1);
            }
            if (this.getMultiple() && !com.zespri.awct.util.Constants.C_IS_BROWSER_IE) {
                sValue = sFileString;
            }

            // sValue has to be filled to avoid clearing the FilePath by pressing cancel
            if (sValue || sap.ui.Device.browser.chrome) { // in Chrome the file path has to be cleared as the upload will be avoided
                this.setValue(sValue, true);
            }
        }
    };

    //
    // Private
    //

    /**
     * Helper to retrieve the I18N texts for a button
     * 
     * @private
     */
    com.zespri.awct.control.FileUploader.prototype.getBrowseText = function() {
        // CUSTOM CODE START ---
        return com.zespri.awct.util.I18NHelper.getText("TXT_FILE_UPLOADER_BROWSE");
        // -- CUSTOM CODE END
    };

    /**
     * Getter for shortened value.
     * 
     * @private
     * @deprecated the value now is the short value (filename only)!
     */
    com.zespri.awct.control.FileUploader.prototype.getShortenValue = function() {
        return this.getValue();
    };

    /**
     * Prepares the hidden IFrame for uploading the file (in static area).
     * 
     * @private
     */
    com.zespri.awct.control.FileUploader.prototype.prepareFileUploadAndIFrame = function() {

        if (!this.oFileUpload) {

            // create the file uploader markup
            var aFileUpload = [];
            aFileUpload.push('<input ');
            aFileUpload.push('type="file" ');
            if (this.getName()) {
                if (this.getMultiple() && !com.zespri.awct.util.Constants.C_IS_BROWSER_IE) {
                    aFileUpload.push('name="' + this.getName() + '[]" ');
                } else {
                    aFileUpload.push('name="' + this.getName() + '" class="zAwctFileUploadIE" ');
                }
            } else {
                if (this.getMultiple() && !com.zespri.awct.util.Constants.C_IS_BROWSER_IE) {
                    aFileUpload.push('name="' + this.getId() + '[]" ');
                } else {
                    aFileUpload.push('name="' + this.getId() + '" class="zAwctFileUploadIE" ');
                }
            }
            aFileUpload.push('id="' + this.getId() + '-fu" ');
            if (!(!!com.zespri.awct.util.Constants.C_IS_BROWSER_IE && sap.ui.Device.browser.version === 8)) {
                // for IE9 the file uploader itself gets the focus to make sure that the
                // keyboard interaction works and there is no security issue - unfortunately
                // this has the negative side effect that 2 tabs are required.
                if (!(!!com.zespri.awct.util.Constants.C_IS_BROWSER_IE && sap.ui.Device.browser.version === 9)) {
                    aFileUpload.push('tabindex="-1" ');
                }
                aFileUpload.push('size="1" ');
            }
            /* jshint -W106 */
            if (this.getTooltip_AsString()) {
                aFileUpload.push('title="' + jQuery.sap.escapeHTML(this.getTooltip_AsString()) + '" ');
            }
            /* jshint +W106 */
            else if (this.getTooltip()) {
                // object tooltip, do nothing - tooltip will be displayed
            } else if (this.getValue() !== "") {
                // only if there is no tooltip, then set value as fallback
                aFileUpload.push('title="' + jQuery.sap.escapeHTML(this.getValue()) + '" ');
            }
            if (!this.getEnabled()) {
                aFileUpload.push('disabled="disabled" ');
            }
            if (this.getMultiple() && !com.zespri.awct.util.Constants.C_IS_BROWSER_IE) {
                aFileUpload.push('multiple ');
            }
            aFileUpload.push('>');

            // add it into the control markup
            this.oFileUpload = jQuery(aFileUpload.join("")).prependTo(this.$().find(".zAwctDisplayIEUpload")).get(0);

        } else {

            // move the file uploader from the static area to the control markup
            jQuery(this.oFileUpload).prependTo(this.$().find(".zAwctDisplayIEUpload"));

        }

        if (!this.oIFrameRef) {

            // create the upload iframe
            var oIFrameRef = document.createElement("iframe");
            oIFrameRef.style.display = "none";
            /* jshint -W107 */
            oIFrameRef.src = "javascript:''";
            /* jshint +W107 */
            oIFrameRef.id = this.sId + "-frame";
            sap.ui.getCore().getStaticAreaRef().appendChild(oIFrameRef);
            oIFrameRef.contentWindow.name = this.sId + "-frame";

            // sink the load event of the upload iframe
            var that = this;
            this._bUploading = false; // flag for uploading (because of IE8 to make sure that complete is only triggered after upload)
            jQuery(oIFrameRef).load(function() {
                if (that._bUploading) {
                    jQuery.sap.log.info("File uploaded to " + that.getUploadUrl());
                    var sResponse;
                    try {
                        sResponse = that.oIFrameRef.contentDocument.body.innerText;
                    } catch (ex) {
                        // in case of cross-domain submit we get a permission denied exception
                        // when we try to access the body of the IFrame document
                    }
                    that.fireUploadComplete({
                        "response" : sResponse
                    });
                    that._bUploading = false;
                }
            });

            // keep the reference
            this.oIFrameRef = oIFrameRef;

        }
    };

    jQuery.sap.setObject("com.zespri.awct.control.FileUploaderHelper", {
        createTextField : function(sId) {
            var oTextField = new sap.m.Input(sId);
            return oTextField;
        },
        setTextFieldContent : function(oTextField, sWidth) {
            oTextField.setWidth(sWidth);
        },
        createButton : function() {
            var oButton = new sap.m.Button();
            return oButton;
        },
        bFinal : true
    });
})();