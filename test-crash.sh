#!/bin/bash
TMPDIR=$(mktemp -d)
cd "$TMPDIR"
npm pack /Users/chris/dev/gridland/packages/utils --pack-destination . 2>/dev/null
npm pack /Users/chris/dev/gridland/packages/bun --pack-destination . 2>/dev/null
UTILS=$(ls gridland-utils-*.tgz)
BUN=$(ls gridland-bun-*.tgz)
echo "{\"type\":\"module\",\"dependencies\":{\"@gridland/utils\":\"file:./$UTILS\",\"@gridland/bun\":\"file:./$BUN\",\"react\":\"^19.0.0\"},\"overrides\":{\"@gridland/utils\":\"file:./$UTILS\"}}" > package.json
bun install 2>&1 | tail -1

echo "=== Test A: testing:true (no terminal, no thread) ==="
bun -e '
import { createCliRenderer, createRoot } from "@gridland/bun";
import React from "react";
function App() { return React.createElement("box", { border: true }, React.createElement("text", null, "Hi")); }
console.error("A1");
const r = await createCliRenderer({ exitOnCtrlC: true, testing: true });
console.error("A2");
createRoot(r).render(React.createElement(App));
console.error("A3");
r.renderOnce();
console.error("A4 PASS");
r.destroy();
' 2>&1

echo ""
echo "=== Test B: full terminal, useThread:false ==="
cat > b.tsx << 'EOTEST'
// @ts-nocheck
import { createCliRenderer, createRoot } from "@gridland/bun";
import React from "react";
function App() { return <box border padding={1}><text bold>Hello!</text></box>; }
const r = await createCliRenderer({ exitOnCtrlC: true, useThread: false });
createRoot(r).render(<App />);
setTimeout(() => { r.destroy(); process.exit(0); }, 2000);
EOTEST
bun b.tsx

echo ""
echo "=== Test C: full terminal, useThread:true (default) ==="
cat > c.tsx << 'EOTEST'
// @ts-nocheck
import { createCliRenderer, createRoot } from "@gridland/bun";
import React from "react";
function App() { return <box border padding={1}><text bold>Hello with thread!</text></box>; }
const r = await createCliRenderer({ exitOnCtrlC: true });
createRoot(r).render(<App />);
setTimeout(() => { r.destroy(); process.exit(0); }, 2000);
EOTEST
bun c.tsx

rm -rf "$TMPDIR"
