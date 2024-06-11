export const BASE_URL = process.env.REACT_APP_BASE_URL;

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const formatMoney = (amount, decimalCount) => {
  try {
    let decimal = ".",
      thousands = ",";
    decimalCount = Math.abs(decimalCount);
    decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

    const negativeSign = amount < 0 ? "-" : "";

    let i = parseInt(
      (amount = Math.abs(Number(amount) || 0).toFixed(decimalCount))
    ).toString();
    let j = i.length > 3 ? i.length % 3 : 0;

    return (
      negativeSign +
      (j ? i.substr(0, j) + thousands : "") +
      i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) +
      (decimalCount
        ? decimal +
          Math.abs(amount - i)
            .toFixed(decimalCount)
            .slice(2)
        : "")
    );
  } catch (e) {
    console.log(e);
  }
};

export const PROVINCE_OPTIONS = [
  { label: "กรุงเทพมหานคร", value: "กรุงเทพมหานคร" },
  { label: "กระบี่", value: "กระบี่" },
  { label: "กาญจนบุรี", value: "กาญจนบุรี" },
  { label: "กาฬสินธุ์", value: "กาฬสินธุ์" },
  { label: "กำแพงเพชร", value: "กำแพงเพชร" },
  { label: "ขอนแก่น", value: "ขอนแก่น" },
  { label: "จันทบุรี", value: "จันทบุรี" },
  { label: "ฉะเชิงเทรา", value: "ฉะเชิงเทรา" },
  { label: "ชัยนาท", value: "ชัยนาท" },
  { label: "ชัยภูมิ", value: "ชัยภูมิ" },
  { label: "ชุมพร", value: "ชุมพร" },
  { label: "ชลบุรี", value: "ชลบุรี" },
  { label: "เชียงใหม่", value: "เชียงใหม่" },
  { label: "เชียงราย", value: "เชียงราย" },
  { label: "ตรัง", value: "ตรัง" },
  { label: "ตราด", value: "ตราด" },
  { label: "ตาก", value: "ตาก" },
  { label: "นครนายก", value: "นครนายก" },
  { label: "นครปฐม", value: "นครปฐม" },
  { label: "นครพนม", value: "นครพนม" },
  { label: "นครราชสีมา", value: "นครราชสีมา" },
  { label: "นครศรีธรรมราช", value: "นครศรีธรรมราช" },
  { label: "นครสวรรค์", value: "นครสวรรค์" },
  { label: "นราธิวาส", value: "นราธิวาส" },
  { label: "น่าน", value: "น่าน" },
  { label: "นนทบุรี", value: "นนทบุรี" },
  { label: "บึงกาฬ", value: "บึงกาฬ" },
  { label: "บุรีรัมย์", value: "บุรีรัมย์" },
  { label: "ประจวบคีรีขันธ์", value: "ประจวบคีรีขันธ์" },
  { label: "ปทุมธานี", value: "ปทุมธานี" },
  { label: "ปราจีนบุรี", value: "ปราจีนบุรี" },
  { label: "ปัตตานี", value: "ปัตตานี" },
  { label: "พะเยา", value: "พะเยา" },
  { label: "พระนครศรีอยุธยา", value: "พระนครศรีอยุธยา" },
  { label: "พังงา", value: "พังงา" },
  { label: "พิจิตร", value: "พิจิตร" },
  { label: "พิษณุโลก", value: "พิษณุโลก" },
  { label: "เพชรบุรี", value: "เพชรบุรี" },
  { label: "แพร่", value: "แพร่" },
  { label: "พัทลุง", value: "พัทลุง" },
  { label: "ภูเก็ต", value: "ภูเก็ต" },
  { label: "มหาสารคาม", value: "มหาสารคาม" },
  { label: "มุกดาหาร", value: "มุกดาหาร" },
  { label: "แม่ฮ่องสอน", value: "แม่ฮ่องสอน" },
  { label: "ยโสธร", value: "ยโสธร" },
  { label: "ยะลา", value: "ยะลา" },
  { label: "ร้อยเอ็ด", value: "ร้อยเอ็ด" },
  { label: "ระนอง", value: "ระนอง" },
  { label: "ระยอง", value: "ระยอง" },
  { label: "ราชบุรี", value: "ราชบุรี" },
  { label: "ลพบุรี", value: "ลพบุรี" },
  { label: "ลำปาง", value: "ลำปาง" },
  { label: "ลำพูน", value: "ลำพูน" },
  { label: "เลย", value: "เลย" },
  { label: "ศรีสะเกษ", value: "ศรีสะเกษ" },
  { label: "สกลนคร", value: "สกลนคร" },
  { label: "สงขลา", value: "สงขลา" },
  { label: "สมุทรสาคร", value: "สมุทรสาคร" },
  { label: "สมุทรปราการ", value: "สมุทรปราการ" },
  { label: "สมุทรสงคราม", value: "สมุทรสงคราม" },
  { label: "สระแก้ว", value: "สระแก้ว" },
  { label: "สระบุรี", value: "สระบุรี" },
  { label: "สิงห์บุรี", value: "สิงห์บุรี" },
  { label: "สุโขทัย", value: "สุโขทัย" },
  { label: "สุพรรณบุรี", value: "สุพรรณบุรี" },
  { label: "สุราษฎร์ธานี", value: "สุราษฎร์ธานี" },
  { label: "สุรินทร์", value: "สุรินทร์" },
  { label: "สตูล", value: "สตูล" },
  { label: "หนองคาย", value: "หนองคาย" },
  { label: "หนองบัวลำภู", value: "หนองบัวลำภู" },
  { label: "อำนาจเจริญ", value: "อำนาจเจริญ" },
  { label: "อุดรธานี", value: "อุดรธานี" },
  { label: "อุตรดิตถ์", value: "อุตรดิตถ์" },
  { label: "อุทัยธานี", value: "อุทัยธานี" },
  { label: "อุบลราชธานี", value: "อุบลราชธานี" },
  { label: "อ่างทอง", value: "อ่างทอง" },
];

export const capitalized = (word) =>
  word
    .split(/\s|-/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const formatFileSize = (fileSizeInBytes) => {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (Number(fileSizeInBytes) === 0) return "0 Byte";
  const i = parseInt(Math.floor(Math.log(fileSizeInBytes) / Math.log(1024)));
  return Math.round(fileSizeInBytes / Math.pow(1024, i), 2) + " " + sizes[i];
};

export const comma = (number, dmax = 2, dmin = 0) =>
  number.toLocaleString("en-US", {
    minimumFractionDigits: dmin,
    maximumFractionDigits: dmax,
  });

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const filterOption = (input, option) =>
  (option?.label ?? "").toLowerCase().includes(input.toLowerCase());
