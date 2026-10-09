"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CatmullRomCurve3, Vector3 } from "three";
import type { Layout } from "@/lib/layout/schema";
import { furnish, type Item } from "@/lib/three/furniture";
import { buildSlabs, buildWalls, STOREY, walkPlan, WALL_H, type Glass, type WallBox } from "@/lib/three/geometry";
import { scheme, type Scheme } from "@/lib/three/materials";

export type Mode = "walk" | "orbit";

type Props = {
  layout: Layout;
  palette?: { hex: string; role: string }[];
  mode: Mode;
  playing: boolean;
  onRoom?: (name: string) => void;
  onProgress?: (p: number) => void;
  onEnd?: () => void;
  restartKey?: number;
};

const BATH = new Set(["bath", "laundry"]);

function wallGeom(w: WallBox | Glass, thick: number) {
  const len = w.to - w.from;
  const h = w.y1 - w.y0;
  const mid = (w.from + w.to) / 2;
  const y = (w.y0 + w.y1) / 2;
  return w.axis === "x"
    ? { position: [mid, y, w.at] as const, size: [len, h, thick] as const }
    : { position: [w.at, y, mid] as const, size: [thick, h, len] as const };
}

function Building({ layout, colors }: { layout: Layout; colors: Scheme }) {
  const { walls, glass } = useMemo(() => buildWalls(layout), [layout]);
  const slabs = useMemo(() => buildSlabs(layout), [layout]);
  const items = useMemo(() => furnish(layout), [layout]);
  const { width: W, depth: D } = layout.shell;
  const top = (layout.floors.length - 1) * STOREY + WALL_H;
  return (
    <group>
      {/* site */}
      <mesh rotation-x={-Math.PI / 2} position={[W / 2, -0.02, D / 2]} receiveShadow>
        <planeGeometry args={[W + 30, D + 30]} />
        <meshStandardMaterial color={colors.ground} roughness={1} />
      </mesh>
      {/* floors, and the slab above each lower storey */}
      {slabs.map((s) => (
        <mesh key={`f-${s.level}-${s.id}`} position={[s.x + s.w / 2, s.y - 0.06, s.z + s.d / 2]} receiveShadow>
          <boxGeometry args={[s.w, 0.12, s.d]} />
          <meshStandardMaterial color={BATH.has(s.kind) ? colors.bathFloor : s.zone === "circulation" ? colors.base : colors.floor} roughness={0.7} />
        </mesh>
      ))}
      {layout.floors
        .filter((f) => f.level > 0)
        .map((f) => (
          <mesh key={`ceil-${f.level}`} position={[W / 2, f.level * STOREY - (STOREY - WALL_H) / 2 - 0.12, D / 2]}>
            <boxGeometry args={[W, STOREY - WALL_H, D]} />
            <meshStandardMaterial color={colors.wall} />
          </mesh>
        ))}
      {/* walls and glass */}
      {walls.map((w, i) => {
        const g = wallGeom(w, w.thick);
        return (
          <mesh key={`w-${i}`} position={g.position} castShadow receiveShadow>
            <boxGeometry args={g.size} />
            <meshStandardMaterial color={w.exterior ? colors.exterior : colors.wall} roughness={0.9} />
          </mesh>
        );
      })}
      {glass.map((gl, i) => {
        const g = wallGeom(gl, 0.03);
        return (
          <mesh key={`g-${i}`} position={g.position}>
            <boxGeometry args={g.size} />
            <meshPhysicalMaterial color="#cfe3f5" transparent opacity={0.28} roughness={0.05} metalness={0.1} />
          </mesh>
        );
      })}
      {/* stairs */}
      {layout.floors.length > 1 &&
        layout.floors[0].spaces
          .filter((s) => s.kind === "stairs")
          .map((s) => {
            const steps = 16;
            const along = s.rect.w >= s.rect.h;
            return Array.from({ length: steps }, (_, i) => {
              const t = (i + 0.5) / steps;
              const pos: [number, number, number] = along
                ? [s.rect.x + t * s.rect.w, ((i + 1) * STOREY) / steps / 2, s.rect.y + s.rect.h / 2]
                : [s.rect.x + s.rect.w / 2, ((i + 1) * STOREY) / steps / 2, s.rect.y + t * s.rect.h];
              const size: [number, number, number] = along
                ? [s.rect.w / steps, ((i + 1) * STOREY) / steps, s.rect.h * 0.9]
                : [s.rect.w * 0.9, ((i + 1) * STOREY) / steps, s.rect.h / steps];
              return (
                <mesh key={`st-${s.id}-${i}`} position={pos} castShadow>
                  <boxGeometry args={size} />
                  <meshStandardMaterial color={colors.wood} />
                </mesh>
              );
            });
          })}
      {/* roof with a small overhang */}
      <mesh position={[W / 2, top + 0.15, D / 2]} castShadow>
        <boxGeometry args={[W + 0.6, 0.3, D + 0.6]} />
        <meshStandardMaterial color={colors.roof} roughness={0.8} />
      </mesh>
      {items.map((it, i) => (
        <Piece key={`i-${i}`} it={it} colors={colors} />
      ))}
      {/* a warm light in every room */}
      {slabs
        .filter((s) => s.zone !== "circulation")
        .slice(0, 12)
        .map((s) => (
          <pointLight key={`l-${s.level}-${s.id}`} position={[s.x + s.w / 2, s.y + WALL_H - 0.4, s.z + s.d / 2]} intensity={3.2} distance={7} decay={1.4} color="#ffe6c4" />
        ))}
    </group>
  );
}

function Piece({ it, colors }: { it: Item; colors: Scheme }) {
  const color = colors[it.role];
  const y = it.y + it.h / 2;
  if (it.shape === "ball")
    return (
      <mesh position={[it.x, y, it.z]} scale={[it.w / 2, it.h / 2, it.d / 2]} castShadow>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    );
  if (it.shape === "cyl")
    return (
      <mesh position={[it.x, y, it.z]} castShadow>
        <cylinderGeometry args={[it.w / 2, it.w / 2.4, it.h, 20]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    );
  return (
    <mesh position={[it.x, y, it.z]} castShadow receiveShadow>
      <boxGeometry args={[it.w, it.h, it.d]} />
      <meshStandardMaterial color={color} roughness={it.role === "metal" ? 0.35 : 0.75} metalness={it.role === "metal" ? 0.6 : 0} />
    </mesh>
  );
}

// Moves the camera along the walk path at walking pace, looking where it's going.
function Walker({ layout, playing, onRoom, onProgress, onEnd, restartKey }: Omit<Props, "mode" | "palette">) {
  const { camera } = useThree();
  const curves = useMemo(() => {
    const { path, gaze, stops } = walkPlan(layout);
    if (path.length < 2) return null;
    const mk = (pts: number[][]) => new CatmullRomCurve3(pts.map((p) => new Vector3(p[0], p[1], p[2])), false, "centripetal", 0.5);
    return { path: mk(path), gaze: mk(gaze), stops: stops.map((p) => new Vector3(p[0], p[1], p[2])) };
  }, [layout]);
  const length = useMemo(() => curves?.path.getLength() ?? 1, [curves]);
  const t = useRef(0);
  const look = useRef(new Vector3());
  const lastRoom = useRef("");
  const ended = useRef(false);

  useEffect(() => {
    t.current = 0;
    ended.current = false;
    if (curves) {
      camera.position.copy(curves.path.getPointAt(0));
      look.current.copy(curves.gaze.getPointAt(0));
    }
  }, [curves, camera, restartKey]);

  useFrame((_, dt) => {
    if (!curves) return;
    // Walk at about 1.1 m/s, slowing to a near stop at each doorway view so the room can be taken in.
    const here0 = curves.path.getPointAt(t.current);
    const near = Math.min(...curves.stops.map((p) => p.distanceTo(here0)), 99);
    const pace = 1.1 * Math.min(1, Math.max(0.12, near / 1.4));
    if (playing && t.current < 1) t.current = Math.min(1, t.current + (dt * pace) / length);
    // Even walking speed along the path; the gaze follows the same control point, so each look matches its spot.
    const u = curves.path.getUtoTmapping(t.current, 0);
    const pos = curves.path.getPoint(u);
    const target = curves.gaze.getPoint(u);
    camera.position.copy(pos);
    look.current.lerp(target, Math.min(1, dt * 2.2));
    camera.lookAt(look.current);
    onProgress?.(t.current);
    const level = Math.round((pos.y - 1.6) / STOREY);
    const here = layout.floors
      .find((f) => f.level === level)
      ?.spaces.find((s) => pos.x >= s.rect.x && pos.x <= s.rect.x + s.rect.w && pos.z >= s.rect.y && pos.z <= s.rect.y + s.rect.h);
    const name = here ? (here.zone === "circulation" ? (here.kind === "stairs" ? "Stairs" : "Hall") : here.name) : "Outside";
    if (name !== lastRoom.current) {
      lastRoom.current = name;
      onRoom?.(name);
    }
    if (t.current >= 1 && !ended.current) {
      ended.current = true;
      onEnd?.();
    }
  });
  return null;
}

export default function HouseScene(props: Props) {
  const colors = useMemo(() => scheme(props.palette), [props.palette]);
  const { width: W, depth: D } = props.layout.shell;
  const h = props.layout.floors.length * STOREY;
  return (
    <Canvas shadows camera={{ fov: props.mode === "walk" ? 82 : 45, near: 0.05, far: 300, position: [W * 1.6, h * 2.2 + 6, D * 1.9] }} dpr={[1, 2]}>
      <color attach="background" args={["#dfe8f3"]} />
      <hemisphereLight args={["#ffffff", "#d9cfc2", 1.1]} />
      <directionalLight position={[W + 14, 26, -8]} intensity={2.4} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} />
      <ambientLight intensity={0.55} />
      <Building layout={props.layout} colors={colors} />
      {props.mode === "walk" ? (
        <Walker {...props} />
      ) : (
        <OrbitControls target={[W / 2, h / 3, D / 2]} maxPolarAngle={Math.PI / 2.1} minDistance={4} maxDistance={80} enableDamping />
      )}
    </Canvas>
  );
}
