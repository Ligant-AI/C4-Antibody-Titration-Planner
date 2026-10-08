/** Vite's `?raw` suffix imports a file's contents as a string. Used by tests only. */
declare module '*.md?raw' {
  const content: string
  export default content
}
