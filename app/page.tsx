"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { categories, challenges, selectTopic, topics, type Topic } from "@/lib/topics";

type Round = { topic: Topic; challenge: string };
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    mic: <><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z"/>,
    sound: <><path d="m11 4-6 5H2v6h3l6 5V4ZM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/></>,
    mute: <><path d="m11 4-6 5H2v6h3l6 5V4ZM16 9l6 6M22 9l-6 6"/></>,
    shuffle: <><path d="m17 3 4 4-4 4M3 17l5-5m4-4 2-1h7M3 7h3l9 10h6m-4-4 4 4-4 4"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    reset: <><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.mic}</svg>;
}
function Bulbs({ count = 13 }: { count?: number }) { return <div className="bulbs" aria-hidden="true">{Array.from({ length: count }, (_, i) => <i key={i} style={{ animationDelay: `${i % 3 * .7}s` }} />)}</div>; }

export default function Home() {
  const [category, setCategory] = useState("All categories");
  const [difficulty, setDifficulty] = useState("All levels");
  const [challenge, setChallenge] = useState("Surprise me");
  const [duration, setDuration] = useState(120);
  const [remaining, setRemaining] = useState(120);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [round, setRound] = useState<Round>({ topic: topics.find(t => t.subject === "whether boredom is useful")!, challenge: "Free speak" });
  const [history, setHistory] = useState<Round[]>([]);
  const [saved, setSaved] = useState<Round[]>([]);
  const [notice, setNotice] = useState("");
  const [view, setView] = useState<"arcade" | "saved">("arcade");
  const [showHelp, setShowHelp] = useState(false);
  const [reel, setReel] = useState(0);
  const spinLock = useRef(false);
  const seen = useRef<string[]>([]);
  const handles = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audio = useRef<AudioContext | null>(null);
  const deadline = useRef(0);
  const dragY = useRef<number | null>(null);
  const pool = topics.filter(t => (category === "All categories" || t.category === category) && (difficulty === "All levels" || t.difficulty === difficulty));
  const currentChallenge = challenges.find(c => c.name === round.challenge)!;
  const isSaved = saved.some(s => s.topic.id === round.topic.id && s.challenge === round.challenge);

  useEffect(() => {
    const activeHandles = handles.current;
    try { const parsed: unknown = JSON.parse(localStorage.getItem("speak-easy-saved") || "[]");
      if (Array.isArray(parsed)) { const valid = parsed.flatMap((r: Round) => { const topic = topics.find(t => t.id === r?.topic?.id); return topic && challenges.some(c => c.name === r.challenge) ? [{topic, challenge:r.challenge}] : []; });
        queueMicrotask(() => setSaved(valid)); }
    } catch { /* Storage is optional. */ }
    return () => { activeHandles.forEach(clearTimeout); void audio.current?.close(); };
  }, []);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemaining(left);
      if (!left) { setRunning(false); setNotice("Time’s up. Nice work showing up for your voice!"); }
    }, 200);
    return () => clearInterval(timer);
  }, [running]);
  const chime = useCallback((win = false) => {
    if (!sound) return;
    try { const ctx = audio.current || new AudioContext(); audio.current = ctx; void ctx.resume();
      (win ? [523.25, 659.25, 783.99] : [180]).forEach((frequency, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = frequency; gain.gain.setValueAtTime(.035, ctx.currentTime + i * .09); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + i * .09 + .22);
        osc.start(ctx.currentTime + i * .09); osc.stop(ctx.currentTime + i * .09 + .23);
      });
    } catch { /* Silent mode on devices without audio support. */ }
  }, [sound]);
  const spin = useCallback(() => {
    if (spinLock.current) return;
    const next = selectTopic(pool, [...seen.current, round.topic.id]); if (!next) return;
    spinLock.current = true; setSpinning(true); setRunning(false); setRemaining(duration); setNotice(""); chime();
    const nextChallenge = challenge === "Surprise me" ? challenges[Math.floor(Math.random() * challenges.length)].name : challenge;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const interval = setInterval(() => setReel(v => v + 1), 95);
    const handle = setTimeout(() => {
      clearInterval(interval); seen.current.push(next.id); if (seen.current.length > topics.length) seen.current = [next.id];
      setHistory(prev => [round, ...prev].slice(0, 9)); setRound({ topic: next, challenge: nextChallenge }); setSpinning(false); spinLock.current = false; chime(true);
    }, reduced ? 100 : 1750);
    handles.current.push(handle, interval);
  }, [pool, round, duration, challenge, chime]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { const el = e.target as HTMLElement; if (e.code === "Space" && !["BUTTON", "INPUT", "SELECT", "TEXTAREA", "A", "SUMMARY"].includes(el.tagName) && !el.isContentEditable && view === "arcade") { e.preventDefault(); spin(); } }
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [spin, view]);
  function toggleSave() { const next = isSaved ? saved.filter(s => !(s.topic.id === round.topic.id && s.challenge === round.challenge)) : [round, ...saved]; setSaved(next); try {localStorage.setItem("speak-easy-saved", JSON.stringify(next));} catch {setNotice("Saved for this visit. Browser storage is unavailable.");} }
  function chooseRound(r: Round) { setRound(r); setRunning(false); setRemaining(duration); setView("arcade"); setNotice(""); }
  return (
    <div className="app-shell">
      <header className="header"><Link className="brand" href="/" aria-label="Speak Easy home"><span className="brand-icon"><Icon name="mic" size={22}/></span> speak<span className="brand-italic">easy</span><span className="brand-star">✦</span></Link>
        <nav aria-label="Main navigation"><button className={view === "arcade" ? "nav-link active" : "nav-link"} onClick={() => setView("arcade")}>The topic arcade</button><button className={view === "saved" ? "nav-link active" : "nav-link"} onClick={() => setView("saved")}><Icon name="bookmark" size={16}/> Saved topics <span className="count">{saved.length}</span></button></nav>
        <button className="how-button" onClick={() => {setShowHelp(v => !v);setView("arcade");}} aria-expanded={showHelp}>How to play <span>↗</span></button>
      </header>
      <main>
        <section className="intro"><div className="eyebrow"><span/> LESS OVERTHINKING. MORE TALKING.</div><h1>A little luck. <em>A lot to say.</em></h1><p>Pull the lever. Meet your topic. See where your voice takes you.</p></section>
        {showHelp && <section className="help-panel"><button aria-label="Close instructions" onClick={() => setShowHelp(false)}>×</button><strong>Your next great speech starts with a spin.</strong><p>1. Choose a category, challenge, and difficulty. &nbsp; 2. Pull the red lever or press Space. &nbsp; 3. Take a breath, start the timer, and speak. Save any topic you want to revisit.</p></section>}
        {view === "arcade" ? <>
        <section className="filters" aria-label="Topic filters">
          <label><span>CATEGORY</span><div><b>◎</b><select value={category} onChange={e => setCategory(e.target.value)} disabled={spinning}><option>All categories</option>{categories.map(c => <option key={c.name}>{c.name}</option>)}</select></div></label>
          <label><span>YOUR CHALLENGE</span><div><b>✧</b><select value={challenge} onChange={e => setChallenge(e.target.value)} disabled={spinning}><option>Surprise me</option>{challenges.map(c => <option key={c.name}>{c.name}</option>)}</select></div></label>
          <label><span>DIFFICULTY</span><div><b>▥</b><select value={difficulty} onChange={e => setDifficulty(e.target.value)} disabled={spinning}><option>All levels</option><option>Easy</option><option>Medium</option><option>Hard</option></select></div></label>
          <label><span>SPEAKING TIME</span><div><Icon name="clock" size={17}/><select value={duration} disabled={spinning} onChange={e => {const n = Number(e.target.value);setDuration(n);setRemaining(n);setRunning(false);}}><option value={60}>1 minute</option><option value={120}>2 minutes</option><option value={180}>3 minutes</option><option value={300}>5 minutes</option></select></div></label>
          <button className="filter-reset" title="Reset filters" aria-label="Reset filters" disabled={spinning} onClick={() => {setCategory("All categories");setChallenge("Surprise me");setDifficulty("All levels");setDuration(120);setRemaining(120);setRunning(false);}}><Icon name="reset" size={18}/></button>
        </section>
        <div className="arcade-layout">
          <aside className="side-note"><span className="little-star">✳</span><p>Big ideas.<br/>No preparation<br/><em>required.</em></p><span className="side-line"/><small>{pool.length} topics in the mix<br/>One is waiting for you.</small></aside>
          <section className={`machine ${spinning ? "is-spinning" : ""}`} aria-label="Speaking topic slot machine" aria-busy={spinning}>
            <div className="machine-top"><Bulbs/><div className="marquee"><span>★</span><div><small>THE ORIGINAL</small><h2>TOPIC-O-MATIC</h2><p>EVERY SPIN IS A CONVERSATION STARTER</p></div><span>★</span></div><Bulbs/></div>
            <div className="machine-body"><div className="machine-stamp"><span>EST. 2026</span><span>GOOD TOPICS. GREAT STORIES.</span><span>№ 001</span></div>
              <div className="reels" aria-hidden="true">{[0, 1, 2].map((i) => <div className={`reel reel-${i}`} key={i}><div className="reel-ghost">{["✦", "♧", "✧"][i]}</div><div className="reel-icon" key={spinning ? reel + i : i}>{spinning ? ["✦", "♨", "◎", "⚡", "♡", "✧"][(reel + i) % 6] : [<Icon key="mic" name="mic" size={42}/>, "✦", "☘"][i]}</div><div className="reel-ghost bottom">{["♧", "✦", "◎"][i]}</div></div>)}</div>
              <div className="result-window" aria-live="polite" aria-atomic="true"><div className="topic-meta"><span>{spinning ? "FINDING YOUR NEXT BIG IDEA" : `${categories.find(c => c.name === round.topic.category)?.icon}  ${round.topic.category}`}</span><span className="level">{spinning ? "•••" : round.topic.difficulty}</span></div>
                <div className={`topic-text ${spinning ? "shuffling" : ""}`}><span className="result-kicker">{spinning ? "A LITTLE SUSPENSE…" : currentChallenge.label.toUpperCase()}</span><h3>{spinning ? "Something good is coming…" : round.topic.text + "."}</h3></div>
                <div className="challenge-label">{spinning ? "✦  The possibilities are spinning" : `${currentChallenge.icon}  ${round.challenge}`}</div>
              </div>
              <div className="machine-controls"><span className="speaker-grille" aria-hidden="true"/><button className="spin-button" onClick={spin} disabled={spinning || !pool.length}><Icon name="shuffle"/>{spinning ? "Spinning…" : "Spin my topic"}<span>✦</span></button><span className="speaker-grille" aria-hidden="true"/></div>
              <div className="machine-bottom-label"><span>NO COINS. JUST CURIOSITY.</span><span>∞ FREE PLAYS</span></div>
            </div>
            <button className="lever" aria-label="Pull lever to generate a random topic" disabled={spinning} onClick={spin} onPointerDown={e => {dragY.current = e.clientY;e.currentTarget.setPointerCapture(e.pointerId);}} onPointerUp={e => {if (dragY.current !== null && e.clientY - dragY.current > 20) spin();dragY.current = null;}}><span className="lever-base"/><span className="lever-arm"><span className="lever-ball"/></span></button>
            <div className="machine-foot"/>
          </section>
          <aside className="pull-note"><span>Go on,<br/><em>give it a pull.</em></span><svg width="60" height="75" viewBox="0 0 60 75" fill="none" aria-hidden="true"><path d="M44 2C60 39 39 55 13 48m0 0 13-7M13 48l9 13" stroke="currentColor" strokeWidth="1.5"/></svg></aside>
        </div>
        <div className="under-machine"><span>Or press <kbd>space</kbd> to spin</span><button onClick={() => setSound(v => !v)} aria-pressed={sound}><Icon name={sound ? "sound" : "mute"} size={16}/> Sound {sound ? "on" : "off"}</button></div>
        <section className="practice-bar" aria-label="Practice timer"><div className="timer-display"><Icon name="clock" size={23}/><strong>{Math.floor(remaining / 60).toString().padStart(2,"0")}<span>:</span>{(remaining % 60).toString().padStart(2,"0")}</strong><span>{remaining === 0 ? "Well spoken!" : running ? "The floor is yours" : "Make it your moment"}</span></div><div className="practice-actions"><button className="start-button" disabled={spinning} onClick={() => {if (running) {setRemaining(Math.max(0,Math.ceil((deadline.current-Date.now())/1000)));setRunning(false);} else {const seconds=remaining || duration;setRemaining(seconds);deadline.current = Date.now()+seconds*1000;setRunning(true);}}}>{running ? "Ⅱ Pause" : "▷ Start speaking"}</button><button className="icon-button" aria-label="Reset timer" onClick={() => {setRunning(false);setRemaining(duration);}}><Icon name="reset" size={18}/></button><span className="divider"/><button className={`save-button ${isSaved ? "saved" : ""}`} disabled={spinning} onClick={toggleSave}><Icon name="bookmark" size={17}/>{isSaved ? "Saved" : "Save topic"}</button></div></section>
        <div className="speaking-tip"><span>✧</span><p><strong>A little nudge</strong> {currentChallenge.instruction}</p></div>
        <div className="notice" role="status">{notice}</div>
        {history.length > 0 && <section className="history"><div className="section-label">YOUR RECENT SPINS <span>{history.length}</span></div><div className="history-grid">{history.slice(0,3).map((r,i) => <button disabled={spinning} key={`${r.topic.id}-${i}`} onClick={() => chooseRound(r)}><small>{r.topic.category}</small><span>{r.topic.text}</span><Icon name="arrow" size={16}/></button>)}</div></section>}
        <section className="explore"><div className="explore-heading"><div><span className="section-label">FOLLOW YOUR CURIOSITY</span><h2>What’s your kind of conversation?</h2></div><span>20 niches. Endless directions.</span></div><div className="category-chips">{categories.map(c => <button disabled={spinning} className={category === c.name ? "selected" : ""} key={c.name} onClick={() => {setCategory(c.name);document.querySelector(".filters")?.scrollIntoView({behavior: "smooth",block:"center"});}}><span>{c.icon}</span>{c.name}</button>)}</div></section>
        </> : <section className="saved-panel"><span className="section-label">THE KEEPERS</span><h2>Your conversation collection.</h2><p>Saved on this browser, ready for another round.</p>{saved.length ? <div className="saved-grid">{saved.map(r => <button key={r.topic.id+r.challenge} onClick={() => chooseRound(r)}><small>{r.topic.category} · {r.challenge}</small><h3>{r.topic.text}</h3><span>Practice this topic →</span></button>)}</div> : <div className="empty-saved"><Icon name="bookmark" size={32}/><h3>A good topic is worth keeping.</h3><p>Save a topic from the arcade and it will be waiting here.</p><button className="start-button" onClick={() => setView("arcade")}>Back to the arcade →</button></div>}</section>}
      </main>
      <footer><span className="footer-brand">speak<em>easy</em> ✦</span><p>A playground for your voice. No perfect speeches required.</p><span>300 topics · 8 ways to play</span></footer>
    </div>
  );
}

