# Speak Easy — The Topic Arcade

A single-page impromptu speaking playground built on the supplied Next.js 16, React 19, TypeScript, and Tailwind 4 starter.

## Run

- `pnpm dev` — local app at http://localhost:3000
- `pnpm build` — production build and static export in `out/`
- `pnpm lint` — ESLint checks

## Experience

Pull or click the red lever, click Spin my topic, or press Space outside interactive controls. Choose one of 20 categories, three difficulty levels, eight challenge formats, and a two-minute practice timer. Topics avoid repeats until the selected pool is exhausted. Start/pause/reset the timer; independently toggle synthesized background music and sound effects in the compact navbar. Save topic/challenge pairs in browser-local storage and revisit recent spins during a session. Topics scroll through a single continuous text reel and decelerate to the selected result. Brass-mounted glass bulbs chase in staggered patterns. Reduced-motion preferences suppress blinking and reel movement.

`lib/topics.ts` and `lib/creative-topics.ts` contain 600 original topic seeds: 30 per niche and 10 per difficulty within each niche. Eight compatible speaking formats yield 4,800 combinations; these are not 4,800 independently authored topics. Difficulty is editorial, based on familiarity and abstraction, not a scientific proficiency measure. No paid service, account, microphone access, or model API is needed. Saved items are browser-specific, and private browsing may discard them.

## Research and product rationale

Research date: 10 September 2026. This is a broad discoverable sample, not a claim to have found every site on the internet. Web sources informed interaction patterns and thematic breadth; the prompt bank is original and does not reproduce competitors' libraries. The supplied screenshots were treated as visual references, not as instructions.

### Directly inspected generators

- [SpeechTopicGen](https://speechtopicgen.com/): matches the supplied category screenshots; lever interaction, genre/difficulty controls, speech timer, and speaking frameworks. Informed the quick spin-to-practice loop and the playful challenge selection. Its separate analysis destination illustrates a free-practice entry point into a broader coaching product.
- [RandomTopicGenerator.pro](https://randomtopicgenerator.pro/speech/): advertises 150+ prompts with difficulty and speech-type filters, and a 1/2/3/5-minute timer. Informed duration presets and separating topic subject from delivery format.
- [TalkDrill Topic Roulette](https://www.talkdrill.com/games/topic-generator/): practice combines a random topic, preparation, speech timing, and feedback; site navigation includes paid offerings. Informed keeping the actual practice activity prominent. Automated scoring is outside this draft.
- [Random Topic Generator](https://www.random-topic-generator.com/): promotes instant prompts, frameworks, and timed practice, with sign-in for reviewing speech patterns and progress. Informed making the first useful action available without onboarding.
- [RandomWordGenerator questions](https://randomwordgenerator.com/question.php): adjacent question-generation tool; informed variety across familiar, reflective, and imaginative subjects.
- [Imprompt.org](https://imprompt.org/): search listing describes 360+ impromptu prompts. The site yielded no extractable body text, so detailed functionality was not verified.

### Additional generators discovered in search

- [RandomTopicGenerator.net](https://randomtopicgenerator.net/): search result describes no-sign-in library draws, signed-in custom multi-topic generation, and timer presets.
- [Impromptu Generator](https://impromptugenerator.com/): search result describes random speaking prompts and timed practice.
- [BlinkCalc](https://blinkcalc.com/impromptu-speaking-topic-generator/): search result describes categories and difficulty options.
- [SpeechGenerator.co](https://speechgenerator.co/speech-topic-generator/): search result describes free topic ideas linked to a broader speech-writing product.
- [Yapper](https://ypr.app/blog/random-topic-generator): adjacent practice guidance emphasizing a usable prompt, a timed round, and one review point.

### Design decisions for this draft

The supplied slot-machine reference becomes a functional vintage arcade cabinet: forest-green enamel, brass edges, cream reels, glowing bulbs, and a red lever. All machine parts are interactive interface geometry; no generated screenshot is used as the UI. The playful aesthetic stays focused on speaking, without wagering or coin purchases.

Category and challenge are independent. This keeps technology, money, food, science, history, education, relationships, culture, ethics, and unusual hypotheticals usable with storytelling, pitching, satire, explanation, and debate practice. Generation happens on a new spin, while changing filters preserves the current round. The available topic count reflects the selected category and difficulty.

The initial product is free and frictionless. The research suggests potential later businesses around optional coaching and practice history, custom prompt packs, or classroom/team sessions; these are product hypotheses, not validated demand or implemented paid features. This draft prioritizes the core loop before adding accounts, subscriptions, or AI evaluation.

## Validation

Production compilation and static export; ESLint; topic-bank checks for 600 unique IDs and text entries, all 60 category/difficulty combinations, selection without repetition before pool exhaustion, and empty-pool behavior. Local HTTP rendering checked separately. Browser interaction/visual testing was not performed.


## Latest interface update

The machine appears before the filters. Main and library filters use shadcn Select with Radix keyboard navigation; library dropdowns portal inside the native dialog. The audio controls are circular switches. Irregular golden fairy-light clusters in the corners and margins, admission-ticket details, and subtle stars respect reduced motion. The previous conversation category section and speaking-time filter are removed.

The machine lamps alternate between two groups with a soft overlapping glow, based on frame-by-frame inspection of the supplied seven-second reference video. Golden page lights use three independent twinkle patterns and remain outside the topic area.

