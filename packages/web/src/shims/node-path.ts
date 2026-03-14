// Browser shim for node:path
export function join(...parts: string[]): string {
  return parts.join("/").replace(/\/+/g, "/")
}
export function resolve(...parts: string[]): string {
  return join(...parts)
}
export function dirname(p: string): string {
  return p.split("/").slice(0, -1).join("/") || "/"
}
export function basename(p: string, ext?: string): string {
  const base = p.split("/").pop() || ""
  if (ext && base.endsWith(ext)) return base.slice(0, -ext.length)
  return base
}
export function extname(p: string): string {
  const base = basename(p)
  const idx = base.lastIndexOf(".")
  return idx >= 0 ? base.slice(idx) : ""
}
export function parse(p: string): { root: string; dir: string; base: string; ext: string; name: string } {
  const dir = dirname(p)
  const base = basename(p)
  const ext = extname(p)
  const name = ext ? base.slice(0, -ext.length) : base
  return { root: p.startsWith("/") ? "/" : "", dir, base, ext, name }
}
export function isAbsolute(p: string): boolean {
  return p.startsWith("/")
}
export function relative(from: string, to: string): string {
  return to.replace(from, "").replace(/^\//, "")
}
export const sep = "/"
export default { join, resolve, dirname, basename, extname, parse, isAbsolute, relative, sep }
