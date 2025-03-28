import {
  NETWORK_IN_USE,
  TESTNET_SITE_OBJECT_ID,
  MAINNET_SITE_OBJECT_ID,
} from "@/constants";

// 현재 네트워크에 맞는 사이트 객체 ID 가져오기
export function getSiteObjectId(network = NETWORK_IN_USE): string {
  return network === "testnet"
    ? TESTNET_SITE_OBJECT_ID
    : MAINNET_SITE_OBJECT_ID;
}
