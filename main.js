const media_constraints = {
    video: {
        width: 1280,
        height: 720,
    }
};

function handle_get_user_media_error(e) {
    switch(e.name) {
        case 'NotFoundError':
            alert('Unable to push video because no camera was found');
            break;
        case 'SecurityError':
        case 'PermissionDeniedError':
            break;
        default:
            alert('Error opening your camera: ' + e.message);
            break;
    }
}

navigator.mediaDevices.getUserMedia(media_constraints)
.then(function (stream) {
    var local_video_stream = document.getElementById('local_video_stream');
    local_video_stream.srcObject = stream;
    // local_video_stream.addEventListener('')
})
.catch(handle_get_user_media_error);
