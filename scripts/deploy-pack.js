/* ============================================================
   แพ็กไฟล์สำหรับ deploy ขึ้นเซิร์ฟเวอร์ → โฟลเดอร์ dist-deploy/
   (สคริปต์เดียวกันทุกโปรเจกต์ ตั้งค่าที่ deploy-config/pack.json)

   dist-deploy/
   ├── deploy/              ← อัปโหลดไปแทน public_html/deploy/ ทั้งโฟลเดอร์
   │   ├── (ไฟล์จาก build/)  index.html, static/, ...
   │   ├── api/  (+ vendor/ ถ้ามี)
   │   └── .htaccess        (จาก deploy-config/deploy.htaccess)
   └── public_html.htaccess ← ใช้ครั้งแรกครั้งเดียว วางเป็น public_html/.htaccess

   ไม่ใส่ : uploads/, src/, node_modules/, sql/, .env*, .git
   ไฟล์ตั้งค่าเฉพาะเครื่อง (เช่น api/conn.php) :
     - ถ้ามี deploy-config/server/<path เดียวกัน> จะใช้ไฟล์นั้นแทน (ค่าของเซิร์ฟเวอร์จริง — ไม่อยู่ใน git)
     - ถ้าไม่มี จะไม่ใส่ไฟล์นั้น และเตือนว่าห้ามลบ deploy/ ทั้งโฟลเดอร์
   ใช้ : npm run deploy:all  (build + แพ็ก)  หรือ  npm run deploy:pack (แพ็กอย่างเดียว)
============================================================ */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CFG_DIR = path.join(ROOT, "deploy-config");
const OUT = path.join(ROOT, "dist-deploy");
const DEPLOY = path.join(OUT, "deploy");
const cfg = JSON.parse(fs.readFileSync(path.join(CFG_DIR, "pack.json"), "utf8"));
const SECRETS = (cfg.serverFiles || []).map((p) => p.replace(/\\/g, "/"));

const NEVER = new Set(["uploads", "node_modules", ".git", ".DS_Store", "dist-deploy"]);
const isEnvFile = (n) => n === ".env" || n.startsWith(".env.");

const copyDir = (src, dst, relBase) => {
  fs.mkdirSync(dst, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const rel = relBase ? `${relBase}/${name}` : name;
    if (NEVER.has(name) || isEnvFile(name) || SECRETS.includes(rel)) {
      console.log(`  ข้าม ${rel}`);
      continue;
    }
    const s = path.join(src, name);
    const d = path.join(dst, name);
    const st = fs.lstatSync(s);
    if (st.isDirectory()) copyDir(s, d, rel);
    else if (st.isFile()) fs.copyFileSync(s, d);
  }
};

if (!fs.existsSync(path.join(ROOT, "build", "index.html"))) {
  console.error("✕ ไม่พบ build/index.html — รัน npm run build ก่อน");
  process.exit(1);
}

console.log("ล้าง dist-deploy/ ...");
fs.rmSync(OUT, { recursive: true, force: true });

console.log("คัดลอก build/ → deploy/");
copyDir(path.join(ROOT, "build"), DEPLOY, "");
for (const dir of cfg.dirs || ["api"]) {
  if (!fs.existsSync(path.join(ROOT, dir))) continue;
  console.log(`คัดลอก ${dir}/ → deploy/${dir}/`);
  copyDir(path.join(ROOT, dir), path.join(DEPLOY, dir), dir);
}
fs.copyFileSync(path.join(CFG_DIR, "deploy.htaccess"), path.join(DEPLOY, ".htaccess"));
fs.copyFileSync(path.join(CFG_DIR, "root.htaccess"), path.join(OUT, "public_html.htaccess"));

/* ไฟล์ตั้งค่าของเซิร์ฟเวอร์จริง */
const missing = [];
for (const rel of SECRETS) {
  const srv = path.join(CFG_DIR, "server", rel);
  if (fs.existsSync(srv)) {
    fs.mkdirSync(path.dirname(path.join(DEPLOY, rel)), { recursive: true });
    fs.copyFileSync(srv, path.join(DEPLOY, rel));
    console.log(`  ใช้ค่าเซิร์ฟเวอร์ : ${rel}`);
  } else missing.push(rel);
}

/* กันพลาด : ต้องไม่มีโฟลเดอร์ uploads ในชุด deploy */
const findUploads = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.lstatSync(p).isDirectory()) {
      if (name === "uploads") return p;
      const f = findUploads(p);
      if (f) return f;
    }
  }
  return null;
};
const bad = findUploads(DEPLOY);
if (bad) {
  console.error(`✕ เจอโฟลเดอร์ uploads ในชุด deploy : ${bad}`);
  process.exit(1);
}

console.log("\n✔ เสร็จ : dist-deploy/");
if (missing.length) {
  console.log("⚠ ไม่ได้ใส่ไฟล์ตั้งค่าเซิร์ฟเวอร์ : " + missing.join(", "));
  console.log("  → ห้ามลบ public_html/deploy/ ทั้งโฟลเดอร์ ให้อัปโหลดทับแทน (ไฟล์เดิมบนเซิร์ฟเวอร์จะยังอยู่)");
  console.log("  → หรือคัดลอกไฟล์ของเซิร์ฟเวอร์มาไว้ที่ deploy-config/server/<path> ครั้งเดียว แล้วแพ็กใหม่");
} else {
  console.log("  - ลบ public_html/deploy/ แล้ววาง dist-deploy/deploy/ แทนได้ทั้งโฟลเดอร์");
}
console.log("  - ห้ามแตะ public_html/uploads/");
console.log("  - public_html.htaccess ใช้ครั้งแรกครั้งเดียว (วางเป็น public_html/.htaccess)");
