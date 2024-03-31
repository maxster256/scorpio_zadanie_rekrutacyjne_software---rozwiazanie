//------------------------------------------------------------------------------------------
// fragment kodu zwiazany z sama strona

let buttons = [
    ["q", "e"],
    ["a", "d"],
    ["z", "c"]
]

let controls_table = document.getElementById("grid");
let visual_table = document.getElementById("visual_grid");
let motor_system = document.getElementById("motor_system");

const motor_controls_columns = controls_table.children[0].children[0].childElementCount; //liczba kolumn pierwszej tabeli
const motors_number = visual_table.children[0].children[0].childElementCount;    //liczba kolumn tabeli z pojedynczymi silnikami (również liczba samych silników)
const motor_system_columns = motor_system.children[0].children[0].childElementCount; //liczba kolumn tabeli z symulacją

let is_enabled = true;    // parametr służący do odblokowania/zablokowania kontroli nad silnikami z poziomu przycisków oraz klawiatury

let line_rotation = [0, 0, 0];         // do przechowywania wartosci pozyskanych z subskrybowanego node'a (rotacji silników/ramion)
let position_rotations = [50, 50, 50]; // do przechowywania wartosci suwaków
let joints_lengths;                    // do przechowywania danych pozyskanych z serwisu

// jedna funkcja do uzupelniania wszystkich tabel (zgodnie z regula DRY)
function createTable(columns, table){

    let table_rows = table.children[0].childElementCount;
    for(let i = 0; i < table_rows; i++){
        let row = table.children[0].children[0];
        
        for(let j = 0; j < columns; j++){
            let cell = table.children[0].children[0].children[0];
            let cell_content = table.rows[0].cells[0].textContent

            // uzupelnienie komorek z przyciskami kontrolujacymi lewo/prawo
            if(cell_content == "ctrl"){ 
                let btn = document.createElement("button");
                btn.textContent = buttons[i-1][j-1];
                btn.addEventListener("click", function(){
                    // odczyt z przyciskow na stronie
                    findButtonOrKey(buttons[i-1][j-1]);
                });
                cell.textContent = "";
                cell.appendChild(btn);
            }
            
            // uzupelnienie komorek z suwakami
            else if(cell_content == "slider"){
                cell.style.fontSize = "11px";
                let slider = document.createElement("input");
                slider.type = "range";
                slider.value = 50;
                slider.addEventListener("input", function(){
                    cell.textContent = "";
                    cell.append(slider, "\n", slider.value);
                    position_rotations[i-1] = Number(slider.value);
                })
                cell.textContent = "";
                cell.append(slider, "\n", slider.value);
            }

            //uzupelnienie komorki z wizualizacja calego systemu
            else if(cell_content == "system"){
                cell.textContent = "";
                for(let k = 0; k < motors_number; k++){
                    let dot = document.createElement("div");
                    dot.setAttribute("class", "dot");
                    dot.id = String(k);
                    let line = document.createElement("div");
                    line.setAttribute("class", "line");
                    line.style.transformOrigin = 'bottom center';
                    dot.append(line);
                    // dolaczenie pierwszego nieruchomego silnika
                    if(k == 0)  {cell.append(dot);}
                    // przylaczenie pozostałych silników do ramiona poprzedniego silnika
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
            
            //uzupelnienie komorki z przyciskiem zerujacym
            else if(cell_content == "button"){
                let btn = document.createElement("button");
                btn.textContent = "Go to zero";
                btn.addEventListener("click",function(){
                    //asynchroniczne zerowanie wszystkich pozycji
                    const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
                    const setMotorsToZero = async (j) => {
                        while(line_rotation[j] != 0){
                            let direction = 1;
                            if (line_rotation[j] < 180) {direction = -1;}
                            // sinusoidalny parametr (dla kata 180* przyjmuje wartosc maksymalna a dla 0* i 360* minimalna)
                            let sin_parameter = line_rotation[j] * Math.PI / 360;
                            // x - predkosc obracania zalezna od parametru sinusoidalnego
                            let x = parseInt(Math.sin(sin_parameter) * 80 + 13);
                            topicPublisher(`/virtual_dc_motor_node/set_cs_${j}`, direction * x);
                            // im blizej 0* znajdzie sie ramie z tym wieksza czestotliwoscia bedzie regulowana jego predkosc obrotu i sprawdzana jego pozycja (w celu trafienia w 0)
                            await sleep((3*x)+5);
                        }
                        // wyzerowanie predkosci obrotu, po osiagnieciu kata 0*
                        topicPublisher(`/virtual_dc_motor_node/set_cs_${j}`, 0);
                    }
                    // równoległe wywolanie metody asynchronicznej dla wszystkich części (jedna nie bedzie czekać na drugą)
                    for(let i = 0; i < motors_number; i++){
                        setMotorsToZero(i);
                    }
                });
                cell.textContent = "";
                cell.append(btn);
            }

            // uzupelnienie komorek z pojedynczymi silnikami
            else if(cell_content == "visual"){
                let dot = document.createElement("div");
                dot.setAttribute("class", "dot");
                let line = document.createElement("div");
                line.setAttribute("class", "line");
                line.style.transformOrigin = 'bottom center';
                dot.append(line);
                cell.textContent = "";
                cell.append(dot);
            }
            row.append(cell);
        }
        table.append(row);
    }
    return table;
}

// stworzenie poszczegolnych tabel
let grid = createTable(motor_controls_columns, controls_table);
let system_grid = createTable(motor_system_columns, motor_system);
let visual_grid = createTable(motors_number, visual_table);

// ustawienie wartosci w "motor control enabled/disabled" w zaleznosci od jego obecnego stanu
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
// i aktualizowaniem danych w tabeli w oparciu o dane pozyskane z ros


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

function updateTableAndMotors(i, data){
    degrees = Number(data)*360/4096;
    line_rotation[i-1] = degrees;

    // aktualizacja rotacji ramion w tabeli z pojedynczymi silnikami
    let dot = visual_grid.rows[1].cells[i-1].querySelector('.dot');
    let arm = dot.querySelector('.line');
    arm.style.transform = `rotate(${line_rotation[i-1]}deg)`;

    let system = system_grid.rows[2].cells[0]
    // aktualizacja rotacji ramion w symulacji całego systemu
    for(let j = 0; j < motors_number; j++){
        system = system.querySelector('.dot');
        system.querySelector('.line').style.transform = `rotate(${line_rotation[j]}deg)`;
    }
    // aktualizacja pozycji z tabeli pierwszej
    grid.rows[i].cells[motor_controls_columns - 1].textContent = `${degrees.toFixed(2)}°`
}

// subskrybowanie danych z topica
function topicListener(topic, row) {
    var listener = new ROSLIB.Topic({
        ros: ros,
        name: topic,
        messageType: 'std_msgs/UInt16'
    });

    listener.subscribe(function(message) {
        updateTableAndMotors(row, message.data);
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
        // ustawienie dlugosci ramion w tabeli z pojedynczymi silnikami w zaleznosci od danych z serwisu
        for(let i = 0; i < joints_lengths.length; i++){
            visual_grid.rows[2].cells[i].textContent = `Length of the joint: ${joints_lengths[i]}`;
            let motor = visual_grid.rows[1].cells[i].querySelector('.dot').querySelector('.line');
            motor.style.height = `${joints_lengths[i]/2}px`;
        }
        // ustawienie dlugosci ramion w symulacji całego systemu (oraz skorygowanie pozycji silnikow) w zaleznosci od danych z serwisu
        let system = system_grid.rows[2].cells[0];
        for(let j = 0; j < motors_number; j++){
            system = system.querySelector('.dot');
            system.querySelector('.line').style.height = `${joints_lengths[j]/2}px`;
            system.style.bottom = `${joints_lengths[j-1]/2 - 12.5}px`;
        }
    });
}
getServiceData();
