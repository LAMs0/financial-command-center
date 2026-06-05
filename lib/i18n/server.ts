import { cookies } from "next/headers";
import { localeCookieName, normalizeLocale, type Locale } from "./config";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return normalizeLocale(store.get(localeCookieName)?.value);
}
