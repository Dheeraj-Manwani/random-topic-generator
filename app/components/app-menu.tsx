"use client";

import { useEffect, useRef, useState } from "react";
import ThemeToggle from "./theme-toggle";
import { Menu, X, Bookmark, Volume2, VolumeX, Music2, Shuffle, Gauge } from "lucide-react";

type Props = {
  view: "arcade" | "saved";
  savedCount: number;
  music: boolean;
  sound: boolean;
  disabled: boolean;
  volume: number;
  reducedMotion: boolean;
  onVolume: (value: number) => void;
  onReducedMotion: () => void;
  onNavigate: (view: "arcade" | "saved") => void;
  onAudio: (channel: "music" | "sound") => void;
};

export default function AppMenu({ view, savedCount, music, sound, disabled, volume, reducedMotion, onVolume, onReducedMotion, onNavigate, onAudio }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const previousOverflow = useRef<string | null>(null);
  const [open, setOpen] = useState(false);

  function restoreScroll() {
    if (previousOverflow.current !== null) document.body.style.overflow = previousOverflow.current;
    previousOverflow.current = null;
  }
  useEffect(() => () => {
    if (previousOverflow.current !== null) document.body.style.overflow = previousOverflow.current;
  }, []);

  function toggle() {
    if (dialog.current?.open) { dialog.current.close(); return; }
    previousOverflow.current = document.body.style.overflow;
    dialog.current?.showModal();
    document.body.style.overflow = "hidden";
    setOpen(true);
  }
  function navigate(destination: "arcade" | "saved") {
    onNavigate(destination);
    dialog.current?.close();
  }

  return <>
    <button className="hamburger-button" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={open} aria-controls="app-menu" onClick={toggle} disabled={disabled}><Menu size={22}/></button>
    <ThemeToggle/>
    <dialog id="app-menu" ref={dialog} className="app-menu-modal" aria-labelledby="app-menu-title" onClose={() => {setOpen(false); restoreScroll();}} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
    }}>
      <div className="app-menu-heading"><h2 id="app-menu-title">Menu</h2><button className="menu-close" aria-label="Close menu" onClick={() => dialog.current?.close()}><X size={20}/></button></div>
      <nav className="menu-navigation" aria-label="Main navigation">
        <button onClick={() => navigate("arcade")} aria-current={view === "arcade" ? "page" : undefined}><Shuffle size={19}/><span>Topic Spin</span><span aria-hidden="true">↗</span></button>
        <button onClick={() => navigate("saved")} aria-current={view === "saved" ? "page" : undefined}><Bookmark size={19}/><span>Saved topics</span><small>{savedCount}</small></button>
      </nav>
      <div className="menu-audio"><h3>Settings</h3>
        <div><span>Music</span><button className="menu-audio-switch" role="switch" aria-label="Music" aria-checked={music} title={music ? "Turn music off" : "Turn music on"} onClick={() => onAudio("music")}><Music2 size={18}/></button></div>
        <div><span>Sound effects</span><button className="menu-audio-switch" role="switch" aria-label="Sound effects" aria-checked={sound} title={sound ? "Turn sound effects off" : "Turn sound effects on"} onClick={() => onAudio("sound")}>{sound ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button></div>
        <label className="volume-setting"><span>Volume <output>{Math.round(volume * 100)}%</output></span><input aria-label="Audio volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={event => onVolume(Number(event.target.value))}/></label>
        <div><span>Reduce motion</span><button className="menu-audio-switch" role="switch" aria-label="Reduce motion" aria-checked={reducedMotion} onClick={onReducedMotion}><Gauge size={18}/></button></div>
        <p className="settings-hint">Steady lights and a still reel. Your preferences stay on this browser.</p>
      </div>
    </dialog>
  </>;
}
