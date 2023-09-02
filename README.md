# Rig Typescript SDK

## Overview

Rig provides the tools, modules and infrastructure you need to develop and manage applications on Kubernetes. The Rig Typescript SDK enables access to Rig services from privileged environments (such as servers or cloud) in Typescript.

For more information, visit the [Rig Typescript SDK setup guide](https://docs.rig.dev/sdks/typescript).

## Installation

The Rig Typescript SDK can be installed using npm:

```
npm i @rigdev/sdk
```

## Setup the Client

To setup the client we construct it and pass in the ID of your project

```typescript
import { Client } from '@rigdev/sdk/lib/index.js';

const projectID = 'YOUR_PROJECT_ID';
const client = new Client({
  projectID: projectID
});
client.user.list({}).then((response) => console.log(response));
```

### Host

By default, the SDK will connect to `http://localhost:4747`. To change this, set the `host` field to the constructor:

```typescript
const client = new Client({
  projectID: projectID,
  host: 'my-rig:4747'
});
```

### Credentials

By default, the SDK will use the environment variables `RIG_CLIENT_ID` and `RIG_CLIENT_SECRET` to read the credentials. To explicitly set the credentials, set the `credentials` field in the constructor:

```typescript
const client = new Client({
  projectID: projectID,
  credentials: {
    id: 'your-client-id',
    secret: 'your-client-secret'
  }
});
```

## Documentation

- [Install Rig](https://docs.rig.dev/getting-started)
- [Setup Users](https://docs.rig.dev/users)
- [Deploy Capsules](https://docs.rig.dev/capsules)
