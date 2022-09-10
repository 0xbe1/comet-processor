import { TestProcessorServer } from "@sentio/sdk/lib/test";
import { mockSupplyCollateralLog } from "./types/comet/test-utils";
import { BigNumber } from "ethers";

describe("Test Processor", () => {
  const service = new TestProcessorServer(
    () => require("./processor"),
    {
      1: "https://eth-mainnet.alchemyapi.io/v2/Gk024pFA-64RaEPIawL40n__1esXJFb2",
    }
  );

  beforeAll(async () => {
    await service.start();
  });

  test("has config", async () => {
    const config = await service.getConfig({});
    expect(config.contractConfigs.length > 0);
  });

  test("test block", async () => {
    const blockData = {
      // number: 15331586, //
      number: 15331596,
    }
    await service.testBlock(blockData)
  })

  test("test log", async () => {
    await service.testLog(mockSupplyCollateralLog(
        "0xc3d688b66703497daa19211eedff47f25384cdc3",
        {
          from: "0xeaf6ec5d5b4a9406a2eea7f7cd30a844d2b72f89",
          dst: "0xeaf6ec5d5b4a9406a2eea7f7cd30a844d2b72f89",
          asset: "0xc00e94cb662c3520282e6f5717214004a7f26888",
          amount: BigNumber.from("113308785569963500569")
        }
    ))
  })
});
