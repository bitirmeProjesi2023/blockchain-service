import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'
import { IpfsEntity } from 'src/ipfs/entities/ipfs.entity';
import { Repository } from 'typeorm';
import { MintNftDto } from '../dto/mint-nft.dto';
import { IPFSHTTPClient } from 'ipfs-http-client';
import { Result } from 'ethers';
import { LazyMintNftDto, UserLazyMintNftDto } from '../dto/lazy-mint-nft.dto';
import { NftEntity } from '../entities/nft.entity';


@Injectable()
export class NftRepository {

  constructor(
    @InjectRepository(NftEntity) private nftEntityRepository: Repository<NftEntity>,
    @InjectRepository(IpfsEntity) private ipfsEntityRepository: Repository<IpfsEntity>,
    @Inject('IPFS') private readonly ipfs: IPFSHTTPClient) { }

  async getAllOwnedTokens(userId: string) {
    const userNfts = await this.nftEntityRepository.findOne({
      where: {
        owner_id: userId,
      },
      relations: {
        ipfsEntity: true,
      }
    })
    return userNfts;
  }

  async setOwnerId(nft: NftEntity, ownerId: string) {
    nft.owner_id = ownerId;
    try {
      this.nftEntityRepository.save(nft);
    }
    catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }

  async getOwnedNftByTokenId(token_id: string) {
    const userNfts = await this.nftEntityRepository.findOneBy({
      token_id: token_id
    });
    return userNfts;
  }


  async getAllNftsOnSale() {
    try {
      return await this.nftEntityRepository.find({ relations: { ipfsEntity: true }, where: { isOnSale: true } });
    }
    catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }

  }

  async setPrice(nft: NftEntity, newPrice: number) {
    nft.price = newPrice;
    try {
      this.nftEntityRepository.save(nft);
    }
    catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }


  async insertLazyMintNft(lazyMintNftDto: LazyMintNftDto) {
    const nft = new NftEntity();
    nft.owner_id = lazyMintNftDto.ownerId;
    nft.ipfs_id = lazyMintNftDto.ipfsId;
    nft.price = lazyMintNftDto.price;
    nft.created_at = new Date();
    try {
      await this.nftEntityRepository.save(nft);
    }
    catch (err) {
      console.error(err);
    }
  }

  async setMinted(nft: NftEntity, isMinted: boolean) {
    try {
      nft.isMinted = isMinted;
      this.nftEntityRepository.save(nft);
    }
    catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }

  async setTokenId(nft: NftEntity, tokenId: string) {
    try {

    }
    catch (err) {
      console.error(err);
    }
  }

  async insertMintedNft(nft: NftEntity, tokenId: string) {
    try {
      nft.token_id = tokenId;
      this.nftEntityRepository.save(nft);
    }
    catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }

  async save(nft: NftEntity) {
    try {
      this.nftEntityRepository.save(nft)
    }
    catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }



  async getAllNftsOwnedBy(ownerId: string) {
    try{return await this.nftEntityRepository.find({
      where: {
        owner_id: ownerId,
      },
      relations: {
        ipfsEntity: true,
      }
    })}
    catch(err){
      console.error(err);
      throw new InternalServerErrorException();
    }
  }

  async getAllLazyMintedByUserId(userId: string) {
    let nfts: IpfsEntity[] = [];
    nfts = await this.ipfsEntityRepository.find({ where: { creator_id: userId } });

    const result: UserLazyMintNftDto[] = nfts.map(nft => {
      const userLazyMintNftDTO = new UserLazyMintNftDto();
      userLazyMintNftDTO.id = nft.id;
      userLazyMintNftDTO.creator_id = nft.creator_id;
      userLazyMintNftDTO.cid = nft.cid;
      userLazyMintNftDTO.nftName = nft.nft_name;
      userLazyMintNftDTO.created_at = nft.created_at;
      return userLazyMintNftDTO;
    });

    return result;
  }

  async findOneNftById(nftId: string) {
    try {
      return await this.nftEntityRepository.findOne({
        relations: {
          ipfsEntity: true,
        },
        where: {
          nft_id: nftId
        }

      })
    }
    catch (err) {
      console.error(err);
      throw new InternalServerErrorException();
    }
  }

  async setOnSale(nft: NftEntity, isOnSale: boolean) {
    nft.isOnSale = isOnSale;
    try {
      await this.nftEntityRepository.save(nft);
    }
    catch (err) {
      console.error(err);
    }
  }
}