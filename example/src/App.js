import React from 'react'
import SingleFunctionExample from './SingleFunctionExample'
import AutoFetchExample from './AutoFetchExample'
import ErrorExample from './ErrorExample'
import OptimisticExample from './OptimisticExample'
import PatchExample from './PatchExample'
import RaceExample from './RaceExample'
import pkg from 'use-request/package.json'

const Example = ({ title, code, badge, children }) => (
  <div className="example">
    <div className="example-header">
      <h3>{title}</h3>
      {badge && <span className="badge">{badge}</span>}
    </div>
    <div className="example-body">
      <div className="example-code">
        <pre dangerouslySetInnerHTML={{ __html: code }} />
      </div>
      <div className="example-preview">
        <div className="example-preview-label">Live preview</div>
        {children}
      </div>
    </div>
  </div>
)

const basicCode = `<span class="kw">const</span> { value, pending, execute } = <span class="fn">useRequest</span>(
  (num) <span class="op">=></span> <span class="fn">wait</span>(<span class="num">2</span>).<span class="fn">then</span>(() <span class="op">=></span> num)
)

<span class="cm">// call manually with arguments</span>
<span class="fn">execute</span>(<span class="num">42</span>)`

const autoFetchCode = `<span class="kw">const</span> [userId, setUserId] = <span class="fn">useState</span>(<span class="num">1</span>)

<span class="cm">// re-fetches automatically when userId changes</span>
<span class="kw">const</span> { value: user, pending } = <span class="fn">useRequest</span>(
  api.<span class="prop">getUser</span>,
  [userId]  <span class="cm">// deps array</span>
)`

const errorCode = `<span class="kw">const</span> { value, error, idle, pending,
  completed, failed, execute, reset }
  = <span class="fn">useRequest</span>(riskyCall)

<span class="cm">// all 4 states available as booleans</span>
idle     <span class="cm">// before first call</span>
pending  <span class="cm">// in flight</span>
completed<span class="cm">// resolved</span>
failed   <span class="cm">// rejected</span>

<span class="fn">reset</span>()  <span class="cm">// back to idle, clears value/error</span>`

const optimisticCode = `<span class="kw">const</span> { value, execute } = <span class="fn">useRequest</span>(
  (liked) <span class="op">=></span> api.<span class="fn">toggleLike</span>(liked),
  {
    <span class="prop">optimisticPatch</span>: ([liked]) <span class="op">=></span> ({
      liked,
      count: prev.<span class="prop">count</span> + (liked ? <span class="num">1</span> : <span class="num">-1</span>)
    })
  }
)

<span class="cm">// UI updates instantly, syncs in background</span>
<span class="fn">execute</span>(<span class="kw">true</span>)`


const patchCode = `<span class="kw">const</span> { value: todos, patchValue, resetPatch, patched }
  = <span class="fn">useRequest</span>(api.<span class="prop">getTodos</span>, [])

<span class="cm">// optimistically add item</span>
<span class="fn">patchValue</span>([...todos, newItem])

<span class="cm">// on failure, revert to server state</span>
<span class="fn">resetPatch</span>()

patched <span class="cm">// false | 'manual' | 'auto'</span>`

const raceCode = `<span class="kw">const</span> [query, setQuery] = <span class="fn">useState</span>(<span class="str">''</span>)

<span class="cm">// fires on every keystroke, but stale</span>
<span class="cm">// responses are automatically discarded</span>
<span class="kw">const</span> { value: results } = <span class="fn">useRequest</span>(
  (q) <span class="op">=></span> q ? api.<span class="fn">search</span>(q) : [],
  [query]
)`

const pkgManagers = [
  { id: 'npm', cmd: 'npm install use-request' },
  { id: 'yarn', cmd: 'yarn add use-request' },
  { id: 'pnpm', cmd: 'pnpm add use-request' },
]

const InstallCmd = () => {
  const [active, setActive] = React.useState(0)
  const [copied, setCopied] = React.useState(false)
  const { cmd } = pkgManagers[active]

  const handleCopy = () => {
    navigator.clipboard?.writeText(cmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="install-wrapper">
      <div className="install-tabs">
        {pkgManagers.map((pm, i) => (
          <button
            key={pm.id}
            className={`install-tab${i === active ? ' active' : ''}`}
            onClick={() => setActive(i)}
          >
            {pm.id}
          </button>
        ))}
      </div>
      <div
        className={`install-cmd${copied ? ' copied' : ''}`}
        onClick={handleCopy}
        title="Click to copy"
      >
        <span className="dollar">$</span>
        {cmd}
        <span className="copy-hint">{copied ? 'copied!' : 'copy'}</span>
      </div>
    </div>
  )
}

const App = () => (
  <div>
    {/* Hero */}
    <header className="hero">
      <img src={process.env.PUBLIC_URL + '/logo.png'} alt="use-request" className="hero-logo" />
      <h1><span>use-request</span> <span className="version">v{pkg.version}</span></h1>
      <p className="tagline">Async state management for React. Simple, typed, powerful.</p>
      <InstallCmd />
      <div className="hero-links">
        <a href="https://github.com/termosa/use-request">GitHub</a>
        <a href="https://www.npmjs.com/package/use-request">npm</a>
      </div>
    </header>

    {/* Features */}
    <div className="features">
      <div className="feature-card">
        <div className="icon">~1KB</div>
        <h3>Lightweight</h3>
        <p>Zero dependencies. Tiny gzipped bundle that won't bloat your app.</p>
      </div>
      <div className="feature-card">
        <div className="icon">TS</div>
        <h3>TypeScript</h3>
        <p>Full type inference for values, errors, and arguments out of the box.</p>
      </div>
      <div className="feature-card">
        <div className="icon">&gt;_</div>
        <h3>Race-safe</h3>
        <p>Stale responses are automatically discarded. Only the latest result wins.</p>
      </div>
      <div className="feature-card">
        <div className="icon">++</div>
        <h3>Optimistic Updates</h3>
        <p>Instant UI feedback with optimisticPatch. Rolls back automatically on failure.</p>
      </div>
    </div>

    {/* Examples */}
    <div className="section">
      <h2 className="section-title">In action</h2>

      <Example title="Manual execution" code={basicCode}>
        <SingleFunctionExample />
      </Example>

      <Example title="Reactive fetching" code={autoFetchCode}>
        <AutoFetchExample />
      </Example>

      <Example title="Error states" code={errorCode}>
        <ErrorExample />
      </Example>

      <Example title="Optimistic UI" code={optimisticCode}>
        <OptimisticExample />
      </Example>

      <Example title="Patch & rollback" code={patchCode}>
        <PatchExample />
      </Example>

      <Example title="Race-safe search" code={raceCode}>
        <RaceExample />
      </Example>
    </div>

    {/* Arguments */}
    <div className="section">
      <h2 className="section-title">Arguments</h2>
      <div className="api-ref">
        <table>
          <thead>
            <tr>
              <th>Argument</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>request</code></td>
              <td><code>(...args) =&gt; Promise&lt;T&gt; | T</code></td>
              <td className="desc">Async or sync function to execute</td>
            </tr>
            <tr>
              <td><code>options</code></td>
              <td><code>T[] | Options | null</code></td>
              <td className="desc">Deps array, options object, or null</td>
            </tr>
            <tr className="api-group"><td colSpan={3}>Options object</td></tr>
            <tr>
              <td><code>deps</code></td>
              <td><code>T[] | null</code></td>
              <td className="desc">Dependencies array — triggers auto-execution when values change</td>
            </tr>
            <tr>
              <td><code>optimisticPatch</code></td>
              <td><code>T | ((args) =&gt; T)</code></td>
              <td className="desc">Value to set immediately on execute, before real response</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    {/* API Reference */}
    <div className="section">
      <h2 className="section-title">Surface</h2>
      <div className="api-ref">
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="api-group"><td colSpan={3}>State</td></tr>
            <tr>
              <td><code>value</code></td>
              <td><code>T | undefined</code></td>
              <td className="desc">Resolved value, persisted across re-executions</td>
            </tr>
            <tr>
              <td><code>error</code></td>
              <td><code>E | undefined</code></td>
              <td className="desc">Rejection reason</td>
            </tr>
            <tr>
              <td><code>idle</code></td>
              <td><code>boolean</code></td>
              <td className="desc">No request has been made yet</td>
            </tr>
            <tr>
              <td><code>pending</code></td>
              <td><code>boolean</code></td>
              <td className="desc">Request is in flight</td>
            </tr>
            <tr>
              <td><code>completed</code></td>
              <td><code>boolean</code></td>
              <td className="desc">Last request resolved successfully</td>
            </tr>
            <tr>
              <td><code>failed</code></td>
              <td><code>boolean</code></td>
              <td className="desc">Last request was rejected</td>
            </tr>
            <tr>
              <td><code>status</code></td>
              <td><code>UseRequestStatus</code></td>
              <td className="desc">'idle' | 'pending' | 'completed' | 'failed'</td>
            </tr>
            <tr className="api-group"><td colSpan={3}>Actions</td></tr>
            <tr>
              <td><code className="method">execute</code></td>
              <td><code className="method">(...args) =&gt; Promise</code></td>
              <td className="desc">Trigger the request manually</td>
            </tr>
            <tr>
              <td><code className="method">reset</code></td>
              <td><code className="method">() =&gt; void</code></td>
              <td className="desc">Reset to idle state, cancel pending requests</td>
            </tr>
            <tr className="api-group"><td colSpan={3}>Patching</td></tr>
            <tr>
              <td><code>patched</code></td>
              <td><code>false | 'manual' | 'auto'</code></td>
              <td className="desc">Whether current state is patched</td>
            </tr>
            <tr>
              <td><code className="method">patch</code></td>
              <td><code className="method">(input) =&gt; void</code></td>
              <td className="desc">Manually patch value and/or error</td>
            </tr>
            <tr>
              <td><code className="method">patchValue</code></td>
              <td><code className="method">(value) =&gt; void</code></td>
              <td className="desc">Shorthand to patch just the value</td>
            </tr>
            <tr>
              <td><code className="method">resetPatch</code></td>
              <td><code className="method">() =&gt; void</code></td>
              <td className="desc">Revert to last real server response</td>
            </tr>
          </tbody>
        </table>
        <table>
          <tbody>
            <tr className="api-group"><td colSpan={3}>Constants</td></tr>
            <tr>
              <td><code className="api-enum-name">UseRequestStatus</code></td>
              <td colSpan={2}>
                <code className="api-enum-import">import {'{'} UseRequestStatus {'}'} from 'use-request'</code>
                <div className="api-enum-values">
                  <span><code>UseRequestStatus.Idle</code></span>
                  <span><code>UseRequestStatus.Pending</code></span>
                  <span><code>UseRequestStatus.Completed</code></span>
                  <span><code>UseRequestStatus.Failed</code></span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    {/* Footer */}
    <footer className="footer">
      MIT License &middot; <a href="https://github.com/termosa/use-request">GitHub</a> &middot; <a href="https://www.npmjs.com/package/use-request">npm</a>
    </footer>
  </div>
)

export default App
