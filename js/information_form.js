//call when document ready
$(document).ready(function() {		
	
	getIfGlobalCookieExists('subjectID', '0');
	getIfGlobalCookieExists('finished', false);
	
	
	function close_window() {
		$("#dspr").empty();
		$("#dspr").append("<p>You can now close this window.</p>");
	}
	
	if (finished === true) {
		close_window();
	}
	
	var ageCheck = false;
	var genCheck = false;
	var eduCheck = false;
	
	$("#saveForm").click(function(event) {
		
		var age = ($("#age_field").val());
		var gen = ($("#gender_select").val());
		var edu = ($("#education_select").val());
		
		if (age > 0 && age < 100) { ageCheck = true; }
		if (gen !== -1) { genCheck = true; }
		if (edu !== -1) { eduCheck = true; }

		if (ageCheck && genCheck && eduCheck) {
			alert('Thank you!');	
			var filePath = '../data/' + subjectID + '_results.txt';
			 	$.get(filePath, function(saveFile) {
			  	console.log('file retrieved!');
			    appendData(JSON.parse(saveFile));
			  }).fail(function() {
			  	console.log('could not find file!!');
				appendData(0);
			});
			
			function appendData(retrievedFile) {
				close_window();
			    //saving HERE
			    if (retrievedFile != 0) {
			    	console.log("Save file now!!");
					var subject_info = {"age" : age, "gender" : gen, 'education' : edu};
					retrievedFile.metadata.subjectInfo = subject_info
			    	saveSubjectData(retrievedFile, subjectID);
			    }
			    Cookies.set('finished', true, { path: '/' });
//			    window.location.href = 'end.html';
			}	  		
		} else {
			$("#missing_info").html("<p id='red'>Missing information!</p>");
		}
	});	
});

     
     