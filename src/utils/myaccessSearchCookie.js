import dayjs from "dayjs";
import {
  setCookieWithPrefix,
  getCookieWithPrefix,
  deleteCookieWithPrefix,
} from "./util";

const COOKIE_FIELD = "__myaccess_search";

const serialize = (value) => {
  if (dayjs.isDayjs(value)) {
    return { __type: "dayjs", value: value.toISOString() };
  }

  if (Array.isArray(value)) {
    if (value.length === 2 && dayjs.isDayjs(value[0]) && dayjs.isDayjs(value[1])) {
      return {
        __type: "dayjs_range",
        value: [value[0].toISOString(), value[1].toISOString()],
      };
    }

    return value.map(serialize);
  }

  if (value && typeof value === "object") {
    const out = {};
    Object.keys(value).forEach((k) => {
      out[k] = serialize(value[k]);
    });
    return out;
  }

  return value;
};

const revive = (value) => {
  if (Array.isArray(value)) return value.map(revive);

  if (value && typeof value === "object") {
    if (value.__type === "dayjs") return dayjs(value.value);
    if (value.__type === "dayjs_range") return value.value.map((v) => dayjs(v));

    const out = {};
    Object.keys(value).forEach((k) => {
      out[k] = revive(value[k]);
    });
    return out;
  }

  return value;
};

export const saveMyAccessSearchCookie = (pageKey, formValues, days = 7) => {
  try {
    const json = JSON.stringify(serialize(formValues));
    setCookieWithPrefix(pageKey, COOKIE_FIELD, json, days);
  } catch (err) {
    console.warn("Failed to save MyAccess search cookie:", err);
  }
};

export const loadMyAccessSearchCookie = (pageKey) => {
  try {
    const json = getCookieWithPrefix(pageKey, COOKIE_FIELD);
    if (!json) return null;

    const parsed = JSON.parse(json);
    return revive(parsed);
  } catch (err) {
    console.warn("Failed to load MyAccess search cookie:", err);
    return null;
  }
};

export const clearMyAccessSearchCookie = (pageKey) => {
  deleteCookieWithPrefix(pageKey, COOKIE_FIELD);
};
