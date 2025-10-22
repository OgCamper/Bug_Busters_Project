import { expect, test } from 'vitest'
import { createDeck } from '../components/createDeck.js'

test("should create a new deck with the given name", () => {
    expect(createDeck("Biology")).toEqual({ name: "Biology" });
})