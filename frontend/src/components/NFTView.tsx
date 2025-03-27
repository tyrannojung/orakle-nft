"use client";

import { useEffect, useState } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { Box, Container, Text, Heading, Flex, Card } from "@radix-ui/themes";

interface NFTData {
  id: string;
  number: number;
  name: string;
  description: string;
  img: string;
  hexaddr: string;
}

export function NFTView({ objectId }: { objectId: string }) {
  const [nft, setNFT] = useState<NFTData | null>(null);
  const [loading, setLoading] = useState(true);
  const client = useSuiClient();

  useEffect(() => {
    async function fetchNFT() {
      try {
        const object = await client.getObject({
          id: objectId,
          options: { showContent: true, showType: true },
        });

        if (object.data && object.data.content) {
          const content = object.data.content as any;
          const fields = content.fields;

          setNFT({
            id: objectId,
            number: Number(fields.number),
            name: fields.name,
            description: fields.description,
            img: fields.img,
            hexaddr: fields.hexaddr || "",
          });
        }
      } catch (error) {
        console.error("Error fetching NFT:", error);
      } finally {
        setLoading(false);
      }
    }

    if (objectId) {
      fetchNFT();
    }
  }, [objectId, client]);

  if (loading) {
    return (
      <Container size='2'>
        <Flex
          direction='column'
          align='center'
          justify='center'
          style={{ minHeight: "100vh" }}
        >
          <Text size='5'>로딩 중...</Text>
        </Flex>
      </Container>
    );
  }

  if (!nft) {
    return (
      <Container size='2'>
        <Flex
          direction='column'
          align='center'
          justify='center'
          style={{ minHeight: "100vh" }}
        >
          <Heading mb='4'>해당 ID의 Orakle NFT를 찾을 수 없습니다</Heading>
          <Text>
            <a href='/'>메인 페이지로 돌아가기</a>
          </Text>
        </Flex>
      </Container>
    );
  }

  return (
    <Container size='2'>
      <Flex
        direction='column'
        align='center'
        justify='center'
        style={{ minHeight: "100vh", padding: "2rem" }}
      >
        <Card size='3' style={{ maxWidth: "800px", width: "100%" }}>
          <Flex direction='column' align='center' gap='4'>
            <Heading
              size='7'
              align='center'
              style={{ color: "var(--primary-color)" }}
            >
              축하합니다! 🎉
            </Heading>

            <Text size='4' align='center'>
              Orakle 학회의 3주 챌린지 과정을 성공적으로 완료하셨습니다!
              <br />이 페이지는 귀하의 성취를 기념하는 영구적인 기록입니다.
            </Text>

            <Box
              style={{ width: "100%", textAlign: "center", margin: "1rem 0" }}
            >
              <img
                src={nft.img}
                alt='Orakle NFT'
                style={{
                  maxWidth: "100%",
                  maxHeight: "300px",
                  borderRadius: "8px",
                }}
              />
            </Box>

            <Heading size='6' align='center'>
              Orakle 챌린지 수료 인증서
            </Heading>

            <Flex direction='column' style={{ width: "100%" }} gap='2'>
              <Box
                style={{
                  padding: "1rem",
                  backgroundColor: "rgba(99, 102, 241, 0.1)",
                  borderRadius: "8px",
                }}
              >
                <Flex direction='column' gap='2'>
                  <Flex justify='between'>
                    <Text weight='bold'>NFT ID:</Text>
                    <Text style={{ wordBreak: "break-all" }}>{nft.id}</Text>
                  </Flex>
                  <Flex justify='between'>
                    <Text weight='bold'>번호:</Text>
                    <Text>#{nft.number}</Text>
                  </Flex>
                  <Flex justify='between'>
                    <Text weight='bold'>이름:</Text>
                    <Text>{nft.name}</Text>
                  </Flex>
                  <Flex justify='between'>
                    <Text weight='bold'>설명:</Text>
                    <Text>{nft.description}</Text>
                  </Flex>
                </Flex>
              </Box>

              <Text size='2' align='center' style={{ marginTop: "1rem" }}>
                NFT는 블록체인에 영구적으로 기록되어 귀하의 학회 챌린지 수료를
                증명합니다.
              </Text>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}
