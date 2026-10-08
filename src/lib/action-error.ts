/**
 * Error type for server actions.
 *
 * Lives outside any `"use server"` module on purpose: Next only allows async
 * function exports there, and a class export makes the module report zero
 * exports at build time.
 */
export class ActionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ActionError"
  }
}
