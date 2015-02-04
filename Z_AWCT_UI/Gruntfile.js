/*
 * Stages in build
 *		prepare : Copy from source to staging
 *		process : run validations, process files in staging and move to staging2 folder 
 *   	finalize: Add copyright information, etc,  compress files and clean leftovers
 */
module.exports = function(grunt) {
	//initialize the configuration object
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		ref: grunt.file.readJSON('gruntref.json'),
		clean: {
			prepare: {
				//Release the folder build/process
				src: ["<%= ref.process%>", "<%= ref.staging%>", "<%= ref.output%>", "<%= ref.outputsrc%>", "<%= ref.finalize%>"]
			},
			process: {
				src: ["<%= ref.process%>core/**", "<%= ref.process%>util/**", "<%= ref.process%>control/**", "<%= ref.process%>Component.js"]
			},
			finalize: {
				//Release the folder build/_process
				src: ["<%= ref.staging%>", "<%= ref.process%>", "<%= ref.finalize%>", "<%=ref.outputsrc%>"]
			}
		},
		copy: {
			prepare: {
				//copy all the files from WebContent before we start the processing
				//The files are copied into the staging area 
				files: [
					/*
						Copy all files to prepare for further processing
					*/				
			        {
			        	expand	: true,
			        	cwd		: "<%= ref.source%>",
			        	src 	: ['**/*', '!data/**', '!util/MockServer.js', '!META-INF/**', '!WEB-INF/**'], 
			        	dest 	: "<%= ref.staging%>" 
			        },
			        {
			        	expand	: true,
			        	cwd		: "<%= ref.source%>",
			        	src 	: ['**/*', '!META-INF/**', '!WEB-INF/**'], 
			        	dest 	: "<%= ref.outputsrc%>" 
			        }
		       ]
			},
			process: {
				files: [
					/*
						Copy JS files to create the dbg version
					*/				        
			        {
			        	expand	: true,
			        	cwd		: "<%= ref.staging%>",
			        	src 	: ['**/*.js', '**/*.html', '**/*.xml', '**/*.jpg', '**/*.png', '**/*.gif', '**/*.json', '**/*.properties', '!test/**', '!test_local.html', '!index_local.html'], 
			        	dest 	: "<%= ref.process%>",
			        	rename	: function(dest, src){
			        		var aSrc = src.split('.');
			        		var ext = aSrc.pop();
			        		if(ext === 'js') {
			        			if(aSrc.length > 1){
			        				if(aSrc[aSrc.length - 1] === "controller"){
			        					ext = aSrc.pop() +"." + ext;
			        				}
			        			}
			        			return dest + aSrc.join('.') + '-dbg.' + ext;
			        		} else {
			        			return dest + src;
			        		}
			        	}
			        }
		       ]
			},
			finalize: {
				files: [
					{
						expand	: true,
			        	cwd		: "<%= ref.process%>",
			        	src 	: ['**/*.jpg', '**/*.png', '**/*.gif', '**/*.json'], 
			        	dest 	: "<%= ref.finalize%>"
					},
	                {
                        expand  : true,
                        cwd     : ".",
                        src     : ['login.properties'], 
                        dest    : "<%= ref.output%>" 
                    }
				]
			}			
		},	
		jshint: {
			process: {
				options : {
					eqeqeq 	: true,
					curly   : true,
					es3		: true,
					unused 	: true,
					eqnull	: true,
					camelcase : true,
					laxbreak  : false,
					force	: true,
					reporter : "jshint-reporter",
					reporterOutput : "<%= ref.output%>JSLint.csv"
				},

				src: "<%= ref.staging%>**/*.js"
			}
		},	
		uglify: {
			options : {
				mangle 		: true,
				compress 	: {
					drop_console 	: true,
					dead_code 		: false,
					unused			: false
				}				
			},
			files : {
				expand 	: true,
				cwd		: "<%= ref.staging%>",
				src 	: ["**/*.js", '!test/**', '!test_local.html'],
				dest	: "<%= ref.process%>"
			}
		},
		concat: {
			process: {
				/*
					Do not concatenate the view controllers
				*/
				files: {
					"<%= ref.process%>Component-preload.js" : 
						[ 
						  '<%= ref.process%>core/*.js',
						  '<%= ref.process%>util/Constants.js',
						  '<%= ref.process%>util/Enums.js',
						  '<%= ref.process%>util/ModelHelper.js',
						  '<%= ref.process%>util/CommonHelper.js',						  
						  '<%= ref.process%>util/TableRowActionsExtension.js',
						  '<%= ref.process%>util/I18NHelper.js',
						  '<%= ref.process%>util/NotificationHelper.js',
						  '<%= ref.process%>util/CommonFormatHelper.js',
						  '<%= ref.process%>util/LocaleFormatHelper.js',
						  '<%= ref.process%>control/FileUploaderParameter.js',
						  '<%= ref.process%>control/FileUploaderRenderer.js',
						  '<%= ref.process%>control/FileUploader.js',
						  '<%= ref.process%>control/SearchHelpInput.js',
						  '<%= ref.process%>control/DatePicker.js',						  
						  '<%= ref.process%>control/SharedContainerLinkRenderer.js',
						  '<%= ref.process%>control/SharedContainerLink.js',
						  '<%= ref.process%>control/FacetFilterList.js',
						  '<%= ref.process%>control/FacetFilterNumberInputListRenderer.js',
						  '<%= ref.process%>control/FacetFilterNumberInputList.js',
						  '<%= ref.process%>control/FacetFilterDateInputListRenderer.js',
						  '<%= ref.process%>control/FacetFilterDateInputList.js',
						  '<%= ref.process%>control/FacetFilterCheckboxListRenderer.js',
						  '<%= ref.process%>control/FacetFilterCheckboxList.js',
						  '<%= ref.process%>control/FacetFilterRenderer.js',
						  '<%= ref.process%>control/FacetFilter.js',
						  '<%= ref.process%>Component.js'
						 ]
				}
			},
			finalizeJS: {
				options: {
					banner: "/*----------------------------------------------------------------------* \n * Copyright  (c) 2014 SAP SE. All rights reserved	\n * Author       : SAP Custom Development \n *----------------------------------------------------------------------*/ \n	"
				},
				files: [{
					expand 	: true,
					cwd		: "<%= ref.process%>",
					src 	: ["**/*.js", "**/*.css"],
					dest	: "<%= ref.finalize%>"
				}]
			},
			finalizeML: {
				options: {
					banner: "<!-- \n *................................................................* \n * Copyright  (c) 2014 SAP SE. All rights reserved	\n * Author       : SAP Custom Development \n * ................................................................ \n *--> \n	"
				},
				files: [{
					expand 	: true,
					cwd		: "<%= ref.process%>",
					src 	: ["**/*.html", "**/*.xml"],
					dest	: "<%= ref.finalize%>"
				}]
			},
			finalizeProp: {
				options: {
					banner: "#\n# *................................................................* \n# * Copyright  (c) 2014 SAP SE. All rights reserved	\n# * Author       : SAP Custom Development \n# * ................................................................ \n# *\n"
				},
				files: [{
					expand 	: true,
					cwd		: "<%= ref.process%>",
					src 	: ["**/*.properties"],
					dest	: "<%= ref.finalize%>"
				}]
			}
		},		
		less: {
			process: {
				options: {
					compress 	: true,
					cleancss	: true,
					sourceMap	: true
				},
				files: {
					"<%= ref.process%>style/awct-root.css"	: "<%= ref.staging%>style/awct-root.less"
				}
			}
		},
		compress: {
			finalize: {
				options: {
					archive: "<%= ref.output%>build<%= grunt.template.today('yyyymmddhhmmss')%>.zip"
				},
				files: [{
					expand 	: true,
					cwd		: "<%= ref.finalize%>",
					src  	: "**/*",
					dest 	: ""
				}]
			},
			finalizeSrc: {
				options: {
					archive: "<%= ref.output%>Src<%= grunt.template.today('yyyymmddhhmmss')%>.zip"
				},
				files: [{
					expand 	: true,
					cwd		: "<%= ref.outputsrc%>",
					src  	: "**/*",
					dest 	: ""
				}]
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-compress');


	grunt.registerTask('updateVersion', function(key, value){
		var versionJson = "WebContent/version.json";
		if(!(grunt.file.exists(versionJson))){
			//be silent
			grunt.log.writeln("version.properties does not exist ! <%= ref.version%>");
		} else {
			var ver = grunt.file.readJSON(versionJson);
			ver.build += 1;
			ver.timestamp = Date.now();
			var targetFile = JSON.stringify(ver, null, 2);
			grunt.file.write(versionJson, targetFile);
			grunt.log.writeln("version.properties updated !");
		}
	});

	/*
		STEPS 
		1. Clean the working and staging directory
		2. Copy the files to the working directory from source
		3. Lint the JS code. Temporarily the build would proceed even if the output checks throw errors
		4. Generate CSS in staging directory. The generated CSS is clean CSS
		5. uglify the code and copy to staging directory
		6. concatenate the uglified code in staging 
		7. copy the original source files (JS) to the staging directory as dbg versions 
		8. clean the working directory
		9. Create ZIP file as finalize output	
	}); */

	grunt.registerTask('default', ['clean:prepare', 'updateVersion', 'copy:prepare', 'jshint:process', 'less:process', 'uglify', 
		'concat:process', 'clean:process', 'copy:process', 'concat:finalizeJS', 
		'concat:finalizeML', 'concat:finalizeProp', 'copy:finalize', 'compress:finalize', 'compress:finalizeSrc', 'clean:finalize']);
};
