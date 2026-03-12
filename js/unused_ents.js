// let serverCat = new Entity({
//     image: "img/matrix_cat.webp",
//     cssClass: "matrix_cat",
//     sound: "audio/meow-1.mp3",
//     spawnTime: 1500,
//     spawnType: SpawnType.CONTINUOUS,
//     size: ELEMENT_SIZE,
//     onEntityClick: function (manager) {
//         this.score += 1;
//         manager.gameScore += 1;
//         manager.updateScoreText();
//     }
// });
//
// let firewall = new Entity({
//     image: "img/firewall.webp",
//     cssClass: "firewall",
//     sound: "audio/firewall.mp3",
//     spawnTime: 7000,
//     spawnType: SpawnType.STATIC,
//     decisionFactor: 0.3,
//     size: ELEMENT_SIZE + 10,
//     onEntityClick: function (mgr) {
//         mgr.gameScore += 5;
//         this.score += 5;
//         mgr.updateScoreText();
//     }
// });
//
// let blindness = new Entity({
//     image: "img/blindness.png",
//     cssClass: "blindness",
//     sound: "audio/blindness.mp3",
//     spawnTime: 1000,
//     spawnType: SpawnType.CONTINUOUS,
//     size: ELEMENT_SIZE,
//     onEntityClick: function () {
//         $("#blindness").fadeIn(500).fadeOut(500);
//     }
// });
//
// let detectionSystem = new Entity({
//     image: "img/detection.png",
//     cssClass: "detection_system",
//     sound: "audio/detection.mp3",
//     spawnTime: 800,
//     spawnType: SpawnType.CONTINUOUS,
//     size: ELEMENT_SIZE + 15,
//     onEntityClick: function (manager) {
//         manager.endGame("lose");
//     }
// });