// #[test_only]
// module orakle::nft_tests {
//     use orakle::nft::{Self, OrakleNFT};
//     use sui::test_scenario as ts;
    
//     const ADMIN: address = @0xA11CE;
//     const USER: address = @0xB0B;
    
//     #[test]
//     fun test_mint_nft() {
//         // 시나리오 변수를 mut로 선언
//         let mut scenario = ts::begin(ADMIN);
        
//         let number = 1u64;
//         let description = b"First NFT for completing the challenge";
//         let img_bytes = b"https://example.com/nft/1.png";
        
//         {
//             // mut 변수를 전달
//             let ctx = ts::ctx(&mut scenario);
//             nft::mint(USER, number, description, img_bytes, ctx);
//         };
        
//         {
//             // mut 변수를 전달
//             ts::next_tx(&mut scenario, USER);
            
//             let nft_val = ts::take_from_address<OrakleNFT>(&scenario, USER);
            
//             let nft_number = nft::number(&nft_val);
//             let nft_desc = nft::description(&nft_val);
            
//             assert!(nft_number == 1, 0);
//             assert!(std::string::length(nft_desc) > 0, 1);
//             let _ = nft::img(&nft_val);
            
//             ts::return_to_address(USER, nft_val);
//         };
        
//         ts::end(scenario);
//     }
    
//     #[test]
//     fun test_transfer_nft() {
//         // 시나리오 변수를 mut로 선언
//         let mut scenario = ts::begin(ADMIN);
        
//         {
//             let ctx = ts::ctx(&mut scenario);
//             nft::mint(ADMIN, 2u64, b"Transferable NFT", b"https://example.com/nft/2.png", ctx);
//         };
        
//         {
//             ts::next_tx(&mut scenario, ADMIN);
            
//             let nft_val = ts::take_from_address<OrakleNFT>(&scenario, ADMIN);
//             let ctx = ts::ctx(&mut scenario);
            
//             nft::transfer(nft_val, USER, ctx);
//         };
        
//         {
//             ts::next_tx(&mut scenario, USER);
            
//             let nft_exists = ts::has_most_recent_for_sender<OrakleNFT>(&scenario);
//             assert!(nft_exists, 3);
            
//             if (nft_exists) {
//                 let nft_val = ts::take_from_address<OrakleNFT>(&scenario, USER);
//                 let nft_number = nft::number(&nft_val);
//                 assert!(nft_number == 2, 4);
                
//                 ts::return_to_address(USER, nft_val);
//             }
//         };
        
//         ts::end(scenario);
//     }
    
//     #[test]
//     fun test_update_description() {
//         // 시나리오 변수를 mut로 선언
//         let mut scenario = ts::begin(ADMIN);
        
//         {
//             let ctx = ts::ctx(&mut scenario);
//             nft::mint(ADMIN, 3u64, b"Original description", b"https://example.com/nft/3.png", ctx);
//         };
        
//         {
//             ts::next_tx(&mut scenario, ADMIN);
            
//             // nft_val을 mut로 선언
//             let mut nft_val = ts::take_from_address<OrakleNFT>(&scenario, ADMIN);
//             let ctx = ts::ctx(&mut scenario);
            
//             let orig_desc_len = std::string::length(nft::description(&nft_val));
            
//             let new_description = b"Updated description after completing more challenges";
//             nft::update_description(&mut nft_val, new_description, ctx);
            
//             let new_desc_len = std::string::length(nft::description(&nft_val));
//             assert!(new_desc_len > orig_desc_len, 5);
            
//             ts::return_to_address(ADMIN, nft_val);
//         };
        
//         ts::end(scenario);
//     }
// }