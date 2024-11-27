import { LocalCherishRepoService } from "./LocalCherishRepoService";
import { RemoteCherishRepoService } from "./RemoteCherishRepoService";
import { MockRemoteCherishRepoService } from "./MockRemoteCherishRepoService";

/**
 * Factory class for creating CherishRepoService services.
 *
 * This class provides a static method to get an appropriate instance
 * of a Cherish repository service based on the specified repository type.
 * It cannot be instantiated.
 */

export class CherishRepoFactory {
  constructor() {
    throw new Error("Cannot instantiate a CherishRepoFactory object.");
  }

  /**
   * Returns an instance of a Cherish repository service based on the given
   * repository type.
   *
   * @param {string} [repoType='local'] - The type of repository service to
   * create. Can be 'local' or 'remote'.
   * @returns {LocalCherishRepoService|MockRemoteCherishRepoService|RemoteCherishRepoService} An instance
   * of the appropriate task repository service.
   * @throws Will throw an error if the repository type is not recognized.
   */
  static get(repoType = "local") {
    if (repoType === "local") {
      return new LocalCherishRepoService();
    } else if (repoType === "mock") {
      return new MockRemoteCherishRepoService();
    } else if (repoType === "remote") {
      return new RemoteCherishRepoService();
    } else {
      throw new Error("Invalid repository type");
    }
  }
}
