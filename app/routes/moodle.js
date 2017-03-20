var request = require('request');

exports.getToken=function(req,res){
	
var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
}
url=req.body.url+'/login/token.php?';
console.log(url);
var options = {
    url: url,
    method: 'GET',
    headers: headers,
    qs: {'username': req.body.username,
		 'password': req.body.password,
         'service':  req.body.service }
}

// Start the request
request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        // Print out the response body
        try {
        var response = JSON.parse(body);
        } catch (e) {
        // An error has occured, handle it, by e.g. logging it
        var msgAlert="Error al conectar. Compruebe URL.";
        res.render ('index',{msgAlert:msgAlert});
        console.log("Bad Url");
        }

        console.log(body);
        console.log(response['token']);
        var token=response['token'];
        if(response['token']==undefined){
        var msgAlert="Error. Compruebe Usuario y Contraseña";
        res.render ('index',{msgAlert:msgAlert});    
        }else{
        url=req.body.url+'/webservice/rest/server.php?wsfunction=core_course_get_courses&moodlewsrestformat=json&';
        console.log(url);
        var headers = {
        'User-Agent':       'Super Agent/0.0.1',
        'Content-Type':     'application/x-www-form-urlencoded'
        }
        var options = {
            url: url,
            method: 'GET',
            headers: headers,
            qs: {'wstoken': response['token']}
        }
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
            var courses=JSON.parse(body);
            var arrayCourses=[];
            for(i=0;i<courses.length;i++){
                console.log(courses[i]['id']+' - '+courses[i]['shortname']+'_'+courses[i]['fullname']);
                arrayCourses.push({id:courses[i]['id'],fullname:courses[i]['fullname']});
            }
            res.render('courses',{token:token,url:req.body.url,array:arrayCourses});     
            }
            else{
            var msgAlert="Error al conectar con Moodle. Compruebe la dirección web";
            res.render('index',{msgAlert:msgAlert});
            }
        });

 
        }
        
    }
    else{
        var msgAlert="Error al conectar con Moodle. Compruebe la dirección web";
        res.render('index',{msgAlert:msgAlert});
    }
});
};