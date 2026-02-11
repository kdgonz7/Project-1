document.addEventListener("DOMContentLoaded", function() {
    const gameSpace = document.getElementById("gamespace");
    const boundingRect = gameSpace.getBoundingClientRect();
    const minX = boundingRect.left+ 30;
    const maxX = boundingRect.right - 30;
    const minY = boundingRect.top + 30;
    const maxY = boundingRect.bottom - 30;

    let time = 10;
    let score = 0;
    let namePerson = prompt("What is your name?");

    document.getElementById("time").innerHTML = `Time: ${time}s`;
    const addRandomBalloon = () => {
        if (gameSpace.childElementCount > 0) {
            return;
        }

        if (time <= 0) {
            alert("Game Over!");
            return;
        }

        const dot = document.createElement("img");
        dot.style.position = "absolute";
        dot.style.width = "30px";
        dot.src = "img/dot.png";
        dot.onclick = function() {
            gameSpace.removeChild(dot);
            score += 1;

            const scoreElement = document.getElementById("score");
            const currentScore = parseInt(scoreElement.textContent);
            scoreElement.textContent = `${score} pts`;
        }

        const x = Math.random() * (maxX - minX) + minX;
        const y = Math.random() * (maxY - minY) + minY;

        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;

        gameSpace.appendChild(dot);
    }

    function winGame() {
        alert(`Game Over, ${namePerson}, you scored ${score} amount of points!`);

    }

    function startGame() {
        let intervalOfBalloons = setInterval(function() {
            if (time <= 0) {
                clearInterval(intervalOfTime);
                clearInterval(intervalOfBalloons);

                winGame();
                return;
            }
            addRandomBalloon();
        }, 150);

        let intervalOfTime = setInterval(function() {
            if (time <= 0) {
                clearInterval(intervalOfTime);
                clearInterval(intervalOfBalloons);
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