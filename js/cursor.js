let customCursor = document.getElementById("custom_cursor");
let cursorEnabled = true;

$(document).mousemove(function(e) {
    // Get the current mouse coordinates
    const x = e.clientX;
    const y = e.clientY;

    // Update the custom cursor's position
    customCursor.style.left = x + 'px';
    customCursor.style.top = y + 'px';
});

$("#toggle_cursor").click(function() {
    cursorEnabled = !cursorEnabled;

    if (cursorEnabled) {
        customCursor.style.display = "block";
        $("*").css("cursor", "none");
    } else {
        customCursor.style.display = "none";
        $("*").css("cursor", "default");
    }
});