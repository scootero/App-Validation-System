import { workflow, node, trigger, newCredential } from '@n8n/workflow-sdk';

const metaCredential = newCredential('Meta Marketing API - Orro');
const BASE = 'https://graph.facebook.com/v25.0';
const ACT = 'act_979257825150251';
const PAGE = '1237104852815793';
const IG = '17841440875992246';
const BIZ = '1074341285117707';

const start = trigger({
  type: 'n8n-nodes-base.manualTrigger',
  version: 1,
  config: { name: 'Manual Run' },
});

const getMe = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'GET me',
    parameters: {
      method: 'GET',
      url: BASE + '/me?fields=id,name',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      options: {
        response: {
          response: { neverError: true, fullResponse: true, responseFormat: 'json' },
        },
      },
    },
    credentials: { facebookGraphApi: metaCredential },
  },
});

const getPerms = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'GET me permissions',
    parameters: {
      method: 'GET',
      url: BASE + '/me/permissions',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      options: {
        response: {
          response: { neverError: true, fullResponse: true, responseFormat: 'json' },
        },
      },
    },
    credentials: { facebookGraphApi: metaCredential },
  },
});

const getBusinesses = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'GET me businesses',
    parameters: {
      method: 'GET',
      url: BASE + '/me/businesses?fields=id,name,permitted_roles',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      options: {
        response: {
          response: { neverError: true, fullResponse: true, responseFormat: 'json' },
        },
      },
    },
    credentials: { facebookGraphApi: metaCredential },
  },
});

const getAdAccounts = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'GET me adaccounts',
    parameters: {
      method: 'GET',
      url:
        BASE +
        '/me/adaccounts?fields=id,account_id,name,account_status,disable_reason,currency,timezone_name,business{id,name},user_tasks&limit=50',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      options: {
        response: {
          response: { neverError: true, fullResponse: true, responseFormat: 'json' },
        },
      },
    },
    credentials: { facebookGraphApi: metaCredential },
  },
});

const getAct = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'GET ad account',
    parameters: {
      method: 'GET',
      url:
        BASE +
        '/' +
        ACT +
        '?fields=id,account_id,name,account_status,disable_reason,currency,timezone_name,business{id,name},user_tasks,funding_source_details,spend_cap,amount_spent,balance,min_daily_budget,age',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      options: {
        response: {
          response: { neverError: true, fullResponse: true, responseFormat: 'json' },
        },
      },
    },
    credentials: { facebookGraphApi: metaCredential },
  },
});

const getActUsers = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'GET ad account users',
    parameters: {
      method: 'GET',
      url: BASE + '/' + ACT + '/assigned_users?fields=id,name,user_type,tasks&limit=50',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      options: {
        response: {
          response: { neverError: true, fullResponse: true, responseFormat: 'json' },
        },
      },
    },
    credentials: { facebookGraphApi: metaCredential },
  },
});

const getBiz = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'GET business',
    parameters: {
      method: 'GET',
      url: BASE + '/' + BIZ + '?fields=id,name,verification_status,created_time',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      options: {
        response: {
          response: { neverError: true, fullResponse: true, responseFormat: 'json' },
        },
      },
    },
    credentials: { facebookGraphApi: metaCredential },
  },
});

const getBizOwned = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'GET business owned ad accounts',
    parameters: {
      method: 'GET',
      url:
        BASE +
        '/' +
        BIZ +
        '/owned_ad_accounts?fields=id,account_id,name,account_status,disable_reason&limit=25',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      options: {
        response: {
          response: { neverError: true, fullResponse: true, responseFormat: 'json' },
        },
      },
    },
    credentials: { facebookGraphApi: metaCredential },
  },
});

const getPage = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'GET page',
    parameters: {
      method: 'GET',
      url: BASE + '/' + PAGE + '?fields=id,name,is_published,instagram_business_account{id,username}',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      options: {
        response: {
          response: { neverError: true, fullResponse: true, responseFormat: 'json' },
        },
      },
    },
    credentials: { facebookGraphApi: metaCredential },
  },
});

const getPageRoles = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'GET page roles',
    parameters: {
      method: 'GET',
      url: BASE + '/' + PAGE + '/roles?limit=50',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      options: {
        response: {
          response: { neverError: true, fullResponse: true, responseFormat: 'json' },
        },
      },
    },
    credentials: { facebookGraphApi: metaCredential },
  },
});

const getIg = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'GET instagram',
    parameters: {
      method: 'GET',
      url: BASE + '/' + IG + '?fields=id,username,name,account_type',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      options: {
        response: {
          response: { neverError: true, fullResponse: true, responseFormat: 'json' },
        },
      },
    },
    credentials: { facebookGraphApi: metaCredential },
  },
});

const getCampaigns = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.3,
  config: {
    name: 'GET ad account campaigns sample',
    parameters: {
      method: 'GET',
      url: BASE + '/' + ACT + '/campaigns?fields=id,name,status&limit=1',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'facebookGraphApi',
      options: {
        response: {
          response: { neverError: true, fullResponse: true, responseFormat: 'json' },
        },
      },
    },
    credentials: { facebookGraphApi: metaCredential },
  },
});

export default workflow('wf4-meta-readonly-diag', 'WF4 Meta Readonly Diagnosis')
  .add(start)
  .to(getMe)
  .to(getPerms)
  .to(getBusinesses)
  .to(getAdAccounts)
  .to(getAct)
  .to(getActUsers)
  .to(getBiz)
  .to(getBizOwned)
  .to(getPage)
  .to(getPageRoles)
  .to(getIg)
  .to(getCampaigns);
