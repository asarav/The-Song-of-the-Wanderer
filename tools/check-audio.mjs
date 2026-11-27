#!/usr/bin/env node
/**
 * Validate the shipped audio catalog and its licensing ledger.
 *
 * This is deliberately offline: it checks committed files and recorded sources, not the
 * network. `pnpm audio:build` is the authoring path that refreshes both.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const MANIFEST = join(ROOT, 'assets', 'audio', 'manifest.json')
const PUBLIC_AUDIO = join(ROOT, 'public', 'audio')
const KINDS = new Set(['ambience', 'music', 'sfx'])
const LICENSES = new Set(['cc0', 'public-domain'])

function fail(message) {
  console.error(`audio:check - ${message}`)
  process.exitCode = 1
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

let manifest
try {
  manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
} catch (error) {
  fail(`cannot read ${MANIFEST}: ${error.message}`)
  process.exit(1)
}

if (manifest.version !== 1) fail(`unsupported manifest version ${manifest.version}`)
if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
  fail('manifest has no assets')
}

const assets = Array.isArray(manifest.assets) ? manifest.assets : []
const ids = new Set()
const files = new Set()

for (const asset of assets) {
  const id = text(asset.id)
  const file = text(asset.file)
  if (!/^audio\.(ambient|music|sfx)\.[a-z0-9.-]+$/.test(id)) {
    fail(`invalid asset id "${id}"`)
    continue
  }
  if (ids.has(id)) fail(`duplicate asset id "${id}"`)
  ids.add(id)

  if (!KINDS.has(asset.kind)) fail(`${id}: invalid kind "${asset.kind}"`)
  if (!LICENSES.has(asset.license)) fail(`${id}: license "${asset.license}" is not shippable`)
  if (text(asset.title).length < 3) fail(`${id}: missing title`)
  if (text(asset.note).length < 20) fail(`${id}: missing usage note`)
  if (text(asset.performer).length < 3) fail(`${id}: missing performer`)
  if (!text(asset.recordingDate)) fail(`${id}: missing recording date`)
  if (!(asset.volume > 0 && asset.volume <= 1)) fail(`${id}: volume must be (0, 1]`)
  if (asset.loop !== (asset.kind !== 'sfx')) fail(`${id}: loop flag does not match kind`)
  if (asset.use !== 'shipped') fail(`${id}: use is "${asset.use}", not shipped`)
  if (asset.reviewStatus !== 'licensed') fail(`${id}: review is not licensed`)
  if (asset.kind === 'ambience' && !text(asset.environment)) fail(`${id}: ambience has no environment`)

  if (!file || basename(file) !== file || !file.endsWith('.mp3')) {
    fail(`${id}: file must be a bare .mp3 name`)
    continue
  }
  if (files.has(file)) fail(`${id}: file "${file}" is reused by another asset`)
  files.add(file)
  const path = join(PUBLIC_AUDIO, file)
  if (!existsSync(path)) {
    fail(`${id}: missing public/audio/${file}`)
  } else if (statSync(path).size < 1000) {
    fail(`${id}: public/audio/${file} is suspiciously small`)
  }

  if (!Array.isArray(asset.sources) || asset.sources.length === 0) {
    fail(`${id}: no sources recorded`)
    continue
  }
  for (const source of asset.sources) {
    if (!LICENSES.has(source.license)) {
      fail(`${id}: source "${source.name}" has license "${source.license}"`)
    }
    if (text(source.author).length < 3) fail(`${id}: source "${source.name}" has no author`)
    if (text(source.performer).length < 3) {
      fail(`${id}: source "${source.name}" has no performer`)
    }
    if (!text(source.recordingDate)) {
      fail(`${id}: source "${source.name}" has no recording date`)
    }
    if (text(source.modification).length < 10) {
      fail(`${id}: source "${source.name}" has no modification note`)
    }
    if (source.url !== null && !/^https:\/\//.test(source.url)) {
      fail(`${id}: source "${source.name}" has an invalid URL`)
    }
  }
}

const diskFiles = existsSync(PUBLIC_AUDIO)
  ? readdirSync(PUBLIC_AUDIO).filter((name) => name.endsWith('.mp3'))
  : []
for (const file of diskFiles) {
  if (!files.has(file)) fail(`public/audio/${file} is not in the manifest`)
}

if (process.exitCode) {
  console.error(`audio:check - ${assets.length} assets, errors above`)
} else {
  console.log(
    `audio:check - ${assets.length} assets, ${files.size} files, 0 errors, 0 warnings`,
  )
}
