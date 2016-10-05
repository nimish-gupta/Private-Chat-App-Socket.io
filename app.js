var express=require('express'),
	app=express(),
	amqp = require('amqplib/callback_api'),
	server=require('http').createServer(app),
	io=require('socket.io').listen(server),
	users={};

server.listen(3000);
app.use('/static', express.static(__dirname + '/public'));
app.get('/',function(req,res){
	res.sendfile(__dirname+'/index.html')
});

io.sockets.on('connection',function(socket){
	socket.on('new user',function(data,callback){

		if(data in users){
			callback(false);
		}else{
			socket.nickname=data;
			users[data]=socket;
			updateNicknames();
			callback(true);
		}
	});

	function updateNicknames(){
		var user_list=Object.keys(users);
		
		for(var i=0;i<user_list.length;i++){
			var temp=Object.keys(users);
			temp.splice(temp.indexOf(user_list[i]),1);
			users[user_list[i]].emit('usernames',temp)
		}

	}
	socket.on('sent message',function(data){
		var msg=data.trim();
		
		socket.emit('new_message',[{msg:msg,nick:socket.nickname}]);
		if(users[socket.receiver_name].receiver_name===socket.nickname){
			console.log(socket.receiver_name);
			users[socket.receiver_name].emit('new_message',[{msg:msg,nick:socket.nickname}]);
		}else{
			if(!users[socket.receiver_name].msg)
				users[socket.receiver_name].msg={}
			if(!(socket.nickname in users[socket.receiver_name].msg))
				users[socket.receiver_name].msg[socket.nickname]=[]
			users[socket.receiver_name].msg[socket.nickname].push({msg:msg,nick:socket.nickname})
			
		}
		

	});
	socket.on('reciever_name',function(data,callback){
		if(data in users && data!==socket.nickname){
			callback(1);
			socket.receiver_name=data;
			if(socket.msg && data in socket.msg){
				socket.emit('new_message',socket.msg[data]);
			}
		}			
		else if(data===socket.nickname)
			callback(2);
		else
			callback(3);
	})

	socket.on('disconnect',function(data){
		if(!socket.nickname)
			return;
		if(socket.receiver_name)
			users[socket.receiver_name].emit('user_disconnected',socket.nickname);
		delete users[socket.nickname]

		updateNicknames();
	})
})