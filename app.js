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
		


		if(!socket.msg)
			socket.msg={}
		if(!(socket.receiver_name in socket.msg))
			socket.msg[socket.receiver_name]=[]
		socket.msg[socket.receiver_name].push({msg:msg,nick:socket.nickname})
		



		if(!users[socket.receiver_name].msg)
			users[socket.receiver_name].msg={}
		if(!(socket.nickname in users[socket.receiver_name].msg))
			users[socket.receiver_name].msg[socket.nickname]=[]
		users[socket.receiver_name].msg[socket.nickname].push({msg:msg,nick:socket.nickname})

		if(users[socket.receiver_name].receiver_name===socket.nickname){
			console.log(socket.receiver_name);
			users[socket.receiver_name].emit('new_message',[{msg:msg,nick:socket.nickname}]);
		}else{
			total_length=0;
			console.log(users[socket.receiver_name].msg[socket.nickname].length-1)
			for(var i=users[socket.receiver_name].msg[socket.nickname].length-1;i>=0 && users[socket.receiver_name].msg[socket.nickname][i].nick!==socket.receiver_name;i--)
				total_length++;
			users[socket.receiver_name].emit('notification',{from:socket.nickname,total:total_length});
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
		for(user in users){
			if(users[user].receiver_name===socket.nickname)
				users[user].emit('user_disconnected',socket.nickname);
		}
		
		delete users[socket.nickname]

		updateNicknames();
	})
})