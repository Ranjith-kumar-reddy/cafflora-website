import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ORIGINS } from '../data/origins.js';
import { usePrefersReducedMotion } from '../hooks.js';

// Cup modelled in Blender: see blender/make_cup.py
const CUP_MODEL = '/models/cafflora-cup.glb';
const CUP_POSITION = [0, -2.2, 0];
const CUP_TILT = 0.22;
// The camera descends at 90% of the page's scroll speed, so the cup drifts
// away with the hero while nearer and farther beans move at different speeds.
const SCROLL_FOLLOW = 0.9;
// Beans live in a band this tall around the camera and wrap as it moves.
const BEAN_BAND = 22;

// Small seeded random generator so the beans land in the same places every visit.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function CoffeeScene({ origin, mode }) {
  const reduced = usePrefersReducedMotion();
  const small = useMemo(() => window.matchMedia('(max-width: 720px)').matches, []);
  // Shared between the camera rig and the beans: how far the camera has descended.
  const descent = useRef({ y: 0 });

  return (
    <div className="scene" aria-hidden="true">
      <Canvas
        dpr={[1, small ? 1.5 : 2]}
        camera={{ position: [0, 0.5, 17], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        frameloop={reduced ? 'demand' : 'always'}
      >
        <fogExp2 attach="fog" args={['#070504', 0.035]} />
        <Reflections />
        <Rig origin={origin} mode={mode} reduced={reduced} descent={descent} />
        <Suspense fallback={null}>
          <Cup reduced={reduced} mode={mode} />
        </Suspense>
        <Steam reduced={reduced} mode={mode} count={small ? 10 : 16} />
        <Beans origin={origin} reduced={reduced} count={small ? 18 : 36} descent={descent} />
      </Canvas>
    </div>
  );
}

// Soft studio reflections so the glossy cup and gold rim catch light.
function Reflections() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.35;
    return () => {
      scene.environment = null;
      envMap.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

// Camera and lights: follows the pointer, descends as the page scrolls,
// and dollies in from the sign-in screen to the site.
// Modes: gate (sign-in), welcome (title card), site (home page), page (orders, staff).
function Rig({ origin, mode, reduced, descent }) {
  const { camera, invalidate } = useThree();
  const keyLight = useRef();
  const pointer = useRef({ x: 0, y: 0 });
  const scroll = useRef(0);
  const camY = useRef(0);
  const initialLight = useRef(ORIGINS[origin].light).current;
  const target = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    const onMove = (event) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      scroll.current = window.scrollY / window.innerHeight;
    };
    onScroll();
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Reduced motion: one still frame, redrawn only when the estate changes.
  useEffect(() => {
    if (!reduced) return;
    keyLight.current.color.set(ORIGINS[origin].light);
    camera.position.set(0, 0.5, window.innerWidth / window.innerHeight < 0.8 ? 13.5 : 10);
    camera.lookAt(0, 0, 0);
    invalidate();
  }, [reduced, origin, camera, invalidate]);

  useFrame((state, delta) => {
    if (reduced) return;
    const dt = Math.min(delta, 0.05);
    const ease = 1 - Math.exp(-dt * 3);
    const aspect = state.size.width / state.size.height;
    const baseZ = aspect < 0.8 ? 13.5 : 10;
    const targetZ = baseZ + ({ gate: 3.5, page: 5 }[mode] ?? 0);
    // World units that fill one screen height at the cup's depth.
    const screenHeight = 2 * baseZ * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const scrollTarget = mode === 'site' ? scroll.current * screenHeight * SCROLL_FOLLOW : 0;

    camY.current += (scrollTarget - camY.current) * ease;
    descent.current.y = camY.current;
    camera.position.x += (pointer.current.x * 1.2 - camera.position.x) * ease;
    camera.position.y += (0.5 - pointer.current.y * 0.9 - camY.current - camera.position.y) * ease;
    camera.position.z += (targetZ - camera.position.z) * (1 - Math.exp(-dt * 1.1));
    camera.lookAt(0, -camY.current, 0);

    keyLight.current.color.lerp(target.set(ORIGINS[origin].light), ease);
  });

  return (
    <>
      <ambientLight color="#3a2a20" intensity={0.5} />
      <pointLight ref={keyLight} color={initialLight} position={[3, 4, 4]} intensity={70} distance={30} decay={2} />
      <pointLight color="#FCD34D" position={[-4, -2, -3]} intensity={35} distance={24} decay={2} />
    </>
  );
}

// Latte art in the shape of the Cafflora blossom, painted onto the coffee surface.
function makeLatteArt() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const crema = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
  crema.addColorStop(0, '#6b3a1b');
  crema.addColorStop(0.72, '#8a5228');
  crema.addColorStop(1, '#3c1e0d');
  ctx.fillStyle = crema;
  ctx.fillRect(0, 0, size, size);

  ctx.translate(size / 2, size / 2);
  ctx.fillStyle = 'rgba(246, 230, 205, 0.94)';
  for (let i = 0; i < 5; i += 1) {
    ctx.save();
    ctx.rotate((i * 2 * Math.PI) / 5);
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.bezierCurveTo(54, -72, 42, -150, 0, -176);
    ctx.bezierCurveTo(-42, -150, -54, -72, 0, -20);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 17, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false; // glTF UV convention
  texture.anisotropy = 4;
  return texture;
}

// On the home page the hero picture takes the cup's place, so the cup fades out there.
const showsCup = (mode) => mode !== 'site';

function Cup({ reduced, mode }) {
  const gltf = useLoader(GLTFLoader, CUP_MODEL);
  const { invalidate } = useThree();
  const root = useRef();
  const spin = useRef();
  const fade = useRef(showsCup(mode) ? 1 : 0);
  const latteArt = useMemo(makeLatteArt, []);
  const materials = useMemo(() => {
    const list = [];
    gltf.scene.traverse((node) => {
      if (node.isMesh && !list.includes(node.material)) list.push(node.material);
    });
    list.forEach((material) => { material.transparent = true; });
    return list;
  }, [gltf]);

  const applyFade = (value) => {
    materials.forEach((material) => { material.opacity = value; });
    root.current.visible = value > 0.01;
  };

  useEffect(() => {
    const coffee = gltf.scene.getObjectByName('Coffee');
    if (coffee?.material) {
      coffee.material.map = latteArt;
      coffee.material.color.set('#ffffff');
      coffee.material.needsUpdate = true;
    }
    return () => latteArt.dispose();
  }, [gltf, latteArt]);

  useEffect(() => {
    if (!reduced) return;
    fade.current = showsCup(mode) ? 1 : 0;
    applyFade(fade.current);
    invalidate();
  });

  useFrame((_, delta) => {
    if (reduced) return;
    const dt = Math.min(delta, 0.05);
    fade.current += ((showsCup(mode) ? 1 : 0) - fade.current) * (1 - Math.exp(-dt * 4));
    applyFade(fade.current);
    spin.current.rotation.y += dt * 0.18;
  });

  return (
    <group ref={root} position={CUP_POSITION} rotation={[CUP_TILT, 0, 0]}>
      <group ref={spin} rotation={[0, -0.6, 0]}>
        <primitive object={gltf.scene} />
      </group>
    </group>
  );
}

function makeSoftTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const glow = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  glow.addColorStop(0, 'rgba(255,255,255,1)');
  glow.addColorStop(0.4, 'rgba(255,255,255,0.45)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Soft puffs of steam rising and fading above the cup.
function Steam({ reduced, mode, count }) {
  const group = useRef();
  const fade = useRef(showsCup(mode) ? 1 : 0);
  const texture = useMemo(makeSoftTexture, []);
  const puffs = useMemo(() => {
    const rand = seeded(7);
    return Array.from({ length: count }, (_, i) => ({
      life: i / count,
      seed: rand() * 10,
      x: (rand() - 0.5) * 0.9,
      z: (rand() - 0.5) * 0.9,
    }));
  }, [count]);

  useEffect(() => () => texture.dispose(), [texture]);

  const place = (sprite, puff) => {
    const t = puff.life;
    sprite.position.set(puff.x + Math.sin(t * 5 + puff.seed) * 0.35 * t, t * 3.4, puff.z);
    const scale = 0.5 + t * 1.8;
    sprite.scale.set(scale, scale, 1);
    sprite.material.opacity = Math.sin(Math.PI * t) * 0.12 * fade.current;
  };

  useLayoutEffect(() => {
    if (reduced) fade.current = showsCup(mode) ? 1 : 0;
    group.current.children.forEach((sprite, i) => place(sprite, puffs[i]));
  });

  useFrame((_, delta) => {
    if (reduced) return;
    const dt = Math.min(delta, 0.05);
    fade.current += ((showsCup(mode) ? 1 : 0) - fade.current) * (1 - Math.exp(-dt * 4));
    group.current.children.forEach((sprite, i) => {
      const puff = puffs[i];
      puff.life += dt / 5;
      if (puff.life >= 1) puff.life -= 1;
      place(sprite, puff);
    });
  });

  return (
    <group ref={group} position={[0, CUP_POSITION[1] + 0.98, 0.22]}>
      {puffs.map((_, i) => (
        <sprite key={i}>
          <spriteMaterial map={texture} color="#F4ECE1" transparent depthWrite={false} opacity={0} />
        </sprite>
      ))}
    </group>
  );
}

// A roasted coffee bean: a flattened ellipsoid with an S-shaped crease on its flat side.
function makeBeanGeometry() {
  const geometry = new THREE.SphereGeometry(1, 96, 48);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    let z = position.getZ(i);
    if (z > 0) {
      z *= 0.62;
      const cx = x - 0.07 * Math.sin(y * 2.6);
      z -= 0.3 * Math.exp(-(cx * cx) / 0.012) * Math.sqrt(Math.max(0, 1 - y * y));
    }
    position.setXYZ(i, x * 0.62, y, z * 0.55);
  }
  geometry.scale(0.38, 0.38, 0.38);
  geometry.computeVertexNormals();
  return geometry;
}

function Beans({ origin, reduced, count, descent }) {
  const mesh = useRef();
  const { invalidate } = useThree();
  const geometry = useMemo(makeBeanGeometry, []);
  const initialColor = useRef(ORIGINS[origin].bean).current;
  const target = useMemo(() => new THREE.Color(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const beans = useMemo(() => {
    const rand = seeded(42);
    return Array.from({ length: count }, () => {
      let x;
      let y;
      let z;
      // Keep beans out of the space in front of the cup and its steam.
      do {
        x = (rand() - 0.5) * 16;
        y = (rand() - 0.5) * BEAN_BAND;
        z = -6 + rand() * 8;
      } while (Math.abs(x) < 2.6 && y > -4.3 && y < 0.8 && z > -3);
      return {
        x, y, z,
        rx: rand() * Math.PI,
        ry: rand() * Math.PI,
        rz: rand() * Math.PI,
        sx: (rand() - 0.5) * 0.6,
        sy: (rand() - 0.5) * 0.6,
        scale: 0.75 + rand() * 0.55,
        bob: rand() * Math.PI * 2,
      };
    });
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const half = BEAN_BAND / 2;
  const write = (time) => {
    const camY = descent.current.y;
    beans.forEach((bean, i) => {
      // Position relative to the camera, wrapped so beans keep flowing past while scrolling.
      const relative = ((((bean.y + camY + half) % BEAN_BAND) + BEAN_BAND) % BEAN_BAND) - half;
      dummy.position.set(bean.x, relative - camY + Math.sin(time * 0.4 + bean.bob) * 0.15, bean.z);
      dummy.rotation.set(bean.rx + bean.sx * time, bean.ry + bean.sy * time, bean.rz);
      dummy.scale.setScalar(bean.scale);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    write(0);
  }, [beans]);

  useEffect(() => {
    if (!reduced) return;
    mesh.current.material.color.set(ORIGINS[origin].bean);
    invalidate();
  }, [reduced, origin, invalidate]);

  useFrame((state, delta) => {
    if (reduced) return;
    write(state.clock.elapsedTime);
    mesh.current.material.color.lerp(target.set(ORIGINS[origin].bean), 1 - Math.exp(-Math.min(delta, 0.05) * 3));
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial color={initialColor} roughness={0.45} metalness={0.1} />
    </instancedMesh>
  );
}
