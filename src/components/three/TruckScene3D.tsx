import { useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, Html, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { MAX_BRAKING_DISTANCE, type SpeedStatus } from "@/lib/physics";

export interface TruckSceneProps {
  /** km/h */
  speed: number;
  /** degrees, positive = downhill */
  slope: number;
  /** friction coefficient µ */
  grip: number;
  /** kg */
  load: number;
  /** metres */
  brakingDistance: number;
  status: SpeedStatus;
  autoRotate?: boolean;
  /** Pause rendering when false (e.g. scrolled off-screen). */
  active?: boolean;
}

/** World units per metre (stylised: truck is drawn larger than life so it reads at a distance). */
const M = 0.35;
const TRUCK_FRONT = 2.35;
const MAX_LOAD_KG = 20000;

const hsl = (h: number, s: number, l: number) => new THREE.Color().setHSL(h / 360, s / 100, l / 100);
const COLORS = {
  primary: hsl(185, 80, 50),
  accent: hsl(38, 90, 55),
  safe: hsl(150, 70, 45),
  warning: hsl(38, 90, 55),
  critical: hsl(0, 72, 55),
  bg: hsl(220, 18, 10),
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const damp = THREE.MathUtils.damp;

function Wheel({ position, spin }: { position: [number, number, number]; spin: MutableRefObject<number> }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.z = spin.current;
  });
  return (
    <group position={position} ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.38, 24]} />
        <meshStandardMaterial color="#14171c" roughness={0.9} />
      </mesh>
      {/* hub + spoke so rotation is visible */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 12]} />
        <meshStandardMaterial color="#8a96a3" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.27, 0]}>
        <boxGeometry args={[0.08, 0.18, 0.41]} />
        <meshStandardMaterial color="#8a96a3" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Truck({ speedRef, loadRef, statusColor }: {
  speedRef: MutableRefObject<number>;
  loadRef: MutableRefObject<number>;
  statusColor: THREE.Color;
}) {
  const spin = useRef(0);
  const cargo = useRef<THREE.Mesh>(null);
  const beacon = useRef<THREE.MeshStandardMaterial>(null);
  const reduce = useMemo(prefersReducedMotion, []);

  useFrame((state, dt) => {
    const unitsPerSec = (speedRef.current / 3.6) * M;
    if (!reduce) spin.current -= (unitsPerSec / 0.45) * dt;

    if (cargo.current) {
      const target = 0.15 + Math.min(loadRef.current / MAX_LOAD_KG, 1) * 1.45;
      const h = damp(cargo.current.scale.y, target, 4, dt);
      cargo.current.scale.y = h;
      cargo.current.position.y = 1.05 + h / 2;
    }
    if (beacon.current) {
      beacon.current.emissive.copy(statusColor);
      beacon.current.emissiveIntensity = reduce ? 2 : 1.5 + Math.sin(state.clock.elapsedTime * 6) * 1;
    }
  });

  return (
    <group>
      {/* chassis */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.6, 0.25, 1.9]} />
        <meshStandardMaterial color="#2a313b" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* cab */}
      <RoundedBox args={[1.35, 1.65, 2.05]} radius={0.12} position={[1.62, 1.7, 0]} castShadow>
        <meshStandardMaterial color={COLORS.primary} metalness={0.35} roughness={0.35} />
      </RoundedBox>
      {/* windscreen */}
      <mesh position={[2.3, 2.0, 0]}>
        <boxGeometry args={[0.04, 0.65, 1.8]} />
        <meshStandardMaterial color="#0b1520" emissive={COLORS.primary} emissiveIntensity={0.25} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* headlights */}
      {[-0.7, 0.7].map((z) => (
        <mesh key={z} position={[2.31, 1.15, z]}>
          <boxGeometry args={[0.03, 0.18, 0.35]} />
          <meshStandardMaterial color="#fff" emissive="#fff7d6" emissiveIntensity={2} />
        </mesh>
      ))}
      {/* status beacon on roof */}
      <mesh position={[1.62, 2.62, 0]}>
        <boxGeometry args={[0.35, 0.12, 1.2]} />
        <meshStandardMaterial ref={beacon} color="#111" emissive={statusColor} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      {/* bed */}
      <mesh position={[-0.65, 0.98, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.14, 2.0]} />
        <meshStandardMaterial color="#3a424d" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* cargo (height follows load) */}
      <mesh ref={cargo} position={[-0.65, 1.5, 0]} castShadow>
        <boxGeometry args={[3.0, 1, 1.85]} />
        <meshStandardMaterial color={COLORS.accent} roughness={0.7} />
      </mesh>
      {/* wheels */}
      {[1.55, -0.9, -1.85].flatMap((x) =>
        [-0.95, 0.95].map((z) => <Wheel key={`${x}${z}`} position={[x, 0.45, z]} spin={spin} />),
      )}
      {/* status underglow */}
      <pointLight position={[0, 0.2, 0]} color={statusColor} intensity={6} distance={5} />
    </group>
  );
}

function Road({ speedRef, grip }: { speedRef: MutableRefObject<number>; grip: number }) {
  const dashes = useRef<THREE.Group>(null);
  const offset = useRef(0);
  const reduce = useMemo(prefersReducedMotion, []);
  // Low grip → wet, glossy road
  const wetness = THREE.MathUtils.clamp((0.8 - grip) / 0.6, 0, 1);

  useFrame((_, dt) => {
    if (!dashes.current || reduce) return;
    offset.current = (offset.current + (speedRef.current / 3.6) * M * dt) % 3;
    dashes.current.position.x = -offset.current;
  });

  return (
    <group>
      <mesh position={[8, -0.05, 0]} receiveShadow>
        <boxGeometry args={[70, 0.1, 5.2]} />
        <meshStandardMaterial
          color={new THREE.Color("#1b2027").lerp(new THREE.Color("#0f1c26"), wetness)}
          roughness={0.95 - wetness * 0.8}
          metalness={wetness * 0.5}
        />
      </mesh>
      {/* edge lines */}
      {[-2.45, 2.45].map((z) => (
        <mesh key={z} position={[8, 0.01, z]}>
          <boxGeometry args={[70, 0.01, 0.08]} />
          <meshStandardMaterial color="#d9dee5" emissive="#d9dee5" emissiveIntensity={0.15} />
        </mesh>
      ))}
      {/* centre dashes (scroll to show motion) */}
      <group ref={dashes}>
        {Array.from({ length: 24 }, (_, i) => (
          <mesh key={i} position={[-26 + i * 3, 0.012, 0]}>
            <boxGeometry args={[1.4, 0.01, 0.12]} />
            <meshStandardMaterial color="#f2c14e" emissive="#f2c14e" emissiveIntensity={0.25} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function BrakingZone({ distanceRef, statusColor, distance }: {
  distanceRef: MutableRefObject<number>;
  statusColor: THREE.Color;
  distance: number;
}) {
  // Unit-length zone (x from 0 to 1) stretched along the road by scale.x.
  const zone = useRef<THREE.Group>(null);
  const len = useRef(1);

  useFrame((_, dt) => {
    const target = THREE.MathUtils.clamp(distanceRef.current * M, 0.05, 34);
    len.current = damp(len.current, target, 5, dt);
    if (zone.current) zone.current.scale.x = len.current;
  });

  const limitX = TRUCK_FRONT + MAX_BRAKING_DISTANCE * M;
  const labelX = TRUCK_FRONT + THREE.MathUtils.clamp(distance * M, 0.05, 34);

  return (
    <group>
      <group ref={zone} position={[TRUCK_FRONT, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.02, 0]}>
          <planeGeometry args={[1, 4.7]} />
          <meshBasicMaterial color={statusColor} transparent opacity={0.35} depthWrite={false} toneMapped={false} />
        </mesh>
        {/* glowing side rails */}
        {[-2.35, 2.35].map((z) => (
          <mesh key={z} position={[0.5, 0.05, z]}>
            <boxGeometry args={[1, 0.06, 0.1]} />
            <meshBasicMaterial color={statusColor} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* 50 m stopping limit gate */}
      <group position={[limitX, 0, 0]}>
        {[-2.6, 2.6].map((z) => (
          <mesh key={z} position={[0, 1.1, z]} castShadow>
            <boxGeometry args={[0.12, 2.2, 0.12]} />
            <meshStandardMaterial color="#2a313b" />
          </mesh>
        ))}
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[0.12, 0.12, 5.32]} />
          <meshStandardMaterial color={COLORS.critical} emissive={COLORS.critical} emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        <Html position={[0, 2.75, 0]} center distanceFactor={22} zIndexRange={[10, 0]}>
          <div className="whitespace-nowrap rounded bg-destructive/90 px-1.5 py-0.5 text-[10px] font-mono font-bold text-destructive-foreground">
            {MAX_BRAKING_DISTANCE} m LIMIT
          </div>
        </Html>
      </group>
      <Html position={[labelX, 0.4, 0]} center distanceFactor={22} zIndexRange={[10, 0]}>
        <div className="whitespace-nowrap rounded border border-border bg-background/85 px-1.5 py-0.5 text-[10px] font-mono text-foreground backdrop-blur">
          stops in {distance.toFixed(0)} m
        </div>
      </Html>
    </group>
  );
}

function World(props: TruckSceneProps) {
  const world = useRef<THREE.Group>(null);
  const speedRef = useRef(props.speed);
  const loadRef = useRef(props.load);
  const distanceRef = useRef(props.brakingDistance);
  speedRef.current = props.speed;
  loadRef.current = props.load;
  distanceRef.current = props.brakingDistance;

  const statusColor = COLORS[props.status] ?? COLORS.safe;
  const targetTilt = -THREE.MathUtils.degToRad(THREE.MathUtils.clamp(props.slope, -30, 30));

  useFrame((_, dt) => {
    if (world.current) world.current.rotation.z = damp(world.current.rotation.z, targetTilt, 3, dt);
  });

  return (
    <group ref={world}>
      <Road speedRef={speedRef} grip={props.grip} />
      <Truck speedRef={speedRef} loadRef={loadRef} statusColor={statusColor} />
      <BrakingZone distanceRef={distanceRef} statusColor={statusColor} distance={props.brakingDistance} />
      <Grid
        position={[8, -0.11, 0]}
        args={[90, 40]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1e3a40"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#1f6f78"
        fadeDistance={45}
        fadeStrength={1.5}
      />
    </group>
  );
}

export default function TruckScene3D(props: TruckSceneProps) {
  const reduce = useMemo(prefersReducedMotion, []);
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop={props.active === false ? "never" : "always"}
      camera={{ position: [7, 6.5, 23], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      aria-label="3D view of the vehicle on the current road gradient"
    >
      <fog attach="fog" args={[COLORS.bg, 22, 48]} />
      <hemisphereLight args={["#bde8ff", "#0b0f14", 0.6]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[6, 12, 6]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={20}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <World {...props} />
      <OrbitControls
        target={[9.5, 1, 0]}
        enablePan={false}
        minDistance={8}
        maxDistance={32}
        maxPolarAngle={Math.PI / 2.15}
        autoRotate={props.autoRotate && !reduce}
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
}
