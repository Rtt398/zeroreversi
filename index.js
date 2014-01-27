var http = require('http');
var fs = require('fs');

var jobs = [];
var waiting;
var waitingName;
var timeoutid;

var server = http.createServer(function (req,res){
	console.log('Request!' + req.url);
	if (req.headers['user-agent'] == 'WOLF RPG EDITOR'){
		res.writeHead(200,{'Content-Type':'text/plain'});
		var reqs = req.url.split('/');
		switch (reqs[1]){
			case 'search':// /search/exp/name
				if (waiting){
					console.log('Challenger Comes!');
					var id;
					do{
						id = Math.floor(Math.random()*999999)+1;
					}while (id.toString() in jobs);
					waiting.end(id + ',1,' + reqs[2] + ',' + reqs[3]);
          timeoutid = setTimeout(function(){jobs[id].end('error');delete jobs[id];},30000)
					jobs[id] = res;
					waiting = null;
				}else{
					console.log('Waiting Challenger...');
					waiting = res;
					waitingName = reqs[2];
				}
				break;
			case 'get':// /get/id/exp/name
				if (reqs[2] in jobs){
          clearTimeout(timeoutid);
					console.log('get:' + reqs[2]);
					jobs[reqs[2]].end(reqs[2] + ',-1,' +reqs[3] + ',' + reqs[4]);
					jobs[reqs[2]] = res;
				}else{
					res.end('error');
				}
				break;
			case 'set':// /set/id/x/y/msg
				if (reqs[2] in jobs){
					console.log('set' + reqs[3] + ',' + reqs[4] + ',' + reqs[5]);
					jobs[reqs[2]].end(reqs[3] + ',' + reqs[4] + ',' + reqs[5]);
					jobs[reqs[2]] = res;
				}else{
					res.end('error');
				}
				break;
			case 'end':// /end/id/code
				if (reqs[3] in jobs){
					jobs[reqs[3]].end('end,' + reqs[2]);
					delete jobs[reqs[3]];
					res.end('end');
				}else{
					res.end('error');
				}
				break;
			case 'error':// /error/id/
				if (reqs[2] in jobs){
					jobs[reqs[2]].end('error');
					jobs[reqs[2]] = res;
				}else{
					res.end('error');
				}
				break;
			case 'info':
				fs.readFile('info.txt', function(err,data){
					if(err){
						res.end('Error! Cannot get infomation!');
					}else{
						res.end(data);
					}
				});
        break;
			case 'bgm':
				fs.readFile('bgm', function(err,data){
					if(err){
						res.writeHead(404);
						res.end('Error! Cannot get BGM file!');
					}else{
						res.end(data);
					}
				});
        break;
			case 'update':
				fs.readFile('BasicData.wolf', function(err,data){
					if(err){
						res.writeHead(404);
						res.end('Error! Cannot get Update file!');
					}else{
						res.end(data);
					}
				});
        break;
      case 'history':
        fs.readFile('history.txt', function(err,data){
					if(err){
						res.writeHead(404);
						res.end('Error! Cannot get History file!');
					}else{
						res.end(data);
					}
				});
        break;
			default:
				res.writeHead(404);
				res.end();
		}
	}else{
		res.writeHead(404);
		res.end();
	}
}).listen(process.env.PORT || 3000);
server.on('clientError', function (e,socket){
	console.error(e);
});
setInterval(function (){
	if (waiting){
		//errorEmitted?
		if (waiting.errorEmitted){
			console.log('Error');
		}else{
			waiting.write('/');
		}
	}
	for (i in jobs){
		if (jobs[i].errorEmitted){
			console.log('Error');
			delete jobs[i];
		}else{
			jobs[i].write('/');
		}
	}
},12000)