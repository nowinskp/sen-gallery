;(function( window, $, helpers ) {
	/**
	 * GET PARTIALS MAP
	 * @param  string templatePath - path to where the main template file and partials directory are located
	 * @param  string templateName - name of the main template file
	 * @return partials object:
	 *         -> partials.template - base template file (used for getPartialsMap())
	 *         -> partials.map      - partials map to be used as Mustache.js
	 *                                render() method 3rd param
	 */
	sen.getNamespace('sen.helpers').getPartialsMap = function( templatePath, templateName, fileExtension ) {

		var partialsNamesWithoutRepeats = [];
		var downloadedPartialFiles = {}

		if ( !fileExtension ) { fileExtension = '.mustache'; }
		var baseTemplate = templatePath + templateName + fileExtension;

		// trailingslashit
		templatePath = templatePath.replace(/\/?$/, '/');

		function getPartialFile( path ) {
			return Q.fcall(function(){
				if ( typeof(downloadedPartialFiles[path]) === 'undefined' ) {
					return $.get( path ).then(function(partialFile){
						downloadedPartialFiles[path] = partialFile;
						return partialFile;
					});
				} else {
					return downloadedPartialFiles[path];
				}
			});
		}

		function parsePartial( templatePath, templateName ) {
			return getPartialFile(templatePath + templateName + fileExtension).then(function(template){
					var nextPartialsToParse = [];
					var parsedTemplate = Mustache.parse(template);
					var onlyPartialNames = [];
					findPartialsInParsedTemplate(parsedTemplate, onlyPartialNames);
					onlyPartialNames.forEach(function(partial){
						if(partialsNamesWithoutRepeats.indexOf(partial) === -1){
							partialsNamesWithoutRepeats.push(partial);
							nextPartialsToParse.push(parsePartial(templatePath, partial));
						}
					});
					return Q.all(nextPartialsToParse);
				});
		}

		function findPartialsInParsedTemplate( parsedTemplate, foundList ) {
			parsedTemplate.forEach(function(template){
				if (template[0] === '>') {
					if (foundList.indexOf(template[1]) === -1) {
						foundList.push(template[1]);
					}
				} else if (template[0] === '#') {
					findPartialsInParsedTemplate(template[4], foundList);
				}
			});
			return foundList;
		}

		return parsePartial( templatePath, templateName ).then(function() {
			var partialsRequests = partialsNamesWithoutRepeats.map(function(partialName){
				return getPartialFile( templatePath + partialName + fileExtension );
			});

			var partialsMap = {};

			return Q.all(partialsRequests).then(function(partialsStrings){
		   	partialsNamesWithoutRepeats.forEach(function(name, partialIndex){
		      	partialsMap[name] = partialsStrings[partialIndex];
		   	});
		   	return {
		   		template: downloadedPartialFiles[baseTemplate],
		   		map: partialsMap
		   	};
			});
		});

	}

	window.sen.helpers.getPartialsMap = sen.helpers.getPartialsMap;


})( window, jQuery, sen.helpers );