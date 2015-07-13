$(document).ready(function(){
  // Create simple UI to interact with movie
    
    var delay;

    var currentPos = {line:0,ch:0};
    var commands = initialScript;
    var recording = true;
    var initialContent = '<!doctype html>\n<html lang="en">\n<head>\n<style>\n\n</style>\n</head>\n<body>\n    |\n</body>\n</html>';
    $('.html').val(initialContent);
    $('.html').change(function(e){
    	thisMovie = initializeMovie();
    })
	var parseCommandsToText = function(comm){
		var stringVersion = ""
		for(i=0; i<commands.length; i++){
			stringVersion = stringVersion + commands[i]['action']+': '+JSON.stringify(commands[i]['arguments'])+'\n';
		}
		return stringVersion;
	}

    var initializeMovie = function(){
    	$('.CodeMirror').remove();
    	 
    	$('#code').val($('.html').val()+"\n@@@\n"+parseCommandsToText(commands))
    	var movie = CodeMirror.movie('code');
   		$('.script').text('@@@\n'+parseCommandsToText(commands));
   		 movie.on('stop', function(cm, evt){
   		 	console.log('stopped');
   		 	$('#recordingIndicator').text('Recording');
   		 	$('#recordingIndicator').attr('data-recording','yes');
   		 });
   		 movie.on('play', function(cm,evt){
   		 	$('#recordingIndicator').text('Not Recording');
   		 	$('#recordingIndicator').attr('data-recording','no');
   		 });
   		 movie._editor.on("change", function(cm, evt) {
   		 	if(movie.state() == 'idle'){
		    	var startPos = evt.to;
		    	var endPos = evt.from; //this seems backwards but is correct I think.
		    	var removed = evt.removed;
		    	var added = evt.text;
		    	var type = evt.origin;
		    	moveCursorIfNecessary(startPos);
		    	if(type == "+delete"){
		    		handleRemoveSection(removed);
				    currentPos.line = endPos.line;
				    currentPos.ch = endPos.ch;
			    }
		    	if(type == "+input"){
		    		handleRemoveSection(removed);
			    	for(var i=0; i<added.length; i++){
			    		if(added[i].length != 0){
				    		commands.push({action:'type', arguments:{text:added[i]}});
				    		currentPos.ch = endPos.ch + added[i].length;
				    	}
			    		if(i !== added.length-1){
			    			commands.push({action:'type', arguments:{text:"\n"}});
			    			currentPos.line = currentPos.line + 1;
			    			currentPos.ch = 0;
			    		}
				    }
				}
				commands = collapseSteps(commands);
		    	var stringVersion = parseCommandsToText(commands);
		    	console.log(stringVersion);
		    	console.log(evt);
		    	$('.script').text(stringVersion)
		    }
	      clearTimeout(delay);
	      delay = setTimeout(function(){
	      	var previewFrame = document.getElementById('preview');
	        var preview =  previewFrame.contentDocument ||  previewFrame.contentWindow.document;
	        preview.open();
	        preview.write(movie._editor.getValue());
	        preview.close();
	      }, 300);
	    });
		return movie;
   	}
   	var thisMovie = initializeMovie();
    //Function to sync the iframe and the CodeMirror editor.
     //adds a moveTo command and updates the position.
     var moveCursorIfNecessary = function(newPos){
     	if(newPos.line != currentPos.line || newPos.ch != currentPos.ch){
     		commands.push({action:'moveTo', arguments:{pos:newPos.line+":"+newPos.ch}});
     		currentPos.line = newPos.line;
     		currentPos.ch = newPos.ch;
    	}
     }
     //deletes n characters.
     var deleteCharacters = function(nChar){
     	if(nChar > 1){
     		commands.push({action:'run',arguments:{command:'delCharBefore', times:(""+nChar)}})	

     	}
     	else{
     		commands.push({action:'run',arguments:{command:'delCharBefore'}})	
     	}
     	
     }

     //Collapses steps to make the script faster.
     var collapseSteps = function(steps){
		var toRet = []
		toRet.push(steps[0])
		for(var i=1; i<steps.length; i++){
			var thisStep = steps[i];
			var lastStep = toRet[toRet.length -1];
			if(lastStep['action'] == thisStep['action']){
				if(thisStep['action'] == 'run'){
					if(thisStep['arguments']['command'] == lastStep['arguments']['command']){
						if(lastStep['arguments']['times']){
							lastStep['arguments']['times'] = ""+ (parseInt(lastStep['arguments']['times'])+1);
							toRet[toRet.length -1] = lastStep;
							continue;
						}
						else{
							lastStep['arguments']['times'] = "2";
							toRet[toRet.length -1] = lastStep;	
							continue;
						}
					}
				}
				if(thisStep['action'] == 'type'){
					lastStep['arguments']['text'] = lastStep['arguments']['text'] + thisStep['arguments']['text'];
					toRet[toRet.length -1] = lastStep;
					continue;
				}
			}
			toRet.push(thisStep);
		}
		return toRet;
	}
	//We need to remove stuff on both +delete and +input... for some reason.
	var handleRemoveSection = function(removed){
		var totalRemoved = 0;
		for(var i=0; i<removed.length; i++){
	    	if(removed[i].length != 0){
	    		deleteCharacters(removed[0].length)
	    		totalRemoved+=removed[0].length;
	    	}
	    	if(i !== removed.length-1){
	    		deleteCharacters(1);
	    		totalRemoved+=1;
	    	}
	    }
	    return totalRemoved;
	}
   
   

   $('#clear').click(function(e){
   	e.preventDefault();
   	commands = [];
   	initializeMovie();
   	// $('.script').text(initialContent+"\n"+parseCommandsToText(commands));

   });
   // $('#record').click(function(e){
   // 	e.preventDefault();
   // 	if($(this).attr('data-recording') == 'no'){
   // 		// commands = [];
   // 		// thisMovie = initializeMovie();
   // 		recording = true;
   // 		$(this).attr('data-recording', "yes");
   // 		$(this).text('Stop Recording');
   // 	}
   // 	else{
   // 		// console.log(commands);
   // 	   	// thisMovie = initializeMovie();
	  //  	recording = false;
	  //  	$(this).attr('data-recording', "no");
	  //  	$(this).text('Start Recording');
   // 	}
   	
   // })
	
    $('a.btn.playBtn').click(function(e){
	    e.preventDefault();
	    console.log(commands);
	    var btn = $(this);
	    thisMovie = initializeMovie();
	    thisMovie.play();
	    // movie.play();
	  });
  //Handle playing the previously saved script.

});