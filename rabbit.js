var amqp = require('amqplib/callback_api');
amqp.connect('amqp://localhost', function(err, conn) {
	conn.createChannel(function(err, ch) {
		var q = 'dsfdsf';

	    ch.assertQueue(q, {durable: false});
	    // Note: on Node 6 Buffer.from(msg) should be used
	    ch.sendToQueue(q, new Buffer('Hello World!'));
	    ch.sendToQueue(q, new Buffer('Hello World Again!'));

	    console.log(" [x] Sent 'hello queue'");
	    ch.consume(q,function(msg){
	    	console.log('times');
	    })
	    setTimeout(function(){
		    	ch.consume(q,function(msg){
		    	console.log('times');
		    })
		    },5000)
	    
	    var q = 'hello_again';

	    ch.assertQueue(q, {durable: false});
	    // Note: on Node 6 Buffer.from(msg) should be used
	    ch.sendToQueue(q, new Buffer('Hello Again World!'));
	    ch.sendToQueue(q, new Buffer('Hello Again World Again!'));
	    console.log(" [x] Sent 'hello again queue'");
	});
});
