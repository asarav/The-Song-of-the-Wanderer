/**
 * Loads the authored packs into a content index for the browser.
 *
 * Vite inlines the JSON at build time; nothing is fetched at runtime. The same
 * `buildContentIndex` validator runs here, so a content mistake shows up in the console
 * in development exactly as `pnpm content:lint` would report it.
 */

import {
  buildContentIndex,
  contentErrorCount,
  ENTITY_SCHEMAS,
  type ContentIndex,
  type EntityFolder,
  type RawEntityFile,
  type RawPack,
} from '@engine/content'

type ModuleMap = Record<string, unknown>

const modules = import.meta.glob('../content/packs/**/*.json', {
  eager: true,
  import: 'default',
}) as ModuleMap

function isEntityFolder(value: string | undefined): value is EntityFolder {
  return value !== undefined && Object.hasOwn(ENTITY_SCHEMAS, value)
}

function loadPacks(): RawPack[] {
  const packs = new Map<string, { manifest: unknown | null; files: RawEntityFile[] }>()

  for (const [path, data] of Object.entries(modules)) {
    const relative = path.replace(/^\.\.\/content\/packs\//, '')
    const segments = relative.split('/')
    const packId = segments[0]
    if (!packId) continue

    const entry = packs.get(packId) ?? { manifest: null, files: [] }

    if (segments.length === 2 && segments[1] === 'manifest.json') {
      entry.manifest = data
    } else if (segments.length === 3 && isEntityFolder(segments[1]) && segments[2]) {
      entry.files.push({
        folder: segments[1],
        file: segments[2],
        data,
      })
    }

    packs.set(packId, entry)
  }

  return [...packs.values()].flatMap((entry) =>
    entry.manifest === null ? [] : [{ manifest: entry.manifest, files: entry.files }],
  )
}

let cached: ContentIndex | null = null

export function loadContentIndex(): ContentIndex {
  if (cached) return cached

  const built = buildContentIndex(loadPacks())
  if (import.meta.env.DEV && contentErrorCount(built.issues) > 0) {
    for (const issue of built.issues) {
      console.error(`content ${issue.level} ${issue.path}: ${issue.message}`)
    }
  }

  cached = built.index
  return cached
}
