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

/**
 * Converts the given string to title case.
 *
 * Used in CSS classes.
 * @param str
 * @returns {string}
 */
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
    setupEntityWithData(data) {
        /**
         * The image used for the entity.
         *
         * The image can be anything usable for the most part.
         * @type {string|boolean|VideoFrame|*}
         */
        this.image = data.image;

        /**
         * Defines the entity's CSS Class. This is essential not only for the CSS styling of entities, but also for their unique IDs.
         *
         * If two entities have the same CSS class, then the EntityManager will break apart the functionality to them largely in the same way.
         *
         * @type {string}
         */
        this.cssClass = data.cssClass;

        /**
         * Defines the entity's encapsulated score. Used in leaderboards and statistics.
         * @type {*|number}
         */
        this.score = data.score || 0;

        /**
         * The sound that the entity will play when it is clicked.
         *
         * *NOTE*: this functionality is somewhat archaic and barebones, and for any level-systems, or any system where granular control is preferred,
         * you can instead use {@link removeOverride} and {@link onEntityClick} to define your sounds.
         * @type {string[]|*}
         */
        this.sound = data.sound;

        /**
         * Defines the timing for which the Entity's thread will run.
         *
         * Threading is handled by {@link EntityManager.startGame}.
         * @type {number|*}
         */
        this.spawnTime = data.spawnTime;

        /**
         * Defines the spawn type of the entity. The EntityManager supports different use cases.
         * @type {SpawnType}
         */
        this.spawnType = data.spawnType;

        /**
         * The fxFunction is deprecated.
         *
         * Originally was meant to be a function for handling FX. The better suited and well-supported function is {@link removeOverride}
         *
         * @type {function(emg: EntityManager)}
         * @deprecated
         */
        this.fxFunction = data.fxFunction;

        /**
         * The decision factor is a number between 0 and 1 that defines the probability of the entity spawning.
         *
         * This functionality is largely deterministic.
         * @type {float}
         */
        this.decisionFactor = data.decisionFactor || 1;

        /**
         * A calculated variable that defines if an entity should be shown in stat boards (leaderboard, etc.)
         *
         * Any external {@link Entity} managements should respect this variable.
         *
         * ### Calculation
         *
         * If an entity's {@link onEntityClick} function does not utilize the {@link EntityManager.gameScore} or {@link Entity.score}
         * objects, then it will be removed from the stats viewers. The {@link EntityManager} class runs the entity's click function through a simulated
         * instance to find this information.
         */
        this.disableFromStats = data.disableFromStats;

        /**
         * A function that runs whenever an entity is clicked.
         *
         * Designed for more basic, primitive actions such as:
         * - Updating the score
         * - Losing the game
         * - Playing a second-hand sound effect
         *
         * This function is mostly managed by the EntityManager. You should use {@link removeOverride} if you want to handle the removal of the entity and any effects related to that removal yourself, such as playing a death animation or fading out the entity before removal.
         */
        this.onEntityClick = data.onEntityClick;

        /**
         * onEntitySpawn is a function that runs whenever an entity's thread spawns it. It is designed for pre-spawn checks, such as checking if there are already entities of the same type on the field, or if certain conditions are met before allowing the entity to spawn.
         * @type {*|(function(*): boolean)|(function(): boolean)}
         */
        this.onEntitySpawn = data.onEntitySpawn || function () {
            return true;
        };

        /**
         * Basic primitive type that defines the size.
         * @type {number}
         */
        this.size = data.size;

        /**
         * Remove override is similar to onEntityClick except it exposes more information about the entity. Unlike {@link onEntityClick},
         * RemoveOverride will have both the jQuery image and the manager passed in, and is expected to handle the removal of the entity itself. This allows for more complex removal effects, such as fading out or playing an animation before removal.
         * @type {function(HTMLElement, EntityManager)|null}
         */
        this.removeOverride = data.removeOverride || null;

        /**
         * `getAnimatePoints` is a data function that should return either:
         * - `"RANDOM"` -> Will pass the responsibility to the game manager to generate 2 random points within the game bounds for the slide animation.
         * - An array of at least 2 points, where each point is an array of [x, y] coordinates, which will be used as the start and end points for the slide animation.
         * @type {*|(function(): string)|null}
         */
        this.getAnimatePoints = data.getAnimatePoints || null;

        /**
         * Allow the entity manager to handle the fade out of this entity after a certain point.
         *
         * Primarily works with SLIDE and CONTINUOUS entities. If true, the entity will fade out after completing its animation (for SLIDE) or after spawning (for CONTINUOUS), and then be removed from the game space. The duration of the fade out can be controlled with the `decayTime` property.
         * @type {*|boolean}
         */
        this.doDecay = data.doDecay || false;
        this.decayTime = data.decayTime || 1000;

        /**
         * The slide easing defines the type of easing used to render the slide by jQuery.
         *
         * Only valid when entity type is SLIDE.
         * @type {*|string}
         */
        this.slideEasing = data.slideEasing || "swing";

        /**
         * Defines the sliding time between points for the SLIDE entity type.
         * If set to "RANDOM", the game manager will generate a random slide time between `slideTimeRandomLower` and `slideTimeRandomUpper` for each animation instance of this entity. Otherwise, it should be a number representing the slide time in milliseconds.
         * @type {*|string|number}
         */
        this.slideTime = data.slideTime || 2000;
        this.slideTimeRandomUpper = data.slideTimeRandomUpper || 5000;
        this.slideTimeRandomLower = data.slideTimeRandomLower || 2000;

        /**
         * Defines the amount of steps that the entity takes whenever it slides around.
         *
         * By default, it's two, meaning that it will slide two steps (from point A to point B, then from point B to point A). If set to 1, it will only slide from point A to point B and then stop. If set to a number higher than 2, it will continue sliding between the points for the amount of steps defined (e.g., if set to 4, it will slide from A to B, then B to C, then C to D, and then stop).
         * @type {*|number}
         */
        this.slideSteps = data.slideSteps || 2;
    }

    setupEntityWithClasses(GeneralEntityInformation, SpawnInformation, DecayInformation, SlideInformation, EntityImplementation) {
        this.image = GeneralEntityInformation.image;
        this.cssClass = GeneralEntityInformation.cssClass;
        this.sound = GeneralEntityInformation.sound;
        this.score = GeneralEntityInformation.score;
        this.size = GeneralEntityInformation.size;

        this.spawnTime = SpawnInformation.spawnTime;
        this.spawnType = SpawnInformation.spawnType;
        this.decisionFactor = SpawnInformation.decisionFactor;

        this.doDecay = DecayInformation.doDecay;
        this.decayTime = DecayInformation.decayTime;

        this.slideTime = SlideInformation.time;
        this.getAnimatePoints = SlideInformation.bounds;
        this.slideSteps = SlideInformation.steps;
        this.slideEasing = SlideInformation.easing;
        this.slideTimeRandomUpper = SlideInformation.upper;
        this.slideTimeRandomLower = SlideInformation.lower;

        this.onEntityClick = EntityImplementation.onEntityClick;
        this.onEntitySpawn = EntityImplementation.onEntitySpawn;
        this.removeOverride = EntityImplementation.removeOverride;
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
        this.onEndGame = function () {
        }
        this.locked = false;
        this.simulated = false;
    }

    lock() {
        this.locked = true;
    }

    unlock() {
        this.locked = false;
    }

    isLocked() {
        return this.locked;
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
        this.gameScore = 0;

        // flush each entity's score to 0
        for (const ent of this.entQueue) {
            ent.score = 0;
        }
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
            bounds = [];

            for (let i = 0 ; i < ent.slideSteps ; i++) {
                bounds.push(this.getRandomPosition());
            }
        }

        if (!Array.isArray(bounds) || bounds.length < ent.slideSteps) {
            console.warn("Entity with spawnType SLIDE has an invalid getAnimatePoints return value. Expected an array of at least " + ent.slideSteps + " points, where each point is an array of [y, x]. Entity:", ent, "getAnimatePoints return value:", bounds);
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


        let animateElement = $(cbi);

        for (let i = 0; i < ent.slideSteps; i++) {
            animateElement.animate(
                {
                    top: `${bounds[i][1]}px`,
                    left: `${bounds[i][0]}px`,
                },
                ent.slideTime,
            ).promise();
        }

        if (ent.doDecay) {
            animateElement.fadeOut(ent.decayTime, function () {
                animateElement.remove();
            });
        }
        // $(cbi).animate({
        //     top: `${bounds[0][1]}px`,
        //     left: `${bounds[0][0]}px`,
        // }, ent.slideTime, ent.slideEasing, function () {
        //     console.log("First animation complete for SLIDE entity. Starting second animation. Entity:", ent);
        //     $(cbi).animate({
        //         top: `${bounds[1][1]}px`,
        //         left: `${bounds[1][0]}px`,
        //     }, ent.slideTime, ent.slideEasing, function () {
        //         if (ent.doDecay) {
        //             console.log("Ent Fade Out");
        //             $(cbi).fadeOut(ent.decayTime, function () {
        //                 $(cbi).remove();
        //             });
        //         }
        //     });
        // });
    }

    getAllInstancesOf(cssClass) {
        return this.gameSpace.find(`.${cssClass}`);
    }

    anyInstancesOf(cssClass) {
        return this.getAllInstancesOf(cssClass).length > 0;
    }

    staticEntPrecheck(ent) {
        if (ent.onEntitySpawn(this) === false) {
            return;
        }

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
        if (ent.onEntitySpawn(this) === false) {
            return;
        }

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
        if (ent.onEntitySpawn(this) === false) {
            return;
        }

        if (this.simulated === true) {
            return;
        }

        const $img = $('<img alt="A mole on the page" src="">');

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


class GeneralEntityInformation {
    constructor(image, cssClass, sound, score, size) {
        this.image = image;
        this.cssClass = cssClass;
        this.sound = sound;
        this.score = score;
        this.size = size;
    }
}
class SpawnInformation {
    constructor(spawnTime, spawnType, decisionFactor) {
        this.spawnTime = spawnTime;
        this.spawnType = spawnType;
        this.decisionFactor = decisionFactor;
    }
}
class DecayInformation {
    constructor(doDecay, decayTime) {
        this.doDecay = doDecay;
        this.decayTime = decayTime;
    }
}
class SlideInformation {
    // NOTE: upper and lower CAN BE NULL if bounds is not "RANDOM"
    constructor(time, bounds, steps, easing, upper, lower) {
        this.time = time;
        this.bounds = bounds;
        this.steps = steps;
        this.easing = easing;
        this.upper = upper;
        this.lower = lower;
    }
}
class EntityImplementation {
    constructor(data) {
        this.onEntityClick = data.onEntityClick;
        this.onEntitySpawn = data.onEntitySpawn;
        this.removeOverride = data.removeOverride;
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


    let slideTest = new Entity();
    slideTest.setupEntityWithData({
        image: "img/firewall.png",
        cssClass: "slider",
        sound: [
            "audio/meow-1.mp3",
            "audio/meow-2.mp3",
            "audio/meow-3.mp3"
        ],
        score: 0,
        spawnTime: 800,
        spawnType: SpawnType.SLIDE,

        slideTime: "RANDOM",
        slideTimeRandomLower: 1000,
        slideTimeRandomUpper: 2000,
        slideSteps: 2,
        slideEasing: "swing",

        doDecay: true,
        decayTime: 500,
        getAnimatePoints: function () {
            return "RANDOM";
        },

        size: ELEMENT_SIZE + 15,
        onEntityClick: function (manager) {
            manager.gameScore += 1;
            this.score++;
        },


        removeOverride: function (img, manager) {
            let imagePosition = img.getBoundingClientRect();
            let explosion = $("<img alt=\"explosion\" src='../img/heart.gif' class='heart_explosion'>");

            explosion.css({
                position: "absolute",
                top: imagePosition.top,
                left: imagePosition.left,
                width: `${ELEMENT_SIZE + 20}px`
            });

            manager.gameSpace.append(explosion);
            explosion.fadeOut(900);
            img.remove();
        }
    });

    let moverFish = new Entity();
    moverFish.setupEntityWithData({
        image: "img/matrix_cat.png",
        cssClass: "fish",
        sound: [
            "audio/meow-1.mp3",
            "audio/meow-2.mp3",
            "audio/meow-3.mp3"
        ],
        score: 0,
        spawnTime: 800,
        spawnType: SpawnType.SLIDE,
        size: ELEMENT_SIZE + 15,

        slideTime: "RANDOM",
        slideTimeRandomLower: 500,
        slideTimeRandomUpper: 1000,
        slideSteps: 8,
        slideEasing: "swing",

        doDecay: true,
        decayTime: 1000,

        getAnimatePoints: function () {
            return "RANDOM";
        },

        onEntityClick: function (manager) {
            manager.gameScore += 1;
            this.score++;
        },

        onEntitySpawn: function(manager) {
            return !manager.anyInstancesOf(this.cssClass);
        },

        removeOverride: function (img, manager) {
            let imagePosition = img.getBoundingClientRect();
            let explosion = $("<img alt=\"explosion\" src='../img/heart.gif' class='heart_explosion'>");

            explosion.css({
                position: "absolute",
                top: imagePosition.top,
                left: imagePosition.left,
                width: `${ELEMENT_SIZE + 20}px`
            });

            manager.gameSpace.append(explosion);
            explosion.fadeOut(900);
            img.remove();
        }
    });

    let testFish = new Entity();
    testFish.setupEntityWithClasses(
        new GeneralEntityInformation(
            "img/matrix_cat.png",
            "testfish",
            [
                "audio/meow-1.mp3",
                "audio/meow-2.mp3",
                "audio/meow-3.mp3"
            ],
            0,
            ELEMENT_SIZE,
        ),
        new SpawnInformation(
            800,
            SpawnType.SLIDE,
            null
        ),

        new DecayInformation(
            true,
            1000
        ),

        new SlideInformation(
            "RANDOM",
            function () {
                return "RANDOM";
            },
            8,
            "swing",
            1000,
            500
        ),

        new EntityImplementation({
            onEntityClick: function(manager) {
                manager.gameScore += 1;
                this.score++;
            },

            onEntitySpawn: function(manager) {},
        })
    );

    startButton.click(() => {
        if (entityManager.isLocked()) return;
        entityManager.loadGame();
        entityManager.setupGame();
        entityManager.addEntities(slideTest, testFish);

        entityManager.lock();
        $("body").css("background", "url('img/matrixrain.gif') no-repeat center center fixed").css("background-size", "cover");
        $("#mainGameInstructionsPage").fadeOut(1000);
        $("#gamespaceTotality").fadeIn(1000, () => {
            entityManager.startGame();
            entityManager.onEndGame = function (entReport) {
                $("#gamespaceTotality").fadeOut(1000, () => {
                    $("#leaderstats").fadeIn(1000);

                    console.log("Showing leaderboard statistics. Current entities in manager:", entReport);
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

                    entityManager.unlock();
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
