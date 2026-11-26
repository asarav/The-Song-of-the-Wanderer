import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const collections = [
  {
    name: 'skills',
    canonical: path.join(root, '.agents', 'skills'),
    targets: [
      path.join(root, '.claude', 'skills'),
      path.join(root, '.cline', 'skills'),
      path.join(root, '.clinerules', 'skills'),
      path.join(root, '.codex', 'skills'),
      path.join(root, '.cursor', 'skills'),
      path.join(root, '.github', 'skills'),
      path.join(root, '.kilo', 'skills'),
      path.join(root, '.opencode', 'skills'),
    ],
  },
  {
    name: 'agents',
    canonical: path.join(root, '.agents', 'agents'),
    targets: [
      path.join(root, '.claude', 'agents'),
      path.join(root, '.cline', 'agents'),
      path.join(root, '.codex', 'agents'),
      path.join(root, '.cursor', 'agents'),
      path.join(root, '.github', 'agents'),
      path.join(root, '.kilo', 'agents'),
      path.join(root, '.opencode', 'agents'),
    ],
  },
]

const check = process.argv.includes('--check')

function childDirs(dir) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

function filesIn(dir) {
  const result = new Map()
  if (!fs.existsSync(dir)) return result
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      for (const [relative, content] of filesIn(full)) {
        result.set(path.join(entry.name, relative), content)
      }
    } else if (entry.isFile()) {
      result.set(entry.name, fs.readFileSync(full))
    }
  }
  return result
}

function sameBuffer(a, b) {
  return a.length === b.length && Buffer.compare(a, b) === 0
}

const errors = []

for (const collection of collections) {
  if (!fs.existsSync(collection.canonical)) {
    if (check) {
      // A missing canonical directory is not an error until the project uses it.
      continue
    }
    fs.mkdirSync(collection.canonical, { recursive: true })
  }

  const canonicalItems = childDirs(collection.canonical)

  for (const target of collection.targets) {
    if (check) {
      if (!fs.existsSync(target)) {
        errors.push(`${target}: missing`)
        continue
      }
      const targetItems = childDirs(target)
      for (const item of canonicalItems) {
        const source = path.join(collection.canonical, item)
        const destination = path.join(target, item)
        if (!fs.existsSync(destination)) {
          errors.push(`${target}: missing ${collection.name.slice(0, -1)} ${item}`)
          continue
        }
        const sourceFiles = filesIn(source)
        const destinationFiles = filesIn(destination)
        for (const [relative, content] of sourceFiles) {
          const other = destinationFiles.get(relative)
          if (!other || !sameBuffer(content, other)) {
            errors.push(`${target}: ${item}/${relative} differs from canonical`)
          }
        }
        for (const relative of destinationFiles.keys()) {
          if (!sourceFiles.has(relative)) {
            errors.push(`${target}: ${item}/${relative} is not in canonical`)
          }
        }
      }
      for (const item of targetItems) {
        if (!canonicalItems.includes(item)) {
          errors.push(`${target}: extra ${collection.name.slice(0, -1)} ${item} is not in canonical`)
        }
      }
    } else {
      fs.mkdirSync(target, { recursive: true })
      for (const item of canonicalItems) {
        const source = path.join(collection.canonical, item)
        const destination = path.join(target, item)
        fs.rmSync(destination, { recursive: true, force: true })
        fs.cpSync(source, destination, { recursive: true })
      }
      for (const item of childDirs(target)) {
        if (!canonicalItems.includes(item)) {
          fs.rmSync(path.join(target, item), { recursive: true, force: true })
        }
      }
      console.log(`synced ${canonicalItems.length} ${collection.name} to ${target}`)
    }
  }
}

if (check) {
  if (errors.length > 0) {
    console.error('Cross-harness sync check failed:')
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }
  console.log('Cross-harness sync check passed.')
}
