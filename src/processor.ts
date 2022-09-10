import { CometContext, CometProcessor } from "./types/Comet";
import { BigNumber } from "ethers";

interface Asset {
  address: string;
  symbol: string;
  decimals: number;
  priceFeed: string;
}

const USDC_DECIMALS = 6;

// priceFeed is fetched from Configurator.getConfiguration(c3d688b66703497daa19211eedff47f25384cdc3)
// TODO: can i call getAssetInfoByAddress to get the initial priceFeed
// NOT IMPLEMENTED: handle Configurator::UpdateAssetPriceFeed
const ASSETS = new Map<string, Asset>([
  [
    "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    {
      address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      symbol: "UNI",
      decimals: 18,
      priceFeed: "0x553303d460EE0afB37EdFf9bE42922D8FF63220e",
    },
  ],
  [
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    {
      address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      symbol: "WBTC",
      decimals: 8,
      priceFeed: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
    },
  ],
  [
    "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    {
      address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
      symbol: "LINK",
      decimals: 18,
      priceFeed: "0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c",
    },
  ],
  [
    "0xc00e94Cb662C3520282E6f5717214004A7f26888",
    {
      address: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
      symbol: "COMP",
      decimals: 18,
      priceFeed: "0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5",
    },
  ],
  [
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    {
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      symbol: "WETH",
      decimals: 18,
      priceFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    },
  ],
]);

CometProcessor.bind({
  address: "0xc3d688b66703497daa19211eedff47f25384cdc3",
  startBlock: 15331586,
})
  .onSupplyCollateral(async (event, ctx) => {
    let { asset, amount } = event.args;
    await onCollateral(ctx, asset, amount, true);
  })
  .onWithdrawCollateral(async (event, ctx) => {
    let { asset, amount } = event.args;
    await onCollateral(ctx, asset, amount, false);
  })
  .onBlock(async (_, ctx) => {
    try {
      let borrow = await ctx.contract.totalBorrow();
      ctx.meter.Gauge("borrowing").record(scaleDown(borrow, USDC_DECIMALS));
    } catch (e) {}
  });

async function onCollateral(
  ctx: CometContext,
  asset: string,
  amount: BigNumber,
  isSupply: boolean
): Promise<void> {
  let token = ASSETS.get(asset);
  if (token) {
    let tag = { asset: token.symbol };
    try {
      let price = scaleDown(
        await ctx.contract.getPrice(token.priceFeed),
        token.decimals
      );
      ctx.meter.Gauge("collateral_price").record(price, tag);
      let collateral = scaleDown(amount, token.decimals);
      let collateralUSD = collateral.mul(price);
      let counterCollateral = ctx.meter.Counter("collateral");
      let counterCollateralUSD = ctx.meter.Counter("collateral_usd");
      if (isSupply) {
        counterCollateral.add(collateral, tag);
        counterCollateralUSD.add(collateralUSD, tag);
      } else {
        counterCollateral.sub(collateral, tag);
        counterCollateralUSD.sub(collateralUSD, tag);
      }
    } catch (e) {}
  }
}

function scaleDown(v: BigNumber, decimals: number): BigNumber {
  const ten = BigNumber.from(10);
  return v.div(ten.pow(decimals));
}
