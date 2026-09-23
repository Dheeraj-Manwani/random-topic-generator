"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Topic } from "@/lib/topics";

const PREP_TIME = 120_000;
type Stage = "prepare" | "speak" | "reflect";
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
  const [feeling, setFeeling] = useState("");
  const [note, setNote] = useState("");
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  const [previousReflection, setPreviousReflection] = useState("");
  const soundRef = useRef(onFinishSound);
  useEffect(() => { soundRef.current = onFinishSound; }, [onFinishSound]);
  const seconds = Math.ceil(remaining / 1000);
  const total = stage === "prepare" ? PREP_TIME : duration;

  useEffect(() => {
    const node = dialog.current;
    const overflow = document.body.style.overflow;
    const focus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node?.showModal(); document.body.style.overflow = "hidden";
    try {
      const entries: unknown = JSON.parse(localStorage.getItem("topic-spin-reflections") || "[]");
      const previous = Array.isArray(entries) ? entries.find(entry => entry?.topicId === topic.id && entry?.challenge === challenge) : null;
      if (previous && typeof previous.note === "string" && typeof previous.feeling === "string") queueMicrotask(() => setPreviousReflection([previous.feeling, previous.note].filter(Boolean).join(" — ")));
    } catch { /* Practice works without storage. */ }
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
        if (stage === "speak") setStage("reflect");
      }
    }
    const interval = setInterval(update, 100);
    document.addEventListener("visibilitychange", update);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", update); };
  }, [running, stage]);

  function start(time: number) { deadline.current = Date.now() + time; setRemaining(time); setStarted(true); setRunning(true); }
  function speak() { setStage("speak"); start(duration); }
  function pause() { setRemaining(Math.max(0, deadline.current - Date.now())); setRunning(false); }
  function retry() { setStage("prepare"); setRunning(false); setStarted(false); setRemaining(PREP_TIME); setFeeling(""); setNote(""); setReflectionSaved(false); setStorageMessage(""); }
  function saveReflection() {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem("topic-spin-reflections") || "[]");
      const entries = Array.isArray(parsed) ? parsed : [];
      localStorage.setItem("topic-spin-reflections", JSON.stringify([{topicId: topic.id, challenge, feeling, note: note.trim(), date: new Date().toISOString()}, ...entries].slice(0, 100)));
      setPreviousReflection([feeling, note.trim()].filter(Boolean).join(" — "));
      setReflectionSaved(true); setStorageMessage("Reflection saved on this browser.");
    } catch { setStorageMessage("Browser storage is unavailable. Your reflection is here until you close this round."); }
  }

  return <dialog ref={dialog} className="preparation-modal" aria-labelledby="prep-title" aria-describedby="prep-description" onCancel={event => {event.preventDefault(); onDismiss();}}>
    <button className="library-close prep-close" aria-label="Close practice round" onClick={onDismiss}>×</button>
    <ol className="round-steps" aria-label="Practice progress">{(["prepare", "speak", "reflect"] as Stage[]).map((step, index) => <li key={step} aria-current={stage === step ? "step" : undefined}><span>{index + 1}</span>{step}</li>)}</ol>
    <p className="prep-eyebrow">{topic.category}{challenge !== "None" && ` · ${challenge}`}</p>
    <h2 id="prep-title">{topic.text}.</h2>
    <p id="prep-description" role="status">{stage === "reflect" ? "You showed up and gave your thoughts a voice. That counts." : stage === "speak" ? running ? "The floor is yours. One thought at a time." : "Take a breath. Continue when you’re ready." : remaining === 0 ? "Preparation complete. Start speaking when you’re ready." : started ? "Find your opening, choose your points, and take a breath." : "A little preparation. A little courage. Your next practice round."}</p>
    {stage !== "reflect" && <>
      {(started || stage === "speak") && <div className={`prep-countdown ${remaining === 0 ? "complete" : ""}`} role="timer" aria-label={`${seconds} seconds of ${stage === "prepare" ? "preparation" : "speaking"} remaining`}>
        <svg viewBox="0 0 220 220" aria-hidden="true"><circle className="prep-ring-track" cx="110" cy="110" r="96"/><circle className="prep-ring-progress" cx="110" cy="110" r="96" pathLength="100" strokeDasharray="100" strokeDashoffset={100 * (1 - remaining / total)}/></svg>
        <div><strong>{Math.floor(seconds / 60).toString().padStart(2,"0")}:{(seconds % 60).toString().padStart(2,"0")}</strong><span>{remaining === 0 ? "READY TO SPEAK" : stage === "prepare" ? "PREPARATION" : running ? "YOUR TIME TO SPEAK" : "PAUSED"}</span></div>
      </div>}
      {stage === "prepare" ? <>
        {previousReflection && <p className="previous-reflection"><strong>From your last practice</strong>{previousReflection}</p>}
        <fieldset className="speaking-duration"><legend>Speaking time</legend>{[1,2,3,5].map(minutes => <button type="button" key={minutes} aria-pressed={duration === minutes * 60000} onClick={() => setDuration(minutes * 60000)}>{minutes} min</button>)}</fieldset>
        <div className="round-actions">{!started && <button className="prep-primary" onClick={() => start(PREP_TIME)}>Prepare for 2 minutes</button>}<button className={started ? "prep-primary" : "round-quiet"} onClick={speak}>{started ? "Start speaking" : "Skip prep & speak"}</button></div>
      </> : <div className="round-actions"><button className="prep-primary" onClick={() => running ? pause() : start(remaining)}>{running ? "Pause" : "Resume"}</button><button className="round-quiet" onClick={() => {setRunning(false); setStage("reflect");}}>Finish speaking</button></div>}
    </>}
    {stage === "reflect" && <section className="round-reflection" aria-label="Round reflection">
      <Image className="round-snail" src="/crawling-thoughts.png" alt="" width={54} height={54} unoptimized/>
      <h3>One small step. One stronger voice.</h3>
      <fieldset><legend>How did that feel?</legend><div className="feeling-options">{["Finding my feet", "Getting there", "Felt good"].map(value => <button key={value} aria-pressed={feeling === value} onClick={() => {setFeeling(value); setReflectionSaved(false);}}>{value}</button>)}</div></fieldset>
      <label className="reflection-note">One thing to try next time <span>(optional)</span><textarea maxLength={600} rows={2} value={note} onChange={event => {setNote(event.target.value); setReflectionSaved(false);}} placeholder="Pause more, open with a story…"/></label>
      <button className="round-quiet" disabled={(!feeling && !note.trim()) || reflectionSaved} onClick={saveReflection}>{reflectionSaved ? "Reflection saved ✓" : "Save reflection"}</button>
      <p className="reflection-status" role="status">{storageMessage}</p>
      <div className="round-actions"><button className="prep-primary" onClick={onNewTopic}>New topic</button><button className="round-quiet" onClick={retry}>Try again</button></div>
    </section>}
    <div className="prep-secondary"><button onClick={onSave}>{saved ? "Topic saved ✓" : "Save topic"}</button>{stage === "prepare" && started && <button onClick={() => start(PREP_TIME)}>Restart preparation</button>}</div>
  </dialog>;
}
