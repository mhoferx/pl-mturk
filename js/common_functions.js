//globals
outcome_vars = ['{{A}}','{{B}}'];
test_vars = ['{{high}}','{{low}}'];
outcome_text = ['A','B'];
test_text = ['high','low'];
max_wrong = 15;

function place_hos(id_nametag, p_array, rand_colors, hosp_id, format, probability_order) {
	
	function fstr(x) {
		return Math.round(x * 100) + '%';
	}
	
	var img_path = '../img/h'+ hosp_id +'.png'; //path to hospital image
	var row_length = 20;
//	var icons = ['b','g','o','p'];
//	var icons = ['db','lb','dy','ly'];
	var icons = ['g1','g2','r1','r2']; //icon names
	var labels = [];
	for (var h = 0; h < 2; h++) {
		for (var j = 0; j < 2; j++) {
			labels.push(outcome_text[h] + ' and ' + test_text[j] +':');
		}
	}
	var pat_path = '../img/'; //path to patient images
	var img_box = 'img_box_' + hosp_id;
	var icon_box = 'icon_box' + hosp_id;
	var puffer = '';
	var standart_text = [];
	
	if (format === 1) { //standard prob
		puffer = 'style="margin-top: -10px"';
		format_path = '../txt/std_format.json';
		$.getJSON(format_path, function(format_file) {
			begin_placement(format_file);
			var assProbs = {
				"prior" : p_array[0],
				"like1" : p_array[1],
				"like2" : p_array[2],
				"prior_c" : 1-p_array[0],
				"like1_c" : 1-p_array[1],
				"like2_c" : 1-p_array[2]
			}
			for (key in assProbs) {
				if (!assProbs.hasOwnProperty(key)) {
			        continue;
			    }
			    eval('var rplc_with = fstr(assProbs.' + key +')');
				$('#' + icon_box).children().each(function () {
					$(this).html(function (i, html) {
					    return $(this).html().replace('{{'+key+'}}', rplc_with);
					});
				}); 
			}	
		});
		
	} else {
		begin_placement(0);
	}
	
	function begin_placement(standart_text) {
		$(id_nametag).append("<div id='"+img_box+"' class='image_div'></div>");
		$("#" + img_box).append('<img class="hosp_image" '+puffer+' src="' + img_path + '" alt="hospital">');
		
		$(id_nametag).append("<div id='"+icon_box+"' class='icon_div'></div>");
		
		for (i = 0; i < p_array.length; i++) {
			var current_row = "icon_row_"+hosp_id+"_"+i;
			var row_class = '';
			var tmp_string = '';
			
			if (format === 0) { //icon
				var patient = '<img class="icon" src="' + pat_path + icons[rand_colors[i]] +'.png">';
				for (j = 0; j < p_array[i]; j++) {
					if (j != 0 && j % row_length == 0) {
						tmp_string += "<br/>";
					}
					tmp_string += patient;
				}
				$("#" + icon_box).append("<div class='row'><div class='row_label'>"+labels[i]+"</div><div class='row_icons' id='"+current_row+"'>"+tmp_string+"</div></div>");
			
			} else if (format === 1) { //standard
				
				if (probability_order == 1) {
					mp_idx = [0,1,2]
				} else {
					mp_idx = [1,2,0]
				} 
				
				$("#" + icon_box).append("<div class='row row_text'>"+standart_text[mp_idx[i]]+"</div>");
			}
		}
		return true
	}
	return true
}
	

function create_hospital(id, env_path, format, environment, rand_outcome, rand_test, rand_colors, rand_environment, probability_order) {	
	env_name = '';
	$.getJSON(env_path, function(env_file) {
		var p_array = 0; // prepare p_array, consider randomizations
		if (format === 0) {
			var temp_array = [];
			for (var i = 0; i < 2; i++) {
				if (i===0) { 
					tmp_row = env_file[rand_environment[environment]].joint[rand_outcome];
				} else {
					tmp_row = env_file[rand_environment[environment]].joint[i-rand_outcome];
				}
				tmp_row = [tmp_row[rand_test], tmp_row[1-rand_test]];
				temp_array.push(tmp_row);
			}
			p_array = [].concat.apply([], temp_array);
		} else if (format === 1) {
			prior = env_file[rand_environment[environment]].prior;
			likelihood = env_file[rand_environment[environment]].likelihood;
			if (rand_outcome===1) { 
				prior = 1-prior; 
				likelihood = [likelihood[1], likelihood[0]];
			}
			if (rand_test===1) { 
				likelihood = [1-likelihood[0], 1-likelihood[1]];
			}
			p_array = [prior, likelihood[0], likelihood[1]];
		}
		$(id).empty();
		place_hos(id, p_array, rand_colors, environment, format, probability_order);
		env_name = env_file[rand_environment[environment]].envName;
	});
	console.log(env_name)
	return env_name;
}


//function to save the subject data as a JSON object
function saveSubjectData(array, subjectID, pref_path) {
	var pref_path = typeof pref_path !== 'undefined' ? pref_path : '../php/';
	var filename = 'save_responses.php';
	var file_path = pref_path + filename;
	var data_to_send = JSON.stringify(array, null, "\t");
	console.log('saving data with ID: ' + subjectID)
	jQuery.ajax({
	    type: "POST",
	    url: file_path,
	    dataType: 'json',
	    data: { sid: subjectID, data: data_to_send },
	    success: console.log("Save file sucessfully created!")
	});
}

// function to save (append) subject ID to text file
function saveSubjectID(subjectID, pref_path) {
	var pref_path = typeof pref_path !== 'undefined' ? pref_path : 'php/';
	var filename = 'save_id.php';
	var file_path = pref_path + filename;
	console.log('saving subject ID: ' + subjectID)
	jQuery.ajax({
	    type: "POST",
	    url: file_path,
	    dataType: 'json',
	    data: { sid: subjectID },
	    success: console.log("Subject ID file sucessfully appended/created!")
	});
}

// function to retrieve (ore creat) cookies 
function getIfGlobalCookieExists(name, value) {
	if (Cookies.get(name) == null) {
		eval(name + " = " + value + ";");
		Cookies.set(name, value, { path: '/' });
	} else {
		var tmpValue = Cookies.get(name);
		eval(name + " = " + tmpValue + ";");
	}
}

function deleteAllCookies() {
	allCookies = Cookies.get();
	for(var cookie in allCookies) {
	   Cookies.remove(cookie, { path: '/' });
	}
	console.log('ACTION: all cookies removed!'); 
}

function deleteCookiesByList(cookieList) {
	for (var l = 0; l < cookieList.length; l++) {
//		console.log("Delete by name: ", cookieList[l]);
		Cookies.remove(cookieList[l], { path: '/' });
	}
	console.log('Selected cookies removed!'); 
}

function getJSONCookie(name, value) {
	if (Cookies.get(name) == null) {
		eval(name + " = " + value + ";");
		Cookies.set(name, value, { path: '/' });
	} else {
		eval(name + " = JSON.parse(Cookies.get(name))");
	}
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

//call when document ready
function replace_text(rel_path) {
	console.log("Start replacing");
	text_file_path = rel_path +'text.json';
	$.getJSON(text_file_path, function(text_file) {		
		for (key in text_file) {
			if (!text_file.hasOwnProperty(key)) {
		        continue;
		    }
		    eval('var rpl_str = text_file.' + key);
		    
		    $('#wrapper').children().each(function () {
		        $(this).html(function (i, html) {
	        		return $(this).html().replace('{{{'+key+'}}}', rpl_str);
		        });
		        return true
		    });   
		}
	});
//	console.log("... replaced");
}