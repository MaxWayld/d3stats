"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

const ACCENT = 0x29b6f6;
const BG = 0x09090b;
const DURATION = 5000;
const FADE_OUT = 900;

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [opacity, setOpacity] = useState(1);
  const [visible, setVisible] = useState(true);

  const finish = useCallback(() => {
    setOpacity(0);
    setTimeout(() => {
      setVisible(false);
      onFinish();
    }, FADE_OUT);
  }, [onFinish]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Scene ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 8, 22);

    const camera = new THREE.PerspectiveCamera(
      55, // wider FOV = object fills more screen
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 7); // much closer

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // ── Environment map ──
    const envCanvas = document.createElement("canvas");
    envCanvas.width = 1024;
    envCanvas.height = 512;
    const ctx = envCanvas.getContext("2d")!;

    ctx.fillStyle = "#0a0a0e";
    ctx.fillRect(0, 0, 1024, 512);

    ctx.fillStyle = "#29b6f6";
    ctx.globalAlpha = 0.45;
    ctx.fillRect(80, 0, 70, 512);
    ctx.fillRect(680, 0, 90, 512);
    ctx.globalAlpha = 0.25;
    ctx.fillRect(380, 0, 50, 512);
    ctx.fillRect(920, 0, 40, 512);
    ctx.globalAlpha = 0.15;
    ctx.fillRect(0, 80, 1024, 35);
    ctx.fillRect(0, 380, 1024, 45);

    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(180, 0, 25, 512);
    ctx.fillRect(560, 0, 18, 512);
    ctx.globalAlpha = 1;

    const envMap = new THREE.CanvasTexture(envCanvas);
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    envMap.colorSpace = THREE.SRGBColorSpace;
    scene.environment = envMap;

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const d1 = new THREE.DirectionalLight(0xffffff, 2.0);
    d1.position.set(5, 5, 5);
    scene.add(d1);
    const d2 = new THREE.DirectionalLight(ACCENT, 1.8);
    d2.position.set(-5, 0, 5);
    scene.add(d2);
    const d3 = new THREE.DirectionalLight(ACCENT, 1.0);
    d3.position.set(0, -5, 3);
    scene.add(d3);

    // ── Material ──
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a2e,
      metalness: 1.0,
      roughness: 0.05,
      envMap,
      envMapIntensity: 2.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
    });

    // ── Tube ──
    const numPoints = 200;
    const tubularSegments = 256;
    const radialSegments = 32;
    const baseRadius = 0.5; // thicker tube

    function getPathPoints(time: number, morphPhase: number) {
      const points: THREE.Vector3[] = [];
      const scale = 1.3; // bigger overall shape
      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const angle = t * Math.PI * 2;

        const waveX = Math.sin(angle * 2 + time) * 3.5 * scale;
        const waveY = Math.cos(angle * 3 + time) * 2.5 * scale;
        const waveZ = Math.sin(angle * 1 - time) * 1.8 * scale;

        const kScale = 1.8 * scale;
        const knotX = (Math.sin(angle) + 2 * Math.sin(2 * angle)) * kScale;
        const knotY = (Math.cos(angle) - 2 * Math.cos(2 * angle)) * kScale;
        const knotZ = -Math.sin(3 * angle) * kScale;

        const easeMorph =
          morphPhase < 0.5
            ? 4 * morphPhase * morphPhase * morphPhase
            : 1 - Math.pow(-2 * morphPhase + 2, 3) / 2;

        const x = THREE.MathUtils.lerp(waveX, knotX, easeMorph);
        const y = THREE.MathUtils.lerp(waveY, knotY, easeMorph);
        const z = THREE.MathUtils.lerp(waveZ, knotZ, easeMorph);

        const breathe = 1 + Math.sin(time * 2 + angle * 5) * 0.05;
        points.push(new THREE.Vector3(x * breathe, y * breathe, z * breathe));
      }
      return points;
    }

    const initialPoints = getPathPoints(0, 0);
    const curve = new THREE.CatmullRomCurve3(initialPoints, true, "centripetal");
    const geometry = new THREE.TubeGeometry(curve, tubularSegments, baseRadius, radialSegments, true);
    const tubeMesh = new THREE.Mesh(geometry, material);
    scene.add(tubeMesh);

    // ── Animate ──
    const clock = new THREE.Clock();
    let animationId: number;

    function animate() {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const cycleDuration = 10;
      const cycleTime = elapsed % cycleDuration;
      const morphPhase = (Math.sin((cycleTime / cycleDuration) * Math.PI * 2 - Math.PI / 2) + 1) / 2;

      const newPoints = getPathPoints(elapsed * 0.5, morphPhase);
      const newCurve = new THREE.CatmullRomCurve3(newPoints, true, "centripetal");
      tubeMesh.geometry.dispose();
      tubeMesh.geometry = new THREE.TubeGeometry(newCurve, tubularSegments, baseRadius, radialSegments, true);
      tubeMesh.rotation.y = elapsed * 0.12;
      tubeMesh.rotation.x = Math.sin(elapsed * 0.06) * 0.25;
      renderer.render(scene, camera);
    }

    animate();

    const timer = setTimeout(finish, DURATION);
    const onClick = () => finish();
    container.addEventListener("click", onClick);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationId);
      container.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      tubeMesh.geometry.dispose();
      material.dispose();
      envMap.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [finish]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] cursor-pointer"
      style={{
        opacity,
        transition: `opacity ${FADE_OUT}ms ease-out`,
        background: "#09090b",
      }}
    >
      {/* D3 Stats title — floating animation */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
        <h1
          className="select-none"
          style={{
            fontSize: "clamp(52px, 9vw, 104px)",
            fontWeight: 200,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            animation: "floatTitle 4s ease-in-out infinite",
          }}
        >
          <span style={{ color: "#29b6f6", textShadow: "0 0 40px rgba(41,182,246,0.4), 0 0 80px rgba(41,182,246,0.15)" }}>D3</span>
          <span style={{ color: "#ffffff", marginLeft: "0.15em", textShadow: "0 0 40px rgba(255,255,255,0.1)" }}>Stats</span>
        </h1>
      </div>

      {/* Loading... at bottom */}
      <div className="absolute bottom-10 left-0 right-0 z-10 pointer-events-none flex items-center justify-center">
        <span
          className="text-[12px] tracking-[0.2em] uppercase"
          style={{ color: "#52525b" }}
        >
          Loading
          <span className="inline-flex w-[18px]" style={{ animation: "dots 1.4s steps(4,end) infinite" }}>
            ...
          </span>
          <span className="text-[10px] text-text-muted block mt-2" style={{ opacity: 0.4 }}>
            click anywhere to skip
          </span>
        </span>
      </div>

    </div>
  );
}
