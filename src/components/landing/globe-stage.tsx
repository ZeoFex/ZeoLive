"use client";

import { useEffect, useRef } from "react";

type ThreeNS = typeof import("three");

/**
 * A slowly turning globe for the classroom section. The canvas never takes clicks.
 */
export function GlobeStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cancelled = false;
    let teardown = () => {};

    void import("three").then((THREE) => {
      if (cancelled) return;
      teardown = mountGlobe(THREE, canvas, stage, reduce);
    });

    return () => {
      cancelled = true;
      teardown();
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className="relative h-[min(42vh,380px)] min-h-[260px] overflow-hidden rounded-[28px] bg-card ring-1 ring-border sm:h-[min(52vh,520px)] sm:min-h-[320px]"
    >
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
    </div>
  );
}

function mountGlobe(
  THREE: ThreeNS,
  canvas: HTMLCanvasElement,
  stage: HTMLDivElement,
  reduce: boolean
) {
  let renderer: InstanceType<ThreeNS["WebGLRenderer"]>;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.innerWidth >= 900,
      powerPreference: "high-performance",
    });
  } catch {
    canvas.style.display = "none";
    return () => {};
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
  camera.position.set(0, 0.15, 6.4);

  scene.add(new THREE.AmbientLight(0x9ec5ff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 3, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x3d6dff, 1.4);
  rim.position.set(-4, -1, -2);
  scene.add(rim);

  const globe = new THREE.Group();
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.55, 64, 64),
    new THREE.MeshPhysicalMaterial({
      color: "#10284f",
      roughness: 0.42,
      metalness: 0.18,
      clearcoat: 0.7,
      clearcoatRoughness: 0.25,
    })
  );
  globe.add(sphere);

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x8eb7ff,
    transparent: true,
    opacity: 0.55,
  });
  const latitudes = [-60, -30, 0, 30, 60];
  for (const lat of latitudes) {
    const phi = THREE.MathUtils.degToRad(lat);
    const radius = Math.cos(phi) * 1.57;
    const y = Math.sin(phi) * 1.57;
    const points = Array.from({ length: 96 }, (_, index) => {
      const theta = (index / 96) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
    });
    globe.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
  }
  for (let index = 0; index < 8; index += 1) {
    const points = Array.from({ length: 64 }, (_, step) => {
      const phi = (step / 63) * Math.PI - Math.PI / 2;
      const radius = Math.cos(phi) * 1.57;
      const y = Math.sin(phi) * 1.57;
      const theta = (index / 8) * Math.PI;
      return new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
    });
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
  }

  const dots: InstanceType<ThreeNS["Mesh"]>[] = [];
  const dotGeometry = new THREE.SphereGeometry(0.035, 12, 12);
  const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xd7e6ff });
  const cities = [
    [18, 40],
    [-4, 12],
    [35, -80],
    [-25, 135],
    [51, 0],
    [6, 3],
    [40, 116],
    [-33, 151],
  ];
  for (const [lat, lon] of cities) {
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon + 180);
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.setFromSphericalCoords(1.58, phi, theta);
    globe.add(dot);
    dots.push(dot);
  }

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.82, 48, 48),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { uColor: { value: new THREE.Color("#4d8dff") } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 uColor;
        void main() {
          float glow = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(uColor, clamp(glow, 0.0, 1.0) * 0.7);
        }
      `,
    })
  );
  scene.add(globe, atmosphere);

  let frame = 0;
  let running = true;
  const pointer = { x: 0, y: 0 };
  const aim = { x: 0, y: 0 };
  const started = performance.now();

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 768 ? 1.15 : 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const narrow = width < 768;
    globe.scale.setScalar(narrow ? 0.82 : 1);
    atmosphere.scale.setScalar(narrow ? 0.82 : 1);
  }

  function render(now: number) {
    if (!running) return;
    const elapsed = (now - started) / 1000;
    const rect = stage.getBoundingClientRect();
    const offscreen = rect.bottom < -40 || rect.top > window.innerHeight + 40;
    aim.x += (pointer.x - aim.x) * 0.05;
    aim.y += (pointer.y - aim.y) * 0.05;
    globe.rotation.y = (reduce ? 0.6 : elapsed * 0.28) + aim.x * 0.35;
    globe.rotation.x = 0.18 + aim.y * 0.12;
    dots.forEach((dot, index) => {
      const pulse = reduce ? 1 : 0.85 + Math.sin(elapsed * 2.2 + index) * 0.25;
      dot.scale.setScalar(pulse);
    });
    renderer.render(scene, camera);
    if (reduce || offscreen || document.hidden) {
      running = false;
      return;
    }
    frame = window.requestAnimationFrame(render);
  }

  function onPointer(event: PointerEvent) {
    const rect = stage.getBoundingClientRect();
    if (rect.width < 1) return;
    pointer.x = Math.min(1.2, Math.max(-1.2, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
    pointer.y = Math.min(1.2, Math.max(-1.2, ((event.clientY - rect.top) / rect.height - 0.5) * -2));
  }

  function wake() {
    if (!running && !reduce) {
      running = true;
      frame = window.requestAnimationFrame(render);
    }
  }

  resize();
  frame = window.requestAnimationFrame(render);
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("scroll", wake, { passive: true });
  document.addEventListener("visibilitychange", wake);

  return () => {
    running = false;
    window.cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("scroll", wake);
    document.removeEventListener("visibilitychange", wake);
    renderer.dispose();
  };
}
