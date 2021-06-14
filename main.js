const media_constraints = {
    video: {
        width: 1280,
        height: 720,
    }
};

const input_height = 224;
const input_width = 224;

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

var processor = {
    timerCallback: function() {
        if (this.video.paused || this.video.ended) {
            return;
        }
        this.computeFrame();
        var self = this;
        setTimeout(function () {
            self.timerCallback();
      }, 100); // roughly 10 frames per second
    },

    doLoad: function() {
        this.video = document.getElementById("local_video_stream");
        this.c1 = document.getElementById("result_canvas");
        this.ctx1 = this.c1.getContext("2d");
        var self = this;
    
        this.video.addEventListener("play", function() {
            self.width = self.video.width;
            self.height = self.video.height;
            self.timerCallback();
        }, false);
    },

    computeFrame: function() {
        this.ctx1.drawImage(this.video, 0, 0, input_width, input_height);
        var frame = this.ctx1.getImageData(0, 0, input_width, input_height);
        var l = frame.data.length / 4;
        var rgb_frame = frame.data.slice(0, l*3);
        var rgb_frame_f32 = Float32Array.from(rgb_frame);
        
        // this.ctx1.putImageData(frame, 0, 0);

        return;
    }
}; 

navigator.mediaDevices.getUserMedia(media_constraints)
.then(function (stream) {
    var local_video_stream = document.getElementById('local_video_stream');
    local_video_stream.srcObject = stream;
    processor.doLoad();
    // local_video_stream.addEventListener('')
})
.catch(handle_get_user_media_error);

