import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'
import { IpfsEntity } from 'src/ipfs/entities/ipfs.entity';
import { Repository } from 'typeorm';
import { UserAccountEntity } from '../entities/user-account.entity';
import { UserEntity } from '../entities/user.entity';
import { MintedNftEntity } from '../entities/minted-nft.entity';
import { MintNftDto } from '../dto/mint-nft.dto';
import { IPFSHTTPClient } from 'ipfs-http-client';
import { Result } from 'ethers';
import { LazyMintNftDto } from '../dto/lazy-mint-nft.dto';
import { NftEntity } from '../entities/nft.entity';


@Injectable()
export class NftRepository {

  constructor(
    @InjectRepository(UserEntity) private userEntity: Repository<UserEntity>,
    @InjectRepository(UserAccountEntity) private userAccountEntity: Repository<UserAccountEntity>,
    @InjectRepository(MintedNftEntity) private mintedNftEntity: Repository<MintedNftEntity>,
    @InjectRepository(NftEntity) private nftEntity: Repository<NftEntity>,
    @Inject('IPFS') private readonly ipfs: IPFSHTTPClient) { }



  async uploadNft(user_id: number, file: Express.Multer.File) {
    return 'This action adds a new ethTransaction';
  }

  async getAccountBalance(user_id: number) {
    const userAccount = await this.userAccountEntity.findOneBy({
      user_id: user_id
    });
    return userAccount.balance;

  }

  async getAccount(user_id: number) {
    const userAccount = await this.userAccountEntity.findOneBy({
      user_id: user_id
    });
    return userAccount;
  }

  async getAllOwnedTokens(user_id: number) {
    const userNfts = await this.nftEntity.findOne({
      where: {
        owner_id: user_id,
        mintedNftEntity: {

        }
      },
      relations: {
        ipfsEntity: true,
      }
    })
    return userNfts;
  }

  async getOwnedNftByTokenId(token_id: number) {
    const userNfts = await this.mintedNftEntity.findOneBy({
      token_id: token_id
    });
    return userNfts;
  }

  async getAccountAddress(user_id: number) {
    const userAccount = await this.userAccountEntity.findOneBy({
      user_id: user_id
    });
    return userAccount.public_key;

  }

  async getNftCid(user_id: number, token_id: number) {
    const userAccount = await this.userAccountEntity.findOneBy({
      user_id: user_id
    });
    return userAccount.public_key;

  }

  async lazyMintNft(lazyMintNftDto: LazyMintNftDto) {
    this.nftEntity.save([{
      name: lazyMintNftDto.name,
      owner_is: lazyMintNftDto.owner_id,

      created_at: new Date(),
      ipfsEntity: {
        id: lazyMintNftDto.ipfs_id,
      }
    }])
  }

  async insertNft(mintNftDto: MintNftDto, result: Result) {
    await this.mintedNftEntity.save({
      name: mintNftDto.name,
      token_id: result.tokenId,
      price: mintNftDto.price,
      created_at: new Date(),
      user_id: mintNftDto.userId
    });
  }

  async buyNft(user_id: number, tokenId: number) {

  }

}