#!/usr/bin/env node

import { readFileSync } from "node:fs";

const expectedOperationIds = [
  "addRecipient",
  "createAccount",
  "createBatch",
  "createInternalTransfer",
  "getAccount",
  "getAccountBalance",
  "getBatch",
  "getDeposit",
  "getRecipient",
  "getTransaction",
  "getTransfer",
  "listAccounts",
  "listBalances",
  "listBatchItems",
  "listBatchTransfers",
  "listBatches",
  "listDeposits",
  "listRecipients",
  "listTransactions",
  "listTransfers",
  "removeRecipient",
  "updateAccount",
  "updateRecipient",
];

const forbiddenReleasePatterns = [
  /x-release-status/i,
  /^\s+funding_rule_id:/im,
  /^\s+name: funding_rule_id$/im,
];

if (process.argv.length !== 4) {
  console.error("usage: check-release.mjs <generated-openapi.yaml> <release-openapi.yaml>");
  process.exit(2);
}

const generatedPath = process.argv[2];
const releasePath = process.argv[3];
const generated = readFileSync(generatedPath);
const release = readFileSync(releasePath);
const generatedText = generated.toString("utf8");

const operationIds = [...generatedText.matchAll(/^\s*operationId:\s*(\S+)\s*$/gm)]
  .map((match) => match[1])
  .sort();

function difference(left, right) {
  const remaining = new Map();
  for (const value of right) {
    remaining.set(value, (remaining.get(value) ?? 0) + 1);
  }

  return left.filter((value) => {
    const count = remaining.get(value) ?? 0;
    if (count === 0) {
      return true;
    }
    remaining.set(value, count - 1);
    return false;
  });
}

const missingOperationIds = difference(expectedOperationIds, operationIds);
const unexpectedOperationIds = difference(operationIds, expectedOperationIds);

if (missingOperationIds.length > 0 || unexpectedOperationIds.length > 0) {
  console.error("release contract operation IDs do not match V1");
  if (missingOperationIds.length > 0) {
    console.error(`missing: ${missingOperationIds.join(", ")}`);
  }
  if (unexpectedOperationIds.length > 0) {
    console.error(`unexpected: ${unexpectedOperationIds.join(", ")}`);
  }
  process.exit(1);
}

if (forbiddenReleasePatterns.some((pattern) => pattern.test(generatedText))) {
  console.error("release contract contains deferred surface");
  process.exit(1);
}

if (!generated.equals(release)) {
  console.error("release/openapi.yaml is stale; regenerate it from the reviewed source contract");
  console.error(`copy ${generatedPath} to ${releasePath}, then run the build again`);
  process.exit(1);
}
