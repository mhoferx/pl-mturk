$(document).ready(function() {
	
	getIfGlobalCookieExists('success', false);
	if (success === true) {
		window.location.href = 'end.html';
	}

	getIfGlobalCookieExists('startTime', '0')
	if (startTime === 0) {
		startTime = Date.now();
		Cookies.set('startTime', startTime, { path: '/' });
	}
	
	//prevent forward and backward access to page
	var defaultText = 'Please provide a short explanation for why you chose that particular hospital.';
	
	getIfGlobalCookieExists('subjectID', '0');
	getIfGlobalCookieExists('changeType', '0');
	getIfGlobalCookieExists('format', '0');
	getIfGlobalCookieExists('choice', -1);
//	getIfGlobalCookieExists('textField', false);
	console.log('subjectID: ' + subjectID);
	
	//randomizations
	getIfGlobalCookieExists('rand_colors', -1);
	getIfGlobalCookieExists('rand_environment', -1);
	getIfGlobalCookieExists('rand_outcome', -1);
	getIfGlobalCookieExists('rand_test', -1);
	getIfGlobalCookieExists('probability_order', -1);
	
	function build_textfield() {
		$("#comment_box_textfield").html('<textarea id="answerField" rows="4" cols="96">'+defaultText+'</textarea>');
//		document.getElementsByName("q_change")[0].disabled = true;
//		document.getElementsByName("q_change")[1].disabled = true;
//		$('input:radio[name=q_change][value='+choice+']').prop('checked', true);
//		$("#comment_box").show();
	}
	
	build_textfield();
	replace_text('../txt/');
	
	//Create environments
	var env_path = '../json/environment_' + changeType + '.json';
	var env_name_array = [];
	for (k = 0; k < 3; k++) { 
		var image_id = "#env" + (k+1) + "_container";
		
		$(image_id).empty();
		env_name_array.push(create_hospital(image_id, env_path, format, k, rand_outcome, rand_test, rand_colors, rand_environment, probability_order));
	}
		
	$("#comparison_btn").click(function(event) {
			
		if ($('input[name=q_change]:checked').attr("value")) {
		    
		    inputText = document.getElementById("answerField").value;
		    console.log('Text Length: ', inputText.length);
		    choice = ($('input[name=q_change]:checked').attr("value"));
		    Cookies.set('choice', choice, { path: '/' });
		    
		    if (inputText.length > defaultText.length) { //also check if input long enough!!
		       	//load reasoning data
		       	var filePath = '../data/' + subjectID + '_results.txt';
		      
		       	$.get(filePath, function(saveFile) {
		        	console.log('file retrieved!');
		            saveRetrievedData(JSON.parse(saveFile));
		        }).fail(function() {
		           console.log('could not find file!!');
		    		saveRetrievedData(0);
		        });
		        
		        function saveRetrievedData(retrievedFile) {
		    		
		    	    var response_data = {"choiceID" : choice, "choiceName" : env_name_array[choice], 'startTime' : startTime, 'endTime' : Date.now(), 'textField' : inputText};
		    	    
		    	    //saving HERE
		    	    if (retrievedFile != 0) {
		    	    	console.log("Save file now!!");
		    	    	retrievedFile.expdata.plausibility = response_data;
		    	    	retrievedFile.metadata.completed = 'yes';
		    	    	saveSubjectData(retrievedFile, subjectID);
		    	    }
		    	    Cookies.set('success', true, { path: '/' });
		    	    window.location.href = 'end.html';
		        }
		        return false;
		    } else {
		        alert('Please provide more text!');
		        return false;
		    }
			return false;
	    } else {
	        alert('Please select one of the hospitals!');
	        return false;
	    }     
    });
	
	
	$("#text_btn").click(function(event) {
		
		
		var bla = $('#txt_name').val();
		
		//Set
		$('#txt_name').val('bla');
		
		
	});	 //2nd button
 }); //document ready
     
     