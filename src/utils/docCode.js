/* เรียงเลขที่เอกสารให้ถูก เมื่อมีทั้งเลขรัน 3 หลัก (IV6911999) และ 4 หลัก (IV69111000)
   เทียบความยาวก่อน แล้วค่อยเทียบตัวอักษร */
export const docCodeCompare = (a, b) => {
  const x = String(a || ""), y = String(b || "");
  return x.length - y.length || x.localeCompare(y);
};
