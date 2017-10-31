const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const url = "mongodb://localhost:27017/tasks";

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/users.html');
});

io.on('connection', function(socket){
	let users;
  
	socket.on('all users', function(msg){
		mongoConnectUser();
	});

	socket.on('user add', function(msg){
		if (msg.userId) msg.active='update';
		mongoConnectUser(msg);
	});
	
	socket.on('user search', function(msg){
		msg.active='find';
		mongoConnectUser(msg);
	});

	socket.on('user remove', function(msg){
		msg.active='remove';
		mongoConnectUser(msg);
	});
	/////////////
	socket.on('all task', function(msg){
		mongoConnectTask();
	});

	socket.on('task add', function(msg){
		if (msg.taskId) msg.active='update';
		mongoConnectTask(msg);
	});
	
	socket.on('task search', function(msg){
		msg.active='find';
		mongoConnectTask(msg);
	});

	socket.on('task remove', function(msg){
		msg.active='remove';
		mongoConnectTask(msg);
	});

});

function mongoConnectTask(query) {
	console.log('query - ',query);
	mongoClient.connect(url, function(err, db){
		if (err) {
			console.log("Не удается подключиться к БД");
		}
		else {
			console.log("Соединение с БД установленно");
			let collection = db.collection("tasks");
			if (query == undefined) {
				collection.find(function(err, cursor) {
				  cursor.toArray(function(err, items) {
						// console.log('items ',items);
						io.emit('all task', items);
				  });
				});
			}
			else if (query.active == 'remove') {
				console.log('remove - ',query);
				collection.remove({_id: new mongodb.ObjectID(query.userId)}, function(err, res){
					if(err){ 
						result.err = err;
					}
					io.emit('task remove', query);
				});
			}
			else if (query.active == 'update') {
				console.log('update - ',query);
				collection.update({_id: new mongodb.ObjectID(query.userId)},{"$set":{userName:query.userName}}, function(err, res){
					if(err){ 
						result.err = err;
					}
					query._id=query.userId;
					io.emit('task add', query);
				});
			}
			else if (query.active == 'find') {
				collection.find({userName: {$regex: query.userName, $options: 'i'}}, function(err, cursor) {
				  cursor.toArray(function(err, items) {
					console.log(items);
						io.emit('all task', items);
				  });
				});
			}
			else {
				collection.insertOne(query, function(err, res){
					if(err){ 
						result.err = err;
					}
					console.log(res.ops[0]);
					io.emit('task add', res.ops[0]);
				});
			}
		}
		db.close();
	});
}

function mongoConnectUser(query) {
	console.log('query - ',query);
	mongoClient.connect(url, function(err, db){
		if (err) {
			console.log("Не удается подключиться к БД");
		}
		else {
			console.log("Соединение с БД установленно");
			let collection = db.collection("users");
			if (query == undefined) {
				collection.find(function(err, cursor) {
				  cursor.toArray(function(err, items) {
						io.emit('all users', items);
				  });
				});
			}
			else if (query.active == 'remove') {
				console.log('remove - ',query);
				collection.remove({_id: new mongodb.ObjectID(query.userId)}, function(err, res){
					if(err){ 
						result.err = err;
					}
					io.emit('user remove', query);
				});
			}
			else if (query.active == 'update') {
				console.log('update - ',query);
				collection.update({_id: new mongodb.ObjectID(query.userId)},{"$set":{userName:query.userName}}, function(err, res){
					if(err){ 
						result.err = err;
					}
					query._id=query.userId;
					io.emit('user add', query);
				});
			}
			else if (query.active == 'find') {
				collection.find({userName: {$regex: query.userName, $options: 'i'}}, function(err, cursor) {
				  cursor.toArray(function(err, items) {
					console.log(items);
						io.emit('user all', items);
				  });
				});
			}
			else {
				collection.insertOne(query, function(err, res){
					if(err){ 
						result.err = err;
					}
					console.log(res.ops[0]);
					io.emit('all users', res.ops[0]);
				});
			}
		}
		db.close();
	});
}

http.listen(3000, function(){
  console.log('Start server');
});