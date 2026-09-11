"use client";

import { useEffect, useRef, useState } from "react";
import FilterSelect from "./filter-select";
import { categories, topics, type Topic } from "@/lib/topics";

type Props = { disabled: boolean; onSelect: (topic: Topic) => void };

export default function TopicLibrary({ disabled, onSelect }: Props) {
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const scrollLock = useRef<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [level, setLevel] = useState("All levels");
  const normalized = query.trim().toLocaleLowerCase();
  const matches = topics.filter(topic =>
    (category === "All categories" || topic.category === category) &&
    (level === "All levels" || topic.difficulty === level) &&
    `${topic.text} ${topic.category}`.toLocaleLowerCase().includes(normalized)
  );

  function unlockScroll() {
    if (scrollLock.current !== null) document.body.style.overflow = scrollLock.current;
    scrollLock.current = null;
  }

  useEffect(() => () => {
    if (scrollLock.current !== null) document.body.style.overflow = scrollLock.current;
  }, []);

  function open() {
    setQuery(""); setCategory("All categories"); setLevel("All levels");
    dialog?.showModal();
    scrollLock.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    search.current?.focus();
  }

  return <div className="library-entry">
    <button className="browse-topics" onClick={open} disabled={disabled} aria-haspopup="dialog">Browse all {topics.length} topics <span aria-hidden="true">↗</span></button>
    <dialog ref={setDialog} className="topic-library" aria-labelledby="library-title" aria-describedby="library-description" onClose={unlockScroll} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog?.close();
    }}>
      <div className="library-heading"><div><h2 id="library-title">All topics</h2><p id="library-description">Find something that gets you talking. Pick a topic to practice.</p></div><button className="library-close" aria-label="Close topic library" onClick={() => dialog?.close()}>×</button></div>
      <div className="library-filters">
        <label className="library-search"><span className="sr-only">Search topics</span><input ref={search} type="search" placeholder="Search topics…" value={query} onChange={event => setQuery(event.target.value)}/></label>
        <div className="library-filter"><FilterSelect label="Filter library by category" value={category} onChange={setCategory} container={dialog} options={[{value:"All categories"},...categories.map(c => ({value:c.name,icon:c.icon}))]}/></div>
        <div className="library-filter"><FilterSelect label="Filter library by difficulty" value={level} onChange={setLevel} container={dialog} options={[{value:"All levels"},{value:"Easy"},{value:"Medium"},{value:"Hard"}]}/></div>
      </div>
      <p className="library-count" role="status">{matches.length} of {topics.length} topics</p>
      <div className="library-results">
        {matches.length ? categories.map(item => {
          const group = matches.filter(topic => topic.category === item.name);
          return group.length ? <section className="library-group" key={item.name} aria-label={item.name}><h3><span aria-hidden="true">{item.icon}</span> {item.name} <small>{group.length}</small></h3><ul>{group.map(topic => <li key={topic.id}><button onClick={() => { onSelect(topic); dialog?.close(); }}><span>{topic.text}</span><small>{topic.difficulty}</small><span className="library-select" aria-hidden="true">↗</span></button></li>)}</ul></section> : null;
        }) : <div className="library-empty"><h3>No matching topics</h3><p>Try another search or broaden your filters.</p><button onClick={() => {setQuery(""); setCategory("All categories"); setLevel("All levels"); search.current?.focus();}}>Clear filters</button></div>}
      </div>
    </dialog>
  </div>;
}
