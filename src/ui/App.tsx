import { useAppStore } from '@store/appStore'

const milestones = [
  { id: 'M0', label: 'Bootstrap', detail: 'Docs, skills, toolchain', state: 'done' },
  { id: 'M1', label: 'Engine spine', detail: 'State, time, DSL, saves', state: 'next' },
  { id: 'M2', label: 'Slice systems', detail: 'Market, travel, dialogue', state: 'later' },
  { id: 'M3', label: 'Slice content', detail: 'Ugarit to Cyprus', state: 'later' },
  { id: 'M4', label: 'Playtest', detail: 'Evaluate the loop', state: 'later' },
] as const

export function App() {
  const screen = useAppStore((s) => s.screen)
  const setScreen = useAppStore((s) => s.setScreen)

  return (
    <main className="shell">
      <header className="masthead">
        <p className="eyebrow">Late Bronze Age · c. 1230 BCE</p>
        <h1>The Song of the Wanderer</h1>
        <p className="tagline">
          A merchant, a road, and a world that will not stay the same.
        </p>
      </header>

      <nav className="tabs" aria-label="Scaffold sections">
        <button
          type="button"
          aria-pressed={screen === 'title'}
          onClick={() => setScreen('title')}
        >
          Overview
        </button>
        <button
          type="button"
          aria-pressed={screen === 'roadmap'}
          onClick={() => setScreen('roadmap')}
        >
          Roadmap
        </button>
      </nav>

      {screen === 'title' ? (
        <section className="panel" aria-labelledby="overview-heading">
          <h2 id="overview-heading">Working title screen</h2>
          <p>
            This is the M0 scaffold: the application shell, the toolchain, and the
            documentation system. There is no game yet. The world, its people, and its
            roads arrive with the vertical slice.
          </p>
          <dl className="facts">
            <div>
              <dt>Slice route</dt>
              <dd>Ugarit → Cyprus</dd>
            </div>
            <div>
              <dt>Core loop</dt>
              <dd>Arrive · learn · trade · prepare · travel · return changed</dd>
            </div>
            <div>
              <dt>Engine rule</dt>
              <dd>Authored content, pure deterministic code</dd>
            </div>
          </dl>
          <p className="note">
            Start any development session by reading <code>AGENTS.md</code>,{' '}
            <code>docs/STATUS.md</code>, and the active milestone file.
          </p>
        </section>
      ) : (
        <section className="panel" aria-labelledby="roadmap-heading">
          <h2 id="roadmap-heading">Milestones</h2>
          <ol className="milestones">
            {milestones.map((m) => (
              <li key={m.id} data-state={m.state}>
                <span className="mid">{m.id}</span>
                <span className="mlabel">{m.label}</span>
                <span className="mdetail">{m.detail}</span>
                <span className="mstate">{m.state}</span>
              </li>
            ))}
          </ol>
          <p className="note">
            The full board lives in <code>docs/PLAN.md</code>. Task-level detail and
            acceptance criteria live in <code>docs/milestones/</code>.
          </p>
        </section>
      )}

      <footer className="footnote">
        Vertical slice target: a complete, small journey that answers whether the loop is
        worth building a world around.
      </footer>
    </main>
  )
}
