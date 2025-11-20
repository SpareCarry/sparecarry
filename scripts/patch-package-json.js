const fs = require(''fs'');
const p = JSON.parse(fs.readFileSync(''package.json'',''utf8''));

// Set exact versions:
p.dependencies = p.dependencies || {};
p.devDependencies = p.devDependencies || {};

const pins = {
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "next": "14.2.5",
  "lucide-react": "0.309.0",
  "@supabase/supabase-js": "2.83.0",
  "@supabase/ssr": "0.1.0",
  "@stripe/react-stripe-js": p.dependencies["@stripe/react-stripe-js"] || "2.9.0",
  "@stripe/stripe-js": p.dependencies["@stripe/stripe-js"] || "2.4.0",
  "typescript": p.devDependencies["typescript"] || "5.9.3"
};

// apply pins only if dependency exists
Object.keys(pins).forEach(k=>{
  if(p.dependencies[k] || p.devDependencies[k]) {
    if(p.dependencies[k]) p.dependencies[k] = pins[k];
    if(p.devDependencies[k]) p.devDependencies[k] = pins[k];
  }
});

// Add pnpm overrides / resolutions
p.pnpm = p.pnpm || {};
p.pnpm.overrides = p.pnpm.overrides || {};
// Example overrides to force swc & lucide-react compatibility if needed
p.pnpm.overrides["@swc/core"] = p.pnpm.overrides["@swc/core"] || "1.3.71";
p.pnpm.overrides["lucide-react"] = "0.309.0";

fs.writeFileSync(''package.json'', JSON.stringify(p, null, 2));
console.log(''package.json patched. Please review before install.'');
