const rows_number = 4;
const columns_number = 3;
let class_name;

let table_content = [
    ["Motor", "Control Signal", "Position"],
    ["Motor 1", "---", "---"],
    ["Motor 2", "---", "---"],
    ["Motor 3", "---", "---"]
]

let grid = document.getElementById("grid");

for (let i = 0; i < rows_number; i++){

    if(i == 0)  {class_name = "header";}
    else        {class_name = "content";}

    let row = document.getElementsByClassName(class_name)[0];

    for (let j = 0; j < columns_number; j++){
        let cell = document.createElement("td");
        cell.textContent = table_content[i][j];
        row.appendChild(cell);
    }
    grid.appendChild(row);
}