/**
 * Source checks for the Arabic UI (2026-10-25), used by scripts/i18n-scan.ts and
 * tests/unit/i18n.test.ts:
 *   scanFile        English a user would read that is not inside t(…) / msg(…)
 *   collectKeys     the literal keys passed to t(…), t.plural(…), msg(…)
 * Heuristic: a string that looks like data, a CSS class or an id is skipped; a line ending in
 * `// i18n-ignore` (or the line above it) is skipped.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

export const ROOT = process.cwd();
export const UI_DIRS = ["src/components", "src/app", "src/hooks"];
export const SKIP_FILES = [
  /src[\\/]components[\\/]dev[\\/]/,
  /\.test\.tsx?$/,
  /[\\/]i18n[\\/]/,
  /[\\/]app[\\/]api[\\/]/,
];

const NON_TEXT_ATTRS = new Set(
  (
    "className class href id key variant size type name role src as side align dir lang htmlFor tone " +
    "mode method target rel inputMode autoComplete orientation form accept sizes fill stroke d viewBox " +
    "value defaultValue transform style icon status kind position layoutId path points strokeLinecap " +
    "strokeLinejoin textAnchor dominantBaseline fontFamily gradientUnits aria-controls aria-describedby " +
    "aria-labelledby aria-live aria-current aria-haspopup aria-sort aria-orientation aria-autocomplete " +
    "enterKeyHint download sandbox loading decoding referrerPolicy colorScheme pattern scope headers " +
    "tab section phase filter"
  ).split(" "),
);
const NON_TEXT_CALLS = new Set(
  (
    "t msg plural auto cn clsx cva require useQuery fetch api getByRole getByText querySelector " +
    "querySelectorAll getElementById addEventListener removeEventListener dispatchEvent setAttribute " +
    "getItem setItem removeItem matchMedia replaceState pushState push replace startsWith endsWith " +
    "includes split join get set has delete append createElement Event CustomEvent HashChangeEvent URL " +
    "URLSearchParams RegExp Intl DateTimeFormat NumberFormat localeCompare toLocaleString useParams " +
    "useSearchParams redirect notFound invalidateQueries setQueryData getQueryData cancelQueries " +
    "translate translatePlural translateText format"
  ).split(" "),
);
const NON_TEXT_PROPS = new Set(
  (
    "className href id key queryKey method variant size tone icon value kind type status fill color ease " +
    "mode side align background backgroundColor borderColor boxShadow transform transition " +
    "gridTemplateColumns fontFamily width height inset clipPath maskImage WebkitMaskImage " +
    "backgroundImage accept anchor testId tab section phase Accept Content-Type"
  ).split(" "),
);

/** A string a user would read: has letters, and looks like words, not an id or a class list. */
export function isProse(s: string): boolean {
  const text = s.trim();
  if (!/[A-Za-z]{2,}/.test(text)) return false;
  if (/^(https?:|\/|\.\/|#|@|data:|mailto:)/.test(text)) return false;
  if (/^[a-z0-9_.:\-/[\]()%#>*!=,"'@~&]+$/.test(text)) return false; // id, slug, key, one class
  const tokens = text.split(/\s+/);
  const classy = tokens.every((tk) => /^[a-z0-9!:[\]\-_/.%#()&>*=,"'@~+]+$/.test(tk));
  if (classy && tokens.some((tk) => /[-:[]/.test(tk))) return false; // a Tailwind class list
  if (
    /^(var|calc|rgba?|oklch|color-mix|linear-gradient|conic-gradient|radial-gradient)\(/.test(text)
  )
    return false;
  if (/^[A-Z_]+$/.test(text)) return false; // CONSTANT
  if (/^[A-Z][a-zA-Z]+$/.test(text) && /[a-z][A-Z]/.test(text)) return false; // PascalCase identifier
  if (/^(application|text|image|font|video|audio)\/[\w.+-]+/.test(text)) return false; // mime
  if (/^[\d\s.,%:x×+-]+[a-z]{1,3}$/.test(text)) return false; // 12px, 0.5s
  return /^[A-Z]/.test(text) || /\s/.test(text) || /[.?!…:]$/.test(text);
}

function calleeName(expr: ts.Expression): string {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
  return "";
}

export interface Hit {
  file: string;
  line: number;
  kind: string;
  text: string;
}

const rel = (file: string) => path.relative(ROOT, file).replace(/\\/g, "/");
const parse = (file: string) =>
  ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

function ignored(sf: ts.SourceFile, line: number): boolean {
  const lines = sf.text.split(/\r?\n/);
  return /i18n-ignore/.test(lines[line - 1] ?? "") || /i18n-ignore/.test(lines[line - 2] ?? "");
}

export function scanFile(file: string): Hit[] {
  const sf = parse(file);
  const hits: Hit[] = [];
  const add = (node: ts.Node, kind: string, s: string) => {
    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
    if (ignored(sf, line)) return;
    hits.push({ file: rel(file), line, kind, text: s.replace(/\s+/g, " ").trim().slice(0, 110) });
  };

  const insideNonText = (node: ts.Node): boolean => {
    for (let p = node.parent; p; p = p.parent) {
      if (ts.isCallExpression(p) || ts.isNewExpression(p)) {
        const name = calleeName(p.expression);
        if (NON_TEXT_CALLS.has(name)) return true;
        if (ts.isCallExpression(p.expression) && calleeName(p.expression.expression) === "currentT")
          return true; // currentT()("…")
        if (ts.isPropertyAccessExpression(p.expression)) {
          const obj = p.expression.expression;
          if (ts.isIdentifier(obj) && obj.text === "console") return true;
        }
        if (name === "Error" || name === "ApiClientError") return true;
      }
      if (ts.isJsxAttribute(p)) {
        const n = p.name.getText(sf);
        return NON_TEXT_ATTRS.has(n) || n.startsWith("data-");
      }
      if (ts.isPropertyAssignment(p)) {
        const n = p.name.getText(sf).replace(/^["']|["']$/g, "");
        if (NON_TEXT_PROPS.has(n)) return true;
      }
      if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p)) return true;
      if (ts.isElementAccessExpression(p) && node.pos >= p.argumentExpression.pos) return true;
      if (ts.isBinaryExpression(p) && /^(===|!==|==|!=)$/.test(p.operatorToken.getText(sf)))
        return true;
      if (ts.isCaseClause(p) && node.pos < p.statements.pos) return true;
      if (ts.isTypeNode(p) || ts.isTypeAliasDeclaration(p) || ts.isInterfaceDeclaration(p))
        return true;
      if (ts.isTaggedTemplateExpression(p)) return true;
      if (ts.isJsxExpression(p) || ts.isJsxElement(p) || ts.isFunctionLike(p)) break;
    }
    return false;
  };

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      const s = node.text.trim();
      if (/[A-Za-z]{2,}/.test(s)) add(node, "jsx-text", s);
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const directive = ts.isExpressionStatement(node.parent); // "use client"
      if (!directive && isProse(node.text) && !insideNonText(node)) {
        const kind = ts.isJsxAttribute(node.parent)
          ? `attr:${node.parent.name.getText(sf)}`
          : "string";
        add(node, kind, node.text);
      }
    } else if (ts.isTemplateExpression(node)) {
      const raw = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(" {} ");
      if (
        isProse(raw.replace(/\{\}/g, "")) &&
        /[A-Za-z]{2,}\s|\s[A-Za-z]{2,}/.test(raw) &&
        !insideNonText(node)
      )
        add(node, "template", raw);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

export interface Key {
  file: string;
  line: number;
  key: string;
}

const literal = (n: ts.Node | undefined): string | null =>
  n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ? n.text : null;

/** Keys passed as literals to t("…"), t.plural(n, "…", "…"), msg("…"), currentT()("…"). */
export function collectKeys(file: string): Key[] {
  const sf = parse(file);
  const keys: Key[] = [];
  const add = (node: ts.Node, key: string | null) => {
    if (key == null) return;
    keys.push({
      file: rel(file),
      line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
      key,
    });
  };
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const e = node.expression;
      if (ts.isIdentifier(e) && (e.text === "t" || e.text === "msg"))
        add(node, literal(node.arguments[0]));
      else if (ts.isCallExpression(e) && calleeName(e.expression) === "currentT")
        add(node, literal(node.arguments[0]));
      else if (ts.isPropertyAccessExpression(e) && e.name.text === "plural") {
        add(node, literal(node.arguments[2])); // the English plural is the key
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return keys;
}

export function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

/** Files or folders (relative to the repo) → .ts/.tsx files, minus the skipped ones. */
export function resolveFiles(args: string[], skip = true): string[] {
  const files: string[] = [];
  for (const a of args.length ? args : UI_DIRS) {
    const p = path.resolve(ROOT, a);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else files.push(p);
  }
  return skip ? files.filter((f) => !SKIP_FILES.some((re) => re.test(f))) : files;
}

export const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
