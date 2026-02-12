document.addEventListener("DOMContentLoaded", function() {
    const gameSpace = document.getElementById("gamespace");
    const boundingRect = gameSpace.getBoundingClientRect();
    const widthOfBalloon = 30;
    // adding and subbing by width so that the div doesn't go over the edge
    const minX = boundingRect.left + widthOfBalloon;
    const maxX = boundingRect.right - widthOfBalloon;
    const minY = boundingRect.top + widthOfBalloon;
    const maxY = boundingRect.bottom - widthOfBalloon;


    let time = 10;
    let score = 0;
    let namePerson = prompt("What is your name?");

    let music = new Audio('audio/lofi.mp3');
    music.loop = true;


    setTimeout(() => {
        music.play().then(r => {

        });
    }, 1000);


    document.getElementById("time").innerHTML = `Time: ${time}s`;
    const addRandomGoodBalloon = () => {
        if (gameSpace.getElementsByClassName("dot").length > 0) {
            return;
        }

        if (time <= 0) {
            alert("Game Over!");
            return;
        }

        const dot = document.createElement("img");

        dot.style.position = "absolute";
        dot.style.width = `${widthOfBalloon}px`;
        dot.src = "img/dot.png";
        dot.className = "dot";
        dot.onclick = function() {
            gameSpace.removeChild(dot);
            score += 1;

            const scoreElement = document.getElementById("score");
            scoreElement.textContent = `${score} pts`;

            // 1. Create a new Audio object, passing the URL of the audio file.
            let audio = new Audio('audio/meow-1.mp3');
            audio.play();
        }

        const x = Math.random() * (maxX - minX) + minX;
        const y = Math.random() * (maxY - minY) + minY;

        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;

        gameSpace.appendChild(dot);
    }
    const addRandomBadBalloon = () => {
        if (gameSpace.getElementsByClassName("bdot").length > 0) {
            return;
        }

        if (time <= 0) {
            alert("Game Over!");
            return;
        }

        const dot = document.createElement("img");

        dot.style.position = "absolute";
        dot.style.width = `${widthOfBalloon}px`;
        dot.src = "img/bdot.png";
        dot.className = "bdot";
        dot.onclick = function() {
            gameSpace.removeChild(dot);
            time = 0;
            loseGame();
        }

        const x = Math.random() * (maxX - minX) + minX;
        const y = Math.random() * (maxY - minY) + minY;

        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;

        gameSpace.appendChild(dot);
    }

    function winGame() {
        alert(`Game Over, ${namePerson}, you scored ${score} amount of points!`);
        location.reload();
    }

    function loseGame() {
        alert(`Game Over, ${namePerson}, you scored ${score} amount of points!`);
        location.reload();
    }


    function startGame() {
        let intervalOfBalloons = setInterval(function() {
            if (time <= 0) {
                clearInterval(intervalOfTime);
                clearInterval(intervalOfBalloons);

                winGame();
                return;
            }
            addRandomGoodBalloon();
        }, 150);

        let intervalOfBadBalloons = setInterval(function() {
            if (time <= 0) {
                clearInterval(intervalOfTime);
                clearInterval(intervalOfBadBalloons);
                clearInterval(intervalOfBalloons);

                winGame();
                return;
            }
            addRandomBadBalloon();
        }, 150);

        let intervalOfTime = setInterval(function() {
            if (time <= 0) {
                clearInterval(intervalOfTime);
                clearInterval(intervalOfBalloons);
                clearInterval(intervalOfBadBalloons);

                winGame();
                return;
            }
            time -= 1;

            const timeElement = document.getElementById("time");
            timeElement.textContent = `Time: ${time}s`;
        }, 1000);
    }

    document.getElementById("start_button").addEventListener("click", function() {
        startGame();
    })

});