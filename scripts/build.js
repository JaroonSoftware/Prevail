/* ============================================================
   npm run build — เหมือน react-scripts build ทุกอย่าง แต่เร็วกว่าเมื่อ build ซ้ำ
   ปัญหาเดิม: CRA 5 เรียก compiler.run() แล้วไม่ปิด compiler
   -> webpack ไม่เคยเขียน cache ของ production (node_modules/.cache/default-production)
   -> ทุกครั้ง build ใหม่ทั้งหมดตั้งแต่ต้น
   แก้: ครอบ webpack ให้ปิด compiler หลัง build เสร็จ -> cache ถูกบันทึก
   ครั้งแรกยังช้าเท่าเดิม ครั้งต่อ ๆ ไปเร็วขึ้นมาก (build ใหม่เฉพาะไฟล์ที่แก้)
   ถ้ามีปัญหา ใช้ของเดิมได้: npm run build:cra
============================================================ */
const start = Date.now();
const wpPath = require.resolve("webpack", { paths: [require.resolve("react-scripts/package.json")] });
const webpack = require(wpPath);

function patched(...args) {
  const compiler = webpack(...args);
  if (compiler && typeof compiler.run === "function" && typeof compiler.close === "function") {
    const run = compiler.run.bind(compiler);
    compiler.run = (cb) => run((err, stats) => {
      compiler.close((closeErr) => {
        if (closeErr) console.warn("บันทึก cache ไม่สำเร็จ (ไม่กระทบไฟล์ build):", closeErr.message);
        cb(err, stats);
      });
    });
  }
  return compiler;
}
Object.assign(patched, webpack);
require.cache[wpPath].exports = patched;

process.on("exit", (code) => {
  if (code === 0) console.log(`\nใช้เวลา build ${((Date.now() - start) / 1000).toFixed(1)} วินาที`);
});

require("react-scripts/scripts/build");
