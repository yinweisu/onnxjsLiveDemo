class Postprocessor {
    constructor(task) {
        this.task = task;
        // console.log(this.task);
    }

    visualize_classification(class_probability, ctx) { 
        const k = ctx.k;
        if (!k) { k = 5; }
        const probs = Array.from(class_probability);
        const probs_indices = probs.map(
            function (prob, index) {
            return [prob, index];
            }
        );
        const sorted = probs_indices.sort(
            function (a, b) {
                if (a[0] < b[0]) {
                    return -1;
                }
                if (a[0] > b[0]) {
                    return 1;
                }
                return 0;
                }
        ).reverse();
        const topK = sorted.slice(0, k).map(function (prob_index) {
            const i_class = image_net_label[prob_index[1]];
            return {
                name: i_class,
                index: prob_index[1],
            };
        });
        console.log(topK[0]);
        return topK;
    }

    visualize(result, ctx) {
        switch (this.task) {
            case tasks.CLASSIFICATION:
                this.visualize_classification(result, ctx);
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
    }
}

class ClassificationPostprocessor {
    visualize(class_probability, k) {
        if (!k) { k = 5; }
        const probs = Array.from(class_probability);
        const probs_indices = probs.map(
            function (prob, index) {
            return [prob, index];
            }
        );
        console.log(probs_indices);
    }
}

class ObjectDPostprocessor {
    visualize() {

    }
}
