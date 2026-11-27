/* ============================================================
   build เฉพาะเมื่อจำเป็น แล้วแพ็ก deploy  (npm run deploy:all)
   - ถ้าไม่มีไฟล์ใน src/ public/ .env* package.json ที่ใหม่กว่า build/index.html
     → ข้ามการ build (แก้แค่ api/ PHP ก็แพ็กได้ทันที)
   - บังคับ build ใหม่ : npm run deploy:all -- --force
============================================================ */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const force = process.argv.includes("--force");
const builtAt = (() => {
  try {
    return fs.statSync(path.join(ROOT, "build", "index.html")).mtimeMs;
  } catch {
    return 0;
  }
})();

const newest = (p) => {
  let t = 0;
  let st;
  try {
    st = fs.statSync(p);
  } catch {
    return 0;
  }
  if (!st.isDirectory()) return st.mtimeMs;
  for (const n of fs.readdirSync(p)) {
    if (n === "node_modules" || n.startsWith(".git")) continue;
    t = Math.max(t, newest(path.join(p, n)));
  }
  return t;
};

const watch = ["src", "public", "package.json", "tailwind.config.js", "postcss.config.js"]
  .concat(fs.readdirSync(ROOT).filter((n) => n === ".env" || n.startsWith(".env.")));
const changed = Math.max(...watch.map((n) => newest(path.join(ROOT, n))));

if (force || !builtAt || changed > builtAt) {
  console.log(force ? "บังคับ build ใหม่ ..." : "มีไฟล์หน้าเว็บเปลี่ยน → build ...");
  execSync("node scripts/build.js", { cwd: ROOT, stdio: "inherit" });
} else {
  console.log("หน้าเว็บไม่มีอะไรเปลี่ยนตั้งแต่ build ล่าสุด → ข้ามการ build (ใช้ --force ถ้าต้องการ build ใหม่)");
}
require("./deploy-pack.js");
