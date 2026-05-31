// Mock do Firebase para testes Jest
const mockDatabase = {
  ref: jest.fn(() => mockDatabase),
  on: jest.fn((event, cb) => { cb({ exists: () => true, val: () => mockRealtimeData }); return jest.fn(); }),
  off: jest.fn(),
  once: jest.fn(() => Promise.resolve({ exists: () => true, val: () => mockRealtimeData, forEach: jest.fn() })),
  orderByKey: jest.fn(() => mockDatabase),
  limitToLast: jest.fn(() => mockDatabase),
  set: jest.fn(() => Promise.resolve()),
};

const mockRealtimeData = {
  grossKg: 15.2, netKg: 2.2, percentage: 16.9,
  profile: 'Botijao P13', type: 'gas',
  taraKg: 13, capacityKg: 13, status: 'low',
  timestamp: 1748000000,
};

const mockAuth = {
  signInAnonymously: jest.fn(() => Promise.resolve({ user: { uid: 'test-uid' } })),
  currentUser: { uid: 'test-uid' },
};

const mockMessaging = jest.fn(() => ({
  requestPermission: jest.fn(() => Promise.resolve(1)),
  getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 },
}));
mockMessaging.AuthorizationStatus = { AUTHORIZED: 1, PROVISIONAL: 2 };

module.exports = () => mockDatabase;
module.exports.default = () => mockDatabase;
module.exports.__mockDatabase = mockDatabase;
module.exports.__mockAuth = mockAuth;
module.exports.__mockMessaging = mockMessaging;
