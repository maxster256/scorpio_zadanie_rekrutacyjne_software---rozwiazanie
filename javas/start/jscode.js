//-----------------------------------------------------------------
// fragment kodu zwiazany z sama strona

let table_content = [
    ["Motor", "Left Control", "Right Control", "Control Signal Value", "Position"],
    ["Motor 1", "ctrl", "ctrl", "slider", "pos"],
    ["Motor 2", "ctrl", "ctrl", "slider", "pos"],
    ["Motor 3", "ctrl", "ctrl", "slider", "pos"]
]

let buttons = [
    ["q", "e"],
    ["a", "d"],
    ["z", "c"]
]

const rows_number = table_content.length;
const columns_number = table_content[0].length;


let class_name;
let is_enabled = true;
let rotation0 = 50, rotation1 = 50, rotation2 = 50;

let grid = document.getElementById("grid");

for (let i = 0; i < rows_number; i++){

    if(i == 0)  {class_name = "header";}
    else        {class_name = "content";}

    let row = document.getElementsByClassName(class_name)[0];

    for (let j = 0; j < columns_number; j++){
        let cell = document.createElement("td");
        if(table_content[i][j] == "ctrl"){
            let btn = document.createElement("button");
            btn.textContent = buttons[i-1][j-1];
            btn.addEventListener("click", function(){
                findButtonOrKey(buttons[i-1][j-1]);
            })
            cell.appendChild(btn);
        }
        else if(table_content[i][j] == "slider"){
            cell.style.fontSize = "11px";
            let slider = document.createElement("input");
            slider.type = "range";
            slider.value = 50;
            cell.append(slider, "\n", slider.value);
            slider.addEventListener("input", function(){
                cell.textContent = "";
                cell.append(slider, "\n", slider.value);
                switch(i){
                    case 1: rotation0 = Number(slider.value); break;
                    case 2: rotation1 = Number(slider.value); break;
                    case 3: rotation2 = Number(slider.value); break;
                }
            })
        }
        else    {cell.textContent = table_content[i][j];}
        row.appendChild(cell);
    }
    grid.appendChild(row);
}

document.getElementById("controlbtn").addEventListener("click", function(){
    var label = document.getElementById("controllbl");
    if(is_enabled){
        label.style.color = "red";
        label.textContent = "Disabled";
        is_enabled = false;
    }
    else{
        label.style.color = "green";
        label.textContent = "Enabled";
        is_enabled = true;
    }
});

document.addEventListener("keypress", function(){
    findButtonOrKey(event.key);
});

function findButtonOrKey(btn){
    if(is_enabled){
        switch(btn){
            case "q":
                topicPublisher('/virtual_dc_motor_node/set_cs_0', (-1) * rotation0);
                break;
            case "e":
                topicPublisher('/virtual_dc_motor_node/set_cs_0', rotation0);
                break;
            case "a":
                topicPublisher('/virtual_dc_motor_node/set_cs_1', (-1) * rotation1);
                break;
            case "d":
                topicPublisher('/virtual_dc_motor_node/set_cs_1', rotation1);
                break;
            case "z":
                topicPublisher('/virtual_dc_motor_node/set_cs_2', (-1) * rotation2);
                break;
            case "c":
                topicPublisher('/virtual_dc_motor_node/set_cs_2', rotation2);
                break;
            default: break;
        }
    }
}

//-----------------------------------------------------------------
// fragment kodu zwiazany z komunikacja z ros

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

let position_column = table_content[0].length - 1;

function updateTable(i, data){
    grid = document.getElementById("grid");
    degrees = Number(data)*360/4096;
    grid.rows[i].cells[position_column].textContent = `${degrees.toFixed(2)}°`
}

function topicListener(topic, row) {
    var listener = new ROSLIB.Topic({
        ros: ros,
        name: topic,
        messageType: 'std_msgs/UInt16'
    });

    listener.subscribe(function(message) {
        updateTable(row, message.data);
    });
}

topicListener('/virtual_dc_motor_node/get_position_0', 1);
topicListener('/virtual_dc_motor_node/get_position_1', 2);
topicListener('/virtual_dc_motor_node/get_position_2', 3);

function topicPublisher(topic, rotat){
    var publisher = new ROSLIB.Topic({
        ros : ros,
        name : topic,
        messageType : 'std_msgs/Int8'
    });
    
    var cs = new ROSLIB.Message({
        data: rotat
    });
    publisher.publish(cs);
}
