export function createMockRequestResponse(body = {}) {
  const req = { body };
  const res = {
    json: jasmine.createSpy("json"),
    status: jasmine.createSpy("status").and.returnValue({
      json: jasmine.createSpy("json"),
    }),
  };
  return { req, res };
}
