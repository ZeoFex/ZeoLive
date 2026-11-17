"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type EduKind = "academy" | "book" | "geometry" | "molecule";

type ThreeNS = typeof import("three");

/**
 * Lazy Three.js stage. Academy is the homepage cluster.
 * The other kinds are the single objects used in How it works.
 */
export function EduStage({
  kind,
  className,
  label,
}: {
  kind: EduKind;
  className?: string;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelled = false;
    let teardown = () => {};

    void import("three").then((THREE) => {
      if (cancelled) return;
      try {
        teardown = mountEdu(THREE, canvas, stage, kind, reduce);
      } catch {
        if (!cancelled) setFallback(true);
      }
    }).catch(() => {
      if (!cancelled) setFallback(true);
    });

    return () => {
      cancelled = true;
      teardown();
    };
  }, [kind]);

  return (
    <div
      ref={stageRef}
      role="img"
      aria-label={label}
      className={cn(
        "relative overflow-hidden rounded-[28px] bg-muted ring-1 ring-border",
        className
      )}
    >
      {fallback ? (
        <SceneFallback />
      ) : (
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      )}
    </div>
  );
}

function SceneFallback() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(42,53,255,0.16),transparent_62%)]">
      <div className="absolute left-1/2 top-1/2 h-16 w-24 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card shadow-sm" />
    </div>
  );
}

function mountEdu(
  THREE: ThreeNS,
  canvas: HTMLCanvasElement,
  stage: HTMLDivElement,
  kind: EduKind,
  reduce: boolean
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0, 0.2, 7);

  scene.add(new THREE.AmbientLight(0xffffff, 0.72));
  const hemi = new THREE.HemisphereLight(0xdfe7ff, 0x1c2030, 0.55);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(3.5, 5.5, 4);
  scene.add(key);
  const fill = new THREE.PointLight(0x3d4dff, 12, 16);
  fill.position.set(-2.4, 1.2, 2.2);
  scene.add(fill);

  const geometries: InstanceType<ThreeNS["BufferGeometry"]>[] = [];
  const materials: InstanceType<ThreeNS["Material"]>[] = [];

  function trackGeometry<T extends InstanceType<ThreeNS["BufferGeometry"]>>(geometry: T) {
    geometries.push(geometry);
    return geometry;
  }

  function mat(color: string, roughness = 0.38, metalness = 0.08) {
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    materials.push(material);
    return material;
  }

  function mesh(
    geometry: InstanceType<ThreeNS["BufferGeometry"]>,
    color: string,
    roughness?: number,
    metalness?: number
  ) {
    geometries.push(geometry);
    return new THREE.Mesh(
      geometry as ConstructorParameters<ThreeNS["Mesh"]>[0],
      mat(color, roughness, metalness)
    );
  }

  const cluster = new THREE.Group();
  scene.add(cluster);

  const shadow = new THREE.Mesh(
    trackGeometry(new THREE.CircleGeometry(kind === "academy" ? 2.4 : 1.35, 40)),
    mat("#0b1020", 1, 0)
  );
  const shadowMaterial = shadow.material as InstanceType<ThreeNS["MeshStandardMaterial"]>;
  shadowMaterial.transparent = true;
  shadowMaterial.opacity = 0.1;
  shadowMaterial.depthWrite = false;
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.45;
  cluster.add(shadow);

  const floats: Array<{ object: InstanceType<ThreeNS["Object3D"]>; baseY: number; phase: number }> = [];

  function addFloat(object: InstanceType<ThreeNS["Object3D"]>, phase: number) {
    cluster.add(object);
    floats.push({ object, baseY: object.position.y, phase });
  }

  if (kind === "book" || kind === "academy") {
    const book = makeBook(THREE, mesh);
    book.position.set(kind === "academy" ? -1.05 : 0, kind === "academy" ? -0.2 : 0, 0.05);
    book.rotation.set(0.12, -0.35, -0.04);
    book.scale.setScalar(kind === "academy" ? 1.08 : 1.28);
    addFloat(book, 0.2);
  }

  if (kind === "academy") {
    const cap = makeCap(THREE, mesh);
    cap.position.set(0.05, 0.78, -0.05);
    cap.rotation.set(-0.7, -0.55, 0.18);
    cap.scale.setScalar(0.82);
    addFloat(cap, 1.4);
  }

  if (kind === "geometry" || kind === "academy") {
    const shape = makeGeometry(THREE, mesh);
    shape.position.set(kind === "academy" ? 1.25 : 0, kind === "academy" ? 0.35 : 0.1, 0);
    shape.scale.setScalar(kind === "academy" ? 0.62 : 1.05);
    addFloat(shape, 2.1);
  }

  if (kind === "molecule" || kind === "academy") {
    const molecule = makeMolecule(THREE, mesh);
    molecule.position.set(kind === "academy" ? 0.85 : 0, kind === "academy" ? -0.85 : 0, 0.25);
    molecule.scale.setScalar(kind === "academy" ? 0.62 : 1.15);
    addFloat(molecule, 0.8);
  }

  let points: InstanceType<ThreeNS["Points"]> | null = null;
  let lines: InstanceType<ThreeNS["LineSegments"]> | null = null;
  let pointPositions: Float32Array | null = null;
  let pointOrigin: Float32Array | null = null;
  const mobile = window.matchMedia("(max-width: 767px)").matches;

  if (kind === "academy") {
    const count = mobile ? 36 : 90;
    pointPositions = new Float32Array(count * 3);
    pointOrigin = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 1.4 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 2.6;
      pointOrigin[i * 3] = Math.cos(theta) * radius;
      pointOrigin[i * 3 + 1] = y;
      pointOrigin[i * 3 + 2] = Math.sin(theta) * radius * 0.55;
      pointPositions[i * 3] = pointOrigin[i * 3]!;
      pointPositions[i * 3 + 1] = y;
      pointPositions[i * 3 + 2] = pointOrigin[i * 3 + 2]!;
    }
    const pointGeometry = trackGeometry(new THREE.BufferGeometry());
    pointGeometry.setAttribute("position", new THREE.BufferAttribute(pointPositions, 3));
    const pointMaterial = new THREE.PointsMaterial({
      color: "#8ea0ff",
      size: mobile ? 0.045 : 0.035,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    materials.push(pointMaterial);
    points = new THREE.Points(pointGeometry, pointMaterial);
    cluster.add(points);

    if (!mobile) {
      const linePositions = new Float32Array(80 * 2 * 3);
      const lineGeometry = trackGeometry(new THREE.BufferGeometry());
      lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
      lineGeometry.setDrawRange(0, 0);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: "#9aabff",
        transparent: true,
        opacity: 0.28,
      });
      materials.push(lineMaterial);
      lines = new THREE.LineSegments(lineGeometry, lineMaterial);
      cluster.add(lines);
    }
  }

  const pointer = { x: 0, y: 0 };
  const aim = { x: 0, y: 0 };
  let running = true;
  let frame = 0;
  const started = performance.now();

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    const narrow = width < 640;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrow ? 1.15 : 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = kind === "academy" ? (width < 520 ? 7.6 : 6.2) : 4.7;
    camera.updateProjectionMatrix();
  }

  function render(now: number) {
    if (!running) return;
    const elapsed = (now - started) / 1000;
    const rect = stage.getBoundingClientRect();
    const offscreen = rect.bottom < -40 || rect.top > window.innerHeight + 40;
    aim.x += (pointer.x - aim.x) * 0.06;
    aim.y += (pointer.y - aim.y) * 0.06;

    const intro = reduce ? 1 : Math.min(elapsed / 0.8, 1);
    const eased = 1 - Math.pow(1 - intro, 3);
    cluster.scale.setScalar(0.86 + eased * 0.14);
    const spin = kind === "geometry" || kind === "molecule" ? elapsed * 0.22 : 0;
    cluster.rotation.y = aim.x * (kind === "academy" ? 0.28 : 0.45) + (reduce ? 0 : spin);
    cluster.rotation.x = aim.y * (kind === "academy" ? 0.12 : 0.28);
    cluster.position.y = reduce ? 0 : Math.sin(elapsed * 0.6) * 0.04;

    for (const item of floats) {
      item.object.position.y = item.baseY + (reduce ? 0 : Math.sin(elapsed * 0.9 + item.phase) * 0.08);
    }

    if (pointPositions && pointOrigin) {
      const count = pointOrigin.length / 3;
      for (let i = 0; i < count; i += 1) {
        const drift = reduce ? 0 : Math.sin(elapsed * 0.45 + i) * 0.08;
        pointPositions[i * 3] = pointOrigin[i * 3]! + aim.x * 0.18;
        pointPositions[i * 3 + 1] = pointOrigin[i * 3 + 1]! + drift;
        pointPositions[i * 3 + 2] = pointOrigin[i * 3 + 2]! + aim.y * 0.12;
      }
      const positions = points?.geometry.attributes.position;
      if (positions) positions.needsUpdate = true;

      if (lines) {
        const attr = lines.geometry.attributes.position as InstanceType<ThreeNS["BufferAttribute"]>;
        const buffer = attr.array as Float32Array;
        let pairs = 0;
        const maxPairs = 80;
        for (let i = 0; i < count && pairs < maxPairs; i += 1) {
          for (let j = i + 1; j < count && pairs < maxPairs; j += 1) {
            const dx = pointPositions[i * 3]! - pointPositions[j * 3]!;
            const dy = pointPositions[i * 3 + 1]! - pointPositions[j * 3 + 1]!;
            const dz = pointPositions[i * 3 + 2]! - pointPositions[j * 3 + 2]!;
            if (dx * dx + dy * dy + dz * dz > 0.85) continue;
            const offset = pairs * 6;
            buffer[offset] = pointPositions[i * 3]!;
            buffer[offset + 1] = pointPositions[i * 3 + 1]!;
            buffer[offset + 2] = pointPositions[i * 3 + 2]!;
            buffer[offset + 3] = pointPositions[j * 3]!;
            buffer[offset + 4] = pointPositions[j * 3 + 1]!;
            buffer[offset + 5] = pointPositions[j * 3 + 2]!;
            pairs += 1;
          }
        }
        lines.geometry.setDrawRange(0, pairs * 2);
        attr.needsUpdate = true;
      }
    }

    renderer.render(scene, camera);
    if (reduce || offscreen || document.hidden) {
      running = false;
      return;
    }
    frame = window.requestAnimationFrame(render);
  }

  function onPointer(event: PointerEvent) {
    const rect = stage.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    pointer.x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
    pointer.y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * -2));
    if (!running && !reduce) {
      running = true;
      frame = window.requestAnimationFrame(render);
    }
  }

  function onVisibility() {
    if (!document.hidden && !running && !reduce) {
      running = true;
      frame = window.requestAnimationFrame(render);
    }
  }

  resize();
  frame = window.requestAnimationFrame(render);
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  stage.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("scroll", onVisibility, { passive: true });

  return () => {
    running = false;
    window.cancelAnimationFrame(frame);
    observer.disconnect();
    stage.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("scroll", onVisibility);
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    renderer.dispose();
  };
}

function makeBook(
  THREE: ThreeNS,
  mesh: (geometry: InstanceType<ThreeNS["BufferGeometry"]>, color: string, roughness?: number, metalness?: number) => InstanceType<ThreeNS["Mesh"]>
) {
  const book = new THREE.Group();
  const cover = mesh(new THREE.BoxGeometry(1.65, 1.12, 0.08), "#1a1f33", 0.55, 0.12);
  cover.position.z = -0.04;
  const left = mesh(new THREE.BoxGeometry(0.72, 0.98, 0.045), "#f4f1ea", 0.72, 0);
  left.position.set(-0.4, 0.02, 0.05);
  left.rotation.y = 0.22;
  const right = mesh(new THREE.BoxGeometry(0.72, 0.98, 0.045), "#fbfaf6", 0.72, 0);
  right.position.set(0.4, 0.02, 0.05);
  right.rotation.y = -0.16;
  const spine = mesh(new THREE.BoxGeometry(0.07, 1.02, 0.1), "#2a35ff", 0.4, 0.1);
  spine.position.z = 0.01;
  const lineA = mesh(new THREE.BoxGeometry(0.4, 0.03, 0.02), "#cfd3e0", 0.8, 0);
  lineA.position.set(0.4, 0.18, 0.09);
  const lineB = mesh(new THREE.BoxGeometry(0.28, 0.03, 0.02), "#cfd3e0", 0.8, 0);
  lineB.position.set(0.38, 0.02, 0.09);
  book.add(cover, left, right, spine, lineA, lineB);
  return book;
}

function makeCap(
  THREE: ThreeNS,
  mesh: (geometry: InstanceType<ThreeNS["BufferGeometry"]>, color: string, roughness?: number, metalness?: number) => InstanceType<ThreeNS["Mesh"]>
) {
  const cap = new THREE.Group();
  const board = mesh(new THREE.BoxGeometry(1.55, 0.08, 1.55), "#16181f", 0.42, 0.18);
  const skull = mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.28, 20), "#16181f", 0.45, 0.12);
  skull.position.y = -0.16;
  const button = mesh(new THREE.SphereGeometry(0.08, 16, 12), "#e6c36a", 0.28, 0.55);
  button.position.y = 0.1;
  const tassel = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.55, 8), "#e6c36a", 0.35, 0.4);
  tassel.position.set(0.48, -0.18, 0.15);
  const end = mesh(new THREE.SphereGeometry(0.06, 12, 10), "#e6c36a", 0.3, 0.45);
  end.position.set(0.48, -0.46, 0.15);
  cap.add(board, skull, button, tassel, end);
  return cap;
}

function makeGeometry(
  THREE: ThreeNS,
  mesh: (geometry: InstanceType<ThreeNS["BufferGeometry"]>, color: string, roughness?: number, metalness?: number) => InstanceType<ThreeNS["Mesh"]>
) {
  const group = new THREE.Group();
  const solid = mesh(new THREE.IcosahedronGeometry(0.62, 0), "#2a35ff", 0.28, 0.16);
  const ring = mesh(new THREE.TorusGeometry(0.95, 0.045, 12, 48), "#f4f6fb", 0.3, 0.2);
  ring.rotation.x = Math.PI / 2.4;
  const hand = mesh(new THREE.BoxGeometry(0.05, 0.55, 0.05), "#16181f", 0.4, 0.1);
  hand.position.set(0.12, 0.12, 0.05);
  hand.rotation.z = -0.6;
  group.add(solid, ring, hand);
  return group;
}

function makeMolecule(
  THREE: ThreeNS,
  mesh: (geometry: InstanceType<ThreeNS["BufferGeometry"]>, color: string, roughness?: number, metalness?: number) => InstanceType<ThreeNS["Mesh"]>
) {
  const group = new THREE.Group();
  const atoms: Array<[number, number, number, string, number]> = [
    [0, 0.15, 0, "#2a35ff", 0.28],
    [0.72, 0.45, 0.15, "#f4f6fb", 0.2],
    [-0.62, 0.28, 0.28, "#9eb0ff", 0.18],
    [0.12, -0.62, 0.18, "#e6c36a", 0.16],
    [-0.2, 0.05, -0.7, "#d7dbe8", 0.16],
  ];
  const centers = atoms.map(([x, y, z, color, radius]) => {
    const atom = mesh(new THREE.SphereGeometry(radius, 24, 16), color, 0.32, 0.12);
    atom.position.set(x, y, z);
    group.add(atom);
    return new THREE.Vector3(x, y, z);
  });
  const bonds: Array<[number, number]> = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [1, 2],
  ];
  const bondMaterialColor = "#c5cbe0";
  for (const [a, b] of bonds) {
    const from = centers[a]!;
    const to = centers[b]!;
    const direction = new THREE.Vector3().subVectors(to, from);
    const length = direction.length();
    const bond = mesh(new THREE.CylinderGeometry(0.035, 0.035, length, 8), bondMaterialColor, 0.45, 0.05);
    bond.position.copy(from).add(to).multiplyScalar(0.5);
    bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    group.add(bond);
  }
  return group;
}
