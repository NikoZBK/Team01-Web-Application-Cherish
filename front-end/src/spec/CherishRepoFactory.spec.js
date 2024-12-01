import { CherishRepoFactory } from "../services/CherishRepoFactory.js";
import { IDBCherishRepoService } from "../services/IDBCherishRepoService.js";
import { RemoteCherishRepoService } from "../services/RemoteCherishRepoService.js";
import { LocalCherishRepoService } from "../services/LocalCherishRepoService.js";

describe("CherishRepoFactory", () => {
  it("should return an instance of LocalCherishRepoService when repoType is 'local'", () => {
    const service = CherishRepoFactory.get("local");
    expect(service instanceof LocalCherishRepoService).toBe(true);
  });

  it("should return an instance of IDBCherishRepoService when repoType is 'idb'", () => {
    const service = CherishRepoFactory.get("idb");
    expect(service instanceof IDBCherishRepoService).toBe(true);
  });

  it("should return an instance of RemoteCherishRepoService when repoType is 'remote'", () => {
    const service = CherishRepoFactory.get("remote");
    expect(service instanceof RemoteCherishRepoService).toBe(true);
  });

  it("should throw an error when repoType is invalid", () => {
    expect(() => CherishRepoFactory.get("")).toThrowError(
      "Invalid repository type"
    );
  });

  it("should throw an error when trying to instantiate CherishRepoFactory", () => {
    expect(() => new CherishRepoFactory()).toThrowError(
      "Cannot instantiate a CherishRepoFactory object."
    );
  });
});
