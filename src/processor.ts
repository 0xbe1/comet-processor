import { CometProcessor } from "./types/Comet";
import { BigNumber } from "ethers";

interface Erc20Token {
  address: string;
  symbol: string;
  decimals: number;
}

const USDC_DECIMALS = 6;

const TOKENS = new Map<string, Erc20Token>([
  [
    "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    {
      address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      symbol: "UNI",
      decimals: 18,
    },
  ],
  [
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    {
      address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      symbol: "WBTC",
      decimals: 8,
    },
  ],
  [
    "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    {
      address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
      symbol: "LINK",
      decimals: 18,
    },
  ],
  [
    "0xc00e94Cb662C3520282E6f5717214004A7f26888",
    {
      address: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
      symbol: "COMP",
      decimals: 18,
    },
  ],
  [
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    {
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      symbol: "WETH",
      decimals: 18,
    },
  ],
]);

CometProcessor.bind({
  address: "0xc3d688b66703497daa19211eedff47f25384cdc3",
  startBlock: 15331586,
})
  .onSupplyCollateral((event, ctx) => {
    let { asset, amount } = event.args;
    let token = TOKENS.get(asset);
    if (token) {
      ctx.meter
        .Counter("Collateral")
        .add(scaleDown(amount, token.decimals), { asset: token.symbol });
    }
  })
  .onWithdrawCollateral((event, ctx) => {
    let { asset, amount } = event.args;
    let token = TOKENS.get(asset);
    if (token) {
      ctx.meter
        .Counter("Collateral")
        .sub(scaleDown(amount, token.decimals), { asset: token.symbol });
    }
  })
  .onBlock(async (_, ctx) => {
    try {
      let borrow = await ctx.contract.totalBorrow();
      ctx.meter.Gauge("Borrowing").record(scaleDown(borrow, USDC_DECIMALS));
    } catch (e) {}
  });

function scaleDown(v: BigNumber, decimals: number): BigNumber {
  const ten = BigNumber.from(10);
  return v.div(ten.pow(decimals));
}
