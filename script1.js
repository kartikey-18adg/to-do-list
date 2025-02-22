function addTask() {
    let taskInput = document.getElementById("taskinput");
    let taskText = taskInput.value.trim();
    
    if (taskText === "") {
        alert("Please enter a task!");
        return;
    }

    let li = document.createElement("li");
    li.innerHTML = `${taskText} <button class="remove-btn" onclick="removeTask(this)">X</button>`;

    li.addEventListener("click", function () {
        this.classList.toggle("completed");
    });

    document.getElementById("tasklist").appendChild(li);
    taskInput.value = "";
}

function removeTask(button) {
    if(confirm("Are you done with this task?")){
        console.log("Task completed");
    } else {
        console.log("Task not completed");
        let audio = new Audio("sounds/Voicy_Fart Meme Sound.mp3"); // Corrected file path
        audio.play();
    } 
    button.parentElement.remove();
}
