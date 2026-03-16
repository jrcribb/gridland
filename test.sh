rm -rf /tmp/bunx-501-@gridland
  cd $(mktemp -d)
  echo '{"type":"module","dependencies":{"@gridland/bun":"0.2.44","react":"^19.0.0"}}' >
  package.json
  bun install

  cat > test.tsx << 'EOF'
  // @ts-nocheck
  import { createCliRenderer, createRoot } from "@gridland/bun";
  import React from "react";

  function App() {
    return <box border padding={1}><text>Hello</text></box>;
  }

  const renderer = await createCliRenderer({ exitOnCtrlC: true, testing: true });
  console.error("1 renderer created");
  const root = createRoot(renderer);
  console.error("2 root created");
  root.render(<App />);
  console.error("3 rendered");
  renderer.renderOnce();
  console.error("4 renderOnce done");
  renderer.destroy();
  console.error("5 done");
  EOF
  bun test.tsx
