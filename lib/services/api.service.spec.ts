import {
  createServer,
  request as httpRequest,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'http';
import { connect, type AddressInfo } from 'net';
import { afterEach, describe, expect, it } from 'vitest';

import { createApiService, ping } from './api.service';

const listen = (server: Server): Promise<number> =>
  new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve((server.address() as AddressInfo).port);
    });
  });

const close = (server: Server): Promise<void> =>
  new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

const pipeRequest = (
  source: IncomingMessage,
  targetUrl: URL,
  response: ServerResponse
) => {
  const proxyRequest = httpRequest(
    {
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      path: `${targetUrl.pathname}${targetUrl.search}`,
      method: source.method,
      headers: source.headers,
    },
    (proxyResponse) => {
      response.writeHead(
        proxyResponse.statusCode ?? 500,
        proxyResponse.headers
      );
      proxyResponse.pipe(response);
    }
  );

  source.pipe(proxyRequest);
};

describe('api service', () => {
  const env = {
    HTTP_PROXY: process.env.HTTP_PROXY,
    HTTPS_PROXY: process.env.HTTPS_PROXY,
    NO_PROXY: process.env.NO_PROXY,
    http_proxy: process.env.http_proxy,
    https_proxy: process.env.https_proxy,
    no_proxy: process.env.no_proxy,
  };
  const servers: Server[] = [];

  afterEach(async () => {
    process.env.HTTP_PROXY = env.HTTP_PROXY;
    process.env.HTTPS_PROXY = env.HTTPS_PROXY;
    process.env.NO_PROXY = env.NO_PROXY;
    process.env.http_proxy = env.http_proxy;
    process.env.https_proxy = env.https_proxy;
    process.env.no_proxy = env.no_proxy;

    await Promise.all(servers.splice(0).map((server) => close(server)));
  });

  it('uses HTTP_PROXY for API requests', async () => {
    let proxiedRequests = 0;
    const apiServer = createServer((_request, response) => {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ organization: 'acme' }));
    });
    const apiPort = await listen(apiServer);
    servers.push(apiServer);

    const proxyServer = createServer((request, response) => {
      proxiedRequests++;
      pipeRequest(
        request,
        new URL(request.url ?? '', `http://${request.headers.host}`),
        response
      );
    });
    proxyServer.on('connect', (request, socket, head) => {
      proxiedRequests++;
      const [hostname, port] = (request.url ?? '').split(':');
      const targetSocket = connect(Number(port), hostname, () => {
        socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        targetSocket.write(head);
        targetSocket.pipe(socket);
        socket.pipe(targetSocket);
      });
    });
    const proxyPort = await listen(proxyServer);
    servers.push(proxyServer);

    process.env.HTTP_PROXY = `http://127.0.0.1:${proxyPort}`;
    delete process.env.HTTPS_PROXY;
    delete process.env.NO_PROXY;
    delete process.env.http_proxy;
    delete process.env.https_proxy;
    delete process.env.no_proxy;

    createApiService({
      apiKey: 'test',
      apiUrl: `http://127.0.0.1:${apiPort}`,
    });

    await expect(ping()).resolves.toEqual({ organization: 'acme' });
    expect(proxiedRequests).toBe(1);
  });
});
