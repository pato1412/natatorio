import { useEffect, useState, useRef, useCallback } from "react";

export function useStopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  const tick = useCallback(() => {
    setElapsed(Date.now() - startRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = () => {
    if (running) return;
    startRef.current = Date.now() - elapsed;
    setRunning(true);
    rafRef.current = requestAnimationFrame(tick);
  };
  const stop = () => {
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };
  const reset = () => {
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setElapsed(0);
  };
  useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), []);
  return { elapsed, running, start, stop, reset };
}
