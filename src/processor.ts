import { CometProcessor } from './types/Comet'

CometProcessor.bind({ address: '0xc3d688b66703497daa19211eedff47f25384cdc3', startBlock: 15331586 }).onWithdraw(
  async (event, ctx) => {
    ctx.meter.Counter('Withdraw').add(1)
  }
)
