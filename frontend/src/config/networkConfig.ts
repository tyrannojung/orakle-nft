import { getFullnodeUrl } from "@mysten/sui.js/client";
import {
  TESTNET_ORAKLE_PACKAGE_ID,
  MAINNET_ORAKLE_PACKAGE_ID,
  TESTNET_WHITELIST_ID,
  MAINNET_WHITELIST_ID,
  TESTNET_SITE_OBJECT_ID,
  MAINNET_SITE_OBJECT_ID,
} from "@/constants";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        oraklePackageId: TESTNET_ORAKLE_PACKAGE_ID,
        whitelistId: TESTNET_WHITELIST_ID,
        siteObjectId: TESTNET_SITE_OBJECT_ID,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        oraklePackageId: MAINNET_ORAKLE_PACKAGE_ID,
        whitelistId: MAINNET_WHITELIST_ID,
        siteObjectId: MAINNET_SITE_OBJECT_ID,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
