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
  type ContentIndex,
  type RawEntityFile,
  type RawPack,
} from '@engine/content'
import type { EntityFolder, Manifest } from '@engine/content'

type ModuleMap = Record<string, unknown>

const modules = import.meta.glob('../content/packs/**/*.json', {
  eager: true,
  import: 'default',
}) as ModuleMap

function loadPacks(): RawPack[] {
  const packs = new Map<string, { manifest: Manifest | null; files: RawEntityFile[] }>()

  for (const [path, data] of Object.entries(modules)) {
    const relative = path.replace(/^\.\.\/content\/packs\//, '')
    const segments = relative.split('/')
    const packId = segments[0]
    if (!packId) continue

    const entry = packs.get(packId) ?? { manifest: null, files: [] }

    if (segments.length === 2 && segments[1] === 'manifest.json') {
      entry.manifest = data as Manifest
    } else if (segments.length === 3) {
      entry.files.push({
        folder: segments[1] as EntityFolder,
        file: segments[2] as string,
        data,
      })
    }

    packs.set(packId, entry)
  }

  return [...packs.entries()]
    .filter(([, entry]) => entry.manifest !== null)
    .map(([, entry]) => ({ manifest: entry.manifest as Manifest, files: entry.files }))
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
