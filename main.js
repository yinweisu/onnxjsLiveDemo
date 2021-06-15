const tasks = {
    CLASSIFICATION: 'classification',
    OBJECT_DETECTION: 'object_detection',
    SEMANTIC_SEGMENTATION: 'semantic_segmentation',
    INSTANCE_SEGMENTATION: 'instance_segmentation',
    POSE_ESTIMATION: 'pose_estimation',
}

const media_constraints = {
    video: {
        width: 1280,
        height: 720,
    }
};
const input_height = 224;
const input_width = 224;

const model_file = './resnet18_v1.onnx';
const task = tasks.CLASSIFICATION;
var session = undefined;
const preprocessor = new Preprocessor();
const postprocessor = new Postprocessor(task);

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
      }, 1000); // roughly 5 frames per second
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

    computeFrame: async function() {
        this.ctx1.drawImage(this.video, 0, 0, input_width, input_height);
        var frame = this.ctx1.getImageData(0, 0, input_width, input_height);
        var l = frame.data.length / 4;
        var rgb_frame = frame.data.slice(0, l*3);
        var rgb_frame_f32 = Float32Array.from(rgb_frame);

        // preprocessor.normalize(rgb_frame_f32, l);
        const image_tensor = new ort.Tensor('float32', rgb_frame_f32, [1,224,224,3]);
        // console.log(image_tensor);
        const result = await session.run({data: image_tensor});
        // extract the data from result
        const data = Object.keys(result).map((key) => result[key])[0].data;
        // const data = result.resnetv10_dense0_fwd.data;
        // console.log(data);
        postprocessor.visualize(data, {k:1});

        // this.ctx1.putImageData(frame, 0, 0);

        return;
    }
}; 

async function main() {
    try {
        session = await ort.InferenceSession.create(model_file);
        navigator.mediaDevices.getUserMedia(media_constraints)
        .then(function (stream) {
            var local_video_stream = document.getElementById('local_video_stream');
            local_video_stream.srcObject = stream;
            processor.doLoad();
        })
        .catch(handle_get_user_media_error);
    } catch (e) {
        alert(e);
    }
    
}

main();
