var express=require('express'),
	app=express(),
	amqp = require('amqplib/callback_api'),
	server=require('http').createServer(app),
	io=require('socket.io').listen(server),
	amqp = require('amqplib/callback_api'),
	users={};

server.listen(3000);
app.use('/static', express.static(__dirname + '/public'));
app.get('/',function(req,res){
	res.sendfile(__dirname+'/index.html')
});
amqp.connect('amqp://localhost', function(err, conn) {
	conn.createChannel(function(err, ch) {
		io.sockets.on('connection',function(socket){
			//console.log(socket)
			socket.on('new user',function(data,callback){

				if(data in users){
					callback(false);
				}else{
					ch.assertQueue(data,{durable:false});
					socket.nickname=data;
					users[data]=socket;
					updateNicknames();
					callback(true);
					
				}
			});
			try{
				
			}catch(e){

			}
			
			
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
				msg={
					msg:msg,
					nick:socket.nickname
				}
				console.log(msg)
				ch.sendToQueue(socket.nickname,new Buffer(JSON.stringify(msg)));
				
				socket.emit('new_message',[{msg:msg.msg,nick:msg.nick}]);
				ch.sendToQueue(socket.receiver_name,new Buffer(JSON.stringify(msg)));


			});
			socket.on('reciever_name',function(data,callback){
				if(data in users && data!==socket.nickname){
					callback(1);
					socket.receiver_name=data;
					ch.consume(socket.nickname,function(msg){
						if(msg){
							//console.log(socket.nickname)
							msg=msg.content.toString();
							//console.log(msg)
							msg=JSON.parse(msg);
							if(socket.nickname===msg.nick){
								if(!socket.msg)
									socket.msg={}
								if(!(socket.receiver_name in socket.msg))
									socket.msg[socket.receiver_name]=[]
								socket.msg[socket.receiver_name].push({msg:msg.msg,nick:msg.nick});
								socket.emit('notification',{from:socket.receiver_name,msg:''})
								if(users[socket.receiver_name].receiver_name!==socket.nickname)
									users[socket.receiver_name].emit('notification',{from:msg.nick,msg:'You have new message from'})
							}else{
								console.log(socket.nickname);
								if(!socket.msg)
									socket.msg={}
								if(!(msg.nick in socket.msg))
									socket.msg[msg.nick]=[]
								socket.msg[msg.nick].push({msg:msg.msg,nick:msg.nick})
								if(socket.receiver_name===msg.nick){
									socket.emit('new_message',[{msg:msg.msg,nick:msg.nick}])
								}
							}
							
							
						}
							
						
						
					});
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
				ch.deleteQueue(socket.nickname,function(){
					console.log(socket.nickname + ' deleted');
				})
				updateNicknames();
			})
		})
	});
});
