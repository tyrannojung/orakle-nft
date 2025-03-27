#[allow(duplicate_alias)]
module orakle::nft {
  use std::string::{Self, String};
  use sui::event;
  use sui::url::{Self, Url};
  use sui::object::{Self, UID};
  use sui::transfer;
  use sui::tx_context::{Self, TxContext};
  use sui::table::{Self, Table};
  
  // Display를 위한 import 추가
  use sui::package;
  use sui::display;
  use sui::hex;

  // One-Time-Witness 용 구조체
  public struct NFT has drop {}

  // 관리자 기능을 위한 구조체
  public struct AdminCap has key, store {
      id: UID,
  }

  // 화이트리스트 관리를 위한 구조체
  public struct Whitelist has key {
      id: UID,
      // 주소 -> 이름 매핑
      members: Table<address, String>,
      // 주소 -> 민팅 여부 매핑 (true면 이미 민팅함)
      minted: Table<address, bool>,
      // 몇 번째 NFT인지 추적
      next_number: u64,
  }

  // NFT 구조체 확장
  public struct OrakleNFT has key {
      id: UID,
      number: u64,
      name: String,
      description: String,
      img: Url,
      hexaddr: String, // 추가: 객체 ID의 16진수 표현
  }

  // 이벤트 구조체
  public struct OrakleNFTMinted has copy, drop {
      object_id: address,
      creator: address,
      recipient: address,
      number: u64,
      name: String,
  }

  // 화이트리스트 추가 이벤트
  public struct WhitelistAdded has copy, drop {
      address: address,
      name: String,
  }

  // 모듈 초기화 함수
  fun init(witness: NFT, ctx: &mut TxContext) {
      // Publisher 객체 생성
      let publisher = package::claim(witness, ctx);
      
      // Display 객체 생성
      let keys = vector[
          string::utf8(b"name"),
          string::utf8(b"description"),
          string::utf8(b"image_url"),
          string::utf8(b"link"),
      ];
      
      let values = vector[
          string::utf8(b"Orakle #{number} - {name}"),
          string::utf8(b"{description}"),
          string::utf8(b"{img}"),
          string::utf8(b"http://5r09hziv9lyecnyii9ymy1iwbx3ufxlh08tqvt2lsgnq0hj1m9.localhost:3000/0x{hexaddr}"),
      ];
      
      let mut display = display::new_with_fields<OrakleNFT>(
          &publisher, 
          keys,
          values,
          ctx
      );
      
      // Display 버전 업데이트하여 변경사항 적용
      display.update_version();
      
      // AdminCap 생성 및 발신자에게 전송
      let admin_cap = AdminCap {
          id: object::new(ctx)
      };
      
      // Whitelist 객체 생성
      let whitelist = Whitelist {
          id: object::new(ctx),
          members: table::new(ctx),
          minted: table::new(ctx),
          next_number: 1,
      };
      
      // 객체들을 트랜잭션 발신자에게 전송
      transfer::public_transfer(publisher, ctx.sender());
      transfer::public_transfer(display, ctx.sender());
      transfer::transfer(admin_cap, ctx.sender());
      transfer::share_object(whitelist);
  }

  // 화이트리스트에 사용자 추가 (관리자만 가능)
  public entry fun add_to_whitelist(
      _: &AdminCap,
      whitelist: &mut Whitelist,
      user: address,
      name: String,
      _ctx: &mut TxContext
  ) {
      table::add(&mut whitelist.members, user, name);
      
      // 이벤트 발생
      event::emit(WhitelistAdded {
          address: user,
          name: name,
      });
  }

  // 화이트리스트에서 사용자 제거 (관리자만 가능)
  public entry fun remove_from_whitelist(
      _: &AdminCap,
      whitelist: &mut Whitelist,
      user: address,
      _ctx: &mut TxContext
  ) {
      if (table::contains(&whitelist.members, user)) {
          table::remove(&mut whitelist.members, user);
      };
      if (table::contains(&whitelist.minted, user)) {
          table::remove(&mut whitelist.minted, user);
      };
  }

  // 화이트리스트에 있는지 확인하는 함수
  public fun is_whitelisted(whitelist: &Whitelist, user: address): bool {
      table::contains(&whitelist.members, user)
  }

  // 이미 민팅했는지 확인하는 함수
  public fun has_minted(whitelist: &Whitelist, user: address): bool {
      table::contains(&whitelist.minted, user) && *table::borrow(&whitelist.minted, user)
  }

  // 화이트리스트에 있는 사용자의 이름 가져오기
  public fun get_name(whitelist: &Whitelist, user: address): &String {
      table::borrow(&whitelist.members, user)
  }

  // NFT 민팅 함수 (화이트리스트에 있는 사용자만 가능, 한 번만 민팅 가능)
  public entry fun mint_nft(
      whitelist: &mut Whitelist,
      description: String,
      img_bytes: vector<u8>,
      ctx: &mut TxContext
  ) {
      let sender = tx_context::sender(ctx);
      
      // 화이트리스트 확인
      assert!(is_whitelisted(whitelist, sender), 0);
      
      // 이미 민팅했는지 확인
      assert!(!has_minted(whitelist, sender), 1);
      
      // 사용자 이름 가져오기
      let name = *table::borrow(&whitelist.members, sender);
      
      // 민팅 상태 업데이트
      if (table::contains(&whitelist.minted, sender)) {
          *table::borrow_mut(&mut whitelist.minted, sender) = true;
      } else {
          table::add(&mut whitelist.minted, sender, true);
      };
      
      // NFT 번호 할당 및 증가
      let number = whitelist.next_number;
      whitelist.next_number = whitelist.next_number + 1;
      
      // NFT 생성
      let nft_id = object::new(ctx);
      let hexaddr = hex::encode(nft_id.to_bytes()).to_string();
      
      // NFT 생성
      let nft = OrakleNFT {
          id: nft_id,
          number,
          name,
          description,
          img: url::new_unsafe_from_bytes(img_bytes),
          hexaddr,
      };

      // 이벤트 발생
      event::emit(OrakleNFTMinted {
          object_id: object::uid_to_address(&nft.id),
          creator: sender,
          recipient: sender,
          number,
          name,
      });

      // NFT 전송
      transfer::transfer(nft, sender);
  }

  // 관리자가 직접 민팅하는 함수 (수령인당 한 번만 민팅 가능)
  public entry fun admin_mint(
      _: &AdminCap,
      whitelist: &mut Whitelist,
      recipient: address,
      description: String,
      img_bytes: vector<u8>,
      ctx: &mut TxContext
  ) {
      // 화이트리스트 확인
      assert!(is_whitelisted(whitelist, recipient), 0);
      
      // 이미 민팅했는지 확인
      assert!(!has_minted(whitelist, recipient), 1);
      
      // 사용자 이름 가져오기
      let name = *table::borrow(&whitelist.members, recipient);
      
      // 민팅 상태 업데이트
      if (table::contains(&whitelist.minted, recipient)) {
          *table::borrow_mut(&mut whitelist.minted, recipient) = true;
      } else {
          table::add(&mut whitelist.minted, recipient, true);
      };
      
      // NFT 번호 할당 및 증가
      let number = whitelist.next_number;
      whitelist.next_number = whitelist.next_number + 1;
      
      // NFT 생성
      let nft_id = object::new(ctx);
      let hexaddr = hex::encode(nft_id.to_bytes()).to_string();
      
      // NFT 생성
      let nft = OrakleNFT {
          id: nft_id,
          number,
          name,
          description,
          img: url::new_unsafe_from_bytes(img_bytes),
          hexaddr,
      };

      // 이벤트 발생
      event::emit(OrakleNFTMinted {
          object_id: object::uid_to_address(&nft.id),
          creator: tx_context::sender(ctx),
          recipient,
          number,
          name,
      });

      // NFT 전송
      transfer::transfer(nft, recipient);
  }

  // 기존 접근자 함수들
  public fun number(nft: &OrakleNFT): u64 {
      nft.number
  }

  public fun name(nft: &OrakleNFT): &String {
      &nft.name
  }

  public fun description(nft: &OrakleNFT): &String {
      &nft.description
  }

  public fun img(nft: &OrakleNFT): &Url {
      &nft.img
  }
  
  public fun hexaddr(nft: &OrakleNFT): &String {
      &nft.hexaddr
  }
}