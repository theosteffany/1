import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { Constants } from '@/types/database.types'

import { ROLE_DEFAULT_SCOPES, SCOPES } from './permissions'

const migrationsDir = resolve(import.meta.dirname, '../../supabase/migrations')
const sql = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => readFileSync(resolve(migrationsDir, f), 'utf8'))
  .join('\n')

describe('permission catalogue', () => {
  it('describes every database permission scope', () => {
    expect(Object.keys(SCOPES).sort()).toEqual([...Constants.public.Enums.permission_scope].sort())
  })

  it('mirrors role_default_permissions in the migration exactly', () => {
    const block = sql.slice(sql.indexOf('insert into public.role_default_permissions'), sql.indexOf('-- notifications'))
    const fromSql: Record<string, string[]> = {}
    for (const [, role, scope] of block.matchAll(/\('(\w+)','([\w.]+)'\)/g)) {
      ;(fromSql[role!] ??= []).push(scope!)
    }
    const fromTs = Object.fromEntries(Object.entries(ROLE_DEFAULT_SCOPES).map(([r, s]) => [r, [...s].sort()]))
    expect(Object.fromEntries(Object.entries(fromSql).map(([r, s]) => [r, s.sort()]))).toEqual(fromTs)
  })

  it('never gives a team coach clinical, check-in or journal access by default', () => {
    for (const scope of ROLE_DEFAULT_SCOPES.team_coach) {
      expect(SCOPES[scope].sensitivity).toBe('standard')
    }
  })
})
