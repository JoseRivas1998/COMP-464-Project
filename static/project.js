const initGL = (canvas) => {
    let gl = canvas.getContext('webgl');

    if (!gl) {
        console.log('Browser is using experimental webgl.');
        gl = canvas.getContext('experimental-webgl');
    }

    if (!gl) {
        alert('This requires a browser which supports WebGL; Yours does not.');
        return gl;
    }

    // set background color and clear
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // set up culling via depth and back face, set front face to CCW
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);
    return gl;
}

const initCanvas = () => {
    const canvas = document.getElementById('the_canvas');
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;
    return canvas;
}

const compileShaders = (scene, gl) => {
    const shaders = {};
    for (let key in scene.shaders) {
        if (scene.shaders.hasOwnProperty(key)) {
            const shader = scene.shaders[key];
            shaders[key] = createProgram(gl, shader.vert, shader.frag);
        }
    }
    return {shaders, shaderList: Object.values(shaders)};
}

const initCamera = (gl, canvas, shaderList, scene) => {
    const aspect = canvas.width / canvas.height;
    const fieldOfView = Math.PI / 4;
    const camera = new FPSCamera(
        gl,
        shaderList,
        aspect,
        fieldOfView,
        scene.camera.nearClip,
        scene.camera.farClip,
    );
    camera.translate(scene.camera.startPos);
    camera.lookAt(scene.camera.startLook.target, scene.camera.startLook.up);

    const mouseCallBack = event => {
        camera.onMouseMove(event.movementX, event.movementY);
    };

    window.addEventListener("keydown", event => camera.onKeyDown(event));
    window.addEventListener("keyup", event => camera.onKeyUp(event));

    canvas.addEventListener("click", () => {
        console.log(camera);
        canvas.requestPointerLock();
    });

    document.addEventListener("pointerlockchange", () => {
        if (document.pointerLockElement) {
            document.addEventListener("mousemove", mouseCallBack, false);
        } else {
            canvas.blur();
            document.removeEventListener("mousemove", mouseCallBack, false);
        }
    });
    return camera;
}

const initLights = (gl, scene, shaderList) => {
    const lighting = scene.lighting;

    // use light manager to create lights
    const lightManager = new LightManager(gl, shaderList, lighting.ambientLight);
    lighting.directionalLights.forEach(directionalLight => {
        lightManager.addDirectionalLight(
            directionalLight.direction,
            directionalLight.diffuse,
            directionalLight.specular,
            directionalLight.ambient
        )
    });
    lighting.pointLights.forEach(pointLight => {
        lightManager.addPointLight(
            pointLight.position,
            pointLight.diffuse,
            pointLight.specular,
            pointLight.ambient
        );
    });
    lightManager.update();
    return lightManager;
}

const initUVMeshes = (gl, scene, shaders) => {
    const uvMeshes = {};
    const uvModels = scene.uvModels;
    for (const key in uvModels) {
        if (uvModels.hasOwnProperty(key)) {
            const uvModel = uvModels[key];
            const material = new UVMaterial(
                gl,
                shaders[uvModel.material.shader],
                uvModel.material.imageID,
                uvModel.material.flipTexture,
                uvModel.material.diffuse,
                uvModel.material.specular,
                uvModel.material.ambient,
                uvModel.material.shininess,
            );
            const model = uvModel.model;
            const transform = uvModel.transform;
            uvMeshes[key] = new UVMesh(
                gl,
                model.positions, model.normals,
                model.index,
                model.texcoords,
                material,
                transform.position,
                transform.rotation,
                transform.scale
            );
        }
    }
    return uvMeshes;
}

const RunDemo = (scene) => {
    console.log("Initializing Demo");
    console.log(scene);

    const canvas = initCanvas();
    let gl = initGL(canvas);
    const {shaders, shaderList} = compileShaders(scene, gl);
    const camera = initCamera(gl, canvas, shaderList, scene);
    const lightManager = initLights(gl, scene, shaderList);
    const uvMeshes = initUVMeshes(gl, scene, shaders);

    const meshes = {
        ...uvMeshes
    };

    // set up some arbitrary constants for motion
    const startTime = Date.now();
    let time;

    const main = () => {
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

        time = Date.now() - startTime;

        const cameraLight = lightManager.pointLights[lightManager.pointLights.length - 1];
        cameraLight.setPosition(camera.position);
        lightManager.update();
        camera.update();

        for (const key in meshes) {
            if(meshes.hasOwnProperty(key)) {
                const mesh = meshes[key];
                mesh.draw();
            }
        }

        requestAnimationFrame(main);
    }
    requestAnimationFrame(main);

    const music = document.createElement('audio');
    music.src = "music.mp3";
    music.play();

}

const InitDemo = async () => {
    try {
        const scene = await Scene.init('scene.json');
        RunDemo(scene);
    } catch (e) {
        alert(e);
        console.error(e);
    }
}
