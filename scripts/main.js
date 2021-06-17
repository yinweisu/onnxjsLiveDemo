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

var model_path;
var task;
var model;
var session;
var postprocessor;
const preprocessor = new Preprocessor();

async function on_classification() {
    if (task == tasks.CLASSIFICATION) { return; }
    if (processor.did_load) { processor.clear(); }
    model_path = 'models/resnet18_v1.onnx';
    task = tasks.CLASSIFICATION;
    model = new Model(model_path, 224, 224, task, image_net_labels);
    postprocessor = new Postprocessor(model.task);
    session = await ort.InferenceSession.create(model.path);
}

async function on_obj_detection() {
    if (task == tasks.OBJECT_DETECTION) { return; }
    if (processor.did_load) { processor.clear(); }
    model_path = 'models/yolo3_mobilenet1.0_voc.onnx';
    task = tasks.OBJECT_DETECTION;
    model = new Model(model_path, 512, 512, task, voc_detection_labels);
    postprocessor = new Postprocessor(model.task);
    session = await ort.InferenceSession.create(model.path);
}

function screenshot() {
    processor.computeFrame();
}

var processor = {
    did_load: false,

    do_load: function() {
        this.video = document.getElementById('local_video_stream');
        this.video_width = this.video.width;
        this.video_height = this.video.height;
        this.canvas = document.getElementById('result_canvas');
        this.canvas_ctx = this.canvas.getContext('2d');
        this.did_load = true;
    },

    draw_bbox(label, score, bbox, color) {
        [xmin, ymin, width, height] = bbox;
        this.canvas_ctx.strokeStyle = color;
        this.canvas_ctx.fillStyle = color;
        this.canvas_ctx.lineWidth = 3;
        this.canvas_ctx.font = "30px Comic Sans MS";
        this.canvas_ctx.strokeRect(xmin, ymin, width, height);
        this.canvas_ctx.fillText(`${label} ${score}`, xmin, ymin-10);
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
                [classes, scores, bboxes, color_maps] = processed_result;
                for (var i = 0; i < classes.length; i++) {
                    this.draw_bbox(classes[i], scores[i], bboxes[i], color_maps[i]);
                }
                break;
            default:
                alert('Error: task ' + model.task + ' has not been implemented');
                break;
        }
    },

    computeFrame: async function() {
        if (this.video.paused || this.video.ended) {
            return;
        }
        this.canvas_ctx.drawImage(this.video, 0, 0, model.input_width, model.input_height);
        var frame = this.canvas_ctx.getImageData(0, 0, model.input_width, model.input_height);
        this.canvas_ctx.drawImage(this.video, 0, 0, this.video_width, this.video_height);
        var frame_length = frame.data.length / 4;
        var rgba_frame_f32 = Float32Array.from(frame.data);
        var rgb_frame_f32 = preprocessor.remove_alpha_channel(rgba_frame_f32, frame_length);

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
        
        // this.canvas_ctx.putImageData(frame, 0, 0);

        return;
    },

    clear: function() {
        this.canvas_ctx.clearRect(0, 0, this.video_width, this.video_height);
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
        navigator.mediaDevices.getUserMedia(media_constraints)
        .then(function (stream) {
            var local_video_stream = document.getElementById('local_video_stream');
            local_video_stream.srcObject = stream;
            processor.do_load();
        })
        .catch(handle_get_user_media_error);
    } catch (e) {
        alert(e);
    }
    
}

$(document).ready(function() {
    $('.tab button').on('click', function(){
        $('.tab button').removeClass('selected');
        $(this).addClass('selected');
    });
    document.getElementById('classification_tab').click(); // provide a default tab
    main();
});
