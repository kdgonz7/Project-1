// ——— Constants ———
// noinspection JSUnresolvedReference

const DEFAULT_GAME_TIME = 25; // seconds
const TIME_DECREMENT_MS = 1000;
const ELEMENT_SIZE = 45;
const BACKGROUND_MUSIC = "audio/Every_End.mp3";
const PLAY_ANIMATIONS = true;

let loadedLeaderboard = false;

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
        .split(' ')    // 2. Split the string into an array of words using space as a delimiter
        .map(function (word) { // 3. Iterate over each word in the array
            // Capitalize the first letter and concatenate it with the rest of the word (in lowercase)
            return (word.charAt(0).toUpperCase() + word.slice(1));
        })
        .join(' '); // 4. Join the words back into a single string with spaces
}

// ——— Enums ———
const SpawnType = {
    STATIC: "STATIC",
    CONTINUOUS: "CONTINUOUS",
    SLIDE: "SLIDE",
}

// ——— Entity Classes ———
class Entity {
    constructor(data) {
        this.image = data.image;
        this.cssClass = data.cssClass;
        this.score = data.score || 0;
        this.sound = data.sound;
        this.spawnTime = data.spawnTime;
        this.spawnType = data.spawnType;
        this.fxFunction = data.fxFunction;
        this.decisionFactor = data.decisionFactor || 1;
        this.disableFromStats = data.disableFromStats;
        this.onEntityClick = data.onEntityClick;
        this.removeOverride = data.removeOverride || null;
        this.size = data.size;
        this.getAnimatePoints = data.getAnimatePoints || null;
        this.doDecay = data.doDecay || false;
        this.decayTime = data.decayTime || 1000;
        this.slideEasing = data.slideEasing || "swing";
        this.slideTimeRandomUpper = data.slideTimeRandomUpper || 5000;
        this.slideTimeRandomLower = data.slideTimeRandomLower || 2000;

        // Only used for SLIDE spawn type, defaulting to 2000ms for the slide animation duration
        this.slideTime = data.slideTime || 2000;
    }
}

class EntityManager {
    constructor() {
        this.entQueue = [];
        this.gameIntervals = [];
        this.time = DEFAULT_GAME_TIME;
        this.gameSpace = $("#gamespace");
        this.gameScore = 0;
        this.scoreText = $("#score");
        this.bgMusic = null;
        this.playerName = null;
        this.playerCredits = 0;
        this.onEndGame = function () {}
    }

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
        const rect = this.gameSpace[0].getBoundingClientRect();
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

        return [x, y];
    };

    updateScoreText() {
        this.scoreText.html(`${this.gameScore} pts`);
    };

    addEntity(entity) {
        if (this.simulated === true) {
            return;
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

        this.gameScore = scoreCache;
        entity.score = entScoreCache;

        this.entQueue.push(entity);
    }

    addEntities(...entities) {
        if (entities.length === 0) {
            return;
        }

        for (const entity of entities) {
            this.addEntity(entity);
        }
    }

    /**
     * Starts the game, initializes threads given the entity pool, and plays the background music, and starts timer.
     */
    startGame() {
        if (this.simulated === true) {
            return;
        }

        if (this.bgMusic) {
            this.bgMusic.play().catch(() => {
            });
        }

        const timerIntervalId = setInterval(() => this.decrementTimer(), TIME_DECREMENT_MS);
        this.gameIntervals.push(timerIntervalId);

        /**
         * WRITTEN BY AI
         */
        for (const entity of this.entQueue) {
            // I asked it to simplify the thread process through creating a new function createThread
            // to add new threads and automatically store their IDs in the gameIntervals array for easy cleanup later.
            // This way, we avoid code repetition and make it easier to manage intervals for different spawn types.
            const createThread = (fn, id, type) => {
                const intervalId = setInterval(fn, id);
                this.gameIntervals.push(intervalId);
                console.log(`Spawned ${type} entity with interval ID:`, intervalId);
            };

            switch (entity.spawnType) {
                case SpawnType.STATIC:
                    createThread(() => this.staticEntPrecheck(entity), entity.spawnTime, "static");
                    break;
                case SpawnType.CONTINUOUS:
                    createThread(() => this.contEntPrecheck(entity), entity.spawnTime, "continuous");
                    break;
                case SpawnType.SLIDE:
                    createThread(() => this.slideEntPrecheck(entity), entity.spawnTime, "slide");
                    break;
                default:
                    console.warn("Unknown spawn type for entity:", entity);
            }
        }
    }

    /**
     * Ends the game with the given result.
     *
     * @param result {"win"|"lose"} - The result of the game, either "win" or "lose".
     */
    endGame(result) {
        if (this.simulated === true) {
            console.log("endGame() called during simulation. Ignored.")
            return;
        }

        if (this.bgMusic) {
            this.bgMusic.pause();
        }

        alert("You " + (result === "win" ? "win!" : "lose!") + ` Your score: ${this.gameScore}`);

        let entsString = "";

        for (const ent of this.entQueue) {
            if (ent.disableFromStats) {
                continue;
            }

            entsString += `Entity: ${toTitleCase(ent.cssClass)}, Score: ${ent.score}\n`;
            ent.score = 0;
        }

        this.addPlayerCredits(this.gameScore * 0.56);
        this.gameSpace.empty();

        alert(`Stats:\nTime Left: ${this.time}s\nScore: ${this.gameScore}`);
        alert(`Entities:\n${entsString}`);
        if (this.onEndGame) {
            console.log("Running onEndGame callback with available entities: ", this.entQueue);
            this.onEndGame(this.entQueue);
        }
        this.cleanupIntervals();
        this.saveGame();


        this.time = DEFAULT_GAME_TIME;
        this.entQueue = [];
    }

    saveGame() {
        if (localStorage.getItem("score") === null || this.gameScore > parseInt(localStorage.getItem("score"))) {
            localStorage.setItem("score", this.gameScore);
            alert("You got a new high score of " + this.gameScore + " points, " + (this.playerName || "Player") + "! Your score has been saved.");
        }

        localStorage.setItem("name", this.playerName);
        localStorage.setItem("credits", this.playerCredits);
    }

    loadGame() {
        const savedScore = localStorage.getItem("score");
        const name = localStorage.getItem("name");
        const credits = localStorage.getItem("credits");

        if (credits) {
            this.updatePlayerCredits(parseInt(credits));
        } else {
            this.updatePlayerCredits(0);
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

    setupGame() {
        $("#time").html(`Time: ${this.time}s`);
        this.updateScoreText();
        $("#name_welcome").html(`Welcome, ${this.playerName || "Player"}!`);
    }

    decrementTimer() {
        this.time--;
        this.updateTimeText();

        if (this.time <= 0) {
            this.endGame("win");
        }
    }

    updateTimeText() {
        $("#time").text(`Time: ${this.time}s`);
    }

    /**
     *
     * @param ent {Entity}
     */
    slideEntPrecheck(ent) {
        // slide entities slide between multiple points
        // they have no checks

        if (this.simulated === true) {
            return;
        }

        // if (this.getAllInstancesOf(ent.cssClass).length > 0) {
        //     return;
        // }

        if (!ent.getAnimatePoints) {
            console.warn("Entity with spawnType SLIDE is missing a valid getAnimatePoints function. Entity:", ent);
            return;
        }

        let bounds = ent.getAnimatePoints(this);

        if (typeof bounds === "string" && bounds.toUpperCase() === "RANDOM") {
            bounds = [this.getRandomPosition(), this.getRandomPosition()];
        }

        if (!Array.isArray(bounds) || bounds.length < 2) {
            console.warn("Entity with spawnType SLIDE has an invalid getAnimatePoints return value. Expected an array of at least 2 points, where each point is an array of [y, x]. Entity:", ent, "getAnimatePoints return value:", bounds);
            return;
        }

        let cbi = this.spawnEntity(ent);

        console.log(`Exposing manager interface: ${this}`);
        console.log("Animation Running.")
        console.log("Bounds: " + JSON.stringify(bounds));
        console.log("Len(Bounds)" + bounds.length);

        if (ent.slideTime === "RANDOM") {
            ent.slideTime = Math.random() * ent.slideTimeRandomUpper + ent.slideTimeRandomLower; // Random slide time between 2 and 5 seconds
        }

        $(cbi).animate({
            top: `${bounds[0][1]}px`,
            left: `${bounds[0][0]}px`,
        }, ent.slideTime, ent.slideEasing, function () {
            console.log("First animation complete for SLIDE entity. Starting second animation. Entity:", ent);
            $(cbi).animate({
                top: `${bounds[1][1]}px`,
                left: `${bounds[1][0]}px`,
            }, ent.slideTime, ent.slideEasing, function() {
                if (ent.doDecay) {
                    console.log("Ent Fade Out");
                    $(cbi).fadeOut(ent.decayTime, function() {
                        $(cbi).remove();
                    });
                }
            });
        });
    }

    getAllInstancesOf(cssClass) {
        return this.gameSpace.find(`.${cssClass}`);
    }

    anyInstancesOf(cssClass) {
        return this.getAllInstancesOf(cssClass).length > 0;
    }

    staticEntPrecheck(ent) {
        if (this.anyInstancesOf(ent.cssClass)) {
            return;
        }

        if (ent.decisionFactor) {
            if (Math.random() > ent.decisionFactor) {
                return;
            }
        }

        this.spawnEntity(ent);
    }

    contEntPrecheck(ent) {
        let results = this.getAllInstancesOf(ent.cssClass);

        if (results.length > 0) {
            for (let i = 1; i < results.length; i++) {
                $(results[i]).remove();
            }
        }

        if (ent.decisionFactor) {
            if (Math.random() > ent.decisionFactor) {
                return;
            }
        }

        this.spawnEntity(ent);
    }

    /**
     * This function spawns an entity and returns its jQuery object. It also handles the click event for the entity, including playing sounds, updating scores, and applying effects.
     * @param ent
     * @returns {*|jQuery|HTMLElement}
     */
    spawnEntity(ent) {
        if (this.simulated === true) {
            return;
        }

        const $img = $('<img alt="A mole on the page">');
        // BUG: for some reason "{}" was used instead of "[]" for destructuring the random position, which caused an error and prevented entities from spawning. This has been fixed to use "[]" for array destructuring.
        const [x, y] = this.getRandomPosition();
        console.log("Spawning mole at position:", {x, y});

        $img.css({
            position: "absolute",
            width: `${ent.size}px`,
            top: `${y}px`,
            left: `${x}px`
        });

        $img.attr('src', ent.image);
        $img.addClass(ent.cssClass);

        $img.on("click", () => {
            if (!ent.onEntityClick) {
                alert("This entity does not have an onEntityClick function defined. This is erroneous and the game will reset.");
                location.reload();
                return;
            }

            if (typeof ent.sound === "string") {
                playSound(ent.sound);
            } else if (Array.isArray(ent.sound)) {
                const random = Math.floor(Math.random() * ent.sound.length);
                playSound(ent.sound[random]);
            }

            // onEntityClick can return true to prevent default click behavior (removing the entity and applying fx)
            if (ent.onEntityClick(this) === true) {
                console.log("Entity's onEntityClick function returned true, preventing default click behavior for this entity.");
                return;
            }

            if (ent.fxFunction) {
                ent.fxFunction(this);
            }

            this.updateScoreText();

            if (ent.removeOverride) {
                ent.removeOverride($img[0], this);
            } else {
                $img.remove();
            }
        });

        this.gameSpace.append($img);

        return $img;
    }

    cleanupIntervals() {
        for (const intervalId of this.gameIntervals) {
            clearInterval(intervalId);
        }
    }

    // noinspection JSUnusedGlobalSymbols
    setBGMusic(backgroundMusic) {
        this.bgMusic = new Audio(backgroundMusic);
        this.bgMusic.loop = true;
    }

    updateHighScoreText(savedScore) {
        $("#highscore").html("HIGH SCORE: " + savedScore + " pts");
    }

    updatePlayerCredits(number) {
        this.playerCredits = parseInt(number);
        $("#credits").html(`Credits: ${this.playerCredits} cc`);
    }

    addPlayerCredits(number) {
        this.updatePlayerCredits(this.playerCredits + number);
    }
}

// ——— Animation Functions ———
const playAnimations = (playerName, startButton) => {
    let $splashScreen = $("#splash");

    $splashScreen.css("display", "flex").hide().fadeIn(1000);
    $splashScreen.delay(5000).fadeOut(10000);
    startButton.hide();

    console.log("VERSION: This game version has animations loaded.");

    new Typed('#splash h1', {
        strings: ["GAME LOADING...", "LOADING ASSETS...", "playerInformation.retrieve({})", `HELLO, ${playerName}`, "DO YOU HAVE WHAT IT TAKES?"],
        typeSpeed: 30,
        showCursor: false,
    });
    let instructionString = "> Your job is simple. Infiltrate the mainframe by clicking the cute server cat before time runs out. Each successful hack earns you points. If you're skilled enough, you might encounter the <b>rare</b> firewall that grants 5 bonus points!\n" +
        "                    <br><br>\n>" +
        "                    Hit the intrusion detection system, and it's game over. Stay sharp.<br><br>\n> I didn't give you any access to the start button until now. Good luck.\n";

    let skipped = false;
    $("#skip_intro").click(function () {
        startButton.show();
        console.log("NOTE: Skipped intro.")

        $("#directions").html(instructionString);
        $("#title").html("> BE THE REAL HACKER.");
        $("#splash").hide();

        skipped = true;
    })

    setTimeout(function () {
        if (skipped) {
            console.log("NOTE: Skipped instructions because the intro was skipped -> Instructions are assumed to be on the page already.");
            return false;
        }

        new Typed('#title', {
            strings: ["> BE THE REAL HACKER."],
            typeSpeed: 100,
            showCursor: false,
        });

        // noinspection JSUnusedGlobalSymbols
        new Typed('#directions', {
            strings: [instructionString],
            typeSpeed: 25,
            showCursor: false,
            onComplete: function () {
                startButton.fadeIn(2000);
            }
        });
    }, 10000);
}

$(document).ready(() => {
    // ——— DOM Elements ———
    const entityManager = new EntityManager();
    $("#time");
    $("#name_welcome");
    const startButton = $("#start_button");

    entityManager.promptForName();

    setTimeout(() => {
        let gameAudio = new Audio(BACKGROUND_MUSIC);

        gameAudio.loop = true;
        gameAudio.play().catch(() => {
        })
    }, 100);

    if (PLAY_ANIMATIONS)
        playAnimations(entityManager.getPlayerName(), startButton);

    let serverCat = new Entity({
        image: "img/matrix_cat.webp",
        cssClass: "matrix_cat",
        sound: "audio/meow-1.mp3",
        spawnTime: 1500,
        spawnType: SpawnType.CONTINUOUS,
        size: ELEMENT_SIZE,
        onEntityClick: function (manager) {
            this.score += 1;
            manager.gameScore += 1;
            manager.updateScoreText();
        }
    });

    let firewall = new Entity({
        image: "img/firewall.webp",
        cssClass: "firewall",
        sound: "audio/firewall.mp3",
        spawnTime: 7000,
        spawnType: SpawnType.STATIC,
        decisionFactor: 0.3,
        size: ELEMENT_SIZE + 10,
        onEntityClick: function (mgr) {
            mgr.gameScore += 5;
            this.score += 5;
            mgr.updateScoreText();
        }
    });

    let blindness = new Entity({
        image: "img/blindness.png",
        cssClass: "blindness",
        sound: "audio/blindness.mp3",
        spawnTime: 1000,
        spawnType: SpawnType.CONTINUOUS,
        size: ELEMENT_SIZE,
        onEntityClick: function () {
            $("#blindness").fadeIn(500).fadeOut(500);
        }
    });

    let detectionSystem = new Entity({
        image: "img/detection.png",
        cssClass: "detection_system",
        sound: "audio/detection.mp3",
        spawnTime: 800,
        spawnType: SpawnType.CONTINUOUS,
        size: ELEMENT_SIZE + 15,
        onEntityClick: function (manager) {
            manager.endGame("lose");
        }
    });


    let slideTest = new Entity({
        image: "img/firewall.png",
        cssClass: "detection_system",
        sound: "audio/detection.mp3",
        score: 0,
        spawnTime: 800,
        spawnType: SpawnType.SLIDE,

        slideTime: "RANDOM",
        slideTimeRandomLower: 500,
        slideTimeRandomUpper: 2000,
        slideEasing: "swing",
        doDecay: true,
        decayTime: 500,
        getAnimatePoints: function () {
            return "RANDOM";
        },

        size: ELEMENT_SIZE + 15,
        onEntityClick: function (manager) {
            manager.gameScore += 1;
            manager.updateScoreText();
            this.score ++;
        }
    });

    startButton.click(() => {
        entityManager.loadGame();
        entityManager.setupGame();
        entityManager.addEntities(slideTest);

        $("#mainGameInstructionsPage").fadeOut(1000);
        $("#gamespaceTotality").fadeIn(1000, () => {
            entityManager.startGame();
            entityManager.onEndGame = function (entReport) {
                $("#gamespaceTotality").fadeOut(1000, () => {
                    $("#leaderstats").fadeIn(1000);

                    console.log("Showing leaderboard statistics. Current entities in manager:", entityManager.entQueue);
                    // populate leaderstats with score for each entity in entity manager

                    if (!loadedLeaderboard) {
                        let tableLeaderboard = $("#leaderboardt");

                        for (const ent of entReport) {
                            console.log(ent);
                            if (ent.disableFromStats) {
                                continue;
                            }


                            let row = `<tr><td>${toTitleCase(ent.cssClass)}</td><td>${ent.score}</td></tr>`;
                            tableLeaderboard.append(row);
                        }

                        loadedLeaderboard = true;
                    }
                });
            }
        });
    });

    $("#back_to_menu").click(() => {
        $("#leaderstats").fadeOut(1000, () => {
            $("#mainGameInstructionsPage").fadeIn(1000);
        });
    });
});



