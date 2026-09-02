import { env } from '../config/env';

// Hand-authored OpenAPI 3.0 description of the API, served by swagger-ui at /api/docs.
const bearerNote =
  'Authentication uses a JWT stored in an httpOnly cookie (`auth_token`), set on register/login. ' +
  'Browsers send it automatically; there is no Authorization header to set.';

const errorResponse = {
  description: 'Error',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
};

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Loyalty Program API',
    version: '1.0.0',
    description:
      'Customers upload purchase receipts; an administrator approves them and the system issues ' +
      'vouchers. ' + bearerNote,
  },
  servers: [{ url: `http://localhost:${env.PORT}`, description: 'Local' }],
  tags: [
    { name: 'Auth' },
    { name: 'Profile' },
    { name: 'Receipts' },
    { name: 'Vouchers' },
    { name: 'Admin' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'auth_token' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string' },
              details: {},
              requestId: { type: 'string' },
            },
            required: ['code', 'message'],
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          fullName: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Receipt: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          orderId: { type: 'string' },
          purchaseDate: { type: 'string', format: 'date' },
          amount: { type: 'string', example: '120.50' },
          currency: { type: 'string', example: 'MYR' },
          status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
          fileName: { type: 'string' },
          fileType: { type: 'string' },
          fileUrl: { type: 'string' },
          reviewNote: { type: 'string', nullable: true },
          reviewedAt: { type: 'string', format: 'date-time', nullable: true },
          submittedAt: { type: 'string', format: 'date-time' },
        },
      },
      Voucher: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', example: 'LP-7K2M...' },
          amount: { type: 'string' },
          currency: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'REDEEMED', 'EXPIRED'] },
          isAvailable: { type: 'boolean' },
          issuedAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          receipt: { type: 'object' },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
  paths: {
    '/api/health': {
      get: {
        tags: ['Auth'],
        summary: 'Health check',
        security: [],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register (email or phone) and start a session',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  password: { type: 'string', minLength: 8 },
                  fullName: { type: 'string' },
                },
                required: ['password'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } },
          '400': errorResponse,
          '409': errorResponse,
          '429': errorResponse,
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with an email or phone identifier',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { identifier: { type: 'string' }, password: { type: 'string' } },
                required: ['identifier', 'password'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } },
          '401': errorResponse,
          '429': errorResponse,
        },
      },
    },
    '/api/auth/logout': {
      post: { tags: ['Auth'], summary: 'Log out (clears the session cookie)', responses: { '204': { description: 'No Content' } } },
    },
    '/api/auth/me': {
      get: { tags: ['Auth'], summary: 'Current user (for session rehydration)', responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } }, '401': errorResponse } },
    },
    '/api/me': {
      get: { tags: ['Profile'], summary: 'Get profile', responses: { '200': { description: 'OK' }, '401': errorResponse } },
      patch: {
        tags: ['Profile'],
        summary: 'Update profile (fullName, email, phone)',
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { fullName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' } } } } } },
        responses: { '200': { description: 'OK' }, '400': errorResponse, '409': errorResponse },
      },
    },
    '/api/me/summary': {
      get: { tags: ['Profile'], summary: 'Dashboard counts (pending, approved, available vouchers)', responses: { '200': { description: 'OK' }, '401': errorResponse } },
    },
    '/api/receipts': {
      post: {
        tags: ['Receipts'],
        summary: 'Submit a receipt (multipart)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  receipt: { type: 'string', format: 'binary' },
                  orderId: { type: 'string' },
                  purchaseDate: { type: 'string', format: 'date' },
                  amount: { type: 'string' },
                },
                required: ['receipt', 'orderId', 'purchaseDate', 'amount'],
              },
            },
          },
        },
        responses: { '201': { description: 'Created' }, '400': errorResponse, '409': errorResponse, '413': errorResponse, '415': errorResponse },
      },
      get: {
        tags: ['Receipts'],
        summary: 'List my receipts',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'OK' }, '401': errorResponse },
      },
    },
    '/api/receipts/{id}': {
      get: { tags: ['Receipts'], summary: 'Get one of my receipts', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'OK' }, '404': errorResponse } },
    },
    '/api/receipts/{id}/file': {
      get: { tags: ['Receipts'], summary: 'Download a receipt file (owner or admin)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Binary file' }, '404': errorResponse } },
    },
    '/api/vouchers': {
      get: { tags: ['Vouchers'], summary: 'List my vouchers', responses: { '200': { description: 'OK' }, '401': errorResponse } },
    },
    '/api/vouchers/{id}': {
      get: { tags: ['Vouchers'], summary: 'Get one of my vouchers', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'OK' }, '404': errorResponse } },
    },
    '/api/admin/summary': {
      get: { tags: ['Admin'], summary: 'Admin dashboard counts', responses: { '200': { description: 'OK' }, '403': errorResponse } },
    },
    '/api/admin/receipts': {
      get: {
        tags: ['Admin'],
        summary: 'List all receipts',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'OK' }, '403': errorResponse },
      },
    },
    '/api/admin/receipts/{id}': {
      get: { tags: ['Admin'], summary: 'Receipt detail with submitter', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'OK' }, '403': errorResponse, '404': errorResponse } },
    },
    '/api/admin/receipts/{id}/approve': {
      post: { tags: ['Admin'], summary: 'Approve a receipt and issue one voucher', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Approved; returns receipt + voucher' }, '403': errorResponse, '404': errorResponse, '409': errorResponse } },
    },
    '/api/admin/receipts/{id}/reject': {
      post: {
        tags: ['Admin'],
        summary: 'Reject a receipt',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } } },
        responses: { '200': { description: 'Rejected' }, '403': errorResponse, '404': errorResponse, '409': errorResponse },
      },
    },
  },
};
