var ros = new ROSLIB.Ros({
    url : 'ws://localhost:9090'
});  
ros.on('connection', function() {
    console.log('Connected to websocket server.');
});
ros.on('error', function(error) {
    console.log('Error connecting to websocket server: ', error);
});
ros.on('close', function() {
    console.log('Connection to websocket server closed.');
});



function updateTable(i, j, data){
    grid = document.getElementById("grid");
    degrees = Number(data)*360/4096;
    grid.rows[i].cells[j].textContent = `${degrees.toFixed(2)}°`
}

function topicListener(topic, row, column) {
    var listener = new ROSLIB.Topic({
        ros: ros,
        name: topic,
        messageType: 'std_msgs/UInt16'
    });

    listener.subscribe(function(message) {
        updateTable(row, column, message.data);
    });
}

topicListener('/virtual_dc_motor_node/get_position_0', 1, 2);
topicListener('/virtual_dc_motor_node/get_position_1', 2, 2);
topicListener('/virtual_dc_motor_node/get_position_2', 3, 2);
