/** Split plain text into reader pages. Pure; used by the document reader (P5.6). */

/** ~3,400 characters per A4 page, cut at paragraph or line boundaries (RDD §8.3). */
export function paginate(text: string, size = 3_400): string[] {
  const pages: string[] = [];
  let rest = text.replace(/\r\n/g, "\n").trim();
  while (rest.length > size) {
    let cut = rest.lastIndexOf("\n\n", size);
    if (cut < size * 0.5) cut = rest.lastIndexOf("\n", size);
    if (cut < size * 0.5) cut = rest.lastIndexOf(" ", size);
    if (cut <= 0) cut = size;
    pages.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  if (rest || !pages.length) pages.push(rest);
  return pages;
}
