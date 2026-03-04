document.addEventListener("DOMContentLoaded", () => {
    // ——— DOM Elements ———
    const timeDisplay = document.getElementById("time");
    const startButton = document.getElementById("start_button");
    document.getElementById("name_welcome");
// New Variables
    const DEFAULT_GAME_TIME = 10; // seconds
    const TIME_DECREMENT_MS = 1000;
    const ELEMENT_SIZE = 30;
    const BACKGROUND_MUSIC = "audio/lofi.mp3";

    // ——— Game State ———
// ——— Utility Functions ———
    const playSound = (src) => {
        try {
            const audio = new Audio(src);
            audio.play().catch(() => {
            }); // Ignore autoplay errors (e.g., missing permission)
        } catch (e) {
            console.warn("Failed to play sound:", src);
        }
    };

    function toTitleCase(str) {
        return str
            .toLowerCase() // 1. Convert the entire string to lowercase for normalization.
            .split(' ')    // 2. Split the string into an array of words using space as a delimiter.
            .map(function(word) { // 3. Iterate over each word in the array.
                // Capitalize the first letter and concatenate it with the rest of the word (in lowercase)
                return (word.charAt(0).toUpperCase() + word.slice(1));
            })
            .join(' ');    // 4. Join the words back into a single string with spaces.
    }

    // ——— Game Logic ———

    // Defines how entities spawn in-game.
    // Static: Only spawns once, and waits until it's removed before spawning again.
    // Continuous: Spawns at a fixed interval, regardless of existing entities.
    const SpawnType = {
        STATIC: "static",
        CONTINUOUS: "CONTINUOUS",
    }

    // An entity is something that appears on the gamespace.
    // The caller must supply an entity with the following properties:
    // image: the HTMLImageElement that represents the entity visually. This is manipulated by the EntityManager.
    // cssClass: the CSS class applied to the image for styling.
    // score: how much score the player gets for clicking this entity.
    // sound: the sound played when this entity is clicked.
    // spawnTime: how often this entity spawns, in milliseconds. Only applies to continuous entities.
    // spawnType: whether this entity is static or continuous. Static entities only spawn once, and only respawn after being removed. Continuous entities spawn at a fixed interval, regardless of existing entities.
    // fxFunction: a function that defines any special effects that happen when this entity is clicked. This is called inside the onEntityClick function, which also handles score changes and sound effects.
    // size: the size of the entity in pixels. This is used for collision detection and spawn boundaries.
    class Entity {
        constructor(data) {
            this.image = data.image;
            this.cssClass = data.cssClass;
            this.score = data.score || 0;
            this.sound = data.sound;
            this.spawnTime = data.spawnTime;
            this.spawnType = data.spawnType;
            this.fxFunction = data.fxFunction;

            this.decisionFactor = data.decisionFactor || 1; // this is used to determine spawn chance. 1 means it will always spawn, 0.5 means it will spawn 50% of the time, etc.

            /**
             * Disables the entity from being viewed in the end-game statistics.
             * @type {boolean|*}
             */
            this.disableFromStats = data.disableFromStats;

            /**
             * OnEntityClick is called whenever the given entity is clicked.
             * It takes in a EntityManager as a parameter and returns void. This is where you add the scores, etc. For any FX, use fxFunction.
             */
            this.onEntityClick = data.onEntityClick;

            /**
             * this is used to define a custom removal function for the entity, meaning that if you have a BOSS, they can only die after 5 clicks, etc.
             */
            this.removeOverride = data.removeOverride || null;
            this.size = data.size;
        }
    }

    class EntityManager {
        constructor() {
            this.ents = [];
            this.gameIntervals = []; // this cleans up intervals after the game is over.
            this.time = DEFAULT_GAME_TIME;
            this.gameSpace = $("#gamespace");
            this.gameScore = 0;
            this.scoreText = $("#score");
            this.bgMusic = null;
            this.playerName = null;
            this.playerCredits = 0;
            this.onEndGame = function() {}
        }

        /**
         * A function to prompt the user for their name. It is a No-Op if the player-name is already set.
         *
         * You are meant to run loadGame before prompting for the name.
         */
        promptForName() {
            if (this.getPlayerName()) {
                return;
            }

            let pn = prompt("What is your name?")?.trim();

            if (pn) {
                this.playerName = pn;
            }
        }

        getPlayerName() {
            return this.playerName;
        }

        getGameBounds() {
            const rect = this.gameSpace.getBoundingClientRect();
            const margin = ELEMENT_SIZE;
            return {
                minX: rect.left + margin,
                maxX: rect.right - margin,
                minY: rect.top + margin,
                maxY: rect.bottom - margin,
            };
        };

        getRandomPosition() {
            const bounds = this.getGameBounds();
            const x = Math.random() * (bounds.maxX - bounds.minX) + bounds.minX;
            const y = Math.random() * (bounds.maxY - bounds.minY) + bounds.minY;

            return {x, y};
        };

        updateScoreText() {
            this.scoreText.html(`${this.gameScore} pts`);
        };

        /**
         * Adds an entity to be schedule in the ents array.
         *
         * This function also handles the disableFromStats property. This is important for optimizing statistical calculations at the EOG. It does this by
         * proxying the onEntityClick function to check if the score is modified at any given moment.
         * @param entity
         */
        addEntity(entity) {
            if (this.simulated === true) {
                return; // Don't actually spawn anything if we're just simulating for disableFromStats.
            }


            if (!entity instanceof Entity) {
                throw new Error("Only Entity instances can be added to the EntityManager.");
            }

            let scoreCache = this.gameScore;
            let entScoreCache = entity.score;
            this.simulated = true;

            entity.onEntityClick(this);

            this.simulated = false;
            entity.disableFromStats = entity.disableFromStats || (scoreCache === this.gameScore && entScoreCache === entity.score);

            // reset any resettable values to prevent side effects.
            this.gameScore = scoreCache;
            entity.score = entScoreCache;

            this.ents.push(entity);
        }

        addEntities(...entities){
            if (entities.length === 0) {
                return;
            }

            for (const entity of entities) {
                this.addEntity(entity);
            }
        }

        /**
         * Starts the entire game.
         * Runs through each entity, creates an interval for each one based on its spawn type, and handles the global timer and sound effects.
         */
        startGame() {
            if (this.simulated === true) {
                return; // Don't actually spawn anything if we're just simulating for disableFromStats.
            }

            /**
             * start game handles the intervals of all entities,
             * each entities' on click function handles the personal score, etc.
             * the game manager handles the unified timer and sound effects.
             */
            if (this.bgMusic) {
                this.bgMusic.play().catch(() => {
                })
            }

            const timerIntervalId = setInterval(() => this.decrementTimer(), TIME_DECREMENT_MS);
            this.gameIntervals.push(timerIntervalId);

            for (const entity of this.ents) {
                switch (entity.spawnType) {
                    case SpawnType.STATIC:
                        const intervalId = setInterval(() => this.staticEntPrecheck(entity), entity.spawnTime);
                        this.gameIntervals.push(intervalId);

                        console.log("Spawned static entity with interval ID:", intervalId);
                        break;
                    case SpawnType.CONTINUOUS:
                        const continuousIntervalId = setInterval(() => this.contEntPrecheck(entity), entity.spawnTime);
                        this.gameIntervals.push(continuousIntervalId);

                        console.log("Spawned Continuous entity with interval ID:", continuousIntervalId);
                        break;
                    default:
                        console.warn("Unknown spawn type for entity:", entity);
                }
            }
        }

        /**
         * Ends the game with a basic message.
         * @param {"win" | "lose"} result
         */
        endGame(result) {
            if (this.simulated === true) {
                return; // Don't actually spawn anything if we're just simulating for disableFromStats.
            }

            this.bgMusic.pause();

            alert("You " + (result === "win" ? "win!" : "lose!") + ` Your score: ${this.gameScore}`);
            let entsString = "";

            for (const ent of this.ents) {
                if (ent.disableFromStats) {
                    continue;
                }
                entsString += `Entity: ${toTitleCase(ent.cssClass)}, Score: ${ent.score}\n`;
            }
            this.addPlayerCredits(this.gameScore * 0.56); // the player credit exchange rate is 56% of final score.
            this.gameSpace.replaceChildren(...[]); // clear the game space for the end game stats display.

            alert(`Stats:\nTime Left: ${this.time}s\nScore: ${this.gameScore}`);
            alert(`Entities:\n${entsString}`);

            this.cleanupIntervals(); // cleanup any intervals created.
            this.saveGame();
            if (this.onEndGame) {
                this.onEndGame(); // call the onEndGame callback to handle any screen changes, etc.
            }

            this.time = DEFAULT_GAME_TIME;
            this.ents = [];
        }

        /**
         * Saves the game.
         */
        saveGame() {
            if (localStorage.getItem("score") === null || this.gameScore > parseInt(localStorage.getItem("score"))) {
                localStorage.setItem("score", this.gameScore);
                alert("You got a new high score of " + this.gameScore + " points, " + (this.playerName || "Player") + "! Your score has been saved.");
            }

            localStorage.setItem("name", this.playerName);
            localStorage.setItem("credits", this.playerCredits);
        }

        /**
         * Loads the game.
         */
        loadGame() {
            const savedScore = localStorage.getItem("score");
            const name = localStorage.getItem("name");
            const credits = localStorage.getItem("credits");

            if (credits) {
                this.updatePlayerCredits(parseInt(credits));
            } else {
                this.updatePlayerCredits(0); // initialize credits to 0 if there is no saved value.
            }

            if (savedScore) {
                this.updateHighScoreText(savedScore);
            }

            if (name) {
                let yesNoPrompt = prompt(`Are you ${name}? Type "yes" to confirm, or "no" to enter a new name.`)?.trim().toLowerCase();

                if (yesNoPrompt !== "yes" && yesNoPrompt !== "no") {
                    do {
                        yesNoPrompt = prompt(`Are you ${name}? Type "yes" to confirm, or "no" to enter a new name.`)?.trim().toLowerCase();
                    } while (yesNoPrompt !== "yes" && yesNoPrompt !== "no");
                }
                if (yesNoPrompt === "yes")
                    this.playerName = name;
                else
                    this.promptForName();
            } else {
                this.promptForName();
            }
        }

        /**
         * Moves the game time down by one, updating timeDisplay in the process. If time reaches 0, the game ends with a win.
         */
        decrementTimer() {
            this.time--;
            this.updateTimeText();

            if (this.time <= 0) {
                this.endGame("win");
            }
        }

        updateTimeText() {
            timeDisplay.textContent = `Time: ${this.time}s`;
        }

        /**
         * This function doesn't do a lot right now, but it's meant to be used when the game gets larger
         */
        setupGame() {
            timeDisplay.innerHTML = `Time: ${this.time}s`;
            this.updateScoreText();

            document.getElementById("name_welcome").innerHTML = `Welcome, ${this.playerName || "Player"}!`;
        }

        /**
         * Built-in helper function for spawning the static entities.
         * Checks if there is an instance before spawning a new one.
         *
         * @param {Entity} ent - The entity to check and spawn.
         */
        staticEntPrecheck(ent) {
            let resultOfCSS = this.gameSpace.querySelector(`.${ent.cssClass}`);
            if (resultOfCSS) {
                return;
            }


            if (ent.decisionFactor) {
                if (Math.random() > ent.decisionFactor) {
                    return; // don't spawn the entity if the random number is greater than the decision factor. This allows for spawn chance to be implemented.
                }
            }

            this.spawnEntity(ent);
        }

        /**
         * A pre-check which defines the bounds for a Continuous entity to spawn in.
         * It will just remove an existing one before spawning a new one.
         * @param ent
         */
        contEntPrecheck(ent) {
            // Continuous Entities check and remove an existing instance before spawning a new one.
            let resultOfCSS = this.gameSpace.querySelector(`.${ent.cssClass}`);
            if (resultOfCSS) {
                resultOfCSS.remove();
            }

            if (ent.decisionFactor) {
                if (Math.random() > ent.decisionFactor) {
                    return; // don't spawn the entity if the random number is greater than the decision factor. This allows for spawn chance to be implemented.
                }
            }

            this.spawnEntity(ent);
        }

        /**
         * Spawns an entity into the map. Low-level functionality.
         * Use the classes for higher-order functions. (Using objects instead of direct API)
         * @param {Entity} ent - The entity to spawn.
         */
        spawnEntity(ent) {
            if (this.simulated === true) {
                return; // Don't actually spawn anything if we're just simulating for disableFromStats.
            }

            const img = document.createElement("img");
            const {x, y} = this.getRandomPosition();

            img.style.position = "absolute";
            img.style.width = `${ent.size}px`;

            img.style.top = `${y}px`;
            img.style.left = `${x}px`;

            img.src = ent.image;
            img.className = ent.cssClass;

            img.addEventListener("click", () => {
                if (!ent.onEntityClick) {
                    alert("This entity does not have an onEntityClick function defined. This is erroneous and the game will reset.");
                    location.reload();
                    return;
                }

                ent.onEntityClick(this); // run the entity click function to handle score changes, fx, etc.
                if (typeof ent.sound === "string") {
                    playSound(ent.sound); // play the entity's sound effect.
                }
                else if (Array.isArray(ent.sound)) {
                    const random = Math.floor(Math.random() * ent.sound.length);
                    playSound(ent.sound[random]); // if there are multiple sound effects, pick a random one to play.
                }

                if (ent.fxFunction) {
                    ent.fxFunction(this); // run any special fx the entity has.
                }

                this.updateScoreText(); // update the score text after every click, since every click has the potential to change the score.

                if (ent.removeOverride) {
                    ent.removeOverride(img, this); // if the entity has a remove override, run it instead of the default removal behavior. This allows for special entities that have unique removal conditions, such as a balloon that pops and then disappears after a short animation.
                } else {
                    img.remove(); // remove the entity from the game space.
                }

            });

            this.gameSpace.appendChild(img);
        }

        /**
         * Takes all intervals that were defined in the game and clears them.
         */
        cleanupIntervals() {
            for (const intervalId of this.gameIntervals) {
                clearInterval(intervalId);
            }
        }

        /**
         * Sets the background music for the game. This will loop continuously until the game ends.
         * @param backgroundMusic
         */
        setBGMusic(backgroundMusic) {
            this.bgMusic = new Audio(backgroundMusic);
            this.bgMusic.loop = true;
        }

        updateHighScoreText(savedScore) {
            document.getElementById("highscore").innerHTML = "HIGH SCORE: " + savedScore + " pts";
        }

        updatePlayerCredits(number) {
            this.playerCredits = parseInt(number);
            document.getElementById("credits").innerHTML = `Credits: ${this.playerCredits} cc`;
        }

        addPlayerCredits(number) {
            this.updatePlayerCredits(this.playerCredits + number);
        }
    }

    const playAnimations = () => {
        $("#splash").delay(5000).fadeOut(10000);

        new Typed('#splash h1', {
            strings: ["GAME LOADING...", "LOADING ASSETS...", "files.load()", "DO YOU HAVE WHAT IT TAKES?"],
            typeSpeed: 30,
            showCursor: false,
        });

        setTimeout(function () {
            new Typed('#title', {
                strings: ["> BE THE REAL HACKER."],
                typeSpeed: 100,
                showCursor: false,
            });

            new Typed('#directions', {
                strings: ["> Your job is simple. Infiltrate the mainframe by clicking the server before time runs out. Each successful hack earns you points. If you're skilled enough, you might encounter the <b>rare</b> firewall that grants 5 bonus points!\n" +
                "                    <br><br>\n>" +
                "                    Hit the intrusion detection system and it's game over. Stay sharp."],
                typeSpeed: 25,
                showCursor: false,
            });
        }, 10000);
    }
    playAnimations();
});