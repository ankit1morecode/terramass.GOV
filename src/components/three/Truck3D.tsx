import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from "react";
import { Box } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TruckSceneProps } from "./TruckScene3D";

// three.js (~600 kB) is only downloaded when a 3D view actually scrolls into view.
const TruckScene3D = lazy(() => import("./TruckScene3D"));

class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Placeholder text="3D view unavailable on this device" /> : this.props.children;
  }
}

const Placeholder = ({ text, pulse }: { text: string; pulse?: boolean }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
    <Box className={cn("h-6 w-6 text-primary/60", pulse && "animate-pulse")} />
    {text}
  </div>
);

type Truck3DProps = Omit<TruckSceneProps, "active"> & { className?: string };

/** Lazy, viewport-aware 3D truck scene. Renders only while visible. */
export const Truck3D = ({ className, ...scene }: Truck3DProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      {mounted ? (
        <WebGLBoundary>
          <Suspense fallback={<Placeholder text="Loading 3D view…" pulse />}>
            <TruckScene3D {...scene} active={visible} />
          </Suspense>
        </WebGLBoundary>
      ) : (
        <Placeholder text="Loading 3D view…" pulse />
      )}
    </div>
  );
};
