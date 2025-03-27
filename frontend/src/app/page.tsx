"use client";

import {
  ConnectButton,
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransactionBlock,
} from "@mysten/dapp-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import {
  Box,
  Container,
  Flex,
  Text,
  Heading,
  Em,
  Separator,
  Button,
  Link,
} from "@radix-ui/themes";
import { useState, useEffect } from "react";
import { NFTView } from "@/components/NFTView";
import { useNetworkVariable } from "@/config/networkConfig";
import { NETWORK_IN_USE, NFT_IMAGE_URL } from "@/constants";

export default function Home() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();
  const oraklePackageId = useNetworkVariable("oraklePackageId");
  const whitelistId = useNetworkVariable("whitelistId");
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [hasMinted, setHasMinted] = useState(false);
  const [mintedNFTId, setMintedNFTId] = useState("");
  const [nftHexaddr, setNftHexaddr] = useState("");
  const [loading, setLoading] = useState(true);
  const [objectId, setObjectId] = useState("");

  // URL에서 경로 파싱
  useEffect(() => {
    // URL 경로에서 객체 ID 추출
    const path = window.location.pathname.slice(1);
    if (path) {
      setObjectId(path);
    }

    // URL에 해시가 있는지 확인
    const hash = window.location.hash.slice(1);
    if (hash) {
      setMintedNFTId(hash);
    }
  }, []);

  // 사용자가 가진 NFT 찾기 함수
  const findUserNFT = async () => {
    if (!currentAccount) return;

    try {
      // 사용자 보유 NFT 가져오기
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        options: { showContent: true },
        filter: {
          MatchAll: [
            {
              StructType: `${oraklePackageId}::nft::OrakleNFT`,
            },
          ],
        },
      });

      if (ownedObjects.data && ownedObjects.data.length > 0) {
        const nftData = ownedObjects.data[0];
        if (nftData.data && nftData.data.content) {
          const content = nftData.data.content as any;
          const fields = content.fields;

          // NFT ID 설정
          setMintedNFTId(nftData.data.objectId);

          // hexaddr 가져오기
          if (fields && fields.hexaddr) {
            setNftHexaddr(fields.hexaddr);
          }
        }
      }
    } catch (error) {
      console.error("Error finding user's NFT:", error);
    }
  };

  // 사용자가 화이트리스트에 있는지, 이미 민팅했는지 확인
  useEffect(() => {
    async function checkWhitelistStatus() {
      if (!currentAccount) {
        setLoading(false);
        return;
      }

      try {
        // 화이트리스트 객체에서 데이터 확인
        const whitelistObj = await suiClient.getObject({
          id: whitelistId,
          options: { showContent: true },
        });

        if (whitelistObj.data && whitelistObj.data.content) {
          const content = whitelistObj.data.content as any;
          console.log("Whitelist data:", content);

          const members = content.fields?.members;
          const minted = content.fields?.minted;
          console.log("Members:", members);
          console.log("Minted:", minted);

          if (members && members.fields && members.fields.id) {
            // 테이블이 존재하면 해당 테이블에서 사용자 주소에 대한 데이터 확인
            try {
              // 테이블에서 해당 주소에 대한 값을 직접 조회
              const userData = await suiClient.getDynamicFieldObject({
                parentId: members.fields.id.id,
                name: {
                  type: "address",
                  value: currentAccount.address,
                },
              });

              console.log("User whitelist data:", userData);
              // 데이터가 있으면 화이트리스트에 포함된 것
              setIsWhitelisted(
                userData.data !== undefined && userData.data !== null
              );

              // 민팅 정보 확인
              if (minted && minted.fields && minted.fields.id) {
                try {
                  const userMinted = await suiClient.getDynamicFieldObject({
                    parentId: minted.fields.id.id,
                    name: {
                      type: "address",
                      value: currentAccount.address,
                    },
                  });

                  console.log("User minted data:", userMinted);

                  // 데이터가 있고 그 값이 true인 경우 이미 민팅한 것
                  if (
                    userMinted.data &&
                    userMinted.data.content &&
                    typeof userMinted.data.content === "object"
                  ) {
                    const content = userMinted.data.content as any;
                    if (content.fields) {
                      // 여기서 bool 값 확인
                      const hasMintedValue = content.fields.value === true;
                      setHasMinted(hasMintedValue);

                      // 이미 민팅한 경우 NFT 찾기
                      if (hasMintedValue) {
                        await findUserNFT();
                      }
                    } else {
                      setHasMinted(false);
                    }
                  } else {
                    setHasMinted(false);
                  }
                } catch (error) {
                  console.log(
                    "Error fetching minted data (expected if not minted yet):",
                    error
                  );
                  setHasMinted(false);
                }
              }
            } catch (error) {
              console.error("Error fetching user data:", error);
              setIsWhitelisted(false);
              setHasMinted(false);
            }
          }
        }
      } catch (error) {
        console.error("Error checking whitelist status:", error);
      } finally {
        setLoading(false);
      }
    }

    checkWhitelistStatus();
  }, [currentAccount, suiClient, whitelistId, oraklePackageId]);

  // NFT 민팅 함수
  const mintNFT = async () => {
    if (!currentAccount) return;

    try {
      setLoading(true);

      const tx = new TransactionBlock();

      // 민팅 함수 호출
      tx.moveCall({
        target: `${oraklePackageId}::nft::mint_nft`,
        arguments: [
          tx.object(whitelistId),
          tx.pure("Completed the 3-week Orakle Challenge"),
          tx.pure(NFT_IMAGE_URL),
        ],
      });

      signAndExecute(
        {
          transactionBlock: tx,
          options: { showEffects: true, showObjectChanges: true },
        },
        {
          onSuccess: async (result) => {
            // 생성된 NFT ID 찾기
            if (result.effects?.created) {
              const nftObj = result.effects.created.find((item) => {
                if (
                  typeof item.owner === "object" &&
                  "AddressOwner" in item.owner
                ) {
                  return item.owner.AddressOwner === currentAccount.address;
                }
                return false;
              });

              if (nftObj && nftObj.reference) {
                const newNFTId = nftObj.reference.objectId;

                // 추가: NFT 객체에서 hexaddr 필드 가져오기
                try {
                  const nftData = await suiClient.getObject({
                    id: newNFTId,
                    options: { showContent: true },
                  });

                  if (nftData.data && nftData.data.content) {
                    const content = nftData.data.content as any;
                    const fields = content.fields;

                    if (fields && fields.hexaddr) {
                      // hexaddr 저장
                      setNftHexaddr(fields.hexaddr);
                      console.log("NFT hexaddr:", fields.hexaddr);
                    }
                  }
                } catch (error) {
                  console.error("Error fetching NFT data:", error);
                }

                setMintedNFTId(newNFTId);
                window.location.hash = newNFTId;
                setHasMinted(true);
              }
              setLoading(false);
            }
          },
          onError: (error) => {
            console.error("Error minting NFT:", error);
            alert("NFT 민팅 중 오류가 발생했습니다.");
            setLoading(false);
          },
        }
      );
    } catch (error) {
      console.error("Error preparing transaction:", error);
      alert("트랜잭션 준비 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  // 객체 ID가 있으면 NFT 뷰 렌더링
  if (objectId) {
    return <NFTView objectId={objectId} />;
  }

  return (
    <>
      <Flex
        position='sticky'
        px='4'
        py='2'
        justify='between'
        style={{ borderBottom: "1px solid var(--gray-a2)" }}
      >
        <Box>
          <ConnectButton />
        </Box>
      </Flex>

      <Container className='container'>
        <Flex className='content' direction='column'>
          <Text size='6'>Welcome to the</Text>
          <Heading className='title' size='9'>
            <Em>Orakle NFT Project Demo</Em>
          </Heading>
          <Text className='subtitle'>
            This site is dedicated to members who have successfully completed
            the challenge.
            <br />
            Please connect your Sui wallet to mint your Orakle NFT.
            <br />
            You've done an incredible job over the past 3 weeks —
            congratulations!
          </Text>

          <Flex className='description' mt='6'>
            <Text>
              <Em>Orakle</Em> is a blockchain society founded at KAIST, South
              Korea's leading science and technology university. We aim to drive
              the next wave of blockchain innovation through technical research,
              product development, and expert-led seminars. As KAIST's
              blockchain hub, we are committed to building a healthy ecosystem
              and advancing the public adoption of blockchain technology.
            </Text>
          </Flex>

          <Separator my='6' size='4' />

          <Flex direction='column' align='center' gap='2'>
            {loading ? (
              <Text>로딩 중...</Text>
            ) : currentAccount ? (
              mintedNFTId ? (
                <Flex direction='column' align='center' gap='3'>
                  <Text>축하합니다! NFT가 성공적으로 민팅되었습니다!</Text>
                  {nftHexaddr ? (
                    <Link
                      href={`http://5r09hziv9lyecnyii9ymy1iwbx3ufxlh08tqvt2lsgnq0hj1m9.localhost:3000/0x${nftHexaddr}`}
                      target='_blank'
                    >
                      <Button className='button'>
                        나의 Orakle NFT 페이지 보기
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/${mintedNFTId}`}>
                      <Button className='button'>
                        나의 Orakle NFT 페이지 보기
                      </Button>
                    </Link>
                  )}
                </Flex>
              ) : isWhitelisted ? (
                hasMinted ? (
                  <Flex direction='column' align='center' gap='3'>
                    <Text>이미 NFT를 민팅하셨습니다.</Text>
                    <Button
                      onClick={async () => {
                        setLoading(true);
                        await findUserNFT(); // 사용자 NFT 정보 다시 찾기
                        setLoading(false);
                      }}
                      className='button'
                    >
                      내 NFT 정보 가져오기
                    </Button>
                  </Flex>
                ) : (
                  <Button
                    onClick={mintNFT}
                    className='button'
                    disabled={loading}
                  >
                    {loading ? "처리 중..." : "Mint Your Orakle NFT"}
                  </Button>
                )
              ) : (
                <Text>
                  죄송합니다. 화이트리스트에 등록되지 않은 지갑입니다.
                </Text>
              )
            ) : (
              <Text>
                <strong>
                  Please connect your wallet (button on the top left)
                </strong>
              </Text>
            )}
          </Flex>

          <Separator my='6' size='4' />

          <Flex className='features' direction='column'>
            <Heading size='5' mb='4'>
              What&apos;s special about Orakle NFT?
            </Heading>
            <Box>
              <ul>
                <li>
                  <Text>
                    This NFT is <Em>non-transferable</Em>, ensuring authentic
                    membership representation.
                  </Text>
                </li>
                <li>
                  <Text>
                    Developed using <Em>Sui Move</Em> and <Em>Walrus</Em>,
                    leveraging the latest blockchain technology.
                  </Text>
                </li>
                <li>
                  <Text>
                    Each NFT has a <Em>personalized webpage</Em> that shows your
                    achievement.
                  </Text>
                </li>
              </ul>
            </Box>
          </Flex>
        </Flex>
      </Container>
    </>
  );
}
