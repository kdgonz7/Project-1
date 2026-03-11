let customCursor = document.getElementById("custom_cursor");

$(document).mousemove(function(e) {
    // Get the current mouse coordinates
    const x = e.clientX;
    const y = e.clientY;

    // Update the custom cursor's position
    customCursor.style.left = x + 'px';
    customCursor.style.top = y + 'px';
});