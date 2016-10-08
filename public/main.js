jQuery(function($){
	var socket=io.connect();
	var $messageForm=$('#send-message');
	var $nickForm=$('#setNick');
	var $nickError=$('#nickError');
	var $nickBox=$('#nickname');
	var $messageBox=$('#message');
	var $chat=$('#chat');
	var $users=$('.users')
	$nickForm.submit(function(e){
		e.preventDefault();
		socket.emit('new user',$nickBox.val(),function(data){
			if(data){
				$('#nickWrap').hide();
				$('#receiverWrap').show();
			}else{
				$nickError.html('That username is already taken. Try new one');
			}
		});
		$nickBox.val('');
	});
	$('#setReceiver').submit(function(e){
		e.preventDefault();
		receive_emit($('#receiverName').val())
		
	});
	function receive_emit(value){
		socket.emit('reciever_name',value,function(data){
			if(data===1){
				$('#receiverWrap').hide();
				$('#contentWrap').show();
				$('.'+data.from).html(data)
			}else if(data===2){
				$('#receiverError').html('You can not send message to yourself. Sorry');
			}
			else{
				$('#receiverError').html('This user is not online');
			}
			$('#receiverName').val('');
		});
	}
	$('#start_another_chat').click(function(){
		$('#contentWrap').hide();
		$('#chat').html('')
		$('#receiverWrap').show();
	})
	socket.on('notification',function(data){
		$('.'+data.from).html('<span class="from_'+data.from+'">'+data.from + '</span> <span> '+ data.total+'</span>' )
	})
	socket.on('usernames',function(data){
		if(data.length!=0){
			var html='Online users<br>';
			for(i=0;i<data.length;i++){
				html+='<span class='+data[i]+'>'+data[i]+'<span><br>'
			}
			$users.html(html);
		}else{
			$users.html('No user is online');
		}
		
	})

	socket.on('user_disconnected',function(data){
		alert('user:'+data+' is disconneted');
		$('#receiverName').val('');
		$('#contentWrap').hide();
		$('#receiverWrap').show();
	})

	$messageForm.submit(function(e){
		e.preventDefault();
		socket.emit('sent message',$messageBox.val());
		$messageBox.val('');
	});
	socket.on('new_message',function(data){
		var chat_to_display='';
		for(var i=0;i<data.length;i++)
			$chat.append('<span class="msg"><b>'+data[i].nick+'</b>: '+data[i].msg+"</span><br>");
	});
	
})