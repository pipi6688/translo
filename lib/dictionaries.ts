export type DictionaryId = 'google';

export interface DictionaryProvider {
  id: DictionaryId;
  name: string;
  translate: (text: string, from: string, to: string) => Promise<string>;
}

async function googleTranslate(
  text: string,
  from: string,
  to: string,
): Promise<string> {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: from,
    tl: to,
    dt: 't',
    q: text,
  });
  const res = await fetch(
    `https://translate.googleapis.com/translate_a/single?${params}`,
  );
  if (!res.ok) throw new Error(`Google Translate: ${res.status}`);
  const data = await res.json();
  return data[0].map((item: [string, ...unknown[]]) => item[0]).join('');
}

export const DICTIONARIES: Record<DictionaryId, DictionaryProvider> = {
  google: { id: 'google', name: 'Google Translate', translate: googleTranslate },
};

export const ALL_DICTIONARY_IDS: DictionaryId[] = ['google'];
