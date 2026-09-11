"use client";

import { useEffect, useRef, useState } from "react";
import type { Topic } from "@/lib/topics";

const PREP_TIME = 120_000;

type Props = {
  topic: Topic;
  challenge: string;
  saved: boolean;
  onSave: () => void;
  onDismiss: () => void;
};

export default function PreparationModal({ topic, challenge, saved, onSave, onDismiss }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const deadline = useRef(0);
  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState(PREP_TIME);
  const finished = started && remaining === 0;
  const seconds = Math.ceil(remaining / 1000);

  useEffect(() => {
    const node = dialog.current;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    if (!started || finished) return;
    function update() { setRemaining(Math.max(0, deadline.current - Date.now())); }
    const interval = setInterval(update, 100);
    document.addEventListener("visibilitychange", update);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", update); };
  }, [started, finished]);

  function start() {
    deadline.current = Date.now() + PREP_TIME;
    setRemaining(PREP_TIME);
    setStarted(true);
  }

  return <dialog ref={dialog} className="preparation-modal" aria-labelledby="prep-title" aria-describedby="prep-description" onCancel={event => {event.preventDefault(); onDismiss();}}>
    <button className="library-close prep-close" aria-label="Close preparation" onClick={onDismiss}>×</button>
    <p className="prep-eyebrow">{topic.category}{challenge !== "None" && ` · ${challenge}`}</p>
    <h2 id="prep-title">{topic.text}.</h2>
    <p id="prep-description">{finished ? "Preparation complete. You’re ready to speak." : started ? "Find your opening, choose your points, and take a breath." : "Take a moment to gather your thoughts before you speak."}</p>
    {started ? <>
      <div className={`prep-countdown ${finished ? "complete" : ""}`} role="timer" aria-label={`${Math.floor(seconds / 60)} minutes ${seconds % 60} seconds of preparation remaining`}>
        <svg viewBox="0 0 220 220" aria-hidden="true"><circle className="prep-ring-track" cx="110" cy="110" r="96"/><circle className="prep-ring-progress" cx="110" cy="110" r="96" pathLength="100" strokeDasharray="100" strokeDashoffset={100 * (1 - remaining / PREP_TIME)}/></svg>
        <div><strong>{Math.floor(seconds / 60).toString().padStart(2,"0")}:{(seconds % 60).toString().padStart(2,"0")}</strong><span>{finished ? "READY TO SPEAK" : "PREPARATION TIME"}</span></div>
      </div>
      <p className="sr-only" role="status">{finished ? "Your two minutes are up. Preparation complete." : "Two-minute preparation timer started."}</p>
      {finished && <button className="prep-primary" onClick={onDismiss}>I’m ready</button>}
    </> : <button className="prep-primary" onClick={start}>Prepare for 2 minutes</button>}
    <div className="prep-secondary"><button onClick={onSave}>{saved ? "Topic saved ✓" : "Save topic"}</button>{started && <button onClick={start}>Restart preparation</button>}</div>
  </dialog>;
}
