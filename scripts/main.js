const tasks = {
    CLASSIFICATION: 'classification',
    OBJECT_DETECTION: 'object_detection',
    SEMANTIC_SEGMENTATION: 'semantic_segmentation',
    INSTANCE_SEGMENTATION: 'instance_segmentation',
    POSE_ESTIMATION: 'pose_estimation',
}

const media_constraints = {
    video: {
        width: 720,
        height: 480,
    }
};

// const model_path = 'models/resnet18_v1.onnx';
// const task = tasks.CLASSIFICATION;
const model_path = 'models/yolo3_mobilenet1.0_voc.onnx';
const task = tasks.OBJECT_DETECTION;
// const model = new Model(model_path, 224, 224, task, image_net_labels);
const model = new Model(model_path, 512, 512, task, voc_detection_labels);
var session = undefined;
const preprocessor = new Preprocessor();
const postprocessor = new Postprocessor(model.task);

function screenshot() {
    processor.computeFrame();
}

var processor = {
    doLoad: function() {
        this.video = document.getElementById('local_video_stream');
        this.video_width = this.video.width;
        this.video_height = this.video.height;
        this.c1 = document.getElementById('result_canvas');
        this.ctx1 = this.c1.getContext('2d');
    },

    visualize: function(processed_result) {
        var classification_result_element = document.getElementById('classification_result');
        classification_result_element.hidden = true;
        switch (model.task) {
            case tasks.CLASSIFICATION:
                var classification_result_element = document.getElementById('classification_result');
                classification_result_element.hidden = false;
                results = [];
                processed_result.map((r) => results.push(r.name));
                classification_result_element.innerHTML = results.join('<br>');
                break;
            case tasks.OBJECT_DETECTION:
                break;
            case tasks.SEMANTIC_SEGMENTATION:
                break;
            case tasksk.INSTANCE_SEGMENTATION:
                break;
            case ttasks.POSE_ESTIMATION:
                break;
        }
    },

    computeFrame: async function() {
        if (this.video.paused || this.video.ended) {
            return;
        }
        this.ctx1.drawImage(this.video, 0, 0, model.input_width, model.input_height);
        var frame = this.ctx1.getImageData(0, 0, model.input_width, model.input_height);
        this.ctx1.drawImage(this.video, 0, 0, this.video_width, this.video_height);
        var l = frame.data.length / 4;
        var rgba_frame_f32 = Float32Array.from(frame.data);
        var rgb_frame_f32 = preprocessor.remove_alpha_channel(rgba_frame_f32, l);

        const image_tensor = new ort.Tensor('float32', rgb_frame_f32, [1,model.input_width,model.input_height,3]);
        const result = await session.run({data: image_tensor});
        var data = undefined;
        // extract the data from result and visualize
        switch (model.task) {
            case tasks.CLASSIFICATION:
                data = Object.keys(result).map((key) => result[key])[0].data;
                this.visualize(postprocessor.process(data, { k:5 }));
                break;
            case tasks.OBJECT_DETECTION:
                data = Object.keys(result).map((key) => result[key].data);
                console.log(data);
                this.visualize(postprocessor.process(data, { 
                                                video_width: this.video_width, 
                                                video_height: this.video_height,
                                                input_width: model.input_width,
                                                input_height: model.input_height,
                                                threshold: 0.5,
                                                }
                                            ));

                break;
            default:
                alert('Error: task ' + model.task + ' has not been implemented');
                break;
        }
        
        // this.ctx1.putImageData(frame, 0, 0);

        return;
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

async function main() {
    try {
        session = await ort.InferenceSession.create(model.path);
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
