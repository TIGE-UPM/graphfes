var request = require('request');
var fs = require('fs');
var htmlToText = require('html-to-text');
var PHPUnserialize = require('php-unserialize');
var et = require('elementtree');


exports.buildGraph = function(req, res) {
    //Llamada a la función getUsers para obtener los nodos
    getUsers(req, function(arrayUsers) {
        console.log("Se ha terminado de obtener los usuarios matriculados en el curso");
        //Llamada a la funcion para adquirir datos de logs y posts
        getForums(req, function(arrayForums) {
            console.log("Se ha terminado de obtener los foros del curso");
            console.log("Buscando en logs antiguos");
            getLogsLegacy(req, function(arrayLegacyData) {
                console.log("Se ha terminado de obtener datos de logs antiguos");
                console.log("Buscando en logs nuevos");
                getLogs(req, function(arrayData) {
                    console.log("Se ha terminado de obtener datos de logs nuevos");
                    //Concat Legacy Logs and new logs.
                    var arrayViewed = arrayLegacyData[0].concat(arrayData[0]);
                    var arrayPosts = arrayLegacyData[1].concat(arrayData[1]);
                    //All arrays in one
                    var array = [arrayViewed, arrayPosts, arrayUsers, arrayForums, req];
                    console.log("Todos los datos adquiridos...generando grafo");
                    //Check if the course has any forum
                    if (arrayForums.length == 0) {
                        res.render('grafo', {
                            message: 'Curso sin foros. No se han generado grafos.'
                        });
                    }
                    //Check if the course has logs 
                    if (arrayPosts.length != 0 || arrayViewed.length != 0) {
                        //Generate the view graph
                        viewsGraph(array);
                        //Generate the responses graph
                        responsesGraph(array);
                        //Generate messages graph
                        messageGraph(array);
                        res.redirect('history?token=' + req.body.token);
                    } else {
                        res.render('grafo', {
                            message: 'Curso sin logs activos. No se han generado grafos. Vuelva a iniciar sesión'
                        });
                    }
                });
            });
        });
    });
}

//Function to get Users by courseid
getUsers = function(req, res) {
    var headers = {
        'User-Agent': 'Super Agent/0.0.1',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    var url = req.body.url + '/webservice/rest/server.php?wsfunction=core_enrol_get_enrolled_users&courseid=' + req.body.id + '&moodlewsrestformat=json';
    //console.log(req.body.courses[2]['id']);
    //console.log(url);
    var options = {
            url: url,
            method: 'GET',
            headers: headers,
            qs: {
                'wstoken': req.body.token
            }
        }
        // Start the request
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            var array = [];
            var response = JSON.parse(body);
            for (i = 0; i < response.length; i++) {
                array.push({
                    id: response[i]['id'],
                    fullname: response[i]['fullname']
                });
            }
            //console.log(array);
            res(array);
        }
    });
}

//Function to get Forums by courseid
getForums = function(req, res) {
    var headers = {
        'User-Agent': 'Super Agent/0.0.1',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    var url = req.body.url + '/webservice/rest/server.php?wsfunction=mod_forum_get_forums_by_courses&courseids[0]=' + req.body.id + '&moodlewsrestformat=json';
    console.log(req.body.token);
    console.log(url);
    var options = {
            url: url,
            method: 'GET',
            headers: headers,
            qs: {
                'wstoken': req.body.token
            }
        }
        // Start the request
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            var array = [];
            var response = JSON.parse(body);
            for (i = 0; i < response.length; i++) {
                array.push({
                    id: response[i]['id'],
                    name: response[i]['name'],
                    cmid: response[i]['cmid']
                });
            }
            //console.log(array);
            res(array);
        }
    });
}


//funcion para obtener informacion de los post
getLogs = function(req, res) {
    var headers = {
        'User-Agent': 'Super Agent/0.0.1',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    var url = req.body.url + '/webservice/rest/server.php?wsfunction=local_graphFES_reportAll&courseids[0]=' + req.body.id + '&moodlewsrestformat=json';
    var options = {
            url: url,
            method: 'GET',
            headers: headers,
            qs: {
                'wstoken': req.body.token
            }
        }
        // Start the request
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            console.log("Solicitando logs del curso...");
            var arrayViewed = [];
            var arrayDiscussions = [];
            var arrayPosts = [];
            var respuesta = JSON.parse(body);
            console.log("Buscando posts subidos...");
            console.log("Relacionando cada usuario con los posts...");
            console.log("Buscando visualizaciones de los posts...");

            for (i = 0; i < respuesta.length; i++) {
                //Array con las discusiones del curso que tienen posts     
                if (respuesta[i]['action'] == 'created' && respuesta[i]['target'] == 'discussion') {
                    var other = respuesta[i]['other'].replace(/(\r\n|\n|\r)/gmi, "  ");
                    //console.log("Se ha encontrado una discusion con id: "+respuesta[i]['objectid']);
                    //console.log(other);
                    other = PHPUnserialize.unserialize(other);
                    arrayDiscussions.push({
                        discussionid: respuesta[i]['objectid'],
                        forumid: other['forumid']
                    });
                }

                if (respuesta[i]['action'] == 'viewed' && respuesta[i]['target'] == 'discussion') {
                    //console.log("El usuario "+respuesta[i]['userid']+" ha visto el post "+respuesta[i]['objectid']);
                    arrayViewed.push({
                        userid: respuesta[i]['userid'],
                        objectid: respuesta[i]['objectid'],
                        timecreated: respuesta[i]['timecreated']
                    });
                }
            }
            //Array con los post de los Usuarios
            var completed_requests = 0;
            var responsesPosts = [];
            if (arrayDiscussions.length == 0) {
                res([arrayViewed, arrayPosts]);
            }
            for (j = 0; j < arrayDiscussions.length; j++) {
                //console.log(j);
                var optionsDiscussions = {
                    url: req.body.url + '/webservice/rest/server.php?wsfunction=mod_forum_get_forum_discussion_posts&moodlewsrestformat=json',
                    method: 'GET',
                    headers: headers,
                    qs: {
                        'wstoken': req.body.token,
                        'discussionid': arrayDiscussions[j]['discussionid']
                    }
                }
                request(optionsDiscussions, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        completed_requests++;
                        var respuesta = JSON.parse(body);
                        responsesPosts.push(respuesta);
                    }
                    if (completed_requests == arrayDiscussions.length) {
                        console.log("Ya estan hechas las request de posts");
                        //console.log(JSON.stringify(responsesPosts));
                        for (n = 0; n < responsesPosts.length; n++) {
							try{
								for (k = 0; k < responsesPosts[n]['posts'].length; k++) {
									var forumid = 'n/a';
									for (f = 0; f < arrayDiscussions.length; f++) {
										if (arrayDiscussions[f]['discussionid'] == responsesPosts[n]['posts'][k]['discussion']) {
											forumid = arrayDiscussions[f]['forumid'];
											break;
										}
									}
									arrayPosts.push({
										id: responsesPosts[n]['posts'][k]['id'],
										discussion: responsesPosts[n]['posts'][k]['discussion'],
										userid: responsesPosts[n]['posts'][k]['userid'],
										userfullname: responsesPosts[n]['posts'][k]['userfullname'],
										subject: responsesPosts[n]['posts'][k]['subject'],
										created: responsesPosts[n]['posts'][k]['created'],
										message: responsesPosts[n]['posts'][k]['message'],
										parent: responsesPosts[n]['posts'][k]['parent'],
										forumid: forumid
									});
								}
							}
							catch (e) {
								console.log(e.message);
							}				
						}
                        //console.log(arrayPosts);
                        res([arrayViewed, arrayPosts]);
                    }
                });
            }


        }
    });
}



//Function to get information of Legacy Logs
getLogsLegacy = function(req, res) {
    var headers = {
        'User-Agent': 'Super Agent/0.0.1',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    var url = req.body.url + '/webservice/rest/server.php?wsfunction=local_graphFES_reportAllLegacy&courseids[0]=' + req.body.id + '&moodlewsrestformat=json';
    var options = {
            url: url,
            method: 'GET',
            headers: headers,
            qs: {
                'wstoken': req.body.token
            }
        }
        // Start the request
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            console.log("Solicitando logs del curso...");
            var arrayViewed = [];
            var arrayDiscussions = [];
            var arrayPosts = [];
            var respuesta = JSON.parse(body);
            console.log("Buscando posts subidos...");
            console.log("Relacionando cada usuario con los posts...");
            console.log("Buscando visualizaciones de los posts...");

            for (i = 0; i < respuesta.length; i++) {
                //Array con las discusiones del curso que tienen posts     
                if (respuesta[i]['action'] == 'add discussion') {
                    //if(arrayDiscussions.indexOf(respuesta[i]['info'])==-1){
                    arrayDiscussions.push();
                    arrayDiscussions.push({
                        discussionid: respuesta[i]['info'],
                        forumid: respuesta[i]['cmid']
                    });
                    //} 
                }

                //Array con las discusiones vistas por los usuarios
                if (respuesta[i]['action'] == 'view discussion') {
                    //console.log("El usuario "+respuesta[i]['userid']+" ha visto el post "+respuesta[i]['cmid']);
                    arrayViewed.push({
                        userid: respuesta[i]['userid'],
                        objectid: respuesta[i]['info'],
                        timecreated: respuesta[i]['time']
                    });
                }
            }

            //Array con los post de los Usuarios
            var completed_requests = 0;
            var responsesPosts = [];
            if (arrayDiscussions.length == 0) {
                res([arrayViewed, arrayPosts]);
            }
            for (j = 0; j < arrayDiscussions.length; j++) {
                //console.log(j);
                var optionsDiscussions = {
                    url: req.body.url + '/webservice/rest/server.php?wsfunction=mod_forum_get_forum_discussion_posts&moodlewsrestformat=json',
                    method: 'GET',
                    headers: headers,
                    qs: {
                        'wstoken': req.body.token,
                        'discussionid': arrayDiscussions[j]['discussionid']
                    }
                }
                request(optionsDiscussions, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        completed_requests++;
                        var respuesta = JSON.parse(body);
                        responsesPosts.push(respuesta);
                    }
                    if (completed_requests == arrayDiscussions.length) {

                        console.log("Ya estan hechas las request de posts");
                        //console.log(JSON.stringify(responsesPosts));
                        for (n = 0; n < responsesPosts.length; n++) {
							try{
								for (k = 0; k < responsesPosts[n]['posts'].length; k++) {
									var forumid = 'n/a';
									for (f = 0; f < arrayDiscussions.length; f++) {
										if (arrayDiscussions[f]['discussionid'] == responsesPosts[n]['posts'][k]['discussion']) {
											forumid = arrayDiscussions[f]['forumid'];
											break;
										}
									}
									//console.log(responsesPosts[n]['posts']);
									arrayPosts.push({
										id: responsesPosts[n]['posts'][k]['id'],
										discussion: responsesPosts[n]['posts'][k]['discussion'],
										userid: responsesPosts[n]['posts'][k]['userid'],
										userfullname: responsesPosts[n]['posts'][k]['userfullname'],
										subject: responsesPosts[n]['posts'][k]['subject'],
										created: responsesPosts[n]['posts'][k]['created'],
										message: responsesPosts[n]['posts'][k]['message'],
										parent: responsesPosts[n]['posts'][k]['parent'],
										forumid: forumid
									});
								}
							}
							catch(e) {
								console.log(e.message);						
							}
                        }
                        //console.log(arrayPosts);
                        res([arrayViewed, arrayPosts]);

                    }


                });
            }


        }
    });
}


viewsGraph = function(array) {
    var arrayViewed = array[0];
    var arrayPosts = array[1];
    var arrayUsers = array[2];
    var req = array[4];
    //Creacion del archivo XML
    var XML = et.XML;
    var ElementTree = et.ElementTree;
    var element = et.Element;
    var subElement = et.SubElement;
    //Cabeceras del xml
    var gexf = element('gexf');
    gexf.set('xmlns', 'http://www.gexf.net/1.2draft');
    gexf.set('version', '1.2');
    var graph = subElement(gexf, 'graph');
    graph.set('mode', 'static');
    graph.set('defaultedgetype', 'directed');
    //setting attributes
    var attributes = subElement(graph, 'attributes');
    attributes.set('class', 'node');
    var attribute = subElement(attributes, 'attribute');
    attribute.set('id', '0');
    attribute.set('title', 'username');
    attribute.set('type', 'string');

    //Creación de los nodos
    var nodes = subElement(graph, 'nodes');
    for (i = 0; i < arrayUsers.length; i++) {
        var node = subElement(nodes, 'node');
        node.set('id', arrayUsers[i]['id']);
        var attvalues = subElement(node, 'attvalues');
        var attvalue = subElement(attvalues, 'attvalue');
        attvalue.set('for', '0');
        attvalue.set('value', arrayUsers[i]['fullname']);
    }
    //Creación de las aristas
    var edges = subElement(graph, 'edges');
    var id = 0;

    for (i = 0; i < (arrayViewed.length); i++) {
        for (j = 0; j < arrayPosts.length; j++) {
            if ((arrayPosts[j]['discussion'] == arrayViewed[i]['objectid']) && (arrayPosts[j]['created'] < arrayViewed[i]['timecreated'])) {
                var edge = subElement(edges, 'edge');
                edge.set('id', id);
                edge.set('source', arrayViewed[i]['userid']);
                edge.set('target', arrayPosts[j]['userid']);
                edge.set('label', arrayViewed[i]['userid'] + '->' + arrayPosts[j]['userid']);
                id++;
                //console.log(id); 
            }
        }
    }

    etree = new ElementTree(gexf);
    xml = etree.write({
        'xml_declaration': true
    });
    //console.log(xml);
    //console.log("XML de vistas completado...");
    var date = Date.now();
    fs.writeFile(__dirname + '/../graphs/Vistas_' + date + '.gexf', xml.toString({
        pretty: true
    }), function(err) {
        if (err) throw err;
        console.log('Archivo Vistas.gexf creado.');
    });

    var history = require('../history.json');
    console.log(req.body.array);
    dateDay = new Date(date).toString();
    var myGraph = {
        url: req.body.url,
        courseid: req.body.id,
        date: dateDay,
        type: 'Views',
        typeImg: 'views.png',
        token: req.body.token,
        filename: 'Vistas_' + date + '.gexf'
    }

    history.list.push(myGraph);

    console.log(history);

    fs.writeFile('history.json', JSON.stringify(history, null, 4), function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log("JSON saved to " + 'history.json');
        }
    });

}

responsesGraph = function(array) {
    console.log("respuestas");
    var arrayViewed = array[0];
    var arrayPosts = array[1];
    var arrayUsers = array[2];
    var req = array[4];
    var arrayUsersPosts = [];
    //calcular el numero de post escritos
    for (i = 0; i < arrayUsers.length; i++) {
        var init = 0;
        var responses = 0;
        var total = 0;
        for (j = 0; j < arrayPosts.length; j++) {
            if (arrayPosts[j]['userid'] == arrayUsers[i]['id']) {
                if (arrayPosts[j]['parent'] == 0) {
                    init++;
                } else {
                    responses++;
                }
            }
        }
        total = init + responses;
        arrayUsersPosts.push({
            id: arrayUsers[i]['id'],
            fullname: arrayUsers[i]['fullname'],
            initPosts: init,
            responsesPosts: responses,
            totalPosts: total
        });
    }

    //console.log(arrayUsersPosts);   
    //Creacion del archivo XML
    var XML = et.XML;
    var ElementTree = et.ElementTree;
    var element = et.Element;
    var subElement = et.SubElement;
    //Cabeceras del xml
    var gexf = element('gexf');
    gexf.set('xmlns', 'http://www.gexf.net/1.2draft');
    gexf.set('version', '1.2');
    var graph = subElement(gexf, 'graph');
    graph.set('mode', 'static');
    graph.set('defaultedgetype', 'directed');
    //setting attributes
    var attributes = subElement(graph, 'attributes');
    attributes.set('class', 'node');
    var attribute = subElement(attributes, 'attribute');
    attribute.set('id', '0');
    attribute.set('title', 'username');
    attribute.set('type', 'string');
    var attribute = subElement(attributes, 'attribute');
    attribute.set('id', '1');
    attribute.set('title', 'initPosts');
    attribute.set('type', 'integer');
    var attribute = subElement(attributes, 'attribute');
    attribute.set('id', '2');
    attribute.set('title', 'responsesPosts');
    attribute.set('type', 'integer');
    var attribute = subElement(attributes, 'attribute');
    attribute.set('id', '3');
    attribute.set('title', 'totalPosts');
    attribute.set('type', 'integer');

    //Creación de los nodos
    var nodes = subElement(graph, 'nodes');
    for (i = 0; i < arrayUsersPosts.length; i++) {
        var node = subElement(nodes, 'node');
        node.set('id', arrayUsersPosts[i]['id']);
        var attvalues = subElement(node, 'attvalues');
        var attvalue = subElement(attvalues, 'attvalue');
        attvalue.set('for', '0');
        attvalue.set('value', arrayUsersPosts[i]['fullname']);
        var attvalue = subElement(attvalues, 'attvalue');
        attvalue.set('for', '1');
        attvalue.set('value', arrayUsersPosts[i]['initPosts']);
        var attvalue = subElement(attvalues, 'attvalue');
        attvalue.set('for', '2');
        attvalue.set('value', arrayUsersPosts[i]['responsesPosts']);
        var attvalue = subElement(attvalues, 'attvalue');
        attvalue.set('for', '3');
        attvalue.set('value', arrayUsersPosts[i]['totalPosts']);
    }
    //Creación de las aristas
    var edges = subElement(graph, 'edges');
    var id = 0;
    for (i = 0; i < arrayPosts.length; i++) {
        for (j = 0; j < arrayPosts.length; j++) {
            if (arrayPosts[i]['parent'] == arrayPosts[j]['id']) {
                var edge = subElement(edges, 'edge');
                edge.set('id', id);
                edge.set('source', arrayPosts[i]['userid']);
                edge.set('target', arrayPosts[j]['userid']);
                edge.set('label', arrayPosts[i]['userid'] + '->' + arrayPosts[j]['userid']);
                id++;
            }
        }
    }

    etree = new ElementTree(gexf);
    xml = etree.write({
        'xml_declaration': true
    });
    //console.log(xml);
    var date = Date.now();
    fs.writeFile(__dirname + '/../graphs/Respuestas_' + date + '.gexf', xml.toString({
        pretty: true
    }), function(err) {
        if (err) throw err;
        console.log('Archivo Respuestas.gexf creado.');
    });
    var history = require('../history.json');
    console.log(req.body.array);
    dateDay = new Date(date).toString();
    var myGraph = {
        url: req.body.url,
        courseid: req.body.id,
        date: dateDay,
        type: 'Replies',
        typeImg: 'responses.png',
        token: req.body.token,
        filename: 'Respuestas_' + date + '.gexf'
    }

    history.list.push(myGraph);

    console.log(history);

    fs.writeFile('history.json', JSON.stringify(history, null, 4), function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log("JSON saved to " + 'history.json');
        }
    });
}

messageGraph = function(array) {
    console.log("message");
    var arrayViewed = array[0];
    var arrayPosts = array[1];
    var arrayUsers = array[2];
    var arrayForums = array[3];
    var req = array[4];
    //console.log(arrayPosts);   
    //Creacion del archivo XML
    var XML = et.XML;
    var ElementTree = et.ElementTree;
    var element = et.Element;
    var subElement = et.SubElement;
    //Cabeceras del xml
    var gexf = element('gexf');
    gexf.set('xmlns', 'http://www.gexf.net/1.2draft');
    gexf.set('version', '1.2');
    var graph = subElement(gexf, 'graph');
    graph.set('mode', 'static');
    graph.set('defaultedgetype', 'directed');
    //setting attributes
    var attributes = subElement(graph, 'attributes');
    attributes.set('class', 'node');
    var attribute = subElement(attributes, 'attribute');
    attribute.set('id', '0');
    attribute.set('title', 'postid');
    attribute.set('type', 'integer');
    var attribute = subElement(attributes, 'attribute');
    attribute.set('id', '1');
    attribute.set('title', 'message');
    attribute.set('type', 'string');
    var attribute = subElement(attributes, 'attribute');
    attribute.set('id', '2');
    attribute.set('title', 'timestamp');
    attribute.set('type', 'long');
    var attribute = subElement(attributes, 'attribute');
    attribute.set('id', '3');
    attribute.set('title', 'userid');
    attribute.set('type', 'integer');
    var attribute = subElement(attributes, 'attribute');
    attribute.set('id', '4');
    attribute.set('title', 'username');
    attribute.set('type', 'string');
    var attribute = subElement(attributes, 'attribute');
    attribute.set('id', '5');
    attribute.set('title', 'postname');
    attribute.set('type', 'string');
    var attribute = subElement(attributes, 'attribute');
    attribute.set('id', '6');
    attribute.set('title', 'forumid');
    attribute.set('type', 'integer');
    var attribute = subElement(attributes, 'attribute');
    attribute.set('id', '7');
    attribute.set('title', 'forumname');
    attribute.set('type', 'string');
    //Creación de los nodos
    var nodes = subElement(graph, 'nodes');
    for (i = 0; i < arrayPosts.length; i++) {
        var node = subElement(nodes, 'node');
        node.set('id', arrayPosts[i]['id']);
        var attvalues = subElement(node, 'attvalues');
        var attvalue = subElement(attvalues, 'attvalue');
        attvalue.set('for', '0');
        attvalue.set('value', arrayPosts[i]['id']);
        var attvalue = subElement(attvalues, 'attvalue');
        attvalue.set('for', '1');
        attvalue.set('value', arrayPosts[i]['message']);
        var attvalue = subElement(attvalues, 'attvalue');
        attvalue.set('for', '2');
        attvalue.set('value', arrayPosts[i]['created']);
        var attvalue = subElement(attvalues, 'attvalue');
        attvalue.set('for', '3');
        attvalue.set('value', arrayPosts[i]['userid']);
        var attvalue = subElement(attvalues, 'attvalue');
        attvalue.set('for', '4');
        attvalue.set('value', arrayPosts[i]['userfullname']);
        var attvalue = subElement(attvalues, 'attvalue');
        attvalue.set('for', '5');
        attvalue.set('value', arrayPosts[i]['subject']);
        var attvalue = subElement(attvalues, 'attvalue');
        attvalue.set('for', '6');
        attvalue.set('value', arrayPosts[i]['forumid']);
        for (j = 0; j < arrayForums.length; j++) {
            if (arrayForums[j]['cmid'] == arrayPosts[i]['forumid']) {
                var attvalue = subElement(attvalues, 'attvalue');
                attvalue.set('for', '7');
                attvalue.set('value', arrayForums[j]['name']);
            }
        }
    }

    //Creación de las aristas
    var edges = subElement(graph, 'edges');
    var id = 0;
    for (i = 0; i < arrayPosts.length; i++) {
        for (j = 0; j < arrayPosts.length; j++) {
            if (arrayPosts[i]['parent'] == arrayPosts[j]['id']) {
                var edge = subElement(edges, 'edge');
                edge.set('id', id);
                edge.set('source', arrayPosts[i]['id']);
                edge.set('target', arrayPosts[j]['id']);
                //edge.set('label',arrayPosts[i]['userid']);
                id++;
            }
        }
    }

    etree = new ElementTree(gexf);
    xml = etree.write({
        'xml_declaration': true
    });
    //console.log(xml);
    var date = Date.now();
    var filename = __dirname + '/../graphs/Mensajes_' + date + '.gexf';
    fs.writeFile(filename, xml.toString({
        pretty: true
    }), function(err) {
        if (err) throw err;
        console.log('Archivo Mensajes.gexf creado.');
    });
    var history = require('../history.json');
    console.log(req.body.array);
    dateDay = new Date(date).toString();
    var myGraph = {
        url: req.body.url,
        courseid: req.body.id,
        date: dateDay,
        type: 'Messages',
        typeImg: 'messages.png',
        token: req.body.token,
        filename: 'Mensajes_' + date + '.gexf'
    }

    history.list.push(myGraph);

    console.log(history);

    fs.writeFile('history.json', JSON.stringify(history, null, 4), function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log("JSON saved to " + 'history.json');
        }
    });


}