//call when document ready
$(document).ready(function() {
	var id_length = 10; //length of identification number
	var C_type = ['low','medium','high']
	var form_text = ['Icon Array', 'Standard Probability Format'];
	
	replace_text('txt/');
	
	// manually set the chenge type
	$("#low_btn").click(function(event) { Cookies.set('changeType', 0, { path: '/' }); location.reload();});
	$("#med_btn").click(function(event) { Cookies.set('changeType', 1, { path: '/' }); location.reload();});
	$("#hig_btn").click(function(event) { Cookies.set('changeType', 2, { path: '/' }); location.reload();});
	
	$("#form1_btn").click(function(event) { Cookies.set('format', 0, { path: '/' }); location.reload();});
	$("#form2_btn").click(function(event) { Cookies.set('format', 1, { path: '/' }); location.reload();});
	
	// clear sid cookie
	$("#clear_sid_btn").click(function(event) {
//		Cookies.remove('subjectID', { path: '/' });
		deleteAllCookies();
		location.reload();
	});
	
	//Conditions--Level of Change
	getIfGlobalCookieExists('changeType', -1);
	if (changeType === -1) {
		changeType = Math.floor((Math.random() * 3));
		Cookies.set('changeType', changeType, { path: '/' });
	}
	
	//Conditions--presentation format
	getIfGlobalCookieExists('format', -1);
	if (format === -1) {
		format = Math.floor((Math.random() * 2));
		Cookies.set('format', format, { path: '/' });
	}
	
	//Conditions--presentation format
	getIfGlobalCookieExists('probability_order', -1);
	if (probability_order === -1) {
		probability_order = Math.floor((Math.random() * 2));
		Cookies.set('probability_order', probability_order, { path: '/' });
	}
	
//	$("#subject_id").append('<p>Change type: <b>' + C_type[changeType] + '</b></p>');
	console.log('changeType: ' + changeType);	
		
	//randomize colors 4 * 3 * 2 * 1 = 24 alternatives
	getIfGlobalCookieExists('rand_colors', -1);
	var constrained = true;
	if (rand_colors === -1) {
		if (constrained===true) {
			rOt = Math.floor((Math.random() * 2));
			rFt = Math.floor((Math.random() * 2));
			tmp_Arr = [[rOt, 1-rOt], [rOt+2, 3-rOt]]; 
			rand_colors = [tmp_Arr[rFt], tmp_Arr[1-rFt]];
			rand_colors = [].concat.apply([], rand_colors);
			Cookies.set('rand_colors', rand_colors, { path: '/' });	
		} else {
			rand_colors = shuffleArray([0,1,2,3]);
			Cookies.set('rand_colors', rand_colors, { path: '/' });	
		}
	}
	console.log('Color randomization: ', rand_colors);
	
	//prior or likelihood first?
	getIfGlobalCookieExists('rand_environment', -1);
	if (rand_environment === -1) {
		rand_environment = [0];
		rand_environment = rand_environment.concat(shuffleArray([1,2]));	
		Cookies.set('rand_environment', rand_environment, { path: '/' });
	}
	console.log('Environment randomization: ', rand_environment);
	
	//change A/B
	getIfGlobalCookieExists('rand_outcome', -1);
	if (rand_outcome === -1) {
		rand_outcome = Math.floor((Math.random() * 2));
		Cookies.set('rand_outcome', rand_outcome, { path: '/' });
	}
	console.log('Flip outcomes?: ', rand_outcome);
	
	//change high/low
	getIfGlobalCookieExists('rand_test', -1);
	if (rand_test === -1) {
		rand_test = Math.floor((Math.random() * 2));
		Cookies.set('rand_test', rand_test, { path: '/' });
	}
	console.log('Flip feature?: ', rand_test);
	
	
	//get subject list to check if number already exists
	$.get("data/_sids.txt", function(sid_list){ 
	    console.log('file retrieved!');
	    console.log(sid_list.split("\n"));
	    createSID(sid_list.split("\n"));
	}).fail(function() {
	    console.log('could not find file!!');
	    createSID(['']);
	});

	function createSID(sid_list) {
		if (Cookies.get('subjectID') == null) {
			console.log('CREATE NEW SUBJECT ID!');
			do {
				sid = '';
				sid = sid + ''  + Math.floor((Math.random() * 9) + 1);
			    for(var i=0; i<id_length-1; i++) {
			    	sid = sid + ''  + Math.floor((Math.random() * 10));
			    }
			}
			while ($.inArray(sid, sid_list) != -1);
	
			Cookies.set('subjectID', sid, { path: '/' });
			saveSubjectID(sid);
			
			//save data to file
			var env_path = 'json/environment_' + changeType + '.json';
			$.getJSON(env_path, function(env_file) {
				
				var probabilities = [];
				for (i = 0; i < env_file.length; i++) {
					var env = {"id" : env_file[i].id, "name" : env_file[i].name, "prior" : env_file[i].prior, "likelihood" : env_file[i].likelihood};
					probabilities.push(env);
				}
				
				var randomizations = {"environments" : rand_environment,"colors" : rand_colors, "outcome" : rand_outcome, "test" : rand_test};
				
				var pretty_time = (new Date).toISOString().replace(/z|t/gi,' ').trim();
		
				var metadata = {"expName" : "prior-likelihood change: mturk study v0.9", "time" : pretty_time, "subjectID" : sid, "subjectInfo" : 0, "changeLevel" : changeType, "envProbabilities" : probabilities, "randomizations" : randomizations , "startTimeStamp" : Date.now(), "endTimeStamp" : 0, "completed" : "no"};
				
				var expdata = {"bayesReason" : 0, "plausibility" : 0};
				var saveFile = {"metadata" : metadata, "expdata" : expdata};
				saveSubjectData(saveFile, sid, 'php/');
				console.log('Data succesfully saved to file!:');
			});
			
		} else {
			sid = Cookies.get('subjectID');
		}
		console.log('subject ID: ' + sid);
		$("#subject_id").append('<p>Your subject ID is: <b>' + sid + '</b></p>');	
		$("#subject_id").append('<p>Presentation format: <b>' + form_text[format] + '</b></p>');	
	} //close function createSID
}); //close function ready

