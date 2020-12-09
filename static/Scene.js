const asyncLoadResource = url => new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.onload = () => {
        if (request.status < 200 || request.status > 299) {
            reject('Error: HTTP Status ' + request.status + ' on resource ' + url);
        } else {
            console.log(`${url} loaded successfully.`);
            resolve(request.responseText);
        }
    };
    request.send();
});

class Scene {

    constructor(sceneJSON, onLoad) {
        this.sceneConfig = JSON.parse(sceneJSON);
        this.onLoad = onLoad;
        console.log(this.sceneConfig);

        this.initCamera();
        this.initLights();

        const shaderKeys = Object.keys(this.sceneConfig.shaders);
        this.numShaders = shaderKeys.length;
        this.loadedShaders = 0;
        this.shaders = {};
        shaderKeys.forEach(this.loadShader);

        const uvModelKeys = Object.keys(this.sceneConfig.uvmodels);
        this.numUVModels = uvModelKeys.length;
        this.loadedUVModels = 0;
        this.uvModels = {};
        uvModelKeys.forEach(this.loadUVModel)

    }

    initLights = () => {
        this.lighting = {};
        this.initAmbientLight();
        this.initPointLights();
        this.initDirectionLights();
    };

    initPointLights = () => {
        const pointLightsConfig = this.sceneConfig.pointLights;
        this.lighting.pointLights = pointLightsConfig.map(this.initPointLight);
    };

    initDirectionLights = () => {
        const directionLightsConfig = this.sceneConfig.directionalLights;
        this.lighting.directionalLights = directionLightsConfig.map(this.initDirectionalLight);
    };

    initPointLight = pointLightConfig => {
        const ambient = pointLightConfig.ambient;
        const diffuse = pointLightConfig.diffuse;
        const position = pointLightConfig.position;
        const specular = pointLightConfig.specular;
        return {
            ambient: new Vector(ambient.r, ambient.g, ambient.b),
            diffuse: new Vector(diffuse.r, diffuse.g, diffuse.b),
            position: new Vector(position.x, position.y, position.z),
            specular: new Vector(specular.r, specular.g, specular.b)
        };
    };

    initDirectionalLight = initDirectionalLight => {
        const ambient = initDirectionalLight.ambient;
        const diffuse = initDirectionalLight.diffuse;
        const direction = initDirectionalLight.direction;
        const specular = initDirectionalLight.specular;
        return {
            ambient: new Vector(ambient.r, ambient.g, ambient.b),
            diffuse: new Vector(diffuse.r, diffuse.g, diffuse.b),
            direction: new Vector(direction.x, direction.y, direction.z),
            specular: new Vector(specular.r, specular.g, specular.b)
        };
    };

    initAmbientLight = () => {
        const ambientLightConfig = this.sceneConfig.ambientLight;
        this.lighting.ambientLight = new Vector(
            ambientLightConfig.r,
            ambientLightConfig.g,
            ambientLightConfig.b
        );
    };

    initCamera = () => {
        const cameraConfig = this.sceneConfig.camera;
        const startPos = cameraConfig.startPos;
        const startLook = cameraConfig.startLook;
        const up = startLook.up;
        const target = startLook.target;
        this.camera = {
            startPos: new Vector(startPos.x, startPos.y, startPos.z),
            startLook: {
                up: new Vector(up.x, up.y, up.z),
                target: new Vector(target.x, target.y, target.z)
            },
            nearClip: cameraConfig.nearClip,
            farClip: cameraConfig.farClip
        };
    };

    loadUVModel = async (uvModelKey) => {
        const uvModelConfig = this.sceneConfig.uvmodels[uvModelKey];
        const objText = await asyncLoadResource(uvModelConfig.model);
        const modelData = parseObjText(objText);
        const transform = uvModelConfig.transform;
        const position = transform.position;
        const scale = transform.scale;
        const rotation = transform.rotation;
        this.uvModels[uvModelKey] = {
            model: modelData,
            material: {...uvModelConfig.material},
            transform: {
                position: new Vector(position.x, position.y, position.z),
                scale: new Vector(scale.x, scale.y, scale.z),
                rotation: new Quaternion(rotation.theta, rotation.x, rotation.y, rotation.z, rotation.normalized)
            }
        };
        this.loadedUVModels++;
        this.handleCompleteLoad();
    };

    loadShader = async (shaderKey) => {
        const shaderConfig = this.sceneConfig.shaders[shaderKey];
        const vertexShaderPath = shaderConfig.vert;
        const fragShaderPath = shaderConfig.frag;
        const vertexShader = await asyncLoadResource(vertexShaderPath);
        const fragShader = await asyncLoadResource(fragShaderPath);
        this.shaders[shaderKey] = {
            vert: vertexShader,
            frag: fragShader
        };
        // no race condition since javascript is techically single threaded :)
        this.loadedShaders++;
        this.handleCompleteLoad();
    }

    handleCompleteLoad = () => {
        if (this.allLoaded()) this.onLoad(this);
    }

    allLoaded() {
        if (this.numShaders !== this.loadedShaders) return false;
        if (this.numUVModels !== this.loadedUVModels) return false;
        return true;
    }

    static init(sceneJSONURL) {
        return new Promise(async (resolve, reject) => {
            try {
                const sceneJSON = await asyncLoadResource(sceneJSONURL);
                new Scene(sceneJSON, scene => resolve(scene));
            } catch (e) {
                reject(e);
            }
        });
    }


}

