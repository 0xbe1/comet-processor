import { TestProcessorServer } from "@sentio/sdk/lib/test";

describe("Test Processor", () => {
  const service = new TestProcessorServer(() => require("./processor"), {
    1: "https://eth-mainnet.alchemyapi.io/v2/Gk024pFA-64RaEPIawL40n__1esXJFb2",
  });

  beforeAll(async () => {
    await service.start();
  });

  test("has config", async () => {
    const config = await service.getConfig({});
    expect(config.contractConfigs.length > 0);
  });
});
