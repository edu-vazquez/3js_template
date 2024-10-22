import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as DAT from 'dat.gui';

//Global variables
let currentRef = null;
const gui = new DAT.GUI();

//Scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(25, 100 / 100, 0.1, 100);
scene.add(camera);
camera.position.set(5, 5, 5);
camera.lookAt(new THREE.Vector3());

const renderer = new THREE.WebGLRenderer();
renderer.setSize(100, 100);

//OrbitControls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

//Resize canvas
const resize = () => {
  renderer.setSize(currentRef.clientWidth, currentRef.clientHeight);
  camera.aspect = currentRef.clientWidth / currentRef.clientHeight;
  camera.updateProjectionMatrix();
};
window.addEventListener("resize", resize);

// GRID HELPER
const gridHelper = new THREE.GridHelper( 10, 10 );
scene.add( gridHelper );
const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );


// PLANE

const planeMat = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  uniforms: {
    uTime: {value: 0.0},
    uFrecuencyX: {value: 1.5},
    uFrecuencyZ: {value: 1.5},
    uAmplitudX: {value: 0.3},
    uAmplitudZ: {value: 0.3},
    uColorA: {value: new THREE.Color('blue')},
    uColorB: {value: new THREE.Color('red')},
    uColorOffset: {value: 0.05}
  },
  vertexShader: `
  varying float vElevationX;

  uniform float uTime;
  uniform float uFrecuencyX; 
  uniform float uFrecuencyZ; 
  uniform float uAmplitudX;
  uniform float uAmplitudZ;

  void main(){
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    float ElevationX = sin(modelPosition.x * uFrecuencyX + uTime) * uAmplitudX;
    float ElevationZ = sin(modelPosition.z * uFrecuencyZ + uTime) * uAmplitudZ;
    
    modelPosition.y += (ElevationX + uAmplitudX ) + (ElevationZ + uAmplitudZ );

    gl_Position = projectionMatrix *
                  viewMatrix *
                  modelPosition;
    vElevationX = modelPosition.y;
  }`,
  fragmentShader: `
    varying float vElevationX;

    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uColorOffset;

    void main() {
      float colorMix = uColorOffset + vElevationX;
      vec3 colorC = mix(uColorA, uColorB, colorMix);

      gl_FragColor = vec4(colorC, 1.0);
    }`,
  }
);

gui.add(planeMat.uniforms.uFrecuencyX, 'value')
  .min(0).max(50).step(0.01)
  .name('frecuency X')
gui.add(planeMat.uniforms.uFrecuencyZ, 'value')
  .min(0).max(50).step(0.01)
  .name('frecuency Z')
gui.add(planeMat.uniforms.uAmplitudX, 'value')
  .min(0).max(2).step(0.01)
  .name('amplitud X')
gui.add(planeMat.uniforms.uAmplitudZ, 'value')
  .min(0).max(2).step(0.01)
  .name('amplitud Z')

//DEBUG COLORS
const debugColorAux = {
  colorA: '#ff0000',
  colorB: '#0000ff'
}
gui.addColor(debugColorAux, 'colorB')
  .onChange(() => {
    planeMat.uniforms.uColorB.value.set(debugColorAux.colorB);
  })
  .name('Color Arriba');
gui.addColor(debugColorAux, 'colorA')
  .onChange(() => {
    planeMat.uniforms.uColorA.value.set(debugColorAux.colorA);
  })
  .name('Color Abajo');

gui.add(planeMat.uniforms.uColorOffset, 'value')
  .min(-1.5).max(1.5).step(0.0001)
  .name('frecuency X')


const planeGeo = new THREE.PlaneGeometry(4, 4, 200, 200);
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.rotation.x = Math.PI * -0.5;
scene.add(plane);

//Animate the scene
const animate = () => {
  planeMat.uniforms.uTime.value += 0.05;

  orbitControls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};
animate();

//Init and mount the scene
export const initScene = (mountRef) => {
  currentRef = mountRef.current;
  resize();
  currentRef.appendChild(renderer.domElement);
};

//Dismount and clena up the buffer from the scene
export const cleanUpScene = () => {
  gui.destroy();
  scene.traverse((object) => {
    
    // Limpiar geometrías
    if (object.geometry) {
      object.geometry.dispose();
    }

    // Limpiar materiales
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose());
      } else {
        object.material.dispose();
      }
    }

    // Limpiar texturas
    if (object.material && object.material.map) {
      object.material.map.dispose();
    }
  });
  currentRef.removeChild(renderer.domElement);
};

