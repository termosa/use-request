import React from 'react'
import SingleFunctionExample, { code as singleFunctionExampleCode } from './SingleFunctionExample'
import MultipleFunctionsExample, { code as multipleFunctionsExampleCode } from './MultipleFunctionsExample'
import { version } from 'use-request/package.json'

/** @type {React.CSSProperties} */
const exampleStyles = {
  display: 'flex',
  flexWrap: 'wrap',
  padding: '2em',
  margin: '2em',
  border: '2px solid lightgray',
}

/** @type {React.CSSProperties} */
const titleStyles = {
  width: '100%',
  textAlign: 'center',
}

/** @type {React.CSSProperties} */
const codeStyles = {
  flex: 1,
}

/** @type {React.CSSProperties} */
const previewStyles = {
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '2em',
  borderLeft: '1px solid lightgray',
  width: '260px',
}

/** @type {React.CSSProperties} */
const linkStyles = {
  color: '#444',
}

const githubExampleDirLink = 'https://github.com/termosa/use-request/blob/master/example'

const Example = ({ title, code, path, children }) => (
  <div style={exampleStyles}>
    <h2 style={titleStyles}>
      <a href={`${githubExampleDirLink}${path}`} style={linkStyles}>
        Example: {title}
      </a>
    </h2>
    <pre style={codeStyles}>{code}</pre>
    <div style={previewStyles}>{children}</div>
  </div>
)

const App = () => (
  <React.Fragment>
    <h1 style={titleStyles}>use-request@{version}</h1>
    <Example title="Single Request" code={singleFunctionExampleCode} path="/src/SingleFunctionExample.js">
      <SingleFunctionExample />
    </Example>
    <Example title="Multiple Requests" code={multipleFunctionsExampleCode} path="/src/MultipleFunctionsExample.js">
      <MultipleFunctionsExample />
    </Example>
  </React.Fragment>
)

export default App
