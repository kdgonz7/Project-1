document.addEventListener("DOMContentLoaded", () => {
    // ——— DOM Elements ———
    const gameSpace = document.getElementById("gamespace");
    const timeDisplay = document.getElementById("time");
    const scoreDisplay = document.getElementById("score");
    const startButton = document.getElementById("start_button");

    // ——— Constants & Configuration ———
    const BALLOON_SIZE = 30;
    const GOOD_BALLOON_SRC = "img/dot.png";
    const BAD_BALLOON_SRC = "img/bdot.png";
    const GOOD_CLICK_SOUND = "audio/meow-1.mp3";
    const BACKGROUND_MUSIC = "audio/lofi.mp3";
    const GAME_SPEED_MS = 150;
    const DOG_SPEED_MS = GAME_SPEED_MS +300;
    const TIME_DECREMENT_MS = 1000;

    // ——— Game State ———
    let namePerson;
    let timeLeft;
    let score;
    let gameIntervals = [];

    // ——— Utility Functions ———
    const getGameBounds = () => {
        const rect = gameSpace.getBoundingClientRect();
        const margin = BALLOON_SIZE;
        return {
            minX: rect.left + margin,
            maxX: rect.right - margin,
            minY: rect.top + margin,
            maxY: rect.bottom - margin,
        };
    };

    const getRandomPosition = () => {
        const bounds = getGameBounds();
        const x = Math.random() * (bounds.maxX - bounds.minX) + bounds.minX;
        const y = Math.random() * (bounds.maxY - bounds.minY) + bounds.minY;
        return { x, y };
    };

    const createBalloon = (type) => {
        const img = document.createElement("img");
        img.style.position = "absolute";
        img.style.width = `${BALLOON_SIZE}px`;
        img.src = type === "good" ? GOOD_BALLOON_SRC : BAD_BALLOON_SRC;
        img.className = type === "good" ? "dot" : "bdot";

        // Position
        const { x, y } = getRandomPosition();
        img.style.left = `${x}px`;
        img.style.top = `${y}px`;

        // Click handler
        img.addEventListener("click", () => {
            img.remove();
            if (type === "good") {
                score++;
                scoreDisplay.textContent = `${score} pts`;
                playSound(GOOD_CLICK_SOUND);
            } else {
                endGame("lose");
            }
        });

        gameSpace.appendChild(img);
        return img;
    };

    const playSound = (src) => {
        try {
            const audio = new Audio(src);
            audio.play().catch(() => {}); // Ignore autoplay errors (e.g., missing permission)
        } catch (e) {
            console.warn("Failed to play sound:", src);
        }
    };

    const updateTimer = () => {
        timeLeft--;
        timeDisplay.textContent = `Time: ${timeLeft}s`;
        if (timeLeft <= 0) {
            endGame("win");
        }
    };

    const endGame = (result) => {
        // Stop all intervals
        gameIntervals.forEach(intervalId => clearInterval(intervalId));
        gameIntervals = [];

        const finalMessage = result === "win"
            ? `Congratulations, ${namePerson}! You scored ${score} points!`
            : `Game over, ${namePerson}. You scored ${score} points.`;

        setTimeout(() => {
            alert(finalMessage);
            location.reload();
        }, 50); // Slight delay for UX
    };

    const startGame = () => {
        // Initialize state
        namePerson = prompt("What is your name?")?.trim() || "Player";
        timeLeft = 10;
        score = 0;

        // Update UI
        timeDisplay.textContent = `Time: ${timeLeft}s`;
        scoreDisplay.textContent = `${score} pts`;

        // Start background music (with fallback for autoplay policy)
        try {
            const music = new Audio(BACKGROUND_MUSIC);
            music.loop = true;
            music.volume = 0.3; // Keep it subtle
            setTimeout(() => music.play().catch(() => {}), 1000);
        } catch (e) {
            console.warn("Audio not supported or blocked.");
        }

        // Clear existing balloons (safety)
        gameSpace.innerHTML = "";

        // ——— Game Loops ———
        // Good balloon: spawn one at a time, only if none exist
        const goodIntervalId = setInterval(() => {
            if (timeLeft <= 0) return;
            const existingGood = gameSpace.querySelector(".dot");
            if (!existingGood) {
                createBalloon("good");
            }
        }, GAME_SPEED_MS);

        // Bad balloon: same logic
        const badIntervalId = setInterval(() => {
            if (timeLeft <= 0) return;
            const existingBad = gameSpace.querySelector(".bdot");
            if (existingBad) {
                existingBad.remove()
            }
            createBalloon("bad");

        }, DOG_SPEED_MS);

        // Timer
        const timerId = setInterval(updateTimer, TIME_DECREMENT_MS);

        gameIntervals = [goodIntervalId, badIntervalId, timerId];
    };

    // ——— Event Listener ———
    startButton?.addEventListener("click", startGame);
});