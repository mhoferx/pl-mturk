//call when document ready
$(document).ready(function() {

	//record start time
	getIfGlobalCookieExists('startTime', '0')
	if (startTime === 0) { 
		startTime = Date.now();
		Cookies.set('startTime', startTime, { path: '/' });
	}
	
	getIfGlobalCookieExists('environment', '0')
//	 you should not be here any more!!
	if (environment == 1000) { window.location.href = 'experiment-failed.html'; }
	else if (environment > 2) { window.location.href = 'page-comparison.html'; }		          	
	
	getIfGlobalCookieExists('c', 0);
	getIfGlobalCookieExists('firstTime', true);
	getIfGlobalCookieExists('choices', '[]');
	getIfGlobalCookieExists('correct', '[]');
	getIfGlobalCookieExists('totalWrong', '0');
	getJSONCookie('response_data', '[]');		         		          	
	getIfGlobalCookieExists('subjectID', '0');
	console.log('subjectID: ' + subjectID); 
	getIfGlobalCookieExists('changeType', '0');
	getIfGlobalCookieExists('format', '0');
	$("#description").append("<p>{{{description_format_"+['icon', 'std'][format]+"}}}</p>");

	replace_text('../txt/');
	
	//randomizations
	getIfGlobalCookieExists('rand_colors', -1);
	getIfGlobalCookieExists('rand_environment', -1);
	getIfGlobalCookieExists('rand_outcome', -1);
	getIfGlobalCookieExists('rand_test', -1);
	getIfGlobalCookieExists('probability_order', -1);
	
	//randomize question order
	getIfGlobalCookieExists('shuffle', 0); //shuffle questions
	if (shuffle === 0) {
		shuffle = shuffleArray([0,1,2]);
		Cookies.set('shuffle', shuffle, { path: '/' });
	}
	
	
	//load image and texts
	var img_path = 'alt_hospital_' + changeType + "_" + environment + '.png';
	var json_path = '../json/questions_' + changeType + "_" + rand_environment[environment] +'.json';
	var env_path = '../json/environment_' + changeType + '.json';
	var env_name = '';
	
	env_name = create_hospital('#image_container', env_path, format, environment, rand_outcome, rand_test, rand_colors, rand_environment, probability_order);
	
	$("#text_container").empty();
	$("#text_container").append("<p>Hospital " + (environment+1) + " is presented below. Note the letters 'H" + (environment+1) + "' next to the hospital.</p>")
		
	//load questions
	$.getJSON(json_path, function(question) {

		// function snippet to build question
		function build_question() {
			$("#info_text").empty();
			$('#q_title').html('<p><b>Question '+(c+1)+': </b>' + question[c].name + '</p>');
			$("#q_choices").empty();
			
			console.log("Shuffle: ", shuffle)
			
			for (i = 0; i < question[c].choices.length; i++) { 
				$("#q_choices").append("<input type='radio' name='q_radio' value='"+ shuffle[i] +"' /><label for='track'>");
				$("#q_choices").append(question[c].choices[shuffle[i]]);
				$("#q_choices").append("<br /></label>");
			}
			
			//replace text according to randomization!!!
			var out_index = [rand_outcome, 1-rand_outcome];
			var test_index = [rand_test, 1-rand_test];
			$('#q_form').children().each(function () {
			    for (it = 0; it < 2; it++) { 
				    $(this).html(function (i, html) {
				        return $(this).html().replace(outcome_vars[it], outcome_text[out_index[it]]);
				    }); 
				    $(this).html(function (i, html) {
				        return $(this).html().replace(test_vars[it], test_text[test_index[it]]);
				    });
				}
			});
			return true
		}
		
		// funciton to compile the JSON response array
		function compileResponseArray(choices, correct, env_id, endTime) {
			var tmp_question_array = [];
			var env_responses = {"envID" : env_id, "envName" : env_name, "startTime" : startTime, "endTime" : endTime, 'totalCorrect' : 0, 'questions' : 0};
			totRight = 0;
			for(var i=0; i<choices.length; i++){
			   var right = (choices[i] === correct[i] ? 1 : 0);
			   totRight += right;
			   var tmp_responses = {"questionID" : question[i].id, "choice" : choices[i], "correct" : correct[i], "point" : right};
			   tmp_question_array.push(tmp_responses);
			}
			
			env_responses.questions = tmp_question_array;
			env_responses.totalCorrect = totRight;
			return env_responses;
		}
		
		//initial build if reload and if c > 0...
		if (c > 0  || firstTime == false) {       
			build_question();	
		}
		
		//if question button submitted
		$("#question_btn").click(function(event) {
        	
	//      save results
			(function() {
				if ($("input[name=q_radio]:checked").val() && firstTime == false) {

					choices.push($('input[name=q_radio]:checked').attr("value"));
					Cookies.set('choices', JSON.stringify(choices), { path: '/' });
					
					correct.push(question[c].correct);
					Cookies.set('correct', JSON.stringify(correct), { path: '/' });
					
					shuffle = shuffleArray([0,1,2])
					Cookies.set('shuffle', shuffle, { path: '/' });
					
					c += 1;
					Cookies.set('c', c, { path: '/' });
//					console.log('C is now:' + c);
				}
			})();
		
	//		build question        
			if ($("input[name=q_radio]:checked").val() || firstTime == true) {
		        
//		          no more questions?
		          if (c >= question.length) {
						
						var saveFilePath = '../data/' + subjectID + '_results.txt';		
						$.get(saveFilePath, function(saveFile) {
							console.log('file retrieved!');
							var saveData = JSON.parse(saveFile);
							appendToRetrievedData(saveData)
						}).fail(function() {
							console.log('could not find file!!');
							appendToRetrievedData(0)
						});
						
						//save results
						function appendToRetrievedData(retrievedFile) {
							//count total wrong
							for(var i=0; i<choices.length; i++){
							   if (choices[i] != correct[i]) { totalWrong += 1;}
							}
							
							alert('You have answered all questions for this hospital!');
							console.log('No more questions! Answers: ' + choices.toString() + " Correct: " + correct.toString() + " Total of " + totalWrong + " wrong answers");
							
							//add data to response Array
							response_data.push(compileResponseArray(choices, correct, environment, Date.now()));	
							
							//saving HERE
							if (retrievedFile != 0) {
								console.log("Save file now!!");
								retrievedFile.expdata.bayesReason = response_data;
								saveSubjectData(retrievedFile, subjectID);
							}
							
							//reset all variables
							cookieList = ['c', 'choices', 'correct', 'shuffle', 'response_data', 'firstTime', 'startTime'];
							deleteCookiesByList(cookieList);
							
							//next environment
							environment += 1;
							Cookies.set('environment', environment, { path: '/' });
							Cookies.set('firstTime', true, { path: '/' });
							Cookies.set('response_data', JSON.stringify(response_data), { path: '/' });
						
							//experiment failed -> too many wrong answers
							if (totalWrong > max_wrong) {
								environment = 1000;
								Cookies.set('environment', environment, { path: '/' });
								window.location.href = 'experiment-failed.html';
								return false;
							} else if (environment < 3) { // load new environment
			          			console.log('next environment!!'); 
				          		window.location.href = '';
	//			          		location.reload();
								return true;
				          	} else { // no more environments/questions
				          		window.location.href = 'page-comparison.html';
				          		return true;
				          	}	
						}
		          }
		          
//		          add next question
				  else {
				  	 build_question();
				  	 if (firstTime == true) {
				  	 	  firstTime = false;
				  	 	  Cookies.set('firstTime', firstTime, { path: '/' });
				  	 }
				  }

		    // nothing selected?
		    } else {
		        alert('Please select something!');
		        return false;
		    } 
           
      });//close click
   }); //close getJSON
}); //close function ready
     
     