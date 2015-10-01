;(function( window, $, helpers ) {
	/**
	 * GET PARTIALS MAP
	 * @param  string templatePath - path to where the main template file and partials directory are located
	 * @param  string templateName - name of the main template file
	 * @return {[type]}              [description]
	 */
	sen.getNamespace('sen.helpers').getPartialsMap = function( templatePath, templateName, fileExtension ) {

		var partialsNamesWithoutRepeats = [];

		if ( !fileExtension ) { fileExtension = '.mustache'; }

		// trailingslashit
		templatePath = templatePath.replace(/\/?$/, '/');
		
		function parsePartial( templatePath, templateName ) {
			return Q.fcall(function(){
					return $.get( templatePath + templateName + fileExtension );
				}).then(function(template){
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
				return $.get( templatePath + partialName + fileExtension );
			});

			var partialsMap = {};

			return Q.all(partialsRequests).then(function(partialsStrings){
		   	partialsNamesWithoutRepeats.forEach(function(name, partialIndex){
		      	partialsMap[name] = partialsStrings[partialIndex];
		   	});
		   	return partialsMap;
			});
		});

	}

	window.sen.helpers.getPartialsMap = sen.helpers.getPartialsMap;


})( window, jQuery, sen.helpers );