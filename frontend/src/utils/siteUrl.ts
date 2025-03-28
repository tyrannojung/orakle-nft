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

export function hexToBase36(hexStr: string): string {
  if (hexStr.startsWith("0x")) {
    hexStr = hexStr.slice(2);
  }

  // 16진수 문자열을 BigInt로 변환
  const bigIntValue = BigInt("0x" + hexStr);

  return bigIntValue.toString(36);
}

export function getSiteObjectIdBase36(network = NETWORK_IN_USE): string {
  const siteId = getSiteObjectId(network);
  return hexToBase36(siteId);
}
