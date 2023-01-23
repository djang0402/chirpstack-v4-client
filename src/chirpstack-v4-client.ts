import { DeviceServiceClient } from '@djang0402/chirpstack-api-grpc-web/api/device_grpc_web_pb';
import {
  ListDevicesRequest,
} from '@djang0402/chirpstack-api-grpc-web/api/device_pb';
import { TenantServiceClient } from '@djang0402/chirpstack-api-grpc-web/api/tenant_grpc_web_pb';
import { ListTenantsRequest } from '@djang0402/chirpstack-api-grpc-web/api/tenant_pb';
import { ApplicationServiceClient } from '@djang0402/chirpstack-api-grpc-web/api/application_grpc_web_pb'
import {
  ListApplicationsRequest,
} from '@djang0402/chirpstack-api-grpc-web/api/application_pb'

import {
  FlushDeviceQueueRequest, 
  EnqueueDeviceQueueItemRequest,
  DeviceQueueItem,
} from '@djang0402/chirpstack-api-grpc-web/api/device_pb';
export interface Downlink {
    devEUI: string;
    confirmed: boolean;
    data: string;
    fCntDown?: number;
    fPort: number;
    id?: string;
    isPending?: boolean;
    object?: string;
  }

export interface Device {
    devEui: string;
    name: string;
  }
  
  export interface Application {
    id: string;
    name: string;
    devices?: Device[];
  }
  
  export interface Tenant {
    id: string;
    name: string;
    applications: Application[];
  }




  export function flushDeviceQueue(domain: string, devEui: string, apiKey: string): Promise<void> {
    const deviceClient = new DeviceServiceClient(domain);
    const flushDeviceQueueReq = new FlushDeviceQueueRequest();
    const metadata = {
      authorization: `Bearer ${apiKey}`,
    };
    flushDeviceQueueReq.setDevEui(devEui);
    return new Promise((resolve, reject) => {
      deviceClient.flushQueue(flushDeviceQueueReq, metadata, (err, resp) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  export function enqueueDownlink(
    domain: string,
    downlink: Downlink,
    apiKey: string
  ): Promise<string> {
    const deviceClient = new DeviceServiceClient(domain);
    const enqueueDeviceQueueItemReq = new EnqueueDeviceQueueItemRequest();
    const metadata = {
      authorization: `Bearer ${apiKey}`,
    };
    const item = new DeviceQueueItem();
    item.setConfirmed(downlink.confirmed);
    item.setFPort(downlink.fPort);
    item.setData(downlink.data);
    item.setDevEui(downlink.devEUI);
    enqueueDeviceQueueItemReq.setQueueItem(item);
    return new Promise((resolve, reject) => {
      deviceClient.enqueue(enqueueDeviceQueueItemReq, metadata, (err, resp) => {
        if (err) {
          return reject(err);
        }
        resolve(resp.getId());
      });
    });
  }

  
  export function requestTenants(domain: string, apiKey: string): Promise<Tenant[]> {
    const tenantServiceClient = new TenantServiceClient(domain);
    const listTenantsReq = new ListTenantsRequest();
    const metadata = {
      authorization: `Bearer ${apiKey}`,
    };
    listTenantsReq.setLimit(1000);
    return new Promise((resolve, reject) => {
      tenantServiceClient.list(listTenantsReq, metadata, (err, resp) => {
        if (err) {
          return reject(err);
        }
        const tenantList = resp.getResultList().map((t) => {
          return {
            id: t.getId(),
            name: t.getName(),
            applications: [],
          };
        });
        resolve(tenantList);
      });
    });
  }
  
  export function requestApplications(
    domain: string,
    tenantId: string,
    apiKey: string
  ): Promise<Application[]> {
    const appClient = new ApplicationServiceClient(domain);
    const listAppsReq = new ListApplicationsRequest();
    const metadata = {
      authorization: `Bearer ${apiKey}`,
    };
    listAppsReq.setLimit(1000);
    listAppsReq.setTenantId(tenantId);
    return new Promise((resolve, reject) => {
      appClient.list(listAppsReq, metadata, (err, resp) => {
        if (err) {
          return reject(err);
        }
        const list = resp.getResultList().map((item) => {
          return {
            id: item.getId(),
            name: item.getName(),
          };
        });
        resolve(list);
      });
    });
  }
  
  export function requestDevicesByApplication(
    domain: string,
    appId: string,
    apiKey: string
  ): Promise<Device[]> {
    const deviceClient = new DeviceServiceClient(domain);
    const listDevicesReq = new ListDevicesRequest();
    const metadata = {
      authorization: `Bearer ${apiKey}`,
    };
    listDevicesReq.setLimit(1000);
    listDevicesReq.setApplicationId(appId);
    return new Promise((resolve, reject) => {
      deviceClient.list(listDevicesReq, metadata, (err, resp) => {
        if (err) {
          return reject(err);
        }
        const deviceList = resp.getResultList().map((item) => {
          return {
            devEui: item.getDevEui(),
            name: item.getName(),
          };
        });
        resolve(deviceList);
      });
    });
  }
