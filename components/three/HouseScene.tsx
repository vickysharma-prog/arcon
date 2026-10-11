"use client";

import { Bounds, Environment, Html, Lightformer, OrbitControls, useBounds } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box3, CatmullRomCurve3, Plane, Raycaster, Vector2, Vector3 } from "three";
import type { Layout } from "@/lib/layout/schema";
import { decorate } from "@/lib/three/decor";
import { furnish, type Item } from "@/lib/three/furniture";
import { PIECES } from "@/lib/shop/list";
import { blockers, step } from "@/lib/three/explore";
import { buildSlabs, buildWalls, EYE, onTour, stairBoxes, STOREY, walkPlan, WALL_H, type Glass, type Slab, type WallBox } from "@/lib/three/geometry";
import { look as lookOf, luminance, mix, scheme, type Look, type Scheme } from "@/lib/three/materials";
import { LookCtx, Model } from "./models";
import { planks, tiled, tiles } from "./textures";
import { roomBell, step as playStep } from "@/components/fx/sfx";

export type Mode = "walk" | "explore" | "orbit";

type Props = {
  layout: Layout;
  /** Plants the client added to raise the greenery score, by room id. */
  extraPlants?: Record<string, number>;
  /** Called when a piece you can buy is clicked. */
  onPick?: (it: Item) => void;
  /** Look-around only: lift the roof off, and show floors up to this level ("all" keeps every floor). */
  cutaway?: boolean;
  upTo?: number | "all";
  /** The design brief and Qloo taste profile: colours, wall finish and furniture style come from these. */
  brief?: Parameters<typeof lookOf>[0];
  taste?: Parameters<typeof lookOf>[1];
  mode: Mode;
  /** Bump to frame the whole building again after flying into a room. */
  fitKey?: number;
  /** Explore mode: the floor you're on, a point to jump to, and where you are now. */
  level?: number;
  go?: { x: number; z: number; key: number };
  onPose?: (p: Pose) => void;
  playing: boolean;
  onRoom?: (name: string) => void;
  onProgress?: (p: number) => void;
  onEnd?: () => void;
  restartKey?: number;
  /** Look-around only: turn slowly on its own until someone grabs it, and whether the mouse wheel zooms. */
  autoRotate?: boolean;
  wheelZoom?: boolean;
};


function wallGeom(w: WallBox | Glass, thick: number) {
  const len = w.to - w.from;
  const h = w.y1 - w.y0;
  const mid = (w.from + w.to) / 2;
  const y = (w.y0 + w.y1) / 2;
  return w.axis === "x"
    ? { position: [mid, y, w.at] as const, size: [len, h, thick] as const }
    : { position: [w.at, y, mid] as const, size: [thick, h, len] as const };
}

function Building({ layout, colors, look, cutaway = false, upTo = "all", extraPlants, onPick }: { layout: Layout; colors: Scheme; look: Look; cutaway?: boolean; upTo?: number | "all"; extraPlants?: Record<string, number>; onPick?: (it: Item) => void }) {
  const shown = (level: number) => upTo === "all" || level <= upTo;
  // Show inside cuts the top floor's walls at 1.4 m, like an architect's section, so every room reads from above.
  const topShown = upTo === "all" ? (layout.floors.at(-1)?.level ?? 0) : upTo;
  const cutAt = (level: number) => (cutaway && level === topShown ? level * STOREY + CUT : Infinity);
  const built = useMemo(() => buildWalls(layout), [layout]);
  const walls = built.walls
    .filter((w) => shown(w.level) && w.y0 < cutAt(w.level))
    .map((w) => ({ ...w, y1: Math.min(w.y1, cutAt(w.level)), cut: w.y1 > cutAt(w.level) }));
  const glass = built.glass.filter((g) => shown(g.level) && g.y0 < cutAt(g.level)).map((g) => ({ ...g, y1: Math.min(g.y1, cutAt(g.level)) }));
  const allSlabs = useMemo(() => buildSlabs(layout), [layout]);
  const slabs = allSlabs.filter((s) => shown(s.level) && !(s.kind === "stairs" && s.level > 0));
  const allItems = useMemo(() => [...furnish(layout, { lush: look.lush, extraPlants }), ...decorate(layout)], [layout, look.lush, extraPlants]);
  const items = allItems
    .filter((i) => shown(i.level))
    .flatMap((it) => {
      const c = cutAt(it.level);
      if (!WALL_DRESSING.has(it.name) || it.y + it.h <= c) return [it];
      if (it.name === "art" || it.y >= c) return [];
      return [{ ...it, h: c - it.y }];
    });
  const { width: W, depth: D } = layout.shell;
  const top = (layout.floors.length - 1) * STOREY + WALL_H;
  const skirting = mix(colors.wall, "#000000", 0.1);
  const frame = luminance(colors.exterior) > 0.6 ? "#2b2d31" : "#f1efea";
  return (
    <group>
      {/* floors: wood planks, tile in wet rooms, on a slab */}
      {slabs.map((s) => (
        <group key={`f-${s.level}-${s.id}`}>
          <mesh position={[s.x + s.w / 2, s.y - 0.06, s.z + s.d / 2]} receiveShadow>
            <boxGeometry args={[s.w, 0.12, s.d]} />
            <meshStandardMaterial color={mix(colors.floor, "#000000", 0.2)} roughness={0.8} />
          </mesh>
          <Floor s={s} colors={colors} look={look} />
        </group>
      ))}
      {layout.floors
        .filter((f) => f.level > 0 && !cutaway && shown(f.level))
        .map((f) => (
          <mesh key={`ceil-${f.level}`} position={[W / 2, f.level * STOREY - (STOREY - WALL_H) / 2 - 0.12, D / 2]}>
            <boxGeometry args={[W, STOREY - WALL_H, D]} />
            <meshStandardMaterial color={colors.wall} />
          </mesh>
        ))}
      {/* walls, with a skirting board along the foot of each */}
      {walls.map((w, i) => {
        const g = wallGeom(w, w.thick);
        const foot = Math.abs(w.y0 - w.level * STOREY) < 1e-6;
        const k = wallGeom({ ...w, y1: w.y0 + 0.09 }, w.thick + 0.025);
        return (
          <group key={`w-${i}`}>
            <mesh position={g.position} castShadow receiveShadow>
              <boxGeometry args={g.size} />
              <meshStandardMaterial color={w.exterior ? colors.exterior : colors.wall} roughness={0.92} />
            </mesh>
            {w.cut && (
              <mesh position={[g.position[0], w.y1 + 0.01, g.position[2]]}>
                <boxGeometry args={[g.size[0] + 0.001, 0.02, g.size[2] + 0.001]} />
                <meshStandardMaterial color="#2b2f36" roughness={0.8} />
              </mesh>
            )}
            {foot && (
              <mesh position={k.position}>
                <boxGeometry args={k.size} />
                <meshStandardMaterial color={skirting} roughness={0.6} />
              </mesh>
            )}
          </group>
        );
      })}
      {/* windows: glass in a slim frame, with a centre bar on wide ones */}
      {glass.map((gl, i) => {
        const g = wallGeom(gl, 0.03);
        const bars: Glass[] = [
          { ...gl, to: gl.from + 0.05 },
          { ...gl, from: gl.to - 0.05 },
          { ...gl, y1: gl.y0 + 0.05 },
          { ...gl, y0: gl.y1 - 0.05 },
          ...(gl.to - gl.from > 1.2 ? [{ ...gl, from: (gl.from + gl.to) / 2 - 0.025, to: (gl.from + gl.to) / 2 + 0.025 }] : []),
        ];
        return (
          <group key={`g-${i}`}>
            <mesh position={g.position}>
              <boxGeometry args={g.size} />
              <meshPhysicalMaterial color="#cfe3f5" transparent opacity={0.22} roughness={0.03} metalness={0.1} />
            </mesh>
            {bars.map((b, j) => {
              const f = wallGeom(b, 0.08);
              return (
                <mesh key={j} position={f.position} castShadow>
                  <boxGeometry args={f.size} />
                  <meshStandardMaterial color={frame} roughness={0.5} metalness={0.3} />
                </mesh>
              );
            })}
          </group>
        );
      })}
      {/* a turning stair in its stairwell: a flight beside the hall, a landing, a flight back up */}
      {layout.floors.length > 1 &&
        layout.floors[0].spaces
          .filter((s) => s.kind === "stairs")
          .flatMap((s) =>
            stairBoxes(s.rect, layout.floors[0].openings.find((o) => o.id === "door-stairs"))
              // In the section view the stair is cut at the same height as the walls.
              .filter((b) => !(cutaway && topShown === 0 && b.y + b.h > CUT) && !(!shown(1) && b.y + b.h > WALL_H))
              .map((b, i) => {
                // Each step is a tread 22 cm thick (an open, floating stair), so both flights and the landings read.
                const t = Math.min(b.h, 0.22);
                return (
                  <mesh key={`st-${s.id}-${i}`} position={[b.x, b.y + b.h - t / 2, b.z]} castShadow receiveShadow>
                    <boxGeometry args={[b.w, t, b.d]} />
                    <meshStandardMaterial color={colors.wood} roughness={0.6} />
                  </mesh>
                );
              }),
          )}
      {/* roof with a small overhang, lifted off in the cutaway view */}
      {!cutaway && upTo === "all" && (
        <mesh position={[W / 2, top + 0.15, D / 2]} castShadow>
          <boxGeometry args={[W + 0.6, 0.3, D + 0.6]} />
          <meshStandardMaterial color={colors.roof} roughness={0.8} />
        </mesh>
      )}
      {items.map((it, i) =>
        onPick && PIECES[it.name] ? (
          // A piece you can buy: click it to see the brand it comes from.
          <group
            key={`i-${i}`}
            onClick={(e) => {
              e.stopPropagation();
              onPick(it);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => (document.body.style.cursor = "")}
          >
            <Model it={it} k={colors} />
          </group>
        ) : (
          <Model key={`i-${i}`} it={it} k={colors} />
        ),
      )}
      {/* a warm light in every room, with its fixture on the ceiling when the roof is on */}
      {slabs
        .filter((s) => s.zone !== "circulation")
        .slice(0, 12)
        .map((s) => (
          <group key={`l-${s.level}-${s.id}`} position={[s.x + s.w / 2, s.y + WALL_H, s.z + s.d / 2]}>
            <pointLight position={[0, -0.45, 0]} intensity={2.6} distance={7} decay={1.4} color="#ffe6c4" />
            {!cutaway && (
              <mesh position={[0, -0.02, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.03, 24]} />
                <meshStandardMaterial color="#fff6e8" emissive="#fff1d6" emissiveIntensity={1.2} />
              </mesh>
            )}
          </group>
        ))}
    </group>
  );
}

const WET = new Set(["bath", "laundry"]);
const CUT = 1.4;
// Floor boards lean toward the style: pale oak for Scandinavian, smoky for industrial; boards are 20 cm by 2.7 m.
const FLOOR_TONE = { scandi: ["#e6d7bd", 0.5], modern: ["#cbb79b", 0.3], boho: ["#c9a77c", 0.2], industrial: ["#7d7468", 0.35], classic: ["#5a3a24", 0.15], midcentury: ["#8a5a36", 0.15] } as const;
const WALL_DRESSING = new Set(["feature wall", "art", "backsplash", "tile", "curtain", "curtain rod"]);
function Floor({ s, colors, look }: { s: Slab; colors: Scheme; look: Look }) {
  const wet = WET.has(s.kind);
  const map = useMemo(
    () => (wet ? tiled(tiles(mix(look.tile, "#888888", 0.15), look.tileKind === "zellige" ? "plain" : look.tileKind, 2), s.w, s.d, 0.6) : tiled(planks(mix(colors.floor, FLOOR_TONE[look.style][0], FLOOR_TONE[look.style][1])), s.w, s.d, 3.6, 0.8)),
    [wet, s.w, s.d, colors.floor, look.tile, look.tileKind, look.style],
  );
  return (
    <mesh rotation-x={-Math.PI / 2} position={[s.x + s.w / 2, s.y + 0.001, s.z + s.d / 2]} receiveShadow>
      <planeGeometry args={[s.w, s.d]} />
      <meshStandardMaterial map={map} roughness={wet ? 0.35 : 0.55} />
    </mesh>
  );
}

// Moves the camera along the walk path at walking pace, looking where it's going.
function Walker({ layout, playing, onRoom, onProgress, onEnd, restartKey }: Omit<Props, "mode" | "brief" | "taste">) {
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
  const { gl } = useThree();
  // Mouse look while walking: drag to turn your head; let go and the view eases back to the path.
  const head = useRef({ yaw: 0, pitch: 0, dragging: false, x: 0, y: 0 });
  const stepClock = useRef(0);

  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => Object.assign(head.current, { dragging: true, x: e.clientX, y: e.clientY });
    const move = (e: PointerEvent) => {
      const h = head.current;
      if (!h.dragging) return;
      h.yaw -= (e.clientX - h.x) * 0.005;
      h.pitch = Math.max(-0.9, Math.min(0.9, h.pitch - (e.clientY - h.y) * 0.004));
      h.x = e.clientX;
      h.y = e.clientY;
    };
    const up = () => {
      head.current.dragging = false;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.style.cursor = "grab";
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.style.cursor = "";
    };
  }, [gl]);

  useEffect(() => {
    t.current = 0;
    ended.current = false;
    if (curves) {
      camera.position.copy(curves.path.getPointAt(0));
      look.current.copy(curves.gaze.getPointAt(0));
    }
  }, [curves, camera, restartKey]);

  useFrame((_, frameDt) => {
    if (!curves) return;
    // A slow frame must not jump the walk ahead: cap the step to a tenth of a second.
    const dt = Math.min(frameDt, 0.1);
    // Walk at about 1.1 m/s, slowing to a near stop at each doorway view so the room can be taken in.
    const here0 = curves.path.getPointAt(t.current);
    const near = Math.min(...curves.stops.map((p) => p.distanceTo(here0)), 99);
    const pace = 0.75 * Math.min(1, Math.max(0.08, near / 1.6));
    const h = head.current;
    // Holding the mouse down pauses the walk so you can look around where you stand.
    const walking = playing && t.current < 1 && !h.dragging;
    if (walking) {
      t.current = Math.min(1, t.current + (dt * pace) / length);
      // A footstep about every 0.7 m.
      stepClock.current += dt * pace;
      if (stepClock.current > 0.7 && pace > 0.3) {
        stepClock.current = 0;
        playStep();
      }
    }
    if (!h.dragging) {
      h.yaw *= 1 - Math.min(1, dt * 1.5);
      h.pitch *= 1 - Math.min(1, dt * 1.5);
    }
    // Even walking speed along the path; the gaze follows the same control point, so each look matches its spot.
    const u = curves.path.getUtoTmapping(t.current, 0);
    const pos = curves.path.getPoint(u);
    const target = curves.gaze.getPoint(u);
    camera.position.copy(pos);
    look.current.lerp(target, Math.min(1, dt * 2.2));
    // Turn the head by the drag: rotate the look direction around the eye.
    const dir = look.current.clone().sub(pos);
    const flat = Math.hypot(dir.x, dir.z) || 1;
    const yaw0 = Math.atan2(dir.x, dir.z) + h.yaw;
    const pitch0 = Math.atan2(dir.y, flat) + h.pitch;
    camera.lookAt(pos.x + Math.sin(yaw0) * Math.cos(pitch0), pos.y + Math.sin(pitch0), pos.z + Math.cos(yaw0) * Math.cos(pitch0));
    onProgress?.(t.current);
    const level = Math.round((pos.y - 1.6) / STOREY);
    const here = layout.floors
      .find((f) => f.level === level)
      ?.spaces.find((s) => pos.x >= s.rect.x && pos.x <= s.rect.x + s.rect.w && pos.z >= s.rect.y && pos.z <= s.rect.y + s.rect.h);
    const name = here ? (here.zone === "circulation" ? (here.kind === "stairs" ? "Stairs" : "Hall") : here.name) : "Outside";
    if (name !== lastRoom.current) {
      if (lastRoom.current && here && here.zone !== "circulation") roomBell();
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

export type Pose = { x: number; z: number; yaw: number; level: number };

// Free walking at eye height: W A S D or the arrow keys to move, drag to look, click the floor to walk
// there. Walls stop you; doorways let you through. `go` jumps to a point (from the mini-map).
function Explorer({ layout, level, go, onPose, onRoom }: { layout: Layout; level: number; go?: { x: number; z: number; key: number }; onPose?: (p: Pose) => void; onRoom?: (name: string) => void }) {
  const { camera, gl } = useThree();
  const walls = useMemo(() => blockers(layout, level), [layout, level]);
  const me = useRef({ x: 0, z: 0, yaw: 0, pitch: -0.05 });
  const target = useRef<[number, number] | null>(null);
  const keys = useRef(new Set<string>());
  const lastPose = useRef(0);
  const lastRoom = useRef("");
  const stepClock = useRef(0);

  // Arrive on a floor in its first proper room, looking across it.
  useLayoutEffect(() => {
    const f = layout.floors.find((fl) => fl.level === level);
    const room = f?.spaces.find((s) => s.zone !== "circulation" && onTour(s)) ?? f?.spaces[0];
    if (!room) return;
    const { x, y, w, h } = room.rect;
    me.current = { x: x + w / 2, z: y + h - 0.6, yaw: Math.PI, pitch: -0.05 };
    target.current = null;
    if ("fov" in camera) {
      camera.fov = 72;
      camera.near = 0.05;
      camera.updateProjectionMatrix();
    }
  }, [layout, level, camera]);

  useEffect(() => {
    if (!go?.key) return;
    me.current.x = go.x;
    me.current.z = go.z;
    target.current = null;
  }, [go]);

  useEffect(() => {
    const el = gl.domElement;
    let down: { x: number; y: number; moved: number; lx: number; ly: number } | null = null;
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, moved: 0, lx: e.clientX, ly: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - down.lx;
      const dy = e.clientY - down.ly;
      down.moved += Math.abs(dx) + Math.abs(dy);
      down.lx = e.clientX;
      down.ly = e.clientY;
      me.current.yaw -= dx * 0.005;
      me.current.pitch = Math.max(-1.1, Math.min(0.9, me.current.pitch - dy * 0.004));
    };
    const onUp = (e: PointerEvent) => {
      // A click (not a drag) walks to the spot on the floor under the pointer.
      if (down && down.moved < 6) {
        const r = el.getBoundingClientRect();
        const ndc = new Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        const ray = new Raycaster();
        ray.setFromCamera(ndc, camera);
        const hit = ray.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), -level * STOREY), new Vector3());
        if (hit && hit.distanceTo(camera.position) < 25) target.current = [hit.x, hit.z];
      }
      down = null;
    };
    const keyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "q", "e", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        e.preventDefault();
        keys.current.add(k);
        target.current = null;
      }
    };
    const keyUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    el.style.cursor = "crosshair";
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      el.style.cursor = "";
    };
  }, [gl, camera, level]);

  useFrame((_, frameDt) => {
    const dt = Math.min(frameDt, 0.1);
    const m = me.current;
    const k = keys.current;
    const turn = (k.has("arrowleft") || k.has("q") ? 1 : 0) - (k.has("arrowright") || k.has("e") ? 1 : 0);
    m.yaw += turn * dt * 1.6;
    const fwd = (k.has("w") || k.has("arrowup") ? 1 : 0) - (k.has("s") || k.has("arrowdown") ? 1 : 0);
    const side = (k.has("d") ? 1 : 0) - (k.has("a") ? 1 : 0);
    let dx = 0;
    let dz = 0;
    const speed = 1.6;
    if (fwd || side) {
      dx = (Math.sin(m.yaw) * fwd - Math.cos(m.yaw) * side) * speed * dt;
      dz = (Math.cos(m.yaw) * fwd + Math.sin(m.yaw) * side) * speed * dt;
    } else if (target.current) {
      const [tx, tz] = target.current;
      const dist = Math.hypot(tx - m.x, tz - m.z);
      if (dist < 0.08) target.current = null;
      else {
        const s = Math.min(dist, speed * dt);
        dx = ((tx - m.x) / dist) * s;
        dz = ((tz - m.z) / dist) * s;
        // Turn gently toward where we're walking.
        const want = Math.atan2(tx - m.x, tz - m.z);
        let diff = want - m.yaw;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        m.yaw += diff * Math.min(1, dt * 3);
      }
    }
    if (dx || dz) {
      const [nx, nz] = step(m.x, m.z, dx, dz, walls);
      const moved = Math.hypot(nx - m.x, nz - m.z);
      if (target.current && moved < 1e-4) target.current = null; // walked into a wall: stop
      m.x = nx;
      m.z = nz;
      stepClock.current += moved;
      if (stepClock.current > 0.7) {
        stepClock.current = 0;
        playStep();
      }
    }
    const y = level * STOREY + EYE;
    camera.position.set(m.x, y, m.z);
    camera.lookAt(m.x + Math.sin(m.yaw) * Math.cos(m.pitch), y + Math.sin(m.pitch), m.z + Math.cos(m.yaw) * Math.cos(m.pitch));
    const now = performance.now();
    if (now - lastPose.current > 120) {
      lastPose.current = now;
      onPose?.({ x: m.x, z: m.z, yaw: m.yaw, level });
      const here = layout.floors.find((f) => f.level === level)?.spaces.find((s) => m.x >= s.rect.x && m.x <= s.rect.x + s.rect.w && m.z >= s.rect.y && m.z <= s.rect.y + s.rect.h);
      const name = here ? (here.zone === "circulation" ? (here.kind === "stairs" ? "Stairs" : "Hall") : here.name) : "Outside";
      if (name !== lastRoom.current) {
        if (lastRoom.current && here && here.zone !== "circulation") roomBell();
        lastRoom.current = name;
        onRoom?.(name);
      }
    }
  });
  return null;
}

// Look-around view: start from above the corner of the building with a normal lens. Runs as a layout
// effect so the camera is in place before Bounds frames the model from this direction.
function Overview({ layout, autoRotate = false, wheelZoom = true }: { layout: Layout; autoRotate?: boolean; wheelZoom?: boolean }) {
  const { camera } = useThree();
  const [spin, setSpin] = useState(autoRotate);
  const { width: W, depth: D } = layout.shell;
  const h = layout.floors.length * STOREY;
  useLayoutEffect(() => {
    const span = Math.max(W, D);
    camera.position.set(W / 2 + span * 1.05, h + span * 0.95, D / 2 + span * 1.25);
    if ("fov" in camera) {
      camera.fov = 45;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(W / 2, h / 3, D / 2);
  }, [camera, W, D, h]);
  return (
    <OrbitControls
      target={[W / 2, h / 3, D / 2]}
      maxPolarAngle={Math.PI / 2.1}
      minDistance={1.5}
      maxDistance={90}
      enableDamping
      enableZoom={wheelZoom}
      autoRotate={spin}
      autoRotateSpeed={0.7}
      onStart={() => setSpin(false)}
      makeDefault
    />
  );
}

// Room names over the floor being looked at; clicking one flies the camera to that room.
// "Whole house": fly back to the starting corner, at a distance that fits the whole building in view.
// Always mounted inside Bounds, whether or not the inside is showing.
function Recenter({ layout, fitKey }: { layout: Layout; fitKey?: number }) {
  const api = useBounds();
  const { camera } = useThree();
  const done = useRef(0);
  useEffect(() => {
    if (!fitKey || fitKey === done.current) return;
    done.current = fitKey;
    const { width: W, depth: D } = layout.shell;
    const h = layout.floors.length * STOREY;
    const span = Math.max(W, D);
    const target: [number, number, number] = [W / 2, h / 3, D / 2];
    const dir = new Vector3(span * 1.05, h + span * 0.95 - h / 3, span * 1.25).normalize();
    const radius = 0.5 * Math.hypot(W, D, h);
    const fov = "fov" in camera ? (camera.fov * Math.PI) / 180 : Math.PI / 4;
    const dist = (radius / Math.sin(fov / 2)) * 1.08;
    api.to({ position: [target[0] + dir.x * dist, target[1] + dir.y * dist, target[2] + dir.z * dist], target });
  }, [fitKey, api, camera, layout]);
  return null;
}

function RoomLabels({ layout, level }: { layout: Layout; level: number }) {
  const api = useBounds();
  const floor = layout.floors.find((f) => f.level === level);
  if (!floor) return null;
  const y = level * STOREY;
  return (
    <>
      {floor.spaces
        .filter((s) => s.zone !== "circulation" || s.kind === "stairs")
        .map((s) => (
          <Html key={s.id} position={[s.rect.x + s.rect.w / 2, y + 1.3, s.rect.y + s.rect.h / 2]} center zIndexRange={[20, 0]}>
            <button
              onClick={() => {
                const box = new Box3(new Vector3(s.rect.x, y, s.rect.y), new Vector3(s.rect.x + s.rect.w, y + WALL_H, s.rect.y + s.rect.h));
                api.refresh(box).fit();
                roomBell();
              }}
              className="whitespace-nowrap rounded-full border border-line bg-paper/90 px-3 py-1 text-xs font-medium text-ink shadow-sm backdrop-blur transition hover:bg-btn hover:text-btn-ink"
            >
              {s.name}
            </button>
          </Html>
        ))}
    </>
  );
}

// Walk view: a wide lens like a property tour.
function WideLens() {
  const { camera } = useThree();
  useEffect(() => {
    if ("fov" in camera) {
      camera.fov = 82;
      camera.near = 0.05;
      camera.updateProjectionMatrix();
    }
  }, [camera]);
  return null;
}

// Soft studio light for reflections and fill, built from light panels, so nothing has to download.
function Studio() {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={0.55}>
      <Lightformer form="rect" intensity={2} position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} color="#fff8ee" />
      <Lightformer form="rect" intensity={1.2} position={[-10, 3, 0]} rotation-y={Math.PI / 2} scale={[20, 6, 1]} color="#eaf2ff" />
      <Lightformer form="rect" intensity={1.2} position={[10, 3, 0]} rotation-y={-Math.PI / 2} scale={[20, 6, 1]} color="#fff1df" />
      <Lightformer form="rect" intensity={0.6} position={[0, 3, 10]} rotation-y={Math.PI} scale={[20, 6, 1]} />
    </Environment>
  );
}

export default function HouseScene(props: Props) {
  const colors = useMemo(() => scheme(props.brief?.palette), [props.brief]);
  const look = useMemo(() => lookOf(props.brief, props.taste), [props.brief, props.taste]);
  const { width: W, depth: D } = props.layout.shell;
  const h = props.layout.floors.length * STOREY;
  const orbit = props.mode === "orbit";
  const top = props.layout.floors.at(-1)?.level ?? 0;
  const building = (
    <Building layout={props.layout} colors={colors} look={look} cutaway={orbit && props.cutaway} upTo={orbit ? props.upTo : "all"} extraPlants={props.extraPlants} onPick={props.onPick} />
  );
  return (
    <Canvas
      shadows
      camera={{ fov: orbit ? 45 : props.mode === "explore" ? 72 : 82, near: 0.05, far: 300, position: [W * 1.6, h * 2.2 + 6, D * 1.9] }}
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true }}
    >
      <color attach="background" args={["#dfe8f3"]} />
      <hemisphereLight args={["#ffffff", "#d9cfc2", 0.7]} />
      <directionalLight position={[W + 14, 26, -8]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} />
      <ambientLight intensity={0.25} />
      <Studio />
      {/* the site sits outside Bounds, so framing fits the building, not the lawn */}
      <mesh rotation-x={-Math.PI / 2} position={[W / 2, -0.02, D / 2]} receiveShadow>
        <planeGeometry args={[W + 40, D + 40]} />
        <meshStandardMaterial color={colors.ground} roughness={1} />
      </mesh>
      <LookCtx.Provider value={look}>
        {orbit ? (
          <Bounds fit clip observe margin={1.12} maxDuration={0.9}>
            <Overview layout={props.layout} autoRotate={props.autoRotate} wheelZoom={props.wheelZoom} />
            {building}
            <Recenter layout={props.layout} fitKey={props.fitKey} />
            {props.cutaway && <RoomLabels layout={props.layout} level={props.upTo === "all" || props.upTo === undefined ? top : props.upTo} />}
          </Bounds>
        ) : props.mode === "explore" ? (
          <>
            {building}
            <Explorer layout={props.layout} level={props.level ?? 0} go={props.go} onPose={props.onPose} onRoom={props.onRoom} />
          </>
        ) : (
          <>
            {building}
            <WideLens />
            <Walker {...props} />
          </>
        )}
      </LookCtx.Provider>
      <EffectComposer multisampling={4}>
        <N8AO halfRes aoRadius={0.5} distanceFalloff={0.5} intensity={2.2} quality="medium" />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
