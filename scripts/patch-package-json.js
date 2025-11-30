const fs = require("fs");
const p = JSON.parse(fs.readFileSync("package.json", "utf8"));

p.dependencies = p.dependencies || {};
p.devDependencies = p.devDependencies || {};

const pins = {
  react: "18.3.1",
  "react-dom": "18.3.1",
  next: "14.2.5",
  "lucide-react": "0.309.0",
  "@supabase/supabase-js": "2.83.0",
  "@supabase/ssr": "0.1.0",
  "@stripe/react-stripe-js":
    p.dependencies && p.dependencies["@stripe/react-stripe-js"]
      ? "2.9.0"
      : undefined,
  "@stripe/stripe-js":
    p.dependencies && p.dependencies["@stripe/stripe-js"] ? "2.4.0" : undefined,
  typescript:
    p.devDependencies && p.devDependencies["typescript"] ? "5.9.3" : undefined,
};

Object.entries(pins).forEach(([name, version]) => {
  if (!version) return;
  if (p.dependencies[name]) {
    p.dependencies[name] = version;
  }
  if (p.devDependencies[name]) {
    p.devDependencies[name] = version;
  }
});

p.pnpm = p.pnpm || {};
p.pnpm.overrides = p.pnpm.overrides || {};
if (!p.pnpm.overrides["@swc/core"]) {
  p.pnpm.overrides["@swc/core"] = "1.3.71";
}
p.pnpm.overrides["lucide-react"] = "0.309.0";

fs.writeFileSync("package.json", JSON.stringify(p, null, 2));
console.log("package.json patched. Please review before install.");
