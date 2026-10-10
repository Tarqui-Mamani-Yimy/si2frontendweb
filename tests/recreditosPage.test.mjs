import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const pagePath = fileURLToPath(new URL('../src/modules/oficial/pages/RecreditosPage.jsx', import.meta.url))

test('RecreditosPage passes header controls through the supported action prop', () => {
  const source = readFileSync(pagePath, 'utf8')
  const header = source.match(/<PageHeader\b([\s\S]*?)\/>/)

  assert.ok(header, 'expected RecreditosPage to render a PageHeader')
  assert.match(header[1], /\baction\s*=/)
  assert.doesNotMatch(header[1], /\bactions\s*=/)
  assert.match(header[1], /Generar Ofertas/)
})
