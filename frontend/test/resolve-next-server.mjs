// Lets node's ESM loader resolve the extensionless "next/server" import that
// route handlers use, so a handler can be unit-tested without a Next runtime.
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === "next/server" ? "next/server.js" : specifier, context);
  },
});
