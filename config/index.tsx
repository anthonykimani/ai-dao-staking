import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { defineChain, xrplevmTestnet } from '@reown/appkit/networks'


// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

export const xrplEVMMainnet = /*#__PURE__*/ defineChain({
  id: 1440000,
  name: 'XRPL EVM',
  nativeCurrency: {
    name: 'XRP',
    symbol: 'XRP',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.xrplevm.org'] },
  },
  blockExplorers: {
    default: {
      name: 'blockscout',
      url: 'https://explorer.xrplevm.org',
      apiUrl: 'https://explorer.xrplevm.org/api/v2',
    },
  },
  contracts: {
    multicall3: {
      address: '0x82Cc144D7d0AD4B1c27cb41420e82b82Ad6e9B31',
      blockCreated: 492302,
    },
  },
  testnet: false,
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:1440000'
})


if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [xrplevmTestnet, xrplEVMMainnet]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks,
  transports:{
    [xrplEVMMainnet.id]: http('https://rpc.xrplevm.org'),
    [xrplevmTestnet.id]:  http('https://rpc.testnet.xrplevm.org'),
  },
})

export const config = wagmiAdapter.wagmiConfig