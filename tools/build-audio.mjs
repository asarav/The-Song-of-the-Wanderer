#!/usr/bin/env node
/**
 * Build the slice's exploratory audio.
 *
 * The ambient beds are trimmed, filtered and mixed from CC0 field recordings at
 * BigSoundBank. The music and one-shot effects are original procedural synthesis, so the
 * project owns them and can dedicate them to CC0. Nothing here claims to reproduce a
 * surviving Bronze Age melody: the modal sketches are atmosphere, not reconstruction.
 *
 * This is an authoring pipeline, not a runtime dependency. It needs ffmpeg on PATH and
 * network access the first time it runs; the built files and manifest are committed.
 *
 *   pnpm audio:build
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const CACHE = join(ROOT, '.cache', 'audio')
const OUT = join(ROOT, 'public', 'audio')
const GENERATED = join(CACHE, 'generated')
const MANIFEST = join(ROOT, 'assets', 'audio', 'manifest.json')
const SR = 44_100

const SOURCES = {
  2573: {
    name: 'Gulls on the Harbor',
    page: 'https://bigsoundbank.com/gulls-on-the-harbor-s2573.html',
    url: 'https://bigsoundbank.com/UPLOAD/mp3/2573.mp3',
    author: 'Joseph SARDIN',
    license: 'cc0',
  },
  2728: {
    name: 'Outdoor Market #1',
    page: 'https://bigsoundbank.com/outdoor-market-1-s2728.html',
    url: 'https://bigsoundbank.com/UPLOAD/mp3/2728.mp3',
    author: 'Joseph SARDIN',
    license: 'cc0',
  },
  3589: {
    name: 'Anvil #1',
    page: 'https://bigsoundbank.com/anvil-1-s3589.html',
    url: 'https://bigsoundbank.com/UPLOAD/mp3/3589.mp3',
    author: 'Joseph SARDIN',
    license: 'cc0',
  },
  30: {
    name: 'Fireplace #1',
    page: 'https://bigsoundbank.com/fireplace-1-s0030.html',
    url: 'https://bigsoundbank.com/UPLOAD/mp3/0030.mp3',
    author: 'Joseph SARDIN',
    license: 'cc0',
  },
  1020: {
    name: 'Field Cricket',
    page: 'https://bigsoundbank.com/field-cricket-s1020.html',
    url: 'https://bigsoundbank.com/UPLOAD/mp3/1020.mp3',
    author: 'Joseph SARDIN',
    license: 'cc0',
  },
  997: {
    name: 'Frogs #1',
    page: 'https://bigsoundbank.com/frogs-1-s0997.html',
    url: 'https://bigsoundbank.com/UPLOAD/mp3/0997.mp3',
    author: 'Joseph SARDIN',
    license: 'cc0',
  },
  265: {
    name: 'Beach: Small Waves',
    page: 'https://bigsoundbank.com/beach-small-waves-s0265.html',
    url: 'https://bigsoundbank.com/UPLOAD/mp3/0265.mp3',
    author: 'Joseph SARDIN',
    license: 'cc0',
  },
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.status !== 0) {
    throw new Error(`${command} exited with ${result.status ?? 'no status'}`)
  }
}

async function downloadSource(id) {
  const source = SOURCES[id]
  const path = join(CACHE, 'source', `${id}.mp3`)
  if (existsSync(path)) return path
  mkdirSync(join(CACHE, 'source'), { recursive: true })
  process.stdout.write(`download ${source.name} … `)
  const response = await fetch(source.url)
  if (!response.ok) throw new Error(`${source.url}: HTTP ${response.status}`)
  writeFileSync(path, Buffer.from(await response.arrayBuffer()))
  console.log('ok')
  return path
}

function fieldSource(id, start, duration, volume, filter = '') {
  return {
    path: join(CACHE, 'source', `${id}.mp3`),
    name: SOURCES[id].name,
    page: SOURCES[id].page,
    author: SOURCES[id].author,
    performer: SOURCES[id].author,
    recordingDate: 'n.d.',
    license: SOURCES[id].license,
    start,
    duration,
    volume,
    filter,
    modification: `trimmed to ${duration}s, filtered, looped and mixed`,
  }
}

function generatedSource(name, path, volume) {
  return {
    path,
    name,
    page: null,
    author: 'The Song of the Wanderer project',
    performer: 'Synthesized for the project',
    recordingDate: '2026',
    license: 'cc0',
    start: 0,
    duration: null,
    volume,
    filter: '',
    modification: 'original procedural synthesis, generated for this project',
  }
}

/* --------------------------------------------------------------------------
 * Original synthesis
 * ------------------------------------------------------------------------ */

function seeded(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeBuffer(seconds) {
  return new Float32Array(Math.ceil(seconds * SR))
}

function addInto(target, startSeconds, source, gain = 1) {
  const start = Math.max(0, Math.round(startSeconds * SR))
  const length = Math.min(source.length, target.length - start)
  for (let i = 0; i < length; i += 1) target[start + i] += source[i] * gain
}

function pluck(frequency, seconds, gain, random) {
  const length = Math.max(1, Math.round(seconds * SR))
  const delayLength = Math.max(2, Math.round(SR / frequency))
  const delay = new Float32Array(delayLength)
  for (let i = 0; i < delayLength; i += 1) delay[i] = random() * 2 - 1
  const out = new Float32Array(length)
  for (let i = 0; i < length; i += 1) {
    const index = i % delayLength
    const value = delay[index]
    delay[index] = 0.996 * 0.5 * (delay[index] + delay[(index + 1) % delayLength])
    out[i] = value * gain * Math.exp(-i / (SR * 1.9))
  }
  return out
}

function frameDrum(gain, random, low = 1) {
  const length = Math.round(0.65 * SR)
  const out = new Float32Array(length)
  let filtered = 0
  for (let i = 0; i < length; i += 1) {
    const t = i / SR
    const envelope = Math.exp(-t * 9)
    const body = Math.sin(2 * Math.PI * (72 * low - 18 * t) * t)
    filtered = filtered * 0.92 + (random() * 2 - 1) * 0.08
    out[i] = (body * 0.7 + filtered * 0.6) * envelope * gain
  }
  return out
}

function metalStrike(frequency, gain, seconds = 1.4) {
  const length = Math.round(seconds * SR)
  const out = new Float32Array(length)
  const partials = [1, 2.76, 5.4, 8.93]
  for (let i = 0; i < length; i += 1) {
    const t = i / SR
    let value = 0
    for (let p = 0; p < partials.length; p += 1) {
      value += Math.sin(2 * Math.PI * frequency * partials[p] * t) * Math.exp(-t * (5 + p * 2))
    }
    out[i] = value * gain * Math.exp(-t * 2.4)
  }
  return out
}

function woodenThud(gain) {
  const length = Math.round(0.8 * SR)
  const out = new Float32Array(length)
  let filtered = 0
  for (let i = 0; i < length; i += 1) {
    const t = i / SR
    const envelope = Math.exp(-t * 12)
    filtered = filtered * 0.8 + (Math.sin(2 * Math.PI * 190 * t) * 0.5 + 0.5) * 0.2
    out[i] = (Math.sin(2 * Math.PI * 96 * t) * 0.5 + filtered) * envelope * gain
  }
  return out
}

function waterSplash(gain, random) {
  const length = Math.round(1.5 * SR)
  const out = new Float32Array(length)
  let low = 0
  let band = 0
  for (let i = 0; i < length; i += 1) {
    const t = i / SR
    const noise = random() * 2 - 1
    low = low * 0.95 + noise * 0.05
    band = band * 0.7 + noise * 0.3
    const envelope = Math.min(1, t * 18) * Math.exp(-t * 3.8)
    out[i] = (low * 0.7 + band * 0.4) * envelope * gain
  }
  return out
}

function drone(buffer, seconds, root, gain) {
  for (let i = 0; i < buffer.length; i += 1) {
    const t = i / SR
    const breathe = 0.68 + 0.32 * Math.sin(2 * Math.PI * 0.045 * t + 1.2)
    buffer[i] +=
      (Math.sin(2 * Math.PI * root * t) * 0.55 +
        Math.sin(2 * Math.PI * root * 1.5 * t) * 0.25 +
        Math.sin(2 * Math.PI * root * 2.01 * t) * 0.12) *
      breathe *
      gain
  }
  return buffer
}

function normalize(buffer, peak = 0.86) {
  let high = 0
  for (const sample of buffer) high = Math.max(high, Math.abs(sample))
  if (high === 0) return buffer
  const scale = peak / high
  for (let i = 0; i < buffer.length; i += 1) buffer[i] *= scale
  return buffer
}

function writeWav(path, samples) {
  const data = Buffer.alloc(samples.length * 2)
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    data.writeInt16LE(Math.round(sample * 32767), i * 2)
  }
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(SR, 24)
  header.writeUInt32LE(SR * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  writeFileSync(path, Buffer.concat([header, data]))
}

function modalMusic(seconds, root, title) {
  const buffer = makeBuffer(seconds)
  const random = seeded(title === 'title' ? 1206 : 1230)
  drone(buffer, seconds, root / 2, 0.055)
  const scale = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 2]
  const pattern =
    title === 'title'
      ? [0, 2, 4, 3, 5, 2, 1, 0, 4, 3, 5, 1]
      : [0, 2, 1, 3, 2, 0, 4, 3, 2, 1, 0, 2]
  const step = title === 'title' ? 2.4 : 2.9
  for (let i = 0; i < pattern.length; i += 1) {
    const at = 0.8 + i * step
    if (at > seconds - 1) break
    const ratio = scale[pattern[i] % scale.length]
    addInto(buffer, at, pluck(root * ratio, 2.4, 0.26, random), 1)
    if (i % 3 === 0) addInto(buffer, at, pluck(root * ratio * 1.5, 1.8, 0.1, random), 1)
  }
  const beat = title === 'title' ? 3.6 : 5.2
  for (let at = 0.8; at < seconds - 1; at += beat) {
    addInto(buffer, at, frameDrum(title === 'title' ? 0.16 : 0.1, random), 1)
  }
  return normalize(buffer, 0.74)
}

function templeDrone(seconds) {
  const buffer = makeBuffer(seconds)
  const random = seeded(331)
  drone(buffer, seconds, 73.42, 0.09)
  for (let at = 2; at < seconds - 1; at += 5.2) {
    addInto(buffer, at, metalStrike(392, 0.035, 1.2), 1)
    addInto(buffer, at + 0.18, frameDrum(0.035, random, 0.8), 1)
  }
  return normalize(buffer, 0.55)
}

function loomBed(seconds) {
  const buffer = makeBuffer(seconds)
  const random = seeded(44)
  for (let at = 0.4; at < seconds - 0.5; at += 1.18) {
    addInto(buffer, at, woodenThud(0.12), 1)
    addInto(buffer, at + 0.07, pluck(180, 0.3, 0.05, random), 1)
  }
  return normalize(buffer, 0.5)
}

function seaCreaks(seconds) {
  const buffer = makeBuffer(seconds)
  const random = seeded(77)
  for (const at of [3.2, 12.8, 23.4, 29.5]) {
    if (at >= seconds) continue
    const creak = pluck(56, 1.8, 0.12, random)
    addInto(buffer, at, creak, 1)
    addInto(buffer, at, waterSplash(0.08, random), 1)
  }
  return normalize(buffer, 0.35)
}

function buildGenerated() {
  mkdirSync(GENERATED, { recursive: true })
  const files = {
    'temple-drone.wav': templeDrone(36),
    'loom-bed.wav': loomBed(32),
    'sea-creaks.wav': seaCreaks(34),
    'music-title.wav': modalMusic(36, 220, 'title'),
    'music-temple.wav': modalMusic(40, 146.83, 'temple'),
  }
  for (const [name, samples] of Object.entries(files)) {
    writeWav(join(GENERATED, name), samples)
  }

  const balance = makeBuffer(1.5)
  addInto(balance, 0.05, metalStrike(880, 0.32), 1)
  addInto(balance, 0.52, metalStrike(660, 0.24), 1)
  addInto(balance, 0.52, woodenThud(0.06), 1)
  const hammer = makeBuffer(1.4)
  addInto(hammer, 0.04, metalStrike(310, 0.44, 1.25), 1)
  addInto(hammer, 0.04, waterSplash(0.05, seeded(9)), 1)
  const oar = makeBuffer(2.4)
  addInto(oar, 0.08, waterSplash(0.24, seeded(10)), 1)
  addInto(oar, 0.55, woodenThud(0.12), 1)
  addInto(oar, 0.88, waterSplash(0.12, seeded(11)), 1)
  const gate = makeBuffer(2.6)
  addInto(gate, 0.08, woodenThud(0.34), 1)
  addInto(gate, 0.2, pluck(48, 1.8, 0.16, seeded(12)), 1)
  addInto(gate, 1.25, woodenThud(0.09), 1)
  for (const [name, samples] of Object.entries({ balance, hammer, oar, gate })) {
    writeWav(join(GENERATED, `sfx-${name}.wav`), normalize(samples, 0.84))
  }
}

/* --------------------------------------------------------------------------
 * Mixing
 * ------------------------------------------------------------------------ */

function mixTrack({ file, duration, sources, fade = 1.1, bitrate = '128k' }) {
  const args = ['-hide_banner', '-loglevel', 'error', '-y']
  for (const source of sources) args.push('-i', source.path)
  const chains = sources.map((source, index) => {
    const start = source.start ?? 0
    const filters = [
      `atrim=start=${start}:duration=${duration}`,
      'asetpts=PTS-STARTPTS',
      source.filter,
      `volume=${source.volume}`,
    ].filter(Boolean)
    return `[${index}:a]${filters.join(',')}[a${index}]`
  })
  const inputs = sources.map((_, index) => `[a${index}]`).join('')
  chains.push(
    `${inputs}amix=inputs=${sources.length}:duration=longest:normalize=0,` +
      `alimiter=limit=0.92,loudnorm=I=-24:TP=-3:LRA=11,` +
      `afade=t=in:st=0:d=${fade},` +
      `afade=t=out:st=${(duration - fade).toFixed(2)}:d=${fade}[mix]`,
  )
  args.push(
    '-filter_complex',
    chains.join(';'),
    '-map',
    '[mix]',
    '-t',
    String(duration),
    '-c:a',
    'libmp3lame',
    '-b:a',
    bitrate,
    '-ar',
    '44100',
    '-ac',
    '2',
    join(OUT, file),
  )
  run('ffmpeg', args)
  console.log(`built ${file}`)
}

function originalMusicTrack({ file, wav, duration, fade = 0.35 }) {
  run('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    join(GENERATED, wav),
    '-t',
    String(duration),
    '-af',
    `loudnorm=I=-24:TP=-3:LRA=11,` +
      `afade=t=in:st=0:d=${fade},afade=t=out:st=${(duration - fade).toFixed(2)}:d=${fade}`,
    '-c:a',
    'libmp3lame',
    '-b:a',
    '112k',
    '-ar',
    '44100',
    '-ac',
    '2',
    join(OUT, file),
  ])
  console.log(`built ${file}`)
}

function originalSfx({ file, wav }) {
  run('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    wav,
    '-af',
    'loudnorm=I=-20:TP=-3:LRA=7',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '128k',
    '-ar',
    '44100',
    '-ac',
    '2',
    join(OUT, file),
  ])
  console.log(`built ${file}`)
}

/* --------------------------------------------------------------------------
 * The slice's catalog
 * ------------------------------------------------------------------------ */

function sourcesFor(track) {
  return track.sources.map((source) => ({
    name: source.name,
    url: source.page,
    author: source.author,
    performer: source.performer,
    recordingDate: source.recordingDate,
    license: source.license,
    modification: source.modification,
  }))
}

function manifestEntry(track) {
  return {
    id: track.id,
    kind: track.kind,
    file: track.file,
    title: track.title,
    loop: track.loop,
    volume: track.volume,
    environment: track.environment ?? null,
    layers: track.layers ?? [],
    source: track.sources.map((source) => source.name).join(' + '),
    performer: track.sources.map((source) => source.performer).join(' + '),
    recordingDate: [...new Set(track.sources.map((source) => source.recordingDate))].join(' / '),
    sources: sourcesFor(track),
    license: track.sources.every((source) => source.license === 'cc0') ? 'cc0' : 'mixed',
    use: 'shipped',
    reviewStatus: 'licensed',
    note: track.note,
  }
}

const TRACKS = [
  {
    id: 'audio.ambient.sea',
    kind: 'ambience',
    file: 'sea.mp3',
    title: 'Open water',
    loop: true,
    volume: 0.38,
    environment: 'sea',
    layers: ['waves', 'wind', 'ship-creak'],
    sources: [
      fieldSource(265, 5, 34, 0.8, 'lowpass=f=9000,highpass=f=90'),
      fieldSource(2573, 20, 34, 0.12, 'lowpass=f=4200'),
      generatedSource('Sea creaks', join(GENERATED, 'sea-creaks.wav'), 0.32),
    ],
    note: 'Open water, not a storm; the creak is a wooden hull working, not a modern engine.',
  },
  {
    id: 'audio.ambient.ugarit.harbour',
    kind: 'ambience',
    file: 'ugarit-harbour.mp3',
    title: 'Ugarit harbour',
    loop: true,
    volume: 0.4,
    environment: 'harbour',
    layers: ['gulls', 'water', 'quay-murmur'],
    sources: [
      fieldSource(2573, 18, 34, 0.72, 'highpass=f=80'),
      fieldSource(265, 8, 34, 0.3, 'lowpass=f=7000'),
      fieldSource(2728, 40, 34, 0.1, 'lowpass=f=2200,highpass=f=120'),
    ],
    note: 'Gulls, water at the mole, and a low quay murmur; no port machinery.',
  },
  {
    id: 'audio.ambient.ugarit.market',
    kind: 'ambience',
    file: 'ugarit-market.mp3',
    title: 'Ugarit market',
    loop: true,
    volume: 0.34,
    environment: 'market',
    layers: ['crowd-murmur', 'footsteps', 'distant-harbour'],
    sources: [
      fieldSource(2728, 22, 32, 0.86, 'highpass=f=90,lowpass=f=7000'),
      fieldSource(2573, 35, 32, 0.08, 'lowpass=f=2600'),
    ],
    note: 'A working market murmur with no intelligible modern speech.',
  },
  {
    id: 'audio.ambient.ugarit.temple',
    kind: 'ambience',
    file: 'ugarit-temple.mp3',
    title: 'Ugarit temple',
    loop: true,
    volume: 0.28,
    environment: 'temple',
    layers: ['stone-room', 'wind', 'oil-lamp-hush'],
    sources: [
      fieldSource(265, 18, 36, 0.28, 'lowpass=f=900'),
      generatedSource('Temple drone', join(GENERATED, 'temple-drone.wav'), 0.5),
    ],
    note: 'A cool stone room and a low, breathing hush; no bell, choir or modern reverb.',
  },
  {
    id: 'audio.ambient.ugarit.workshops',
    kind: 'ambience',
    file: 'ugarit-workshops.mp3',
    title: 'Ugarit workshop quarter',
    loop: true,
    volume: 0.34,
    environment: 'workshop',
    layers: ['loom', 'kiln', 'voices'],
    sources: [
      fieldSource(2728, 60, 32, 0.28, 'lowpass=f=2600,highpass=f=120'),
      fieldSource(30, 8, 32, 0.3, 'lowpass=f=1800'),
      generatedSource('Loom bed', join(GENERATED, 'loom-bed.wav'), 0.47),
    ],
    note: 'A warp-weighted loom beat, a kiln, and a low household murmur.',
  },
  {
    id: 'audio.ambient.ugarit.night',
    kind: 'ambience',
    file: 'ugarit-night.mp3',
    title: 'Ugarit after dark',
    loop: true,
    volume: 0.32,
    environment: 'night',
    layers: ['water', 'crickets', 'distant-dogs'],
    sources: [
      fieldSource(265, 24, 34, 0.44, 'lowpass=f=5000'),
      fieldSource(1020, 2, 34, 0.18, 'highpass=f=1200'),
    ],
    note: 'Water against hulls and dry-field crickets; the dogs are left to the written night.',
  },
  {
    id: 'audio.ambient.cyprus.yard',
    kind: 'ambience',
    file: 'cyprus-yard.mp3',
    title: 'The copper yard',
    loop: true,
    volume: 0.35,
    environment: 'harbour',
    layers: ['gulls', 'water', 'yard-murmur'],
    sources: [
      fieldSource(2573, 30, 34, 0.62, 'highpass=f=100'),
      fieldSource(265, 14, 34, 0.3, 'lowpass=f=6500'),
      fieldSource(2728, 95, 34, 0.14, 'lowpass=f=1900,highpass=f=120'),
    ],
    note: 'A smaller, drier harbor: gulls and water, with a low yard of voices.',
  },
  {
    id: 'audio.ambient.cyprus.smithy',
    kind: 'ambience',
    file: 'cyprus-smithy.mp3',
    title: 'The smithy',
    loop: true,
    volume: 0.36,
    environment: 'workshop',
    layers: ['anvil', 'forge', 'bellows'],
    sources: [
      fieldSource(3589, 1, 32, 0.72, 'highpass=f=70'),
      fieldSource(30, 20, 32, 0.32, 'lowpass=f=1500'),
    ],
    note: 'An anvil and a working forge; the anvil is a modern recording of a hammered metal surface, used as material, not as a claim about a Bronze Age workshop.',
  },
  {
    id: 'audio.ambient.cyprus.inn',
    kind: 'ambience',
    file: 'cyprus-inn.mp3',
    title: 'The inn',
    loop: true,
    volume: 0.3,
    environment: 'inn',
    layers: ['hearth', 'low-voices'],
    sources: [
      fieldSource(30, 30, 32, 0.42, 'lowpass=f=1800'),
      fieldSource(2728, 120, 32, 0.18, 'lowpass=f=1800,highpass=f=100'),
    ],
    note: 'A hearth and a low room of voices, deliberately without intelligible speech.',
  },
  {
    id: 'audio.ambient.cyprus.night',
    kind: 'ambience',
    file: 'cyprus-night.mp3',
    title: 'The Cypriot night',
    loop: true,
    volume: 0.32,
    environment: 'night',
    layers: ['sea', 'frogs', 'cistern'],
    sources: [
      fieldSource(265, 30, 34, 0.42, 'lowpass=f=5000'),
      fieldSource(997, 12, 34, 0.16, 'highpass=f=160,lowpass=f=4000'),
    ],
    note: 'The sea is louder than it should be, and frogs keep at the cistern.',
  },
  {
    id: 'audio.music.title',
    kind: 'music',
    file: 'music-title.mp3',
    title: 'The traveler’s theme',
    loop: true,
    volume: 0.22,
    sources: [
      generatedSource(
        'The traveler’s theme',
        join(GENERATED, 'music-title.wav'),
        0.74,
      ),
    ],
    note: 'An original modal sketch for plucked lyre-like strings and frame drum. It is not a surviving melody and makes no reconstruction claim.',
  },
  {
    id: 'audio.music.temple',
    kind: 'music',
    file: 'music-temple.mp3',
    title: 'A hymn practiced',
    loop: true,
    volume: 0.26,
    sources: [
      generatedSource('A hymn practiced', join(GENERATED, 'music-temple.wav'), 0.7),
    ],
    note: 'An original, wordless modal sketch: a singer’s craft without inventing a language or a known hymn.',
  },
  {
    id: 'audio.sfx.balance',
    kind: 'sfx',
    file: 'sfx-balance.mp3',
    title: 'Weighed silver',
    loop: false,
    volume: 0.5,
    sources: [
      generatedSource('Weighed silver', join(GENERATED, 'sfx-balance.wav'), 0.84),
    ],
    note: 'Two small metal strikes for a completed trade. It is a game cue, not a coin.',
  },
  {
    id: 'audio.sfx.hammer',
    kind: 'sfx',
    file: 'sfx-hammer.mp3',
    title: 'Hammer on bronze',
    loop: false,
    volume: 0.46,
    sources: [
      generatedSource('Hammer on bronze', join(GENERATED, 'sfx-hammer.wav'), 0.84),
    ],
    note: 'A single hammered-metal strike for entering the smithy.',
  },
  {
    id: 'audio.sfx.oar',
    kind: 'sfx',
    file: 'sfx-oar.mp3',
    title: 'Oar and water',
    loop: false,
    volume: 0.5,
    sources: [
      generatedSource('Oar and water', join(GENERATED, 'sfx-oar.wav'), 0.84),
    ],
    note: 'Water and a wooden knock for taking passage.',
  },
  {
    id: 'audio.sfx.gate',
    kind: 'sfx',
    file: 'sfx-gate.mp3',
    title: 'The gate',
    loop: false,
    volume: 0.5,
    sources: [
      generatedSource('The gate', join(GENERATED, 'sfx-gate.wav'), 0.84),
    ],
    note: 'A wooden gate and its bar for stepping ashore into a new journey.',
  },
]

async function main() {
  mkdirSync(OUT, { recursive: true })
  mkdirSync(join(ROOT, 'assets', 'audio'), { recursive: true })
  for (const id of Object.keys(SOURCES)) await downloadSource(id)
  buildGenerated()

  const durations = {
    'sea.mp3': 34,
    'ugarit-harbour.mp3': 34,
    'ugarit-market.mp3': 32,
    'ugarit-temple.mp3': 36,
    'ugarit-workshops.mp3': 32,
    'ugarit-night.mp3': 34,
    'cyprus-yard.mp3': 34,
    'cyprus-smithy.mp3': 32,
    'cyprus-inn.mp3': 32,
    'cyprus-night.mp3': 34,
  }
  const mixed = TRACKS.filter((track) => track.kind === 'ambience')
  for (const track of mixed) mixTrack({ ...track, duration: durations[track.file] ?? 34 })
  for (const track of TRACKS.filter((track) => track.kind === 'music')) {
    const isTemple = track.file.includes('temple')
    originalMusicTrack({
      file: track.file,
      wav: isTemple ? 'music-temple.wav' : 'music-title.wav',
      duration: isTemple ? 40 : 36,
    })
  }
  for (const track of TRACKS.filter((track) => track.kind === 'sfx')) {
    originalSfx({ file: track.file, wav: track.sources[0].path })
  }

  writeFileSync(
    MANIFEST,
    `${JSON.stringify(
      {
        version: 1,
        updated: '2026-11-27',
        note: 'Shipped exploratory audio. Field recordings are CC0; music and effects are original synthesis dedicated to CC0. This is atmosphere, not a reconstruction of a surviving melody.',
        assets: TRACKS.map(manifestEntry),
      },
      null,
      2,
    )}\n`,
  )
  console.log(`wrote ${MANIFEST}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
