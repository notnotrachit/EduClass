import { ExternalProvider } from '@ethersproject/providers';

declare global {
  type EthereumEvent = 'accountsChanged' | 'chainChanged' | 'connect' | 'disconnect';
  type EthereumEventCallback = (args: unknown[]) => void;

  interface RequestArguments {
    method: string;
    params?: unknown[];
  }

  interface Ethereum extends ExternalProvider {
    isMetaMask?: boolean;
    request?: (args: RequestArguments) => Promise<unknown>;
    on?: (event: EthereumEvent, callback: EthereumEventCallback) => void;
    removeListener?: (event: EthereumEvent, callback: EthereumEventCallback) => void;
  }

  interface Window {
    ethereum?: Ethereum;
  }
}

export {};