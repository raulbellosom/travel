import test from "node:test";
import assert from "node:assert/strict";
import {
  filterScopesByEnabledModules,
  isScopeAllowedByModules,
} from "../src/utils/moduleAccess.js";

const createIsEnabled = (moduleKeys = []) => {
  const enabled = new Set(moduleKeys);
  return (moduleKey) => enabled.has(moduleKey);
};

test("resources scopes require module.resources", () => {
  assert.equal(
    isScopeAllowedByModules(
      "resources.read",
      createIsEnabled(["module.resources"]),
    ),
    true,
  );
  assert.equal(
    isScopeAllowedByModules(
      "resources.write",
      createIsEnabled(["module.resources"]),
    ),
    true,
  );
  assert.equal(
    isScopeAllowedByModules(
      "resources.read",
      createIsEnabled(["module.leads"]),
    ),
    false,
  );
});

test("reservation scopes pass when at least one booking module is enabled", () => {
  assert.equal(
    isScopeAllowedByModules(
      "reservations.read",
      createIsEnabled(["module.booking.short_term"]),
    ),
    true,
  );
  assert.equal(
    isScopeAllowedByModules(
      "reservations.write",
      createIsEnabled(["module.booking.hourly"]),
    ),
    true,
  );
  assert.equal(
    isScopeAllowedByModules("reservations.read", createIsEnabled([])),
    false,
  );
});

test("filters scopes to enabled-module envelope", () => {
  const filtered = filterScopesByEnabledModules(
    [
      "resources.read",
      "leads.read",
      "reservations.read",
      "payments.read",
      "messaging.read",
    ],
    createIsEnabled(["module.resources", "module.messaging.realtime"]),
  );

  assert.deepEqual(filtered, ["resources.read", "messaging.read"]);
});

