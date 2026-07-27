import { workflow, node, trigger } from '@n8n/workflow-sdk';

const ledgerTableRl = {
  __rl: true,
  mode: 'id',
  value: 'Yys4vVmQGk8fTxag',
  cachedResultName: 'WF4 Operation Ledger',
};

const OP_KEY = 'human-lab-wf1-sandbox|sandbox|meta|image-v1';
const ARCHIVED_KEY = 'human-lab-wf1-sandbox|sandbox|meta|image-v1|failed-exec-54';
const LAST_ERROR =
  'exec54: Meta OAuthException code 200 "API access blocked." fbtrace AlDDQr1uZSKx6XygxOyZKxT at Create Campaign PAUSED; no Meta objects created';

const start = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Run' },
});

const lookup = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Ledger Lookup Exec54',
    alwaysOutputData: true,
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: ledgerTableRl,
      matchType: 'allConditions',
      filters: {
        conditions: [
          {
            keyName: 'operationKey',
            condition: 'eq',
            keyValue: OP_KEY,
          },
        ],
      },
      returnAll: true,
    },
  },
});

const updateFailed = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Ledger Archive Failed Exec54',
    parameters: {
      resource: 'row',
      operation: 'update',
      dataTableId: ledgerTableRl,
      matchType: 'allConditions',
      filters: {
        conditions: [
          {
            keyName: 'operationKey',
            condition: 'eq',
            keyValue: OP_KEY,
          },
        ],
      },
      columns: {
        mappingMode: 'defineBelow',
        matchingColumns: ['operationKey'],
        value: {
          operationKey: ARCHIVED_KEY,
          phase: 'failed',
          outcome: 'failed',
          lastError: LAST_ERROR,
          lockOwner: '',
          lockExpiresAt: '',
          resumeFrom: '',
        },
      },
    },
  },
});

const verifyArchived = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Verify Archived Row',
    alwaysOutputData: true,
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: ledgerTableRl,
      matchType: 'allConditions',
      filters: {
        conditions: [
          {
            keyName: 'operationKey',
            condition: 'eq',
            keyValue: ARCHIVED_KEY,
          },
        ],
      },
      returnAll: true,
    },
  },
});

const verifyOriginalGone = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Verify Original Key Free',
    alwaysOutputData: true,
    parameters: {
      resource: 'row',
      operation: 'get',
      dataTableId: ledgerTableRl,
      matchType: 'allConditions',
      filters: {
        conditions: [
          {
            keyName: 'operationKey',
            condition: 'eq',
            keyValue: OP_KEY,
          },
        ],
      },
      returnAll: true,
    },
  },
});

export default workflow('wf4-ledger-reconcile-54', 'WF4 Ledger Reconcile Exec54')
  .add(start)
  .to(lookup)
  .to(updateFailed)
  .to(verifyArchived)
  .to(verifyOriginalGone);
