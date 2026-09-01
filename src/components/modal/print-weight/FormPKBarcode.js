import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";

/** ขนาดสติกเกอร์ "1 ดวง" (มม.) — แหล่งความจริงที่เดียว
 *  ตอนนี้ 100 x 75 mm แนวนอน 1 ดวงเต็มหน้า
 *  ต้องตรงกับ "ขนาดฉลาก" (สต็อก USER) ในไดรเวอร์เสมอ */
export const LABEL_W = 100;
export const LABEL_H = 75;

/** จำนวนดวงต่อ 1 แถว/หน้ากระดาษ
 *  ม้วนปัจจุบันเป็นดวงเดียวเต็มหน้า = 1 */
export const LABELS_ACROSS = 1;

/** เผื่อขอบกันเนื้อหาล้นไปกินดวงถัดไป (มม.)
 *  หัวพิมพ์ความร้อนมีพื้นที่พิมพ์จริงน้อยกว่าขนาดไดคัทเล็กน้อย */
const SAFE_W = 1;
const SAFE_H = 2;

/** ขนาด "ผืนงาน" ที่วาดจริง (มม.) */
const ART_W = LABEL_W - SAFE_W; // 99
const ART_H = LABEL_H - SAFE_H; // 73

/** ขนาดหน้ากระดาษที่ส่งให้ @page — สลับด้านเมื่อหมุน 90 องศา */
export const getPageSize = (rotate) =>
  Number(rotate) === 90
    ? { w: LABEL_H, h: LABEL_W * LABELS_ACROSS }
    : { w: LABEL_W * LABELS_ACROSS, h: LABEL_H };

/** สไตล์ใบปะหน้าถุง — ชุดเดียวใช้ทั้ง preview และ print
 *  ห้ามใส่ !important หรือกฎที่ต่างกันระหว่างจอกับกระดาษ
 *  ไม่งั้นสองฝั่งจะเพี้ยนจากกัน */
export const PK_LABEL_STYLE = `
  /* กล่อง 1 หน้ากระดาษ */
  .pk-label {
    width: ${ART_W}mm;
    height: ${ART_H}mm;
    box-sizing: border-box;
    /* ตัวชดเชยตำแหน่งพิมพ์ (calibration)
       ใช้ position:relative เพราะเลื่อนแค่ "ภาพ" ไม่กระทบการคำนวณ
       ขนาดกล่องกับจุดขึ้นหน้าใหม่ จึงไม่ทำให้ pagination เพี้ยน */
    position: relative;
    left: var(--pk-off-x, 0mm);
    top: var(--pk-off-y, 0mm);
    margin: 0;
    background: #fff;
    page-break-after: always;
    break-after: page;
    break-inside: avoid;
    page-break-inside: avoid;
    overflow: hidden;
  }
  .pk-label:last-child { page-break-after: auto; break-after: auto; }

  /* ผืนงานจริง — ออกแบบที่ ${ART_W} x ${ART_H} mm เสมอ ไม่ว่าจะหมุนหรือไม่ */
  .pk-canvas {
    width: ${ART_W}mm;
    height: ${ART_H}mm;
    box-sizing: border-box;
    /* เว้นขอบเล็กน้อย ไม่ให้เส้นกรอบไปชนรอยไดคัทจนโดนตัด */
    padding: 0.8mm;
    /* Tahoma มาก่อน: เส้นหนาทึบ อ่านชัดบนหัวพิมพ์ความร้อน และติดมากับ Windows ทุกเครื่อง
       ห้ามใส่ Sarabun/TH Sarabun New ไว้หน้า — เส้นบางมาก พิมพ์ออกมาจางและขาดเป็นช่วง
       (โปรเจกต์นี้ไม่ได้โหลดฟอนต์ Sarabun มาด้วยซ้ำ ดู public/index.html) */
    font-family: Tahoma, "Leelawadee UI", "Segoe UI", sans-serif;
    /* ตัวหนาทั้งฟอร์มเป็นค่าเริ่มต้น — หัวพิมพ์ความร้อนพิมพ์เส้นบางได้ไม่ดี
       ตัวไหนต้องหนากว่านี้ค่อยกำหนด 800 ทับเป็นรายตัว */
    font-weight: 700;
    color: #000;
  }

  /* ---- หมุนทั้งฟอร์ม 90 องศา ----
     กล่องหน้ากระดาษสลับด้าน แล้วหมุนผืนงานรอบมุมบนซ้าย
     จากนั้นดันกลับมาทางขวาเท่ากับความสูงผืนงาน จึงพอดีกล่องใหม่เป๊ะ */
  .pk-label.is-rot {
    width: ${ART_H}mm;
    height: ${ART_W}mm;
  }
  .pk-label.is-rot .pk-canvas {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: top left;
    transform: translateX(${ART_H}mm) rotate(90deg);
  }

  /* กรอบสี่เหลี่ยมขอบมน ครอบเนื้อหาทั้งดวง */
  .pk-frame {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border: 1.5pt solid #000;
    border-radius: 3mm;
    padding: 2.5mm 3mm;
    display: flex;
    flex-direction: column;
  }

  /* ---- เนื้อหาหลัก: ซ้าย = สินค้า / ขวา = รหัสลูกค้า + QR ---- */
  .pk-body {
    flex: 1 1 auto;
    display: flex;
    gap: 3mm;
    min-height: 0;
  }

  /* ---- คอลัมน์ซ้าย ---- */
  .pk-left {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .pk-cus-sm {
    font-size: 17.5pt;
    font-weight: 800;
    line-height: 1;
  }
  .pk-name {
    margin-top: auto;
    font-size: 25pt;
    font-weight: 800;
    line-height: 1.1;
    /* กันพื้นที่ไว้ 2 บรรทัดเสมอ ชื่อสั้นหรือยาว "ถุงที่" ก็อยู่ระดับเดียวกัน
       ไม่กระโดดขึ้นลงตามความยาวชื่อสินค้า */
    min-height: 2.2em;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-word;
  }
  .pk-bag {
    margin-top: 1mm;
    font-size: 18pt;
    font-weight: 800;
    line-height: 1.3;
  }

  /* ---- ตัวอักษรขนาดเล็กบนหัวพิมพ์ความร้อน ----
     ต่อให้หนา 800 แล้ว เส้นก็ยังบางจนพิมพ์ออกมาขาดเป็นช่วง
     เติมเส้นขอบสีเดียวกับตัวอักษรเพื่อถมให้อ้วนขึ้นอีกนิด
     paint-order ให้วาดเส้นขอบก่อนแล้วค่อยถมข้างใน หัวและสระไทยจะไม่ตัน */
  .pk-bag,
  .pk-brand,
  .pk-foot {
    -webkit-text-stroke: 0.3px currentColor;
    paint-order: stroke fill;
  }
  .pk-weight {
    margin-top: auto;
    display: flex;
    align-items: baseline;
    gap: 2mm;
    line-height: 1;
  }
  .pk-weight .num { font-size: 34.5pt; font-weight: 800; }
  .pk-weight .unit { font-size: 22.5pt; font-weight: 800; }

  /* ---- คอลัมน์ขวา ---- */
  .pk-right {
    flex: 0 0 auto;
    width: 34mm;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .pk-cus-box {
    width: 100%;
    box-sizing: border-box;
    border: 2.5pt solid #000;
    text-align: center;
    padding: 1mm 1mm 1.4mm 1mm;
    font-size: 26.5pt;
    font-weight: 800;
    line-height: 1.05;
    word-break: break-all;
  }
  .pk-brand {
    margin-top: 1mm;
    font-size: 13pt;
    font-weight: 700;
    letter-spacing: 1.2pt;
    text-align: center;
  }
  .pk-qr {
    margin-top: 1mm;
    display: flex;
    justify-content: center;
  }
  .pk-qr svg { display: block; width: 24mm; height: 24mm; }

  /* ---- แถบล่าง ---- */
  .pk-foot {
    flex: 0 0 auto;
    margin-top: 1.5mm;
    padding-top: 1.5mm;
    border-top: 2pt solid #000;
    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    gap: 4mm;
    font-size: 17pt;
    font-weight: 800;
  }
  .pk-foot .vl { font-weight: 800; }

  /* ---- ความต่างระหว่างจอกับกระดาษ มีได้แค่ตรงนี้ (ไม่กระทบ layout ในดวง) ---- */
  @media screen {
    .pk-label { margin: 0 auto 8px auto; box-shadow: 0 2px 10px rgba(0,0,0,.12); }
  }
  @media print {
    html, body { margin: 0; padding: 0; }
    .pk-label { margin: 0; box-shadow: none; }
  }
`;

/** 10.00 -> 10, 5.50 -> 5.5 */
const fmtWeight = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : String(v ?? "");
};

const FormPKBarcode = forwardRef(
  ({ printData, offsetX = 0, offsetY = 0, rotate = 0 }, ref) => {
    const groups = Array.isArray(printData) ? printData : [];
    const isRot = Number(rotate) === 90;

    /* แผ่ทุกดวงออกเป็นลิสต์เดียว แต่ยังเก็บ "ถุงที่ x/y" ของแต่ละรายการไว้ */
    const flat = [];
    groups.forEach((group, gi) => {
      const items = Array.isArray(group) ? group : [];
      items.forEach((data, i) => {
        flat.push({
          data,
          bagNo: i + 1,
          bagTotal: items.length,
          key: `${gi}-${data?.package_id ?? i}`,
        });
      });
    });

    return (
      /* ใส่ค่าชดเชยเป็น inline style บน element ที่ react-to-print โคลนไปด้วย
         ค่าจึงมีผลทั้งบนจอและบนกระดาษเท่ากันเป๊ะ */
      <div
        ref={ref}
        id="pk-print-root"
        style={{ "--pk-off-x": `${offsetX}mm`, "--pk-off-y": `${offsetY}mm` }}
      >
        {/* CSS ชุดเดียวกับที่ส่งเข้า pageStyle ตอนปริ้น -> preview = print
            ส่วน @page ประกาศที่ ModalPreviewPKBarcode ที่เดียว */}
        <style>{PK_LABEL_STYLE}</style>

        {/* วาง .pk-label เป็น block เรียงตรงๆ ห้ามมี element ห่อ
            ไม่งั้นจุดขึ้นหน้าใหม่เพี้ยน งานพิมพ์จะเลื่อนคร่อมรอยไดคัท */}
        {flat.map(({ data, bagNo, bagTotal, key }) => (
          <div className={`pk-label${isRot ? " is-rot" : ""}`} key={key}>
            <div className="pk-canvas">
              <div className="pk-frame">
                <div className="pk-body">
                  <div className="pk-left">
                    <div className="pk-cus-sm">{data?.cuscode}</div>

                    <div className="pk-name">{data?.stname}</div>
                    <div className="pk-bag">
                      ถุงที่ {bagNo}/{bagTotal}
                    </div>

                    <div className="pk-weight">
                      <span className="num">{fmtWeight(data?.sup_weight)}</span>
                      <span className="unit">{data?.unit || "กก."}</span>
                    </div>
                  </div>

                  <div className="pk-right">
                    <div className="pk-cus-box">{data?.cuscode}</div>
                    <div className="pk-brand">PREVAIL</div>
                    <div className="pk-qr">
                      <QRCodeSVG
                        size={256}
                        level="M"
                        value={String(data?.package_id ?? "")}
                      />
                    </div>
                  </div>
                </div>

                <div className="pk-foot">
                  <span className="lb">เลขที่เอกสาร</span>
                  <span className="vl">{data?.socode}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

export default FormPKBarcode;
