"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getError = void 0;
const getError = (reasonCode, message) => {
  switch (reasonCode) {
    case error.code:
      return error;
    case p2pUnsupported.code:
      return p2pUnsupported;
    case busy.code:
      return busy;
    default:
      return {
        code: reasonCode,
        message: message ?? 'Unknown error.'
      };
  }
};
exports.getError = getError;
const error = {
  code: 0,
  message: 'Operation failed due to an internal error.'
};
const p2pUnsupported = {
  code: 1,
  message: 'Operation failed because p2p is unsupported on the device.'
};
const busy = {
  code: 2,
  message: 'Operation failed because the framework is busy and unable to service the request.'
};
//# sourceMappingURL=reasonCode.js.map