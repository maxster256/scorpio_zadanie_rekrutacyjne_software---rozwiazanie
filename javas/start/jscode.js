//------------------------------------------------------------------------------------------
// fragment kodu zwiazany z sama strona


let table_content = [
    ["Motor", "Left Control", "Right Control", "Control Signal Value", "Position"],
    ["Motor 1", "ctrl", "ctrl", "slider", "pos"],
    ["Motor 2", "ctrl", "ctrl", "slider", "pos"],
    ["Motor 3", "ctrl", "ctrl", "slider", "pos"]
]

let visual_table = [
    ["Motor 1", "Motor 2", "Motor 3"],
    ["visual", "visual", "visual"],
    ["joint", "joint", "joint"]
]

let buttons = [
    ["q", "e"],
    ["a", "d"],
    ["z", "c"]
]

let motor_system = [
    "Motor System Visualization",
    "visual"
]

const rows_number = table_content.length;
const columns_number = table_content[0].length;

const motors_number = visual_table[0].length;
const motors_table_length = visual_table.length;

const motor_system_length = motor_system.length;

let class_name;
let is_enabled = true;

let line_rotation = [0, 0, 0];
let position_rotations = [50, 50, 50];
let joints_lengths;

//petla do zbudowania tabeli z kontrolerami
let grid = document.getElementById("grid");
for (let i = 0; i < rows_number; i++){

    if(i == 0)  {class_name = "header";}
    else        {class_name = "content";}

    let row = document.getElementsByClassName(class_name)[0];

    for (let j = 0; j < columns_number; j++){
        let cell = document.createElement("td");
        // stworzenie komorek z przyciskami kontrolujacymi
        if(table_content[i][j] == "ctrl"){ 
            let btn = document.createElement("button");
            btn.textContent = buttons[i-1][j-1];
            btn.addEventListener("click", function(){
                // odczyt z przyciskow na stronie
                findButtonOrKey(buttons[i-1][j-1]);
            })
            cell.appendChild(btn);
        }
        // stworzenie komorek z suwakami
        else if(table_content[i][j] == "slider"){
            cell.style.fontSize = "11px";
            let slider = document.createElement("input");
            slider.type = "range";
            slider.value = 50;
            cell.append(slider, "\n", slider.value);
            slider.addEventListener("input", function(){
                cell.textContent = "";
                cell.append(slider, "\n", slider.value);
                position_rotations[i-1] = Number(slider.value);
            })
        }
        // stworzenie pozostalych komorek
        else    {cell.textContent = table_content[i][j];}
        row.appendChild(cell);
    }
    grid.appendChild(row);
}

//petla do zbudowania tabeli z calym systemem
let system_grid = document.getElementById("motor_system");
for (let i = 0; i < motor_system_length; i++){
    if(i == 0) {class_name = "system_header";}
    else       {class_name = "system_visual";}
    let row = document.getElementsByClassName(class_name)[0];
    
    let cell = document.createElement("td");

    if(motor_system[i] == "visual"){
        for(let j = 0; j < 3; j++){
            let dot = document.createElement("div");
            dot.setAttribute("class", "dot");
            dot.id = String(j);
            let line = document.createElement("div");
            line.setAttribute("class", "line");
            line.style.transformOrigin = 'bottom center';
            dot.append(line);
            if(j == 0){
                cell.append(dot);
            }
            else{
                let previous_dot = cell.querySelector('.dot');
                while(previous_dot.querySelector('.dot') != null){
                    previous_dot = previous_dot.querySelector('.dot');
                }
                previous_dot = previous_dot.querySelector('.line');
                dot.style.position = "absolute";
                dot.style.transform = "translateX(-50%)";
                previous_dot.append(dot);
            }
        }
    }
    else    {cell.textContent = motor_system[i];}

    row.append(cell);
    system_grid.append(row);
}

// petla do zbudowania tabeli z pojedynczymi silnikami
let visual_grid = document.getElementById("visual_grid");
for (let i = 0; i < motors_table_length; i++){

    if(i == 0)  {class_name = "motors_header";}
    else if (i == 1) {class_name = "single_motor"}
    else        {class_name = "joints";}

    let row = document.getElementsByClassName(class_name)[0];

    for (let j = 0; j < motors_number; j++){
        let cell = document.createElement("td");
        // stworzenie komorek z pojedynczymi silnikami
        if(visual_table[i][j] == "visual"){
            let dot = document.createElement("div");
            dot.setAttribute("class", "dot");
            let line = document.createElement("div");
            line.setAttribute("class", "line");
            line.style.transformOrigin = 'bottom center';
            dot.append(line);
            cell.append(dot);
        }
        else    {cell.textContent = visual_table[i][j];}
        row.append(cell);
    }
    visual_grid.append(row);
}

// ustawienie wartosci w "motor control" w zaleznosci od jego obecnego stanu
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

// odczyt przyciskow z klawiatury
document.addEventListener("keypress", function(){
    findButtonOrKey(event.key);
});

// sposob wywolywania publishera zalezny od wcisnietego przycisku
function findButtonOrKey(btn){
    if(is_enabled){
        let direction;
        let node;
        switch(btn){
            case "q": direction = -1; node = 0; break;
            case "e": direction = 1; node = 0; break;
            case "a": direction = -1; node = 1; break;
            case "d": direction = 1; node = 1; break;
            case "z": direction = -1; node = 2; break;
            case "c": direction = 1; node = 2; break;
            default: break;
        }
        topicPublisher(`/virtual_dc_motor_node/set_cs_${node}`, direction * position_rotations[node]);
    }
}


//------------------------------------------------------------------------------------------
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
    degrees = Number(data)*360/4096;
    line_rotation[i-1] = degrees;

    let dot = visual_grid.rows[1].cells[i-1].querySelector('.dot');
    let arm = dot.querySelector('.line');
    arm.style.transform = `rotate(${line_rotation[i-1]}deg)`;

    let system = system_grid.rows[1].cells[0]
    for(let j = 0; j < motors_number; j++){
        system = system.querySelector('.dot');
        system.querySelector('.line').style.transform = `rotate(${line_rotation[j]}deg)`;
    }

    grid.rows[i].cells[position_column].textContent = `${degrees.toFixed(2)}°`
}

// subskrybowanie danych z topica
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

// publikowanie danych na topic
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

// pozyskanie danych od serwisu
function getServiceData(){
    var jointsLengthsClient = new ROSLIB.Service({
        ros : ros,
        name : '/virtual_dc_motor_node/get_joints_length',
        serviceType : 'virtual_dc_motor/getMotorJointsLengths'
    });

    jointsLengthsClient.callService(null, function(result) {
        joints_lengths = result.data;
        // ustawienie dlugosci ramion w zaleznosci od danych z serwisu
        for(let i = 0; i < joints_lengths.length; i++){
            visual_grid.rows[2].cells[i].textContent = `Length of the joint: ${joints_lengths[i]}`;
            let motor = visual_grid.rows[1].cells[i].querySelector('.dot').querySelector('.line');
            motor.style.height = `${joints_lengths[i]/2}px`;
        }
        // ustawienie dlugosci ramion (oraz skorygowanie pozycji silnikow) w zaleznosci od danych z serwisu
        let system = system_grid.rows[1].cells[0];
        for(let j = 0; j < motors_number; j++){
            system = system.querySelector('.dot');
            system.querySelector('.line').style.height = `${joints_lengths[j]/2}px`;
            system.style.bottom = `${joints_lengths[j-1]/2 - 12.5}px`;
        }
    });
}
getServiceData();
