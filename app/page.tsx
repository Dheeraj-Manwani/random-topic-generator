"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import AppMenu from "./components/app-menu";
import TopicLibrary from "./components/topic-library";
import FilterSelect from "./components/filter-select";
import PreparationModal from "./components/preparation-modal";
import GoldenLights from "./components/golden-lights";
import { categories, challenges, selectChallenge, selectTopic, topics, type Topic } from "@/lib/topics";

import { spinTiming } from "@/lib/spin-timing";
import { ArcadeAudio } from "@/lib/arcade-audio";

type Round = { topic: Topic; challenge: string };
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    mic: <><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z"/>,
    sound: <><path d="m11 4-6 5H2v6h3l6 5V4ZM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/></>,
    music: <><path d="M9 18V5l12-3v13M9 8l12-3"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="18" cy="15" rx="3" ry="2"/></>,
    mute: <><path d="m11 4-6 5H2v6h3l6 5V4ZM16 9l6 6M22 9l-6 6"/></>,
    shuffle: <><path d="m17 3 4 4-4 4M3 17l5-5m4-4 2-1h7M3 7h3l9 10h6m-4-4 4 4-4 4"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    reset: <><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.mic}</svg>;
}
function Bulbs({ count = 11, reverse = false }: { count?: number; reverse?: boolean }) {
  return <div className="bulbs" aria-hidden="true">{Array.from({ length: count }, (_, i) =>
    <span className="bulb-socket" key={i} style={{ "--phase": (reverse ? count - i : i) % 2 } as CSSProperties}>
      <span className="bulb-glass"><span className="bulb-filament"/></span>
    </span>
  )}</div>;
}

export default function Home() {
  const [category, setCategory] = useState("All categories");
  const [difficulty, setDifficulty] = useState("All levels");
  const [challenge, setChallenge] = useState("None");
  const [preparing, setPreparing] = useState(false);
  const [sound, setSound] = useState(true);
  const [music, setMusic] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [round, setRound] = useState<Round | null>(null);
  const [history, setHistory] = useState<Round[]>([]);
  const [saved, setSaved] = useState<Round[]>([]);
  const [notice, setNotice] = useState("");
  const [view, setView] = useState<"arcade" | "saved">("arcade");
  const [spinTopics, setSpinTopics] = useState<Topic[]>([]);
  const spinLock = useRef(false);
  const seen = useRef<string[]>([]);
  const spinSound = useRef<HTMLAudioElement | null>(null);
  const spinStrip = useRef<HTMLDivElement | null>(null);
  const spinFrame = useRef(0);
  const spinRun = useRef(0);
  const preferences = useRef({ music: true, sound: true });
  const audio = useRef<ArcadeAudio | null>(null);
  const dragY = useRef<number | null>(null);
  const pool = topics.filter(t => (category === "All categories" || t.category === category) && (difficulty === "All levels" || t.difficulty === difficulty));
  const currentChallenge = challenges.find(c => c.name === round?.challenge);
  const isSaved = !!round && saved.some(s => s.topic.id === round.topic.id && s.challenge === round.challenge);

  useEffect(() => {
    const recording = new Audio("/spin-sound.m4a");
    recording.preload = "auto";
    recording.load();
    spinSound.current = recording;
    try { const parsed: unknown = JSON.parse(localStorage.getItem("speak-easy-saved") || "[]");
      if (Array.isArray(parsed)) { const valid = parsed.flatMap((r: Round) => { const topic = topics.find(t => t.id === r?.topic?.id); return topic && (r.challenge === "None" || challenges.some(c => c.name === r.challenge)) ? [{topic, challenge:r.challenge}] : []; });
        queueMicrotask(() => setSaved(valid)); }
    } catch { /* Storage is optional. */ }
    try { localStorage.removeItem("speak-easy-excluded-challenges"); } catch { /* Storage is optional. */ }
    return () => { cancelAnimationFrame(spinFrame.current); recording.pause(); recording.removeAttribute("src"); recording.load(); spinSound.current = null; audio.current?.dispose(); audio.current = null; };
  }, []);
  const ensureAudio = useCallback(() => {
    if (!audio.current) {
      const engine = new ArcadeAudio();
      engine.setMusic(preferences.current.music);
      engine.setSound(preferences.current.sound);
      audio.current = engine;
    }
    audio.current.resume();
    return audio.current;
  }, []);
  useEffect(() => {
    try { ensureAudio(); } catch { /* Autoplay may require a user gesture. */ }
    const activate = () => {
      try { ensureAudio(); } catch { /* Retry on the next explicit audio action. */ }
      document.removeEventListener("pointerdown", activate, true);
      document.removeEventListener("keydown", activate, true);
    };
    document.addEventListener("pointerdown", activate, true);
    document.addEventListener("keydown", activate, true);
    return () => {
      document.removeEventListener("pointerdown", activate, true);
      document.removeEventListener("keydown", activate, true);
    };
  }, [ensureAudio]);
  function toggleAudio(channel: "music" | "sound") {
    const enabled = !preferences.current[channel];
    preferences.current[channel] = enabled;
    if (channel === "music") setMusic(enabled); else setSound(enabled);
    if (spinSound.current) spinSound.current.muted = !preferences.current.sound;
    try {
      const engine = ensureAudio();
      if (channel === "music") engine.setMusic(enabled); else engine.setSound(enabled);
    } catch { setNotice("Audio isn’t available in this browser."); }
  }
  const spin = useCallback(() => {
    if (spinLock.current) return;
    const next = selectTopic(pool, [...seen.current, ...(round ? [round.topic.id] : [])]); if (!next) return;
    const nextChallenge = selectChallenge(challenge, []); if (!nextChallenge) return;
    spinLock.current = true; setSpinning(true); setNotice("");
    const run = ++spinRun.current;
    try { ensureAudio(); } catch { /* The recorded spin and silent fallback still work. */ }
    const recording = spinSound.current;
    if (recording) { recording.pause(); recording.currentTime = 0; recording.muted = !preferences.current.sound; }
    setSpinTopics([...(round ? [round.topic] : []), ...Array.from({length: 40}, () => pool[Math.floor(Math.random() * pool.length)]), next]);
    function begin(useRecording: boolean) {
      if (run !== spinRun.current || recording !== spinSound.current) return;
      const startedAt = performance.now();
      let fallbackStart: number | null = null;
      function frame() {
        if (run !== spinRun.current || recording !== spinSound.current) return;
        // Media time keeps the reel in sync even when playback buffers or the tab is hidden.
        if (useRecording && recording?.error && fallbackStart === null) fallbackStart = performance.now() - recording.currentTime * 1000;
        const elapsed = fallbackStart !== null ? performance.now() - fallbackStart : useRecording && recording ? recording.currentTime * 1000 : performance.now() - startedAt;
        const timing = spinTiming(elapsed);
        spinStrip.current?.style.setProperty("--spin-progress", String(timing.progress));
        if (!timing.complete) { spinFrame.current = requestAnimationFrame(frame); return; }
        seen.current.push(next!.id); if (seen.current.length > topics.length) seen.current = [next!.id];
        if (round) setHistory(prev => [round, ...prev].slice(0, 9));
        setRound({topic: next!, challenge: nextChallenge!});
        setSpinning(false); setPreparing(true); spinLock.current = false;
        // The supplied recording already includes the final-selection sound; let its tail finish.
      }
      spinFrame.current = requestAnimationFrame(frame);
    }
    if (recording) void recording.play().then(() => begin(true)).catch(() => begin(false));
    else begin(false);
  }, [pool, round, challenge, ensureAudio]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { const el = e.target as HTMLElement; if (!e.defaultPrevented && !el.closest('[role="listbox"], [role="option"], [role="combobox"]') && e.code === "Space" && !document.querySelector("dialog[open]") && !["BUTTON", "INPUT", "SELECT", "TEXTAREA", "A", "SUMMARY"].includes(el.tagName) && !el.isContentEditable && view === "arcade") { e.preventDefault(); spin(); } }
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [spin, view]);
  function toggleSave() { if (!round) return; const next = isSaved ? saved.filter(s => !(s.topic.id === round.topic.id && s.challenge === round.challenge)) : [round, ...saved]; setSaved(next); try {localStorage.setItem("speak-easy-saved", JSON.stringify(next));} catch {setNotice("Saved for this visit. Browser storage is unavailable.");} }
  function chooseRound(r: Round) { const allowedChallenge = selectChallenge(r.challenge, []); if (!allowedChallenge) return; setRound({...r, challenge: allowedChallenge}); setPreparing(true); setView("arcade"); setNotice(""); }
  return (
    <div className="app-shell">
      <AppMenu view={view} savedCount={saved.length} music={music} sound={sound} disabled={spinning} onNavigate={setView} onAudio={toggleAudio}/>
      <GoldenLights/>
      {preparing && round && <PreparationModal topic={round.topic} challenge={round.challenge} saved={isSaved} onSave={toggleSave} onDismiss={() => setPreparing(false)}/>}
      <main>
        {view === "arcade" ? <>
        <div className={`arcade-layout ${spinning ? "round-in-motion" : ""}`}><div className="arcade-sparkles" aria-hidden="true"><span>✧</span><span>✦</span><span>✧</span><span>✦</span></div>
          <section className={`machine ${spinning ? "is-spinning" : ""}`} aria-label="Speaking topic slot machine" aria-busy={spinning}>
            <div className="machine-top"><Bulbs/><div className="marquee"><span>★</span><h1>Topic Spin</h1><span>★</span></div><Bulbs reverse/></div>
            <div className="machine-body"><div className="machine-stamp"><span>EST. 2026</span><span>GOOD TOPICS. GREAT STORIES.</span><span>№ 001</span></div>
              <div className="result-window"><div className="topic-meta"><span>{spinning ? "FINDING YOUR NEXT BIG IDEA" : round ? `${categories.find(c => c.name === round.topic.category)?.icon}  ${round.topic.category}` : "READY WHEN YOU ARE"}</span><span className="level">{spinning ? "•••" : round?.topic.difficulty || "—"}</span></div>
                <div className="topic-viewport">
                  {spinning ? <div ref={spinStrip} className="topic-strip" aria-hidden="true" style={{ "--stops": spinTopics.length - 1 } as CSSProperties}>
                    {spinTopics.map((topic, i) => <div className="topic-row" key={i}><h3>{topic.text}.</h3></div>)}
                  </div> : <div className="topic-text">{round ? <h3>{round.topic.text}.</h3> : <span className="empty-topic-hint">Pull the lever to begin</span>}</div>}
                </div>
                <span className="sr-only" role="status" aria-live="polite">{spinning ? "Spinning topics" : round ? round.topic.text + ". " + round.challenge : "No topic selected. Spin to begin."}</span>
                <div className="challenge-label">{spinning ? "✦  The possibilities are spinning" : round?.challenge === "None" ? "No challenge" : round && currentChallenge ? `${currentChallenge.icon}  ${round.challenge}` : "✦  Your next topic is one spin away"}</div>
              </div>
              <div className="machine-controls"><span className="speaker-grille" aria-hidden="true"/><button className="spin-button" onClick={spin} disabled={spinning || !pool.length}>{spinning ? "Spinning…" : "Spin my topic"}</button><span className="speaker-grille" aria-hidden="true"/></div>
              <div className="machine-bottom-label"><span>NO COINS. JUST CURIOSITY.</span><span>∞ FREE PLAYS</span></div>
            </div>
            <button className="lever" aria-label="Pull lever to generate a random topic" disabled={spinning} onClick={spin} onPointerCancel={() => {dragY.current = null;}} onPointerDown={e => {dragY.current = e.clientY;e.currentTarget.setPointerCapture(e.pointerId);}} onPointerUp={e => {if (dragY.current !== null && e.clientY - dragY.current > 20) spin();dragY.current = null;}}><span className="lever-base"/><span className="lever-arm"><span className="lever-ball"/></span></button>
            <div className="machine-foot"/>
          </section>
          <aside className="pull-note"><span>Go on,<br/><em>give it a pull.</em></span><svg width="60" height="75" viewBox="0 0 60 75" fill="none" aria-hidden="true"><path d="M44 2C60 39 39 55 13 48m0 0 13-7M13 48l9 13" stroke="currentColor" strokeWidth="1.5"/></svg></aside>
        </div>
        <div className="under-machine"><span>Or press <kbd>space</kbd> to spin</span></div>

        <section className="filters below-machine" aria-label="Topic filters">
          <div className="filter-field"><span>CATEGORY</span><FilterSelect label="Category" value={category} onChange={setCategory} disabled={spinning} options={[{value:"All categories",icon:"◎"},...categories.map(c => ({value:c.name,icon:c.icon}))]}/></div>
          <div className="filter-field"><span>YOUR CHALLENGE</span><FilterSelect label="Your challenge" value={challenge} onChange={setChallenge} disabled={spinning} options={[{value:"None"},{value:"Surprise me",icon:"✧"},...challenges.map(c => ({value:c.name,icon:c.icon}))]}/></div>
          <div className="filter-field"><span>DIFFICULTY</span><FilterSelect label="Difficulty" value={difficulty} onChange={setDifficulty} disabled={spinning} options={[{value:"All levels"},{value:"Easy"},{value:"Medium"},{value:"Hard"}]}/></div>
          <button className="filter-reset" title="Reset filters" aria-label="Reset filters" disabled={spinning} onClick={() => {setCategory("All categories");setChallenge("None");setDifficulty("All levels");}}><Icon name="reset" size={18}/></button>
        </section>
        <TopicLibrary disabled={spinning} onSelect={topic => chooseRound({topic, challenge})}/>
        <div className="notice" role="status">{notice}</div>
        {history.length > 0 && <section className="history"><div className="section-label">YOUR RECENT SPINS <span>{history.length}</span></div><div className="history-grid">{history.slice(0,3).map((r,i) => <button disabled={spinning} key={`${r.topic.id}-${i}`} onClick={() => chooseRound(r)}><small>{r.topic.category}</small><span>{r.topic.text}</span><Icon name="arrow" size={16}/></button>)}</div></section>}
        </> : <section className="saved-panel"><button className="saved-back" onClick={() => setView("arcade")}>← Back to Topic Spin</button><span className="section-label">THE KEEPERS</span><h2>Your conversation collection.</h2><p>Saved on this browser, ready for another round.</p>{saved.length ? <div className="saved-grid">{saved.map(r => <button key={r.topic.id+r.challenge} onClick={() => chooseRound(r)}><small>{r.topic.category} · {r.challenge}</small><h3>{r.topic.text}</h3><span>Practice this topic →</span></button>)}</div> : <div className="empty-saved"><Icon name="bookmark" size={32}/><h3>A good topic is worth keeping.</h3><p>Save a topic from the arcade and it will be waiting here.</p><button className="start-button" onClick={() => setView("arcade")}>Back to the arcade →</button></div>}</section>}
      </main>
      <footer><span className="footer-brand">speak<em>easy</em> ✦</span><p>A playground for your voice. No perfect speeches required.</p><span>{topics.length} topics · 8 ways to play</span></footer>
    </div>
  );
}


