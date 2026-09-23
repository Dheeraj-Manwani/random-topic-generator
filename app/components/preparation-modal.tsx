"use client";

import { useEffect, useRef, useState } from "react";
import type { Topic } from "@/lib/topics";

const PREP_TIME = 120_000;
type Stage = "prepare" | "speak" | "complete";
type Props = {
  topic: Topic; challenge: string; saved: boolean;
  onSave: () => void; onDismiss: () => void; onNewTopic: () => void;
  onFinishSound: () => void;
};

export default function PreparationModal({ topic, challenge, saved, onSave, onDismiss, onNewTopic, onFinishSound }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const deadline = useRef(0);
  const [stage, setStage] = useState<Stage>("prepare");
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [duration, setDuration] = useState(120_000);
  const [remaining, setRemaining] = useState(PREP_TIME);
  const soundRef = useRef(onFinishSound);
  useEffect(() => { soundRef.current = onFinishSound; }, [onFinishSound]);
  const seconds = Math.ceil(remaining / 1000);
  const total = stage === "prepare" ? PREP_TIME : duration;

  useEffect(() => {
    const node = dialog.current;
    const overflow = document.body.style.overflow;
    const focus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node?.showModal(); document.body.style.overflow = "hidden";
    return () => { node?.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, [topic.id, challenge]);

  useEffect(() => {
    if (!running) return;
    let completed = false;
    function update() {
      if (completed) return;
      const left = Math.max(0, deadline.current - Date.now());
      setRemaining(left);
      if (left === 0) {
        completed = true; setRunning(false); soundRef.current();
        if (stage === "speak") setStage("complete");
      }
    }
    const interval = setInterval(update, 100);
    document.addEventListener("visibilitychange", update);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", update); };
  }, [running, stage]);

  function start(time: number) { deadline.current = Date.now() + time; setRemaining(time); setStarted(true); setRunning(true); }
  function speak() { setStage("speak"); start(duration); }
  function pause() { setRemaining(Math.max(0, deadline.current - Date.now())); setRunning(false); }
  function retry() { setStage("prepare"); setRunning(false); setStarted(false); setRemaining(PREP_TIME); }

  return <dialog ref={dialog} className="preparation-modal" aria-labelledby="prep-title" aria-describedby="prep-description" onCancel={event => {event.preventDefault(); onDismiss();}}>
    <button className="library-close prep-close" aria-label="Close practice round" onClick={onDismiss}>×</button>
    {stage !== "complete" && <ol className="round-steps" aria-label="Practice progress">{(["prepare", "speak"] as Stage[]).map((step, index) => <li key={step} aria-current={stage === step ? "step" : undefined}><span>{index + 1}</span>{step}</li>)}</ol>}
    <p className="prep-eyebrow">{stage === "complete" ? "ROUND COMPLETE" : <>{topic.category}{challenge !== "None" && ` · ${challenge}`}</>}</p>
    <h2 id="prep-title">{stage === "complete" ? "Hope you had a good time!" : `${topic.text}.`}</h2>
    <p id="prep-description" role="status">{stage === "complete" ? "Thanks for sharing a little of your mind. Come back for another spin anytime." : stage === "speak" ? running ? "The floor is yours. One thought at a time." : "Take a breath. Continue when you’re ready." : remaining === 0 ? "Preparation complete. Start speaking when you’re ready." : started ? "Find your opening, choose your points, and take a breath." : "A little preparation. A little courage. Your next practice round."}</p>
    {stage !== "complete" && <>
      {(started || stage === "speak") && <div className={`prep-countdown ${remaining === 0 ? "complete" : ""}`} role="timer" aria-label={`${seconds} seconds of ${stage === "prepare" ? "preparation" : "speaking"} remaining`}>
        <svg viewBox="0 0 220 220" aria-hidden="true"><circle className="prep-ring-track" cx="110" cy="110" r="96"/><circle className="prep-ring-progress" cx="110" cy="110" r="96" pathLength="100" strokeDasharray="100" strokeDashoffset={100 * (1 - remaining / total)}/></svg>
        <div><strong>{Math.floor(seconds / 60).toString().padStart(2,"0")}:{(seconds % 60).toString().padStart(2,"0")}</strong><span>{remaining === 0 ? "READY TO SPEAK" : stage === "prepare" ? "PREPARATION" : running ? "YOUR TIME TO SPEAK" : "PAUSED"}</span></div>
      </div>}
      {stage === "prepare" ? <>
        <fieldset className="speaking-duration"><legend>Speaking time</legend>{[1,2,3,5].map(minutes => <button type="button" key={minutes} aria-pressed={duration === minutes * 60000} onClick={() => setDuration(minutes * 60000)}>{minutes} min</button>)}</fieldset>
        <div className="round-actions">{!started && <button className="prep-primary" onClick={() => start(PREP_TIME)}>Prepare for 2 minutes</button>}<button className={started ? "prep-primary" : "round-quiet"} onClick={speak}>{started ? "Start speaking" : "Skip prep & speak"}</button></div>
      </> : <div className="round-actions"><button className="prep-primary" onClick={() => running ? pause() : start(remaining)}>{running ? "Pause" : "Resume"}</button><button className="round-quiet" onClick={() => {setRunning(false); setStage("complete");}}>Finish speaking</button></div>}
    </>}
    {stage === "complete" && <section className="round-complete" aria-label="Practice complete">
      <p>Find us on Instagram</p>
      <a className="completion-instagram" href="https://www.instagram.com/crawling.thoughts/" target="_blank" rel="noopener noreferrer">@crawling.thoughts ↗</a>
      <div className="round-actions"><button className="prep-primary" onClick={onNewTopic}>New topic</button><button className="round-quiet" onClick={retry}>Try again</button></div>
    </section>}
    <div className="prep-secondary"><button onClick={onSave}>{saved ? "Topic saved ✓" : "Save topic"}</button>{stage === "prepare" && started && <button onClick={() => start(PREP_TIME)}>Restart preparation</button>}</div>
  </dialog>;
}
