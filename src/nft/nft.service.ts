import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { MintNftDto } from './dto/mint-nft.dto';
import { Contract } from 'web3-eth-contract';
import { IpfsService } from 'src/ipfs/ipfs.service';
import Web3 from 'web3';
import { NftRepository } from './repo/nft.repository';
import { LazyMintNftDto } from './dto/lazy-mint-nft.dto';
import { NftEntity } from './entities/nft.entity';
import { EthereumService } from 'src/ethereum/ethereum.service';


type Nfts = { nftName: string, nftImageUrl: string, nftPrice: number, nftId: string, isMinted: boolean }

@Injectable()
export class NftService {

  constructor(@Inject('CONTRACT') private readonly contract: Contract,
    @Inject('WEB3') private readonly web3: Web3,
    private readonly nftRepository: NftRepository,
    private readonly ipfsService: IpfsService,
    private readonly ethereumService: EthereumService,
  ) { }

  async getPrice(tokenId: string) {
    let price = 0;
    try {
      price = await this.contract.methods.getPrice(tokenId).call();
    }
    catch (e) {
    }
    return price;
  }

  async putOnSale(nft: NftEntity, newPrice: number) {
    await this.nftRepository.setOnSale(nft, true);
    await this.nftRepository.setPrice(nft, newPrice);
    if (nft.isMinted === true) {
      await this.contract.methods.setPrice(nft.token_id, newPrice).send();
    }

    return newPrice;
  }

  async buy(nftId: string, buyerId: string,) {
    const nft = await this.nftRepository.findOneNftById(nftId);
    const buyerAccount = await this.ethereumService.getAccountBy(buyerId);
    const sellerAccount = await this.ethereumService.getAccountBy(nft.owner_id);
    if (!nft.isMinted) {
      try {
        nft.token_id = await this.contract.methods.mint(`http://127.0.0.1:8080/ipfs/${nft.ipfsEntity.cid}`, nft.ipfsEntity.nft_name, nft.price)
          .call({ from: buyerAccount.address, gas: 4712388 });
        nft.isMinted = true;
      }
      catch (err) {
        console.log(err);
        throw new InternalServerErrorException();
      }
    }
    else {
      await this.contract.methods.buy(nft.token_id).send({ from: buyerAccount.address, gas: 4712388, value: await this.ethereumService.getBalanceWei(buyerAccount.address) });
    }

    try {
      nft.owner_id = buyerId;
      nft.isOnSale = false;
      await this.ethereumService.withdraw(buyerId, nft.price.toString(), sellerAccount.address);
      await this.nftRepository.save(nft);
    }
    catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async lazyMintNft(lazyMintNftDto: LazyMintNftDto) {
    await this.nftRepository.insertLazyMintNft(lazyMintNftDto);
  }

  async findOneById(nftId: string) {
    let nft: NftEntity;
    try {
      nft = await this.nftRepository.findOneNftById(nftId);
    }
    catch (error) {
      console.error(error);
    }

    return nft;
  }

  async mint(imageUrl: string, name: string, price: number, from: string) {
    let transactionHash: any = -1;
    // const gasPrice = await this.web3.eth.getGasPrice();
    // const gasLimit = 21000;
    try {
      transactionHash = await this.contract.methods.mint(imageUrl, name, price)
        .send({ from, gas: 4712388 });
    }
    catch (e) {
      console.log(e.message);
    }
    console.log(transactionHash);
    return transactionHash;
  }



  async getAllNfts() {
    let nfts: Nfts[] = [];
    try {
      let mintedNfts = await this.contract.methods.getAllImageMetadatas().call();
      mintedNfts = mintedNfts.map((nft) => {
        return {
          nftName: mintedNfts.name,
          nftImageUrl: mintedNfts.imageUrl,
          nftPrice: nft.price,
          isMinted: true,
          nftId: 0,
        }
      })
      nfts = nfts.concat(mintedNfts);
    }
    catch (err) {
      console.error(err);
    }

    try {
      const lazyNfts = await this.nftRepository.getAllNftsOnSale();
      let lazyNftsTransformed = lazyNfts.map((nft) => {
        return {
          nftName: nft.ipfsEntity.nft_name,
          nftImageUrl: `http://127.0.0.1:8080/ipfs/${nft.ipfsEntity.cid}`,
          nftPrice: nft.price,
          nftId: nft.nft_id,
          isMinted: false,
        }
      })
      nfts = nfts.concat(lazyNftsTransformed);
    }
    catch (err) {
      console.error(err);
    }
    return nfts;
  }


  async getAllLazyNftsOnSaleOwnedBy(ownerId: string) {
    try {
      const lazyNfts = await this.nftRepository.getAllNftsOwnedBy(ownerId);
      let lazyNftsTransformed = lazyNfts.map((nft) => {
        return {
          nftName: nft.ipfsEntity.nft_name,
          nftImageUrl: `http://127.0.0.1:8080/ipfs/${nft.ipfsEntity.cid}`,
          nftPrice: nft.price,
          nftId: nft.nft_id,
          isMinted: false,
        }
      })
      return lazyNftsTransformed;
    }
    catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }

  async getAllMintedNftsOnSaleOwnedBy(ownedId: string) {
    try {
      let mintedNfts = await this.contract.methods.getAllImageMetadatas().call();
      mintedNfts = mintedNfts.map((nft) => {
        return {
          nftName: mintedNfts.name,
          nftImageUrl: mintedNfts.imageUrl,
          nftPrice: nft.price,
          isMinted: true,
          nftId: 0,
        }
      })
      return mintedNfts;
    }
    catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }

  async getAllNftsOwnedBy(ownerId: string) {
    let nfts: Nfts[] = [];
    nfts = nfts.concat(await this.getAllLazyNftsOnSaleOwnedBy(ownerId));
    nfts = nfts.concat(await this.getAllMintedNftsOnSaleOwnedBy(ownerId));
    return nfts;
  }

  async findOneByNft(nftId: string) {
    const nft = await this.nftRepository.findOneNftById(nftId);
    return nft
  }

  async getUserLazyMintedNfts(userId: string) {
    const nft = await this.nftRepository.getAllLazyMintedByUserId(userId);
    return nft;

  }
}
