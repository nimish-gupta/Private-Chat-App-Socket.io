var express=require('express'),
	app=express(),
	amqp = require('amqplib/callback_api'),
	server=require('http').createServer(app),
	io=require('socket.io').listen(server),
	users={},
	get_all_users_queue_exist=

server.listen(3000);

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
		io.sockets.emit('usernames',Object.keys(users));
	}
	socket.on('sent message',function(data,callback){
		var msg=data.trim();
		if(msg.substring(0,3)==='/w '){
			msg=msg.substring(3);
			var ind = msg.indexOf(' ');
			if(ind!==-1){
				var name=msg.substring(0,ind);
				var msg=msg.substring(ind+1);
				if(name in users){
					users[name].emit('whisper',{msg:msg,nick:socket.nickname})
					
				}else{
					callback('Error:!enter a valid user');
				}
				
			}else{	
				callback('Error:! please enter the name of the whisper');
			}
			
		}else
		io.sockets.emit('new_message',{msg:msg,nick:socket.nickname});
		// Use below if you want to send the message to all the users including the sender
		//socket.broadcast.emit('new_message',data);

	});

	socket.on('disconnect',function(data){
		if(!socket.nickname)
			return;
		delete users[socket.nickname]
		updateNicknames();
	})
})