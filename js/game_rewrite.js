document.addEventListener("DOMContentLoaded", () => {
    // ——— DOM Elements ———
    const gameSpace = document.getElementById("gamespace");
    const timeDisplay = document.getElementById("time");
    const scoreDisplay = document.getElementById("score");
    const startButton = document.getElementById("start_button");
    const nameWelcome = document.getElementById("name_welcome");

    const BALLOON_SIZE = 30;
    const GOOD_BALLOON_SRC = "img/dot.png";
    const BAD_BALLOON_SRC = "img/bdot.png";
    const GOOD_CLICK_SOUND = "audio/meow-1.mp3";
    const BACKGROUND_MUSIC = "audio/lofi.mp3";
    const GAME_SPEED_MS = 150;
    const DOG_SPEED_MS = GAME_SPEED_MS +300;
    const SPECIAL_CAT_SPEED_MS = GAME_SPEED_MS + 600;
    const TIME_DECREMENT_MS = 1000;

    // New Variables
    const DEFAULT_GAME_TIME = 10; // seconds

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
        return {x, y};
    };

    const playSound = (src) => {
        try {
            const audio = new Audio(src);
            audio.play().catch(() => {
            }); // Ignore autoplay errors (e.g., missing permission)
        } catch (e) {
            console.warn("Failed to play sound:", src);
        }
    };

    //const {x, y} = getRandomPosition();
    //         img.style.left = `${x}px`;
    //         img.style.top = `${y}px`;



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
        }, 50);
    };

    // Defines how entities spawn in-game.
    // Static: Only spawns once, and waits until it's removed before spawning again.
    // Continuous: Spawns at a fixed interval, regardless of existing entities.
    const SpawnType = {
        STATIC: "static",
        CONTINUOUS: "CONTINUOUS",
    }

    // An entity is something that appears on the gamespace.
    class Entity {
        constructor(data) {
            this.image = data.image;
            this.cssClass = data.cssClass;
            this.score = data.score;
            this.sound = data.sound;
            this.spawnTime = data.spawnTime;
            this.spawnType = data.spawnType;
            this.fxFunction = data.fxFunction;
        }

        // onEntityClick defines what happens when an entity is clicked.
        // Sounds are handled by the entityManager. This class is responsible for animation, score changes, and other effects.
        onEntityClick(gameManager) {}
    }

    class EntityManager {
        constructor() {
            this.ents = [];
            this.time = DEFAULT_GAME_TIME;
        }

        addEntity(entity) {
            if (!entity instanceof Entity) {
                throw new Error("Only Entity instances can be added to the EntityManager.");
            }
            this.ents.push(entity);
        }

        startGame() {
            // start game handles the intervals of all entities,
            // each entities' on click function handles the personal score, etc.
            // the game manager handles the unified timer and sound effects.

            for (const entity of this.ents) {
                if (entity.spawnType === SpawnType.CONTINUOUS) {
                    const intervalId = setInterval(() => {
                        this.spawnEntity(entity);
                    }, entity.spawnTime);
                    gameIntervals.push(intervalId);
                }
            }
        }

        spawnEntity(ent) {
            const img = ent.image;
            const {x, y} = getRandomPosition();

            img.style.top = `${y}px`;
            img.style.left = `${x}px`;
        }
    }

    // const startGame = () => {
    //     if (timeLeft > 0) {
    //         alert("Game is already in progress. Please finish it before starting a new one.");
    //         return;
    //     }
    //
    //     if (timeLeft <= 0) {
    //         alert("Game is stale. Restarting!")
    //         location.reload();
    //         return;
    //     }
    //     // Initialize state
    //     timeLeft = 10;
    //     score = 0;
    //
    //     timeDisplay.textContent = `Time: ${timeLeft}s`;
    //     scoreDisplay.textContent = `${score} pts`;
    //
    //     try {
    //         const music = new Audio(BACKGROUND_MUSIC);
    //         music.loop = true;
    //         music.volume = 0.3; // Keep it subtle
    //         setTimeout(() => music.play().catch(() => {
    //         }), 1000);
    //     } catch (e) {
    //         console.warn("Audio not supported or blocked.");
    //     }
    //
    //     // Clear existing balloons (safety)
    //     gameSpace.innerHTML = "";
    //
    //     // ——— Game Loops ———
    //     // Good balloon: spawn one at a time, only if none exist
    //     const goodIntervalId = setInterval(() => {
    //         if (timeLeft <= 0) return;
    //         const existingGood = gameSpace.querySelector(".dot");
    //         if (!existingGood) {
    //             createBalloon("good");
    //         }
    //     }, GAME_SPEED_MS);
    //
    //     // Bad balloon: same logic
    //     const badIntervalId = setInterval(() => {
    //         if (timeLeft <= 0) return;
    //         const existingBad = gameSpace.querySelector(".bdot");
    //         if (existingBad) {
    //             existingBad.remove()
    //         }
    //         createBalloon("bad");
    //
    //     }, DOG_SPEED_MS);
    //
    //     // Bad balloon: same logic
    //     const specialIntervalId = setInterval(() => {
    //         if (timeLeft <= 0) return;
    //         const existingBad = gameSpace.querySelector(".bdot");
    //         if (existingBad) {
    //             existingBad.remove()
    //         }
    //         createBalloon("bad");
    //
    //     }, SPECIAL_CAT_SPEED_MS);
    //
    //     // Timer
    //     const timerId = setInterval(updateTimer, TIME_DECREMENT_MS);
    //
    //     gameIntervals = [goodIntervalId, badIntervalId, timerId];
    // };

    namePerson = prompt("What is your name?")?.trim() || "Player";
    nameWelcome.textContent = `Welcome, ${namePerson}!`;

    // ——— Event Listener ———
    startButton?.addEventListener("click", startGame);
});