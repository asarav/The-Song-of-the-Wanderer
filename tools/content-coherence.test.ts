/**
 * Content coherence: what an authored scene says happened must be what the state shows.
 *
 * Each case below opens a real slice dialogue, reads the answer the text charges on,
 * takes it, and pins the narration to the money, goods, flags and journal entries the
 * choice actually produced. A line that promises a payment or a handover the effects do
 * not apply fails here.
 */

import { describe, expect, it } from 'vitest'

import { createDslContent, type ContentIndex } from '../src/engine/content'
import { quoteSell } from '../src/engine/economy'
import { reduce, type KernelContext } from '../src/engine/kernel'
import { deriveScene, resolveChoice, startDialogue, type SceneView } from '../src/engine/narrative'
import { RngCursor } from '../src/engine/rng'
import { createInitialState } from '../src/engine/state'
import { loadContent } from './simulate'

interface Setup {
  money?: number
  inventory?: { item: string; quantity: number }[]
  flags?: string[]
  journal?: string[]
}

let cached: ContentIndex | null = null
async function content(): Promise<ContentIndex> {
  cached ??= await loadContent()
  return cached
}

function open(index: ContentIndex, dialogue: string, setup: Setup = {}): KernelContext {
  const state = createInitialState({
    seed: 'content-coherence-001',
    location: 'dest.ugarit',
    money: setup.money ?? 20,
    capacity: 20,
    inventory: setup.inventory ?? [],
    languages: { 'lang.akkadian': { xp: 25, tier: 'basic' } },
    knownDestinations: ['dest.ugarit'],
    knownRoutes: [],
  })
  for (const flag of setup.flags ?? []) state.player.flags[flag] = true
  state.knowledge.journalEntries = [...(setup.journal ?? [])]

  const ctx: KernelContext = {
    state,
    index,
    content: createDslContent(index),
    rng: new RngCursor(state.rng),
    events: [],
  }
  const rejected = startDialogue(ctx, dialogue)
  if (rejected) throw new Error(`could not open ${dialogue}: ${rejected}`)
  return ctx
}

function scene(ctx: KernelContext): SceneView {
  const view = deriveScene(ctx.state, ctx.index, ctx.content)
  if (!view) throw new Error('no scene is open')
  return view
}

function choose(ctx: KernelContext, choice: number): void {
  const reason = resolveChoice(ctx, choice)
  if (reason) throw new Error(`choice ${choice} was rejected: ${reason}`)
}

function count(ctx: KernelContext, item: string): number {
  return ctx.state.player.inventory.find((entry) => entry.item === item)?.quantity ?? 0
}

describe('the harbour gate tax', () => {
  it('charges the three shekels the gate announces, on the answer that declares the oil', async () => {
    const index = await content()
    const ctx = open(index, 'dlg.ugarit.arrival', {
      money: 40,
      inventory: [{ item: 'good.olive-oil', quantity: 2 }],
    })

    const gate = scene(ctx)
    expect(gate.node).toBe('gate')
    expect(gate.choices[0]?.cost).toEqual({ money: 3 })

    choose(ctx, 0)
    expect(ctx.state.player.money).toBe(37)

    const ledger = scene(ctx)
    expect(ledger.node).toBe('ledger')
    expect(ledger.text).toContain('three shekels')
    expect(ledger.text).toContain('counts them')
  })

  it('does not announce a tax when the silent answer takes none', async () => {
    const index = await content()
    const ctx = open(index, 'dlg.ugarit.arrival', {
      money: 40,
      inventory: [{ item: 'good.olive-oil', quantity: 2 }],
    })

    choose(ctx, 1)
    expect(ctx.state.player.money).toBe(40)
    expect(scene(ctx).text).not.toContain('shekels')
  })

  it('is deterministic', async () => {
    const index = await content()
    const run = () => {
      const ctx = open(index, 'dlg.ugarit.arrival', { money: 40 })
      choose(ctx, 0)
      return { money: ctx.state.player.money, text: scene(ctx).text }
    }
    expect(run()).toEqual(run())
  })
})

describe('scenes corrected for cost and possession', () => {
  it('charges the room on the answer that takes it, not on the question about the price', async () => {
    const index = await content()
    const ctx = open(index, 'dlg.cyprus.arrival', { money: 18 })

    choose(ctx, 1)
    expect(scene(ctx).node).toBe('room')
    expect(ctx.state.player.money).toBe(18)

    const room = scene(ctx)
    expect(room.choices[0]?.cost).toEqual({ money: 3, days: 1 })
    expect(room.choices[0]?.text).toBe('Take the room.')
    choose(ctx, 0)
    expect(ctx.state.player.money).toBe(15)
  })

  it('takes the checkpoint fee the settled node says it takes', async () => {
    const index = await content()
    const ctx = open(index, 'dlg.travel.checkpoint', { money: 20 })

    expect(scene(ctx).choices[0]?.cost).toEqual({ money: 6 })
    choose(ctx, 0)
    expect(ctx.state.player.money).toBe(14)
    expect(scene(ctx).text).toContain('takes his fee')
  })

  it('pays the four shekels the wreckage rope is sold for', async () => {
    const index = await content()
    const ctx = open(index, 'dlg.travel.wreckage', { money: 10 })

    choose(ctx, 0)
    expect(ctx.state.player.money).toBe(14)
    expect(scene(ctx).node).toBe('rope')
    expect(scene(ctx).text).toContain('four shekels')
  })

  it('keeps the corrected checkpoint argument to the four shekels it charges', async () => {
    const index = await content()
    const ctx = open(index, 'dlg.travel.checkpoint', { money: 20 })
    ctx.state.player.languages['lang.akkadian'] = { xp: 60, tier: 'conversational' }

    const argued = scene(ctx).choices[3]
    expect(argued?.available).toBe(true)
    expect(argued?.cost).toEqual({ money: 4 })
    choose(ctx, 3)
    expect(ctx.state.player.money).toBe(16)
    expect(scene(ctx).text).toContain('four shekels')
  })

  it('gates the free lesson on having no silver, and charges the paid one', async () => {
    const index = await content()
    const broke = open(index, 'dlg.ugarit.yada.lesson', { money: 2 })
    const brokeScene = scene(broke)
    expect(brokeScene.choices[0]?.available).toBe(false)
    expect(brokeScene.choices[1]?.available).toBe(true)

    const paying = open(index, 'dlg.ugarit.yada.lesson', { money: 10 })
    const payingScene = scene(paying)
    expect(payingScene.choices[0]?.cost).toEqual({ money: 5 })
    expect(payingScene.choices[1]?.available).toBe(false)
    choose(paying, 0)
    expect(paying.state.player.money).toBe(5)
  })

  it('sells the grain for the silver the copper yard names', async () => {
    const index = await content()
    const ctx = open(index, 'dlg.cyprus.copper-offer', {
      money: 10,
      inventory: [{ item: 'good.grain', quantity: 1 }],
    })

    const offer = scene(ctx)
    expect(offer.text).toContain('twenty-four shekels')
    expect(offer.choices[0]?.cost).toEqual({
      items: [{ id: 'good.grain', name: 'Grain', quantity: 1 }],
    })

    choose(ctx, 0)
    expect(ctx.state.player.money).toBe(34)
    expect(count(ctx, 'good.grain')).toBe(0)
    expect(scene(ctx).text).toContain('both richer')

    choose(ctx, 0)
    expect(ctx.state.knowledge.journalEntries).toContain('journal.slice.copper-deal')
    expect(index.journal.get('journal.slice.copper-deal')?.text).not.toContain('ingots')
  })

  it('grants the palace seal only when the pouch is taken, and journals it then', async () => {
    const index = await content()
    const asking = open(index, 'dlg.ugarit.faction-request')

    choose(asking, 0)
    expect(scene(asking).node).toBe('what')
    expect(count(asking, 'good.palace-seal')).toBe(0)
    expect(asking.state.knowledge.journalEntries).not.toContain('journal.slice.faction-request')

    choose(asking, 0)
    expect(count(asking, 'good.palace-seal')).toBe(1)
    expect(asking.state.knowledge.journalEntries).toContain('journal.slice.faction-request')

    const refusing = open(index, 'dlg.ugarit.faction-request')
    choose(refusing, 1)
    expect(count(refusing, 'good.palace-seal')).toBe(0)
    expect(refusing.state.knowledge.journalEntries).not.toContain('journal.slice.faction-request')
  })

  it('records the errand journal at the scene that accepts it, not on the event that offers it', async () => {
    const index = await content()
    const event = index.events.get('evt.ugarit.faction-request')
    expect(event?.effects).toHaveLength(0)
  })

  it('takes Sibtu’s bundle into the hold as cargo when it is taken', async () => {
    const index = await content()
    const ctx = open(index, 'dlg.ugarit.refugee-ask', { money: 5 })

    choose(ctx, 0)
    expect(scene(ctx).node).toBe('thanks')
    choose(ctx, 0)
    expect(ctx.state.player.flags['carries.sibtu-cloth']).toBe(true)
    expect(ctx.state.player.flags['sibtu.cloth-taken']).toBe(true)
    expect(count(ctx, 'good.sibtu-cloth')).toBe(1)
    expect(index.journal.get('journal.slice.refugee-helped')?.text).not.toContain('sold')
  })

  it('adds the same cloth through the amends path', async () => {
    const index = await content()
    const ctx = open(index, 'dlg.ugarit.sibtu.ask', {
      money: 5,
      flags: ['sibtu.met', 'refugee.refused'],
      journal: ['journal.slice.refugee-refused'],
    })

    expect(scene(ctx).node).toBe('after-refusal')
    choose(ctx, 0)
    expect(scene(ctx).node).toBe('amends')
    choose(ctx, 0)
    expect(ctx.state.player.flags['carries.sibtu-cloth']).toBe(true)
    expect(ctx.state.player.flags['sibtu.cloth-taken']).toBe(true)
    expect(count(ctx, 'good.sibtu-cloth')).toBe(1)
  })

  it('reissues the bundle to a save that took it before the item existed', async () => {
    const index = await content()
    const ctx = open(index, 'dlg.ugarit.sibtu.ask', {
      money: 20,
      flags: ['carries.sibtu-cloth'],
      journal: ['journal.slice.refugee-helped'],
    })

    expect(scene(ctx).node).toBe('bundle-missing')
    choose(ctx, 0)
    expect(ctx.state.player.flags['sibtu.cloth-taken']).toBe(true)
    expect(count(ctx, 'good.sibtu-cloth')).toBe(1)
  })

  it('sells the cloth at the yard for the five shekels the return scene takes', async () => {
    const index = await content()
    const ctx = open(index, 'dlg.ugarit.refugee-ask', { money: 5 })
    choose(ctx, 0)
    choose(ctx, 0)

    const ugarit = index.destinations.get('dest.ugarit')
    const entry = ugarit?.market.goods.find((good) => good.item === 'good.sibtu-cloth')
    expect(entry).toEqual({
      item: 'good.sibtu-cloth',
      basePrice: 8,
      stock: 0,
      fixedPrice: 5,
    })

    for (const tier of ['unfamiliar', 'basic', 'conversational', 'fluent', 'deep'] as const) {
      ctx.state.player.languages['lang.akkadian'] = { xp: 0, tier }
      expect(quoteSell(ctx.state, ugarit!, index, 'good.sibtu-cloth', 1).total).toBe(5)
    }

    // A festival raises the market, but not a price the scene has already spoken.
    ctx.state.world.destinationStates['dest.ugarit'] = ['festival']
    expect(quoteSell(ctx.state, ugarit!, index, 'good.sibtu-cloth', 1).total).toBe(5)

    const sale = reduce(ctx.state, { type: 'sell', item: 'good.sibtu-cloth', quantity: 1 }, index)
    expect(sale.rejected).toBeUndefined()
    expect(sale.state.player.money).toBe(10)
    expect(sale.state.player.inventory.some((cargo) => cargo.item === 'good.sibtu-cloth')).toBe(false)
  })

  it('offers the return only once the cloth is out of the hold', async () => {
    const index = await content()
    const carrying = open(index, 'dlg.ugarit.sibtu.ask', {
      money: 10,
      inventory: [{ item: 'good.sibtu-cloth', quantity: 1 }],
      flags: ['carries.sibtu-cloth', 'sibtu.cloth-taken'],
      journal: ['journal.slice.refugee-helped'],
    })
    expect(scene(carrying).node).toBe('after-help')
  })

  it('takes the five shekels back and journals the return when Sibtu is paid', async () => {
    const index = await content()
    const ctx = open(index, 'dlg.ugarit.sibtu.ask', {
      money: 10,
      flags: ['carries.sibtu-cloth', 'sibtu.cloth-taken'],
      journal: ['journal.slice.refugee-helped'],
    })

    const settle = scene(ctx)
    expect(settle.node).toBe('settle')
    expect(settle.choices[0]?.cost).toEqual({ money: 5 })
    choose(ctx, 0)

    expect(ctx.state.player.money).toBe(5)
    expect(ctx.state.player.flags['sibtu.cloth-settled']).toBe(true)
    expect(ctx.state.knowledge.journalEntries).toContain('journal.slice.sibtu-cloth-settled')
    expect(index.journal.get('journal.slice.sibtu-cloth-settled')?.text).toContain('five shekels')

    const settled = scene(ctx)
    expect(settled.node).toBe('settled')
    expect(settled.text).toContain('five shekels')
  })

  it('does not claim cargo the refusal may not have', async () => {
    const index = await content()
    const ctx = open(index, 'dlg.ugarit.refugee-ask', { money: 5, inventory: [] })

    choose(ctx, 2)
    expect(ctx.state.player.flags['refugee.refused']).toBe(true)
    expect(index.journal.get('journal.slice.refugee-refused')?.text).not.toContain('cargo')
  })

  it('does not claim a departure or a free crossing after Tiro’s booking', async () => {
    const index = await content()
    const booked = open(index, 'dlg.ugarit.tiro.passage', {
      money: 20,
      flags: ['met.tiro', 'tiro.passage'],
    })
    const view = scene(booked)
    expect(view.node).toBe('again-booked')
    expect(view.text).toContain('has not gone')
    expect(view.text).not.toContain('the boat went')
    expect(view.choices[0]?.text).toBe('When do we sail?')

    const working = open(index, 'dlg.ugarit.tiro.passage', { money: 20 })
    choose(working, 1)
    expect(scene(working).node).toBe('work')
    expect(scene(working).text).toContain('will not pay your passage')
    choose(working, 0)
    expect(working.state.player.flags['tiro.passage']).toBe(true)
  })

  it('does not claim the gate wrote a name the silent answer never gave', async () => {
    const index = await content()
    const opening = index.journal.get('journal.slice.opening')?.text ?? ''
    expect(opening).not.toContain('wrote my name')
    expect(opening).toContain('wrote something down')
  })
})
